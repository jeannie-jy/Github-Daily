import { mkdir, readFile, writeFile } from 'node:fs/promises';

const api = 'https://api.github.com';
const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'github-trend-digest' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
const reportDate = process.env.DIGEST_DATE ? new Date(`${process.env.DIGEST_DATE}T00:00:00Z`) : new Date();
if (Number.isNaN(reportDate.valueOf())) throw new Error('DIGEST_DATE must use YYYY-MM-DD format.');
const since = new Date(reportDate - 7 * 864e5).toISOString().slice(0, 10);

async function github(path) { const response = await fetch(`${api}${path}`, { headers }); if (!response.ok) throw new Error(`GitHub API ${response.status}: ${path}`); return response.json(); }
function compact(value) { return value > 999 ? `${(value / 1000).toFixed(1)}k` : String(value); }
function icon(language) { return ({ Python: '◌', TypeScript: '⌘', Rust: '◆', JavaScript: '◈', Go: '△' })[language] || '◇'; }

const repos = await github(`/search/repositories?q=${encodeURIComponent(`created:>${since}`)}&sort=stars&order=desc&per_page=30`);
const candidates = repos.items.map((repo, index) => ({ name: repo.full_name, icon: icon(repo.language), score: `Top ${index + 1}`, description: repo.description || '今日新出现的热门开源项目。', stars: compact(repo.stargazers_count), language: repo.language || 'Open source', delta: '新成果' }));
const trending = candidates.slice(0, 12);
const releases = await Promise.all(candidates.slice(0, 20).map(async repo => { try { const latest = await github(`/repos/${repo.name}/releases/latest`); return { name: repo.name, icon: repo.icon, detail: `${latest.tag_name} · ${latest.name || '最新版本'}` }; } catch { return null; } }));
const digest = { generatedAt: new Date().toISOString(), trending, releases: releases.filter(Boolean).slice(0, 5) };
const dateKey = reportDate.toISOString().slice(0, 10);
const historyDir = 'public/data/history';
await mkdir(historyDir, { recursive: true });
await writeFile('public/data/digest.json', `${JSON.stringify(digest, null, 2)}\n`);
await writeFile(`${historyDir}/${dateKey}.json`, `${JSON.stringify(digest, null, 2)}\n`);
let index = [];
try { index = JSON.parse(await readFile(`${historyDir}/index.json`, 'utf8')); } catch { /* first daily run */ }
index = [{ date: dateKey, generatedAt: digest.generatedAt, repositories: trending.length, releases: digest.releases.length }, ...index.filter(item => item.date !== dateKey)].sort((a, b) => b.date.localeCompare(a.date));
await writeFile(`${historyDir}/index.json`, `${JSON.stringify(index, null, 2)}\n`);
console.log(`Wrote ${trending.length} repositories to today's digest and history/${dateKey}.json`);
