# FilterFlow

A Chrome Extension that replaces Gmail's native filter settings with a modern, drag-and-drop side panel interface. Built with React, TypeScript, and the Chrome Extension Manifest V3 platform.

## Features

### Drag-and-Drop Filter Management
Reorder Gmail filters with intuitive drag-and-drop. Since the Gmail API lacks a native reorder endpoint, FilterFlow handles reordering by deleting and recreating filters in the desired sequence — with batched operations and a progress indicator.

### Virtual Folders
Organize filters into collapsible, color-coded folders stored locally via `chrome.storage.sync`. Drag filters between folders or back to "Uncategorized" with visual drop-zone feedback.

### Contextual Creator (1-Click Filters)
When viewing an email in Gmail, the side panel detects the sender and subject, offering a quick-action button to auto-generate a filter for that sender.

### Dry Run Preview
As you build a filter, see the top 5 most recent emails that match your current criteria in real time — before committing.

### Auto-Expiring Filters
Set a filter to automatically delete itself after a configurable period (1 day to 3 months). A background service worker checks daily and cleans up expired filters.

### Smart Filter Analysis
- **Consolidation suggestions** — detects filters with identical actions that can be merged
- **Duplicate detection** — finds and lets you review redundant filters
- **Ghost label cleanup** — scans for labels with no messages and no filter references, then offers guided bulk deletion with a two-step confirmation and real-time progress

### Filter Search
Quickly find any filter by typing in the search bar. Searches across all criteria and actions to surface matching filters instantly.

### VIP "Rescue" & Protection
Designate important senders as VIP to rescue buried emails and protect against future filter mishaps. One click creates a protective `neverSpam` filter, moves archived/trashed messages back to the inbox, and adjusts any existing filters that would hide the sender's emails. Supports up to 50 VIP contacts, with crash-recoverable operations and cross-reference validation.

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 + TypeScript |
| Build | Vite 7 (multi-entry: sidepanel, background, content script) |
| Styling | Tailwind CSS v4 |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Animations | Framer Motion |
| Auth | `chrome.identity.getAuthToken` (OAuth 2.0) |
| Gmail | Gmail API v1 via direct `fetch()` |
| State | React Context + useReducer |
| Storage | `chrome.storage.sync` (folders, filter order, temporal metadata) |

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

## Prerequisites

- Node.js 18+
- A Google Cloud project with:
  - **Gmail API** enabled
  - **OAuth 2.0 Client ID** (Chrome Extension type)

## Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/JamesShaver/FilterFlow.git
   cd filterflow
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure OAuth**

   Replace the `client_id` in `manifest.json` under `oauth2` with your own Google Cloud OAuth 2.0 Client ID:

   ```json
   "oauth2": {
     "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
     "scopes": [
       "https://www.googleapis.com/auth/gmail.settings.basic",
       "https://www.googleapis.com/auth/gmail.readonly",
       "https://www.googleapis.com/auth/gmail.labels",
       "https://www.googleapis.com/auth/gmail.modify"
     ]
   }
   ```

4. **Build**

   ```bash
   npm run build
   ```

5. **Load in Chrome**

   - Navigate to `chrome://extensions/`
   - Enable **Developer mode**
   - Click **Load unpacked** and select the `dist/` folder

## Development

```bash
npm run dev
```

Runs Vite in watch mode. After each rebuild, go to `chrome://extensions/` and click the reload button on the FilterFlow card.

## Scripts

| Command | Description |
|---|---|
| `npm run build` | Type-check with `tsc` then build to `dist/` |
| `npm run dev` | Build in watch mode for development |

## Permissions

| Permission | Purpose |
|---|---|
| `sidePanel` | Persistent sidebar UI |
| `identity` | OAuth 2.0 login via Google |
| `storage` | Virtual folder metadata, filter order, temporal filter data |
| `alarms` | Daily check for expired filters |
| `activeTab` / `tabs` | Detect current email context in Gmail |

## Gmail API Scopes

| Scope | Purpose |
|---|---|
| `gmail.settings.basic` | Create, read, delete Gmail filters |
| `gmail.readonly` | Dry Run preview (search messages matching filter criteria) |
| `gmail.labels` | Manage Gmail labels for filter actions |
| `gmail.modify` | Apply filter actions to existing messages |

## Architecture Notes

- **Message passing**: The side panel communicates with the background service worker via `chrome.runtime.sendMessage`. The content script detects email context in Gmail and relays it through the background to the side panel.
- **Action format conversion**: The app uses friendly boolean flags (`archive`, `markRead`, `star`, etc.) internally. These are converted to/from Gmail API label operations (`addLabelIds`, `removeLabelIds`) at the API boundary in `gmail-api.ts`.
- **Folder persistence**: Virtual folders are stored in `chrome.storage.sync` and reconciled against live Gmail filter IDs on each fetch to prevent stale references.

## Documentation

Full usage guide and installation instructions are available at the [FilterFlow documentation site](https://jamesshaver.github.io/FilterFlow/).

## License

MIT
