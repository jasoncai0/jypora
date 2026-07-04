import { useEffect, useMemo, useState } from 'react'
import { findAll, replaceAll } from '../../../shared/find-replace'

interface FindReplaceProps {
  readonly content: string
  readonly onReplaceAll: (next: string) => void
  readonly onClose: () => void
}

/**
 * Find & replace panel. Navigation/highlighting uses Electron's native
 * findInPage (works in both WYSIWYG and source mode); replace-all rewrites the
 * markdown source directly.
 */
export function FindReplace({ content, onReplaceAll, onClose }: FindReplaceProps): JSX.Element {
  const [query, setQuery] = useState('')
  const [replacement, setReplacement] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [position, setPosition] = useState<{ current: number; total: number } | null>(null)

  // Text-level count drives Replace All enablement (independent of highlight).
  const count = useMemo(
    () => findAll(content, query, { caseSensitive }).length,
    [content, query, caseSensitive]
  )

  // Subscribe to native find results (n/m) while the panel is open.
  useEffect(() => {
    const off = window.jypora.onFindResult((r) =>
      setPosition({ current: r.activeMatchOrdinal, total: r.matches })
    )
    return () => {
      off()
      window.jypora.findStop(false)
    }
  }, [])

  // Restart highlighting whenever the query changes.
  useEffect(() => {
    if (query.length === 0) {
      window.jypora.findStop(false)
      setPosition(null)
      return
    }
    window.jypora.findStart(query, true, true) // first request starts the session
  }, [query])

  const goNext = (): void => {
    if (query.length > 0) window.jypora.findStart(query, true, false)
  }
  const goPrev = (): void => {
    if (query.length > 0) window.jypora.findStart(query, false, false)
  }

  return (
    <div className="jypora-find">
      <input
        className="find-input"
        placeholder="Find"
        value={query}
        autoFocus
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose()
          else if (e.key === 'Enter' && e.shiftKey) goPrev()
          else if (e.key === 'Enter') goNext()
        }}
      />
      <button className="find-btn" disabled={query.length === 0} onClick={goPrev} title="Previous (Shift+Enter)">
        ↑
      </button>
      <button className="find-btn" disabled={query.length === 0} onClick={goNext} title="Next (Enter)">
        ↓
      </button>
      <span className="find-count">
        {position && position.total > 0 ? `${position.current}/${position.total}` : `${count} found`}
      </span>
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
