/**
 * IPC channel names shared between the main and renderer processes.
 * Keeping these centralized avoids typo drift across the process boundary.
 */
export const IpcChannel = {
  FileOpen: 'file:open',
  FileOpenPath: 'file:open-path',
  FileSave: 'file:save',
  FileSaveAs: 'file:save-as',
  FileNew: 'file:new',
  DialogOpenFolder: 'dialog:open-folder',
  ReadDir: 'fs:read-dir',
  ExportHtml: 'export:html',
  ExportPdf: 'export:pdf',
  ExportDocx: 'export:docx',
  GetSettings: 'settings:get',
  SetSetting: 'settings:set',
  // main -> renderer
  MenuAction: 'menu:action'
} as const

export type IpcChannelName = (typeof IpcChannel)[keyof typeof IpcChannel]

/** Actions dispatched from the native menu into the renderer. */
export type MenuActionType =
  | 'new'
  | 'open'
  | 'save'
  | 'save-as'
  | 'toggle-source'
  | 'toggle-sidebar'
  | 'toggle-outline'
  | 'toggle-focus'
  | 'toggle-typewriter'
  | 'find'
  | 'export-html'
  | 'export-pdf'
  | 'export-docx'
  | 'theme-light'
  | 'theme-dark'
