# Typora Parity Report

Status of jypora against the [FEATURES.md](./FEATURES.md) checklist. Legend:
✅ done · 🟡 partial · ⏳ planned.

> jypora is a clean-room, independent implementation. This report measures
> *functional* parity with the Typora-style experience, not code equivalence.

## Core editing
| Feature | Status | Notes |
|---|---|---|
| Seamless single-pane live WYSIWYG | ✅ | Milkdown Crepe editor |
| Headings inline | ✅ | |
| Bold / italic / strikethrough | ✅ | GFM via Crepe |
| Ordered / unordered lists | ✅ | |
| Task lists | ✅ | GFM |
| Blockquotes | ✅ | |
| Inline & fenced code + highlight | ✅ | CodeMirror-backed code blocks |
| Tables | ✅ | inline table editing |
| Links & images | ✅ | |
| Horizontal rules | ✅ | |
| Math (KaTeX) | ✅ | inline `$..$` and block `$$..$$` |
| Mermaid diagrams | 🟡 | code block renders; live diagram preview planned |
| Footnotes | 🟡 | parsed; dedicated UI planned |

## Files & workspace
| Feature | Status | Notes |
|---|---|---|
| New / Open / Save / Save As | ✅ | native dialogs + menu shortcuts |
| Open folder as workspace | ✅ | sidebar file tree |
| File tree navigation | ✅ | click to open `.md` |
| Recent files | ⏳ | |
| Auto-save | 🟡 | setting scaffolded; timer wiring planned |
| Unsaved indicator | ✅ | status bar + window title dot |

## Views & modes
| Feature | Status | Notes |
|---|---|---|
| Source-code mode toggle | ✅ | `Cmd/Ctrl+/` |
| Document outline | ✅ | heading navigation panel |
| Focus mode | ✅ | |
| Typewriter mode | ✅ | |
| Toggle sidebar | ✅ | |
| Word/char count | ✅ | status bar |

## Themes
| Feature | Status | Notes |
|---|---|---|
| Light theme | ✅ | |
| Dark theme | ✅ | |
| Runtime switching | ✅ | menu |
| Follows OS appearance | ✅ | `nativeTheme` |

## Editing tools
| Feature | Status | Notes |
|---|---|---|
| Find & replace | ✅ | panel with case option, replace-all |
| Undo / redo | ✅ | editor + native menu |
| Image paste | ✅ | Crepe upload feature |
| Formatting shortcuts | ✅ | Crepe defaults |

## Export
| Feature | Status | Notes |
|---|---|---|
| Export HTML (self-contained) | ✅ | |
| Export PDF | ✅ | Electron `printToPDF`, no external deps |
| Export Word (.docx) | 🟡 | via `pandoc` when installed |
| Copy as HTML/Markdown | ⏳ | |

## Packaging
| Feature | Status | Notes |
|---|---|---|
| macOS `.dmg` (arm64 + x64) | ✅ | electron-builder config + local `pnpm package` |
| Native app menu | ✅ | |
| CI release pipeline | ✅ | `.github/workflows/release.yml` on `macos-latest` |

## Honest summary
The defining Typora experience — **seamless single-pane live Markdown editing**
— plus file management, modes, themes, find/replace, and export are functional.
A few long-tail items (recent files, live mermaid preview, auto-save timer,
copy-as) are scaffolded or planned and tracked above. This is a genuine
Typora-*like* editor, not a 1:1 clone of every Typora setting.
