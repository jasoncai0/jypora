import { describe, expect, test } from 'vitest'
import { fileExtension, iconFor, DIRECTORY_ICON, DIRECTORY_OPEN_ICON } from '../../src/shared/file-icons'
import { addRecent, removeRecent, workspaceLabel, MAX_RECENT_WORKSPACES } from '../../src/shared/recent'
import { fuzzyMatch, filterNodes, rankMatches } from '../../src/shared/search'
import { extractMermaidBlocks, hasMermaid, mermaidToPreTags } from '../../src/shared/mermaid'
import { FileNode } from '../../src/shared/types'

describe('file-icons', () => {
  test('extracts extension', () => {
    expect(fileExtension('a.md')).toBe('md')
    expect(fileExtension('A.PNG')).toBe('png')
    expect(fileExtension('noext')).toBe('')
    expect(fileExtension('.dotfile')).toBe('')
  })

  test('directory icons switch on expansion', () => {
    expect(iconFor('src', true, false)).toBe(DIRECTORY_ICON)
    expect(iconFor('src', true, true)).toBe(DIRECTORY_OPEN_ICON)
  })

  test('known extensions map to icons; unknown falls back', () => {
    expect(iconFor('a.md', false)).toBe('📝')
    expect(iconFor('a.png', false)).toBe('🖼️')
    expect(iconFor('a.unknown', false)).toBe('📄')
  })
})

describe('recent workspaces', () => {
  test('adds to front and dedups', () => {
    expect(addRecent(['b', 'c'], 'a')).toEqual(['a', 'b', 'c'])
    expect(addRecent(['a', 'b'], 'a')).toEqual(['a', 'b'])
  })

  test('caps length', () => {
    const many = Array.from({ length: 20 }, (_, i) => `w${i}`)
    expect(addRecent(many, 'new').length).toBe(MAX_RECENT_WORKSPACES)
  })

  test('ignores empty path and does not mutate input', () => {
    const list = ['a']
    expect(addRecent(list, '')).toEqual(['a'])
    expect(list).toEqual(['a'])
  })

  test('removeRecent filters', () => {
    expect(removeRecent(['a', 'b'], 'a')).toEqual(['b'])
  })

  test('workspaceLabel returns last segment', () => {
    expect(workspaceLabel('/Users/me/notes')).toBe('notes')
    expect(workspaceLabel('/Users/me/notes/')).toBe('notes')
  })
})

describe('search', () => {
  test('fuzzy subsequence match', () => {
    expect(fuzzyMatch('readme.md', 'rme')).toBe(true)
    expect(fuzzyMatch('readme.md', 'xyz')).toBe(false)
    expect(fuzzyMatch('anything', '')).toBe(true)
  })

  const nodes: FileNode[] = [
    { name: 'guide.md', path: '/guide.md', isDirectory: false },
    { name: 'readme.md', path: '/readme.md', isDirectory: false },
    { name: 'notes.md', path: '/notes.md', isDirectory: false }
  ]

  test('filterNodes keeps matches', () => {
    expect(filterNodes(nodes, 'read').map((n) => n.name)).toEqual(['readme.md'])
    expect(filterNodes(nodes, '')).toHaveLength(3)
  })

  test('rankMatches puts prefix matches first', () => {
    const ranked = rankMatches(nodes, 'no')
    expect(ranked[0].name).toBe('notes.md')
  })
})

describe('mermaid', () => {
  const md = 'text\n\n```mermaid\ngraph TD; A-->B;\n```\n\nmore\n\n```js\nx=1\n```'

  test('extracts mermaid blocks only', () => {
    const blocks = extractMermaidBlocks(md)
    expect(blocks).toHaveLength(1)
    expect(blocks[0].code).toBe('graph TD; A-->B;')
  })

  test('hasMermaid detects presence', () => {
    expect(hasMermaid(md)).toBe(true)
    expect(hasMermaid('```js\nx\n```')).toBe(false)
  })

  test('mermaidToPreTags rewrites rendered code blocks', () => {
    const html = '<pre><code class="language-mermaid">graph TD; A--&gt;B;</code></pre>'
    const out = mermaidToPreTags(html)
    expect(out).toContain('<pre class="mermaid">')
    expect(out).toContain('A-->B;')
  })

  test('leaves non-mermaid code blocks untouched', () => {
    const html = '<pre><code class="language-js">x=1</code></pre>'
    expect(mermaidToPreTags(html)).toBe(html)
  })
})
