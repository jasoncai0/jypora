import { ThemeDefinition } from '../../../shared/themes'

/**
 * Apply a theme to the document root by writing its CSS custom properties and
 * setting a `data-theme` attribute (light/dark) used by Crepe and app styles.
 */
export function applyTheme(theme: ThemeDefinition): void {
  const root = document.documentElement
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(`--${key}`, value)
  }
  root.dataset.theme = theme.isDark ? 'dark' : 'light'
  root.dataset.themeId = theme.id
}
