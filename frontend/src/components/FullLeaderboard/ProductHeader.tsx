interface ProductHeaderProps {
  name: string
  methodology: string
  vendorCount: number
  testCount: number
  firstTestDate: string | null
  latestTestDate: string | null
}

const formatDate = (iso: string | null): string => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ProductHeader({
  name,
  methodology,
  vendorCount,
  testCount,
  firstTestDate,
  latestTestDate,
}: ProductHeaderProps) {
  return (
    <div className="fl-product-header">
      <h1 className="fl-product-title">{name}</h1>
      <p className="fl-product-subtitle">methodology · {methodology}</p>
      <p className="fl-product-meta">
        {vendorCount} vendors&nbsp;&nbsp;&nbsp;{testCount.toLocaleString()} tests
        {firstTestDate ? <>&nbsp;&nbsp;&nbsp;{formatDate(firstTestDate)} first</> : null}
        {latestTestDate ? <>&nbsp;&nbsp;&nbsp;{formatDate(latestTestDate)} latest</> : null}
      </p>
    </div>
  )
}
