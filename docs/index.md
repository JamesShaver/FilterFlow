---
layout: default
---

# FilterFlow

**Take control of your Gmail filters with a modern, visual interface.**

FilterFlow is a Chrome extension that replaces Gmail's clunky filter settings with a drag-and-drop Side Panel — so you can create, organize, and manage filters without ever leaving your inbox.

[Installation Guide](#installation) · [View on GitHub](https://github.com/JamesShaver/FilterFlow)

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

### Ghost Label Cleanup
FilterFlow automatically scans for "ghost labels" — labels that have no messages and aren't used by any filters. A notification bar flags them after your filters load, and a guided cleanup dialog lets you review and delete them in bulk. A two-step confirmation (with an extra warning for 10 or more labels) keeps you in control, and a progress bar tracks the deletion in real time.

### Search Filters
Quickly find any filter by typing in the search bar. FilterFlow searches across all your filter criteria and actions to surface exactly what you're looking for.

### VIP "Rescue" & Protection
Have aggressive filters that accidentally bury important emails? Designate a sender as VIP to instantly rescue their messages. When you're reading an email in Gmail, a "Rescue & Protect" button appears in the Side Panel. One click will create a protective filter ensuring their emails never go to spam, move any archived or trashed messages back to your inbox, and automatically adjust existing filters that would hide this sender's emails. You can manage up to 50 VIP contacts from the dedicated VIP section.

---

## Installation

FilterFlow is not available on the Chrome Web Store. Google's third-party security validation program imposes prohibitive costs on independent developers, so FilterFlow is distributed as an open-source, self-hosted extension. Each user provides their own Google Cloud credentials.

This means a one-time setup is required, but your data stays entirely under your own Google account — nothing passes through any third-party server.

### What You'll Need

- [Node.js](https://nodejs.org/) 18 or later
- [Git](https://git-scm.com/)
- A free [Google account](https://accounts.google.com/) (your regular Gmail account works)
- A free [Google Cloud](https://console.cloud.google.com/) project (no billing required for Gmail API usage at personal scale)

### Step 1 — Set Up Google Cloud Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and sign in.
2. Click **Select a project** → **New Project**, give it a name (e.g. "FilterFlow"), and click **Create**.
3. In the left menu go to **APIs & Services** → **Library**, search for **Gmail API**, and click **Enable**.
4. Go to **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**.
5. If prompted to configure the OAuth consent screen, choose **External**, fill in the required app name and email fields, and save. You do not need to submit for Google verification.
6. Back in **Create OAuth 2.0 Client ID**, choose **Chrome Extension** as the application type.
7. You'll need your extension's ID for the next step — continue to Step 2 first to get it, then return here to finish.

### Step 2 — Clone, Build, and Load the Extension

1. **Clone the repository:**
   ```bash
   git clone https://github.com/JamesShaver/FilterFlow.git
   cd FilterFlow
   ```

2. **Install dependencies and build:**
   ```bash
   npm install
   npm run build
   ```

3. **Load in Chrome:**
   - Navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in the top-right corner)
   - Click **Load unpacked** and select the `dist/` folder inside the cloned project
   - Note the **Extension ID** shown on the FilterFlow card (a 32-character string)

### Step 3 — Link Your OAuth Credentials

1. Return to the Google Cloud Console **Create OAuth 2.0 Client ID** form.
2. Enter your extension's ID in the **Application ID** field and click **Create**.
3. Copy the generated **Client ID** (ends in `.apps.googleusercontent.com`).
4. Open `manifest.json` in the cloned project and paste your Client ID under `oauth2.client_id`:
   ```json
   "oauth2": {
     "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
     ...
   }
   ```
5. Rebuild and reload:
   ```bash
   npm run build
   ```
   Then go to `chrome://extensions/` and click the reload button on the FilterFlow card.

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

**Q: How does auto-expiring filters work?**
A: When you create a filter with an expiry duration, FilterFlow saves the expiration date locally in Chrome. A background task runs once every 24 hours to check for expired filters and delete them from your Gmail account via the API. There are a few things to keep in mind:

- **Chrome must be running.** The expiration check only happens while Chrome is open. If your computer is off or Chrome is closed, the check resumes the next time Chrome starts — so a filter may live slightly longer than the duration you chose.
- **FilterFlow must be installed.** If you uninstall the extension, expiry tracking data is removed and any filters you set to auto-expire will remain in your Gmail account permanently.
- **Filters are real Gmail filters.** Gmail itself has no concept of filter expiration. Auto-expire is managed entirely by FilterFlow, so the extension needs to be installed and Chrome needs to be running for it to work.

**Q: How do I report a bug or request a feature?**
A: Visit the [GitHub Issues page](https://github.com/JamesShaver/FilterFlow/issues) to submit a bug report or feature request.

---

<p style="text-align: center; color: #6a737d; margin-top: 3rem;">
  <a href="privacy">Privacy Policy</a> · <a href="terms">Terms of Service</a><br><br>
  FilterFlow is open source under the MIT License.<br>
  Built with React, TypeScript, and the Gmail API.
</p>
