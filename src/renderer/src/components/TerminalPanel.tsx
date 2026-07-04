import { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

interface TerminalPanelProps {
  /** Directory to open the shell in — the current document's folder. */
  readonly docPath: string | null
}

/**
 * Collapsible embedded terminal (the "agent" panel). Runs the user's shell via
 * node-pty in the main process, opened in the current document's directory so
 * you can drive CLI agents right where the file lives. True iTerm2 embedding is
 * not possible across the process boundary, so this integrated terminal fills
 * that role and can host any CLI tool.
 */
export function TerminalPanel({ docPath }: TerminalPanelProps): JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const term = new Terminal({
      fontFamily: 'SFMono-Regular, Consolas, monospace',
      fontSize: 13,
      cursorBlink: true,
      theme: { background: '#1e1e1e', foreground: '#d4d4d4' }
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(host)
    fit.fit()

    const offData = window.jypora.onTerminalData((data) => term.write(data))
    const offExit = window.jypora.onTerminalExit(() => term.write('\r\n[process exited]\r\n'))

    window.jypora
      .terminalStart(docPath, term.cols, term.rows)
      .then((res) => {
        if (!res.ok) setError(res.error ?? 'Terminal unavailable')
      })
      .catch((e) => setError(String(e)))

    term.onData((data) => window.jypora.terminalInput(data))

    const handleResize = (): void => {
      fit.fit()
      window.jypora.terminalResize(term.cols, term.rows)
    }
    window.addEventListener('resize', handleResize)
    const observer = new ResizeObserver(handleResize)
    observer.observe(host)

    return () => {
      window.removeEventListener('resize', handleResize)
      observer.disconnect()
      offData()
      offExit()
      window.jypora.terminalKill()
      term.dispose()
    }
    // Restart the shell when the document directory changes.
  }, [docPath])

  return (
    <div className="jypora-terminal">
      <div className="terminal-header">Terminal{docPath ? ` — ${docPath.replace(/\/[^/]*$/, '')}` : ''}</div>
      {error ? <div className="terminal-error">{error}</div> : <div ref={hostRef} className="terminal-host" />}
    </div>
  )
}
