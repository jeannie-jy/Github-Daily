import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const root = process.cwd();
const types = { '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };
let cache = { value: null, expiresAt: 0 };
function compact(value) { return value > 999 ? `${(value / 1000).toFixed(1)}k` : String(value); }
function icon(language) { return ({ Python: '◌', TypeScript: '⌘', Rust: '◆', JavaScript: '◈', Go: '△' })[language] || '◇'; }
async function github(path) { const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'github-trend-digest' }; if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`; const response = await fetch(`https://api.github.com${path}`, { headers }); if (!response.ok) { const error = new Error(`GitHub API ${response.status}`); error.serverDate = response.headers.get('date'); throw error; } return response.json(); }
async function getLiveDigest() {
  if (cache.value && cache.expiresAt > Date.now()) return cache.value;
  const search = date => github(`/search/repositories?q=${encodeURIComponent(`created:>${new Date(date - 7 * 864e5).toISOString().slice(0, 10)}`)}&sort=stars&order=desc&per_page=30`);
  let results;
  try { results = await search(Date.now()); } catch (error) { if (!error.serverDate) throw error; results = await search(new Date(error.serverDate)); }
  const candidates = results.items.map((repo, index) => ({ name: repo.full_name, icon: icon(repo.language), score: `Top ${index + 1}`, description: repo.description || '本周新出现的热门开源项目。', stars: compact(repo.stargazers_count), language: repo.language || 'Open source', delta: '新成果' }));
  const trending = candidates.slice(0, 12);
  const releases = (await Promise.all(candidates.slice(0, 20).map(async repo => { try { const release = await github(`/repos/${repo.name}/releases/latest`); return { name: repo.name, icon: repo.icon, detail: `${release.tag_name} · ${release.name || '最新版本'}`, publishedAt: release.published_at }; } catch { return null; } }))).filter(Boolean).slice(0, 5);
  cache = { value: { generatedAt: new Date().toISOString(), source: 'live', trending, releases }, expiresAt: Date.now() + 60 * 60 * 1000 };
  return cache.value;
}

createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/digest') {
    if (url.searchParams.has('refresh')) cache.expiresAt = 0;
    getLiveDigest().catch(() => JSON.parse(readFileSync(join(root, 'public/data/digest.json'), 'utf8'))).then(data => { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); });
    return;
  }
  const requestPath = url.pathname === '/' ? '/index.html' : url.pathname;
  const file = normalize(join(root, 'public', requestPath));
  if (!file.startsWith(join(root, 'public')) || !existsSync(file)) {
    res.writeHead(404); res.end('Not found'); return;
  }
  res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  createReadStream(file).pipe(res);
}).listen(process.env.PORT || 3000, () => console.log('GitHub Trend Digest: http://localhost:3000'));
