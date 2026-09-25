interface BreadcrumbsProps {
  productName: string
}

export default function Breadcrumbs({ productName }: BreadcrumbsProps) {
  return (
    <nav className="fl-breadcrumbs" aria-label="Breadcrumb">
      <a href="/" className="fl-breadcrumb-link">Products</a>
      <span className="fl-breadcrumb-sep">/</span>
      <span className="fl-breadcrumb-current" aria-current="page">{productName}</span>
    </nav>
  )
}
