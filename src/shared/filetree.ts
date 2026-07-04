import { FileNode } from './types'

/** Markdown file extensions jypora treats as editable documents. */
export const MARKDOWN_EXTENSIONS = ['.md', '.markdown', '.mdown', '.mkd'] as const

export function isMarkdownFile(name: string): boolean {
  const lower = name.toLowerCase()
  return MARKDOWN_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

/** Hidden files/dirs and heavy folders we never want to list. */
const IGNORED = new Set(['node_modules', '.git', '.DS_Store'])

export function shouldIgnore(name: string): boolean {
  return name.startsWith('.') || IGNORED.has(name)
}

interface RawEntry {
  readonly name: string
  readonly path: string
  readonly isDirectory: boolean
}

/**
 * Sort entries directories-first then alphabetically, filtering ignored and
 * non-markdown files. Directories are always kept so the tree stays navigable.
 */
export function buildFileNodes(entries: readonly RawEntry[]): FileNode[] {
  return entries
    .filter((e) => !shouldIgnore(e.name))
    .filter((e) => e.isDirectory || isMarkdownFile(e.name))
    .sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    .map((e) => ({ name: e.name, path: e.path, isDirectory: e.isDirectory }))
}
