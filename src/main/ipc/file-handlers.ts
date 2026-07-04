import { promises as fs } from 'node:fs'
import { dialog, ipcMain, BrowserWindow } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import { buildFileNodes, isMarkdownFile } from '../../shared/filetree'
import { OpenFileResult } from '../../shared/types'

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
    return result.filePaths[0]
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
