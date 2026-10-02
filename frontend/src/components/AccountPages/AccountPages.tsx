import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../lib/api'
import AddressModal, { type ShippingAddress } from './AddressModal'
import './AccountPages.css'
import alertTriangle from '../../assets/account/alert-triangle.svg'
import eyeOff from '../../assets/account/eye-off.svg'
import moreAction from '../../assets/account/more-action.png'
import plusIcon from '../../assets/account/plus.svg'
import profilePhoto from '../../assets/account/profile-photo.png'
import settingsIcon from '../../assets/account/settings.svg'
import toggleOff from '../../assets/account/toggle-off.svg'
import toggleOn from '../../assets/account/toggle-on.svg'
import SiteFooter from '../SiteFooter/SiteFooter'

export type AccountView =
  | 'dashboard'
  | 'profile'
  | 'security'
  | 'notifications'
  | 'billing'
  | 'shipping'
  | 'privacy'

interface AccountPagesProps {
  view: AccountView
}

const settingsNav: Array<{ id: Exclude<AccountView, 'dashboard'>; label: string; href: string }> = [
  { id: 'profile', label: 'Profile Information', href: '/account' },
  { id: 'security', label: 'Security & Password', href: '/account/security' },
  { id: 'notifications', label: 'Notification Preferences', href: '/account/notifications' },
  { id: 'billing', label: 'Membership & Billing', href: '/account/billing' },
  { id: 'shipping', label: 'Shipping Addresses', href: '/account/shipping' },
  { id: 'privacy', label: 'Data & Privacy', href: '/account/privacy' },
]

function StatusPill({ children, tone = 'success' }: { children: ReactNode; tone?: 'success' | 'warning' | 'info' | 'danger' }) {
  return <span className={`account-status ${tone}`}>{children}</span>
}

function AccountTable({ columns, rows, className = '' }: { columns: string[]; rows: ReactNode[][]; className?: string }) {
  return (
    <div className={`account-table ${className}`}>
      <div className="account-table-row account-table-head">
        {columns.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>
      {rows.map((row, index) => (
        <div className="account-table-row" key={index}>
          {row.map((cell, cellIndex) => (
            <span key={cellIndex}>{cell}</span>
          ))}
        </div>
      ))}
    </div>
  )
}

function AccountContentHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="account-content-header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <img src={moreAction} alt="" className="account-more-action" />
    </div>
  )
}

interface DashboardShipment {
  id: string
  tracking_id: string
  status: string
  created_at: string
  peptide_names: string[]
  vendor_name: string
}

interface DashboardStats {
  totalSamples: number
  avgBatchPurity: number | null
  activeAnalysis: number
}

interface DashboardResult {
  id: string
  peptide_names: string[]
  batch_code: string | null
  purity: number | null
  outcome: string | null
  tested_at: string | null
}

interface DashboardSupply {
  id: string
  peptide_name: string
  quantity_mg: number | null
  vendor_name: string
  purity: number | null
  status: 'verified' | 'pending' | 'failed' | 'reorder'
}

const SUPPLY_STATUS_DISPLAY: Record<string, { label: string; tone: 'success' | 'warning' | 'danger' }> = {
  verified: { label: 'Verified', tone: 'success' },
  pending: { label: 'Pending Test', tone: 'warning' },
  failed: { label: 'Failed', tone: 'danger' },
  reorder: { label: 'Reorder', tone: 'warning' },
}

const SHIPMENT_STATUS_DISPLAY: Record<string, { label: string; tone: 'success' | 'warning' | 'info' }> = {
  submitted: { label: 'Submitted', tone: 'info' },
  in_transit: { label: 'In Transit', tone: 'info' },
  testing: { label: 'Testing', tone: 'warning' },
  delivered: { label: 'Delivered', tone: 'success' },
}

const formatShipmentDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })

