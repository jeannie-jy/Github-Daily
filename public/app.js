const fallback = { source: 'cached', trending: [], releases: [] };
const defaultInterests = { 'AI Coding': 4, MCP: 4, Agents: 4, Rust: 2, LLM: 2, Web: 0, DevOps: 0, Security: 0 };
let digest = fallback, showingAll = false, showingReleases = false, archives = [];
function interests() { try { const saved = JSON.parse(localStorage.getItem('github-daily-interests')); return Array.isArray(saved) ? Object.fromEntries(Object.keys(defaultInterests).map(key => [key, saved.includes(key) ? 3 : 0])) : (saved || defaultInterests); } catch { return defaultInterests; } }
function setInterests(value) { localStorage.setItem('github-daily-interests', JSON.stringify(value)); }
function history() { try { return JSON.parse(localStorage.getItem('github-daily-history')) || []; } catch { return []; } }
function saveHistory(data) { const date = new Date(data.generatedAt || Date.now()).toLocaleDateString('zh-CN'); const records = history().filter(item => item.date !== date); records.unshift({ date, data }); localStorage.setItem('github-daily-history', JSON.stringify(records.slice(0, 30))); }
function renderInterests() { document.querySelector('#interest-tags').innerHTML = Object.entries(interests()).filter(([, weight]) => weight > 0).map(([name, weight]) => `<span>${name} · ${weight}</span>`).join('') || '<span>尚未设置偏好</span>'; }
function renderHistory() {
  const records = archives.length ? archives.map(item => ({ ...item, archived: true })) : history().map(item => ({ ...item, archived: false }));
  const picker = document.querySelector('#history-picker');
  picker.disabled = !archives.length;
  picker.innerHTML = archives.length ? `<option value="">选择一份日报…</option>${archives.map(item => `<option value="${item.date}">${item.date} · ${item.repositories} 个项目</option>`).join('')}` : '<option>尚无归档日报</option>';
  document.querySelector('#history-list').innerHTML = records.length ? records.map((item, index) => `<button class="history-date" ${item.archived ? `data-archive="${item.date}"` : `data-history="${index}"`}><span>${item.date.split(/[-/]/).at(-1)}</span><div><b>${item.date}</b><small>${item.archived ? `${item.repositories} 个项目 · ${item.releases} 个发布` : '本机临时快照'}</small></div><i>打开 →</i></button>`).join('') : '<small>首份归档会在每日任务成功运行后出现。</small>';
}
function render() {
  const repos = digest.trending || [], releaseItems = digest.releases || [];
  const weights = interests(), seen = new Set(JSON.parse(localStorage.getItem('github-daily-seen') || '[]'));
  const keywords = { 'AI Coding': ['code','coding','copilot','developer'], MCP: ['mcp','model context protocol'], Agents: ['agent','agents'], Rust: ['rust'], LLM: ['llm','language model','gpt'], Web: ['web','browser'], DevOps: ['devops','kubernetes','docker'], Security: ['security','auth','vulnerability'] };
  const visibleRepos = repos.filter(repo => !seen.has(repo.name)).sort((a, b) => { const score = repo => Object.entries(weights).reduce((total, [topic, weight]) => total + ((keywords[topic] || []).some(word => `${repo.name} ${repo.description}`.toLowerCase().includes(word)) ? weight : 0), 0); return score(b) - score(a) || (b.starDelta24h || 0) - (a.starDelta24h || 0); });
  document.querySelector('#repo-count').textContent = visibleRepos.length || '0';
  document.querySelector('#release-count').textContent = releaseItems.length;
  document.querySelector('#trend-list').innerHTML = visibleRepos.slice(0, showingAll ? visibleRepos.length : 3).map(repo => `<article class="repo-card"><div class="repo-top"><div class="repo-logo">${repo.icon || '◈'}</div><span class="score">${repo.score || 'NEW'}</span></div><h3><a target="_blank" rel="noreferrer" href="https://github.com/${repo.name}">${repo.name}</a></h3><p>${repo.description || '今日值得关注的开源项目。'}</p><div class="repo-meta"><span>★ ${repo.stars || '—'}</span><span>${repo.language || 'Open source'}</span><button class="read-button" data-read="${repo.name}">标为已读</button></div></article>`).join('') || '<p class="empty">没有未读项目了。可清除浏览器站点数据以重新显示已读项目。</p>';
  document.querySelector('#release-list').innerHTML = releaseItems.slice(0, showingReleases ? releaseItems.length : 3).map(item => `<div class="release"><span class="release-icon">${item.icon || '✦'}</span><div><b>${item.name}</b><small>${item.detail}</small></div><a target="_blank" rel="noreferrer" href="https://github.com/${item.name}/releases">查看 →</a></div>`).join('') || '<div class="release"><div><b>暂无最新 Release</b><small>热门新项目不一定已创建版本发布。</small></div></div>';
  document.querySelector('#show-all').textContent = showingAll ? '收起项目 ↑' : `查看全部 ${visibleRepos.length || ''} →`;
  document.querySelector('#show-releases').textContent = showingReleases ? '收起发布 ↑' : `全部发布 ${releaseItems.length || ''} →`;
  renderInterests(); renderHistory();
}
async function load(refresh = false) {
  const button = document.querySelector('#refresh'); button.textContent = '正在更新…'; button.disabled = true;
  try { const response = await fetch(refresh ? '/api/digest?refresh=1' : '/data/digest.json'); if (!response.ok) throw new Error('request failed'); digest = await response.json(); } catch { digest = fallback; }
  saveHistory(digest); render(); button.disabled = false; button.innerHTML = '更新日报 <span>↻</span>';
}
document.querySelector('#refresh').addEventListener('click', () => load(true));
document.querySelector('#show-all').addEventListener('click', () => { showingAll = !showingAll; render(); document.querySelector('#all').scrollIntoView({ behavior: 'smooth' }); });
document.querySelector('#show-releases').addEventListener('click', () => { showingReleases = !showingReleases; render(); document.querySelector('#releases').scrollIntoView({ behavior: 'smooth' }); });
document.querySelector('#trend-list').addEventListener('click', event => { const button = event.target.closest('[data-read]'); if (!button) return; const seen = new Set(JSON.parse(localStorage.getItem('github-daily-seen') || '[]')); seen.add(button.dataset.read); localStorage.setItem('github-daily-seen', JSON.stringify([...seen])); render(); });
document.querySelector('#history-list').addEventListener('click', async event => { const button = event.target.closest('[data-history], [data-archive]'); if (!button) return; if (button.dataset.archive) { const response = await fetch(`/data/history/${button.dataset.archive}.json`); if (!response.ok) return; digest = await response.json(); } else { digest = history()[Number(button.dataset.history)].data; } showingAll = true; showingReleases = true; render(); document.querySelector('#today').scrollIntoView({ behavior: 'smooth' }); });
document.querySelector('#history-picker').addEventListener('change', async event => { if (!event.target.value) return; const response = await fetch(`/data/history/${event.target.value}.json`); if (!response.ok) return; digest = await response.json(); showingAll = true; showingReleases = true; render(); document.querySelector('#today').scrollIntoView({ behavior: 'smooth' }); });
const dialog = document.querySelector('#interest-dialog');
document.querySelector('#edit-interests').addEventListener('click', () => { const selected = interests(); document.querySelector('#interest-options').innerHTML = Object.keys(defaultInterests).map(item => `<label>${item}<select data-weight="${item}">${[0,1,2,3,4,5].map(weight => `<option value="${weight}" ${selected[item] === weight ? 'selected' : ''}>${weight}</option>`).join('')}</select></label>`).join(''); dialog.showModal(); });
document.querySelector('#save-interests').addEventListener('click', () => { setInterests(Object.fromEntries([...document.querySelectorAll('#interest-options select')].map(input => [input.dataset.weight, Number(input.value)]))); render(); });
const navLinks = [...document.querySelectorAll('nav a')];
function setActiveNavigation(hash = window.location.hash) {
  const activeHash = hash || '#today';
  navLinks.forEach(link => link.classList.toggle('active', link.hash === activeHash));
}
navLinks.forEach(link => link.addEventListener('click', event => {
  const section = document.querySelector(link.hash);
  if (!section) return;
  event.preventDefault();
  setActiveNavigation(link.hash);
  const top = window.scrollY + section.getBoundingClientRect().top - 24;
  window.scrollTo({ top, behavior: 'smooth' });
  window.location.hash = link.hash;
}));
window.addEventListener('hashchange', () => setActiveNavigation());
setActiveNavigation();
async function loadArchive() { try { const response = await fetch('/data/history/index.json'); archives = response.ok ? await response.json() : []; } catch { archives = []; } renderHistory(); }
load(); loadArchive();
