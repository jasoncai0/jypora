import { app, BrowserWindow, ipcMain, nativeTheme } from 'electron'
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
  buildMenu(getWindow, {
    themes,
    recentWorkspaces: getSettings().recentWorkspaces,
    activeThemeId: getSettings().themeId
  })
}

function registerSettingsHandlers(): void {
  ipcMain.handle(IpcChannel.GetSettings, () => getSettings())
  ipcMain.handle(IpcChannel.SetSetting, (_e, key: keyof AppSettings, value: unknown) => {
    const next = setSetting(key, value as AppSettings[keyof AppSettings])
    if (key === 'themeId' || key === 'recentWorkspaces') refreshMenu()
    return next
  })
  ipcMain.handle(IpcChannel.GetThemes, () => themes)
}

app.whenReady().then(async () => {
  await ensureThemesDir()
  themes = await getAllThemes()

  registerFileHandlers(getWindow)
  registerExportHandlers(getWindow)
  registerTerminalHandlers(getWindow)
  registerSettingsHandlers()

  mainWindow = createWindow()
  refreshMenu()

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
      refreshMenu()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
