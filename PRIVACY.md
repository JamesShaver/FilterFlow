# Privacy Policy — FilterFlow

**Last updated:** February 23, 2026

FilterFlow is a Chrome extension that replaces Gmail's built-in filter settings with a drag-and-drop side panel interface. This privacy policy explains what data FilterFlow accesses, how it is used, and how it is protected.

---

## Data We Collect

**FilterFlow does not collect, store, or transmit any personal data to external servers.** There is no analytics, telemetry, tracking, or third-party data collection of any kind.

---

## Google Account Authentication

FilterFlow uses Google OAuth 2.0 via Chrome's built-in `chrome.identity` API to authenticate your Google account. This allows the extension to make authorized requests to the Gmail API on your behalf.

- OAuth tokens are managed entirely by Chrome's identity system and are **never stored, logged, or accessed directly** by the extension.
- You can revoke access at any time by signing out within the extension or by removing FilterFlow from your [Google Account permissions](https://myaccount.google.com/permissions).
- Upon sign-out, the extension revokes the OAuth token with Google and removes it from Chrome's cache.

---

## Gmail API Usage

FilterFlow requests the following OAuth scopes:

| Scope | Purpose |
|-------|---------|
| `gmail.settings.basic` | Read, create, and delete your Gmail filters. |
| `gmail.readonly` | Search messages matching a filter's criteria for the dry-run preview feature. |
| `gmail.labels` | Read, create, and manage Gmail labels so you can assign or create labels as filter actions. |

### What is accessed

- **Filters** — FilterFlow reads your existing Gmail filters, creates new filters based on criteria you define, and deletes filters at your request. Filter reordering is performed by deleting and recreating filters in your preferred order.
- **Labels** — FilterFlow reads your Gmail labels so you can assign them as filter actions, and can create new labels at your request.
- **Message metadata (dry-run only)** — When previewing a filter, FilterFlow searches for the five most recent emails matching your criteria and retrieves only their metadata headers (From, Subject, Date). **Email bodies, attachments, and full message content are never accessed.**

### What is never accessed

- Email message bodies or full content
- Attachments
- Contact lists
- Calendar data
- Google Drive files
- Any other Google service beyond Gmail filters, labels, and message metadata

---

## Data Stored Locally

FilterFlow stores a small amount of configuration data in `chrome.storage.sync` (Chrome's built-in synchronized storage, encrypted by Chrome and synced across your signed-in browsers). This data includes:

| Data | Purpose |
|------|---------|
| **Virtual folders** | Folder names, colors, collapsed state, and which filter IDs are assigned to each folder. Folders are a local organizational feature and are not synced to Gmail. |
| **Filter order** | An array of filter IDs representing your preferred display order. |
| **Auto-expiration metadata** | For filters you mark as temporary: the filter ID, creation timestamp, and expiration timestamp. Used to automatically delete expired filters. |

This data contains **no personal information** — only filter IDs (opaque strings assigned by Gmail), folder names you choose, and timestamps. No email content, sender addresses, or message data is ever stored.

---

## Content Script

FilterFlow injects a content script on `mail.google.com` to detect the sender and subject of the email you are currently viewing. This enables the "Quick Filter" feature, which lets you create a filter for the current email with one click.

- The content script reads only the sender email address and subject line from the Gmail page DOM.
- This data is held **in memory only** for the duration of your browsing session and is never written to disk or transmitted externally.
- The content script does not modify, read, or interact with any other part of the Gmail page.

---

## Permissions

| Permission | Reason |
|------------|--------|
| `identity` | Authenticate with your Google account via OAuth 2.0. |
| `storage` | Save folder layouts, filter order, and expiration metadata in Chrome's synced storage. |
| `sidePanel` | Display the FilterFlow interface in Chrome's side panel. |
| `alarms` | Run a daily background check to automatically delete expired filters. |
| `activeTab` | Detect when you are viewing Gmail so the side panel can activate. |
| `tabs` | Monitor tab navigation to update the email context for the Quick Filter feature. |

---

## Third-Party Services

FilterFlow communicates exclusively with Google's services:

- **Google OAuth** (`accounts.google.com`) — for authentication and token management.
- **Gmail API** (`www.googleapis.com/gmail/v1/`) — for filter, label, and message metadata operations.

No other external services, APIs, servers, or endpoints are contacted. FilterFlow has no backend server. All processing occurs locally in your browser.

---

## Data Sharing

FilterFlow does not share, sell, rent, or disclose any user data to any third party, for any purpose, under any circumstances.

---

## Data Retention

- **OAuth tokens** are managed by Chrome and are cleared when you sign out or remove the extension.
- **Local storage data** (folders, filter order, expiration metadata) persists in `chrome.storage.sync` until you uninstall the extension or manually clear Chrome's extension storage.
- **In-memory data** (current email context) is discarded when the browser tab is closed or the extension's service worker is terminated.

---

## Children's Privacy

FilterFlow is not directed at children under the age of 13 and does not knowingly collect personal information from children.

---

## Changes to This Policy

If this privacy policy is updated, the revised version will be published in the extension's repository with an updated date at the top of this document.

---

## Contact

If you have questions or concerns about this privacy policy, you can:

- Open an issue on the [FilterFlow GitHub repository](https://github.com/JamesShaver/FilterFlow/issues)
---

## Google API Services User Data Policy

FilterFlow's use and transfer of information received from Google APIs adheres to the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including the Limited Use requirements.
