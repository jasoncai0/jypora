import { app, Menu, BrowserWindow, MenuItemConstructorOptions } from 'electron'
import { IpcChannel, MenuActionType } from '../shared/ipc'
import { ThemeDefinition } from '../shared/themes'
import { workspaceLabel } from '../shared/recent'

interface MenuOptions {
  readonly themes: readonly ThemeDefinition[]
  readonly recentWorkspaces: readonly string[]
  readonly activeThemeId: string
}

function send(win: BrowserWindow | null, action: MenuActionType): void {
  win?.webContents.send(IpcChannel.MenuAction, action)
}

/** File > Open Recent submenu built from the persisted workspace list. */
function recentSubmenu(
  win: () => BrowserWindow | null,
  recents: readonly string[]
): MenuItemConstructorOptions {
  const items: MenuItemConstructorOptions[] =
    recents.length === 0
      ? [{ label: 'No Recent Workspaces', enabled: false }]
      : recents.map((path) => ({
          label: workspaceLabel(path),
          sublabel: path,
          click: () => win()?.webContents.send(IpcChannel.OpenRecent, path)
        }))
  return { label: 'Open Recent', submenu: items }
}

/** View > Theme submenu, radio-checked to the active theme. */
function themeSubmenu(
  win: () => BrowserWindow | null,
  themes: readonly ThemeDefinition[],
  activeThemeId: string
): MenuItemConstructorOptions {
  return {
    label: 'Theme',
    submenu: themes.map((theme) => ({
      label: theme.name,
      type: 'radio',
      checked: theme.id === activeThemeId,
      click: () => send(win(), `theme:${theme.id}` as MenuActionType)
    }))
  }
}

const HEADING_ITEMS = (win: () => BrowserWindow | null): MenuItemConstructorOptions[] => [
  { label: 'Heading 1', accelerator: 'CmdOrCtrl+1', click: () => send(win(), 'fmt:heading-1') },
  { label: 'Heading 2', accelerator: 'CmdOrCtrl+2', click: () => send(win(), 'fmt:heading-2') },
  { label: 'Heading 3', accelerator: 'CmdOrCtrl+3', click: () => send(win(), 'fmt:heading-3') },
  { label: 'Heading 4', accelerator: 'CmdOrCtrl+4', click: () => send(win(), 'fmt:heading-4') },
  { label: 'Heading 5', accelerator: 'CmdOrCtrl+5', click: () => send(win(), 'fmt:heading-5') },
  { label: 'Heading 6', accelerator: 'CmdOrCtrl+6', click: () => send(win(), 'fmt:heading-6') },
  { label: 'Paragraph', accelerator: 'CmdOrCtrl+0', click: () => send(win(), 'fmt:paragraph') }
]

/** Build and install the native application menu. */
export function buildMenu(getWindow: () => BrowserWindow | null, options: MenuOptions): void {
  const isMac = process.platform === 'darwin'
  const win = (): BrowserWindow | null => getWindow()

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [{ label: app.name, submenu: [{ role: 'about' as const }, { type: 'separator' as const }, { role: 'quit' as const }] }]
      : []),
    {
      label: 'File',
      submenu: [
        { label: 'New', accelerator: 'CmdOrCtrl+N', click: () => send(win(), 'new') },
        { label: 'Open…', accelerator: 'CmdOrCtrl+O', click: () => send(win(), 'open') },
        { label: 'Open Folder…', accelerator: 'CmdOrCtrl+Shift+K', click: () => send(win(), 'open-folder') },
        recentSubmenu(win, options.recentWorkspaces),
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
        { label: 'Find & Replace…', accelerator: 'CmdOrCtrl+F', click: () => send(win(), 'find') },
        { label: 'Search Files…', accelerator: 'CmdOrCtrl+P', click: () => send(win(), 'search-files') }
      ]
    },
    {
      label: 'Format',
      submenu: [
        { label: 'Bold', accelerator: 'CmdOrCtrl+B', click: () => send(win(), 'fmt:bold') },
        { label: 'Italic', accelerator: 'CmdOrCtrl+I', click: () => send(win(), 'fmt:italic') },
        { label: 'Strikethrough', accelerator: 'CmdOrCtrl+Shift+X', click: () => send(win(), 'fmt:strike') },
        { label: 'Inline Code', accelerator: 'CmdOrCtrl+E', click: () => send(win(), 'fmt:inline-code') },
        { label: 'Link', accelerator: 'CmdOrCtrl+K', click: () => send(win(), 'fmt:link') },
        { type: 'separator' },
        { label: 'Headings', submenu: HEADING_ITEMS(win) },
        { type: 'separator' },
        { label: 'Bullet List', accelerator: 'CmdOrCtrl+Shift+8', click: () => send(win(), 'fmt:bullet-list') },
        { label: 'Ordered List', accelerator: 'CmdOrCtrl+Shift+7', click: () => send(win(), 'fmt:ordered-list') },
        { label: 'Blockquote', accelerator: 'CmdOrCtrl+Shift+Q', click: () => send(win(), 'fmt:quote') },
        { label: 'Code Block', accelerator: 'CmdOrCtrl+Shift+C', click: () => send(win(), 'fmt:code-block') },
        { label: 'Table', accelerator: 'CmdOrCtrl+Shift+T', click: () => send(win(), 'fmt:table') },
        { label: 'Horizontal Rule', accelerator: 'CmdOrCtrl+Shift+H', click: () => send(win(), 'fmt:hr') }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Toggle Source Mode', accelerator: 'CmdOrCtrl+/', click: () => send(win(), 'toggle-source') },
        { label: 'Toggle Sidebar', accelerator: 'CmdOrCtrl+Shift+L', click: () => send(win(), 'toggle-sidebar') },
        { label: 'Toggle Outline', accelerator: 'CmdOrCtrl+Shift+O', click: () => send(win(), 'toggle-outline') },
        { label: 'Toggle Terminal', accelerator: 'CmdOrCtrl+`', click: () => send(win(), 'toggle-terminal') },
        { type: 'separator' },
        { label: 'Focus Mode', accelerator: 'CmdOrCtrl+Shift+F', click: () => send(win(), 'toggle-focus') },
        { label: 'Typewriter Mode', click: () => send(win(), 'toggle-typewriter') },
        { type: 'separator' },
        themeSubmenu(win, options.themes, options.activeThemeId),
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
