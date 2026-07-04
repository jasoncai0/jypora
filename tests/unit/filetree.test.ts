import { describe, expect, test } from 'vitest'
import { buildFileNodes, isMarkdownFile, shouldIgnore } from '../../src/shared/filetree'

describe('isMarkdownFile', () => {
  test.each(['a.md', 'b.markdown', 'C.MD', 'd.mkd'])('accepts %s', (name) => {
    expect(isMarkdownFile(name)).toBe(true)
  })

  test.each(['a.txt', 'b.js', 'noext'])('rejects %s', (name) => {
    expect(isMarkdownFile(name)).toBe(false)
  })
})

describe('shouldIgnore', () => {
  test('ignores dotfiles and node_modules', () => {
    expect(shouldIgnore('.git')).toBe(true)
    expect(shouldIgnore('node_modules')).toBe(true)
    expect(shouldIgnore('.env')).toBe(true)
  })

  test('keeps regular names', () => {
    expect(shouldIgnore('notes')).toBe(false)
  })
})

describe('buildFileNodes', () => {
  const entries = [
    { name: 'z.md', path: '/z.md', isDirectory: false },
    { name: 'docs', path: '/docs', isDirectory: true },
    { name: 'a.txt', path: '/a.txt', isDirectory: false },
    { name: 'a.md', path: '/a.md', isDirectory: false },
    { name: 'node_modules', path: '/node_modules', isDirectory: true }
  ]

  test('directories come first, then sorted markdown files', () => {
    const nodes = buildFileNodes(entries)
    expect(nodes.map((n) => n.name)).toEqual(['docs', 'a.md', 'z.md'])
  })

  test('filters out non-markdown files and ignored dirs', () => {
    const names = buildFileNodes(entries).map((n) => n.name)
    expect(names).not.toContain('a.txt')
    expect(names).not.toContain('node_modules')
  })
})
