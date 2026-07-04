import { useEffect, useState } from 'react'
import { FileNode } from '../../../shared/types'

interface SidebarProps {
  readonly workspaceRoot: string | null
  readonly activePath: string | null
  readonly onOpenFolder: () => void
  readonly onOpenFile: (path: string) => void
}

interface TreeProps {
  readonly path: string
  readonly activePath: string | null
  readonly onOpenFile: (path: string) => void
  readonly depth: number
}

function basename(path: string): string {
  const parts = path.split(/[/\\]/)
  return parts[parts.length - 1] || path
}

function TreeNode({ node, activePath, onOpenFile, depth }: { node: FileNode } & Omit<TreeProps, 'path'>): JSX.Element {
  const [expanded, setExpanded] = useState(false)
  const pad = { paddingLeft: `${depth * 12 + 8}px` }

  if (node.isDirectory) {
    return (
      <div>
        <div className="tree-row dir" style={pad} onClick={() => setExpanded((v) => !v)}>
          <span className="chevron">{expanded ? '▾' : '▸'}</span>
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

export function Sidebar({ workspaceRoot, activePath, onOpenFolder, onOpenFile }: SidebarProps): JSX.Element {
  return (
    <aside className="jypora-sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">{workspaceRoot ? basename(workspaceRoot) : 'No folder'}</span>
        <button className="sidebar-btn" onClick={onOpenFolder} title="Open folder">
          ⊞
        </button>
      </div>
      <div className="sidebar-tree">
        {workspaceRoot ? (
          <DirChildren path={workspaceRoot} activePath={activePath} onOpenFile={onOpenFile} depth={0} />
        ) : (
          <div className="sidebar-empty" onClick={onOpenFolder}>
            Open a folder…
          </div>
        )}
      </div>
    </aside>
  )
}
