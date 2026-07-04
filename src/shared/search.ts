import { FileNode } from './types'

/**
 * Fuzzy-ish file matching for the sidebar search box. A query matches when all
 * of its (lowercased, whitespace-trimmed) characters appear in order within the
 * candidate — a lightweight subsequence match, forgiving of gaps.
 */
export function fuzzyMatch(candidate: string, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (q.length === 0) return true
  const c = candidate.toLowerCase()
  let qi = 0
  for (let ci = 0; ci < c.length && qi < q.length; ci++) {
    if (c[ci] === q[qi]) qi++
  }
  return qi === q.length
}

/** Filter a flat list of file nodes by a query against their names. */
export function filterNodes(nodes: readonly FileNode[], query: string): FileNode[] {
  if (query.trim().length === 0) return [...nodes]
  return nodes.filter((n) => fuzzyMatch(n.name, query))
}

/**
 * Rank matches so that a prefix match sorts before a scattered subsequence
 * match, then alphabetically. Used to order search results.
 */
export function rankMatches(nodes: readonly FileNode[], query: string): FileNode[] {
  const q = query.trim().toLowerCase()
  const score = (name: string): number => {
    const lower = name.toLowerCase()
    if (lower.startsWith(q)) return 0
    if (lower.includes(q)) return 1
    return 2
  }
  return [...nodes].sort((a, b) => {
    const diff = score(a.name) - score(b.name)
    return diff !== 0 ? diff : a.name.localeCompare(b.name)
  })
}
