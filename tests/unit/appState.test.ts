import { describe, expect, test } from 'vitest'
import {
  reducer,
  initialState,
  activeTab,
  anyDirty,
  AppState,
  Action
} from '../../src/renderer/src/state/appState'
import { isDirty } from '../../src/shared/types'

function run(...actions: Action[]): AppState {
  return actions.reduce(reducer, initialState)
}

describe('tabs', () => {
  test('starts with a single untitled tab', () => {
    expect(initialState.tabs).toHaveLength(1)
    expect(activeTab(initialState).doc.filePath).toBeNull()
  })

  test('edit updates only the active tab', () => {
    const s = run({ type: 'edit', content: 'hi' })
    expect(activeTab(s).doc.content).toBe('hi')
    expect(isDirty(activeTab(s).doc)).toBe(true)
  })

  test('open reuses a pristine untitled tab', () => {
    const s = run({ type: 'open', filePath: '/a.md', content: 'x' })
    expect(s.tabs).toHaveLength(1)
    expect(activeTab(s).doc.filePath).toBe('/a.md')
  })

  test('open creates a new tab when the active one has content', () => {
    const s = run({ type: 'edit', content: 'draft' }, { type: 'open', filePath: '/a.md', content: 'x' })
    expect(s.tabs).toHaveLength(2)
    expect(activeTab(s).doc.filePath).toBe('/a.md')
  })

  test('open activates an existing tab for the same file', () => {
    const s = run(
      { type: 'open', filePath: '/a.md', content: 'x' },
      { type: 'new' },
      { type: 'open', filePath: '/a.md', content: 'x' }
    )
    expect(s.tabs).toHaveLength(2)
    expect(activeTab(s).doc.filePath).toBe('/a.md')
  })

  test('new adds and activates a fresh tab', () => {
    const s = run({ type: 'edit', content: 'a' }, { type: 'new' })
    expect(s.tabs).toHaveLength(2)
    expect(activeTab(s).doc.content).toBe('')
  })

  test('close-tab removes the active tab and activates a neighbor', () => {
    const s = run(
      { type: 'open', filePath: '/a.md', content: 'x' },
      { type: 'new' },
      { type: 'close-tab' }
    )
    expect(s.tabs).toHaveLength(1)
    expect(activeTab(s).doc.filePath).toBe('/a.md')
  })

  test('closing the last tab leaves a fresh untitled tab', () => {
    const s = run({ type: 'edit', content: 'x' }, { type: 'close-tab' })
    expect(s.tabs).toHaveLength(1)
    expect(activeTab(s).doc.content).toBe('')
  })

  test('activate-tab and cycle-tab switch focus', () => {
    const s = run({ type: 'open', filePath: '/a.md', content: 'x' }, { type: 'new' })
    const firstId = s.tabs[0].id
    expect(activeTab(reducer(s, { type: 'activate-tab', id: firstId })).id).toBe(firstId)
    expect(activeTab(reducer(s, { type: 'cycle-tab', delta: 1 })).id).toBe(firstId)
  })

  test('anyDirty reflects unsaved changes in any tab', () => {
    const s = run({ type: 'edit', content: 'x' }, { type: 'new' })
    expect(isDirty(activeTab(s).doc)).toBe(false)
    expect(anyDirty(s)).toBe(true)
  })

  test('saved clears the active tab dirty flag', () => {
    const s = run(
      { type: 'open', filePath: '/a.md', content: 'x' },
      { type: 'edit', content: 'y' },
      { type: 'saved' }
    )
    expect(isDirty(activeTab(s).doc)).toBe(false)
  })
})

describe('ui state', () => {
  test('set-workspace stores the root', () => {
    expect(run({ type: 'set-workspace', root: '/w' }).workspaceRoot).toBe('/w')
  })

  test('set-theme changes themeId', () => {
    expect(run({ type: 'set-theme', themeId: 'dracula' }).themeId).toBe('dracula')
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
    expect(run({ type })[key as keyof AppState]).toBe(!before)
  })

  test('set-find toggles find visibility', () => {
    expect(run({ type: 'set-find', visible: true }).findVisible).toBe(true)
  })

  test('does not mutate the input state', () => {
    const snapshot = JSON.stringify(initialState)
    reducer(initialState, { type: 'edit', content: 'x' })
    expect(JSON.stringify(initialState)).toBe(snapshot)
  })
})
