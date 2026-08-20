const fallback = { source: 'cached', trending: [], releases: [] };
const defaultInterests = ['AI Coding', 'MCP', 'Agents', 'Rust'];
let digest = fallback, showingAll = false, showingReleases = false, archives = [];
function interests() { try { return JSON.parse(localStorage.getItem('github-daily-interests')) || defaultInterests; } catch { return defaultInterests; } }
function setInterests(value) { localStorage.setItem('github-daily-interests', JSON.stringify(value)); }
function history() { try { return JSON.parse(localStorage.getItem('github-daily-history')) || []; } catch { return []; } }
function saveHistory(data) { const date = new Date(data.generatedAt || Date.now()).toLocaleDateString('zh-CN'); const records = history().filter(item => item.date !== date); records.unshift({ date, data }); localStorage.setItem('github-daily-history', JSON.stringify(records.slice(0, 30))); }
function renderInterests() { document.querySelector('#interest-tags').innerHTML = interests().map(value => `<span>${value}</span>`).join(''); }
function renderHistory() {
  const records = archives.length ? archives.map(item => ({ ...item, archived: true })) : history().map(item => ({ ...item, archived: false }));
  const picker = document.querySelector('#history-picker');
  picker.disabled = !archives.length;
  picker.innerHTML = archives.length ? `<option value="">选择一份日报…</option>${archives.map(item => `<option value="${item.date}">${item.date} · ${item.repositories} 个项目</option>`).join('')}` : '<option>尚无归档日报</option>';
  document.querySelector('#history-list').innerHTML = records.length ? records.map((item, index) => `<button class="history-date" ${item.archived ? `data-archive="${item.date}"` : `data-history="${index}"`}><span>${item.date.split(/[-/]/).at(-1)}</span><div><b>${item.date}</b><small>${item.archived ? `${item.repositories} 个项目 · ${item.releases} 个发布` : '本机临时快照'}</small></div><i>打开 →</i></button>`).join('') : '<small>首份归档会在每日任务成功运行后出现。</small>';
}
function render() {
  const repos = digest.trending || [], releaseItems = digest.releases || [];
  document.querySelector('#repo-count').textContent = repos.length || '0';
  document.querySelector('#release-count').textContent = releaseItems.length;
  document.querySelector('#trend-list').innerHTML = repos.slice(0, showingAll ? repos.length : 3).map(repo => `<article class="repo-card"><div class="repo-top"><div class="repo-logo">${repo.icon || '◈'}</div><span class="score">${repo.score || 'NEW'}</span></div><h3><a target="_blank" rel="noreferrer" href="https://github.com/${repo.name}">${repo.name}</a></h3><p>${repo.description || '今日值得关注的开源项目。'}</p><div class="repo-meta"><span>★ ${repo.stars || '—'}</span><span>${repo.language || 'Open source'}</span><span><strong>${repo.delta || ''}</strong></span></div></article>`).join('') || '<p class="empty">暂时没有可用的项目数据，请点击“更新日报”。</p>';
  document.querySelector('#release-list').innerHTML = releaseItems.slice(0, showingReleases ? releaseItems.length : 3).map(item => `<div class="release"><span class="release-icon">${item.icon || '✦'}</span><div><b>${item.name}</b><small>${item.detail}</small></div><a target="_blank" rel="noreferrer" href="https://github.com/${item.name}/releases">查看 →</a></div>`).join('') || '<div class="release"><div><b>暂无最新 Release</b><small>热门新项目不一定已创建版本发布。</small></div></div>';
  document.querySelector('#show-all').textContent = showingAll ? '收起项目 ↑' : `查看全部 ${repos.length || ''} →`;
  document.querySelector('#show-releases').textContent = showingReleases ? '收起发布 ↑' : `全部发布 ${releaseItems.length || ''} →`;
  renderInterests(); renderHistory();
}
async function load(refresh = false) {
  const button = document.querySelector('#refresh'); button.textContent = '正在更新…'; button.disabled = true;
  try { const response = await fetch(`/api/digest${refresh ? '?refresh=1' : ''}`); if (!response.ok) throw new Error('request failed'); digest = await response.json(); } catch { const response = await fetch('/data/digest.json'); digest = response.ok ? await response.json() : fallback; }
  saveHistory(digest); render(); button.disabled = false; button.innerHTML = '更新日报 <span>↻</span>';
}
document.querySelector('#refresh').addEventListener('click', () => load(true));
document.querySelector('#show-all').addEventListener('click', () => { showingAll = !showingAll; render(); document.querySelector('#all').scrollIntoView({ behavior: 'smooth' }); });
document.querySelector('#show-releases').addEventListener('click', () => { showingReleases = !showingReleases; render(); document.querySelector('#releases').scrollIntoView({ behavior: 'smooth' }); });
document.querySelector('#history-list').addEventListener('click', async event => { const button = event.target.closest('[data-history], [data-archive]'); if (!button) return; if (button.dataset.archive) { const response = await fetch(`/data/history/${button.dataset.archive}.json`); if (!response.ok) return; digest = await response.json(); } else { digest = history()[Number(button.dataset.history)].data; } showingAll = true; showingReleases = true; render(); document.querySelector('#today').scrollIntoView({ behavior: 'smooth' }); });
document.querySelector('#history-picker').addEventListener('change', async event => { if (!event.target.value) return; const response = await fetch(`/data/history/${event.target.value}.json`); if (!response.ok) return; digest = await response.json(); showingAll = true; showingReleases = true; render(); document.querySelector('#today').scrollIntoView({ behavior: 'smooth' }); });
const dialog = document.querySelector('#interest-dialog');
document.querySelector('#edit-interests').addEventListener('click', () => { const selected = interests(); document.querySelector('#interest-options').innerHTML = ['AI Coding','MCP','Agents','Rust','LLM','Web','DevOps','Security'].map(item => `<label><input type="checkbox" value="${item}" ${selected.includes(item) ? 'checked' : ''}> ${item}</label>`).join(''); dialog.showModal(); });
document.querySelector('#save-interests').addEventListener('click', () => { setInterests([...document.querySelectorAll('#interest-options input:checked')].map(input => input.value)); renderInterests(); });
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
