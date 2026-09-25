interface ProductHeaderProps {
  name: string
  methodology: string
  vendorCount: number
  testCount: number
  firstTestDate: string
  latestTestDate: string
}

const formatDate = (iso: string): string => {
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
      <p className="fl-product-subtitle">methodology · Purity focus</p>
      <p className="fl-product-meta">
        {vendorCount} vendors&nbsp;&nbsp;&nbsp;{testCount.toLocaleString()} tests&nbsp;&nbsp;&nbsp;{formatDate(firstTestDate)} first&nbsp;&nbsp;&nbsp;{formatDate(latestTestDate)} latest
      </p>
    </div>
  )
}
