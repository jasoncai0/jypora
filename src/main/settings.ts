import Store from 'electron-store'
import { AppSettings, DEFAULT_SETTINGS } from '../shared/types'
import { addRecent } from '../shared/recent'

/**
 * Persistent application settings backed by electron-store. Reads return a
 * merged view over the defaults so missing keys never surface as undefined.
 */
const store = new Store<AppSettings>({ defaults: DEFAULT_SETTINGS })

export function getSettings(): AppSettings {
  return { ...DEFAULT_SETTINGS, ...store.store }
}

export function setSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): AppSettings {
  store.set(key, value)
  return getSettings()
}

/** Record a workspace as most-recently-used and return the updated settings. */
export function pushRecentWorkspace(path: string): AppSettings {
  const next = addRecent(getSettings().recentWorkspaces, path)
  return setSetting('recentWorkspaces', next)
}

/** Record a document as most-recently-used and return the updated settings. */
export function pushRecentFile(path: string): AppSettings {
  const next = addRecent(getSettings().recentFiles, path)
  return setSetting('recentFiles', next)
}
