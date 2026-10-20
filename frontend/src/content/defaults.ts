// Built-in site copy. Admins can override any block from the admin portal; the
// API serves the override, and these defaults are used until it responds or if
// it can't be reached. Keep in sync with api/src/site-content-defaults.ts
// (enforced by api/tests/site-content.test.ts).

export interface LegalSection {
  heading: string
  paragraphs: string[]
  list: string[]
}

export interface LegalDocument {
  title: string
  lastUpdated: string
  intro: string[]
  sections: LegalSection[]
}

export interface FooterLink {
  label: string
  href: string
}

export interface SiteContent {
  announcement: {
    enabled: boolean
    text: string | null
    href: string | null
    tone: 'info' | 'warning'
  }
  home: {
    bannerText: string
    bannerHref: string
    disclaimerTitle: string
    disclaimer: string
    newsletterTitle: string
    newsletterNotes: string[]
  }
  footer: {
    columns: { title: string; links: FooterLink[] }[]
    copyright: string
  }
  membership: {
    heroTitle: string
    heroHighlight: string
    heroBody: string
    plans: {
      title: string
      tone: 'muted' | 'member' | 'gold'
      price: string
      period: string
      badge: string | null
      description: string
      features: string[]
    }[]
    policyText: string
    supportEmail: string
    highlights: { title: string; description: string }[]
    fundingTitle: string
    fundingBody: string
    fundingStatTitle: string
    fundingStatBody: string
    faqTitle: string
    faqs: { question: string; answer: string }[]
  }
  methodology: {
    updatedLabel: string
    intro: string
    standardsIntro: string
    standards: {
      name: string
      membersOnly: boolean
      purity: string
      quantity: string
      labeling: string
      sometimes: string
    }[]
    standardsNotes: string[]
  }
  'testing-page': {
    title: string
    noticeTitle: string
    noticeBody: string
    completeTitle: string
    completeBody: string
  }
  'legal.privacy': LegalDocument
  'legal.terms': LegalDocument
  'legal.refund': LegalDocument
  'legal.data-deletion': LegalDocument
}

export type SiteContentKey = keyof SiteContent

const CONTACT_EMAIL = 'contact@peptrace.co'

