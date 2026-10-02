import './HomeBottom.css'

export default function HomeBottom() {
  return (
    <section className="home-bottom">
      <div className="home-bottom-inner">
        <div className="legal-block">
          <h3 className="legal-heading">Legal Disclaimer</h3>
          <p className="legal-text">
            The information on this website is provided for general informational and educational purposes only. It is not intended to replace professional medical advice, diagnosis, or treatment. If you have any health concerns or require medical advice, you should consult a registered medical practitioner or other qualified healthcare professional. The content on this website is not intended to diagnose, treat, cure, or prevent any disease or medical condition. References to testing, research, or analytical results are provided for informational purposes only. No statements on this website have been evaluated or approved by the Australian Therapeutic Goods Administration (TGA) or any other regulatory authority, unless expressly stated. Peptrace Ratings represent Peptrace&apos;s interpretation of laboratory testing conducted by or on behalf of Peptrace. These ratings are provided for informational purposes only and should not be interpreted as an endorsement, recommendation, or guarantee of any product or outcome. Peptrace&apos;s peptide testing services are available exclusively to residents of Australia. To the fullest extent permitted by law, Peptrace accepts no responsibility or liability for any loss, damage, or consequences arising from the use of, or reliance on, the information provided on this website. Your use of this website is also subject to our{' '}
            <a href="/terms" className="legal-link">Terms of Use</a>.
          </p>
        </div>

        <div className="newsletter-block">
          <h3 className="newsletter-heading">Subscribe to Peptrace News and Updates</h3>
          <p className="newsletter-privacy">Newsletter signup is temporarily unavailable while email delivery is being configured.</p>
          <p className="newsletter-privacy">
            Your privacy is our top priority. We&apos;ll never sell or share your email address to a third party.
          </p>
        </div>
      </div>
    </section>
  )
}
