/**
 * Map a file/directory name to a small icon (emoji) used in the sidebar to
 * distinguish file types at a glance. Pure and data-driven so new types are a
 * one-line change and everything stays unit-testable.
 */

const EXTENSION_ICONS: Readonly<Record<string, string>> = {
  md: '📝',
  markdown: '📝',
  mdown: '📝',
  mkd: '📝',
  txt: '📄',
  json: '🔧',
  yaml: '🔧',
  yml: '🔧',
  toml: '🔧',
  js: '📜',
  jsx: '📜',
  ts: '📘',
  tsx: '📘',
  css: '🎨',
  scss: '🎨',
  html: '🌐',
  png: '🖼️',
  jpg: '🖼️',
  jpeg: '🖼️',
  gif: '🖼️',
  svg: '🖼️',
  webp: '🖼️',
  pdf: '📕',
  csv: '📊',
  sh: '⚙️',
  zip: '📦'
}

export const DIRECTORY_ICON = '📁'
export const DIRECTORY_OPEN_ICON = '📂'
const DEFAULT_FILE_ICON = '📄'

/** Extract the lowercase extension (without dot), or '' if none. */
export function fileExtension(name: string): string {
  const dot = name.lastIndexOf('.')
  if (dot <= 0 || dot === name.length - 1) return ''
  return name.slice(dot + 1).toLowerCase()
}

/** Icon for a file or directory. Directories use open/closed variants. */
export function iconFor(name: string, isDirectory: boolean, expanded = false): string {
  if (isDirectory) return expanded ? DIRECTORY_OPEN_ICON : DIRECTORY_ICON
  return EXTENSION_ICONS[fileExtension(name)] ?? DEFAULT_FILE_ICON
}