export const defaultSiteContent: SiteContent = {
  announcement: {
    enabled: false,
    text: null,
    href: null,
    tone: 'info',
  },
  home: {
    bannerText: 'Get your free peptide safety test',
    bannerHref: '/testing',
    disclaimerTitle: 'Legal Disclaimer',
    disclaimer:
      "The information on this website is provided for general informational and educational purposes only. It is not intended to replace professional medical advice, diagnosis, or treatment. If you have any health concerns or require medical advice, you should consult a registered medical practitioner or other qualified healthcare professional. The content on this website is not intended to diagnose, treat, cure, or prevent any disease or medical condition. References to testing, research, or analytical results are provided for informational purposes only. No statements on this website have been evaluated or approved by the Australian Therapeutic Goods Administration (TGA) or any other regulatory authority, unless expressly stated. Peptrace Ratings represent Peptrace's interpretation of laboratory testing conducted by or on behalf of Peptrace. These ratings are provided for informational purposes only and should not be interpreted as an endorsement, recommendation, or guarantee of any product or outcome. Peptrace's peptide testing services are available exclusively to residents of Australia. To the fullest extent permitted by law, Peptrace accepts no responsibility or liability for any loss, damage, or consequences arising from the use of, or reliance on, the information provided on this website. Your use of this website is also subject to our [Terms of Use](/terms).",
    newsletterTitle: 'Subscribe to Peptrace News and Updates',
    newsletterNotes: [
      'Get product news, testing updates, and Peptrace announcements by email.',
      "Your privacy is our top priority. We'll never sell or share your email address to a third party.",
    ],
  },
  footer: {
    columns: [
      {
        title: 'Explore',
        links: [
          { label: 'Products', href: '/products' },
          { label: 'Vendors', href: '/vendors' },
          { label: 'Leaderboards', href: '/' },
          { label: 'Testing Methodology', href: '/methodology' },
          { label: 'Membership', href: '/membership' },
          { label: 'Vendor Registration', href: '/vendor-signup' },
          { label: 'Customer Support', href: '/support' },
        ],
      },
      {
        title: 'Testing',
        links: [
          { label: 'Submit your sample', href: '/testing' },
          { label: 'Test Retatrutide', href: '/testing?slug=retatrutide' },
          { label: 'Test Tirzepatide', href: '/testing?slug=tirzepatide' },
          { label: 'Test Melatonin', href: '/testing?slug=melatonin' },
          { label: 'Test BPC-157', href: '/testing?slug=bpc-157' },
          { label: 'Test Ipamorelin', href: '/testing?slug=ipamorelin' },
          { label: 'Test NAD+', href: '/testing?slug=nad' },
        ],
      },
      {
        title: 'Legal',
        links: [
          { label: 'Terms of Service', href: '/terms' },
          { label: 'Privacy Policy', href: '/privacy' },
          { label: 'Refund Policy', href: '/refund' },
          { label: 'Data Deletion', href: '/data-deletion' },
        ],
      },
    ],
    copyright: '©2026 Peptrace',
  },
  membership: {
    heroTitle: 'Subscribe to PepTrace.',
    heroHighlight: 'See everything.',
    heroBody:
      'Unlock third-party lab verification databases, community vendor metrics, and strict testing modes designed for rigorous peptide research.',
    plans: [
      {
        title: 'PepTrace Free',
        tone: 'muted',
        price: '$0',
        period: '/ forever',
        badge: null,
        description: "Basic access to PepTrace's public database of vendor names and submitted public COAs.",
        features: ['Browse listed vendors', 'View crowd-sourced ratings', 'Basic searching & filtering'],
      },
      {
        title: 'PepTrace Member',
        tone: 'member',
        price: '$9.99',
        period: '/ month',
        badge: null,
        description: 'Full access to lab testing verifications, strict rating modes, and detailed vendor scorecards.',
        features: [
          'View strict rating scorecards',
          'Original lab COAs index download',
          'Community-funded testing alerts',
          'Strict/Relaxed toggle modes',
        ],
      },
      {
        title: 'PepTrace Gold',
        tone: 'gold',
        price: '$39.99',
        period: '/ month',
        badge: 'TOP TIER',
        description: 'For extreme researchers. Directly funds high-frequency independent testing of new batches.',
        features: [
          'All PepTrace Member benefits',
          'Vendor intelligence reports',
          'Direct lab test voting power',
          'Early access to lab results (48h)',
        ],
      },
    ],
    policyText: 'Cancel anytime. Subscriptions are billed monthly. No-risk satisfaction guarantee.',
    supportEmail: CONTACT_EMAIL,
    highlights: [
      {
        title: 'Original lab COAs',
        description:
          "We pull directly from original testing laboratory systems (such as Janoshik, MZ Biolabs) to ensure documents aren't tampered with.",
      },
      {
        title: 'Two strict rating modes',
        description:
          'Switch between Strict and Relaxed views. Strict mode hides unverified tests and filters out self-reported results immediately.',
      },
      {
        title: 'Vendor intelligence reports',
        description:
          'Get full analytics on consistency. Detect batch variation over time with custom historical scatter plots of purity and quantity.',
      },
    ],
    fundingTitle: 'Where your subscription goes',
    fundingBody:
      'PepTrace is completely independent. 100% of membership fees go toward buying random peptide vials directly from vendors and submitting them to independent third-party laboratories for testing. We accept no sponsor money from vendors.',
    fundingStatTitle: 'Independent',
    fundingStatBody: 'Funding metrics will be published only when backed by verified accounting data.',
    faqTitle: 'Frequently Asked Questions',
    faqs: [
      {
        question: 'Why are strict modes paid?',
        answer:
          'Running deep data cross-checks on laboratory databases and maintaining clean rating algorithms takes significant technical infrastructure and manual oversight. Keeping this under a membership tier keeps PepTrace completely unbiased.',
      },
      {
        question: 'Do I need an account first?',
        answer:
          'Yes, you can register for a free account to browse basic information, and upgrade instantly when you are ready to access raw lab files and detailed quality scorecards.',
      },
      {
        question: 'What stays free?',
        answer:
          'The basic lists of vendors, basic crowdsourced rating scores, and public peptide profiles will remain free forever to support the baseline research community.',
      },
    ],
  },
  methodology: {
    updatedLabel: 'TEST DATA LAST UPDATED 14 SEPT 2025, 19,448 TESTS',
    intro:
      'Peptrace rankings summarize published test evidence for a vendor and peptide. A higher rating means recent, classifiable samples have more consistently met the selected Peptrace standard for identity, purity, fill accuracy, and, in standard modes, batch labeling quality.',
    standardsIntro:
      'A sample must have enough information to evaluate identity, purity, quantity accuracy, and labeling. If a sample is missing one of those essentials, it is not counted in the rating for that standard.',
    standards: [
      { name: 'Purity focus', membersOnly: false, purity: 'at least 99.5%', quantity: 'within plus/minus 20% of claim', labeling: 'no label requirements', sometimes: 'not evaluated' },
      { name: 'Peptrace Standard', membersOnly: false, purity: 'at least 99.5%', quantity: 'within plus/minus 20% of claim', labeling: 'label score at least 0.5', sometimes: 'not evaluated' },
      { name: 'Purity focus strict', membersOnly: true, purity: 'at least 99.8%', quantity: 'within plus/minus 15% of claim', labeling: 'no label requirements', sometimes: 'not evaluated' },
      { name: 'Peptrace Super strict', membersOnly: true, purity: 'at least 99.8%', quantity: 'within plus/minus 15% of claim', labeling: 'label score at least 1.0', sometimes: 'not evaluated' },
      { name: 'Accuracy focus', membersOnly: true, purity: 'at least 98%', quantity: 'within plus/minus 20% of claim', labeling: 'label score at least 0.5', sometimes: 'fail above 40 EU/sample, when tested' },
    ],
    standardsNotes: [
      'Underfill and overfill both fail when they exceed the allowed range. A failed identity result fails the sample. Purity focus modes use the compound result and fill accuracy only; batch labeling does not affect those modes.',
      'The accuracy standard is the only standard that grades endotoxins: a sample whose lab report shows endotoxin contamination above 40 EU per sample fails. Unlike the essentials above, endotoxin testing is not required - most lab panels do not include it, so a sample without an endotoxin result is still counted in the rating; only a measured result above the threshold counts against it. Endotoxin results never affect the other standards.',
      'The members-only standards are included with every paid Peptrace membership, alongside original COA downloads.',
    ],
  },
  'testing-page': {
    title: 'Free Peptide Testing',
    noticeTitle: 'Free testing is only available for individuals',
    noticeBody:
      'If you are a vendor or if you sell or distribute peptides to others professionally, please use our [Vendor Services](/vendor-signup). This allows us to keep providing testing at no cost.',
    completeTitle: 'Shipment registered',
    completeBody:
      "Thanks — your sample has been registered. You'll receive shipping instructions and updates as your test progresses.",
  },
  'legal.privacy': {
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
        paragraphs: [],
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
        list: [],
      },
      {
        heading: 'Your rights',
        paragraphs: [
          'You can view and correct your profile information and shipping addresses at any time from your account settings. You can request a copy of your data or delete your account from the Data & Privacy section of your account settings.',
          'Deleting your account removes your profile, addresses, and shipment associations. Aggregated, de-identified test statistics are not affected.',
        ],
        list: [],
      },
      {
        heading: 'Changes to this policy',
        paragraphs: [
          'If we make material changes to this policy we will update the "last updated" date above and, where appropriate, notify you by email.',
        ],
        list: [],
      },
      {
        heading: 'Contact',
        paragraphs: [`Questions about this policy or your data: ${CONTACT_EMAIL}.`],
        list: [],
      },
    ],
  },
  'legal.terms': {
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
        list: [],
      },
      {
        heading: 'Not medical advice',
        paragraphs: [
          'Nothing on the Service — including test results, purity ratings, or vendor rankings — is medical advice, a recommendation to use any substance, or a guarantee that any product is safe. Always consult a qualified health professional.',
        ],
        list: [],
      },
      {
        heading: 'Your account',
        paragraphs: [],
        list: [
          'You must provide a valid email address and keep your account credentials confidential.',
          'You are responsible for activity under your account.',
          'You must be at least 18 years old to use the Service.',
        ],
      },
      {
        heading: 'Sample submissions',
        paragraphs: [],
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
        list: [],
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
        list: [],
      },
      {
        heading: 'Disclaimers and liability',
        paragraphs: [
          'The Service is provided "as is" without warranties of any kind. To the maximum extent permitted by law, Peptrace is not liable for any indirect, incidental, or consequential loss, or for decisions made in reliance on test results or rankings.',
          'Nothing in these terms excludes rights you have under the Australian Consumer Law that cannot lawfully be excluded.',
        ],
        list: [],
      },
      {
        heading: 'Termination',
        paragraphs: [
          'You may delete your account at any time. We may suspend or terminate accounts that breach these terms.',
        ],
        list: [],
      },
      {
        heading: 'Governing law',
        paragraphs: ['These terms are governed by the laws of Australia. Disputes are subject to the courts of Australia.'],
        list: [],
      },
      {
        heading: 'Changes and contact',
        paragraphs: [
          'We may update these terms from time to time; the "last updated" date above reflects the current version. Continued use after a change constitutes acceptance.',
          `Questions about these terms: ${CONTACT_EMAIL}.`,
        ],
        list: [],
      },
    ],
  },
  'legal.refund': {
    title: 'Refund Policy',
    lastUpdated: '28 September 2026',
    intro: [
      'Peptrace offers independent laboratory testing services and may issue refunds in limited circumstances. This policy explains when a refund is available, how to request one, and how we handle cancelled or failed sample submissions.',
      'By using the Service, you agree to this refund policy alongside our Terms of Service and Privacy Policy.',
    ],
    sections: [
      {
        heading: 'Eligibility',
        paragraphs: [
          'Refunds may be considered where a test is not completed due to a service issue, a failed sample intake, or a duplicate or incorrect payment. Refunds are not available for completed analyses where the sample has already been processed by the laboratory.',
        ],
        list: [],
      },
      {
        heading: 'Sample submissions and cancellations',
        paragraphs: [],
        list: [
          'If a sample is rejected before testing begins, we may issue a refund or credit for the unused service fee.',
          'If your sample is lost in transit or the order is cancelled before the laboratory receives it, we may assess a refund on a case-by-case basis.',
          'Once a sample has been accepted and testing has begun, the service fee is generally non-refundable because the testing work has already been incurred.',
        ],
      },
      {
        heading: 'Payment disputes and support',
        paragraphs: [
          `If you believe a charge is incorrect or a service issue prevented us from delivering the expected result, contact us at ${CONTACT_EMAIL} and include your order details. We review all refund requests in good faith and may request additional information before making a decision.`,
        ],
        list: [],
      },
      {
        heading: 'Timing',
        paragraphs: [
          'Approved refunds are generally processed within 5 to 10 business days to the original payment method. Processing times may vary depending on the payment provider.',
        ],
        list: [],
      },
      {
        heading: 'Changes',
        paragraphs: ['We may update this Refund Policy from time to time. The date above reflects the current version.'],
        list: [],
      },
    ],
  },
  'legal.data-deletion': {
    title: 'Data Deletion',
    lastUpdated: '28 September 2026',
    intro: [
      'You can request deletion of your Peptrace account and personal data at any time. This page explains what is deleted, what may remain for legal or operational reasons, and how to submit a deletion request.',
      'We aim to delete data promptly once we confirm the request, while retaining only the minimum information required by law or to maintain de-identified aggregate statistics.',
    ],
    sections: [
      {
        heading: 'How to request deletion',
        paragraphs: [
          `You can request account deletion from your Data & Privacy settings in the account dashboard. If you cannot access your account, email ${CONTACT_EMAIL} with your account email and a request to delete your data.`,
        ],
        list: [],
      },
      {
        heading: 'What gets deleted',
        paragraphs: [],
        list: [
          'Your account profile and login information associated with the account.',
          'Saved shipping addresses and account preferences.',
          'Shipment records, sample submissions, and test result history linked to your account.',
          'Files and metadata associated with your profile and dashboard data.',
        ],
      },
      {
        heading: 'What may remain',
        paragraphs: [
          'We may retain limited information required for legal compliance, account security, or payment dispute resolution. We also preserve de-identified aggregate data, such as leaderboard statistics, where individual users cannot be reasonably identified.',
        ],
        list: [],
      },
      {
        heading: 'Timing',
        paragraphs: [
          'Deletion requests are processed as quickly as reasonably possible. Where a request is complex or we need to confirm your identity, we may take additional time to complete the deletion securely.',
        ],
        list: [],
      },
      {
        heading: 'Questions',
        paragraphs: [`If you have questions about data deletion or need help with a request, contact us at ${CONTACT_EMAIL}.`],
        list: [],
      },
    ],
  },
}
