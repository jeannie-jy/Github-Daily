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

- 接入 Telegram、飞书或邮件推送。
- 持久化已读仓库，避免重复推荐。
- 使用兴趣权重和 24 小时 Star 增量替代简单排序。
