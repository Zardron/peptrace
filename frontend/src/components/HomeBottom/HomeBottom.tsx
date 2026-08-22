import { useState } from 'react';
import './HomeBottom.css';

export function HomeBottom() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder: wire to newsletter API later
    setEmail('');
  };

  return (
    <section className="home-bottom">
      <div className="home-bottom__newsletter">
        <h3>Subscribe to Peptrace News and Updates</h3>
        <form className="home-bottom__form" onSubmit={handleSubmit}>
          <input
            type="email"
            className="home-bottom__input"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="home-bottom__submit">
            subscribe
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M3 7h8M8 4l3 3-3 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </form>
        <p className="home-bottom__privacy">
          Your privacy is our top priority. We&apos;ll never sell or share your email address to a third party.
        </p>
      </div>

      <div className="home-bottom__disclaimer">
        <h3>Legal Disclaimer</h3>
        <p>
          The information provided on this website, including test results, vendor rankings, and product
          evaluations, is for informational and educational purposes only and does not constitute medical
          advice, diagnosis, or treatment recommendations. Peptrace is not a medical professional,
          laboratory, or pharmacy. All peptide products discussed or referenced are research chemicals not
          approved by the FDA, TGA, or any other regulatory body for human consumption. Users should
          consult with a licensed healthcare provider before using any peptide or research chemical. Test
          results reflect samples submitted at a specific point in time and may not represent current
          product quality. Peptrace disclaims all liability for any harm, loss, or damage arising from the
          use of information or products referenced on this site.
        </p>
      </div>
    </section>
  );
}
