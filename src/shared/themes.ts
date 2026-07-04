/**
 * Theme registry. Themes are plain data (CSS variable maps) so they are easy to
 * unit-test, serialize, and extend. Built-in themes ship here; user themes are
 * loaded from disk (see main/theme-loader) and validated with `parseUserTheme`,
 * making the system pluggable without code changes.
 */

export interface ThemeDefinition {
  readonly id: string
  readonly name: string
  readonly isDark: boolean
  /** CSS custom-property values, keyed WITHOUT the leading `--`. */
  readonly vars: Readonly<Record<string, string>>
}

/** The variable keys every theme must define. */
export const THEME_VAR_KEYS = ['bg', 'fg', 'muted', 'border', 'sidebar-bg', 'accent'] as const

export const BUILTIN_THEMES: readonly ThemeDefinition[] = [
  {
    id: 'light',
    name: 'Light',
    isDark: false,
    vars: { bg: '#ffffff', fg: '#2c2c2c', muted: '#8a8a8a', border: '#eaeaea', 'sidebar-bg': '#f7f7f7', accent: '#4c8bf5' }
  },
  {
    id: 'dark',
    name: 'Dark',
    isDark: true,
    vars: { bg: '#1e1e1e', fg: '#d4d4d4', muted: '#808080', border: '#333333', 'sidebar-bg': '#252525', accent: '#5a9bff' }
  },
  {
    id: 'sepia',
    name: 'Sepia',
    isDark: false,
    vars: { bg: '#f4ecd8', fg: '#5b4636', muted: '#9c8a72', border: '#e0d5bd', 'sidebar-bg': '#efe6cf', accent: '#a8703e' }
  },
  {
    id: 'nord',
    name: 'Nord',
    isDark: true,
    vars: { bg: '#2e3440', fg: '#d8dee9', muted: '#7b869c', border: '#3b4252', 'sidebar-bg': '#3b4252', accent: '#88c0d0' }
  },
  {
    id: 'solarized',
    name: 'Solarized Light',
    isDark: false,
    vars: { bg: '#fdf6e3', fg: '#586e75', muted: '#93a1a1', border: '#eee8d5', 'sidebar-bg': '#eee8d5', accent: '#268bd2' }
  },
  {
    id: 'dracula',
    name: 'Dracula',
    isDark: true,
    vars: { bg: '#282a36', fg: '#f8f8f2', muted: '#8a8ea8', border: '#44475a', 'sidebar-bg': '#21222c', accent: '#bd93f9' }
  }
]

/** Look up a theme by id, falling back to Light when unknown. */
export function findTheme(themes: readonly ThemeDefinition[], id: string): ThemeDefinition {
  return themes.find((t) => t.id === id) ?? themes[0] ?? BUILTIN_THEMES[0]
}

/** Turn a theme's variable map into a `--key: value;` CSS string. */
export function themeToCss(theme: ThemeDefinition): string {
  return Object.entries(theme.vars)
    .map(([key, value]) => `--${key}: ${value};`)
    .join(' ')
}

/**
 * Validate and normalize an untrusted user theme (parsed JSON). Returns a clean
 * ThemeDefinition or null when the shape is invalid — never throws.
 */
export function parseUserTheme(input: unknown): ThemeDefinition | null {
  if (typeof input !== 'object' || input === null) return null
  const obj = input as Record<string, unknown>
  if (typeof obj.id !== 'string' || obj.id.length === 0) return null
  if (typeof obj.name !== 'string' || obj.name.length === 0) return null
  if (typeof obj.vars !== 'object' || obj.vars === null) return null

  const rawVars = obj.vars as Record<string, unknown>
  const vars: Record<string, string> = {}
  for (const key of THEME_VAR_KEYS) {
    const value = rawVars[key]
    if (typeof value !== 'string') return null
    vars[key] = value
  }
  return { id: obj.id, name: obj.name, isDark: obj.isDark === true, vars }
}

/**
 * Derive the Milkdown Crepe editor variables (`--crepe-*`) from a theme so the
 * editor chrome (cursor, selection, hover, dropdowns, toolbars) matches the app
 * theme. Crepe's own theme CSS defines these on `.milkdown`; we generate them
 * instead so every jypora theme — built-in or user-provided — styles the editor
 * consistently. Uses CSS `color-mix()` so no color math is needed in JS.
 */
export function crepeVarsFor(theme: ThemeDefinition): Record<string, string> {
  const bg = theme.vars.bg
  const fg = theme.vars.fg
  const muted = theme.vars.muted
  const accent = theme.vars.accent
  const surface = theme.vars['sidebar-bg']
  const mix = (base: string, tint: string, pct: number): string =>
    `color-mix(in srgb, ${base}, ${tint} ${pct}%)`

  return {
    'crepe-color-background': bg,
    'crepe-color-on-background': fg,
    'crepe-color-surface': surface,
    'crepe-color-surface-low': mix(surface, bg, 50),
    'crepe-color-on-surface': fg,
    'crepe-color-on-surface-variant': muted,
    'crepe-color-outline': muted,
    'crepe-color-primary': accent,
    'crepe-color-secondary': mix(bg, accent, 18),
    'crepe-color-on-secondary': fg,
    'crepe-color-inverse': fg,
    'crepe-color-on-inverse': bg,
    'crepe-color-inline-code': theme.isDark ? '#ffb4ab' : '#ba1a1a',
    'crepe-color-error': theme.isDark ? '#ffb4ab' : '#ba1a1a',
    'crepe-color-hover': mix(bg, fg, 5),
    'crepe-color-selected': mix(bg, fg, 12),
    'crepe-color-inline-area': mix(bg, fg, 8),
    'crepe-font-title':
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
    'crepe-font-default':
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
    'crepe-font-code': "'SFMono-Regular', Menlo, Monaco, Consolas, monospace",
    'crepe-shadow-1':
      '0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)',
    'crepe-shadow-2':
      '0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)'
  }
}

/** Merge user themes over built-ins, de-duplicating by id (user wins). */
export function mergeThemes(
  builtins: readonly ThemeDefinition[],
  userThemes: readonly ThemeDefinition[]
): ThemeDefinition[] {
  const byId = new Map<string, ThemeDefinition>()
  for (const theme of builtins) byId.set(theme.id, theme)
  for (const theme of userThemes) byId.set(theme.id, theme)
  return [...byId.values()]
}
