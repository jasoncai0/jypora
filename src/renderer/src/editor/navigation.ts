import { extractOutline, slugify } from '../../../shared/markdown'

/**
 * In-document navigation: outline clicks and `#anchor` link clicks scroll to
 * the matching heading instead of navigating the window.
 */

const HEADING_SELECTOR = '.milkdown h1, .milkdown h2, .milkdown h3, .milkdown h4, .milkdown h5, .milkdown h6'

/** Scroll the Nth document heading (outline order) into view. */
export function scrollToHeadingIndex(index: number): boolean {
  const headings = document.querySelectorAll<HTMLElement>(HEADING_SELECTOR)
  const target = headings[index]
  if (!target) return false
  target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  return true
}

/** Scroll to a heading matching an anchor slug (id first, then slugified text). */
export function scrollToAnchor(rawHash: string): boolean {
  const slug = decodeURIComponent(rawHash.replace(/^#/, '')).toLowerCase()
  if (slug.length === 0) return false

  const byId = document.getElementById(slug)
  if (byId) {
    byId.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return true
  }

  const headings = [...document.querySelectorAll<HTMLElement>(HEADING_SELECTOR)]
  const match = headings.find((h) => slugify(h.textContent ?? '') === slug)
  if (match) {
    match.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return true
  }
  return false
}

/**
 * Position the source-mode textarea caret at the outline heading's line and
 * scroll it into view (approximation by line height).
 */
export function scrollSourceToHeading(textarea: HTMLTextAreaElement, index: number): void {
  const outline = extractOutline(textarea.value)
  const heading = outline[index]
  if (!heading) return
  const lines = textarea.value.split('\n')
  const offset = lines.slice(0, heading.line).reduce((sum, l) => sum + l.length + 1, 0)
  textarea.focus()
  textarea.setSelectionRange(offset, offset)
  const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 24
  textarea.scrollTop = Math.max(0, heading.line * lineHeight - 80)
}

/**
 * Install a capture-phase click handler that intercepts in-document anchor
 * links (`href="#..."`) anywhere in the app and turns them into smooth scrolls.
 * Returns an uninstall function.
 */
export function installAnchorInterceptor(): () => void {
  const handler = (event: MouseEvent): void => {
    const target = event.target as HTMLElement | null
    const anchor = target?.closest?.('a[href^="#"]')
    if (!anchor) return
    event.preventDefault()
    event.stopPropagation()
    scrollToAnchor(anchor.getAttribute('href') ?? '')
  }
  document.addEventListener('click', handler, true)
  return () => document.removeEventListener('click', handler, true)
}
