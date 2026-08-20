import { mkdir, writeFile } from 'node:fs/promises';

const api = 'https://api.github.com';
const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'github-trend-digest' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
const reportDate = process.env.DIGEST_DATE ? new Date(`${process.env.DIGEST_DATE}T00:00:00Z`) : new Date();
if (Number.isNaN(reportDate.valueOf())) throw new Error('DIGEST_DATE must use YYYY-MM-DD format.');
const since = new Date(reportDate - 7 * 864e5).toISOString().slice(0, 10);

async function github(path) { const response = await fetch(`${api}${path}`, { headers }); if (!response.ok) throw new Error(`GitHub API ${response.status}: ${path}`); return response.json(); }
function compact(value) { return value > 999 ? `${(value / 1000).toFixed(1)}k` : String(value); }
function icon(language) { return ({ Python: '◌', TypeScript: '⌘', Rust: '◆', JavaScript: '◈', Go: '△' })[language] || '◇'; }

const repos = await github(`/search/repositories?q=${encodeURIComponent(`created:>${since}`)}&sort=stars&order=desc&per_page=12`);
const trending = repos.items.map((repo, index) => ({ name: repo.full_name, icon: icon(repo.language), score: `Top ${index + 1}`, description: repo.description || '今日新出现的热门开源项目。', stars: compact(repo.stargazers_count), language: repo.language || 'Open source', delta: '新成果' }));
const releases = await Promise.all(trending.slice(0, 5).map(async repo => { try { const latest = await github(`/repos/${repo.name}/releases/latest`); return { name: repo.name, icon: repo.icon, detail: `${latest.tag_name} · ${latest.name || '最新版本'}` }; } catch { return null; } }));
const digest = { generatedAt: new Date().toISOString(), trending, releases: releases.filter(Boolean) };
await mkdir('public/data', { recursive: true });
await writeFile('public/data/digest.json', `${JSON.stringify(digest, null, 2)}\n`);
console.log(`Wrote ${trending.length} repositories to public/data/digest.json`);
