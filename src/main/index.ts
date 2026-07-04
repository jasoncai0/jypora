import { app, BrowserWindow, clipboard, dialog, ipcMain, nativeTheme } from 'electron'
import { createWindow } from './window'
import { buildMenu } from './menu'
import { registerFileHandlers } from './ipc/file-handlers'
import { registerExportHandlers } from './ipc/export-handlers'
import { registerTerminalHandlers } from './ipc/terminal'
import { getSettings, setSetting } from './settings'
import { getAllThemes, ensureThemesDir } from './theme-loader'
import { IpcChannel } from '../shared/ipc'
import { AppSettings } from '../shared/types'
import { ThemeDefinition } from '../shared/themes'

let mainWindow: BrowserWindow | null = null
let themes: ThemeDefinition[] = []
const getWindow = (): BrowserWindow | null => mainWindow

/** Rebuild the native menu with the latest themes + recent workspaces. */
function refreshMenu(): void {
  const settings = getSettings()
  buildMenu(getWindow, {
    themes,
    recentWorkspaces: settings.recentWorkspaces,
    recentFiles: settings.recentFiles,
    activeThemeId: settings.themeId,
    autoSave: settings.autoSave,
    spellCheck: settings.spellCheck
  })
}

/** Apply the persisted spell-check preference to the session. */
function applySpellCheck(): void {
  mainWindow?.webContents.session.setSpellCheckerEnabled(getSettings().spellCheck)
}

function registerSettingsHandlers(): void {
  ipcMain.handle(IpcChannel.GetSettings, () => getSettings())
  ipcMain.handle(IpcChannel.SetSetting, (_e, key: keyof AppSettings, value: unknown) => {
    const next = setSetting(key, value as AppSettings[keyof AppSettings])
    if (
      key === 'themeId' ||
      key === 'recentWorkspaces' ||
      key === 'recentFiles' ||
      key === 'autoSave' ||
      key === 'spellCheck'
    ) {
      refreshMenu()
    }
    if (key === 'spellCheck') applySpellCheck()
    return next
  })
  ipcMain.handle(IpcChannel.GetThemes, () => themes)
  ipcMain.handle(IpcChannel.CopyText, (_e, text: string) => {
    if (typeof text !== 'string') return false
    clipboard.writeText(text)
    return true
  })
}

/** Native in-page find: highlights matches and reports n/m to the renderer. */
function registerFindHandlers(): void {
  // Note: Electron's `findNext` option means "begin a NEW find session" —
  // true for the first request of a query, false for next/prev follow-ups.
  ipcMain.on(IpcChannel.FindStart, (_e, text: string, forward: boolean, first: boolean) => {
    const contents = mainWindow?.webContents
    if (!contents || typeof text !== 'string' || text.length === 0) return
    contents.findInPage(text, { forward: forward !== false, findNext: first === true })
  })
  ipcMain.on(IpcChannel.FindStop, (_e, keepSelection: boolean) => {
    mainWindow?.webContents.stopFindInPage(keepSelection ? 'keepSelection' : 'clearSelection')
  })
}

/** Track document dirtiness and confirm before closing with unsaved changes. */
let docIsDirty = false
let forceClose = false

function registerCloseGuard(win: BrowserWindow): void {
  win.on('close', (event) => {
    if (!docIsDirty || forceClose) return
    event.preventDefault()
    void dialog
      .showMessageBox(win, {
        type: 'warning',
        buttons: ['Save', "Don't Save", 'Cancel'],
        defaultId: 0,
        cancelId: 2,
        message: 'You have unsaved changes.',
        detail: 'Do you want to save your changes before closing?'
      })
      .then(({ response }) => {
        if (response === 2) return // Cancel
        if (response === 1) {
          forceClose = true
          win.close()
          return
        }
        // Save: ask the renderer to save, then close once the dirty flag clears.
        win.webContents.send(IpcChannel.MenuAction, 'save')
        const started = Date.now()
        const timer = setInterval(() => {
          if (!docIsDirty) {
            clearInterval(timer)
            forceClose = true
            win.close()
          } else if (Date.now() - started > 15_000) {
            clearInterval(timer) // save dialog canceled or failed — stay open
          }
        }, 100)
      })
  })
}

/** Per-window wiring: find-result forwarding and the unsaved-changes guard. */
function wireWindow(win: BrowserWindow): void {
  win.webContents.on('found-in-page', (_e, result) => {
    win.webContents.send(IpcChannel.FindResult, {
      activeMatchOrdinal: result.activeMatchOrdinal,
      matches: result.matches
    })
  })
  registerCloseGuard(win)
}

app.whenReady().then(async () => {
  await ensureThemesDir()
  themes = await getAllThemes()

  registerFileHandlers(getWindow, refreshMenu)
  registerExportHandlers(getWindow)
  registerTerminalHandlers(getWindow)
  registerSettingsHandlers()
  registerFindHandlers()
  ipcMain.on(IpcChannel.SetDirty, (_e, value: boolean) => {
    docIsDirty = value === true
  })

  mainWindow = createWindow()
  wireWindow(mainWindow)
  refreshMenu()
  applySpellCheck()

  nativeTheme.on('updated', () => {
    if (!getSettings().followSystemTheme) return
    mainWindow?.webContents.send(
      IpcChannel.MenuAction,
      nativeTheme.shouldUseDarkColors ? 'theme:dark' : 'theme:light'
    )
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow()
      wireWindow(mainWindow)
      refreshMenu()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