function DashboardPage() {
  const { user } = useAuth()
  const memberSince = user?.memberSince
    ? new Date(user.memberSince).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })
    : null
  const [shipments, setShipments] = useState<DashboardShipment[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentResults, setRecentResults] = useState<DashboardResult[]>([])
  const [supplies, setSupplies] = useState<DashboardSupply[]>([])

  useEffect(() => {
    let cancelled = false
    apiFetch('/account/dashboard')
      .then((data) => {
        if (!cancelled) {
          setShipments(data.shipments)
          setStats(data.stats)
          setRecentResults(data.recentResults ?? [])
          setSupplies(data.supplies ?? [])
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const resultRows = recentResults.map((result) => [
    result.peptide_names.join(', '),
    result.batch_code ?? '—',
    result.purity != null ? (
      <strong key="purity" className={result.purity >= 95 ? 'metric-good' : 'metric-warn'}>
        {result.purity.toFixed(1)}%
      </strong>
    ) : (
      '—'
    ),
    result.tested_at ? formatShipmentDate(result.tested_at) : '—',
    <StatusPill key="status" tone={result.outcome === 'pass' ? 'success' : 'warning'}>
      {result.outcome === 'pass' ? 'PASS' : 'FAIL'}
    </StatusPill>,
  ])

  const supplyRows = supplies.map((supply) => {
    const status = SUPPLY_STATUS_DISPLAY[supply.status] ?? SUPPLY_STATUS_DISPLAY.pending
    return [
      supply.peptide_name,
      supply.quantity_mg != null ? `${supply.quantity_mg}mg` : '—',
      supply.vendor_name || '—',
      supply.purity != null ? (
        <strong key="purity" className={supply.purity >= 95 ? 'metric-good' : 'metric-warn'}>
          {supply.purity.toFixed(1)}%
        </strong>
      ) : (
        '—'
      ),
      <StatusPill key="status" tone={status.tone}>{status.label}</StatusPill>,
    ]
  })

  return (
    <main className="account-page-main dashboard-main">
      <section className="dashboard-welcome">
        <div className="dashboard-user">
          <img src={user?.profile?.avatar_url ?? profilePhoto} alt="" className="dashboard-photo" />
          <div>
            <h1>Welcome back, {user?.name ?? 'there'}</h1>
            <div className="dashboard-membership">
              <span>Free account</span>
              {memberSince ? <small>Member since {memberSince}</small> : null}
            </div>
          </div>
        </div>
        <div className="dashboard-metrics" aria-label="Account metrics">
          <div>
            <strong>{stats?.totalSamples ?? '—'}</strong>
            <span>Total Samples Sent</span>
          </div>
          <div>
            <strong>{stats?.avgBatchPurity != null ? `${stats.avgBatchPurity}%` : '—'}</strong>
            <span>Avg Batch Purity</span>
          </div>
          <div>
            <strong className={stats?.activeAnalysis ? 'metric-warn' : undefined}>
              {stats?.activeAnalysis ?? '—'}
            </strong>
            <span>Active Analysis</span>
          </div>
        </div>
      </section>

      <div className="dashboard-grid">
        <div className="dashboard-primary">
          <section className="account-card" id="shipments">
            <div className="account-card-title-row">
              <h2>My Shipments</h2>
              <a href="/shipments">track shipments</a>
            </div>
            <AccountTable
              columns={['Tracking ID', 'Peptide Name(s)', 'Date Submitted', 'Status']}
              rows={shipments.map((shipment) => {
                const status = SHIPMENT_STATUS_DISPLAY[shipment.status] ?? {
                  label: shipment.status,
                  tone: 'info' as const,
                }
                return [
                  <a key="tracking" href={`/shipment/${shipment.id}`} className="shipment-link">
                    {shipment.tracking_id}
                  </a>,
                  shipment.peptide_names.join(', '),
                  formatShipmentDate(shipment.created_at),
                  <StatusPill key="status" tone={status.tone}>{status.label}</StatusPill>,
                ]
              })}
              className="shipments-table"
            />
          </section>

          <section className="account-card">
            <div className="account-card-title-row">
              <h2>Recent Test Results</h2>
            </div>
            <AccountTable columns={['Peptide Name', 'Batch Code', 'Purity', 'Test Date', 'Outcome']} rows={resultRows} className="results-table" />
          </section>

          <section className="account-card">
            <div className="account-card-title-row">
              <h2>My Supply</h2>
            </div>
            <AccountTable columns={['Peptide Name', 'Quantity (mg)', 'Vendor', 'Purity', 'Status']} rows={supplyRows} className="supply-table" />
          </section>
        </div>

        <aside className="dashboard-sidebar">
          <section className="account-card quick-actions">
            <h2>Quick Actions</h2>
            <a href="/testing" className="quick-action primary">
              <img src={plusIcon} alt="" />
              <span>Submit New Sample</span>
            </a>
            <a href="/account" className="quick-action muted">
              <img src={settingsIcon} alt="" />
              <span>Account Settings</span>
            </a>
          </section>

        </aside>
      </div>
    </main>
  )
}

function SettingsSidebar({ active }: { active: Exclude<AccountView, 'dashboard'> }) {
  return (
    <aside className="settings-sidebar">
      <p>Settings Menu</p>
      <nav aria-label="Account settings">
        {settingsNav.map((item) => (
          <a href={item.href} className={item.id === active ? 'active' : ''} key={item.id}>
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="settings-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024

const readFileAsBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

const ROLE_OPTIONS = ['Researcher', 'Lab Manager', 'Clinician']

const emptyProfileForm = {
  full_name: '',
  organization: '',
  role: 'Researcher',
  phone: '',
  bio: '',
}

function ProfileSettings() {
  const { user, refresh } = useAuth()
  const [form, setForm] = useState(emptyProfileForm)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [photoStatus, setPhotoStatus] = useState<'idle' | 'uploading' | 'error'>('idle')
  const [photoError, setPhotoError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const avatarUrl = user?.profile?.avatar_url ?? null

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !user) {
      return
    }
    if (!file.type.startsWith('image/')) {
      setPhotoStatus('error')
      setPhotoError('Please choose an image file.')
      return
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoStatus('error')
      setPhotoError('Photo must be smaller than 5 MB.')
      return
    }

    setPhotoStatus('uploading')
    setPhotoError('')
    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'png'
      const image = await readFileAsBase64(file)
      await apiFetch('/account/avatar', {
        method: 'POST',
        body: JSON.stringify({ image, contentType: file.type, extension }),
      })
      await refresh()
      setPhotoStatus('idle')
    } catch {
      setPhotoStatus('error')
      setPhotoError('Could not upload the photo. Please try again.')
    }
  }

  const handlePhotoRemove = async () => {
    if (!avatarUrl) {
      return
    }
    setPhotoStatus('uploading')
    setPhotoError('')
    try {
      await apiFetch('/account/avatar', { method: 'DELETE' })
      await refresh()
      setPhotoStatus('idle')
    } catch {
      setPhotoStatus('error')
      setPhotoError('Could not remove the photo. Please try again.')
    }
  }

  useEffect(() => {
    setForm({
      full_name: user?.profile?.full_name ?? '',
      organization: user?.profile?.organization ?? '',
      role: user?.profile?.role ?? 'Researcher',
      phone: user?.profile?.phone ?? '',
      bio: user?.profile?.bio ?? '',
    })
    setStatus('idle')
  }, [user])

  const setField = (field: keyof typeof emptyProfileForm) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }))
      setStatus('idle')
    }

  const handleSave = async () => {
    setStatus('saving')
    try {
      await apiFetch('/account/profile', {
        method: 'PUT',
        body: JSON.stringify(form),
      })
      await refresh()
      setStatus('saved')
    } catch {
      setStatus('error')
    }
  }

  const handleCancel = () => {
    setForm({
      full_name: user?.profile?.full_name ?? '',
      organization: user?.profile?.organization ?? '',
      role: user?.profile?.role ?? 'Researcher',
      phone: user?.profile?.phone ?? '',
      bio: user?.profile?.bio ?? '',
    })
    setStatus('idle')
  }

  return (
    <>
      <AccountContentHeader
        title="Profile Information"
        subtitle="Update your research credentials, contact details, and organization profile."
      />
      <div className="profile-picture-row">
        <img src={avatarUrl ?? profilePhoto} alt="" />
        <div>
          <strong>Your Profile Picture</strong>
          <span>
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={photoStatus === 'uploading'}>
              {photoStatus === 'uploading' ? 'Uploading…' : 'Change Photo'}
            </button>
            <button type="button" className="muted" onClick={handlePhotoRemove} disabled={photoStatus === 'uploading' || !avatarUrl}>
              Remove
            </button>
          </span>
          {photoStatus === 'error' ? <p className="settings-feedback error">{photoError}</p> : null}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={handlePhotoChange}
          />
        </div>
      </div>
      <div className="settings-form-grid">
        <Field label="Full Name">
          <input value={form.full_name} onChange={setField('full_name')} disabled={status === 'saving'} />
        </Field>
        <Field label="Email Address">
          <input value={user?.email ?? ''} type="email" disabled />
        </Field>
        <Field label="Institution/Organization">
          <input value={form.organization} onChange={setField('organization')} disabled={status === 'saving'} />
        </Field>
        <Field label="Role">
          <select value={form.role} onChange={setField('role')} disabled={status === 'saving'}>
            {ROLE_OPTIONS.map((role) => (
              <option key={role}>{role}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Phone Number">
        <input value={form.phone} onChange={setField('phone')} disabled={status === 'saving'} />
      </Field>
      <Field label="Bio">
        <textarea value={form.bio} onChange={setField('bio')} disabled={status === 'saving'} />
      </Field>
      {status === 'saved' ? <p className="settings-feedback success">Profile saved.</p> : null}
      {status === 'error' ? <p className="settings-feedback error">Could not save your profile. Please try again.</p> : null}
      <div className="settings-actions">
        <button type="button" className="account-pill primary" onClick={handleSave} disabled={status === 'saving'}>
          {status === 'saving' ? 'Saving…' : 'Save Changes'}
        </button>
        <button type="button" className="account-pill secondary" onClick={handleCancel} disabled={status === 'saving'}>
          Cancel
        </button>
      </div>
    </>
  )
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete?: string
}) {
  const [visible, setVisible] = useState(false)
  return (
    <Field label={label}>
      <span className="password-shell">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="password-toggle"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          onClick={() => setVisible((v) => !v)}
        >
          <img src={eyeOff} alt="" />
        </button>
      </span>
    </Field>
  )
}

function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!currentPassword) {
      setError('Enter your current password.')
      return
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      setSuccess('Password updated.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <AccountContentHeader title="Security & Password" subtitle="Manage your password and account security settings." />
      <section className="settings-inner-card">
        <h2>Change Password</h2>
        <form onSubmit={handleSubmit}>
          <PasswordField label="Current Password" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
          <PasswordField label="New Password" value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
          <PasswordField label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
          {error ? <p className="settings-feedback error">{error}</p> : null}
          {success ? <p className="settings-feedback success">{success}</p> : null}
          <button type="submit" className="account-pill primary" disabled={submitting}>
            {submitting ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </section>
    </>
  )
}

function ToggleRow({
  label,
  on = true,
  detail,
  disabled = false,
  onChange,
}: {
  label: string
  on?: boolean
  detail?: string
  disabled?: boolean
  onChange?: (value: boolean) => void
}) {
  return (
    <div className="toggle-row">
      <span>
        {label}
        {detail ? <small>{detail}</small> : null}
      </span>
      <button
        type="button"
        className="toggle-button"
        aria-label={`${on ? 'Disable' : 'Enable'} ${label}`}
        aria-pressed={on}
        disabled={disabled || !onChange}
        onClick={() => onChange?.(!on)}
      >
        <img src={on ? toggleOn : toggleOff} alt="" className="account-toggle" />
      </button>
    </div>
  )
}

function NotificationsSettings() {
  const [preferences, setPreferences] = useState({
    email_test_results: true,
    email_shipment_updates: true,
    email_rankings: false,
    email_marketing: false,
    push_test_results: false,
    push_shipment_updates: false,
    push_marketing: false,
    frequency: 'instant',
  })
  const [status, setStatus] = useState<'loading' | 'idle' | 'saving' | 'saved' | 'error'>('loading')

  useEffect(() => {
    apiFetch('/account/notifications')
      .then((data) => {
        setPreferences((current) => ({ ...current, ...data.preferences }))
        setStatus('idle')
      })
      .catch(() => setStatus('error'))
  }, [])

  const setBoolean = (field: keyof typeof preferences) => (value: boolean) => {
    setPreferences((current) => ({ ...current, [field]: value }))
    setStatus('idle')
  }

  const save = async () => {
    setStatus('saving')
    try {
      const data = await apiFetch('/account/notifications', {
        method: 'PUT',
        body: JSON.stringify(preferences),
      })
      setPreferences((current) => ({ ...current, ...data.preferences }))
      setStatus('saved')
    } catch {
      setStatus('error')
    }
  }

  const disabled = status === 'loading' || status === 'saving'
  return (
    <>
      <AccountContentHeader title="Notification Preferences" subtitle="Control how and when Peptrace contacts you." />
      <section className="settings-inner-card">
        <h2>Email Notifications</h2>
        <ToggleRow label="Test Results Ready" on={preferences.email_test_results} onChange={setBoolean('email_test_results')} disabled={disabled} />
        <ToggleRow label="Shipment Status Updates" on={preferences.email_shipment_updates} onChange={setBoolean('email_shipment_updates')} disabled={disabled} />
        <ToggleRow label="New Leaderboard Rankings" on={preferences.email_rankings} onChange={setBoolean('email_rankings')} disabled={disabled} />
        <ToggleRow label="Newsletter & Product Updates" on={preferences.email_marketing} onChange={setBoolean('email_marketing')} disabled={disabled} />
        <ToggleRow label="Security Alerts" detail="(Required)" disabled />
      </section>
      <section className="settings-inner-card">
        <h2>Push Notifications</h2>
        <ToggleRow label="Test Results" on={preferences.push_test_results} onChange={setBoolean('push_test_results')} disabled={disabled} />
        <ToggleRow label="Shipment Tracking" on={preferences.push_shipment_updates} onChange={setBoolean('push_shipment_updates')} disabled={disabled} />
        <ToggleRow label="Promotional" on={preferences.push_marketing} onChange={setBoolean('push_marketing')} disabled={disabled} />
      </section>
      <section className="settings-inner-card">
        <h2>Notification Frequency</h2>
        <label className="radio-row"><input type="radio" checked={preferences.frequency === 'daily'} name="frequency" onChange={() => setPreferences((current) => ({ ...current, frequency: 'daily' }))} disabled={disabled} /> Daily Digest</label>
        <label className="radio-row"><input type="radio" checked={preferences.frequency === 'instant'} name="frequency" onChange={() => setPreferences((current) => ({ ...current, frequency: 'instant' }))} disabled={disabled} /> Instant</label>
        <label className="radio-row"><input type="radio" checked={preferences.frequency === 'weekly'} name="frequency" onChange={() => setPreferences((current) => ({ ...current, frequency: 'weekly' }))} disabled={disabled} /> Weekly Summary</label>
      </section>
      {status === 'saved' ? <p className="settings-feedback success">Preferences saved.</p> : null}
      {status === 'error' ? <p className="settings-feedback error">Could not load or save preferences.</p> : null}
      <button type="button" className="account-pill primary" onClick={save} disabled={disabled}>
        {status === 'saving' ? 'Saving…' : 'Save Preferences'}
      </button>
    </>
  )
}

function BillingSettings() {
  type Subscription = {
    id: string
    provider: string
    plan: string
    status: string
    current_period_end: string | null
    cancel_at_period_end: boolean
    currency: string | null
    amount_cents: number | null
    created_at: string
  }
  const [current, setCurrent] = useState<Subscription | null>(null)
  const [history, setHistory] = useState<Subscription[]>([])
  const [providerConfigured, setProviderConfigured] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch('/account/billing')
      .then((data) => {
        setCurrent(data.current)
        setHistory(data.history ?? [])
        setProviderConfigured(data.providerConfigured === true)
      })
      .catch(() => setError('Could not load billing information.'))
      .finally(() => setLoading(false))
  }, [])

  const formatMoney = (subscription: Subscription) => {
    if (subscription.amount_cents == null) return '—'
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency: subscription.currency ?? 'USD',
    }).format(subscription.amount_cents / 100)
  }
  const billingRows = history.map((subscription) => [
    new Date(subscription.created_at).toLocaleDateString(),
    subscription.plan,
    formatMoney(subscription),
    <StatusPill key={subscription.id} tone={subscription.status === 'active' ? 'success' : 'warning'}>{subscription.status}</StatusPill>,
  ])

  return (
    <>
      <AccountContentHeader title="Membership & Billing" subtitle="Manage your subscription plan and payment details." />
      {loading ? <p>Loading billing information…</p> : null}
      {error ? <p className="settings-feedback error">{error}</p> : null}
      {!loading && current ? (
        <section className="settings-inner-card subtle-card">
          <div className="plan-header">
            <span>
              <h2>{current.plan}</h2>
              <p>{formatMoney(current)}</p>
            </span>
            <p>
              {current.current_period_end
                ? `${current.cancel_at_period_end ? 'Ends' : 'Renews'} ${new Date(current.current_period_end).toLocaleDateString()}`
                : current.status}
            </p>
          </div>
          <p>Billing provider: {current.provider}</p>
          <div className="settings-inline-actions">
            <button type="button" className="account-pill primary" disabled>Change Plan</button>
            <button type="button" className="danger-link" disabled>Cancel Subscription</button>
          </div>
          <p className="settings-feedback">Plan changes are unavailable until the billing provider integration is enabled.</p>
        </section>
      ) : null}
      {!loading && !current ? (
        <section className="settings-inner-card subtle-card">
          <h2>No active membership</h2>
          <p>{providerConfigured ? 'Choose a plan from the membership page.' : 'Online billing is not configured yet. No payment method is stored by PepTrace.'}</p>
        </section>
      ) : null}
      <section className="settings-inner-card subtle-card">
        <h2>Billing History</h2>
        {billingRows.length > 0 ? (
          <AccountTable columns={['Date', 'Description', 'Amount', 'Status']} rows={billingRows} className="billing-table" />
        ) : <p>No billing records.</p>}
      </section>
    </>
  )
}

function AddressCard({
  address,
  busy,
  onEdit,
  onRemove,
  onSetPrimary,
}: {
  address: ShippingAddress
  busy: boolean
  onEdit: () => void
  onRemove: () => void
  onSetPrimary: () => void
}) {
  return (
    <article className="address-card">
      <div className="address-card-header">
        <h2>
          {address.nickname}
          {address.is_primary ? <StatusPill>Primary</StatusPill> : null}
        </h2>
        <span>
          <button type="button" onClick={onEdit} disabled={busy}>Edit</button>
          <button type="button" className="muted" onClick={onRemove} disabled={busy}>Remove</button>
          {!address.is_primary ? (
            <button type="button" onClick={onSetPrimary} disabled={busy}>Set as Primary</button>
          ) : null}
        </span>
      </div>
      <div className="address-copy">
        <p>{address.recipient_name}</p>
        {address.organization ? <p>{address.organization}</p> : null}
        <p>{address.line1}</p>
        {address.line2 ? <p>{address.line2}</p> : null}
        <p>{address.city} {address.state} {address.postal_code}, {address.country}</p>
      </div>
    </article>
  )
}

function ShippingSettings() {
  const { user } = useAuth()
  const [addresses, setAddresses] = useState<ShippingAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ShippingAddress | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError('')
    try {
      const data = await apiFetch('/account/addresses')
      setAddresses(data.addresses)
    } catch {
      setError('Could not load your addresses.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      void load()
    }
  }, [user, load])

  const handleRemove = async (id: string) => {
    if (!window.confirm('Remove this address?')) {
      return
    }
    setBusyId(id)
    try {
      await apiFetch(`/account/addresses/${id}`, { method: 'DELETE' })
      await load()
    } catch {
      setError('Could not remove the address.')
    } finally {
      setBusyId(null)
    }
  }

  const handleSetPrimary = async (id: string) => {
    setBusyId(id)
    try {
      await apiFetch(`/account/addresses/${id}/primary`, { method: 'POST' })
      await load()
    } catch {
      setError('Could not set the primary address.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <AccountContentHeader title="Shipping Addresses" subtitle="Manage addresses for sample submissions and deliveries." />
      {loading ? (
        <p>Loading addresses…</p>
      ) : addresses.length === 0 ? (
        <p>You have no saved addresses yet.</p>
      ) : (
        <div className="address-list">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              busy={busyId === address.id}
              onEdit={() => {
                setEditing(address)
                setModalOpen(true)
              }}
              onRemove={() => handleRemove(address.id)}
              onSetPrimary={() => handleSetPrimary(address.id)}
            />
          ))}
        </div>
      )}
      {error ? <p className="settings-feedback error">{error}</p> : null}
      <button
        type="button"
        className="account-pill primary"
        onClick={() => {
          setEditing(null)
          setModalOpen(true)
        }}
      >
        Add New Address
      </button>
      <AddressModal
        open={modalOpen}
        address={editing}
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />
    </>
  )
}

