import './HomeTopInfo.css'
import arrowSvg from '../../assets/arrow-right.svg'

interface HomeTopInfoProps {
  href?: string
}

export default function HomeTopInfo({ href = '/test' }: HomeTopInfoProps) {
  return (
    <section className="home-top-info">
      <a href={href} className="top-info-banner">
        <span className="top-info-text">Get your free peptide safety test</span>
        <img src={arrowSvg} alt="" className="top-info-arrow" />
      </a>
    </section>
  )
}
