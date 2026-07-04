import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { Editor, FormatDispatch } from './components/Editor'
import { Sidebar } from './components/Sidebar'
import { Outline } from './components/Outline'
import { StatusBar } from './components/StatusBar'
import { FindReplace } from './components/FindReplace'
import { TerminalPanel } from './components/TerminalPanel'
import { useMenuActions } from './hooks/useMenuActions'
import { reducer, initialState } from './state/appState'
import { applyTheme } from './themes/applyTheme'
import { documentTitle } from '../../shared/document'
import { isDirty } from '../../shared/types'
import { MenuActionType } from '../../shared/ipc'
import { BUILTIN_THEMES, ThemeDefinition, findTheme } from '../../shared/themes'
import { isFormatAction } from './editor/format'

export function App(): JSX.Element {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [themes, setThemes] = useState<ThemeDefinition[]>([...BUILTIN_THEMES])
  const [recentWorkspaces, setRecentWorkspaces] = useState<readonly string[]>([])
  const [searchFocusToken, setSearchFocusToken] = useState(0)
  const formatRef = useRef<FormatDispatch | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state

  // Load persisted settings and available themes once.
  useEffect(() => {
    window.jypora.getThemes().then((t) => t.length > 0 && setThemes(t)).catch(() => undefined)
    window.jypora
      .getSettings()
      .then((s) => {
        setRecentWorkspaces(s.recentWorkspaces)
        if (s.themeId !== stateRef.current.themeId) dispatch({ type: 'set-theme', themeId: s.themeId })
      })
      .catch(() => undefined)
  }, [])

  const activeTheme = useMemo(() => findTheme(themes, state.themeId), [themes, state.themeId])

  useEffect(() => {
    applyTheme(activeTheme)
  }, [activeTheme])

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
    if (root) {
      dispatch({ type: 'set-workspace', root })
      const s = await window.jypora.getSettings()
      setRecentWorkspaces(s.recentWorkspaces)
    }
  }, [])

  const openWorkspace = useCallback((root: string) => dispatch({ type: 'set-workspace', root }), [])

  const setTheme = useCallback((themeId: string) => {
    dispatch({ type: 'set-theme', themeId })
    window.jypora.setSetting('themeId', themeId).catch(() => undefined)
  }, [])

  const renderedHtml = (): string => document.querySelector('.milkdown')?.innerHTML ?? ''

  const menuHandler = useCallback(
    (action: MenuActionType) => {
      const { doc } = stateRef.current
      const title = documentTitle(doc).replace(/\.[^.]+$/, '')

      if (action.startsWith('fmt:')) {
        const fa = action.slice(4)
        if (isFormatAction(fa)) formatRef.current?.(fa)
        return
      }
      if (action.startsWith('theme:')) {
        return setTheme(action.slice(6))
      }
      switch (action) {
        case 'new': return dispatch({ type: 'new' })
        case 'open': return void doOpen()
        case 'open-folder': return void doOpenFolder()
        case 'save': return void doSave()
        case 'save-as':
          return void window.jypora.saveFileAs(doc.content).then((fp) => fp && dispatch({ type: 'saved', filePath: fp }))
        case 'toggle-source': return dispatch({ type: 'toggle-source' })
        case 'toggle-sidebar': return dispatch({ type: 'toggle-sidebar' })
        case 'toggle-outline': return dispatch({ type: 'toggle-outline' })
        case 'toggle-terminal': return dispatch({ type: 'toggle-terminal' })
        case 'toggle-focus': return dispatch({ type: 'toggle-focus' })
        case 'toggle-typewriter': return dispatch({ type: 'toggle-typewriter' })
        case 'find': return dispatch({ type: 'set-find', visible: true })
        case 'search-files':
          if (!stateRef.current.sidebarVisible) dispatch({ type: 'toggle-sidebar' })
          return setSearchFocusToken((n) => n + 1)
        case 'export-html':
          return void window.jypora.exportHtml({ title, bodyHtml: renderedHtml(), theme: activeTheme.isDark ? 'dark' : 'light' })
        case 'export-pdf':
          return void window.jypora.exportPdf({ title, bodyHtml: renderedHtml(), theme: activeTheme.isDark ? 'dark' : 'light' })
        case 'export-docx':
          return void window.jypora.exportDocx({ title, markdown: doc.content })
      }
    },
    [doOpen, doOpenFolder, doSave, setTheme, activeTheme]
  )

  useMenuActions(menuHandler)

  // Recent-workspace clicks from the native File > Open Recent menu.
  useEffect(() => window.jypora.onOpenRecent((path) => dispatch({ type: 'set-workspace', root: path })), [])

  return (
    <div className={`jypora-app ${state.focusMode ? 'focus' : ''}`}>
      {state.sidebarVisible && !state.focusMode && (
        <Sidebar
          workspaceRoot={state.workspaceRoot}
          activePath={state.doc.filePath}
          recentWorkspaces={recentWorkspaces}
          searchFocusToken={searchFocusToken}
          onOpenFolder={doOpenFolder}
          onOpenWorkspace={openWorkspace}
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
            formatRef={formatRef}
          />
        </div>
        {state.terminalVisible && !state.focusMode && <TerminalPanel docPath={state.doc.filePath} />}
        <StatusBar content={state.doc.content} dirty={isDirty(state.doc)} sourceMode={state.sourceMode} />
      </main>
      {state.outlineVisible && !state.focusMode && (
        <Outline content={state.doc.content} onSelect={() => undefined} />
      )}
    </div>
  )
}
