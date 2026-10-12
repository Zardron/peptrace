import crypto from 'node:crypto';
import type { Express, NextFunction, Request, RequestHandler, Response } from 'express';
import Stripe from 'stripe';
import { getServiceClient, sessionSecret } from './supabase.js';

export const PAID_PLANS = {
  member: { name: 'PepTrace Member', amountCents: 999, rank: 1 },
  gold: { name: 'PepTrace Gold', amountCents: 3999, rank: 2 },
} as const;
export type PaidPlan = keyof typeof PAID_PLANS;
export const isPaidPlan = (value: unknown): value is PaidPlan =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(PAID_PLANS, value);

const ENTITLED_STATUSES = ['active', 'trialing', 'past_due'];

export interface BillingSettings {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string | null;
  memberPriceId: string | null;
  goldPriceId: string | null;
}

const encryptionKey = (): Buffer => {
  const secret = sessionSecret();
  if (!secret) throw new Error('billing_encryption_key_unavailable');
  return crypto.createHash('sha256').update(`billing-settings:${secret}`).digest();
};

export const encryptSecret = (plain: string): string => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((part) => part.toString('base64')).join('.');
};

export const decryptSecret = (stored: string): string => {
  const [iv, tag, data] = stored.split('.').map((part) => Buffer.from(part, 'base64'));
  if (!iv || !tag || !data) throw new Error('billing_secret_malformed');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
};

export const loadBillingSettingsRow = async () => {
  const { data, error } = await getServiceClient().from('billing_settings')
    .select('publishable_key, secret_key_encrypted, webhook_secret_encrypted, member_price_id, gold_price_id, updated_at')
    .eq('id', true)
    .maybeSingle();
  if (error) throw error;
  return data;
};

// Returns null until a publishable key and secret key have been saved.
export const loadBillingSettings = async (): Promise<BillingSettings | null> => {
  const row = await loadBillingSettingsRow();
  if (!row?.publishable_key || !row.secret_key_encrypted) return null;
  return {
    publishableKey: row.publishable_key,
    secretKey: decryptSecret(row.secret_key_encrypted),
    webhookSecret: row.webhook_secret_encrypted ? decryptSecret(row.webhook_secret_encrypted) : null,
    memberPriceId: row.member_price_id,
    goldPriceId: row.gold_price_id,
  };
};

export const stripeFor = (settings: BillingSettings): Stripe => new Stripe(settings.secretKey);

const STATUS_MAP: Record<string, string> = {
  incomplete: 'incomplete',
  incomplete_expired: 'expired',
  trialing: 'trialing',
  active: 'active',
  past_due: 'past_due',
  unpaid: 'past_due',
  canceled: 'canceled',
  paused: 'paused',
};

const toIso = (seconds: unknown): string | null =>
  typeof seconds === 'number' ? new Date(seconds * 1000).toISOString() : null;

