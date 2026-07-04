import { DocumentState } from '../../../shared/types'
import { createDocument, editContent, markSaved, openDocument } from '../../../shared/document'
import { isDirty } from '../../../shared/types'

/** One editor tab: a stable id plus its document. */
export interface TabState {
  readonly id: number
  readonly doc: DocumentState
}

/** UI + document state for the renderer. Updated only through the reducer. */
export interface AppState {
  readonly tabs: readonly TabState[]
  readonly activeTabId: number
  readonly nextTabId: number
  readonly workspaceRoot: string | null
  readonly themeId: string
  readonly sourceMode: boolean
  readonly sidebarVisible: boolean
  readonly outlineVisible: boolean
  readonly terminalVisible: boolean
  readonly focusMode: boolean
  readonly typewriterMode: boolean
  readonly findVisible: boolean
  readonly searchVisible: boolean
}

export const initialState: AppState = {
  tabs: [{ id: 1, doc: createDocument() }],
  activeTabId: 1,
  nextTabId: 2,
  workspaceRoot: null,
  themeId: 'light',
  sourceMode: false,
  sidebarVisible: true,
  outlineVisible: false,
  terminalVisible: false,
  focusMode: false,
  typewriterMode: false,
  findVisible: false,
  searchVisible: false
}

export type Action =
  | { type: 'edit'; content: string }
  | { type: 'open'; filePath: string; content: string }
  | { type: 'new' }
  | { type: 'saved'; filePath?: string }
  | { type: 'close-tab'; id?: number }
  | { type: 'activate-tab'; id: number }
  | { type: 'cycle-tab'; delta: 1 | -1 }
  | { type: 'set-workspace'; root: string | null }
  | { type: 'set-theme'; themeId: string }
  | { type: 'toggle-source' }
  | { type: 'toggle-sidebar' }
  | { type: 'toggle-outline' }
  | { type: 'toggle-terminal' }
  | { type: 'toggle-focus' }
  | { type: 'toggle-typewriter' }
  | { type: 'set-find'; visible: boolean }
  | { type: 'set-search'; visible: boolean }

/** The currently focused tab (always exists — the tab list is never empty). */
export function activeTab(state: AppState): TabState {
  return state.tabs.find((t) => t.id === state.activeTabId) ?? state.tabs[0]
}

/** True when any open tab has unsaved changes. */
export function anyDirty(state: AppState): boolean {
  return state.tabs.some((t) => isDirty(t.doc))
}

function updateActiveDoc(state: AppState, update: (doc: DocumentState) => DocumentState): AppState {
  return {
    ...state,
    tabs: state.tabs.map((t) => (t.id === state.activeTabId ? { ...t, doc: update(t.doc) } : t))
  }
}

function isBlankUntitled(tab: TabState): boolean {
  return tab.doc.filePath === null && tab.doc.content === '' && !isDirty(tab.doc)
}

/** Pure reducer — returns a new state object, never mutates the input. */
export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'edit':
      return updateActiveDoc(state, (doc) => editContent(doc, action.content))
    case 'open': {
      // Re-activate an existing tab for the same file instead of duplicating.
      const existing = state.tabs.find((t) => t.doc.filePath === action.filePath)
      if (existing) return { ...state, activeTabId: existing.id }
      const doc = openDocument(action.filePath, action.content)
      const active = activeTab(state)
      // Reuse a pristine untitled tab; otherwise open in a new tab.
      if (isBlankUntitled(active)) {
        return updateActiveDoc(state, () => doc)
      }
      const tab: TabState = { id: state.nextTabId, doc }
      return { ...state, tabs: [...state.tabs, tab], activeTabId: tab.id, nextTabId: state.nextTabId + 1 }
    }
    case 'new': {
      const tab: TabState = { id: state.nextTabId, doc: createDocument() }
      return { ...state, tabs: [...state.tabs, tab], activeTabId: tab.id, nextTabId: state.nextTabId + 1 }
    }
    case 'saved':
      return updateActiveDoc(state, (doc) => markSaved(doc, action.filePath))
    case 'close-tab': {
      const id = action.id ?? state.activeTabId
      const index = state.tabs.findIndex((t) => t.id === id)
      if (index === -1) return state
      const remaining = state.tabs.filter((t) => t.id !== id)
      if (remaining.length === 0) {
        // Never leave zero tabs — replace with a fresh untitled document.
        const tab: TabState = { id: state.nextTabId, doc: createDocument() }
        return { ...state, tabs: [tab], activeTabId: tab.id, nextTabId: state.nextTabId + 1 }
      }
      const nextActive =
        id === state.activeTabId ? remaining[Math.max(0, index - 1)].id : state.activeTabId
      return { ...state, tabs: remaining, activeTabId: nextActive }
    }
    case 'activate-tab':
      return state.tabs.some((t) => t.id === action.id) ? { ...state, activeTabId: action.id } : state
    case 'cycle-tab': {
      const index = state.tabs.findIndex((t) => t.id === state.activeTabId)
      const next = (index + action.delta + state.tabs.length) % state.tabs.length
      return { ...state, activeTabId: state.tabs[next].id }
    }
    case 'set-workspace':
      return { ...state, workspaceRoot: action.root }
    case 'set-theme':
      return { ...state, themeId: action.themeId }
    case 'toggle-source':
      return { ...state, sourceMode: !state.sourceMode }
    case 'toggle-sidebar':
      return { ...state, sidebarVisible: !state.sidebarVisible }
    case 'toggle-outline':
      return { ...state, outlineVisible: !state.outlineVisible }
    case 'toggle-terminal':
      return { ...state, terminalVisible: !state.terminalVisible }
    case 'toggle-focus':
      return { ...state, focusMode: !state.focusMode }
    case 'toggle-typewriter':
      return { ...state, typewriterMode: !state.typewriterMode }
    case 'set-find':
      return { ...state, findVisible: action.visible }
    case 'set-search':
      return { ...state, searchVisible: action.visible }
    default:
      return state
  }
}
