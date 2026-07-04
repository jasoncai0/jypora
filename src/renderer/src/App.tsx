import { useCallback, useEffect, useReducer, useRef } from 'react'
import { Editor } from './components/Editor'
import { Sidebar } from './components/Sidebar'
import { Outline } from './components/Outline'
import { StatusBar } from './components/StatusBar'
import { FindReplace } from './components/FindReplace'
import { useMenuActions } from './hooks/useMenuActions'
import { reducer, initialState } from './state/appState'
import { documentTitle } from '../../shared/document'
import { isDirty, ThemeName } from '../../shared/types'
import { MenuActionType } from '../../shared/ipc'

export function App(): JSX.Element {
  const [state, dispatch] = useReducer(reducer, initialState)
  const stateRef = useRef(state)
  stateRef.current = state

  // Apply theme to the document root.
  useEffect(() => {
    document.documentElement.dataset.theme = state.theme
  }, [state.theme])

  // Reflect the document title (with dirty marker) in the window title.
  useEffect(() => {
    const mark = isDirty(state.doc) ? '• ' : ''
    document.title = `${mark}${documentTitle(state.doc)} — jypora`
  }, [state.doc])

  const doSave = useCallback(async () => {
    const { doc } = stateRef.current
    if (doc.filePath) {
      const ok = await window.jypora.saveFile(doc.filePath, doc.content)
      if (ok) dispatch({ type: 'saved' })
    } else {
      const filePath = await window.jypora.saveFileAs(doc.content)
      if (filePath) dispatch({ type: 'saved', filePath })
    }
  }, [])

  const doOpen = useCallback(async () => {
    const result = await window.jypora.openFile()
    if (result) dispatch({ type: 'open', filePath: result.filePath, content: result.content })
  }, [])

  const openPath = useCallback(async (path: string) => {
    const result = await window.jypora.openFilePath(path)
    if (result) dispatch({ type: 'open', filePath: result.filePath, content: result.content })
  }, [])

  const doOpenFolder = useCallback(async () => {
    const root = await window.jypora.openFolder()
    if (root) dispatch({ type: 'set-workspace', root })
  }, [])

  const renderedHtml = (): string => document.querySelector('.milkdown')?.innerHTML ?? ''

  const menuHandler = useCallback(
    (action: MenuActionType) => {
      const { doc, theme } = stateRef.current
      const title = documentTitle(doc).replace(/\.[^.]+$/, '')
      switch (action) {
        case 'new': return dispatch({ type: 'new' })
        case 'open': return void doOpen()
        case 'save': return void doSave()
        case 'save-as':
          return void window.jypora.saveFileAs(doc.content).then((fp) => fp && dispatch({ type: 'saved', filePath: fp }))
        case 'toggle-source': return dispatch({ type: 'toggle-source' })
        case 'toggle-sidebar': return dispatch({ type: 'toggle-sidebar' })
        case 'toggle-outline': return dispatch({ type: 'toggle-outline' })
        case 'toggle-focus': return dispatch({ type: 'toggle-focus' })
        case 'toggle-typewriter': return dispatch({ type: 'toggle-typewriter' })
        case 'find': return dispatch({ type: 'set-find', visible: true })
        case 'theme-light': return dispatch({ type: 'set-theme', theme: 'light' as ThemeName })
        case 'theme-dark': return dispatch({ type: 'set-theme', theme: 'dark' as ThemeName })
        case 'export-html':
          return void window.jypora.exportHtml({ title, bodyHtml: renderedHtml(), theme })
        case 'export-pdf':
          return void window.jypora.exportPdf({ title, bodyHtml: renderedHtml(), theme })
        case 'export-docx':
          return void window.jypora.exportDocx({ title, markdown: doc.content })
      }
    },
    [doOpen, doSave]
  )

  useMenuActions(menuHandler)

  return (
    <div className={`jypora-app ${state.focusMode ? 'focus' : ''}`}>
      {state.sidebarVisible && !state.focusMode && (
        <Sidebar
          workspaceRoot={state.workspaceRoot}
          activePath={state.doc.filePath}
          onOpenFolder={doOpenFolder}
          onOpenFile={openPath}
        />
      )}
      <main className="jypora-main">
        {state.findVisible && (
          <FindReplace
            content={state.doc.content}
            onReplaceAll={(next) => dispatch({ type: 'edit', content: next })}
            onClose={() => dispatch({ type: 'set-find', visible: false })}
          />
        )}
        <div className="jypora-editor-wrap">
          <Editor
            key={state.doc.filePath ?? 'untitled'}
            value={state.doc.content}
            sourceMode={state.sourceMode}
            typewriterMode={state.typewriterMode}
            onChange={(content) => dispatch({ type: 'edit', content })}
          />
        </div>
        <StatusBar content={state.doc.content} dirty={isDirty(state.doc)} sourceMode={state.sourceMode} />
      </main>
      {state.outlineVisible && !state.focusMode && (
        <Outline content={state.doc.content} onSelect={() => undefined} />
      )}
    </div>
  )
}
