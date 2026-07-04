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
  SearchWorkspace: 'fs:search-workspace',
  SearchContent: 'fs:search-content',
  ImageSave: 'fs:save-image',
  SetDirty: 'doc:set-dirty',
  FindStart: 'find:start',
  FindStop: 'find:stop',
  FindResult: 'find:result',
  ExportHtml: 'export:html',
  ExportPdf: 'export:pdf',
  ExportDocx: 'export:docx',
  GetSettings: 'settings:get',
  SetSetting: 'settings:set',
  GetThemes: 'themes:get',
  CopyText: 'clipboard:copy-text',
  // terminal (embedded agent/terminal panel)
  TerminalStart: 'terminal:start',
  TerminalInput: 'terminal:input',
  TerminalResize: 'terminal:resize',
  TerminalKill: 'terminal:kill',
  TerminalOpenExternal: 'terminal:open-external',
  TerminalData: 'terminal:data',
  TerminalExit: 'terminal:exit',
  // main -> renderer
  MenuAction: 'menu:action',
  OpenRecent: 'menu:open-recent',
  OpenRecentFile: 'menu:open-recent-file'
} as const

export type IpcChannelName = (typeof IpcChannel)[keyof typeof IpcChannel]

/** Actions dispatched from the native menu into the renderer. */
export type MenuActionType =
  | 'new'
  | 'open'
  | 'open-folder'
  | 'save'
  | 'save-as'
  | 'toggle-source'
  | 'toggle-sidebar'
  | 'toggle-outline'
  | 'toggle-terminal'
  | 'open-iterm'
  | 'toggle-focus'
  | 'toggle-typewriter'
  | 'find'
  | 'search-files'
  | 'toggle-autosave'
  | 'copy-markdown'
  | 'copy-html'
  | 'export-html'
  | 'export-pdf'
  | 'export-docx'
  // formatting actions (see renderer/editor/format.ts FormatAction)
  | 'fmt:bold'
  | 'fmt:italic'
  | 'fmt:strike'
  | 'fmt:inline-code'
  | 'fmt:link'
  | 'fmt:code-block'
  | 'fmt:quote'
  | 'fmt:bullet-list'
  | 'fmt:ordered-list'
  | 'fmt:hr'
  | 'fmt:table'
  | 'fmt:paragraph'
  | 'fmt:heading-1'
  | 'fmt:heading-2'
  | 'fmt:heading-3'
  | 'fmt:heading-4'
  | 'fmt:heading-5'
  | 'fmt:heading-6'
  // theme selection carries the theme id
  | `theme:${string}`
