/**
 * Pure helpers for locating Mermaid diagram code blocks in Markdown. Rendering
 * itself is done with the `mermaid` library in the renderer; this module just
 * finds the blocks and prepares export HTML, so it stays testable.
 */

export interface MermaidBlock {
  readonly code: string
  readonly index: number
}

const MERMAID_FENCE = /^```mermaid[^\n]*\n([\s\S]*?)\n```/gm

/** Extract the source of every ```mermaid fenced block, in document order. */
export function extractMermaidBlocks(markdown: string): MermaidBlock[] {
  const blocks: MermaidBlock[] = []
  let match: RegExpExecArray | null
  MERMAID_FENCE.lastIndex = 0
  while ((match = MERMAID_FENCE.exec(markdown)) !== null) {
    blocks.push({ code: match[1].trim(), index: match.index })
  }
  return blocks
}

export function hasMermaid(markdown: string): boolean {
  MERMAID_FENCE.lastIndex = 0
  return MERMAID_FENCE.test(markdown)
}

/**
 * For HTML export, rewrite ```mermaid fences into `<pre class="mermaid">` blocks
 * that the mermaid runtime auto-renders. Other code fences are left untouched.
 */
export function mermaidToPreTags(bodyHtml: string): string {
  // Rendered HTML uses <code class="language-mermaid"> inside <pre>.
  return bodyHtml.replace(
    /<pre[^>]*>\s*<code class="language-mermaid">([\s\S]*?)<\/code>\s*<\/pre>/g,
    (_all, code: string) => `<pre class="mermaid">${decodeEntities(code)}</pre>`
  )
}

function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

/** Script tag that boots mermaid in an exported HTML document. */
export const MERMAID_EXPORT_SCRIPT =
  '<script type="module">' +
  "import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';" +
  'mermaid.initialize({ startOnLoad: true });' +
  '</script>'
