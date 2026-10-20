import { useState } from 'react'
import './HomeBottom.css'
import RichText from '../../content/RichText'
import { useSiteContent } from '../../content/useSiteContent'
import arrowSvg from '../../assets/arrow-subscribe.svg'

export default function HomeBottom() {
  const content = useSiteContent('home')
  const [email, setEmail] = useState('')

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
          <form className="newsletter-form" onSubmit={(event) => event.preventDefault()}>
            <input
              type="email"
              className="newsletter-input"
              placeholder="email@example.com"
              aria-label="Email address"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <button type="submit" className="newsletter-button">
              <span>subscribe</span>
              <img src={arrowSvg} alt="" />
            </button>
          </form>
          {content.newsletterNotes.map((note, index) => (
            <p className="newsletter-privacy" key={index}><RichText text={note} /></p>
          ))}
        </div>
      </div>
    </section>
  )
}
