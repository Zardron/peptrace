import './HomeBottom.css'
import RichText from '../../content/RichText'
import { useSiteContent } from '../../content/useSiteContent'

export default function HomeBottom() {
  const content = useSiteContent('home')

  return (
    <section className="home-bottom">
      <div className="home-bottom-inner">
        <div className="legal-block">
          <h3 className="legal-heading">{content.disclaimerTitle}</h3>
          <p className="legal-text">
            <RichText text={content.disclaimer} linkClassName="legal-link" />
          </p>
        </div>

        <div className="newsletter-block">
          <h3 className="newsletter-heading">{content.newsletterTitle}</h3>
          {content.newsletterNotes.map((note, index) => (
            <p className="newsletter-privacy" key={index}><RichText text={note} /></p>
          ))}
        </div>
      </div>
    </section>
  )
}
