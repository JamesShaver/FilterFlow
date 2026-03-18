# Contributing to FilterFlow

Thanks for your interest in contributing to FilterFlow! This guide will help you get started.

## Getting Started

1. **Fork and clone** the repository

   ```bash
   git clone https://github.com/JamesShaver/FilterFlow.git
   cd FilterFlow
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure OAuth** — replace the `client_id` in `manifest.json` with your own Google Cloud OAuth 2.0 Client ID (Chrome Extension type). You'll also need the Gmail API enabled in your Google Cloud project.

4. **Build and load**

   ```bash
   npm run build
   ```

   Then load the `dist/` folder as an unpacked extension at `chrome://extensions/` with Developer mode enabled.

5. **Develop in watch mode**

   ```bash
   npm run dev
   ```

   After each rebuild, click the reload button on the FilterFlow card at `chrome://extensions/`.

## Project Structure

```
src/
  background/       # Service worker: auth, Gmail API, message routing, alarms
  content/          # Content script: detects email sender/subject in Gmail
  shared/           # Types and constants shared across contexts
  sidepanel/        # React app
    components/     # UI components (filters, folders, common, layout)
    context/        # Global state (AppContext + appReducer)
    hooks/          # useAuth, useFilters, useFolders, useDryRun, useEmailContext
    lib/            # Utilities (filter analysis, storage, message passing)
```

## Making Changes

### Branch Naming

Create a branch from `main` with a descriptive name:

- `feat/short-description` — new features
- `fix/short-description` — bug fixes
- `docs/short-description` — documentation updates

### Code Style

- **TypeScript** — all source files use TypeScript with strict mode
- **Tailwind CSS v4** — use utility classes for styling; avoid inline styles
- **React 19** — use functional components with hooks
- Run `npm run build` before submitting to ensure there are no type errors

### Commit Messages

Write clear, concise commit messages. Use the imperative mood:

- `feat: add filter search debounce`
- `fix: prevent duplicate filter creation`
- `docs: update setup instructions`

## Submitting a Pull Request

1. Push your branch to your fork
2. Open a pull request against `main`
3. Describe **what** the change does and **why**
4. Link any related issues

Pull requests should be focused — one feature or fix per PR. Keep diffs small and reviewable when possible.

## Reporting Bugs

Open a [GitHub issue](../../issues/new) with:

- Steps to reproduce
- Expected vs. actual behavior
- Chrome version and OS
- Console errors (if any) from the extension's service worker or side panel

## Suggesting Features

Feature ideas are welcome! Open an issue describing:

- The problem you're trying to solve
- Your proposed solution
- Any alternatives you considered

## Security Vulnerabilities

Please do **not** open public issues for security vulnerabilities. See [SECURITY.md](SECURITY.md) for responsible disclosure instructions.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
