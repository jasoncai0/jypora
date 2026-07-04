import { existsSync } from 'node:fs'
import { dirname } from 'node:path'
import { homedir } from 'node:os'
import { ipcMain, BrowserWindow } from 'electron'
import { IpcChannel } from '../../shared/ipc'

/**
 * Embedded terminal backend using node-pty. Spawns the user's shell in the
 * directory of the current document (falling back to home), streaming output to
 * the renderer's xterm panel. node-pty is a native module and is required
 * lazily so a build/ABI issue degrades to "terminal unavailable" instead of
 * crashing the whole app.
 */

interface PtyLike {
  write(data: string): void
  resize(cols: number, rows: number): void
  kill(): void
  onData(cb: (data: string) => void): void
  onExit(cb: (e: { exitCode: number }) => void): void
}

let pty: PtyLike | null = null

function resolveCwd(docPath: string | null): string {
  if (docPath) {
    const dir = dirname(docPath)
    if (existsSync(dir)) return dir
  }
  return homedir()
}

function defaultShell(): string {
  return process.env.SHELL || (process.platform === 'win32' ? 'powershell.exe' : '/bin/zsh')
}

export function registerTerminalHandlers(getWindow: () => BrowserWindow | null): void {
  ipcMain.handle(IpcChannel.TerminalStart, (_e, docPath: string | null, cols = 80, rows = 24) => {
    if (pty) return { ok: true, cwd: null } // already running

    let nodePty: typeof import('node-pty')
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      nodePty = require('node-pty')
    } catch (error) {
      console.error('node-pty unavailable:', error)
      return { ok: false, error: 'Terminal backend unavailable (node-pty failed to load).' }
    }

    const cwd = resolveCwd(docPath)
    const proc = nodePty.spawn(defaultShell(), [], {
      name: 'xterm-color',
      cols,
      rows,
      cwd,
      env: process.env as Record<string, string>
    })
    pty = proc as unknown as PtyLike

    proc.onData((data) => getWindow()?.webContents.send(IpcChannel.TerminalData, data))
    proc.onExit(({ exitCode }) => {
      getWindow()?.webContents.send(IpcChannel.TerminalExit, exitCode)
      pty = null
    })
    return { ok: true, cwd }
  })

  ipcMain.on(IpcChannel.TerminalInput, (_e, data: string) => pty?.write(data))
  ipcMain.on(IpcChannel.TerminalResize, (_e, cols: number, rows: number) => {
    if (cols > 0 && rows > 0) pty?.resize(cols, rows)
  })
  ipcMain.on(IpcChannel.TerminalKill, () => {
    pty?.kill()
    pty = null
  })
}
