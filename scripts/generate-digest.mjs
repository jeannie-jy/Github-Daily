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
const releaseCandidates = repos.items.map(repo => ({ name: repo.full_name, icon: icon(repo.language) }));
const releases = await Promise.all(releaseCandidates.slice(0, 20).map(async repo => { try { const latest = await github(`/repos/${repo.name}/releases/latest`); return { name: repo.name, icon: repo.icon, detail: `${latest.tag_name} · ${latest.name || '最新版本'}` }; } catch { return null; } }));
const dateKey = reportDate.toISOString().slice(0, 10);
const historyDir = 'public/data/history';
const stateDir = 'public/data/state';
await mkdir(historyDir, { recursive: true });
await mkdir(stateDir, { recursive: true });
let metrics = {};
try { metrics = JSON.parse(await readFile(`${stateDir}/repository-metrics.json`, 'utf8')); } catch { /* first run */ }
const nextMetrics = {};
for (const repo of repos.items) {
  const previous = metrics[repo.full_name];
  const starDelta24h = previous ? Math.max(0, repo.stargazers_count - previous.stars) : 0;
  nextMetrics[repo.full_name] = { stars: repo.stargazers_count, checkedAt: new Date().toISOString() };
  repo.starDelta24h = starDelta24h;
}
const ranked = [...repos.items].sort((a, b) => (b.starDelta24h - a.starDelta24h) || (b.stargazers_count - a.stargazers_count));
const candidates = ranked.map((repo, index) => ({ name: repo.full_name, icon: icon(repo.language), score: repo.starDelta24h ? `+${compact(repo.starDelta24h)} ★ / 24h` : `Top ${index + 1}`, description: repo.description || '今日新出现的热门开源项目。', stars: compact(repo.stargazers_count), starDelta24h: repo.starDelta24h, language: repo.language || 'Open source', delta: repo.starDelta24h ? '增长中' : '新成果' }));
const digest = { generatedAt: new Date().toISOString(), trending: candidates.slice(0, 12), releases: releases.filter(Boolean).slice(0, 5) };
await writeFile('public/data/digest.json', `${JSON.stringify(digest, null, 2)}\n`);
await writeFile(`${historyDir}/${dateKey}.json`, `${JSON.stringify(digest, null, 2)}\n`);
let index = [];
try { index = JSON.parse(await readFile(`${historyDir}/index.json`, 'utf8')); } catch { /* first daily run */ }
index = [{ date: dateKey, generatedAt: digest.generatedAt, repositories: digest.trending.length, releases: digest.releases.length }, ...index.filter(item => item.date !== dateKey)].sort((a, b) => b.date.localeCompare(a.date));
await writeFile(`${historyDir}/index.json`, `${JSON.stringify(index, null, 2)}\n`);
await writeFile(`${stateDir}/repository-metrics.json`, `${JSON.stringify(nextMetrics, null, 2)}\n`);
console.log(`Wrote ${digest.trending.length} repositories to today's digest and history/${dateKey}.json`);
