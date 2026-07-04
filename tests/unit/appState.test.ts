import { describe, expect, test } from 'vitest'
import { reducer, initialState, AppState } from '../../src/renderer/src/state/appState'
import { isDirty } from '../../src/shared/types'

describe('appState reducer', () => {
  test('edit updates document content', () => {
    const next = reducer(initialState, { type: 'edit', content: 'hi' })
    expect(next.doc.content).toBe('hi')
    expect(isDirty(next.doc)).toBe(true)
  })

  test('open sets a clean document', () => {
    const next = reducer(initialState, { type: 'open', filePath: '/a.md', content: 'x' })
    expect(next.doc.filePath).toBe('/a.md')
    expect(isDirty(next.doc)).toBe(false)
  })

  test('new resets the document', () => {
    const dirty = reducer(initialState, { type: 'edit', content: 'x' })
    const next = reducer(dirty, { type: 'new' })
    expect(next.doc.content).toBe('')
  })

  test('saved clears the dirty flag', () => {
    const dirty = reducer(reducer(initialState, { type: 'open', filePath: '/a.md', content: 'x' }), {
      type: 'edit',
      content: 'y'
    })
    const next = reducer(dirty, { type: 'saved' })
    expect(isDirty(next.doc)).toBe(false)
  })

  test('set-workspace stores the root', () => {
    const next = reducer(initialState, { type: 'set-workspace', root: '/w' })
    expect(next.workspaceRoot).toBe('/w')
  })

  test('set-theme changes themeId', () => {
    expect(reducer(initialState, { type: 'set-theme', themeId: 'dracula' }).themeId).toBe('dracula')
  })

  test.each([
    ['toggle-source', 'sourceMode'],
    ['toggle-sidebar', 'sidebarVisible'],
    ['toggle-outline', 'outlineVisible'],
    ['toggle-terminal', 'terminalVisible'],
    ['toggle-focus', 'focusMode'],
    ['toggle-typewriter', 'typewriterMode']
  ] as const)('%s flips %s', (type, key) => {
    const before = initialState[key as keyof AppState] as boolean
    const next = reducer(initialState, { type })
    expect(next[key as keyof AppState]).toBe(!before)
  })

  test('set-find toggles find visibility', () => {
    expect(reducer(initialState, { type: 'set-find', visible: true }).findVisible).toBe(true)
  })

  test('does not mutate the input state', () => {
    const snapshot = JSON.stringify(initialState)
    reducer(initialState, { type: 'edit', content: 'x' })
    expect(JSON.stringify(initialState)).toBe(snapshot)
  })
})
