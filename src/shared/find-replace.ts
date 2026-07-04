/** Pure text search/replace helpers used by the Find & Replace panel. */

export interface FindMatch {
  readonly start: number
  readonly end: number
}

export interface FindOptions {
  readonly caseSensitive?: boolean
  readonly wholeWord?: boolean
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildPattern(query: string, options: FindOptions): RegExp | null {
  if (query.length === 0) return null
  const flags = options.caseSensitive ? 'g' : 'gi'
  const body = options.wholeWord ? `\\b${escapeRegExp(query)}\\b` : escapeRegExp(query)
  return new RegExp(body, flags)
}

/** Return every match position of `query` within `text`. */
export function findAll(text: string, query: string, options: FindOptions = {}): FindMatch[] {
  const pattern = buildPattern(query, options)
  if (!pattern) return []
  const matches: FindMatch[] = []
  for (const m of text.matchAll(pattern)) {
    if (m.index === undefined) continue
    matches.push({ start: m.index, end: m.index + m[0].length })
    if (m[0].length === 0) pattern.lastIndex++ // guard against zero-length loops
  }
  return matches
}

/** Replace all occurrences of `query` with `replacement`. */
export function replaceAll(
  text: string,
  query: string,
  replacement: string,
  options: FindOptions = {}
): string {
  const pattern = buildPattern(query, options)
  if (!pattern) return text
  return text.replace(pattern, replacement)
}

/** Index of the next match at or after `from`, wrapping to the start. */
export function nextMatchIndex(matches: readonly FindMatch[], from: number): number {
  if (matches.length === 0) return -1
  const idx = matches.findIndex((m) => m.start >= from)
  return idx === -1 ? 0 : idx
}
