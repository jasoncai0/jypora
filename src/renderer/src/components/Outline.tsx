import { useMemo } from 'react'
import { extractOutline } from '../../../shared/markdown'

interface OutlineProps {
  readonly content: string
  readonly onSelect: (slug: string) => void
}

/** Document outline derived from the Markdown heading structure. */
export function Outline({ content, onSelect }: OutlineProps): JSX.Element {
  const headings = useMemo(() => extractOutline(content), [content])

  return (
    <aside className="jypora-outline">
      <div className="outline-header">Outline</div>
      {headings.length === 0 ? (
        <div className="outline-empty">No headings</div>
      ) : (
        headings.map((h) => (
          <div
            key={`${h.slug}-${h.line}`}
            className="outline-item"
            style={{ paddingLeft: `${(h.level - 1) * 12 + 10}px` }}
            onClick={() => onSelect(h.slug)}
            title={h.text}
          >
            {h.text}
          </div>
        ))
      )}
    </aside>
  )
}
