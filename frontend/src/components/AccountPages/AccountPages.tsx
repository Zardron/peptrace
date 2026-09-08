import type { ReactNode } from 'react'
import './AccountPages.css'
import alertTriangle from '../../assets/account/alert-triangle.svg'
import eyeOff from '../../assets/account/eye-off.svg'
import fileIcon from '../../assets/account/file.svg'
import moreAction from '../../assets/account/more-action.png'
import plusIcon from '../../assets/account/plus.svg'
import profilePhoto from '../../assets/account/profile-photo.png'
import settingsIcon from '../../assets/account/settings.svg'
import toggleOff from '../../assets/account/toggle-off.svg'
import toggleOn from '../../assets/account/toggle-on.svg'
import checkGreen from '../../assets/membership/check-green.svg'
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

function DashboardPage() {
  const shipmentRows = [
    ['PT-8942', 'Tirzepatide (10mg)', '12 Aug 2026', <StatusPill key="status" tone="warning">Testing</StatusPill>],
    ['PT-8891', 'Retatrutide (5mg)', '08 Aug 2026', <StatusPill key="status">Delivered</StatusPill>],
    ['PT-8750', 'BPC-157 (10mg)', '02 Aug 2026', <StatusPill key="status" tone="info">In Transit</StatusPill>],
    ['PT-8612', 'NAD+ (100mg)', '24 Jul 2026', <StatusPill key="status">Delivered</StatusPill>],
    ['PT-8590', 'Ipamorelin (5mg)', '18 Jul 2026', <StatusPill key="status">Delivered</StatusPill>],
  ]

  const resultRows = [
    ['Retatrutide (5mg)', 'RET-2026-08', <strong key="purity" className="metric-good">99.2%</strong>, '08 Aug 2026', <StatusPill key="status">PASS</StatusPill>],
    ['NAD+ (100mg)', 'NAD-992-B4', <strong key="purity" className="metric-good">98.7%</strong>, '26 Jul 2026', <StatusPill key="status">PASS</StatusPill>],
    ['Ipamorelin (5mg)', 'IPA-771-C1', <strong key="purity" className="metric-warn">94.1%</strong>, '20 Jul 2026', <StatusPill key="status" tone="warning">FAIL</StatusPill>],
  ]

  const supplyRows = [
    ['Tirzepatide (10mg)', '100mg', 'Zenith Jode', <strong key="purity" className="metric-good">99.2%</strong>, <StatusPill key="status">Verified</StatusPill>],
    ['Retatrutide (5mg)', '50mg', 'Peptide Partners', <strong key="purity" className="metric-good">98.7%</strong>, <StatusPill key="status" tone="warning">Pending Test</StatusPill>],
    ['BPC-157 (10mg)', '20mg', 'Bio Labs', <strong key="purity" className="metric-warn">94.1%</strong>, <StatusPill key="status" tone="warning">Low Stock</StatusPill>],
    ['NAD+ (100mg)', '0mg', 'Pure Science', <strong key="purity" className="metric-good">99.0%</strong>, <StatusPill key="status">Reorder</StatusPill>],
  ]

  return (
    <main className="account-page-main dashboard-main">
      <section className="dashboard-welcome">
        <div className="dashboard-user">
          <img src={profilePhoto} alt="" className="dashboard-photo" />
          <div>
            <h1>Welcome back, Dr. John Doe</h1>
            <p>john.doe@example.com</p>
            <div className="dashboard-membership">
              <span>Researcher Premium</span>
              <small>Member since Oct 2025</small>
            </div>
          </div>
        </div>
        <div className="dashboard-metrics" aria-label="Account metrics">
          <div>
            <strong>12</strong>
            <span>Total Samples Sent</span>
          </div>
          <div>
            <strong>98.9%</strong>
            <span>Avg Batch Purity</span>
          </div>
          <div>
            <strong className="metric-warn">1</strong>
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
            <AccountTable columns={['Tracking ID', 'Peptide Name', 'Date Submitted', 'Status']} rows={shipmentRows} className="shipments-table" />
          </section>

          <section className="account-card">
            <div className="account-card-title-row">
              <h2>Recent Test Results</h2>
              <a href="/results">download certificates</a>
            </div>
            <AccountTable columns={['Peptide Name', 'Batch Code', 'Purity', 'Test Date', 'Outcome']} rows={resultRows} className="results-table" />
          </section>

          <section className="account-card">
            <div className="account-card-title-row">
              <h2>My Supply</h2>
              <a href="/supply">manage supply</a>
            </div>
            <AccountTable columns={['Peptide Name', 'Quantity (mg)', 'Vendor', 'Purity', 'Status']} rows={supplyRows} className="supply-table" />
          </section>
        </div>

        <aside className="dashboard-sidebar">
          <section className="account-card quick-actions">
            <h2>Quick Actions</h2>
            <a href="/submit-sample" className="quick-action primary">
              <img src={plusIcon} alt="" />
              <span>Submit New Sample</span>
            </a>
            <a href="/results" className="quick-action outlined">
              <img src={fileIcon} alt="" />
              <span>View All Results</span>
            </a>
            <a href="/account" className="quick-action muted">
              <img src={settingsIcon} alt="" />
              <span>Account Settings</span>
            </a>
          </section>

          <section className="account-card lab-dates">
            <h2>Next Lab Delivery Dates</h2>
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

function ProfileSettings() {
  return (
    <>
      <AccountContentHeader
        title="Profile Information"
        subtitle="Update your research credentials, contact details, and organization profile."
      />
      <div className="profile-picture-row">
        <img src={profilePhoto} alt="" />
        <div>
          <strong>Your Profile Picture</strong>
          <span>
            <button type="button">Change Photo</button>
            <button type="button" className="muted">Remove</button>
          </span>
        </div>
      </div>
      <div className="settings-form-grid">
        <Field label="Full Name">
          <input defaultValue="Dr. John Doe" />
        </Field>
        <Field label="Email Address">
          <input defaultValue="john.doe@example.com" type="email" />
        </Field>
        <Field label="Institution/Organization">
          <input defaultValue="University of Melbourne" />
        </Field>
        <Field label="Role">
          <select defaultValue="Researcher">
            <option>Researcher</option>
            <option>Lab Manager</option>
            <option>Clinician</option>
          </select>
        </Field>
      </div>
      <Field label="Phone Number">
        <input defaultValue="+61 412 345 678" />
      </Field>
      <Field label="Bio">
        <textarea defaultValue="Peptide researcher specializing in metabolic peptides and purity analysis." />
      </Field>
      <div className="settings-actions">
        <button type="button" className="account-pill primary">Save Changes</button>
        <button type="button" className="account-pill secondary">Cancel</button>
      </div>
    </>
  )
}

function PasswordField({ label }: { label: string }) {
  return (
    <Field label={label}>
      <span className="password-shell">
        <input defaultValue="••••••••••••" type="password" />
        <img src={eyeOff} alt="" />
      </span>
    </Field>
  )
}

function SecuritySettings() {
  return (
    <>
      <AccountContentHeader title="Security & Password" subtitle="Manage your password and account security settings." />
      <section className="settings-inner-card">
        <h2>Change Password</h2>
        <PasswordField label="Current Password" />
        <PasswordField label="New Password" />
        <PasswordField label="Confirm New Password" />
        <button type="button" className="account-pill primary">Update Password</button>
      </section>
      <section className="settings-inner-card inline-card">
        <div>
          <h2>Two-Factor Authentication</h2>
          <p>Add an extra layer of security to your account.</p>
        </div>
        <StatusPill tone="danger">Disabled</StatusPill>
        <div className="settings-inline-actions">
          <img src={toggleOff} alt="" className="account-toggle" />
          <button type="button" className="account-pill secondary">Enable 2FA</button>
        </div>
      </section>
      <section className="settings-inner-card">
        <h2>Active Sessions</h2>
        {[
          ['MacBook Pro', 'Melbourne, AU', '2 mins ago'],
          ['iPhone 14', 'Sydney, AU', '3 hours ago'],
          ['Windows 11', 'Remote, US', 'Yesterday'],
        ].map(([device, location, time]) => (
          <div className="session-row" key={device}>
            <span>
              <strong>{device}</strong>
              <small>{location}</small>
            </span>
            <small>{time}</small>
            <button type="button">Sign Out</button>
          </div>
        ))}
      </section>
    </>
  )
}

function ToggleRow({ label, on = true, detail }: { label: string; on?: boolean; detail?: string }) {
  return (
    <div className="toggle-row">
      <span>
        {label}
        {detail ? <small>{detail}</small> : null}
      </span>
      <img src={on ? toggleOn : toggleOff} alt="" className="account-toggle" />
    </div>
  )
}

function NotificationsSettings() {
  return (
    <>
      <AccountContentHeader title="Notification Preferences" subtitle="Control how and when Peptrace contacts you." />
      <section className="settings-inner-card">
        <h2>Email Notifications</h2>
        <ToggleRow label="Test Results Ready" />
        <ToggleRow label="Shipment Status Updates" />
        <ToggleRow label="New Leaderboard Rankings" on={false} />
        <ToggleRow label="Newsletter & Product Updates" on={false} />
        <ToggleRow label="Security Alerts" detail="(Required)" />
      </section>
      <section className="settings-inner-card">
        <h2>Push Notifications</h2>
        <ToggleRow label="Test Results" />
        <ToggleRow label="Shipment Tracking" />
        <ToggleRow label="Promotional" on={false} />
      </section>
      <section className="settings-inner-card">
        <h2>Notification Frequency</h2>
        <label className="radio-row"><input type="radio" defaultChecked name="frequency" /> Daily Digest</label>
        <label className="radio-row"><input type="radio" name="frequency" /> Instant</label>
        <label className="radio-row"><input type="radio" name="frequency" /> Weekly Summary</label>
      </section>
      <button type="button" className="account-pill primary">Save Preferences</button>
    </>
  )
}

function BillingSettings() {
  const billingRows = [
    ['15 Aug 2026', 'Researcher Premium', '$29.00', <StatusPill key="status">Paid</StatusPill>],
    ['15 Jul 2026', 'Researcher Premium', '$29.00', <StatusPill key="status">Paid</StatusPill>],
    ['15 Jun 2026', 'Researcher Premium', '$29.00', <StatusPill key="status">Paid</StatusPill>],
  ]

  return (
    <>
      <AccountContentHeader title="Membership & Billing" subtitle="Manage your subscription plan and payment details." />
      <section className="settings-inner-card subtle-card">
        <div className="plan-header">
          <span>
            <h2>Researcher Premium</h2>
            <p>$29/month</p>
          </span>
          <p>Renews on 15 Sep 2026</p>
        </div>
        <ul className="plan-features">
          {['Unlimited sample submissions', 'Priority testing queue', 'Advanced analytics', 'API access'].map((feature) => (
            <li key={feature}>
              <img src={checkGreen} alt="" />
              {feature}
            </li>
          ))}
        </ul>
        <div className="settings-inline-actions">
          <button type="button" className="account-pill primary">Change Plan</button>
          <button type="button" className="danger-link">Cancel Subscription</button>
        </div>
      </section>
      <section className="settings-inner-card subtle-card payment-card">
        <h2>Payment Method</h2>
        <span>
          <strong>Visa ending in 4582</strong>
          <small>Expires 08/2028</small>
        </span>
        <button type="button" className="account-pill secondary squared">Update Payment Method</button>
      </section>
      <section className="settings-inner-card subtle-card">
        <h2>Billing History</h2>
        <AccountTable columns={['Date', 'Description', 'Amount', 'Status']} rows={billingRows} className="billing-table" />
      </section>
    </>
  )
}

function AddressCard({
  title,
  children,
  secondary = false,
}: {
  title: string
  children: ReactNode
  secondary?: boolean
}) {
  return (
    <article className="address-card">
      <div className="address-card-header">
        <h2>{title}</h2>
        <span>
          <button type="button">Edit</button>
          <button type="button" className="muted">Remove</button>
          {secondary ? <button type="button">Set as Primary</button> : null}
        </span>
      </div>
      <div className="address-copy">{children}</div>
    </article>
  )
}

function ShippingSettings() {
  return (
    <>
      <AccountContentHeader title="Shipping Addresses" subtitle="Manage addresses for sample submissions and deliveries." />
      <div className="address-list">
        <AddressCard title="Primary Address">
          <p>Dr. John Doe</p>
          <p>University of Melbourne</p>
          <p>Department of Biochemistry</p>
          <p>Level 3, 30 Flemington Rd</p>
          <p>Parkville VIC 3052, Australia</p>
        </AddressCard>
        <AddressCard title="Secondary Address" secondary>
          <p>Dr. John Doe</p>
          <p>Home Laboratory</p>
          <p>45 Collins Street</p>
          <p>Apartment 12B</p>
          <p>Melbourne VIC 3000, Australia</p>
        </AddressCard>
      </div>
      <button type="button" className="account-pill primary">Add New Address</button>
    </>
  )
}

function PrivacySettings() {
  return (
    <>
      <AccountContentHeader title="Data & Privacy" subtitle="Control your data, privacy settings, and account deletion." />
      <section className="settings-inner-card subtle-card">
        <h2>Data Sharing</h2>
        <ToggleRow label="Share anonymized test results with community leaderboards" />
        <ToggleRow label="Allow Peptrace to use my data for research improvements" on={false} />
        <ToggleRow label="Visible on public vendor rankings" />
      </section>
      <section className="settings-inner-card subtle-card data-export-card">
        <h2>Data Export</h2>
        <p>Download a copy of all your Peptrace data including test results, shipments, and account information.</p>
        <div>
          <small>Last export: 12 Jul 2026</small>
          <button type="button" className="account-pill primary">Request Data Export</button>
        </div>
      </section>
      <section className="settings-inner-card delete-card">
        <h2>
          <img src={alertTriangle} alt="" />
          Delete Account
        </h2>
        <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
        <button type="button" className="account-pill danger">Delete My Account</button>
      </section>
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
