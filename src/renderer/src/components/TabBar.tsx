import { TabState } from '../state/appState'
import { documentTitle } from '../../../shared/document'
import { isDirty } from '../../../shared/types'

interface TabBarProps {
  readonly tabs: readonly TabState[]
  readonly activeTabId: number
  readonly onActivate: (id: number) => void
  readonly onClose: (id: number) => void
}

/** Horizontal tab strip above the editor. Hidden when only one tab is open. */
export function TabBar({ tabs, activeTabId, onActivate, onClose }: TabBarProps): JSX.Element | null {
  if (tabs.length <= 1) return null

  return (
    <div className="jypora-tabbar" role="tablist">
      {tabs.map((tab) => {
        const dirty = isDirty(tab.doc)
        return (
          <div
            key={tab.id}
            role="tab"
            aria-selected={tab.id === activeTabId}
            className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
            title={tab.doc.filePath ?? 'Untitled'}
            onClick={() => onActivate(tab.id)}
            onAuxClick={(e) => e.button === 1 && onClose(tab.id)}
          >
            <span className="tab-title">
              {dirty && <span className="tab-dirty">•</span>}
              {documentTitle(tab.doc)}
            </span>
            <button
              className="tab-close"
              aria-label="Close tab"
              onClick={(e) => {
                e.stopPropagation()
                onClose(tab.id)
              }}
            >
              ×
            </button>
          </div>
        )
      })}
    </div>
  )
}
