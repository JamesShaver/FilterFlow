# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.7.x   | :white_check_mark: |
| < 1.7   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in FilterFlow, please report it
responsibly by opening a [GitHub Security Advisory](../../security/advisories/new)
on this repository. Do **not** open a public issue.

You can expect an initial response within 72 hours. We will work with you to
understand the issue, confirm the fix, and coordinate disclosure.

## Security Considerations

FilterFlow is a Chrome Extension (Manifest V3) that accesses the Gmail API
with the following OAuth scopes:

- `gmail.settings.basic` — read and manage mail filters
- `gmail.labels` — read and manage labels
- `gmail.modify` — read, send, and modify messages (used for dry-run previews)

### What FilterFlow does NOT do

- Store or transmit OAuth tokens outside the browser (tokens are managed
  entirely by `chrome.identity`)
- Access email content beyond what is needed for filter previews
- Communicate with any server other than `googleapis.com`

### Data Storage

All user preferences and cached state are stored locally via
`chrome.storage.sync`. No data is sent to third-party services.
