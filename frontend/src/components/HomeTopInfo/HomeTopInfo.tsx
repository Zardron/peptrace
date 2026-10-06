import './HomeTopInfo.css'
import arrowSvg from '../../assets/arrow-right.svg'
import { useSiteContent } from '../../content/useSiteContent'

export default function HomeTopInfo() {
  const content = useSiteContent('home')

  return (
    <section className="home-top-info">
      <a href={content.bannerHref} className="top-info-banner">
        <span className="top-info-text">{content.bannerText}</span>
        <img src={arrowSvg} alt="" className="top-info-arrow" />
      </a>
    </section>
  )
}
