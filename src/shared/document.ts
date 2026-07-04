import { DocumentState } from './types'

/**
 * Immutable document-state transitions. Every function returns a new object;
 * the input is never mutated.
 */

export function createDocument(): DocumentState {
  return { filePath: null, content: '', savedContent: '' }
}

export function openDocument(filePath: string, content: string): DocumentState {
  return { filePath, content, savedContent: content }
}

export function editContent(doc: DocumentState, content: string): DocumentState {
  if (content === doc.content) return doc
  return { ...doc, content }
}

/** Mark the current content as saved, optionally under a new path. */
export function markSaved(doc: DocumentState, filePath?: string): DocumentState {
  return {
    ...doc,
    filePath: filePath ?? doc.filePath,
    savedContent: doc.content
  }
}

export function documentTitle(doc: DocumentState): string {
  if (!doc.filePath) return 'Untitled'
  const parts = doc.filePath.split(/[/\\]/)
  return parts[parts.length - 1] || 'Untitled'
}
