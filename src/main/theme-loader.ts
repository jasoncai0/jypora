import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'
import { BUILTIN_THEMES, ThemeDefinition, mergeThemes, parseUserTheme } from '../shared/themes'

/**
 * User themes live as JSON files under <userData>/themes/*.json. Each file is
 * validated with parseUserTheme, so a malformed file is skipped rather than
 * breaking the app. This makes the theme system pluggable: drop a JSON file in
 * and it appears in the Theme menu on next launch.
 */
function themesDir(): string {
  return join(app.getPath('userData'), 'themes')
}

async function loadUserThemes(): Promise<ThemeDefinition[]> {
  const dir = themesDir()
  let files: string[]
  try {
    files = (await fs.readdir(dir)).filter((f) => f.toLowerCase().endsWith('.json'))
  } catch {
    return [] // directory absent — no user themes yet
  }

  const themes: ThemeDefinition[] = []
  for (const file of files) {
    try {
      const raw = await fs.readFile(join(dir, file), 'utf-8')
      const parsed = parseUserTheme(JSON.parse(raw))
      if (parsed) themes.push(parsed)
      else console.warn('Ignoring invalid theme file:', file)
    } catch (error) {
      console.warn('Failed to read theme file:', file, error)
    }
  }
  return themes
}

/** Built-in themes merged with any valid user themes (user overrides win). */
export async function getAllThemes(): Promise<ThemeDefinition[]> {
  const user = await loadUserThemes()
  return mergeThemes(BUILTIN_THEMES, user)
}

/** Ensure the themes directory exists and drop a README the first time. */
export async function ensureThemesDir(): Promise<void> {
  const dir = themesDir()
  try {
    await fs.mkdir(dir, { recursive: true })
    const readme = join(dir, 'README.txt')
    await fs.access(readme).catch(async () => {
      await fs.writeFile(
        readme,
        'Drop a theme JSON here to add a custom theme. Shape:\n' +
          '{ "id": "my-theme", "name": "My Theme", "isDark": false,\n' +
          '  "vars": { "bg": "#fff", "fg": "#111", "muted": "#888",\n' +
          '            "border": "#eee", "sidebar-bg": "#f5f5f5", "accent": "#4c8bf5" } }\n'
      )
    })
  } catch (error) {
    console.warn('Could not initialize themes dir:', error)
  }
}
