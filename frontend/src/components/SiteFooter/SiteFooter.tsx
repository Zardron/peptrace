import './SiteFooter.css'
import { useSiteContent } from '../../content/useSiteContent'

export default function SiteFooter() {
  const content = useSiteContent('footer')

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-grid">
          {content.columns.map((col, index) => (
            <div className="footer-column" key={`${index}-${col.title}`}>
              <div className="column-header">
                <span className="column-accent" />
                <h4 className="column-title">{col.title}</h4>
              </div>
              <ul className="column-links">
                {col.links.map((link, linkIndex) => (
                  <li key={`${linkIndex}-${link.label}`}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <hr className="footer-divider" />

        <p className="footer-copyright">{content.copyright}</p>
      </div>
    </footer>
  )
}
