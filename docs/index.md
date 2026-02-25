---
layout: default
---

# FilterFlow

**Take control of your Gmail filters with a modern, visual interface.**

FilterFlow is a Chrome extension that replaces Gmail's clunky filter settings with a drag-and-drop Side Panel — so you can create, organize, and manage filters without ever leaving your inbox.

[Install from Chrome Web Store](#installation){: .btn } &nbsp; [View on GitHub](https://github.com/JamesShaver/FilterFlow){: .btn }

---

## Features

### Drag-and-Drop Filter Reordering
Rearrange your Gmail filters by simply dragging them into the order you want. FilterFlow syncs the new order back to Gmail automatically, with a progress indicator so you always know what's happening.

### Virtual Folders
Group related filters into color-coded folders. Create folders like "Work", "Newsletters", or "Shopping" and drag filters between them. Folders are stored locally and stay in sync with your Gmail filters.

### One-Click Contextual Filters
When you're reading an email in Gmail, FilterFlow detects the sender and subject and shows a banner in the Side Panel. Click it to instantly create a filter pre-filled with that email's details — no copy-pasting required.

### Dry Run Preview
Before saving a filter, see exactly which emails it would match. FilterFlow shows the 5 most recent matching messages in real time as you type your filter criteria, so you can fine-tune before committing.

### Auto-Expiring Filters
Need a temporary filter? Set it to expire automatically after 1 day, 3 days, 1 week, 2 weeks, 1 month, or 3 months. FilterFlow checks daily and removes expired filters for you.

### Smart Consolidation & Duplicate Detection
FilterFlow analyzes your filters and suggests opportunities to merge similar ones or remove duplicates. Clean up years of accumulated filter clutter in just a few clicks.

### Search Filters
Quickly find any filter by typing in the search bar. FilterFlow searches across all your filter criteria and actions to surface exactly what you're looking for.

---

## Installation

### From the Chrome Web Store (Recommended)

1. Visit the [FilterFlow listing on the Chrome Web Store](#).
2. Click **Add to Chrome**.
3. Confirm the permissions when prompted.
4. The FilterFlow icon will appear in your Chrome toolbar — you're ready to go.

### From Source (For Developers)

If you want to modify FilterFlow or contribute to development:

1. **Prerequisites:** [Node.js](https://nodejs.org/) 18 or later and [Git](https://git-scm.com/).

2. **Clone the repository:**
   ```bash
   git clone https://github.com/JamesShaver/FilterFlow.git
   cd FilterFlow
   ```

3. **Install dependencies and build:**
   ```bash
   npm install
   npm run build
   ```

4. **Load in Chrome:**
   - Navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in the top-right corner)
   - Click **Load unpacked**
   - Select the `dist/` folder inside the cloned project

5. **Set up OAuth (required for Gmail API access):**
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project (or use an existing one)
   - Enable the **Gmail API**
   - Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
   - Choose **Chrome Extension** as the application type
   - Enter your extension's ID (shown on `chrome://extensions/`)
   - Copy the Client ID and paste it into `manifest.json` under `oauth2.client_id`
   - Rebuild with `npm run build` and reload the extension

---

## Getting Started

### Sign In

1. Open Gmail in Chrome.
2. Click the FilterFlow icon in your toolbar to open the Side Panel.
3. Click **Sign in with Google** and authorize the requested permissions.

### Create Your First Filter

1. Click the **+ New Filter** button.
2. Fill in the criteria — for example, set **From** to a specific sender.
3. Watch the **Dry Run Preview** update in real time to show matching emails.
4. Choose one or more actions (Archive, Mark as Read, Apply Label, etc.).
5. Optionally check **Apply to existing messages** to retroactively process your inbox.
6. Click **Create Filter**.

### Organize with Folders

1. Click **+ Add Folder** to create a virtual folder.
2. Give it a name and pick a color.
3. Drag any filter from the main list into your new folder.
4. Click a folder to expand or collapse its filter list.

### Quick Filters from Email Context

1. Open any email in Gmail.
2. A banner appears at the top of the FilterFlow Side Panel showing the sender and subject.
3. Click **Create Filter** to open the filter form pre-filled with that email's details.
4. Adjust criteria and actions as needed, then save.

---

## Permissions

FilterFlow requests only the permissions it needs to function. Here's what each one does:

| Permission | Why It's Needed |
|---|---|
| **Side Panel** | Displays the FilterFlow interface alongside Gmail |
| **Identity** | Signs you in with Google OAuth to access Gmail's API |
| **Storage** | Saves your folder layout, filter order, and expiry settings locally |
| **Alarms** | Runs a daily check to remove expired filters |
| **Active Tab / Tabs** | Detects the current email's sender and subject for contextual filter creation |

### Gmail API Scopes

| Scope | Purpose |
|---|---|
| `gmail.settings.basic` | Create, read, and delete Gmail filters |
| `gmail.readonly` | Power the Dry Run preview (search messages) |
| `gmail.labels` | Manage Gmail labels for filter actions |
| `gmail.modify` | Apply filter actions to existing messages |

---

## FAQ

**Q: Does FilterFlow read my emails?**
A: FilterFlow only searches email metadata (sender, subject, snippet) for the Dry Run preview and contextual detection. It never reads or stores email body content.

**Q: Where is my data stored?**
A: Filter data lives in your Gmail account (via the Gmail API). Folder layout, filter order, and expiry settings are stored locally in Chrome's sync storage — nothing is sent to external servers.

**Q: Can I use FilterFlow with multiple Gmail accounts?**
A: FilterFlow works with the Google account you sign in with. To switch accounts, sign out and sign back in with a different account.

**Q: What happens if I uninstall FilterFlow?**
A: Your Gmail filters remain exactly as they are — FilterFlow manages them through Gmail's own API. Only the local folder organization and expiry settings are removed.

**Q: A filter I created isn't working. What should I do?**
A: Try these steps:
1. Open FilterFlow and check that the filter appears in your list.
2. Verify the criteria match what you expect using the Dry Run preview.
3. Sign out and sign back in to refresh your authentication token.
4. If the issue persists, [open a bug report](https://github.com/JamesShaver/FilterFlow/issues).

**Q: How do I report a bug or request a feature?**
A: Visit the [GitHub Issues page](https://github.com/JamesShaver/FilterFlow/issues) to submit a bug report or feature request.

---

## Privacy Policy

**Last updated:** February 23, 2026

FilterFlow is a Chrome extension that replaces Gmail's built-in filter settings with a drag-and-drop side panel interface. This privacy policy explains what data FilterFlow accesses, how it is used, and how it is protected.

### Data We Collect

**FilterFlow does not collect, store, or transmit any personal data to external servers.** There is no analytics, telemetry, tracking, or third-party data collection of any kind.

### Google Account Authentication

FilterFlow uses Google OAuth 2.0 via Chrome's built-in `chrome.identity` API to authenticate your Google account. This allows the extension to make authorized requests to the Gmail API on your behalf.

- OAuth tokens are managed entirely by Chrome's identity system and are **never stored, logged, or accessed directly** by the extension.
- You can revoke access at any time by signing out within the extension or by removing FilterFlow from your [Google Account permissions](https://myaccount.google.com/permissions).
- Upon sign-out, the extension revokes the OAuth token with Google and removes it from Chrome's cache.

### Gmail API Usage

FilterFlow requests the following OAuth scopes:

| Scope | Purpose |
|---|---|
| `gmail.settings.basic` | Read, create, and delete your Gmail filters. |
| `gmail.readonly` | Search messages matching a filter's criteria for the dry-run preview feature. |
| `gmail.labels` | Read, create, and manage Gmail labels so you can assign or create labels as filter actions. |

**What is accessed:**

- **Filters** — FilterFlow reads your existing Gmail filters, creates new filters based on criteria you define, and deletes filters at your request. Filter reordering is performed by deleting and recreating filters in your preferred order.
- **Labels** — FilterFlow reads your Gmail labels so you can assign them as filter actions, and can create new labels at your request.
- **Message metadata (dry-run only)** — When previewing a filter, FilterFlow searches for the five most recent emails matching your criteria and retrieves only their metadata headers (From, Subject, Date). **Email bodies, attachments, and full message content are never accessed.**

**What is never accessed:**

- Email message bodies or full content
- Attachments
- Contact lists
- Calendar data
- Google Drive files
- Any other Google service beyond Gmail filters, labels, and message metadata

### Data Stored Locally

FilterFlow stores a small amount of configuration data in `chrome.storage.sync` (Chrome's built-in synchronized storage, encrypted by Chrome and synced across your signed-in browsers):

| Data | Purpose |
|---|---|
| **Virtual folders** | Folder names, colors, collapsed state, and which filter IDs are assigned to each folder. Folders are a local organizational feature and are not synced to Gmail. |
| **Filter order** | An array of filter IDs representing your preferred display order. |
| **Auto-expiration metadata** | For filters you mark as temporary: the filter ID, creation timestamp, and expiration timestamp. Used to automatically delete expired filters. |

This data contains **no personal information** — only filter IDs (opaque strings assigned by Gmail), folder names you choose, and timestamps.

### Content Script

FilterFlow injects a content script on `mail.google.com` to detect the sender and subject of the email you are currently viewing. This enables the "Quick Filter" feature.

- The content script reads only the sender email address and subject line from the Gmail page DOM.
- This data is held **in memory only** for the duration of your browsing session and is never written to disk or transmitted externally.
- The content script does not modify, read, or interact with any other part of the Gmail page.

### Third-Party Services

FilterFlow communicates exclusively with Google's services:

- **Google OAuth** (`accounts.google.com`) — for authentication and token management.
- **Gmail API** (`www.googleapis.com/gmail/v1/`) — for filter, label, and message metadata operations.

No other external services, APIs, servers, or endpoints are contacted. FilterFlow has no backend server. All processing occurs locally in your browser.

### Data Sharing

FilterFlow does not share, sell, rent, or disclose any user data to any third party, for any purpose, under any circumstances.

### Data Retention

- **OAuth tokens** are managed by Chrome and are cleared when you sign out or remove the extension.
- **Local storage data** (folders, filter order, expiration metadata) persists in `chrome.storage.sync` until you uninstall the extension or manually clear Chrome's extension storage.
- **In-memory data** (current email context) is discarded when the browser tab is closed or the extension's service worker is terminated.

### Children's Privacy

FilterFlow is not directed at children under the age of 13 and does not knowingly collect personal information from children.

### Changes to This Policy

If this privacy policy is updated, the revised version will be published in the extension's repository with an updated date at the top of this document.

### Contact

If you have questions or concerns about this privacy policy, you can [open an issue on GitHub](https://github.com/JamesShaver/FilterFlow/issues).

### Google API Services User Data Policy

FilterFlow's use and transfer of information received from Google APIs adheres to the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including the Limited Use requirements.

---

<p style="text-align: center; color: #6a737d; margin-top: 3rem;">
  FilterFlow is open source under the MIT License.<br>
  Built with React, TypeScript, and the Gmail API.
</p>
