import './SiteFooter.css';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

const columns: FooterColumn[] = [
  {
    title: 'Explore',
    links: [
      { label: 'Products', href: '/products' },
      { label: 'Vendors', href: '/vendors' },
      { label: 'Vendor Support', href: '/vendor-support' },
      { label: 'Blog', href: '/blog' },
      { label: 'Partner Testing Labs', href: '/partner-labs' },
      { label: 'Testing Methodology', href: '/methodology' },
      { label: 'Corrections', href: '/corrections' },
      { label: 'Company', href: '/company' },
      { label: 'Customer Support', href: '/support' },
    ],
  },
  {
    title: 'Testing',
    links: [
      { label: 'Submit your sample', href: '/test' },
      { label: 'Test Retatrutide', href: '/test/retatrutide' },
      { label: 'Test Tirzepatide', href: '/test/tirzepatide' },
      { label: 'Test Melatonin', href: '/test/melatonin' },
      { label: 'Test BPC-157', href: '/test/bpc-157' },
      { label: 'Test Ipamorelin', href: '/test/ipamorelin' },
      { label: 'Test NAD+', href: '/test/nad' },
      { label: 'Test another product', href: '/test/other' },
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
      { label: 'Partner Service Terms', href: '/partner-terms' },
      { label: 'Data Deletion', href: '/data-deletion' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__grid">
        {columns.map((column) => (
          <div key={column.title} className="site-footer__column">
            <h4>{column.title}</h4>
            <ul>
              {column.links.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <hr className="site-footer__divider" />
      <p className="site-footer__copyright">&copy;2026 Peptrace</p>
    </footer>
  );
}
