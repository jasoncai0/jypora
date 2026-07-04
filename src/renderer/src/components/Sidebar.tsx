import { useEffect, useRef, useState } from 'react'
import { FileNode } from '../../../shared/types'
import { iconFor } from '../../../shared/file-icons'
import { workspaceLabel } from '../../../shared/recent'

interface SidebarProps {
  readonly workspaceRoot: string | null
  readonly activePath: string | null
  readonly recentWorkspaces: readonly string[]
  readonly searchFocusToken: number
  readonly onOpenFolder: () => void
  readonly onOpenWorkspace: (path: string) => void
  readonly onOpenFile: (path: string) => void
}

interface TreeProps {
  readonly path: string
  readonly activePath: string | null
  readonly onOpenFile: (path: string) => void
  readonly depth: number
}

function TreeNode({ node, activePath, onOpenFile, depth }: { node: FileNode } & Omit<TreeProps, 'path'>): JSX.Element {
  const [expanded, setExpanded] = useState(false)
  const pad = { paddingLeft: `${depth * 12 + 8}px` }

  if (node.isDirectory) {
    return (
      <div>
        <div className="tree-row dir" style={pad} onClick={() => setExpanded((v) => !v)}>
          <span className="chevron">{expanded ? '▾' : '▸'}</span>
          <span className="file-icon">{iconFor(node.name, true, expanded)}</span>
          {node.name}
        </div>
        {expanded && <DirChildren path={node.path} activePath={activePath} onOpenFile={onOpenFile} depth={depth + 1} />}
      </div>
    )
  }

  return (
    <div
      className={`tree-row file ${activePath === node.path ? 'active' : ''}`}
      style={pad}
      onClick={() => onOpenFile(node.path)}
    >
      <span className="file-icon">{iconFor(node.name, false)}</span>
      {node.name}
    </div>
  )
}

function DirChildren({ path, activePath, onOpenFile, depth }: TreeProps): JSX.Element {
  const [nodes, setNodes] = useState<FileNode[]>([])

  useEffect(() => {
    let active = true
    window.jypora
      .readDir(path)
      .then((result) => active && setNodes(result))
      .catch((error) => console.error('Failed to read directory:', error))
    return () => {
      active = false
    }
  }, [path])

  return (
    <>
      {nodes.map((node) => (
        <TreeNode key={node.path} node={node} activePath={activePath} onOpenFile={onOpenFile} depth={depth} />
      ))}
    </>
  )
}

/** Search results view — flat list of matching markdown files across the tree. */
function SearchResults({
  root,
  query,
  activePath,
  onOpenFile
}: {
  root: string
  query: string
  activePath: string | null
  onOpenFile: (path: string) => void
}): JSX.Element {
  const [results, setResults] = useState<FileNode[]>([])

  useEffect(() => {
    let active = true
    window.jypora
      .searchWorkspace(root, query)
      .then((r) => active && setResults(r))
      .catch((error) => console.error('Search failed:', error))
    return () => {
      active = false
    }
  }, [root, query])

  if (results.length === 0) return <div className="sidebar-empty">No matches</div>
  return (
    <>
      {results.map((node) => (
        <div
          key={node.path}
          className={`tree-row file ${activePath === node.path ? 'active' : ''}`}
          style={{ paddingLeft: '8px' }}
          onClick={() => onOpenFile(node.path)}
          title={node.path}
        >
          <span className="file-icon">{iconFor(node.name, false)}</span>
          {node.name}
        </div>
      ))}
    </>
  )
}

export function Sidebar({
  workspaceRoot,
  activePath,
  recentWorkspaces,
  searchFocusToken,
  onOpenFolder,
  onOpenWorkspace,
  onOpenFile
}: SidebarProps): JSX.Element {
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  // Focus the search box when the Search Files command fires.
  useEffect(() => {
    if (searchFocusToken > 0) searchRef.current?.focus()
  }, [searchFocusToken])

  const trimmed = query.trim()

  return (
    <aside className="jypora-sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">{workspaceRoot ? workspaceLabel(workspaceRoot) : 'No folder'}</span>
        <button className="sidebar-btn" onClick={onOpenFolder} title="Open folder">
          ⊞
        </button>
      </div>

      {workspaceRoot && (
        <input
          ref={searchRef}
          className="sidebar-search"
          placeholder="Search files…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
        />
      )}

      <div className="sidebar-tree">
        {!workspaceRoot ? (
          <div className="sidebar-recents">
            <div className="sidebar-empty" onClick={onOpenFolder}>
              Open a folder…
            </div>
            {recentWorkspaces.length > 0 && (
              <>
                <div className="recents-title">Recent</div>
                {recentWorkspaces.map((path) => (
                  <div key={path} className="tree-row file" title={path} onClick={() => onOpenWorkspace(path)}>
                    <span className="file-icon">🕘</span>
                    {workspaceLabel(path)}
                  </div>
                ))}
              </>
            )}
          </div>
        ) : trimmed.length > 0 ? (
          <SearchResults root={workspaceRoot} query={trimmed} activePath={activePath} onOpenFile={onOpenFile} />
        ) : (
          <DirChildren path={workspaceRoot} activePath={activePath} onOpenFile={onOpenFile} depth={0} />
        )}
      </div>
    </aside>
  )
}
