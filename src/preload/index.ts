import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannel, MenuActionType } from '../shared/ipc'
import { AppSettings, FileNode, OpenFileResult } from '../shared/types'
import { ThemeDefinition } from '../shared/themes'

interface TerminalStartResult {
  readonly ok: boolean
  readonly cwd?: string | null
  readonly error?: string
}

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
  searchWorkspace: (root: string, query: string): Promise<FileNode[]> =>
    ipcRenderer.invoke(IpcChannel.SearchWorkspace, root, query),
  exportHtml: (payload: unknown): Promise<boolean> => ipcRenderer.invoke(IpcChannel.ExportHtml, payload),
  exportPdf: (payload: unknown): Promise<boolean> => ipcRenderer.invoke(IpcChannel.ExportPdf, payload),
  exportDocx: (payload: unknown): Promise<boolean> => ipcRenderer.invoke(IpcChannel.ExportDocx, payload),
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke(IpcChannel.GetSettings),
  setSetting: (key: keyof AppSettings, value: unknown): Promise<AppSettings> =>
    ipcRenderer.invoke(IpcChannel.SetSetting, key, value),
  getThemes: (): Promise<ThemeDefinition[]> => ipcRenderer.invoke(IpcChannel.GetThemes),
  // Embedded terminal
  terminalStart: (docPath: string | null, cols: number, rows: number): Promise<TerminalStartResult> =>
    ipcRenderer.invoke(IpcChannel.TerminalStart, docPath, cols, rows),
  terminalInput: (data: string): void => ipcRenderer.send(IpcChannel.TerminalInput, data),
  terminalResize: (cols: number, rows: number): void =>
    ipcRenderer.send(IpcChannel.TerminalResize, cols, rows),
  terminalKill: (): void => ipcRenderer.send(IpcChannel.TerminalKill),
  onTerminalData: (handler: (data: string) => void): (() => void) => {
    const listener = (_e: unknown, data: string): void => handler(data)
    ipcRenderer.on(IpcChannel.TerminalData, listener)
    return () => ipcRenderer.removeListener(IpcChannel.TerminalData, listener)
  },
  onTerminalExit: (handler: (code: number) => void): (() => void) => {
    const listener = (_e: unknown, code: number): void => handler(code)
    ipcRenderer.on(IpcChannel.TerminalExit, listener)
    return () => ipcRenderer.removeListener(IpcChannel.TerminalExit, listener)
  },
  onMenuAction: (handler: (action: MenuActionType) => void): (() => void) => {
    const listener = (_e: unknown, action: MenuActionType): void => handler(action)
    ipcRenderer.on(IpcChannel.MenuAction, listener)
    return () => ipcRenderer.removeListener(IpcChannel.MenuAction, listener)
  },
  onOpenRecent: (handler: (path: string) => void): (() => void) => {
    const listener = (_e: unknown, path: string): void => handler(path)
    ipcRenderer.on(IpcChannel.OpenRecent, listener)
    return () => ipcRenderer.removeListener(IpcChannel.OpenRecent, listener)
  }
}

export type JyporaApi = typeof api

contextBridge.exposeInMainWorld('jypora', api)
