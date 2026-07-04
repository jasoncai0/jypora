import { ThemeDefinition, crepeVarsFor } from '../../../shared/themes'

/**
 * Apply a theme to the document root: app CSS variables, the derived Crepe
 * editor variables, and a `data-theme` attribute (light/dark) used by styles
 * and `color-scheme` (native scrollbars, form controls).
 */
export function applyTheme(theme: ThemeDefinition): void {
  const root = document.documentElement
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(`--${key}`, value)
  }
  for (const [key, value] of Object.entries(crepeVarsFor(theme))) {
    root.style.setProperty(`--${key}`, value)
  }
  root.dataset.theme = theme.isDark ? 'dark' : 'light'
  root.dataset.themeId = theme.id
}
