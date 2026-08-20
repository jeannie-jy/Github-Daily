# GitHub Daily

[中文文档](README.zh-CN.md) · English

> A personalized daily brief of GitHub trends and new open-source releases.

GitHub Daily finds noteworthy repositories and releases, ranks them using star growth and your interests, archives each daily brief, and can deliver it to Telegram, Feishu, or email.

## Features

- **Trending projects** — discovers repositories created in the previous seven days.
- **Latest releases** — extracts the latest release from the strongest candidates.
- **24-hour star growth** — stores daily star snapshots and prioritizes repositories with recent momentum.
- **Personalization** — assign a 0–5 weight to interests such as AI Coding, MCP, Agents, and Rust.
- **Read memory** — mark a repository as read to hide it from future recommendations in your browser.
- **Daily archive** — GitHub Actions stores an immutable JSON brief for every generated date.
- **Delivery** — optionally send the brief to Telegram, Feishu, and/or Resend email.

## Quick start

```bash
npm run dev
```

Open `http://localhost:3000`. Generate the daily data manually with:

```bash
npm run digest
```

Set `GITHUB_TOKEN` for a higher GitHub API rate limit. The current brief is written to `public/data/digest.json`; dated archives are saved in `public/data/history/YYYY-MM-DD.json`.

To replay a date, run `DIGEST_DATE=2025-08-20 npm run digest`. In PowerShell:

```powershell
$env:DIGEST_DATE='2025-08-20'; npm run digest
```

## Notifications

`npm run notify` delivers the generated brief. It exits safely without sending anything when no provider is configured. Copy [.env.example](.env.example) for local reference, and configure the same values as GitHub Actions Secrets for scheduled delivery.

| Channel | Required Secrets |
| --- | --- |
| Telegram | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` |
| Feishu custom bot | `FEISHU_WEBHOOK_URL` |
| Email via Resend | `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_TO` |

**Configure delivery**

1. Go to **Settings → Secrets and variables → Actions → New repository secret** and add each secret from the table above.
2. Open the **Actions** tab, select *Generate daily digest*, and click **Run workflow** to trigger a delivery immediately and verify the setup.

The scheduled workflow runs at 00:00 UTC (08:00 China Standard Time), archives the digest, then sends it through every configured channel. Each project and release in the notification includes its GitHub link.

**Run your own delivery**

Fork the repository and add your own secrets to the fork — forks never inherit the upstream secrets. A fork of a public repository has Actions disabled by default, and its scheduled workflow is disabled as well; enable both from the fork's Actions tab. If this repository is enabled as a template, **Use this template** creates an independent repository without these limitations.

## Data and privacy

Interest weights and read history are stored only in the browser's local storage. Delivery secrets must never be committed; store them in GitHub Actions Secrets instead. Secrets are encrypted and write-only: even in a public repository no one else can read them, and forks never inherit them. The workflow runs only on schedule and manual triggers — never on pull requests — so third-party pull requests cannot access your secrets.
