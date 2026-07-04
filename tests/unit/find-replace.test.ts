import { describe, expect, test } from 'vitest'
import { findAll, nextMatchIndex, replaceAll } from '../../src/shared/find-replace'

describe('findAll', () => {
  test('finds all case-insensitive matches by default', () => {
    expect(findAll('aAaA', 'a')).toHaveLength(4)
  })

  test('respects case sensitivity', () => {
    expect(findAll('aAaA', 'a', { caseSensitive: true })).toHaveLength(2)
  })

  test('supports whole-word matching', () => {
    const matches = findAll('cat cats cat', 'cat', { wholeWord: true })
    expect(matches).toHaveLength(2)
  })

  test('escapes regex metacharacters', () => {
    expect(findAll('a.b.c', '.')).toHaveLength(2)
  })

  test('returns empty for empty query', () => {
    expect(findAll('abc', '')).toEqual([])
  })

  test('reports correct positions', () => {
    expect(findAll('__x__x', 'x')).toEqual([
      { start: 2, end: 3 },
      { start: 5, end: 6 }
    ])
  })
})

describe('replaceAll', () => {
  test('replaces every occurrence', () => {
    expect(replaceAll('a a a', 'a', 'b')).toBe('b b b')
  })

  test('is case-insensitive by default', () => {
    expect(replaceAll('Aa', 'a', 'x')).toBe('xx')
  })

  test('returns original for empty query', () => {
    expect(replaceAll('abc', '', 'x')).toBe('abc')
  })
})

describe('nextMatchIndex', () => {
  const matches = [
    { start: 2, end: 3 },
    { start: 8, end: 9 }
  ]

  test('finds first match at or after cursor', () => {
    expect(nextMatchIndex(matches, 0)).toBe(0)
    expect(nextMatchIndex(matches, 5)).toBe(1)
  })

  test('wraps to start past the last match', () => {
    expect(nextMatchIndex(matches, 100)).toBe(0)
  })

  test('returns -1 when no matches', () => {
    expect(nextMatchIndex([], 0)).toBe(-1)
  })
})
