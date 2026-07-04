import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Editor, FormatDispatch } from './components/Editor'
import { Sidebar } from './components/Sidebar'
import { Outline } from './components/Outline'
import { StatusBar } from './components/StatusBar'
import { FindReplace } from './components/FindReplace'
import { TerminalPanel } from './components/TerminalPanel'
import { TabBar } from './components/TabBar'
import { useMenuActions } from './hooks/useMenuActions'
import { usePanelSize } from './hooks/usePanelSize'
import { reducer, initialState, activeTab, anyDirty } from './state/appState'
import { applyTheme } from './themes/applyTheme'
import { documentTitle } from '../../shared/document'
import { isDirty } from '../../shared/types'
import { MenuActionType } from '../../shared/ipc'
import { BUILTIN_THEMES, ThemeDefinition, findTheme } from '../../shared/themes'
import { isFormatAction } from './editor/format'
import {
  installAnchorInterceptor,
  scrollSourceToHeading,
  scrollToHeadingIndex
} from './editor/navigation'

export function App(): JSX.Element {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [themes, setThemes] = useState<ThemeDefinition[]>([...BUILTIN_THEMES])
  const [recentWorkspaces, setRecentWorkspaces] = useState<readonly string[]>([])
  const [searchFocusToken, setSearchFocusToken] = useState(0)
  const formatRef = useRef<FormatDispatch | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state

  const tab = activeTab(state)
  const doc = tab.doc

  // Auto-save configuration mirrored from persisted settings.
  const [autoSave, setAutoSave] = useState(false)
  const [autoSaveDelayMs, setAutoSaveDelayMs] = useState(1500)

  // Drag-to-resize panel sizes (persisted per panel in localStorage).
  const sidebarPanel = usePanelSize('sidebar', { initial: 240, min: 160, max: 480, axis: 'x', sign: 1 })
  const outlinePanel = usePanelSize('outline', { initial: 220, min: 160, max: 440, axis: 'x', sign: -1 })
  const terminalPanel = usePanelSize('terminal', { initial: 240, min: 120, max: 600, axis: 'y', sign: -1 })

  // Load persisted settings and available themes once.
  useEffect(() => {
    window.jypora.getThemes().then((t) => t.length > 0 && setThemes(t)).catch(() => undefined)
    window.jypora
      .getSettings()
      .then((s) => {
        setRecentWorkspaces(s.recentWorkspaces)
        setAutoSave(s.autoSave)
        setAutoSaveDelayMs(s.autoSaveDelayMs)
        if (s.themeId !== stateRef.current.themeId) dispatch({ type: 'set-theme', themeId: s.themeId })
      })
      .catch(() => undefined)
  }, [])

  // Auto-save: debounce writes while the active document is dirty and has a path.
  useEffect(() => {
    if (!autoSave || !doc.filePath || !isDirty(doc)) return
    const timer = setTimeout(() => {
      const current = activeTab(stateRef.current).doc
      if (!current.filePath || !isDirty(current)) return
      window.jypora
        .saveFile(current.filePath, current.content)
        .then((ok) => ok && dispatch({ type: 'saved' }))
        .catch((error) => console.error('Auto-save failed:', error))
    }, autoSaveDelayMs)
    return () => clearTimeout(timer)
  }, [autoSave, autoSaveDelayMs, doc])

  const activeTheme = useMemo(() => findTheme(themes, state.themeId), [themes, state.themeId])

  useEffect(() => {
    applyTheme(activeTheme)
  }, [activeTheme])

  useEffect(() => {
    const mark = isDirty(doc) ? '• ' : ''
    document.title = `${mark}${documentTitle(doc)} — jypora`
    // Keep the main process informed so it can guard window close (any tab).
    window.jypora.setDirty(anyDirty(state))
  }, [doc, state])

  const doSave = useCallback(async () => {
    const current = activeTab(stateRef.current).doc
    if (current.filePath) {
      const ok = await window.jypora.saveFile(current.filePath, current.content)
      if (ok) dispatch({ type: 'saved' })
    } else {
      const filePath = await window.jypora.saveFileAs(current.content)
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

  const closeTab = useCallback((id?: number) => {
    const target = stateRef.current.tabs.find((t) => t.id === (id ?? stateRef.current.activeTabId))
    if (target && isDirty(target.doc)) {
      const ok = window.confirm(`"${documentTitle(target.doc)}" has unsaved changes. Close anyway?`)
      if (!ok) return
    }
    dispatch({ type: 'close-tab', id })
  }, [])

  const renderedHtml = (): string => document.querySelector('.milkdown')?.innerHTML ?? ''

  const menuHandler = useCallback(
    (action: MenuActionType) => {
      const current = activeTab(stateRef.current).doc
      const title = documentTitle(current).replace(/\.[^.]+$/, '')
      const exportPayload = {
        title,
        bodyHtml: renderedHtml(),
        theme: activeTheme.isDark ? 'dark' : 'light',
        themeVars: activeTheme.vars
      }

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
          return void window.jypora.saveFileAs(current.content).then((fp) => fp && dispatch({ type: 'saved', filePath: fp }))
        case 'close-tab': return closeTab()
        case 'next-tab': return dispatch({ type: 'cycle-tab', delta: 1 })
        case 'prev-tab': return dispatch({ type: 'cycle-tab', delta: -1 })
        case 'toggle-source': return dispatch({ type: 'toggle-source' })
        case 'toggle-sidebar': return dispatch({ type: 'toggle-sidebar' })
        case 'toggle-outline': return dispatch({ type: 'toggle-outline' })
        case 'toggle-terminal': return dispatch({ type: 'toggle-terminal' })
        case 'open-iterm':
          return void window.jypora
            .terminalOpenExternal(current.filePath)
            .catch((error) => console.error('Failed to open external terminal:', error))
        case 'toggle-focus': return dispatch({ type: 'toggle-focus' })
        case 'toggle-typewriter': return dispatch({ type: 'toggle-typewriter' })
        case 'find': return dispatch({ type: 'set-find', visible: true })
        case 'toggle-spellcheck':
          return void window.jypora
            .getSettings()
            .then((s) => window.jypora.setSetting('spellCheck', !s.spellCheck))
            .catch(() => undefined)
        case 'toggle-autosave':
          return setAutoSave((prev) => {
            const next = !prev
            window.jypora.setSetting('autoSave', next).catch(() => undefined)
            return next
          })
        case 'copy-markdown':
          return void window.jypora
            .copyText(current.content)
            .catch((error) => console.error('Copy as Markdown failed:', error))
        case 'copy-html':
          return void window.jypora
            .copyText(renderedHtml())
            .catch((error) => console.error('Copy as HTML failed:', error))
        case 'search-files':
          if (!stateRef.current.sidebarVisible) dispatch({ type: 'toggle-sidebar' })
          return setSearchFocusToken((n) => n + 1)
        case 'export-html':
          return void window.jypora.exportHtml(exportPayload)
        case 'export-pdf':
          return void window.jypora.exportPdf(exportPayload)
        case 'export-docx':
          return void window.jypora.exportDocx({ title, markdown: current.content })
      }
    },
    [doOpen, doOpenFolder, doSave, setTheme, closeTab, activeTheme]
  )

  useMenuActions(menuHandler)

  // Recent-workspace / recent-file clicks from the native File > Open Recent menu.
  useEffect(() => window.jypora.onOpenRecent((path) => dispatch({ type: 'set-workspace', root: path })), [])
  useEffect(() => window.jypora.onOpenRecentFile((path) => void openPath(path)), [openPath])

  // In-document anchor links (e.g. a hand-written TOC) scroll instead of navigating.
  useEffect(() => installAnchorInterceptor(), [])

  const goToHeading = useCallback((index: number) => {
    if (stateRef.current.sourceMode) {
      const textarea = document.querySelector<HTMLTextAreaElement>('.jypora-source')
      if (textarea) scrollSourceToHeading(textarea, index)
      return
    }
    scrollToHeadingIndex(index)
  }, [])

  const panelVars = {
    '--sidebar-w': `${sidebarPanel.size}px`,
    '--outline-w': `${outlinePanel.size}px`,
    '--terminal-h': `${terminalPanel.size}px`
  } as CSSProperties

  return (
    <div className={`jypora-app ${state.focusMode ? 'focus' : ''}`} style={panelVars}>
      {state.sidebarVisible && !state.focusMode && (
        <>
          <Sidebar
            workspaceRoot={state.workspaceRoot}
            activePath={doc.filePath}
            recentWorkspaces={recentWorkspaces}
            searchFocusToken={searchFocusToken}
            onOpenFolder={doOpenFolder}
            onOpenWorkspace={openWorkspace}
            onOpenFile={openPath}
          />
          <div
            className="panel-handle vertical"
            data-testid="sidebar-handle"
            onMouseDown={sidebarPanel.beginDrag}
            role="separator"
            aria-orientation="vertical"
          />
        </>
      )}
      <main className="jypora-main">
        <TabBar
          tabs={state.tabs}
          activeTabId={state.activeTabId}
          onActivate={(id) => dispatch({ type: 'activate-tab', id })}
          onClose={closeTab}
        />
        {state.findVisible && (
          <FindReplace
            content={doc.content}
            onReplaceAll={(next) => dispatch({ type: 'edit', content: next })}
            onClose={() => dispatch({ type: 'set-find', visible: false })}
          />
        )}
        <div className="jypora-editor-wrap">
          <Editor
            key={tab.id}
            value={doc.content}
            docPath={doc.filePath}
            sourceMode={state.sourceMode}
            typewriterMode={state.typewriterMode}
            onChange={(content) => dispatch({ type: 'edit', content })}
            formatRef={formatRef}
          />
        </div>
        {state.terminalVisible && !state.focusMode && (
          <>
            <div
              className="panel-handle horizontal"
              data-testid="terminal-handle"
              onMouseDown={terminalPanel.beginDrag}
              role="separator"
              aria-orientation="horizontal"
            />
            <TerminalPanel docPath={doc.filePath} />
          </>
        )}
        <StatusBar content={doc.content} dirty={isDirty(doc)} sourceMode={state.sourceMode} />
      </main>
      {state.outlineVisible && !state.focusMode && (
        <>
          <div
            className="panel-handle vertical"
            data-testid="outline-handle"
            onMouseDown={outlinePanel.beginDrag}
            role="separator"
            aria-orientation="vertical"
          />
          <Outline content={doc.content} onSelect={goToHeading} />
        </>
      )}
    </div>
  )
}
