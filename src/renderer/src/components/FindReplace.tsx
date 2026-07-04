import { useMemo, useState } from 'react'
import { findAll, replaceAll } from '../../../shared/find-replace'

interface FindReplaceProps {
  readonly content: string
  readonly onReplaceAll: (next: string) => void
  readonly onClose: () => void
}

/** Find & replace panel. Counts live; replace-all rewrites the document. */
export function FindReplace({ content, onReplaceAll, onClose }: FindReplaceProps): JSX.Element {
  const [query, setQuery] = useState('')
  const [replacement, setReplacement] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)

  const count = useMemo(
    () => findAll(content, query, { caseSensitive }).length,
    [content, query, caseSensitive]
  )

  return (
    <div className="jypora-find">
      <input
        className="find-input"
        placeholder="Find"
        value={query}
        autoFocus
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      />
      <input
        className="find-input"
        placeholder="Replace"
        value={replacement}
        onChange={(e) => setReplacement(e.target.value)}
      />
      <label className="find-opt">
        <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} />
        Aa
      </label>
      <span className="find-count">{count} found</span>
      <button
        className="find-btn"
        disabled={count === 0}
        onClick={() => onReplaceAll(replaceAll(content, query, replacement, { caseSensitive }))}
      >
        Replace All
      </button>
      <button className="find-btn" onClick={onClose}>
        ✕
      </button>
    </div>
  )
}
