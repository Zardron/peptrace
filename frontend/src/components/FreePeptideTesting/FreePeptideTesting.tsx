import { useState } from 'react'
import './FreePeptideTesting.css'
import FormWizard from '../FormWizard/FormWizard'
import RichText from '../../content/RichText'
import { useSiteContent } from '../../content/useSiteContent'

export default function FreePeptideTesting() {
  const [completed, setCompleted] = useState(false)
  const content = useSiteContent('testing-page')

  return (
    <div className="free-peptide-testing">
      <section className="fpt-hero">
        <div className="fpt-hero-inner">
          <h1 className="fpt-hero-title">{content.title}</h1>
          <div className="fpt-info-block">
            <div className="fpt-info-icon">
              <svg width="33" height="33" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.5 0C7.387 0 0 7.387 0 16.5C0 25.613 7.387 33 16.5 33C25.613 33 33 25.613 33 16.5C33 7.387 25.613 0 16.5 0ZM16.5 30C9.056 30 3 23.944 3 16.5C3 9.056 9.056 3 16.5 3C23.944 3 30 9.056 30 16.5C30 23.944 23.944 30 16.5 30Z" fill="#45a382"/>
                <path d="M14.5 9.5H18.5V13.5H14.5V9.5ZM14.5 16.5H18.5V24.5H14.5V16.5Z" fill="#45a382"/>
              </svg>
            </div>
            <div className="fpt-info-text">
              <p className="fpt-info-title">{content.noticeTitle}</p>
              <p className="fpt-info-body">
                <RichText text={content.noticeBody} />
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="fpt-wizard">
        <div className="fpt-wizard-inner">
          {completed ? (
            <div className="fpt-complete">
              <h2 className="fpt-complete-title">{content.completeTitle}</h2>
              <p className="fpt-complete-body">
                <RichText text={content.completeBody} />
              </p>
              <button
                type="button"
                className="fpt-complete-button"
                onClick={() => setCompleted(false)}
              >
                Register another sample
              </button>
            </div>
          ) : (
            <FormWizard onComplete={() => setCompleted(true)} />
          )}
        </div>
      </section>
    </div>
  )
}
