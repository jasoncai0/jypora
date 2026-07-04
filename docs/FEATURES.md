# jypora — Feature Parity Checklist

Clean-room, open-source Typora-*like* editor. This document is the acceptance
checklist used to validate parity. Each item is marked in
[docs/PARITY.md](./PARITY.md) after implementation.

> Legal note: jypora is an independent implementation. It does not use Typora's
> code, assets, or branding. Typora® is a trademark of its respective owner.

## Core editing (Typora's defining feature)
- [ ] Seamless single-pane live WYSIWYG editing (no split preview)
- [ ] Inline rendering of headings (# .. ######)
- [ ] Bold / italic / strikethrough
- [ ] Ordered / unordered lists
- [ ] Task lists (checkboxes)
- [ ] Blockquotes
- [ ] Inline code and fenced code blocks with syntax highlighting
- [ ] Tables (create/edit inline)
- [ ] Links and images
- [ ] Horizontal rules
- [ ] Math (KaTeX) — inline `$..$` and block `$$..$$`
- [ ] Mermaid diagrams
- [ ] Footnotes

## Files & workspace
- [ ] New / Open / Save / Save As
- [ ] Open folder as workspace (file tree sidebar)
- [ ] File tree navigation (open .md files on click)
- [ ] Recent files
- [ ] Auto-save (configurable)
- [ ] Unsaved-changes indicator + prompt on close

## Views & modes
- [ ] Source-code mode toggle (raw Markdown)
- [ ] Document outline (headings navigation)
- [ ] Focus mode
- [ ] Typewriter mode
- [ ] Toggle sidebar
- [ ] Word/character count in status bar

## Themes
- [ ] Light theme
- [ ] Dark theme
- [ ] Theme switching at runtime
- [ ] Follows OS appearance

## Editing tools
- [ ] Find & replace
- [ ] Undo / redo
- [ ] Image paste from clipboard
- [ ] Keyboard shortcuts for common formatting

## Export
- [ ] Export to HTML (self-contained)
- [ ] Export to PDF
- [ ] Export to Word (.docx) — via pandoc when available
- [ ] Copy as HTML / Markdown

## Packaging
- [ ] macOS `.dmg` installer (arm64 + x64)
- [ ] Native application menu
- [ ] CI release pipeline producing the `.dmg`
