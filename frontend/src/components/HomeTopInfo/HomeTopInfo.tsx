import './HomeTopInfo.css';

export interface HomeTopInfoProps {
  text?: string;
  href?: string;
}

export function HomeTopInfo({
  text = 'Get your free peptide safety test',
  href = '/test',
}: HomeTopInfoProps) {
  return (
    <section className="home-top-info" aria-label="Peptide safety test promotion">
      <a href={href}>
        {text}
        <svg
          className="home-top-info__arrow"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M6 3l5 5-5 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>
    </section>
  );
}
