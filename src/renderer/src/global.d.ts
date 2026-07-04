import type { JyporaApi } from '../../preload'

declare global {
  interface Window {
    readonly jypora: JyporaApi
  }
}

export {}
