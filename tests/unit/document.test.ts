import { describe, expect, test } from 'vitest'
import {
  createDocument,
  documentTitle,
  editContent,
  markSaved,
  openDocument
} from '../../src/shared/document'
import { isDirty } from '../../src/shared/types'

describe('document transitions', () => {
  test('createDocument is empty and clean', () => {
    const doc = createDocument()
    expect(doc.filePath).toBeNull()
    expect(isDirty(doc)).toBe(false)
  })

  test('openDocument is clean with content', () => {
    const doc = openDocument('/a/b.md', 'hello')
    expect(doc.content).toBe('hello')
    expect(isDirty(doc)).toBe(false)
  })

  test('editContent marks dirty and does not mutate input', () => {
    const doc = openDocument('/a.md', 'x')
    const edited = editContent(doc, 'y')
    expect(isDirty(edited)).toBe(true)
    expect(doc.content).toBe('x') // original untouched
    expect(edited).not.toBe(doc)
  })

  test('editContent with same content returns same reference', () => {
    const doc = openDocument('/a.md', 'x')
    expect(editContent(doc, 'x')).toBe(doc)
  })

  test('markSaved clears dirty', () => {
    const doc = editContent(openDocument('/a.md', 'x'), 'y')
    const saved = markSaved(doc)
    expect(isDirty(saved)).toBe(false)
    expect(saved.savedContent).toBe('y')
  })

  test('markSaved can assign a new path', () => {
    const saved = markSaved(editContent(createDocument(), 'z'), '/new.md')
    expect(saved.filePath).toBe('/new.md')
    expect(isDirty(saved)).toBe(false)
  })

  test('documentTitle returns Untitled for no path', () => {
    expect(documentTitle(createDocument())).toBe('Untitled')
  })

  test('documentTitle returns basename', () => {
    expect(documentTitle(openDocument('/a/b/note.md', ''))).toBe('note.md')
  })
})
