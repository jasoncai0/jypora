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

export type ThemeName = 'light' | 'dark'

export interface AppSettings {
  readonly theme: ThemeName
  readonly followSystemTheme: boolean
  readonly autoSave: boolean
  readonly autoSaveDelayMs: number
  readonly sidebarVisible: boolean
  readonly outlineVisible: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  followSystemTheme: true,
  autoSave: false,
  autoSaveDelayMs: 1500,
  sidebarVisible: true,
  outlineVisible: false
}

/** True when the document has unsaved edits. */
export function isDirty(doc: DocumentState): boolean {
  return doc.content !== doc.savedContent
}
