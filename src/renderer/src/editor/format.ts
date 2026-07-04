import type { Editor } from '@milkdown/kit/core'
import { callCommand } from '@milkdown/kit/utils'
import {
  toggleStrongCommand,
  toggleEmphasisCommand,
  toggleInlineCodeCommand,
  toggleLinkCommand,
  wrapInHeadingCommand,
  turnIntoTextCommand,
  wrapInBlockquoteCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand,
  insertHrCommand,
  createCodeBlockCommand
} from '@milkdown/kit/preset/commonmark'
import { toggleStrikethroughCommand, insertTableCommand } from '@milkdown/kit/preset/gfm'

/** All formatting actions the menu/hotkeys can dispatch to the editor. */
export type FormatAction =
  | 'bold'
  | 'italic'
  | 'strike'
  | 'inline-code'
  | 'link'
  | 'code-block'
  | 'quote'
  | 'bullet-list'
  | 'ordered-list'
  | 'hr'
  | 'table'
  | 'paragraph'
  | 'heading-1'
  | 'heading-2'
  | 'heading-3'
  | 'heading-4'
  | 'heading-5'
  | 'heading-6'

/** The set of valid format actions, for validation/testing. */
export const FORMAT_ACTIONS: readonly FormatAction[] = [
  'bold', 'italic', 'strike', 'inline-code', 'link', 'code-block', 'quote',
  'bullet-list', 'ordered-list', 'hr', 'table', 'paragraph',
  'heading-1', 'heading-2', 'heading-3', 'heading-4', 'heading-5', 'heading-6'
]

export function isFormatAction(value: string): value is FormatAction {
  return (FORMAT_ACTIONS as readonly string[]).includes(value)
}

/** Parse `heading-N` into its numeric level, or null. */
export function headingLevel(action: string): number | null {
  const match = /^heading-([1-6])$/.exec(action)
  return match ? Number(match[1]) : null
}

/**
 * Apply a formatting action to the live Milkdown editor. Unknown actions and
 * runtime errors are swallowed with a log so a bad keystroke never crashes the
 * editor.
 */
export function runFormat(editor: Editor, action: FormatAction): void {
  try {
    const level = headingLevel(action)
    if (level !== null) {
      editor.action(callCommand(wrapInHeadingCommand.key, level))
      return
    }
    switch (action) {
      case 'bold': editor.action(callCommand(toggleStrongCommand.key)); break
      case 'italic': editor.action(callCommand(toggleEmphasisCommand.key)); break
      case 'strike': editor.action(callCommand(toggleStrikethroughCommand.key)); break
      case 'inline-code': editor.action(callCommand(toggleInlineCodeCommand.key)); break
      case 'link': editor.action(callCommand(toggleLinkCommand.key)); break
      case 'code-block': editor.action(callCommand(createCodeBlockCommand.key)); break
      case 'quote': editor.action(callCommand(wrapInBlockquoteCommand.key)); break
      case 'bullet-list': editor.action(callCommand(wrapInBulletListCommand.key)); break
      case 'ordered-list': editor.action(callCommand(wrapInOrderedListCommand.key)); break
      case 'hr': editor.action(callCommand(insertHrCommand.key)); break
      case 'table': editor.action(callCommand(insertTableCommand.key)); break
      case 'paragraph': editor.action(callCommand(turnIntoTextCommand.key)); break
    }
  } catch (error) {
    console.error('Format command failed:', action, error)
  }
}
