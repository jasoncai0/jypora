import { useEffect } from 'react'
import { MenuActionType } from '../../../shared/ipc'

/** Subscribe to native-menu actions and clean up on unmount. */
export function useMenuActions(handler: (action: MenuActionType) => void): void {
  useEffect(() => {
    const unsubscribe = window.jypora.onMenuAction(handler)
    return unsubscribe
  }, [handler])
}