function PrivacySettings() {
  const { user } = useAuth()
  type Consent = { accepted: boolean; policy_version: string; recorded_at: string; withdrawn_at: string | null }
  type ExportRequest = { id: string; status: string; requested_at: string; expires_at: string | null }
  type DeletionRequest = { id: string; status: string; requested_at: string; scheduled_for: string | null }
  const [consents, setConsents] = useState<Record<string, Consent>>({})
  const [exports, setExports] = useState<ExportRequest[]>([])
  const [deletion, setDeletion] = useState<DeletionRequest | null>(null)
  const [confirmation, setConfirmation] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    const [consentData, exportData, deletionData] = await Promise.all([
      apiFetch('/account/consents'),
      apiFetch('/account/data-exports'),
      apiFetch('/account/deletion-request'),
    ])
    setConsents(consentData.current ?? {})
    setExports(exportData.requests ?? [])
    setDeletion(deletionData.request ?? null)
  }, [])

  useEffect(() => {
    load().catch(() => setError('Could not load privacy settings.'))
  }, [load])

  const updateConsent = async (consentType: string, accepted: boolean) => {
    setBusy(consentType)
    setError('')
    try {
      const data = await apiFetch('/account/consents', {
        method: 'POST',
        body: JSON.stringify({ consentType, accepted }),
      })
      setConsents((current) => ({ ...current, [consentType]: data.consent }))
      setMessage('Consent preference recorded.')
    } catch {
      setError('Could not record consent preference.')
    } finally {
      setBusy('')
    }
  }

  const requestExport = async () => {
    setBusy('export')
    setError('')
    try {
      await apiFetch('/account/data-exports', { method: 'POST' })
      await load()
      setMessage('Your private export is ready for 24 hours.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not generate export.')
    } finally {
      setBusy('')
    }
  }

  const downloadExport = async (id: string) => {
    setBusy(id)
    setError('')
    try {
      const data = await apiFetch(`/account/data-exports/${id}/download`)
      window.location.assign(data.url)
    } catch {
      setError('Could not download this export.')
    } finally {
      setBusy('')
    }
  }

  const requestDeletion = async () => {
    if (!window.confirm('Schedule permanent account deletion after a 7-day grace period?')) return
    setBusy('deletion')
    setError('')
    try {
      await apiFetch('/account/deletion-request', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: confirmation, confirmEmail: confirmation, reason }),
      })
      setConfirmation('')
      setReason('')
      await load()
      setMessage('Account deletion is scheduled. You can cancel during the grace period.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not schedule deletion.')
    } finally {
      setBusy('')
    }
  }

  const cancelDeletion = async () => {
    setBusy('deletion')
    setError('')
    try {
      await apiFetch('/account/deletion-request/cancel', { method: 'POST' })
      await load()
      setMessage('Account deletion canceled.')
    } catch {
      setError('Could not cancel deletion.')
    } finally {
      setBusy('')
    }
  }

  const latestExport = exports[0]
  const deletionActive = deletion && ['requested', 'scheduled', 'processing'].includes(deletion.status)
  return (
    <>
      <AccountContentHeader title="Data & Privacy" subtitle="Control your data, privacy settings, and account deletion." />
      <section className="settings-inner-card subtle-card">
        <h2>Data Sharing</h2>
        <ToggleRow
          label="Allow anonymized analytics"
          on={consents.analytics?.accepted ?? false}
          onChange={(value) => updateConsent('analytics', value)}
          disabled={busy === 'analytics'}
        />
        <ToggleRow
          label="Allow AI-assisted processing"
          on={consents.ai_processing?.accepted ?? false}
          onChange={(value) => updateConsent('ai_processing', value)}
          disabled={busy === 'ai_processing'}
        />
        <ToggleRow
          label="Marketing communications"
          on={consents.marketing?.accepted ?? false}
          onChange={(value) => updateConsent('marketing', value)}
          disabled={busy === 'marketing'}
        />
      </section>
      <section className="settings-inner-card subtle-card data-export-card">
        <h2>Data Export</h2>
        <p>Download a copy of all your Peptrace data including test results, shipments, and account information.</p>
        <div>
          <small>{latestExport ? `Last request: ${new Date(latestExport.requested_at).toLocaleString()} (${latestExport.status})` : 'No exports requested'}</small>
          {latestExport?.status === 'complete' ? (
            <button type="button" className="account-pill secondary" onClick={() => downloadExport(latestExport.id)} disabled={busy === latestExport.id}>
              Download Export
            </button>
          ) : null}
          <button type="button" className="account-pill primary" onClick={requestExport} disabled={busy === 'export'}>
            {busy === 'export' ? 'Generating…' : 'Request Data Export'}
          </button>
        </div>
      </section>
      <section className="settings-inner-card delete-card">
        <h2>
          <img src={alertTriangle} alt="" />
          Delete Account
        </h2>
        {deletionActive ? (
          <>
            <p>Deletion is {deletion.status}{deletion.scheduled_for ? ` for ${new Date(deletion.scheduled_for).toLocaleString()}` : ''}.</p>
            <button type="button" className="account-pill secondary" onClick={cancelDeletion} disabled={busy === 'deletion'}>Cancel Deletion</button>
          </>
        ) : (
          <>
            <p>Deletion is scheduled after a 7-day grace period and cannot be reversed after processing completes.</p>
            <Field label={`Confirm with your current password${user?.email ? ' or account email' : ''}`}>
              <input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="current-password" />
            </Field>
            <Field label="Reason (optional)">
              <textarea value={reason} onChange={(event) => setReason(event.target.value)} />
            </Field>
            <button type="button" className="account-pill danger" onClick={requestDeletion} disabled={busy === 'deletion' || !confirmation}>Delete My Account</button>
          </>
        )}
      </section>
      {message ? <p className="settings-feedback success">{message}</p> : null}
      {error ? <p className="settings-feedback error">{error}</p> : null}
    </>
  )
}

function SettingsContent({ view }: { view: Exclude<AccountView, 'dashboard'> }) {
  const content = {
    profile: <ProfileSettings />,
    security: <SecuritySettings />,
    notifications: <NotificationsSettings />,
    billing: <BillingSettings />,
    shipping: <ShippingSettings />,
    privacy: <PrivacySettings />,
  }[view]

  return (
    <main className="account-page-main settings-main">
      <div className="settings-layout">
        <SettingsSidebar active={view} />
        <section className="settings-content">{content}</section>
      </div>
    </main>
  )
}

export default function AccountPages({ view }: AccountPagesProps) {
  return (
    <div className={`account-page account-view-${view}`}>
      {view === 'dashboard' ? <DashboardPage /> : <SettingsContent view={view} />}
      <SiteFooter />
    </div>
  )
}
