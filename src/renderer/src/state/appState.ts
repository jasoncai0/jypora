import { DocumentState } from '../../../shared/types'
import { createDocument, editContent, markSaved, openDocument } from '../../../shared/document'

/** UI + document state for the renderer. Updated only through the reducer. */
export interface AppState {
  readonly doc: DocumentState
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
  doc: createDocument(),
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

/** Pure reducer — returns a new state object, never mutates the input. */
export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'edit':
      return { ...state, doc: editContent(state.doc, action.content) }
    case 'open':
      return { ...state, doc: openDocument(action.filePath, action.content) }
    case 'new':
      return { ...state, doc: createDocument() }
    case 'saved':
      return { ...state, doc: markSaved(state.doc, action.filePath) }
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
