import { Fragment } from 'react'

const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g

const isSafeHref = (href: string) =>
  (href.startsWith('/') && !href.startsWith('//')) || /^(https?:|mailto:)/i.test(href)

interface RichTextProps {
  text: string
  linkClassName?: string
}

// Admin-edited copy supports one bit of markup: [link text](/path).
export default function RichText({ text, linkClassName = 'rich-text-link' }: RichTextProps) {
  const parts: React.ReactNode[] = []
  let cursor = 0
  for (const match of text.matchAll(LINK)) {
    const [whole, label, href] = match
    const start = match.index ?? 0
    if (start > cursor) parts.push(text.slice(cursor, start))
    parts.push(isSafeHref(href)
      ? (
        <a
          key={start}
          href={href}
          className={linkClassName}
          {...(/^https?:/i.test(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {label}
        </a>
      )
      : label)
    cursor = start + whole.length
  }
  if (cursor < text.length) parts.push(text.slice(cursor))
  return <>{parts.map((part, index) => <Fragment key={index}>{part}</Fragment>)}</>
}
