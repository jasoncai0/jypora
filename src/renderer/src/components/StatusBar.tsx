import { useMemo } from 'react'
import { countChars, countWords, readingTimeMinutes } from '../../../shared/markdown'

interface StatusBarProps {
  readonly content: string
  readonly dirty: boolean
  readonly sourceMode: boolean
}

export function StatusBar({ content, dirty, sourceMode }: StatusBarProps): JSX.Element {
  const stats = useMemo(
    () => ({
      words: countWords(content),
      chars: countChars(content),
      minutes: readingTimeMinutes(content)
    }),
    [content]
  )

  return (
    <footer className="jypora-statusbar">
      <span>{sourceMode ? 'Source' : 'Live'}</span>
      <span>{stats.words} words</span>
      <span>{stats.chars} chars</span>
      <span>{stats.minutes} min read</span>
      <span className="status-spacer" />
      {dirty && <span className="status-dirty">● Unsaved</span>}
    </footer>
  )
}
