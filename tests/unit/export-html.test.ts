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
})
