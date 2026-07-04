import { app, Menu, BrowserWindow, MenuItemConstructorOptions } from 'electron'
import { IpcChannel, MenuActionType } from '../shared/ipc'

function send(win: BrowserWindow | null, action: MenuActionType): void {
  win?.webContents.send(IpcChannel.MenuAction, action)
}

/** Build and install the native application menu. */
export function buildMenu(getWindow: () => BrowserWindow | null): void {
  const isMac = process.platform === 'darwin'
  const win = () => getWindow()

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [{ label: app.name, submenu: [{ role: 'about' as const }, { type: 'separator' as const }, { role: 'quit' as const }] }]
      : []),
    {
      label: 'File',
      submenu: [
        { label: 'New', accelerator: 'CmdOrCtrl+N', click: () => send(win(), 'new') },
        { label: 'Open…', accelerator: 'CmdOrCtrl+O', click: () => send(win(), 'open') },
        { type: 'separator' },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => send(win(), 'save') },
        { label: 'Save As…', accelerator: 'CmdOrCtrl+Shift+S', click: () => send(win(), 'save-as') },
        { type: 'separator' },
        {
          label: 'Export',
          submenu: [
            { label: 'HTML', click: () => send(win(), 'export-html') },
            { label: 'PDF', click: () => send(win(), 'export-pdf') },
            { label: 'Word (.docx)', click: () => send(win(), 'export-docx') }
          ]
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { type: 'separator' },
        { label: 'Find…', accelerator: 'CmdOrCtrl+F', click: () => send(win(), 'find') }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Toggle Source Mode', accelerator: 'CmdOrCtrl+/', click: () => send(win(), 'toggle-source') },
        { label: 'Toggle Sidebar', accelerator: 'CmdOrCtrl+Shift+L', click: () => send(win(), 'toggle-sidebar') },
        { label: 'Toggle Outline', accelerator: 'CmdOrCtrl+Shift+O', click: () => send(win(), 'toggle-outline') },
        { type: 'separator' },
        { label: 'Focus Mode', click: () => send(win(), 'toggle-focus') },
        { label: 'Typewriter Mode', click: () => send(win(), 'toggle-typewriter') },
        { type: 'separator' },
        { label: 'Light Theme', click: () => send(win(), 'theme-light') },
        { label: 'Dark Theme', click: () => send(win(), 'theme-dark') },
        { type: 'separator' },
        { role: 'toggleDevTools' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'togglefullscreen' }
      ]
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
