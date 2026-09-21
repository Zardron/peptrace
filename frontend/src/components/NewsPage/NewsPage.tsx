import './NewsPage.css'
import peptraceIcon from '../../assets/logo-icon.svg'
import publicCitizenLogo from '../../assets/news/public-citizen.svg'
import theTimesLogo from '../../assets/news/the-times.svg'
import medscapeLogo from '../../assets/news/medscape.svg'
import theWeekLogo from '../../assets/news/the-week.svg'
import theNewYorkerLogo from '../../assets/news/the-new-yorker.svg'
import cnnLogo from '../../assets/news/cnn.svg'
import statLogo from '../../assets/news/stat.svg'

interface Article {
  id: number
  source: string
  sourceLogo?: string
  sourceLogoHeight?: number
  date: string
  badge: string
  title: string
  description?: string
}

const articles: Article[] = [
  {
    id: 1,
    source: 'PepTrace',
    sourceLogo: peptraceIcon,
    sourceLogoHeight: 35,
    date: 'Jul 2026',
    badge: 'Blog',
    title: 'Testing, Your Way',
    description: 'Describe which tests matter most to your personal Peptide regimen, and our reports. This is peptide testing, your way.',
  },
  {
    id: 2,
    source: 'Public Citizen',
    sourceLogo: publicCitizenLogo,
    sourceLogoHeight: 35,
    date: 'Jun 2026',
    badge: 'Public Citizen',
    title: 'The Miracle Drug and the Peptide Craze Breaking the FDA',
  },
  {
    id: 3,
    source: 'PepTrace',
    sourceLogo: peptraceIcon,
    sourceLogoHeight: 35,
    date: 'Jun 2026',
    badge: 'Blog',
    title: 'Sermorelin vs Ipamorelin vs Tesamorelin: What the Data Says About Quality Variance',
    description: 'We compare purity and potency data across dozens of batches from multiple vendors, and what to check before finding a lab source.',
  },
  {
    id: 4,
    source: 'The Times',
    sourceLogo: theTimesLogo,
    sourceLogoHeight: 35,
    date: 'May 2026',
    badge: 'The Times',
    title: 'The peptide revolution: inside the injectables industry',
  },
  {
    id: 5,
    source: 'PepTrace',
    sourceLogo: peptraceIcon,
    sourceLogoHeight: 35,
    date: 'May 2026',
    badge: 'Blog',
    title: 'Independent Peptide Testing: How PepTrace Verifies Purity, Potency, and Real-World Quality',
    description: 'PepTrace uses independent peptide testing, a method designed to anonymously confirm lot-based, lot-traced, and cross-validated certified lab-approved self-administered certification.',
  },
  {
    id: 6,
    source: 'Medscape',
    sourceLogo: medscapeLogo,
    sourceLogoHeight: 35,
    date: 'May 2026',
    badge: 'Medscape',
    title: 'As Unregulated Peptides Flood the Market, Clinicians Encouraged to Counsel Patients',
  },
  {
    id: 7,
    source: 'The Week',
    sourceLogo: theWeekLogo,
    sourceLogoHeight: 35,
    date: 'Apr 2026',
    badge: 'The Week',
    title: 'The regulation issues with grey-market peptides',
  },
  {
    id: 8,
    source: 'The New Yorker',
    sourceLogo: theNewYorkerLogo,
    sourceLogoHeight: 35,
    date: 'Apr 2026',
    badge: 'The New Yorker',
    title: 'Why Are People Injecting Themselves with Peptides?',
  },
  {
    id: 9,
    source: 'CNN',
    sourceLogo: cnnLogo,
    sourceLogoHeight: 35,
    date: 'Apr 2026',
    badge: 'CNN',
    title: "Peptides: what's real, what's risky and what's next",
  },
  {
    id: 10,
    source: 'STAT',
    sourceLogo: statLogo,
    sourceLogoHeight: 35,
    date: 'Apr 2026',
    badge: 'STAT News',
    title: 'What the peptide craze reveals about Americans relationship with risk',
  },
]

function SourceCol({ article }: { article: Article }) {
  return (
    <div className="source-col">
      {article.sourceLogo && (
        <img
          src={article.sourceLogo}
          alt={article.source}
          className="source-logo"
          style={{ height: article.sourceLogoHeight }}
        />
      )}
      <span className="source-name">{article.source}</span>
    </div>
  )
}

function ArticleTags({ article }: { article: Article }) {
  return (
    <div className="article-tags">
      <span className="article-date">{article.date}</span>
      <span className="article-badge">{article.badge}</span>
    </div>
  )
}

function NewsArticle({ article }: { article: Article }) {
  return (
    <article className="news-article">
      <SourceCol article={article} />
      <div className="content-col">
        <ArticleTags article={article} />
        <h2 className="article-title">{article.title}</h2>
        {article.description && (
          <p className="article-description">{article.description}</p>
        )}
      </div>
    </article>
  )
}

export default function NewsPage() {
  return (
    <main className="news-page">
      <div className="news-page-content">
        <div className="news-card">
          <div className="news-header">
            <span className="news-label">News</span>
            <h1 className="news-headline">Coverage, research, and updates.</h1>
            <p className="news-subtitle">
              Press coverage citing PepTrace testing, original research built on our lab-FDA
              validation, and articles from the PepTrace blog — newest first.
            </p>
          </div>

          <hr className="news-divider top-divider" />

          {articles.map((article, index) => (
            <div key={article.id}>
              <NewsArticle article={article} />
              {index < articles.length - 1 && <hr className="news-divider" />}
            </div>
          ))}

          <hr className="news-divider bottom-divider" />
        </div>
      </div>
    </main>
  )
}
