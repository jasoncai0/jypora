import { describe, expect, test } from 'vitest'
import {
  countChars,
  countWords,
  extractOutline,
  readingTimeMinutes,
  slugify
} from '../../src/shared/markdown'

describe('slugify', () => {
  test('lowercases and hyphenates', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  test('strips punctuation and collapses spaces', () => {
    expect(slugify('  Foo:  Bar!! ')).toBe('foo-bar')
  })

  test('keeps CJK characters', () => {
    expect(slugify('你好 世界')).toBe('你好-世界')
  })
})

describe('extractOutline', () => {
  test('extracts headings with levels and lines', () => {
    const md = '# Title\n\nsome text\n\n## Section\n\n### Sub'
    const outline = extractOutline(md)
    expect(outline).toHaveLength(3)
    expect(outline[0]).toMatchObject({ level: 1, text: 'Title', line: 0 })
    expect(outline[1]).toMatchObject({ level: 2, text: 'Section' })
    expect(outline[2].level).toBe(3)
  })

  test('ignores headings inside fenced code blocks', () => {
    const md = '# Real\n\n```\n# not a heading\n```\n\n## Also real'
    const outline = extractOutline(md)
    expect(outline.map((h) => h.text)).toEqual(['Real', 'Also real'])
  })

  test('deduplicates slugs', () => {
    const outline = extractOutline('# Dup\n## Dup')
    expect(outline[0].slug).toBe('dup')
    expect(outline[1].slug).toBe('dup-1')
  })

  test('returns empty array for no headings', () => {
    expect(extractOutline('just text')).toEqual([])
  })
})

describe('countWords', () => {
  test('counts space-separated words', () => {
    expect(countWords('the quick brown fox')).toBe(4)
  })

  test('counts CJK characters individually', () => {
    expect(countWords('你好世界')).toBe(4)
  })

  test('mixes latin and CJK', () => {
    expect(countWords('hello 你好')).toBe(3)
  })

  test('returns 0 for empty', () => {
    expect(countWords('   ')).toBe(0)
  })
})

describe('countChars', () => {
  test('excludes newlines', () => {
    expect(countChars('ab\ncd')).toBe(4)
  })
})

describe('readingTimeMinutes', () => {
  test('is 0 for empty text', () => {
    expect(readingTimeMinutes('')).toBe(0)
  })

  test('is at least 1 for short text', () => {
    expect(readingTimeMinutes('one two three')).toBe(1)
  })

  test('scales with length', () => {
    const words = Array.from({ length: 400 }, () => 'word').join(' ')
    expect(readingTimeMinutes(words)).toBe(2)
  })
})
