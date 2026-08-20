import { readFile } from 'node:fs/promises';

const digest = JSON.parse(await readFile('public/data/digest.json', 'utf8'));
const date = new Date(digest.generatedAt).toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });
const lines = [`GitHub Daily · ${date}`, '', '🔥 今日趋势', ...digest.trending.slice(0, 8).map((repo, index) => `${index + 1}. ${repo.name} · ★ ${repo.stars}${repo.starDelta24h ? `（+${repo.starDelta24h}/24h）` : ''}\n${repo.description || ''}`), '', '✦ 最新发布', ...digest.releases.slice(0, 5).map(item => `• ${item.name} — ${item.detail}`)];
const text = lines.join('\n');
const html = `<h1>GitHub Daily · ${date}</h1>${digest.trending.slice(0, 8).map(repo => `<p><a href="https://github.com/${repo.name}"><strong>${repo.name}</strong></a> · ★ ${repo.stars}<br>${repo.description || ''}</p>`).join('')}<h2>最新发布</h2><ul>${digest.releases.slice(0, 5).map(item => `<li><a href="https://github.com/${item.name}/releases">${item.name}</a> — ${item.detail}</li>`).join('')}</ul>`;
async function post(url, options) { const response = await fetch(url, options); if (!response.ok) throw new Error(`${response.status} ${await response.text()}`); }
const deliveries = [];
if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) deliveries.push(['Telegram', () => post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text, disable_web_page_preview: true }) })]);
if (process.env.FEISHU_WEBHOOK_URL) deliveries.push(['Feishu', () => post(process.env.FEISHU_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ msg_type: 'text', content: { text } }) })]);
if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM && process.env.EMAIL_TO) deliveries.push(['Email', () => post('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `github-daily-${digest.generatedAt.slice(0, 10)}` }, body: JSON.stringify({ from: process.env.EMAIL_FROM, to: process.env.EMAIL_TO.split(',').map(value => value.trim()), subject: `GitHub Daily · ${date}`, html, text }) })]);
if (!deliveries.length) { console.log('No delivery configuration found; skipping notification.'); process.exit(0); }
for (const [name, send] of deliveries) { await send(); console.log(`${name} delivery sent.`); }
