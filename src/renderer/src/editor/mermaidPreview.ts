import mermaid from 'mermaid'

/**
 * Live Mermaid rendering for code blocks. Wired into Crepe's code-mirror feature
 * via `renderPreview`: when a fenced block's language is `mermaid`, we render it
 * to SVG and show it as the block preview. Errors render inline instead of
 * throwing so a malformed diagram never breaks editing.
 */

let initialized = false
let counter = 0

function ensureInit(): void {
  if (initialized) return
  mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' })
  initialized = true
}

export function isMermaidLanguage(language: string): boolean {
  return language.trim().toLowerCase() === 'mermaid'
}

/** Crepe `renderPreview` implementation. */
export function renderMermaidPreview(
  language: string,
  content: string,
  applyPreview: (value: null | string | HTMLElement) => void
): void | null | string {
  if (!isMermaidLanguage(language)) return null
  if (content.trim().length === 0) {
    applyPreview(null)
    return null
  }

  ensureInit()
  counter += 1
  const id = `jypora-mermaid-${counter}`

  mermaid
    .render(id, content)
    .then(({ svg }) => {
      const wrapper = document.createElement('div')
      wrapper.className = 'jypora-mermaid'
      wrapper.innerHTML = svg
      applyPreview(wrapper)
    })
    .catch((error: unknown) => {
      const errEl = document.createElement('div')
      errEl.className = 'jypora-mermaid-error'
      errEl.textContent = `Mermaid error: ${error instanceof Error ? error.message : String(error)}`
      applyPreview(errEl)
    })

  return 'Rendering diagram…'
}
