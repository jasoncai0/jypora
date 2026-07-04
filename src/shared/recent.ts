/** Immutable helpers for a most-recently-used list of workspace paths. */

export const MAX_RECENT_WORKSPACES = 8

/**
 * Return a new list with `path` moved to the front, de-duplicated and capped at
 * `max`. Never mutates the input.
 */
export function addRecent(
  list: readonly string[],
  path: string,
  max: number = MAX_RECENT_WORKSPACES
): string[] {
  if (path.length === 0) return [...list]
  const withoutPath = list.filter((p) => p !== path)
  return [path, ...withoutPath].slice(0, max)
}

/** Remove a path from the list (e.g. when it no longer exists). */
export function removeRecent(list: readonly string[], path: string): string[] {
  return list.filter((p) => p !== path)
}

/** The last path segment, for display. */
export function workspaceLabel(path: string): string {
  const parts = path.split(/[/\\]/).filter(Boolean)
  return parts[parts.length - 1] ?? path
}
