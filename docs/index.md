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

<p style="text-align: center; color: #6a737d; margin-top: 3rem;">
  <a href="privacy">Privacy Policy</a> · <a href="terms">Terms of Service</a><br><br>
  FilterFlow is open source under the MIT License.<br>
  Built with React, TypeScript, and the Gmail API.
</p>
