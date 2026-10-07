import './LegalPage.css'
import type { SiteContentKey } from '../../content/defaults'
import RichText from '../../content/RichText'
import { useSiteContent } from '../../content/useSiteContent'

const documentKeys: Record<string, Extract<SiteContentKey, `legal.${string}`>> = {
  '/privacy': 'legal.privacy',
  '/terms': 'legal.terms',
  '/refund': 'legal.refund',
  '/data-deletion': 'legal.data-deletion',
}

interface LegalPageProps {
  path: string
}

export default function LegalPage({ path }: LegalPageProps) {
  const doc = useSiteContent(documentKeys[path] ?? 'legal.privacy')

  return (
    <main className="legal-page">
      <div className="legal-container">
        <h1 className="legal-title">{doc.title}</h1>
        <p className="legal-updated">Last updated: {doc.lastUpdated}</p>

        {doc.intro.map((paragraph, i) => (
          <p className="legal-paragraph" key={`intro-${i}`}><RichText text={paragraph} /></p>
        ))}

        {doc.sections.map((section, i) => (
          <section className="legal-section" key={i}>
            <h2 className="legal-heading">{section.heading}</h2>
            {section.paragraphs.map((paragraph, j) => (
              <p className="legal-paragraph" key={j}><RichText text={paragraph} /></p>
            ))}
            {section.list.length > 0 && (
              <ul className="legal-list">
                {section.list.map((item, j) => (
                  <li key={j}><RichText text={item} /></li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </main>
  )
}
