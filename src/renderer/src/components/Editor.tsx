import { useEffect, useRef } from 'react'
import { Crepe } from '@milkdown/crepe'
import '@milkdown/crepe/theme/common/style.css'

interface EditorProps {
  readonly value: string
  readonly sourceMode: boolean
  readonly typewriterMode: boolean
  readonly onChange: (markdown: string) => void
}

/**
 * The core editing surface. In WYSIWYG mode it hosts a Milkdown Crepe editor;
 * in source mode it falls back to a raw Markdown textarea. The Crepe instance
 * is created once per opened document (keyed by mount) and destroyed on cleanup.
 */
export function Editor({ value, sourceMode, typewriterMode, onChange }: EditorProps): JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null)
  const crepeRef = useRef<Crepe | null>(null)
  // Keep the latest onChange without re-creating the editor on every render.
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (sourceMode || !hostRef.current) return
    let disposed = false
    const crepe = new Crepe({ root: hostRef.current, defaultValue: value })
    crepe.on((manager) => {
      manager.markdownUpdated((_ctx, markdown) => onChangeRef.current(markdown))
    })
    crepe
      .create()
      .then(() => {
        if (disposed) crepe.destroy()
        else crepeRef.current = crepe
      })
      .catch((error) => console.error('Failed to initialize editor:', error))

    return () => {
      disposed = true
      crepeRef.current = null
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
