/**
 * Pure Markdown analysis helpers. No DOM or Node dependencies so they can be
 * unit-tested in isolation and reused by both processes.
 */

export interface OutlineHeading {
  readonly level: number
  readonly text: string
  readonly line: number
  readonly slug: string
}

const ATX_HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/
const FENCE = /^(```|~~~)/

/** Convert heading text into a URL-friendly slug (GitHub-style). */
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w一-龥\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Extract the heading outline from Markdown source. Headings inside fenced code
 * blocks are ignored so `# not a heading` in a code sample does not appear.
 */
export function extractOutline(markdown: string): OutlineHeading[] {
  const lines = markdown.split(/\r?\n/)
  const out: OutlineHeading[] = []
  const seen = new Map<string, number>()
  let inFence = false

  lines.forEach((line, index) => {
    if (FENCE.test(line.trim())) {
      inFence = !inFence
      return
    }
    if (inFence) return

    const match = ATX_HEADING.exec(line)
    if (!match) return

    const level = match[1].length
    const text = match[2].trim()
    if (text.length === 0) return

    const base = slugify(text) || `heading-${index}`
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    const slug = count === 0 ? base : `${base}-${count}`

    out.push({ level, text, line: index, slug })
  })

  return out
}

/** Count words, treating CJK characters as individual words. */
export function countWords(text: string): number {
  const cjk = text.match(/[一-龥぀-ヿ]/g)?.length ?? 0
  const words =
    text
      .replace(/[一-龥぀-ヿ]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean).length
  return cjk + words
}

/** Count characters excluding line breaks. */
export function countChars(text: string): number {
  return text.replace(/\r?\n/g, '').length
}

/** Estimated reading time in minutes (200 wpm), always at least 1 for content. */
export function readingTimeMinutes(text: string): number {
  const words = countWords(text)
  if (words === 0) return 0
  return Math.max(1, Math.round(words / 200))
}
