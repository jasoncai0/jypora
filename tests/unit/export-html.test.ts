import { describe, expect, test } from 'vitest'
import { buildHtmlDocument } from '../../src/shared/export-html'

describe('buildHtmlDocument', () => {
  test('wraps body html in a full document', () => {
    const html = buildHtmlDocument({ title: 'T', bodyHtml: '<p>hi</p>' })
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('<title>T</title>')
    expect(html).toContain('<p>hi</p>')
  })

  test('escapes the title', () => {
    const html = buildHtmlDocument({ title: '<script>', bodyHtml: '' })
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<title><script>')
  })

  test('includes dark css when theme is dark', () => {
    const html = buildHtmlDocument({ title: 'T', bodyHtml: '', theme: 'dark' })
    expect(html).toContain('#1e1e1e')
  })

  test('omits dark css for light theme', () => {
    const html = buildHtmlDocument({ title: 'T', bodyHtml: '', theme: 'light' })
    expect(html).not.toContain('#1e1e1e')
  })

  test('themeVars palette overrides the preset css', () => {
    const html = buildHtmlDocument({
      title: 'T',
      bodyHtml: '',
      theme: 'dark',
      themeVars: { bg: '#2e3440', fg: '#d8dee9', muted: '#7b869c', border: '#3b4252', accent: '#88c0d0' }
    })
    expect(html).toContain('#2e3440')
    expect(html).toContain('#88c0d0')
    expect(html).not.toContain('background: #1e1e1e')
  })
})
