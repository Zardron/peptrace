import './LegalPage.css'

export interface LegalSection {
  heading: string
  paragraphs?: string[]
  list?: string[]
}

interface LegalDocument {
  title: string
  lastUpdated: string
  intro: string[]
  sections: LegalSection[]
}

const CONTACT_EMAIL = 'contact@peptrace.co'

const privacyPolicy: LegalDocument = {
  title: 'Privacy Policy',
  lastUpdated: '28 September 2026',
  intro: [
    'Peptrace ("Peptrace", "we", "us") operates peptrace.co, a service that lets you submit peptide samples for independent laboratory testing and publishes aggregated purity and vendor leaderboard data.',
    'This policy explains what personal information we collect, why we collect it, and the choices you have. By using Peptrace you agree to the practices described here.',
  ],
  sections: [
    {
      heading: 'Information we collect',
      paragraphs: ['We collect only what is needed to operate the service:'],
      list: [
        'Account information — your email address (used for one-time-code sign in), display name, and optional profile photo.',
        'Shipping addresses — addresses you save to your account so we can send sample kits and return results.',
        'Shipment and sample data — tracking numbers, vendor and product details, and the laboratory results for samples you submit.',
        'Usage data — standard server logs (IP address, browser type, pages visited) used for security and troubleshooting.',
      ],
    },
    {
      heading: 'How we use your information',
      list: [
        'To create and secure your account and authenticate you.',
        'To process your sample submissions, shipments, and test results.',
        'To display your shipments and results back to you in your dashboard.',
        'To produce aggregated, de-identified statistics (such as vendor leaderboards and batch purity averages). Individual results are never published in a way that identifies you.',
        'To respond to support requests and meet legal obligations.',
      ],
    },
    {
      heading: 'Third-party services',
      paragraphs: ['We use a small number of processors to run Peptrace:'],
      list: [
        'Supabase — authentication, database, and file storage (profile photos).',
        'Google Maps Platform — address autocomplete on the shipping address form. Your typed address text is sent to Google to provide suggestions.',
        'Our hosting provider — serves the application and stores server logs.',
      ],
    },
    {
      heading: 'Data retention and security',
      paragraphs: [
        'Account data is kept while your account is active. Test results and shipment records are retained so your dashboard history remains available, and may be kept in de-identified aggregate form after account deletion.',
        'We use encryption in transit (HTTPS) and row-level access controls in our database so that your data is only accessible to your account.',
      ],
    },
    {
      heading: 'Your rights',
      paragraphs: [
        'You can view and correct your profile information and shipping addresses at any time from your account settings. You can request a copy of your data or delete your account from the Data & Privacy section of your account settings.',
        'Deleting your account removes your profile, addresses, and shipment associations. Aggregated, de-identified test statistics are not affected.',
      ],
    },
    {
      heading: 'Changes to this policy',
      paragraphs: [
        'If we make material changes to this policy we will update the "last updated" date above and, where appropriate, notify you by email.',
      ],
    },
    {
      heading: 'Contact',
      paragraphs: [
        `Questions about this policy or your data: ${CONTACT_EMAIL}.`,
      ],
    },
  ],
}

const termsOfUse: LegalDocument = {
  title: 'Terms of Use',
  lastUpdated: '28 September 2026',
  intro: [
    'These Terms of Use govern your access to and use of peptrace.co (the "Service"), operated by Peptrace. By creating an account or using the Service you agree to these terms.',
  ],
  sections: [
    {
      heading: 'The Service',
      paragraphs: [
        'Peptrace provides independent laboratory testing of peptide samples you submit, and publishes aggregated results such as vendor leaderboards, purity ratings, and batch statistics.',
        'The Service is provided for informational and harm-reduction purposes. We do not sell peptides, endorse any vendor, and do not provide medical, legal, or dosing advice.',
      ],
    },
    {
      heading: 'Not medical advice',
      paragraphs: [
        'Nothing on the Service — including test results, purity ratings, or vendor rankings — is medical advice, a recommendation to use any substance, or a guarantee that any product is safe. Always consult a qualified health professional.',
      ],
    },
    {
      heading: 'Your account',
      list: [
        'You must provide a valid email address and keep your account credentials confidential.',
        'You are responsible for activity under your account.',
        'You must be at least 18 years old to use the Service.',
      ],
    },
    {
      heading: 'Sample submissions',
      list: [
        'You represent that you lawfully possess any sample you submit and that submitting it for testing is lawful in your jurisdiction.',
        'Samples are consumed or destroyed during testing and cannot be returned.',
        'We may refuse or dispose of any sample at our discretion, including where we believe possession or transport would be unlawful.',
        'You are responsible for accurate product, vendor, and batch information when submitting a sample.',
      ],
    },
    {
      heading: 'Test results and leaderboards',
      paragraphs: [
        'Results describe only the specific sample tested and may not represent other batches or products from the same vendor.',
        'We may publish aggregated, de-identified results (for example vendor-level purity averages and leaderboard rankings). You grant us a non-exclusive licence to use your results in this aggregated form.',
      ],
    },
    {
      heading: 'Acceptable use',
      paragraphs: ['You agree not to:'],
      list: [
        'Misuse the Service, interfere with its operation, or attempt to access data belonging to other users.',
        'Submit false or misleading sample, vendor, or batch information.',
        'Scrape or bulk-download leaderboard or test data without our written permission.',
        'Use the Service for any unlawful purpose.',
      ],
    },
    {
      heading: 'Intellectual property',
      paragraphs: [
        'The Service, including its design, text, and aggregated datasets, is owned by Peptrace. You may view and use it for personal, non-commercial purposes.',
      ],
    },
    {
      heading: 'Disclaimers and liability',
      paragraphs: [
        'The Service is provided "as is" without warranties of any kind. To the maximum extent permitted by law, Peptrace is not liable for any indirect, incidental, or consequential loss, or for decisions made in reliance on test results or rankings.',
        'Nothing in these terms excludes rights you have under the Australian Consumer Law that cannot lawfully be excluded.',
      ],
    },
    {
      heading: 'Termination',
      paragraphs: [
        'You may delete your account at any time. We may suspend or terminate accounts that breach these terms.',
      ],
    },
    {
      heading: 'Governing law',
      paragraphs: [
        'These terms are governed by the laws of Australia. Disputes are subject to the courts of Australia.',
      ],
    },
    {
      heading: 'Changes and contact',
      paragraphs: [
        'We may update these terms from time to time; the "last updated" date above reflects the current version. Continued use after a change constitutes acceptance.',
        `Questions about these terms: ${CONTACT_EMAIL}.`,
      ],
    },
  ],
}

const documents: Record<string, LegalDocument> = {
  '/privacy': privacyPolicy,
  '/terms': termsOfUse,
}

interface LegalPageProps {
  path: string
}

export default function LegalPage({ path }: LegalPageProps) {
  const doc = documents[path] ?? privacyPolicy

  return (
    <main className="legal-page">
      <div className="legal-container">
        <h1 className="legal-title">{doc.title}</h1>
        <p className="legal-updated">Last updated: {doc.lastUpdated}</p>

        {doc.intro.map((paragraph, i) => (
          <p className="legal-paragraph" key={`intro-${i}`}>{paragraph}</p>
        ))}

        {doc.sections.map((section, i) => (
          <section className="legal-section" key={i}>
            <h2 className="legal-heading">{section.heading}</h2>
            {section.paragraphs?.map((paragraph, j) => (
              <p className="legal-paragraph" key={j}>{paragraph}</p>
            ))}
            {section.list && (
              <ul className="legal-list">
                {section.list.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </main>
  )
}
