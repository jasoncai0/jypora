import { test, expect, _electron as electron, ElectronApplication, Page } from '@playwright/test'
import { resolve } from 'node:path'

/**
 * End-to-end smoke test: launch the built Electron app and verify the editor
 * boots, the WYSIWYG surface renders, and live typing produces rendered nodes.
 * Requires `pnpm build` to have run first (out/ must exist).
 */
let app: ElectronApplication
let page: Page

test.beforeAll(async () => {
  app = await electron.launch({ args: [resolve(__dirname, '../../out/main/index.js')] })
  page = await app.firstWindow()
  await page.waitForSelector('.jypora-app')
})

test.afterAll(async () => {
  await app.close()
})

test('app window opens with the editor shell', async () => {
  await expect(page.locator('.jypora-app')).toBeVisible()
  await expect(page.locator('.jypora-statusbar')).toBeVisible()
})

test('WYSIWYG editor mounts', async () => {
  await expect(page.locator('.milkdown')).toBeVisible({ timeout: 15_000 })
})

test('typing a heading renders it live', async () => {
  const editor = page.locator('.milkdown .ProseMirror')
  await editor.click()
  await page.keyboard.type('# Hello jypora\n')
  await expect(page.locator('.milkdown h1')).toContainText('Hello jypora')
})

test('status bar reflects word count', async () => {
  await expect(page.locator('.jypora-statusbar')).toContainText('words')
})

test('a theme is applied to the document root', async () => {
  const theme = await page.evaluate(() => document.documentElement.dataset.theme)
  expect(['light', 'dark']).toContain(theme)
})

test('mermaid code blocks render as diagrams', async () => {
  // Drive source mode via the menu-action IPC, type a mermaid block, switch back.
  await app.evaluate(({ BrowserWindow }) => {
    BrowserWindow.getAllWindows()[0].webContents.send('menu:action', 'toggle-source')
  })
  const textarea = page.locator('.jypora-source')
  await textarea.waitFor()
  await textarea.fill('```mermaid\ngraph TD; A-->B;\n```\n')
  await app.evaluate(({ BrowserWindow }) => {
    BrowserWindow.getAllWindows()[0].webContents.send('menu:action', 'toggle-source')
  })
  // renderPreview runs mermaid and injects an SVG into the preview.
  await expect(page.locator('.jypora-mermaid svg, svg[id^="jypora-mermaid"]')).toBeVisible({ timeout: 15_000 })
})
