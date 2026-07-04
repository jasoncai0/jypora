import { describe, expect, test } from 'vitest'
import {
  BUILTIN_THEMES,
  crepeVarsFor,
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

describe('crepeVarsFor', () => {
  const REQUIRED_CREPE_KEYS = [
    'crepe-color-background',
    'crepe-color-on-background',
    'crepe-color-surface',
    'crepe-color-surface-low',
    'crepe-color-on-surface',
    'crepe-color-on-surface-variant',
    'crepe-color-outline',
    'crepe-color-primary',
    'crepe-color-secondary',
    'crepe-color-on-secondary',
    'crepe-color-inverse',
    'crepe-color-on-inverse',
    'crepe-color-inline-code',
    'crepe-color-error',
    'crepe-color-hover',
    'crepe-color-selected',
    'crepe-color-inline-area',
    'crepe-font-title',
    'crepe-font-default',
    'crepe-font-code',
    'crepe-shadow-1',
    'crepe-shadow-2'
  ]

  test('every builtin theme yields the full crepe variable set', () => {
    for (const theme of BUILTIN_THEMES) {
      const vars = crepeVarsFor(theme)
      for (const key of REQUIRED_CREPE_KEYS) {
        expect(vars[key], `${theme.id} missing ${key}`).toBeTruthy()
      }
    }
  })

  test('maps app palette onto editor surface', () => {
    const dark = findTheme(BUILTIN_THEMES, 'dark')
    const vars = crepeVarsFor(dark)
    expect(vars['crepe-color-background']).toBe(dark.vars.bg)
    expect(vars['crepe-color-primary']).toBe(dark.vars.accent)
    expect(vars['crepe-color-hover']).toContain('color-mix')
  })

  test('error/inline-code colors flip with isDark', () => {
    const light = crepeVarsFor(findTheme(BUILTIN_THEMES, 'light'))
    const dark = crepeVarsFor(findTheme(BUILTIN_THEMES, 'dark'))
    expect(light['crepe-color-error']).not.toBe(dark['crepe-color-error'])
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
