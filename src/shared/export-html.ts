import { MERMAID_EXPORT_SCRIPT, mermaidToPreTags } from './mermaid'

/**
 * Build a self-contained HTML document from rendered body HTML. Pure function
 * so it can be unit-tested and reused by the export pipeline. Mermaid code
 * blocks are converted to renderable `<pre class="mermaid">` and the mermaid
 * runtime is injected only when diagrams are present.
 */

export interface HtmlExportOptions {
  readonly title: string
  readonly bodyHtml: string
  readonly theme?: 'light' | 'dark'
}

const BASE_CSS = `
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    line-height: 1.7; max-width: 860px; margin: 0 auto; padding: 40px 20px; }
  pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow: auto; }
  code { font-family: "SFMono-Regular", Consolas, monospace; }
  blockquote { border-left: 4px solid #dfe2e5; margin: 0; padding: 0 1em; color: #6a737d; }
  table { border-collapse: collapse; }
  th, td { border: 1px solid #dfe2e5; padding: 6px 13px; }
  img { max-width: 100%; }
`

const DARK_CSS = `
  body { background: #1e1e1e; color: #d4d4d4; }
  pre { background: #2d2d2d; }
  blockquote { border-left-color: #444; color: #999; }
  th, td { border-color: #444; }
`

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function buildHtmlDocument(options: HtmlExportOptions): string {
  const theme = options.theme ?? 'light'
  const themeCss = theme === 'dark' ? DARK_CSS : ''
  const body = mermaidToPreTags(options.bodyHtml)
  const mermaidScript = body.includes('class="mermaid"') ? MERMAID_EXPORT_SCRIPT : ''
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(options.title)}</title>
<style>${BASE_CSS}${themeCss}</style>
</head>
<body>
${body}
${mermaidScript}
</body>
</html>`
}
