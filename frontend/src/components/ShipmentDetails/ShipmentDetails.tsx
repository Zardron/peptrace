import { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'
import ShipmentProgress from './ShipmentProgress'
import ShipmentTimeline from './ShipmentTimeline'
import arrowRightSvg from '../../assets/arrow-right-shipment.svg'
import './ShipmentDetails.css'

interface ShipmentData {
  id: string
  trackingNumber: string
  status: string
  origin: { city: string; address: string }
  destination: { city: string; address: string }
  milestones: { name: string; date: string; completed: boolean }[]
  timelineEvents: { event: string; meta: string; timestamp: string }[]
  billingItems: { label: string; value: number }[]
  totalAmount: number
  invoiceNumber: string
  invoiceUrl: string
  paymentStatus: string
  paymentNotice: { title: string; body: string }
  service: string
  packageType: string
  weight: string
  dimensions: string
  temperature: string
  paymentMethod: string
  amountDue: number
  dueDate: string
  createdAt: string
  updatedAt: string
}

interface ShipmentDetailsProps {
  shipmentId: string
}

const ArrowRight = () => (
  <img src={arrowRightSvg} alt="" width="28" height="20" />
)

const formatShipmentDate = (iso: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
}

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    submitted: 'Submitted',
    in_transit: 'In transit',
    testing: 'Testing',
    delivered: 'Delivered',
  }
  return map[status] ?? status
}

const statusTone = (status: string): 'success' | 'warning' | 'info' => {
  if (status === 'delivered') return 'success'
  if (status === 'testing') return 'warning'
  return 'info'
}

export default function ShipmentDetails({ shipmentId }: ShipmentDetailsProps) {
  const [data, setData] = useState<ShipmentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    apiFetch(`/shipment/${encodeURIComponent(shipmentId)}`)
      .then((json) => {
        if (cancelled) return
        setData(json)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message || 'Could not load shipment details.')
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [shipmentId])

  if (loading) {
    return (
      <div className="shipment-details-page">
        <div className="shipment-details-container">
          <div className="shipment-loading">
            <span className="shipment-spinner" role="status" aria-label="Loading" />
            <span>Loading shipment details…</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="shipment-details-page">
        <div className="shipment-details-container">
          <div className="shipment-error">{error || 'Shipment not found.'}</div>
        </div>
      </div>
    )
  }

  const infoRows = [
    { label: 'Service', value: data.service },
    { label: 'Package', value: data.packageType },
    { label: 'Tracking number', value: data.trackingNumber },
    { label: 'Weight', value: data.weight },
    { label: 'Dimensions', value: data.dimensions },
    { label: 'Temperature', value: data.temperature },
  ]

  const paymentRows = [
    { label: 'Amount due', value: `$${data.amountDue.toFixed(2)}` },
    { label: 'Due date', value: data.dueDate },
    { label: 'Payment method', value: data.paymentMethod },
  ]

  const tone = statusTone(data.status)

  return (
    <div className="shipment-details-page">
      <div className="shipment-details-container">
        {/* Breadcrumb */}
        <nav className="shipment-breadcrumb" aria-label="Breadcrumb">
          <a href="/dashboard">Shipments</a>
          <span className="shipment-breadcrumb-separator">/</span>
          <span className="shipment-breadcrumb-current">{data.trackingNumber}</span>
        </nav>

        {/* Summary */}
        <div className="shipment-summary">
          <div className="shipment-identity">
            <h1 className="shipment-title">Shipment {data.trackingNumber}</h1>
            <p className="shipment-subtitle">
              {data.service} · Created {formatShipmentDate(data.createdAt)}
            </p>
          </div>
          <span className={`shipment-status-pill ${tone}`}>
            <span className="shipment-status-dot" />
            {statusLabel(data.status)} · On time
          </span>
        </div>

        {/* Progress */}
        <section className="shipment-card">
          <h2 className="shipment-section-title">Tracking progress</h2>
          <ShipmentProgress milestones={data.milestones} />
        </section>

        {/* Detail grid */}
        <div className="shipment-details-grid">
          <div className="shipment-primary">
            {/* Route */}
            <section className="shipment-card">
              <h2 className="shipment-section-title">Route</h2>
              <div className="shipment-route">
                <div className="shipment-route-point">
                  <span className="shipment-route-label">Origin</span>
                  <span className="shipment-route-city">{data.origin.city}</span>
                  <span className="shipment-route-address">{data.origin.address}</span>
                </div>
                <div className="shipment-route-arrow">
                  <ArrowRight />
                </div>
                <div className="shipment-route-point">
                  <span className="shipment-route-label">Destination</span>
                  <span className="shipment-route-city">{data.destination.city}</span>
                  <span className="shipment-route-address">{data.destination.address}</span>
                </div>
              </div>
            </section>

            {/* Shipment & package */}
            <section className="shipment-card">
              <h2 className="shipment-section-title">Shipment & package</h2>
              <div className="shipment-info-rows">
                {infoRows.map((row, i) => (
                  <div key={i} className="shipment-info-row">
                    <span className="shipment-info-label">{row.label}</span>
                    <span className="shipment-info-value">{row.value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Timeline */}
            <section className="shipment-card">
              <h2 className="shipment-section-title">Shipment activity</h2>
              <ShipmentTimeline events={data.timelineEvents} />
            </section>
          </div>

          <div className="shipment-billing">
            {/* Shipping cost */}
            <section className="shipment-card">
              <h2 className="shipment-section-title">Shipping cost</h2>
              <div className="shipment-info-rows">
                {data.billingItems.map((item, i) => (
                  <div key={i} className="shipment-info-row">
                    <span className="shipment-info-label">{item.label}</span>
                    <span className="shipment-info-value">${item.value.toFixed(2)}</span>
                  </div>
                ))}
                <div className="shipment-divider" />
                <div className="shipment-info-row">
                  <span className="shipment-info-label">Total (USD)</span>
                  <span className="shipment-info-value">${data.totalAmount.toFixed(2)}</span>
                </div>
              </div>
              <div className="shipment-invoice-action">
                <span className="shipment-invoice-number">Invoice {data.invoiceNumber}</span>
                {data.invoiceUrl ? (
                  <a href={data.invoiceUrl} className="shipment-invoice-link" target="_blank" rel="noreferrer">
                    View invoice →
                  </a>
                ) : (
                  <span className="shipment-invoice-link">View invoice →</span>
                )}
              </div>
            </section>

            {/* Payment */}
            <section className="shipment-card">
              <h2 className="shipment-section-title">Payment</h2>
              <div className="shipment-info-rows">
                <div className="shipment-info-row">
                  <span className="shipment-info-label">Payment status</span>
                  <span className="shipment-payment-badge">{data.paymentStatus.toUpperCase()}</span>
                </div>
                {paymentRows.map((row, i) => (
                  <div key={i} className="shipment-info-row">
                    <span className="shipment-info-label">{row.label}</span>
                    <span className="shipment-info-value">{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="shipment-payment-notice">
                <strong>{data.paymentNotice.title}</strong>
                <p>{data.paymentNotice.body}</p>
              </div>
              <button className="shipment-pay-button">Submit Payment</button>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
