import Store from 'electron-store'
import { AppSettings, DEFAULT_SETTINGS } from '../shared/types'

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
