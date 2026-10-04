import './SiteFooter.css'

type FooterLink = string | { label: string; href: string }

const columns = [
  {
    title: 'Explore',
    links: [
      { label: 'Products', href: '/products' },
      { label: 'Vendors', href: '/vendors' },
      { label: 'Vendor Support', href: '/vendor-support' },
      { label: 'Blog', href: '/blog' },
      { label: 'Partner Testing Labs', href: '/labs' },
      { label: 'Testing Methodology', href: '/methodology' },
      { label: 'Corrections', href: '/corrections' },
      { label: 'Company', href: '/company' },
      { label: 'Customer Support', href: '/support' },
    ] as FooterLink[],
  },
  {
    title: 'Testing',
    links: [
      { label: 'Submit your sample', href: '/testing' },
      { label: 'Test Retatrutide', href: '/testing?slug=retatrutide' },
      { label: 'Test Tirzipatide', href: '/testing?slug=tirzipatide' },
      { label: 'Test Melatonin', href: '/testing?slug=melatonin' },
      { label: 'Test BPC-157', href: '/testing?slug=bpc-157' },
      { label: 'Test Ipamoreline', href: '/testing?slug=ipamoreline' },
      { label: 'Test NAD+', href: '/testing?slug=nad' },
      { label: 'Test another product', href: '/testing' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Verify COA', href: '/verify-coa' },
      { label: 'Testing Status', href: '/testing-status' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Refund Policy', href: '/refund' },
      { label: 'Partner Service Terms', href: '/partner-service-terms' },
      { label: 'Data Deletion', href: '/data-deletion' },
    ],
  },
]

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-grid">
          {columns.map((col) => (
            <div className="footer-column" key={col.title}>
              <div className="column-header">
                <span className="column-accent" />
                <h4 className="column-title">{col.title}</h4>
              </div>
              <ul className="column-links">
                {col.links.map((link) => {
                  const label = typeof link === 'string' ? link : link.label
                  const href = typeof link === 'string' ? `/${link.toLowerCase().replace(/\s+/g, '-')}` : link.href
                  return (
                    <li key={label}>
                      <a href={href}>{label}</a>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        <hr className="footer-divider" />

        <p className="footer-copyright">&copy;2026 Peptrace</p>
      </div>
    </footer>
  )
}
