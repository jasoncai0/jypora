import { promises as fs } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { dialog, ipcMain, BrowserWindow } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import { buildFileNodes, isMarkdownFile, shouldIgnore } from '../../shared/filetree'
import { fuzzyMatch, rankMatches } from '../../shared/search'
import { ContentMatch, FileNode, OpenFileResult } from '../../shared/types'
import { pushRecentFile, pushRecentWorkspace } from '../settings'

const MAX_SEARCH_RESULTS = 200
const MAX_SEARCH_DEPTH = 6
const MAX_CONTENT_RESULTS = 100
const MAX_PREVIEW_LENGTH = 120

/** Collect every markdown file path under `root` (bounded walk). */
async function collectMarkdownFiles(root: string): Promise<string[]> {
  const files: string[] = []
  async function walk(dir: string, depth: number): Promise<void> {
    if (depth > MAX_SEARCH_DEPTH) return
    let entries: import('node:fs').Dirent[]
    try {
      entries = await fs.readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (shouldIgnore(entry.name)) continue
      const full = join(dir, entry.name)
      if (entry.isDirectory()) await walk(full, depth + 1)
      else if (isMarkdownFile(entry.name)) files.push(full)
    }
  }
  await walk(root, 0)
  return files
}

/** Case-insensitive line-level content search across workspace markdown files. */
async function searchContent(root: string, query: string): Promise<ContentMatch[]> {
  const needle = query.toLowerCase()
  const results: ContentMatch[] = []
  for (const path of await collectMarkdownFiles(root)) {
    if (results.length >= MAX_CONTENT_RESULTS) break
    let text: string
    try {
      text = await fs.readFile(path, 'utf-8')
    } catch {
      continue
    }
    const lines = text.split(/\r?\n/)
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].toLowerCase().includes(needle)) continue
      results.push({
        path,
        name: basename(path),
        line: i + 1,
        preview: lines[i].trim().slice(0, MAX_PREVIEW_LENGTH)
      })
      if (results.length >= MAX_CONTENT_RESULTS) break
    }
  }
  return results
}

/** Recursively collect markdown files under `root` whose name matches `query`. */
async function searchMarkdown(root: string, query: string): Promise<FileNode[]> {
  const results: FileNode[] = []
  async function walk(dir: string, depth: number): Promise<void> {
    if (depth > MAX_SEARCH_DEPTH || results.length >= MAX_SEARCH_RESULTS) return
    let entries: import('node:fs').Dirent[]
    try {
      entries = await fs.readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (shouldIgnore(entry.name)) continue
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(full, depth + 1)
      } else if (isMarkdownFile(entry.name) && fuzzyMatch(entry.name, query)) {
        results.push({ name: entry.name, path: full, isDirectory: false })
        if (results.length >= MAX_SEARCH_RESULTS) return
      }
    }
  }
  await walk(root, 0)
  return rankMatches(results, query)
}

const MARKDOWN_FILTERS = [
  { name: 'Markdown', extensions: ['md', 'markdown', 'mdown', 'mkd'] },
  { name: 'All Files', extensions: ['*'] }
]

async function readFileSafe(filePath: string): Promise<OpenFileResult> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return { filePath, content }
  } catch (error) {
    console.error('Failed to read file:', filePath, error)
    throw new Error(`Could not open file: ${filePath}`)
  }
}

/** Register all filesystem-related IPC handlers. */
export function registerFileHandlers(
  getWindow: () => BrowserWindow | null,
  onRecentsChanged?: () => void
): void {
  const recordFile = (path: string): void => {
    pushRecentFile(path)
    onRecentsChanged?.()
  }

  ipcMain.handle(IpcChannel.FileOpen, async (): Promise<OpenFileResult | null> => {
    const win = getWindow()
    if (!win) return null
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: MARKDOWN_FILTERS
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const opened = await readFileSafe(result.filePaths[0])
    recordFile(opened.filePath)
    return opened
  })

  ipcMain.handle(
    IpcChannel.FileOpenPath,
    async (_e, filePath: string): Promise<OpenFileResult | null> => {
      if (typeof filePath !== 'string' || !isMarkdownFile(filePath)) return null
      const opened = await readFileSafe(filePath)
      recordFile(opened.filePath)
      return opened
    }
  )

  ipcMain.handle(
    IpcChannel.FileSave,
    async (_e, filePath: string, content: string): Promise<boolean> => {
      if (typeof filePath !== 'string' || typeof content !== 'string') return false
      try {
        await fs.writeFile(filePath, content, 'utf-8')
        return true
      } catch (error) {
        console.error('Failed to save file:', filePath, error)
        throw new Error(`Could not save file: ${filePath}`)
      }
    }
  )

  ipcMain.handle(
    IpcChannel.FileSaveAs,
    async (_e, content: string): Promise<string | null> => {
      const win = getWindow()
      if (!win) return null
      const result = await dialog.showSaveDialog(win, {
        filters: MARKDOWN_FILTERS,
        defaultPath: 'Untitled.md'
      })
      if (result.canceled || !result.filePath) return null
      await fs.writeFile(result.filePath, content ?? '', 'utf-8')
      recordFile(result.filePath)
      return result.filePath
    }
  )

  ipcMain.handle(IpcChannel.DialogOpenFolder, async (): Promise<string | null> => {
    const win = getWindow()
    if (!win) return null
    const result = await dialog.showOpenDialog(win, { properties: ['openDirectory'] })
    if (result.canceled || result.filePaths.length === 0) return null
    pushRecentWorkspace(result.filePaths[0])
    onRecentsChanged?.()
    return result.filePaths[0]
  })

  ipcMain.handle(IpcChannel.SearchWorkspace, async (_e, root: string, query: string) => {
    if (typeof root !== 'string' || typeof query !== 'string' || query.trim().length === 0) {
      return []
    }
    return searchMarkdown(root, query)
  })

  ipcMain.handle(IpcChannel.SearchContent, async (_e, root: string, query: string) => {
    if (typeof root !== 'string' || typeof query !== 'string' || query.trim().length < 2) {
      return []
    }
    return searchContent(root, query.trim())
  })

  // Save a pasted/uploaded image next to the document (assets/) and return the
  // relative path for the markdown link. Falls back to null when the document
  // has no path yet (caller keeps base64 in that case).
  ipcMain.handle(
    IpcChannel.ImageSave,
    async (_e, docPath: string | null, fileName: string, data: ArrayBuffer): Promise<string | null> => {
      if (typeof docPath !== 'string' || docPath.length === 0) return null
      if (typeof fileName !== 'string' || !(data instanceof ArrayBuffer)) return null
      try {
        const assetsDir = join(dirname(docPath), 'assets')
        await fs.mkdir(assetsDir, { recursive: true })
        const safeName = fileName.replace(/[^\w.-]/g, '_') || 'image.png'
        const unique = `${Date.now()}-${safeName}`
        await fs.writeFile(join(assetsDir, unique), Buffer.from(data))
        return `assets/${unique}`
      } catch (error) {
        console.error('Failed to save pasted image:', error)
        return null
      }
    }
  )

  ipcMain.handle(IpcChannel.ReadDir, async (_e, dirPath: string) => {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      return buildFileNodes(
        entries.map((entry) => ({
          name: entry.name,
          path: `${dirPath}/${entry.name}`,
          isDirectory: entry.isDirectory()
        }))
      )
    } catch (error) {
      console.error('Failed to read directory:', dirPath, error)
      return []
    }
  })
}
