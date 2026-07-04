import { MutableRefObject, useEffect, useRef } from 'react'
import { Crepe } from '@milkdown/crepe'
import '@milkdown/crepe/theme/common/style.css'
import { FormatAction, runFormat } from '../editor/format'
import { renderMermaidPreview } from '../editor/mermaidPreview'

/** Dispatcher the app uses to run formatting hotkeys against the live editor. */
export type FormatDispatch = (action: FormatAction) => void

interface EditorProps {
  readonly value: string
  readonly sourceMode: boolean
  readonly typewriterMode: boolean
  readonly onChange: (markdown: string) => void
  /** Populated with a format dispatcher while the WYSIWYG editor is mounted. */
  readonly formatRef: MutableRefObject<FormatDispatch | null>
}

/**
 * The core editing surface. In WYSIWYG mode it hosts a Milkdown Crepe editor
 * (with live Mermaid previews); in source mode it falls back to a raw Markdown
 * textarea. The Crepe instance is created once per opened document and destroyed
 * on cleanup.
 */
export function Editor({ value, sourceMode, typewriterMode, onChange, formatRef }: EditorProps): JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (sourceMode || !hostRef.current) return
    let disposed = false
    const crepe = new Crepe({
      root: hostRef.current,
      defaultValue: value,
      featureConfigs: {
        [Crepe.Feature.CodeMirror]: { renderPreview: renderMermaidPreview }
      }
    })
    crepe.on((manager) => {
      manager.markdownUpdated((_ctx, markdown) => onChangeRef.current(markdown))
    })
    crepe
      .create()
      .then(() => {
        if (disposed) {
          crepe.destroy()
          return
        }
        formatRef.current = (action) => runFormat(crepe.editor, action)
      })
      .catch((error) => console.error('Failed to initialize editor:', error))

    return () => {
      disposed = true
      formatRef.current = null
      crepe.destroy().catch(() => undefined)
    }
    // Recreate only when switching modes — content edits flow through Crepe itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceMode])

  if (sourceMode) {
    return (
      <textarea
        className={`jypora-source ${typewriterMode ? 'typewriter' : ''}`}
        value={value}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Markdown source"
      />
    )
  }

  return <div ref={hostRef} className={`jypora-wysiwyg ${typewriterMode ? 'typewriter' : ''}`} />
}
