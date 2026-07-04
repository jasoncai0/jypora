import { useCallback, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'

export interface PanelSizeOptions {
  /** Starting size in px when nothing is persisted. */
  readonly initial: number
  readonly min: number
  readonly max: number
  /** Which pointer axis drives the resize. */
  readonly axis: 'x' | 'y'
  /**
   * +1 when dragging toward positive axis grows the panel (left sidebar),
   * -1 when dragging toward negative axis grows it (right/bottom panels).
   */
  readonly sign: 1 | -1
}

export function clampSize(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function loadPersisted(key: string, fallback: number, min: number, max: number): number {
  try {
    const raw = window.localStorage.getItem(`jypora:panel:${key}`)
    const parsed = raw === null ? NaN : Number(raw)
    return Number.isFinite(parsed) && parsed > 0 ? clampSize(parsed, min, max) : fallback
  } catch {
    return fallback
  }
}

/**
 * Drag-to-resize state for a panel. Returns the current size and a mousedown
 * handler for the resize handle; sizes persist per-key in localStorage.
 */
export function usePanelSize(
  key: string,
  options: PanelSizeOptions
): { size: number; beginDrag: (e: ReactMouseEvent) => void } {
  const { initial, min, max, axis, sign } = options
  const [size, setSize] = useState(() => loadPersisted(key, initial, min, max))
  const sizeRef = useRef(size)
  sizeRef.current = size

  const beginDrag = useCallback(
    (event: ReactMouseEvent) => {
      event.preventDefault()
      const start = axis === 'x' ? event.clientX : event.clientY
      const startSize = sizeRef.current
      const prevCursor = document.body.style.cursor
      const prevSelect = document.body.style.userSelect
      document.body.style.cursor = axis === 'x' ? 'col-resize' : 'row-resize'
      document.body.style.userSelect = 'none'

      const onMove = (ev: MouseEvent): void => {
        const current = axis === 'x' ? ev.clientX : ev.clientY
        setSize(clampSize(startSize + sign * (current - start), min, max))
      }
      const onUp = (): void => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        document.body.style.cursor = prevCursor
        document.body.style.userSelect = prevSelect
        try {
          window.localStorage.setItem(`jypora:panel:${key}`, String(sizeRef.current))
        } catch {
          /* persistence is best-effort */
        }
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [key, axis, sign, min, max]
  )

  return { size, beginDrag }
}
