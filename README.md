# jypora

An open-source, **Typora-like** seamless live-preview Markdown editor built with
Electron + TypeScript + React, using [Milkdown](https://milkdown.dev) for the
WYSIWYG editing core.

> jypora is an **independent, clean-room** implementation inspired by the
> single-pane live-editing experience popularized by Typora. It contains no
> Typora code, assets, or branding. Typora® is a trademark of its owner.

## Features

- ✍️ **Seamless live WYSIWYG editing** — headings, bold/italic, lists, task
  lists, blockquotes, tables, code blocks with syntax highlighting, links,
  images, math (KaTeX), and more, rendered inline as you type.
- 📊 **Live Mermaid diagrams** — ```mermaid code blocks render to diagrams inline.
- ⌨️ **Full keyboard shortcuts** — bold `Cmd+B`, italic `Cmd+I`, headings
  `Cmd+1..6`, link `Cmd+K`, inline code `Cmd+E`, lists, quote, code block,
  table, and all file/view commands (see [Shortcuts](#keyboard-shortcuts)).
- 📁 **Workspace sidebar** with **file-type icons**, **fuzzy file search**
  (`Cmd+P`), and **recent workspaces** for quick reopening.
- 🖥️ **Embedded terminal panel** (`Cmd+``) — an integrated shell opened in the
  current document's directory, for driving CLI agents right where the file lives.
- 🧭 **Document outline** — jump around by heading structure.
- 🔀 **Source mode** — toggle to raw Markdown (`Cmd/Ctrl+/`).
- 🎯 **Focus & typewriter modes**.
- 🎨 **Theme system** — built-in Light, Dark, Sepia, Nord, Solarized, Dracula;
  follows OS appearance; **pluggable custom themes** via JSON drop-in.
- 🔎 **Find & replace** (`Cmd/Ctrl+F`).
- 💾 **Auto save** (File ▸ Auto Save) and **recent files/workspaces** (File ▸ Open Recent).
- 📋 **Copy as Markdown / HTML** (Edit menu).
- 📤 **Export** to HTML, PDF (built-in, Mermaid-aware), and Word `.docx` (via `pandoc`).
- 🍎 **Native macOS app** packaged as a `.dmg`.

## Keyboard shortcuts

| Action | Shortcut | Action | Shortcut |
|---|---|---|---|
| New / Open | `Cmd+N` / `Cmd+O` | Open Folder | `Cmd+Shift+K` |
| Save / Save As | `Cmd+S` / `Cmd+Shift+S` | Find & Replace | `Cmd+F` |
| Search Files | `Cmd+P` | Toggle Source | `Cmd+/` |
| Bold / Italic | `Cmd+B` / `Cmd+I` | Strikethrough | `Cmd+Shift+X` |
| Inline Code | `Cmd+E` | Link | `Cmd+K` |
| Heading 1–6 | `Cmd+1..6` | Paragraph | `Cmd+0` |
| Bullet / Ordered List | `Cmd+Shift+8` / `Cmd+Shift+7` | Blockquote | `Cmd+Shift+Q` |
| Code Block | `Cmd+Shift+C` | Table | `Cmd+Shift+T` |
| Toggle Sidebar | `Cmd+Shift+L` | Toggle Outline | `Cmd+Shift+O` |
| Toggle Terminal | `` Cmd+` `` | Focus Mode | `Cmd+Shift+F` |

## Custom themes

Drop a JSON file into `<userData>/themes/` (a README with the schema is created
there on first launch) and it appears in **View ▸ Theme** on next start:

```json
{ "id": "my-theme", "name": "My Theme", "isDark": false,
  "vars": { "bg": "#fff", "fg": "#111", "muted": "#888",
            "border": "#eee", "sidebar-bg": "#f5f5f5", "accent": "#4c8bf5" } }
```

See [docs/FEATURES.md](docs/FEATURES.md) for the full checklist and
[docs/PARITY.md](docs/PARITY.md) for the Typora parity report.

## Development

```bash
pnpm install
pnpm dev            # run the app in development
pnpm test           # unit tests
pnpm test:coverage  # unit tests with coverage (80%+ enforced)
pnpm typecheck      # TypeScript type checking
pnpm build          # build main/preload/renderer
```

## Building the macOS installer

Building a macOS `.dmg` must happen **on macOS** (electron-builder's dmg target
requires it):

```bash
pnpm package        # builds and produces release/jypora-<version>-<arch>.dmg
```

Artifacts are written to `release/`. Unsigned builds will show Gatekeeper
warnings; to distribute, configure code signing via `CSC_LINK` / `CSC_KEY_PASSWORD`
environment variables (Apple Developer certificate required).

## Release via CI

Pushing a tag like `v0.1.0` triggers
[`.github/workflows/release.yml`](.github/workflows/release.yml), which builds
the `.dmg` on a `macos-latest` runner and attaches it to a GitHub Release.

```bash
git tag v0.1.0 && git push origin v0.1.0
```

## Architecture

```
src/
  main/          Electron main process (window, menu, IPC: files, export, settings)
  preload/       Secure context-bridge API exposed as window.jypora
  renderer/      React UI (editor, sidebar, outline, status bar, find/replace)
  shared/        Pure, unit-tested logic (markdown, document, find/replace, ...)
```

State transitions are immutable; the renderer is driven by a pure reducer
(`src/renderer/src/state/appState.ts`). The process boundary is fully typed and
`contextIsolation` is enabled with no `nodeIntegration`.

## License

MIT © 2026 jasoncai0