export const syncStripeSubscription = async (subscription: Stripe.Subscription) => {
  const item = subscription.items?.data?.[0] as unknown as Record<string, unknown> | undefined;
  const raw = subscription as unknown as Record<string, unknown>;
  const { data, error } = await getServiceClient().from('subscriptions')
    .update({
      status: STATUS_MAP[subscription.status] ?? 'incomplete',
      current_period_start: toIso(item?.current_period_start ?? raw.current_period_start),
      current_period_end: toIso(item?.current_period_end ?? raw.current_period_end),
      cancel_at_period_end: subscription.cancel_at_period_end === true,
      canceled_at: toIso(subscription.canceled_at),
      last_webhook_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('provider', 'stripe')
    .eq('provider_subscription_id', subscription.id)
    .select('id, user_id, plan, status')
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const currentPlanFor = (rows: Array<{ plan: string; status: string }> | null | undefined): PaidPlan | null => {
  let best: PaidPlan | null = null;
  for (const row of rows ?? []) {
    if (!isPaidPlan(row.plan) || !ENTITLED_STATUSES.includes(row.status)) continue;
    if (!best || PAID_PLANS[row.plan].rank > PAID_PLANS[best].rank) best = row.plan;
  }
  return best;
};

// Reuses one Stripe product per plan, creating it the first time a plan is sold.
const planProductId = async (stripe: Stripe, plan: PaidPlan): Promise<string> => {
  const found = await stripe.products.search({ query: `active:'true' AND metadata['peptrace_plan']:'${plan}'`, limit: 1 });
  if (found.data[0]) return found.data[0].id;
  const created = await stripe.products.create({ name: PAID_PLANS[plan].name, metadata: { peptrace_plan: plan } });
  return created.id;
};

interface CustomerSession {
  userId: string;
  email: string;
}

interface CustomerBillingDeps {
  authenticate: (req: Request) => Promise<CustomerSession | null>;
  requireJson: RequestHandler;
  rateLimit: (req: Request, res: Response, next: NextFunction) => unknown;
  hashSubject: (userId: string) => string;
}

export const registerCustomerBillingRoutes = (app: Express, deps: CustomerBillingDeps): void => {
  const db = () => getServiceClient();

  const SUBSCRIPTION_COLUMNS =
    'id, provider, provider_customer_id, provider_subscription_id, plan, status, current_period_end, cancel_at_period_end, currency, amount_cents, created_at, updated_at';

  const loadRows = async (userId: string) => {
    const { data, error } = await db().from('subscriptions')
      .select(SUBSCRIPTION_COLUMNS)
      .eq('user_id', userId)
      .eq('provider', 'stripe')
      .order('updated_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data ?? [];
  };

  // The highest entitled subscription is the one the user actually has.
  const entitledRow = (rows: Awaited<ReturnType<typeof loadRows>>) => {
    const plan = currentPlanFor(rows);
    return plan ? rows.find((row) => row.plan === plan && ENTITLED_STATUSES.includes(row.status)) ?? null : null;
  };

  const siteOrigin = (req: Request): string => {
    const allowed = (process.env.CORS_ORIGIN ?? '').split(',').map((value) => value.trim()).filter(Boolean);
    const origin = req.headers.origin;
    return typeof origin === 'string' && allowed.includes(origin) ? origin : 'https://peptrace.co';
  };

  app.get('/account/billing', async (req, res) => {
    const session = await deps.authenticate(req);
    if (!session) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    try {
      const rows = await loadRows(session.userId);
      const current = entitledRow(rows);
      const settings = await loadBillingSettings().catch(() => null);

      let invoices: unknown[] = [];
      let paymentMethod: { brand: string; last4: string; expMonth: number; expYear: number } | null = null;
      const customerId = rows.find((row) => row.provider_customer_id)?.provider_customer_id as string | undefined;
      if (settings && customerId) {
        const stripe = stripeFor(settings);
        try {
          const list = await stripe.invoices.list({ customer: customerId, limit: 12 });
          invoices = list.data
            .filter((invoice) => invoice.status !== 'draft')
            .map((invoice) => ({
              id: invoice.id,
              createdAt: toIso(invoice.created),
              description: invoice.lines?.data?.[0]?.description ?? 'PepTrace subscription',
              amountCents: invoice.status === 'paid' ? invoice.amount_paid : invoice.amount_due,
              currency: invoice.currency,
              status: invoice.status,
              receiptUrl: invoice.hosted_invoice_url ?? null,
            }));
        } catch {
          invoices = [];
        }
        if (current?.provider_subscription_id) {
          try {
            const subscription = await stripe.subscriptions.retrieve(current.provider_subscription_id, { expand: ['default_payment_method'] });
            const method = subscription.default_payment_method;
            if (method && typeof method === 'object' && method.card) {
              paymentMethod = {
                brand: method.card.brand,
                last4: method.card.last4,
                expMonth: method.card.exp_month,
                expYear: method.card.exp_year,
              };
            }
          } catch {
            paymentMethod = null;
          }
        }
      }

      res.json({
        plan: current?.plan ?? 'free',
        current,
        invoices,
        paymentMethod,
        providerConfigured: Boolean(settings),
      });
    } catch {
      res.status(500).json({ error: 'Failed to load billing information' });
    }
  });

  const changeCancellation = (cancelAtPeriodEnd: boolean): RequestHandler => async (req, res) => {
    const session = await deps.authenticate(req);
    if (!session) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    try {
      const current = entitledRow(await loadRows(session.userId));
      const settings = await loadBillingSettings();
      if (!current?.provider_subscription_id || !settings) {
        res.status(404).json({ error: 'No active subscription found' });
        return;
      }
      const subscription = await stripeFor(settings).subscriptions.update(current.provider_subscription_id, {
        cancel_at_period_end: cancelAtPeriodEnd,
      });
      await syncStripeSubscription(subscription);
      res.json({ cancelAtPeriodEnd });
    } catch {
      res.status(502).json({ error: 'Could not update your subscription. Please try again.' });
    }
  };
  app.post('/account/billing/cancel', deps.requireJson, deps.rateLimit, changeCancellation(true));
  app.post('/account/billing/resume', deps.requireJson, deps.rateLimit, changeCancellation(false));

  app.post('/account/billing/portal', deps.requireJson, deps.rateLimit, async (req, res) => {
    const session = await deps.authenticate(req);
    if (!session) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    try {
      const rows = await loadRows(session.userId);
      const customerId = rows.find((row) => row.provider_customer_id)?.provider_customer_id as string | undefined;
      const settings = await loadBillingSettings();
      if (!customerId || !settings) {
        res.status(404).json({ error: 'No billing profile found' });
        return;
      }
      const portal = await stripeFor(settings).billingPortal.sessions.create({
        customer: customerId,
        return_url: `${siteOrigin(req)}/account/billing`,
      });
      res.json({ url: portal.url });
    } catch {
      res.status(502).json({ error: 'The payment method portal is not available yet.' });
    }
  });

  app.post('/account/billing/subscribe', deps.requireJson, deps.rateLimit, async (req, res) => {
    const session = await deps.authenticate(req);
    if (!session) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const plan = req.body?.plan;
    if (!isPaidPlan(plan)) {
      res.status(400).json({ error: 'Choose a valid plan' });
      return;
    }
    try {
      const settings = await loadBillingSettings();
      if (!settings) {
        res.status(503).json({ error: 'Payments are not available yet. Please try again later.' });
        return;
      }
      const { data: existing, error: existingError } = await db().from('subscriptions')
        .select('plan, status, provider_customer_id')
        .eq('user_id', session.userId)
        .eq('provider', 'stripe');
      if (existingError) throw existingError;
      const owned = currentPlanFor(existing);
      if (owned && PAID_PLANS[owned].rank >= PAID_PLANS[plan].rank) {
        res.status(409).json({ error: 'Your account already includes this plan' });
        return;
      }

      const stripe = stripeFor(settings);
      let customerId = (existing ?? []).find((row) => row.provider_customer_id)?.provider_customer_id as string | undefined;
      if (!customerId) {
        const customer = await stripe.customers.create({ email: session.email, metadata: { userId: session.userId } });
        customerId = customer.id;
      }

      const configuredPrice = plan === 'member' ? settings.memberPriceId : settings.goldPriceId;
      const item = configuredPrice
        ? { price: configuredPrice }
        : {
          price_data: {
            currency: 'usd',
            product: await planProductId(stripe, plan),
            unit_amount: PAID_PLANS[plan].amountCents,
            recurring: { interval: 'month' as const },
          },
        };
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [item],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.confirmation_secret'],
        metadata: { userId: session.userId, plan },
      });
      const invoice = subscription.latest_invoice as unknown as { confirmation_secret?: { client_secret?: string }; amount_due?: number } | null;
      const clientSecret = invoice?.confirmation_secret?.client_secret;
      if (!clientSecret) throw new Error('stripe_client_secret_missing');

      const { error: insertError } = await db().from('subscriptions').insert({
        user_id: session.userId,
        subject_hash: deps.hashSubject(session.userId),
        provider: 'stripe',
        provider_customer_id: customerId,
        provider_subscription_id: subscription.id,
        plan,
        status: 'incomplete',
        currency: 'usd',
        amount_cents: invoice?.amount_due ?? PAID_PLANS[plan].amountCents,
      });
      if (insertError) throw insertError;

      res.json({ clientSecret, subscriptionId: subscription.id, publishableKey: settings.publishableKey });
    } catch (error) {
      console.error(JSON.stringify({ event: 'billing_subscribe_failed', message: error instanceof Error ? error.message : 'unknown' }));
      res.status(502).json({ error: 'Could not start the payment. Please try again.' });
    }
  });

  app.post('/account/billing/confirm', deps.requireJson, deps.rateLimit, async (req, res) => {
    const session = await deps.authenticate(req);
    if (!session) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const subscriptionId = req.body?.subscriptionId;
    if (typeof subscriptionId !== 'string' || !/^sub_[A-Za-z0-9]+$/.test(subscriptionId)) {
      res.status(400).json({ error: 'Invalid subscription' });
      return;
    }
    try {
      const { data: row } = await db().from('subscriptions')
        .select('id, plan')
        .eq('provider', 'stripe')
        .eq('provider_subscription_id', subscriptionId)
        .eq('user_id', session.userId)
        .maybeSingle();
      const settings = await loadBillingSettings();
      if (!row || !settings) {
        res.status(404).json({ error: 'Subscription not found' });
        return;
      }
      const stripe = stripeFor(settings);
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const synced = await syncStripeSubscription(subscription);
      if (!synced || !ENTITLED_STATUSES.includes(synced.status)) {
        res.status(402).json({ error: 'The payment has not completed yet' });
        return;
      }

      // An upgrade replaces any lower paid plan the user still has.
      const { data: others } = await db().from('subscriptions')
        .select('provider_subscription_id, plan, status')
        .eq('user_id', session.userId)
        .eq('provider', 'stripe')
        .neq('provider_subscription_id', subscriptionId)
        .in('status', ENTITLED_STATUSES);
      for (const other of others ?? []) {
        if (!isPaidPlan(other.plan) || !isPaidPlan(synced.plan)) continue;
        if (PAID_PLANS[other.plan].rank >= PAID_PLANS[synced.plan].rank || !other.provider_subscription_id) continue;
        await stripe.subscriptions.cancel(other.provider_subscription_id);
        await db().from('subscriptions')
          .update({ status: 'canceled', canceled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('provider', 'stripe')
          .eq('provider_subscription_id', other.provider_subscription_id);
      }
      res.json({ plan: synced.plan, status: synced.status });
    } catch (error) {
      console.error(JSON.stringify({ event: 'billing_confirm_failed', message: error instanceof Error ? error.message : 'unknown' }));
      res.status(502).json({ error: 'Could not confirm the payment. Please contact support if you were charged.' });
    }
  });
};

export const handleStripeWebhook: RequestHandler = async (req, res) => {
  try {
    const settings = await loadBillingSettings();
    const signature = req.headers['stripe-signature'];
    if (!settings?.webhookSecret || typeof signature !== 'string' || !Buffer.isBuffer(req.body)) {
      res.status(400).json({ error: 'Webhook is not configured' });
      return;
    }
    let event: Stripe.Event;
    try {
      event = stripeFor(settings).webhooks.constructEvent(req.body, signature, settings.webhookSecret);
    } catch {
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    const db = getServiceClient();
    const { data: seen } = await db.from('billing_webhook_events')
      .select('id, status, attempts')
      .eq('provider', 'stripe')
      .eq('provider_event_id', event.id)
      .maybeSingle();
    if (seen && (seen.status === 'processed' || seen.status === 'ignored')) {
      res.json({ received: true });
      return;
    }
    let eventRowId = seen?.id as string | undefined;
    if (!eventRowId) {
      const { data: inserted, error: insertError } = await db.from('billing_webhook_events').insert({
        provider: 'stripe',
        provider_event_id: event.id,
        event_type: event.type,
        payload_hash: crypto.createHash('sha256').update(req.body).digest('hex'),
        status: 'processing',
        attempts: 1,
      }).select('id').single();
      if (insertError || !inserted) throw insertError ?? new Error('webhook_event_insert_failed');
      eventRowId = inserted.id;
    } else {
      await db.from('billing_webhook_events')
        .update({ status: 'processing', attempts: (seen?.attempts ?? 0) + 1, updated_at: new Date().toISOString() })
        .eq('id', eventRowId);
    }

    let outcome: 'processed' | 'ignored' = 'ignored';
    try {
      if (event.type.startsWith('customer.subscription.')) {
        await syncStripeSubscription(event.data.object as Stripe.Subscription);
        outcome = 'processed';
      }
      await db.from('billing_webhook_events')
        .update({ status: outcome, processed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', eventRowId);
    } catch (error) {
      await db.from('billing_webhook_events')
        .update({ status: 'failed', error_code: 'sync_failed', updated_at: new Date().toISOString() })
        .eq('id', eventRowId);
      throw error;
    }
    res.json({ received: true });
  } catch {
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};
