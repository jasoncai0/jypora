/** A document open in the editor. */
export interface DocumentState {
  readonly filePath: string | null
  readonly content: string
  readonly savedContent: string
}

export interface FileNode {
  readonly name: string
  readonly path: string
  readonly isDirectory: boolean
  readonly children?: readonly FileNode[]
}

export interface OpenFileResult {
  readonly filePath: string
  readonly content: string
}

/** One line-level hit from cross-file content search. */
export interface ContentMatch {
  readonly path: string
  readonly name: string
  readonly line: number
  readonly preview: string
}

export type ThemeName = 'light' | 'dark'

export interface AppSettings {
  readonly themeId: string
  readonly followSystemTheme: boolean
  readonly autoSave: boolean
  readonly autoSaveDelayMs: number
  readonly sidebarVisible: boolean
  readonly outlineVisible: boolean
  readonly terminalVisible: boolean
  readonly recentWorkspaces: readonly string[]
  readonly recentFiles: readonly string[]
}

export const DEFAULT_SETTINGS: AppSettings = {
  themeId: 'light',
  followSystemTheme: true,
  autoSave: false,
  autoSaveDelayMs: 1500,
  sidebarVisible: true,
  outlineVisible: false,
  terminalVisible: false,
  recentWorkspaces: [],
  recentFiles: []
}

/** True when the document has unsaved edits. */
export function isDirty(doc: DocumentState): boolean {
  return doc.content !== doc.savedContent
}
