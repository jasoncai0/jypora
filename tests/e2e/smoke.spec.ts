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

test('crepe editor variables are populated (cursor/selection theming)', async () => {
  const vars = await page.evaluate(() => {
    const style = document.documentElement.style
    return {
      background: style.getPropertyValue('--crepe-color-background'),
      primary: style.getPropertyValue('--crepe-color-primary'),
      selected: style.getPropertyValue('--crepe-color-selected')
    }
  })
  expect(vars.background.trim()).not.toBe('')
  expect(vars.primary.trim()).not.toBe('')
  expect(vars.selected.trim()).not.toBe('')
})

test('dark theme switches color-scheme so native widgets follow', async () => {
  await app.evaluate(({ BrowserWindow }) => {
    BrowserWindow.getAllWindows()[0].webContents.send('menu:action', 'theme:dark')
  })
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme))
    .toContain('dark')
  await app.evaluate(({ BrowserWindow }) => {
    BrowserWindow.getAllWindows()[0].webContents.send('menu:action', 'theme:light')
  })
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme))
    .toContain('light')
})

test('outline click and anchor links scroll to headings', async () => {
  // Build a long doc with two headings and a TOC anchor link via source mode.
  await app.evaluate(({ BrowserWindow }) => {
    BrowserWindow.getAllWindows()[0].webContents.send('menu:action', 'toggle-source')
  })
  const textarea = page.locator('.jypora-source')
  await textarea.waitFor()
  const filler = Array.from({ length: 60 }, (_, i) => `filler line ${i}`).join('\n\n')
  await textarea.fill(`# Top\n\n[jump to bottom](#bottom-section)\n\n${filler}\n\n## Bottom Section\n\nend`)
  await app.evaluate(({ BrowserWindow }) => {
    BrowserWindow.getAllWindows()[0].webContents.send('menu:action', 'toggle-source')
  })
  await page.locator('.milkdown h2').waitFor()

  // Anchor link click scrolls the bottom heading into view.
  const wrap = page.locator('.jypora-editor-wrap')
  await page.locator('.milkdown a[href="#bottom-section"]').click()
  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const h2 = document.querySelector('.milkdown h2')
        return h2 ? h2.getBoundingClientRect().top < window.innerHeight : false
      })
    })
    .toBe(true)

  // Outline click navigates too: open outline, click the last item.
  await wrap.evaluate((el) => el.scrollTo(0, 0))
  await app.evaluate(({ BrowserWindow }) => {
    BrowserWindow.getAllWindows()[0].webContents.send('menu:action', 'toggle-outline')
  })
  await page.locator('.jypora-outline .outline-item').last().click()
  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const h2 = document.querySelector('.milkdown h2')
        return h2 ? h2.getBoundingClientRect().top < window.innerHeight : false
      })
    })
    .toBe(true)
})

test('sidebar can be resized by dragging its handle', async () => {
  const sidebar = page.locator('.jypora-sidebar')
  const handle = page.getByTestId('sidebar-handle')
  const before = (await sidebar.boundingBox())!.width
  const box = (await handle.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + 120, box.y + box.height / 2, { steps: 5 })
  await page.mouse.up()
  const after = (await sidebar.boundingBox())!.width
  expect(after).toBeGreaterThan(before + 60)
})

test('terminal panel can be resized by dragging its handle', async () => {
  await app.evaluate(({ BrowserWindow }) => {
    BrowserWindow.getAllWindows()[0].webContents.send('menu:action', 'toggle-terminal')
  })
  const terminal = page.locator('.jypora-terminal')
  await terminal.waitFor()
  const before = (await terminal.boundingBox())!.height
  const handle = page.getByTestId('terminal-handle')
  const box = (await handle.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2, box.y - 100, { steps: 5 })
  await page.mouse.up()
  const after = (await terminal.boundingBox())!.height
  expect(after).toBeGreaterThan(before + 50)
  // Hide the terminal again so later tests keep a stable layout.
  await app.evaluate(({ BrowserWindow }) => {
    BrowserWindow.getAllWindows()[0].webContents.send('menu:action', 'toggle-terminal')
  })
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
