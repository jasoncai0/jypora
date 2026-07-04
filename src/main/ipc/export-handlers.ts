import { promises as fs } from 'node:fs'
import { spawn } from 'node:child_process'
import { dialog, ipcMain, BrowserWindow } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import { buildHtmlDocument } from '../../shared/export-html'

interface HtmlPayload {
  readonly title: string
  readonly bodyHtml: string
  readonly theme?: 'light' | 'dark'
  readonly themeVars?: Readonly<Record<string, string>>
}

async function chooseSavePath(
  win: BrowserWindow,
  defaultName: string,
  ext: string,
  label: string
): Promise<string | null> {
  const result = await dialog.showSaveDialog(win, {
    defaultPath: defaultName,
    filters: [{ name: label, extensions: [ext] }]
  })
  return result.canceled || !result.filePath ? null : result.filePath
}

function runPandoc(args: readonly string[], input: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('pandoc', args)
    let stderr = ''
    proc.stderr.on('data', (d) => (stderr += d.toString()))
    proc.on('error', () =>
      reject(new Error('pandoc is not installed. Install it to export this format.'))
    )
    proc.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`pandoc failed: ${stderr}`))
    )
    proc.stdin.write(input)
    proc.stdin.end()
  })
}

/** Register export IPC handlers (HTML, PDF, DOCX). */
export function registerExportHandlers(getWindow: () => BrowserWindow | null): void {
  ipcMain.handle(IpcChannel.ExportHtml, async (_e, payload: HtmlPayload) => {
    const win = getWindow()
    if (!win) return false
    const target = await chooseSavePath(win, `${payload.title}.html`, 'html', 'HTML')
    if (!target) return false
    await fs.writeFile(target, buildHtmlDocument(payload), 'utf-8')
    return true
  })

  ipcMain.handle(IpcChannel.ExportPdf, async (_e, payload: HtmlPayload) => {
    const win = getWindow()
    if (!win) return false
    const target = await chooseSavePath(win, `${payload.title}.pdf`, 'pdf', 'PDF')
    if (!target) return false
    // Render the HTML in an offscreen window and print to PDF — no external deps.
    const pdfWin = new BrowserWindow({ show: false, webPreferences: { sandbox: true } })
    try {
      const html = buildHtmlDocument(payload)
      await pdfWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
      const data = await pdfWin.webContents.printToPDF({ printBackground: true })
      await fs.writeFile(target, data)
      return true
    } finally {
      pdfWin.destroy()
    }
  })

  ipcMain.handle(IpcChannel.ExportDocx, async (_e, payload: { markdown: string; title: string }) => {
    const win = getWindow()
    if (!win) return false
    const target = await chooseSavePath(win, `${payload.title}.docx`, 'docx', 'Word')
    if (!target) return false
    await runPandoc(['-f', 'markdown', '-o', target], payload.markdown)
    return true
  })
}
