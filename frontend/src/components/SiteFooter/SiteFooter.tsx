import './SiteFooter.css'

const columns = [
  {
    title: 'Explore',
    links: [
      'Products',
      'Vendors',
      'Vendor Support',
      'Blog',
      'Partner Testing Labs',
      'Testing Methodology',
      'Corrections',
      'Company',
      'Customer Support',
    ],
  },
  {
    title: 'Testing',
    links: [
      'Submit your sample',
      'Test Retatrutide',
      'Test Tirzipatide',
      'Test Melatonin',
      'Test BPC-157',
      'Test Ipamoreline',
      'Test NAD+',
      'Test another product',
    ],
  },
  {
    title: 'Legal',
    links: [
      'Verify COA',
      'Testing Status',
      'Terms of Service',
      'Privacy Policy',
      'Refund Policy',
      'Partner Service Terms',
      'Data Deletion',
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
                {col.links.map((link) => (
                  <li key={link}>
                    <a href={`/${link.toLowerCase().replace(/\s+/g, '-')}`}>{link}</a>
                  </li>
                ))}
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
