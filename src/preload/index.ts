import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannel, MenuActionType } from '../shared/ipc'
import { AppSettings, FileNode, OpenFileResult } from '../shared/types'

/**
 * The typed bridge exposed to the renderer as `window.jypora`. The renderer has
 * no direct Node/Electron access; everything crosses through these functions.
 */
const api = {
  openFile: (): Promise<OpenFileResult | null> => ipcRenderer.invoke(IpcChannel.FileOpen),
  openFilePath: (path: string): Promise<OpenFileResult | null> =>
    ipcRenderer.invoke(IpcChannel.FileOpenPath, path),
  saveFile: (path: string, content: string): Promise<boolean> =>
    ipcRenderer.invoke(IpcChannel.FileSave, path, content),
  saveFileAs: (content: string): Promise<string | null> =>
    ipcRenderer.invoke(IpcChannel.FileSaveAs, content),
  openFolder: (): Promise<string | null> => ipcRenderer.invoke(IpcChannel.DialogOpenFolder),
  readDir: (path: string): Promise<FileNode[]> => ipcRenderer.invoke(IpcChannel.ReadDir, path),
  exportHtml: (payload: unknown): Promise<boolean> => ipcRenderer.invoke(IpcChannel.ExportHtml, payload),
  exportPdf: (payload: unknown): Promise<boolean> => ipcRenderer.invoke(IpcChannel.ExportPdf, payload),
  exportDocx: (payload: unknown): Promise<boolean> => ipcRenderer.invoke(IpcChannel.ExportDocx, payload),
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke(IpcChannel.GetSettings),
  setSetting: (key: keyof AppSettings, value: unknown): Promise<AppSettings> =>
    ipcRenderer.invoke(IpcChannel.SetSetting, key, value),
  onMenuAction: (handler: (action: MenuActionType) => void): (() => void) => {
    const listener = (_e: unknown, action: MenuActionType): void => handler(action)
    ipcRenderer.on(IpcChannel.MenuAction, listener)
    return () => ipcRenderer.removeListener(IpcChannel.MenuAction, listener)
  }
}

export type JyporaApi = typeof api

contextBridge.exposeInMainWorld('jypora', api)
