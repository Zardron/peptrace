import './AnnouncementBar.css'
import { useSiteContent } from '../../content/useSiteContent'

export default function AnnouncementBar() {
  const content = useSiteContent('announcement')
  if (!content.enabled || !content.text) return null

  return (
    <div className={`announcement-bar announcement-bar--${content.tone}`} role="status">
      {content.href ? (
        <a href={content.href} className="announcement-bar-link">
          {content.text} <span aria-hidden="true">→</span>
        </a>
      ) : (
        <span>{content.text}</span>
      )}
    </div>
  )
}
