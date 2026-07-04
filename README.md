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
- 📁 **Workspace sidebar** — open a folder and browse/open Markdown files.
- 🧭 **Document outline** — jump around by heading structure.
- 🔀 **Source mode** — toggle to raw Markdown (`Cmd/Ctrl+/`).
- 🎯 **Focus & typewriter modes**.
- 🌗 **Light / dark themes** that follow the OS appearance.
- 🔎 **Find & replace** (`Cmd/Ctrl+F`).
- 📤 **Export** to HTML, PDF (built-in), and Word `.docx` (via `pandoc`).
- 🍎 **Native macOS app** packaged as a `.dmg`.

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
