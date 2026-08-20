# GitHub Daily

> Get a personalized daily brief of GitHub trending repos and latest open-source releases.

一个面向个人开发者的 GitHub 每日情报工具：每天筛选值得关注的热门项目与新发布成果，并以轻量 Dashboard 归档展示。

## 功能

- 今日爆发：按最近 7 天新建项目的 Star 数发现潜在热门仓库。
- 最新成果：从热门项目中提取最新 Release。
- 个人兴趣：UI 预置 AI Coding、MCP、Agents、Rust 等关注信号。
- 自动更新：GitHub Actions 每日 00:00 UTC 生成数据并提交到仓库，并按日期永久归档日报。

## 快速开始

```bash
npm run dev
```

访问 `http://localhost:3000`。初始页面使用示例日报；手动刷新真实数据：

```bash
npm run digest
```

可选地设置 `GITHUB_TOKEN`，以获得更高 GitHub API 限额。当天数据位于 `public/data/digest.json`，过往日报保存在 `public/data/history/YYYY-MM-DD.json`。
如需重放某天的数据，可运行 `DIGEST_DATE=2025-08-20 npm run digest`（PowerShell：`$env:DIGEST_DATE='2025-08-20'; npm run digest`）。

## 后续方向

## 个性化与推送

- 点击项目卡片的“标为已读”后，该项目会保存在浏览器中且不再推荐；可清除站点数据以重置。
- 在“编辑兴趣偏好”中为每个主题设置 0–5 权重，列表会根据项目名称和描述中的关键词重新排序。
- 每日脚本会保存仓库 Star 快照，并在下一次运行时计算 24 小时增长量作为排序优先级。

推送由 `npm run notify` 负责，未配置任一渠道时会安全跳过。把所需凭据设为 GitHub Actions Secrets（不要提交 `.env`）：

| 渠道 | 必需 Secrets |
| --- | --- |
| Telegram | `TELEGRAM_BOT_TOKEN`、`TELEGRAM_CHAT_ID` |
| 飞书机器人 | `FEISHU_WEBHOOK_URL` |
| 邮件（Resend） | `RESEND_API_KEY`、`EMAIL_FROM`、`EMAIL_TO` |

可复制 [.env.example](.env.example) 作为本地配置参考。Telegram 使用 Bot API 的 `sendMessage`；邮件通过 Resend 的发送接口，发件域名需在 Resend 验证。[Telegram Bot API](https://core.telegram.org/bots/api) 和 [Resend Email API](https://resend.com/docs/api-reference/emails/send-email) 提供了相应说明。
