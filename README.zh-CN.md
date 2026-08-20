# GitHub Daily

中文文档 · [English](README.md)

> 一个个性化的 GitHub 每日情报工具，聚合趋势项目与最新开源成果。

GitHub Daily 会发现值得关注的仓库和 Release，结合 Star 增长与个人兴趣排序，每日归档日报，并可推送到 Telegram、飞书或邮件。

## 功能

- **趋势项目**：发现最近 7 天创建的热门仓库。
- **最新成果**：从候选项目中提取最新 Release。
- **24 小时 Star 增长**：保存每日 Star 快照，优先展示近期增长更快的项目。
- **个性化兴趣**：可为 AI Coding、MCP、Agents、Rust 等主题设置 0–5 权重。
- **已读记忆**：标记已读后，该项目不会再在当前浏览器中被推荐。
- **每日归档**：GitHub Actions 会永久保存每个日期生成的 JSON 日报。
- **消息推送**：可选 Telegram、飞书和 Resend 邮件推送。

## 快速开始

```bash
npm run dev
```

打开 `http://localhost:3000`。手动生成日报数据：

```bash
npm run digest
```

可设置 `GITHUB_TOKEN` 以获得更高的 GitHub API 限额。当天日报保存在 `public/data/digest.json`；历史日报保存在 `public/data/history/YYYY-MM-DD.json`。

如需重放指定日期：

```powershell
$env:DIGEST_DATE='2025-08-20'; npm run digest
```

## 推送配置

`npm run notify` 会发送已经生成的日报。未配置渠道时会安全跳过，不会外发任何消息。可复制 [.env.example](.env.example) 查看本地变量，并将相同值配置进 GitHub Actions Secrets。

| 渠道 | 必需 Secrets |
| --- | --- |
| Telegram | `TELEGRAM_BOT_TOKEN`、`TELEGRAM_CHAT_ID` |
| 飞书自定义机器人 | `FEISHU_WEBHOOK_URL` |
| Resend 邮件 | `RESEND_API_KEY`、`EMAIL_FROM`、`EMAIL_TO` |

**配置步骤**

1. 进入 **Settings → Secrets and variables → Actions → New repository secret**，按上表逐个添加 Secrets。
2. 打开 **Actions** 标签页，选择 *Generate daily digest*，点击 **Run workflow** 手动触发一次，立即验证推送是否成功。

定时工作流每天 00:00 UTC（北京时间 08:00）运行：生成日报、写入历史归档，再对所有已配置渠道发送通知。每个项目与 Release 都会附带 GitHub 链接。

**建立自己的推送**

Fork 本仓库并在 fork 中配置自己的 Secrets（fork 不会继承上游 Secrets）。注意：公共仓库的 fork 默认禁用 Actions，定时工作流在 fork 中同样处于停用状态，需到 fork 的 Actions 标签页手动启用。若本仓库开启了模板功能，使用 **Use this template** 创建的新仓库则没有这些限制。

## 数据与隐私

兴趣权重和已读记录只保存在浏览器 Local Storage 中。推送凭据不得提交到仓库，请仅保存在 GitHub Actions Secrets。Secrets 加密存储、只写不读：即使是公开仓库，他人也无法查看其内容，fork 也不会继承。工作流只在定时与手动触发时运行，不监听 Pull Request 事件，外部贡献者无法借此访问你的 Secrets。
