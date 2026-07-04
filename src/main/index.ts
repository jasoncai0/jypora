import { app, BrowserWindow, ipcMain, nativeTheme } from 'electron'
import { createWindow } from './window'
import { buildMenu } from './menu'
import { registerFileHandlers } from './ipc/file-handlers'
import { registerExportHandlers } from './ipc/export-handlers'
import { getSettings, setSetting } from './settings'
import { IpcChannel } from '../shared/ipc'
import { AppSettings } from '../shared/types'

let mainWindow: BrowserWindow | null = null
const getWindow = (): BrowserWindow | null => mainWindow

function registerSettingsHandlers(): void {
  ipcMain.handle(IpcChannel.GetSettings, () => getSettings())
  ipcMain.handle(IpcChannel.SetSetting, (_e, key: keyof AppSettings, value: unknown) => {
    return setSetting(key, value as AppSettings[keyof AppSettings])
  })
}

app.whenReady().then(() => {
  registerFileHandlers(getWindow)
  registerExportHandlers(getWindow)
  registerSettingsHandlers()

  mainWindow = createWindow()
  buildMenu(getWindow)

  nativeTheme.on('updated', () => {
    mainWindow?.webContents.send(IpcChannel.MenuAction, nativeTheme.shouldUseDarkColors ? 'theme-dark' : 'theme-light')
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow()
      buildMenu(getWindow)
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
