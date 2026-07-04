import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { dialog, ipcMain, BrowserWindow } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import { buildFileNodes, isMarkdownFile, shouldIgnore } from '../../shared/filetree'
import { fuzzyMatch, rankMatches } from '../../shared/search'
import { FileNode, OpenFileResult } from '../../shared/types'
import { pushRecentWorkspace } from '../settings'

const MAX_SEARCH_RESULTS = 200
const MAX_SEARCH_DEPTH = 6

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
export function registerFileHandlers(getWindow: () => BrowserWindow | null): void {
  ipcMain.handle(IpcChannel.FileOpen, async (): Promise<OpenFileResult | null> => {
    const win = getWindow()
    if (!win) return null
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: MARKDOWN_FILTERS
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return readFileSafe(result.filePaths[0])
  })

  ipcMain.handle(
    IpcChannel.FileOpenPath,
    async (_e, filePath: string): Promise<OpenFileResult | null> => {
      if (typeof filePath !== 'string' || !isMarkdownFile(filePath)) return null
      return readFileSafe(filePath)
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
      return result.filePath
    }
  )

  ipcMain.handle(IpcChannel.DialogOpenFolder, async (): Promise<string | null> => {
    const win = getWindow()
    if (!win) return null
    const result = await dialog.showOpenDialog(win, { properties: ['openDirectory'] })
    if (result.canceled || result.filePaths.length === 0) return null
    pushRecentWorkspace(result.filePaths[0])
    return result.filePaths[0]
  })

  ipcMain.handle(IpcChannel.SearchWorkspace, async (_e, root: string, query: string) => {
    if (typeof root !== 'string' || typeof query !== 'string' || query.trim().length === 0) {
      return []
    }
    return searchMarkdown(root, query)
  })

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
