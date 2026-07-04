import { describe, expect, test } from 'vitest'
import {
  BUILTIN_THEMES,
  findTheme,
  mergeThemes,
  parseUserTheme,
  themeToCss,
  THEME_VAR_KEYS
} from '../../src/shared/themes'

describe('builtin themes', () => {
  test('every theme defines all required vars', () => {
    for (const theme of BUILTIN_THEMES) {
      for (const key of THEME_VAR_KEYS) {
        expect(theme.vars[key], `${theme.id} missing ${key}`).toBeTruthy()
      }
    }
  })

  test('ids are unique', () => {
    const ids = BUILTIN_THEMES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('findTheme', () => {
  test('finds by id', () => {
    expect(findTheme(BUILTIN_THEMES, 'dracula').name).toBe('Dracula')
  })

  test('falls back to first theme when unknown', () => {
    expect(findTheme(BUILTIN_THEMES, 'nope').id).toBe('light')
  })
})

describe('themeToCss', () => {
  test('emits css custom properties', () => {
    const css = themeToCss(BUILTIN_THEMES[0])
    expect(css).toContain('--bg:')
    expect(css).toContain('--accent:')
  })
})

describe('parseUserTheme', () => {
  const valid = {
    id: 'custom',
    name: 'Custom',
    isDark: true,
    vars: { bg: '#000', fg: '#fff', muted: '#888', border: '#333', 'sidebar-bg': '#111', accent: '#f0f' }
  }

  test('accepts a well-formed theme', () => {
    expect(parseUserTheme(valid)?.id).toBe('custom')
  })

  test('rejects missing vars', () => {
    expect(parseUserTheme({ ...valid, vars: { bg: '#000' } })).toBeNull()
  })

  test('rejects non-object', () => {
    expect(parseUserTheme(null)).toBeNull()
    expect(parseUserTheme('x')).toBeNull()
  })

  test('rejects missing id/name', () => {
    expect(parseUserTheme({ ...valid, id: '' })).toBeNull()
    expect(parseUserTheme({ ...valid, name: undefined })).toBeNull()
  })

  test('defaults isDark to false', () => {
    const parsed = parseUserTheme({ ...valid, isDark: undefined })
    expect(parsed?.isDark).toBe(false)
  })
})

describe('mergeThemes', () => {
  test('user themes override builtins by id', () => {
    const custom = { ...BUILTIN_THEMES[0], name: 'Overridden' }
    const merged = mergeThemes(BUILTIN_THEMES, [custom])
    expect(merged).toHaveLength(BUILTIN_THEMES.length)
    expect(findTheme(merged, custom.id).name).toBe('Overridden')
  })

  test('appends new user themes', () => {
    const extra = { id: 'x', name: 'X', isDark: false, vars: BUILTIN_THEMES[0].vars }
    expect(mergeThemes(BUILTIN_THEMES, [extra])).toHaveLength(BUILTIN_THEMES.length + 1)
  })
})
