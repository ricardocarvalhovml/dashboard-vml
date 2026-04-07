/* ─────────────────────────────────────────────
   Dashboard VML Company — App Logic
   Temeron © 2026
───────────────────────────────────────────── */

/* ── Constants ── */
const MO = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MS = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const WD = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

/* Anos suportados — esconde automaticamente os que não tiverem dados */
const YEAR_RANGE = [2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

const fmt = n => (isNaN(n) || n == null) ? '—' : Number(n).toLocaleString('pt-BR');

function parsePostDate(s) {
  if (!s) return null;
  const parts = s.trim().split(' ');
  const p = (parts[0] || '').split('/');
  if (p.length < 3) return null;
  const [hStr, mStr] = ((parts[1] || '00:00') + ':00').split(':');
  let h = parseInt(hStr, 10), m = parseInt(mStr, 10);
  const d = new Date(parseInt(p[2]), parseInt(p[0]) - 1, parseInt(p[1]), h + 5, m);
  return { date: d, time: `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` };
}

function postDateLine(s) {
  const r = parsePostDate(s);
  if (!r) return '';
  const { date, time } = r;
  return `${WD[date.getDay()]} · ${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')} · ${time}`;
}

function fmtD(s) {
  const r = parsePostDate(s);
  if (!r) return '—';
  return `${String(r.date.getDate()).padStart(2,'0')}/${String(r.date.getMonth()+1).padStart(2,'0')}/${String(r.date.getFullYear()).slice(-2)} às ${r.time}`;
}

function sDate(s) {
  const r = parsePostDate(s);
  if (!r) return '—';
  return `${String(r.date.getDate()).padStart(2,'0')} ${MS[r.date.getMonth()]}`;
}

function tKey(t) {
  const s = (t || '').toLowerCase();
  if (s.includes('carrossel')) return 'c';
  if (s.includes('reel'))      return 'r';
  if (s.includes('story') || s.includes('storie')) return 's';
  return 'i';
}

function sTipo(t)   { return { c: 'Carrossel', r: 'Reel', i: 'Post', s: 'Story' }[tKey(t)]; }
function bCls(t)    { return { c: 'badge-c',   r: 'badge-r', i: 'badge-i', s: 'badge-s' }[tKey(t)]; }
function bColor(t)  { return { c: '#a038f2', r: '#391bce', i: 'rgba(201,184,248,.8)', s: '#6b5fd4' }[tKey(t)]; }

function ePill(p) {
  if (p >= 5) return `<span class="eng-pill eng-h">${p.toFixed(1)}%</span>`;
  if (p >= 2) return `<span class="eng-pill eng-m">${p.toFixed(1)}%</span>`;
  return `<span class="eng-l">${p.toFixed(1)}%</span>`;
}

function sc(url) {
  if (!url) return null;
  const m = url.match(/\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

function sum(arr, k) { return arr.reduce((a, r) => a + (parseInt(r[k], 10) || 0), 0); }

function parsePosts(rows) { return rows.filter(r => (r['Data'] || '').trim() === 'Total'); }

function pillLabel(k, n) {
  return { c: n === 1 ? 'Carrossel' : 'Carrosseis', r: 'Reels', i: n === 1 ? 'Post' : 'Posts', s: n === 1 ? 'Story' : 'Stories' }[k];
}

/* ─────────────────────────────────────────────
   Charts
───────────────────────────────────────────── */

const charts = {};

function mkChart(id, cfg) {
  if (charts[id]) charts[id].destroy();
  const el = document.getElementById(id);
  if (el) charts[id] = new Chart(el, cfg);
}

const cOpts = () => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#0d1030',
      borderColor: 'rgba(255,255,255,.1)',
      borderWidth: 1,
      titleColor: '#efecef',
      bodyColor: '#8b86a8',
      titleFont: { family: "'Bricolage Grotesque',sans-serif", weight: '700' },
      bodyFont:  { family: "'Bricolage Grotesque',sans-serif", size: 12 }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#8b86a8', font: { size: 11, family: "'Bricolage Grotesque',sans-serif" }, maxTicksLimit: 12 }
    },
    y: {
      grid: { color: 'rgba(255,255,255,.04)' },
      ticks: { color: '#8b86a8', font: { size: 11, family: "'Bricolage Grotesque',sans-serif" }, callback: v => v >= 1000 ? (v/1000).toFixed(1)+'k' : v }
    }
  }
});

function yMax(vals) {
  const m = Math.max(...vals.filter(v => v != null && !isNaN(v)), 0);
  return m === 0 ? 10 : Math.ceil(m * 1.4);
}

/* ─────────────────────────────────────────────
   Thumbnail
───────────────────────────────────────────── */

function thumbBlock(code, url) {
  if (!code) return `<div class="th-ph">📷</div>`;
  return `<img src="posts/${code}.jpg"
    onerror="this.src='posts/${code}.png';this.onerror=function(){this.outerHTML='<div class=th-ph>📷</div>'}"
    alt="" style="width:40px;height:40px;object-fit:cover;border-radius:6px;display:block">`;
}

/* ─────────────────────────────────────────────
   Post Card (v2)
───────────────────────────────────────────── */

function postCard(p, rank, rankColor) {
  const url   = p['Link permanente'] || '#';
  const v     = parseInt(p['Visualizações'], 10) || 0;
  const l     = parseInt(p['Curtidas'], 10) || 0;
  const sh    = parseInt(p['Compartilhamentos'], 10) || 0;
  const co    = parseInt(p['Comentários'], 10) || 0;
  const sv    = parseInt(p['Salvamentos'], 10) || 0;
  const eng   = v > 0 ? (l + sh + co + sv) / v * 100 : 0;
  const desc  = (p['Descrição'] || '').split('\n')[0].trim();
  const color = rankColor || 'var(--orange)';
  const em    = url !== '#' ? url.replace(/\/?$/, '/') + 'embed/' : '';

  const isReel = tKey(p['Tipo de post']) === 'r';
  const ratio  = isReel ? 16/9 : 5/4;
  const w = 175;
  const h = Math.round(w * ratio);
  const s = (w / 326).toFixed(4);
  const hp = Math.round(65 * s);

  const imgHtml = url !== '#'
    ? `<div class="post-card-v2-img" style="height:${h}px">
        <iframe src="${em}" style="position:absolute;top:-${hp}px;left:0;width:326px;height:800px;transform:scale(${s});transform-origin:top left;border:none;pointer-events:auto" frameborder="0" scrolling="no" allowtransparency="true" loading="lazy"></iframe>
      </div>`
    : `<div class="post-card-v2-img" style="height:${h}px;display:flex;align-items:center;justify-content:center;font-size:28px;opacity:.2">📷</div>`;

  return `<div class="post-card-v2">
    ${imgHtml}
    <div class="post-card-v2-body">
      ${rank ? `<div class="post-card-rank" style="color:${color}">${rank}</div>` : ''}
      <div class="post-card-v2-desc">${desc}</div>
      <div class="post-card-v2-meta">${postDateLine(p['Horário de publicação'])} <span class="badge ${bCls(p['Tipo de post'])}" style="margin-left:4px">${sTipo(p['Tipo de post'])}</span></div>
      <div class="post-card-v2-metrics">
        <div class="pcm-row"><span class="pcm-lbl">Views</span><span class="pcm-val">${fmt(v)}</span></div>
        <div class="pcm-row"><span class="pcm-lbl">Curtidas</span><span class="pcm-val">${fmt(l)}</span></div>
        <div class="pcm-row"><span class="pcm-lbl">Comp.</span><span class="pcm-val">${fmt(sh)}</span></div>
        <div class="pcm-row"><span class="pcm-lbl">Salv.</span><span class="pcm-val">${fmt(sv)}</span></div>
        <div class="pcm-row"><span class="pcm-lbl">Eng.</span><span class="pcm-val">${eng.toFixed(1)}%</span></div>
      </div>
      ${url !== '#' ? `<a href="${url}" target="_blank" rel="noopener" style="margin-top:8px;font-size:11px;color:var(--blue);font-weight:600;text-decoration:none;opacity:.7" onclick="event.stopPropagation()">↗ Abrir no Instagram</a>` : ''}
    </div>
  </div>`;
}

/* ─────────────────────────────────────────────
   Posts by Format (Gallery)
───────────────────────────────────────────── */

function postsByFormat(posts) {
  const formats = [
    { key: 'c', label: 'Carrosseis', color: '#a038f2' },
    { key: 'r', label: 'Reels',      color: '#391bce' },
    { key: 'i', label: 'Posts',      color: '#c9b8f8' },
    { key: 's', label: 'Stories',    color: '#6b5fd4' },
  ];

  return formats.map(f => {
    const fp = [...posts]
      .filter(p => tKey(p['Tipo de post']) === f.key)
      .sort((a, b) => (parseInt(b['Visualizações'], 10) || 0) - (parseInt(a['Visualizações'], 10) || 0));

    if (!fp.length) return '';

    const gW = 143, gH = 179;
    const galleryItems = fp.map(p => {
      const url = p['Link permanente'] || '#';
      const v   = parseInt(p['Visualizações'], 10) || 0;
      const em  = url.replace(/\/?$/, '/') + 'embed/';
      const s   = gW / 326;
      const hp  = Math.round(65 * s);
      return `<a class="gallery-item" href="${url}" target="_blank" rel="noopener"
          title="${(p['Descrição'] || '').split('\n')[0].trim()}"
          style="width:${gW}px;height:${gH}px">
          <div style="position:absolute;inset:0;overflow:hidden">
            <iframe src="${em}" style="position:absolute;top:-${hp}px;left:0;width:326px;height:600px;transform:scale(${s.toFixed(4)});transform-origin:top left;border:none;pointer-events:none" frameborder="0" scrolling="no" allowtransparency="true" loading="lazy"></iframe>
          </div>
          <div class="gallery-rank">${fmt(v)}</div>
        </a>`;
    }).join('');

    return `<div class="format-section">
      <div class="format-header">
        <div class="format-title" style="color:${f.color}">${f.label}</div>
        <div class="format-count">${fp.length} publicação${fp.length !== 1 ? 'ões' : ''}</div>
      </div>
      <div class="gallery-grid">${galleryItems}</div>
    </div>`;
  }).join('');
}

/* ─────────────────────────────────────────────
   Table
───────────────────────────────────────────── */

function tableHtml(sorted, best) {
  return sorted.map(p => {
    const code = sc(p['Link permanente'] || '');
    const url  = p['Link permanente'] || '';
    const v    = parseInt(p['Visualizações'], 10) || 0;
    const l    = parseInt(p['Curtidas'], 10) || 0;
    const sh   = parseInt(p['Compartilhamentos'], 10) || 0;
    const co   = parseInt(p['Comentários'], 10) || 0;
    const sv   = parseInt(p['Salvamentos'], 10) || 0;
    const eng  = v > 0 ? (l + sh + co + sv) / v * 100 : 0;
    const isBest = p === best;
    const desc = (p['Descrição'] || '').split('\n')[0].trim();

    return `<tr class="${isBest ? 'top-row' : ''}">
      <td class="thumb-cell">${thumbBlock(code, url)}</td>
      <td style="white-space:nowrap;color:var(--muted)">${fmtD(p['Horário de publicação'])}</td>
      <td class="desc-cell" title="${desc.replace(/"/g,'&quot;')}">${isBest ? '<span class="star">★</span>' : ''}${desc}</td>
      <td><span class="badge ${bCls(p['Tipo de post'])}">${sTipo(p['Tipo de post'])}</span></td>
      <td class="num" style="font-weight:700">${fmt(v)}</td>
      <td class="num">${fmt(parseInt(p['Alcance'], 10) || 0)}</td>
      <td class="num">${fmt(l)}</td>
      <td class="num">${fmt(sh)}</td>
      <td class="num">${fmt(co)}</td>
      <td class="num">${fmt(sv)}</td>
      <td class="num">${ePill(eng)}</td>
      <td>${url ? `<a class="ig-link" href="${url}" target="_blank" rel="noopener">↗</a>` : ''}</td>
    </tr>`;
  }).join('');
}

/* ─────────────────────────────────────────────
   Account data
───────────────────────────────────────────── */

function renderAcct(acct) {
  if (!acct) return '';
  const g   = v => acct[v] != null && acct[v] !== '' ? acct[v] : '—';
  const n   = k => parseFloat(acct[k]) || 0;
  const tot = n('Total seguidores');
  const gan = n('Seguidores ganhos');
  const per = n('Deixaram de seguir');
  const sal = gan - per;
  const hasExtra = acct['Conversas'] || acct['Novos contatos'] || acct['Taxa de resposta'];
  const cols = hasExtra ? 7 : 4;

  return `<div class="acct-row" style="grid-template-columns:repeat(${cols},1fr)">
    <div class="acct-card"><div class="acct-label">Total seguidores</div><div class="acct-val">${fmt(tot)}</div><div class="acct-sub">ao final do mês</div></div>
    <div class="acct-card"><div class="acct-label">Seguidores ganhos</div><div class="acct-val acct-pos">+${fmt(gan)}</div><div class="acct-sub">novos no mês</div></div>
    <div class="acct-card"><div class="acct-label">Deixaram de seguir</div><div class="acct-val acct-neg">-${fmt(per)}</div><div class="acct-sub">saídas no mês</div></div>
    <div class="acct-card"><div class="acct-label">Saldo do mês</div><div class="acct-val ${sal >= 0 ? 'acct-pos' : 'acct-neg'}">${sal >= 0 ? '+' : ''}${fmt(sal)}</div><div class="acct-sub">ganhos − perdas</div></div>
    ${acct['Conversas']     ? `<div class="acct-card"><div class="acct-label">Conversas</div><div class="acct-val">${g('Conversas')}</div><div class="acct-sub">iniciadas</div></div>` : ''}
    ${acct['Novos contatos'] ? `<div class="acct-card"><div class="acct-label">Novos contatos</div><div class="acct-val">${g('Novos contatos')}</div><div class="acct-sub">via direct</div></div>` : ''}
    ${acct['Taxa de resposta'] ? `<div class="acct-card"><div class="acct-label">Taxa de resposta</div><div class="acct-val">${g('Taxa de resposta')}%</div><div class="acct-sub">respondidas</div></div>` : ''}
  </div>`;
}

/* ─────────────────────────────────────────────
   Weekday Analysis
───────────────────────────────────────────── */

function weekdayHtml(posts, key) {
  const stats = Array.from({ length: 7 }, () => ({ views: 0, likes: 0, shares: 0, comments: 0, saves: 0, count: 0 }));

  posts.forEach(p => {
    const r = parsePostDate(p['Horário de publicação']);
    if (!r) return;
    const d = r.date.getDay();
    stats[d].views    += (parseInt(p['Visualizações'], 10) || 0);
    stats[d].likes    += (parseInt(p['Curtidas'], 10) || 0);
    stats[d].shares   += (parseInt(p['Compartilhamentos'], 10) || 0);
    stats[d].comments += (parseInt(p['Comentários'], 10) || 0);
    stats[d].saves    += (parseInt(p['Salvamentos'], 10) || 0);
    stats[d].count++;
  });

  const bestIdx = stats.reduce((bi, s, i) => (s.count > 0 && s.views > stats[bi].views) ? i : bi, 0);

  return `<div class="weekday-grid">${WD.map((name, i) => {
    const s = stats[i];
    const isBest = i === bestIdx && s.count > 0;
    const avg = s.count > 0 ? Math.round(s.views / s.count) : 0;
    const eng = s.views > 0 ? ((s.likes + s.shares + s.comments + s.saves) / s.views * 100) : 0;

    if (s.count === 0) {
      return `<div class="weekday-card"><div class="weekday-name">${name}</div><div class="wd-empty">sem dados</div></div>`;
    }

    return `<div class="weekday-card${isBest ? ' wd-best' : ''}">
      <div class="weekday-name">${name}</div>
      <div class="wd-metric-label">Média views</div>
      <div class="wd-metric-val primary">${fmt(avg)}</div>
      <div class="wd-metric-label">Publicações</div>
      <div class="wd-metric-val">${s.count}</div>
      <div class="wd-metric-label">Engajamento</div>
      <div class="wd-metric-val">${eng.toFixed(1)}%</div>
      <div class="wd-mini-chart"><canvas id="wdc-${key}-${i}"></canvas></div>
    </div>`;
  }).join('')}
  </div>`;
}

/* ─────────────────────────────────────────────
   Demographics
───────────────────────────────────────────── */

function renderPublico(pub) {
  if (!pub) return '';
  const { ages, countries, cities } = pub;
  const maxAgeTotal = Math.max(...ages.map(a => a.f + a.m), 1);

  const ageHtml = ages.map(a => `
    <div class="demo-row-bar">
      <div class="demo-lbl">${a.range}</div>
      <div class="demo-bars">
        <div class="demo-bar-f" style="width:${(a.f / maxAgeTotal * 100).toFixed(0)}%"></div>
        <div class="demo-bar-m" style="width:${(a.m / maxAgeTotal * 100).toFixed(0)}%"></div>
      </div>
      <div class="demo-pcts"><span class="demo-pct-f">${a.f}%</span><span class="demo-pct-m">${a.m}%</span></div>
    </div>`).join('');

  const maxC = Math.max(...countries.map(c => c.pct), 1);
  const countHtml = countries.slice(0, 8).map((c, i) => `<div class="rank-row">
    <div class="rank-num">${i + 1}</div>
    <div class="rank-name">${c.name}</div>
    <div class="rank-bar-wrap"><div class="rank-bar" style="width:${(c.pct / maxC * 100).toFixed(0)}%;background:#a038f2"></div></div>
    <div class="rank-pct">${c.pct}%</div>
  </div>`).join('');

  const maxCi = Math.max(...cities.map(c => c.pct), 1);
  const cityHtml = cities.slice(0, 8).map((c, i) => `<div class="rank-row">
    <div class="rank-num">${i + 1}</div>
    <div class="rank-name">${c.name}</div>
    <div class="rank-bar-wrap"><div class="rank-bar" style="width:${(c.pct / maxCi * 100).toFixed(0)}%;background:#c9b8f8"></div></div>
    <div class="rank-pct">${c.pct}%</div>
  </div>`).join('');

  return `<div class="three-col">
    <div class="card">
      <div class="card-header"><div class="card-title">Faixa etária</div><div style="display:flex;gap:10px;font-size:12px;font-weight:700"><span style="color:var(--orange)">■ Mulheres</span><span style="color:var(--blue)">■ Homens</span></div></div>
      ${ageHtml}
    </div>
    <div class="card"><div class="card-header"><div class="card-title">Top países</div></div><div class="rank-list">${countHtml}</div></div>
    <div class="card"><div class="card-header"><div class="card-title">Top cidades</div></div><div class="rank-list">${cityHtml}</div></div>
  </div>`;
}

/* ─────────────────────────────────────────────
   Build: Home
───────────────────────────────────────────── */

function buildHome(years, byYear, acctMap) {
  const allPosts    = Object.values(byYear).flat().flatMap(m => m.posts);
  const totalViews  = sum(allPosts, 'Visualizações');
  const totalPosts  = allPosts.length;
  const totalMonths = Object.values(byYear).flat().length;

  const yBoxes = years.map((y, yi) => {
    const yM     = byYear[y] || [];
    const yPosts = yM.flatMap(m => m.posts);
    const yViews = sum(yPosts, 'Visualizações');
    const yAlc   = sum(yPosts, 'Alcance');
    const yLikes = sum(yPosts, 'Curtidas');
    const accents = ['#391bce', '#a038f2', '#a2e259', '#c9b8f8'];
    const accent  = accents[yi % accents.length];
    const isLatest = yi === years.length - 1;

    return `<div class="year-box" style="--yb-accent:${accent}" onclick="showView('view-annual-${y}')">
      <div class="year-box-top">
        <div class="year-box-year">${y}</div>
        ${isLatest ? `<div class="year-box-badge">Atual</div>` : ''}
      </div>
      <div class="year-box-metrics">
        <div class="year-box-metric"><div class="year-box-metric-val">${fmt(yViews)}</div><div class="year-box-metric-lbl">Visualizações</div></div>
        <div class="year-box-metric"><div class="year-box-metric-val">${fmt(yAlc)}</div><div class="year-box-metric-lbl">Alcance</div></div>
        <div class="year-box-metric"><div class="year-box-metric-val">${fmt(yLikes)}</div><div class="year-box-metric-lbl">Curtidas</div></div>
      </div>
      <div class="year-box-chart"><canvas id="home-ch-${y}"></canvas></div>
      <div class="year-box-footer">
        <div class="year-box-months">${yM.length} ${yM.length === 1 ? 'mês' : 'meses'} · ${yPosts.length} publicações</div>
        <div class="year-box-cta">Abrir ${y} →</div>
      </div>
    </div>`;
  }).join('');

  const allMonthsFlat  = Object.values(byYear).flat().sort((a, b) => a.key.localeCompare(b.key));
  const hasFollData    = allMonthsFlat.some(m => acctMap[m.key]?.['Total seguidores']);
  const showComparison = years.length > 1;

  return `<div class="view" id="view-home">
  <div class="home-hero">
    <div class="home-hero-eyebrow">Dashboard Instagram</div>
    <div class="home-hero-title">${CLIENT_NAME}</div>
    <div class="home-hero-sub">@${ACCOUNT} · visão geral de todos os períodos</div>
    <div class="home-hero-stats">
      <div><div class="home-hero-stat-val">${fmt(totalViews)}</div><div class="home-hero-stat-lbl">Visualizações totais</div></div>
      <div><div class="home-hero-stat-val">${totalPosts}</div><div class="home-hero-stat-lbl">Publicações</div></div>
      <div><div class="home-hero-stat-val">${totalMonths}</div><div class="home-hero-stat-lbl">${totalMonths === 1 ? 'Mês' : 'Meses'} de dados</div></div>
    </div>
  </div>
  <div class="year-boxes">${yBoxes}</div>
  ${showComparison ? `<div class="card section-gap">
    <div class="card-header"><div class="card-title">Comparativo entre anos</div><div class="legend"><div class="legend-item"><span class="legend-dot" style="background:#391bce"></span>Views</div><div class="legend-item"><span class="legend-dot" style="background:#a038f2"></span>Alcance</div></div></div>
    <div style="position:relative;height:200px"><canvas id="home-ch-compare"></canvas></div>
  </div>` : ''}
  ${hasFollData ? `<div class="card">
    <div class="card-header"><div class="card-title">Evolução de seguidores</div><div style="font-size:12px;color:var(--muted)">todos os períodos</div></div>
    <div style="position:relative;height:180px"><canvas id="home-ch-foll"></canvas></div>
  </div>` : ''}
</div>`;
}

/* ─────────────────────────────────────────────
   Build: Month
───────────────────────────────────────────── */

function buildMonth(mi, posts, key, year, multiYear, acct, hasMetrics) {
  const sorted = [...posts].sort((a, b) => new Date(b['Horário de publicação'] || 0) - new Date(a['Horário de publicação'] || 0));
  const chrono  = [...posts].sort((a, b) => new Date(a['Horário de publicação'] || 0) - new Date(b['Horário de publicação'] || 0));
  const byV     = [...posts].sort((a, b) => (parseInt(b['Visualizações'], 10) || 0) - (parseInt(a['Visualizações'], 10) || 0));

  const top3   = byV.slice(0, 3);
  const worst3 = byV.slice(-Math.min(3, byV.length)).reverse();
  const best   = top3[0];

  const views    = sum(posts, 'Visualizações');
  const alc      = sum(posts, 'Alcance');
  const likes    = sum(posts, 'Curtidas');
  const shares   = sum(posts, 'Compartilhamentos');
  const comments = sum(posts, 'Comentários');
  const saves    = sum(posts, 'Salvamentos');

  const datas   = posts.map(p => p['Horário de publicação']).filter(Boolean);
  const earliest = datas.reduce((a, b) => a < b ? a : b, datas[0] || '');
  const latest   = datas.reduce((a, b) => a > b ? a : b, datas[0] || '');

  const counts = { c: 0, r: 0, i: 0, s: 0 };
  posts.forEach(p => counts[tKey(p['Tipo de post'])]++);

  const pillsHtml = `<span class="pill pill-total">${posts.length} publicações</span>` +
    [{ k:'c', c:'pill-c', d:'#a038f2' }, { k:'r', c:'pill-r', d:'#391bce' }, { k:'i', c:'pill-i', d:'#c9b8f8' }, { k:'s', c:'pill-s', d:'#6b5fd4' }]
      .filter(x => counts[x.k])
      .map(x => `<span class="pill ${x.c}"><span class="pill-dot" style="background:${x.d}"></span>${counts[x.k]} ${pillLabel(x.k, counts[x.k])}</span>`)
      .join('');

  const typesP   = [...new Set(chrono.map(p => tKey(p['Tipo de post'])))];
  const lgCfg    = { c: { l: 'Carrossel', c: '#a038f2' }, r: { l: 'Reel', c: '#391bce' }, i: { l: 'Post', c: 'rgba(201,184,248,.8)' }, s: { l: 'Story', c: '#6b5fd4' } };
  const legendHtml = typesP.map(k => `<div class="legend-item"><span class="legend-dot" style="background:${lgCfg[k].c}"></span>${lgCfg[k].l}</div>`).join('');

  const maxE   = Math.max(likes, shares, comments, saves, 1);
  const engHtml = [
    { l: 'Curtidas',    v: likes,    c: '#391bce' },
    { l: 'Compartilh.', v: shares,   c: '#a038f2' },
    { l: 'Comentários', v: comments, c: 'rgba(239,236,239,.6)' },
    { l: 'Salvamentos', v: saves,    c: '#6b5fd4' }
  ].map(e => `<div class="eng-row"><div class="eng-name">${e.l}</div><div class="eng-bar-bg"><div class="eng-bar" style="width:${(e.v/maxE*100).toFixed(1)}%;background:${e.c}"></div></div><div class="eng-num">${fmt(e.v)}</div></div>`).join('');

  const label     = multiYear ? `${MO[mi]} ${year}` : MO[mi];
  const publicoTab = hasMetrics ? `<button class="mtab" onclick="showTab('${key}','publico')">Público</button>` : '';

  return { chrono, html: `<div class="view" id="view-${key}">
  <div class="page-header">
    <div><div class="page-eyebrow">Instagram · ${year}</div><div class="page-title">${label}</div><div class="page-sub">@${ACCOUNT} · ${sDate(earliest)} – ${sDate(latest)}</div></div>
    <div class="pills-row">${pillsHtml}</div>
  </div>
  <div class="month-tabs">
    <button class="mtab active" onclick="showTab('${key}','geral')">Visão Geral</button>
    <button class="mtab" onclick="showTab('${key}','posts')">Posts</button>
    ${publicoTab}
  </div>

  <div class="tab-content active" id="tab-${key}-geral">
    <div class="kpi-row">
      <div class="kpi" style="--kpi-line:#391bce"><div class="kpi-label">Visualizações</div><div class="kpi-val">${fmt(views)}</div><div class="kpi-sub">total do período</div></div>
      <div class="kpi" style="--kpi-line:#a038f2"><div class="kpi-label">Alcance</div><div class="kpi-val">${fmt(alc)}</div><div class="kpi-sub">contas únicas</div></div>
      <div class="kpi" style="--kpi-line:#efecef"><div class="kpi-label">Curtidas</div><div class="kpi-val">${fmt(likes)}</div><div class="kpi-sub">reações</div></div>
      <div class="kpi" style="--kpi-line:#391bce"><div class="kpi-label">Compartilhamentos</div><div class="kpi-val">${fmt(shares)}</div><div class="kpi-sub">envios</div></div>
      <div class="kpi" style="--kpi-line:#a038f2"><div class="kpi-label">Comentários</div><div class="kpi-val">${fmt(comments)}</div><div class="kpi-sub">interações</div></div>
      <div class="kpi" style="--kpi-line:#efecef"><div class="kpi-label">Salvamentos</div><div class="kpi-val">${fmt(saves)}</div><div class="kpi-sub">saves</div></div>
    </div>
    ${renderAcct(acct)}
    ${hasMetrics ? `
    <div class="card section-gap">
      <div class="card-header"><div class="card-title">Visualizações diárias</div></div>
      <div style="position:relative;height:160px"><canvas id="ch-dv-${key}"></canvas></div>
    </div>
    <div class="two-col section-gap">
      <div class="card"><div class="card-header"><div class="card-title">Alcance diário</div></div><div style="position:relative;height:130px"><canvas id="ch-dr-${key}"></canvas></div></div>
      <div class="card"><div class="card-header"><div class="card-title">Seguidores ganhos por dia</div></div><div style="position:relative;height:130px"><canvas id="ch-df-${key}"></canvas></div></div>
    </div>` : ''}
    <div class="charts-row">
      <div class="card">
        <div class="card-header"><div class="card-title">Views por publicação</div><div class="legend">${legendHtml}</div></div>
        <div style="position:relative;height:200px"><canvas id="ch-${key}"></canvas></div>
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:12px">Engajamento total</div>
        <div class="eng-list" style="flex:1;justify-content:space-between">${engHtml}</div>
      </div>
    </div>
    <div class="card section-gap">
      <div class="card-header"><div class="card-title">Desempenho por dia da semana</div></div>
      ${weekdayHtml(posts, key)}
    </div>
  </div>

  <div class="tab-content" id="tab-${key}-posts">
    <div class="best-worst-section">
      <div class="bw-section-header"><div class="bw-section-title bw-section-title-best">★ Melhores publicações</div><div style="font-size:12px;color:var(--muted)">por views</div></div>
      <div class="post-section-grid">${top3.map((p, i) => postCard(p, ['1º MAIOR','2º MAIOR','3º MAIOR'][i], 'var(--blue)')).join('')}</div>
    </div>
    <div class="best-worst-section">
      <div class="bw-section-header"><div class="bw-section-title bw-section-title-worst">▼ Menores performances</div><div style="font-size:12px;color:var(--muted)">por views</div></div>
      <div class="post-section-grid">${worst3.map((p, i) => postCard(p, ['1º Menor','2º Menor','3º Menor'][i], 'var(--muted)')).join('')}</div>
    </div>
    <div class="card section-gap"><div class="card-header"><div class="card-title">Por formato</div></div>${postsByFormat(posts)}</div>
    <div class="card">
      <div class="card-header"><div class="card-title">Todas as publicações</div><div style="font-size:12px;color:var(--muted);font-weight:600">${posts.length} publicações</div></div>
      <div class="table-wrap"><table>
        <thead><tr><th>Capa</th><th>Data</th><th>Descrição</th><th>Tipo</th><th class="num">Views</th><th class="num">Alcance</th><th class="num">Curtidas</th><th class="num">Comp.</th><th class="num">Coment.</th><th class="num">Salv.</th><th class="num">Eng.%</th><th>Link</th></tr></thead>
        <tbody>${tableHtml(sorted, best)}</tbody>
      </table></div>
    </div>
  </div>

  ${hasMetrics ? `<div class="tab-content" id="tab-${key}-publico"><div id="pub-${key}"><div class="empty-wrap"><p>Carregando dados de público...</p></div></div></div>` : ''}
</div>` };
}

/* ─────────────────────────────────────────────
   Build: Annual
───────────────────────────────────────────── */

function buildAnnual(yearMonths, year, acctMap) {
  const allPosts  = yearMonths.flatMap(m => m.posts);
  const views     = sum(allPosts, 'Visualizações');
  const alc       = sum(allPosts, 'Alcance');
  const likes     = sum(allPosts, 'Curtidas');
  const shares    = sum(allPosts, 'Compartilhamentos');
  const comments  = sum(allPosts, 'Comentários');
  const saves     = sum(allPosts, 'Salvamentos');

  const bestMonth = yearMonths.reduce((a, b) => sum(b.posts, 'Visualizações') > sum(a.posts, 'Visualizações') ? b : a, yearMonths[0]);
  const bmV   = sum(bestMonth.posts, 'Visualizações');
  const bmL   = sum(bestMonth.posts, 'Curtidas');
  const bmS   = sum(bestMonth.posts, 'Compartilhamentos');
  const bmC   = sum(bestMonth.posts, 'Comentários');
  const bmEng = bmV > 0 ? ((bmL + bmS + bmC) / bmV * 100) : 0;

  const byV    = [...allPosts].sort((a, b) => (parseInt(b['Visualizações'], 10) || 0) - (parseInt(a['Visualizações'], 10) || 0));
  const top3   = byV.slice(0, 3);
  const worst3 = byV.slice(-3).reverse();

  const msCards = Array.from({ length: 12 }, (_, i) => {
    const m = yearMonths.find(m => m.mi === i);
    if (!m) return `<div class="ms-card no-data"><div class="ms-name">${MO[i]}</div><div class="ms-views">sem dados</div></div>`;

    const mv   = sum(m.posts, 'Visualizações');
    const ma   = sum(m.posts, 'Alcance');
    const ml   = sum(m.posts, 'Curtidas');
    const ms2  = sum(m.posts, 'Compartilhamentos');
    const isBest = m === bestMonth;

    return `<div class="ms-card" style="${isBest ? 'border-color:rgba(57,27,206,.4)' : ''}" onclick="showView('view-${m.key}')">
      <div class="ms-name" style="${isBest ? 'color:var(--orange)' : ''}">${MO[i]}${isBest ? ' ★' : ''}</div>
      <div class="ms-views">${mv > 0 ? fmt(mv) : '—'}</div>
      <div class="ms-label">visualizações · ${m.posts.length} publicações</div>
      <div class="ms-row"><span><span class="ms-val">${fmt(ml)}</span> curtidas</span><span><span class="ms-val">${fmt(ms2)}</span> comp.</span><span><span class="ms-val">${fmt(ma)}</span> alcance</span></div>
    </div>`;
  }).join('');

  const hasFollData = yearMonths.some(m => acctMap[m.key]?.['Total seguidores']);

  return `<div class="view" id="view-annual-${year}">
  <div class="page-header">
    <div><div class="page-eyebrow">Visão Anual</div><div class="page-title">${year}</div><div class="page-sub">@${ACCOUNT} · ${yearMonths.length} ${yearMonths.length === 1 ? 'mês' : 'meses'} · ${allPosts.length} publicações</div></div>
  </div>
  <div class="kpi-row">
    <div class="kpi" style="--kpi-line:#391bce"><div class="kpi-label">Visualizações</div><div class="kpi-val">${fmt(views)}</div><div class="kpi-sub">no ano</div></div>
    <div class="kpi" style="--kpi-line:#a038f2"><div class="kpi-label">Alcance</div><div class="kpi-val">${fmt(alc)}</div><div class="kpi-sub">no ano</div></div>
    <div class="kpi" style="--kpi-line:#efecef"><div class="kpi-label">Curtidas</div><div class="kpi-val">${fmt(likes)}</div><div class="kpi-sub">no ano</div></div>
    <div class="kpi" style="--kpi-line:#391bce"><div class="kpi-label">Compartilhamentos</div><div class="kpi-val">${fmt(shares)}</div><div class="kpi-sub">no ano</div></div>
    <div class="kpi" style="--kpi-line:#a038f2"><div class="kpi-label">Comentários</div><div class="kpi-val">${fmt(comments)}</div><div class="kpi-sub">no ano</div></div>
    <div class="kpi" style="--kpi-line:#efecef"><div class="kpi-label">Publicações</div><div class="kpi-val">${allPosts.length}</div><div class="kpi-sub">${yearMonths.length} meses</div></div>
  </div>
  <div class="charts-row section-gap">
    <div class="card">
      <div class="card-header"><div class="card-title">Views e Alcance por mês</div><div class="legend"><div class="legend-item"><span class="legend-dot" style="background:#391bce"></span>Views</div><div class="legend-item"><span class="legend-dot" style="background:#a038f2"></span>Alcance</div></div></div>
      <div style="position:relative;height:200px"><canvas id="ch-annual-${year}"></canvas></div>
    </div>
    ${hasFollData ? `<div class="card">
      <div class="card-header"><div class="card-title">Crescimento de seguidores</div><div style="font-size:12px;color:var(--muted)">linha tracejada = tendência</div></div>
      <div style="position:relative;flex:1;min-height:120px"><canvas id="ch-annual-foll-${year}" style="position:absolute;inset:0"></canvas></div>
    </div>` : ''}
  </div>
  <div class="best-worst-section section-gap">
    <div class="bw-section-header"><div class="bw-section-title bw-section-title-best">★ Top publicações do ano</div><div style="font-size:12px;color:var(--muted)">clique para abrir</div></div>
    <div class="post-section-grid">${top3.map((p, i) => postCard(p, ['1º MAIOR','2º MAIOR','3º MAIOR'][i], 'var(--blue)')).join('')}</div>
  </div>
  <div class="best-worst-section section-gap">
    <div class="bw-section-header"><div class="bw-section-title bw-section-title-worst">▼ Menores do ano</div><div style="font-size:12px;color:var(--muted)">menor alcance</div></div>
    <div class="post-section-grid">${worst3.map((p, i) => postCard(p, ['1º Menor','2º Menor','3º Menor'][i], 'var(--muted)')).join('')}</div>
  </div>
  <div class="card section-gap">
    <div class="card-header"><div class="card-title">Desempenho por dia da semana — ${year}</div><div style="font-size:12px;color:var(--muted)">média de views por dia, todos os meses</div></div>
    <div id="annual-wd-${year}"></div>
  </div>
  <div>
    <div class="card-header" style="margin-bottom:.75rem"><div class="card-title">Todos os meses de ${year}</div><div style="font-size:12px;color:var(--muted)">clique para navegar</div></div>
    <div class="annual-grid">${msCards}</div>
  </div>
</div>`;
}

/* ─────────────────────────────────────────────
   Metric fetching
───────────────────────────────────────────── */

async function fetchMetricCsv(year, mo, name) {
  try {
    const r = await fetch(`data/${year}/${mo}/${name}.csv`);
    if (!r.ok) return null;
    const buf  = await r.arrayBuffer();
    const text = new TextDecoder('utf-16').decode(buf);
    const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim());
    const dataLines = lines.filter(l => l.includes(',') && !l.startsWith('sep='));
    if (dataLines.length < 2) return null;
    const parsed = Papa.parse(dataLines.join('\n'), { header: true, skipEmptyLines: true });
    return parsed.data;
  } catch (e) { return null; }
}

async function fetchPublicoCsv(year, mo) {
  try {
    const r = await fetch(`data/${year}/${mo}/Público.csv`);
    if (!r.ok) return null;
    const buf      = await r.arrayBuffer();
    const text     = new TextDecoder('utf-16').decode(buf);
    const rawLines = text.replace(/\r/g, '').split('\n').filter(l => l.trim() && !l.startsWith('sep='));
    const ages = [], countries = [], cities = [];

    function parseLine(l) { return Papa.parse(l, { delimiter: ',' }).data[0] || []; }

    let mode = '', i = 0;
    while (i < rawLines.length) {
      const line     = rawLines[i].trim();
      const stripped = line.replace(/"/g, '').trim();

      if (stripped === 'Faixa etária e gênero') { mode = 'ages';      i++; continue; }
      if (stripped === 'Principais países')      { mode = 'countries'; i++; continue; }
      if (stripped === 'Principais cidades')     { mode = 'cities';    i++; continue; }
      if (stripped.startsWith(',') && mode === 'ages') { i++; continue; }

      const cols = parseLine(line);
      if (!cols.length || !cols[0]) { i++; continue; }

      if (mode === 'ages') {
        if (/^\d{2}[-+]/.test(cols[0])) {
          ages.push({ range: cols[0], f: parseFloat(cols[1]) || 0, m: parseFloat(cols[2]) || 0 });
        }
        i++;
      } else if (mode === 'countries' || mode === 'cities') {
        const nextLine = rawLines[i + 1]?.trim();
        if (nextLine) {
          const nextCols = parseLine(nextLine);
          if (nextCols.length && nextCols.every(c => !isNaN(parseFloat(c)) && c.trim() !== '')) {
            const target = mode === 'cities' ? cities : countries;
            cols.forEach((n, idx) => { if (n.trim() && nextCols[idx]) target.push({ name: n.trim(), pct: parseFloat(nextCols[idx]) || 0 }); });
            i += 2; continue;
          }
        }
        i++;
      } else { i++; }
    }

    return { ages, countries, cities };
  } catch (e) { console.error('Público parse error:', e); return null; }
}

/* ─────────────────────────────────────────────
   Tabs
───────────────────────────────────────────── */

function showTab(key, tab) {
  const view = document.getElementById(`view-${key}`);
  if (!view) return;
  view.querySelectorAll('.mtab').forEach(t => t.classList.remove('active'));
  view.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  const at = view.querySelector(`.mtab[onclick*="'${tab}'"]`);
  if (at) at.classList.add('active');
  const ac = document.getElementById(`tab-${key}-${tab}`);
  if (ac) ac.classList.add('active');
  if (tab === 'geral')   renderMonthGeralCharts(key);
  if (tab === 'publico') renderPublicoTab(key);
}

/* ─────────────────────────────────────────────
   Chart caches
───────────────────────────────────────────── */

const metricsCache  = {};
const publicoCache  = {};
const monthChronoMap = {};

function renderWdCharts(key, posts) {
  WD.forEach((_, i) => {
    const id = `wdc-${key}-${i}`;
    if (!document.getElementById(id)) return;
    const dayPosts = posts
      .filter(p => { const r = parsePostDate(p['Horário de publicação']); return r && r.date.getDay() === i; })
      .sort((a, b) => new Date(a['Horário de publicação'] || 0) - new Date(b['Horário de publicação'] || 0));
    if (!dayPosts.length) return;
    const vals = dayPosts.map(p => parseInt(p['Visualizações'], 10) || 0);
    const maxV = Math.max(...vals, 1);
    mkChart(id, {
      type: 'bar',
      data: {
        labels: dayPosts.map((_, wi) => `S${wi + 1}`),
        datasets: [{ data: vals, backgroundColor: Array(vals.length).fill(document.getElementById(id).closest('.wd-best') ? '#a038f2' : 'rgba(255,255,255,.2)'), borderRadius: 2 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: true, callbacks: { label: ctx => ` ${fmt(ctx.parsed.y)} views` } } },
        scales: { x: { display: true, ticks: { color: '#8b86a8', font: { size: 8, family: "'Bricolage Grotesque',sans-serif" }, maxRotation: 0 }, grid: { display: false } }, y: { display: false, min: 0, max: maxV * 1.15 } }
      }
    });
  });
}

function renderMonthGeralCharts(key) {
  const chrono = monthChronoMap[key];
  if (!chrono) return;
  const postVals = chrono.map(p => parseInt(p['Visualizações'], 10) || 0);
  mkChart(`ch-${key}`, {
    type: 'bar',
    data: {
      labels: chrono.map(p => sDate(p['Horário de publicação'])),
      datasets: [{ data: postVals, backgroundColor: chrono.map(p => bColor(p['Tipo de post'])), borderRadius: 4, borderSkipped: false }]
    },
    options: { ...cOpts(), plugins: { ...cOpts().plugins, tooltip: { ...cOpts().plugins.tooltip, callbacks: { label: ctx => ' ' + ctx.parsed.y.toLocaleString('pt-BR') + ' views' } } }, scales: { ...cOpts().scales, y: { ...cOpts().scales.y, max: yMax(postVals) } } }
  });
  renderWdCharts(key, Object.values(monthChronoMap[key]));

  const m = metricsCache[key];
  if (!m) return;

  function dailyChart(id, data, color) {
    if (!data || !document.getElementById(id)) return;
    const labels = data.map(r => { const d = new Date(r['Data']); return `${d.getDate()}/${d.getMonth()+1}`; });
    const vals   = data.map(r => parseInt(r['Primary'], 10) || 0);
    mkChart(id, {
      type: 'line',
      data: { labels, datasets: [{ data: vals, borderColor: color, backgroundColor: color.replace(')', ', .08)').replace('rgb','rgba'), borderWidth: 2, fill: true, tension: .4, pointRadius: 2, pointHoverRadius: 4 }] },
      options: { ...cOpts(), scales: { ...cOpts().scales, y: { ...cOpts().scales.y, max: yMax(vals) } } }
    });
  }

  dailyChart(`ch-dv-${key}`, m.views,     '#391bce');
  dailyChart(`ch-dr-${key}`, m.reach,     '#a038f2');
  dailyChart(`ch-df-${key}`, m.followers, '#a2e259');
}

async function renderPublicoTab(key) {
  const el = document.getElementById(`pub-${key}`);
  if (!el) return;
  if (publicoCache[key] !== undefined) {
    el.innerHTML = publicoCache[key]
      ? renderPublico(publicoCache[key])
      : `<div class="empty-wrap"><p>Arquivo Público.csv não encontrado.</p></div>`;
    return;
  }
  const [y, mo] = key.split('-');
  const pub = await fetchPublicoCsv(y, mo.padStart(2,'0'));
  publicoCache[key] = pub;
  el.innerHTML = pub
    ? renderPublico(pub)
    : `<div class="empty-wrap"><p>Arquivo Público.csv não encontrado para este mês.</p></div>`;
}

/* ─────────────────────────────────────────────
   Navigation
───────────────────────────────────────────── */

let currentView = null;
let allMonths   = [];

function showView(vid) {
  if (currentView === vid) return;

  /* Se a view solicitada não existir no DOM, cai na home */
  if (vid !== 'view-home' && !document.getElementById(vid)) {
    showView('view-home');
    return;
  }

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  const btnHome = document.getElementById('btn-home');
  if (btnHome) btnHome.classList.remove('active');
  const view = document.getElementById(vid);
  if (view) view.classList.add('active');
  const tab = document.querySelector(`[data-view="${vid}"]`);
  if (tab) tab.classList.add('active');
  if (vid === 'view-home' && btnHome) btnHome.classList.add('active');
  currentView = vid;
  if (vid === 'view-home') return;

  if (vid.startsWith('view-') && !vid.startsWith('view-annual')) {
    const key = vid.replace('view-', '');
    setTimeout(() => renderMonthGeralCharts(key), 50);
  } else if (vid.startsWith('view-annual-')) {
    const y  = parseInt(vid.replace('view-annual-', ''));
    const yM = allMonths.filter(m => m.year === y);
    const labels12 = MO.map(m => m.slice(0, 3));
    const views12  = labels12.map((_, i) => { const m = yM.find(m => m.mi === i); return m ? sum(m.posts, 'Visualizações') : null; });
    const reach12  = labels12.map((_, i) => { const m = yM.find(m => m.mi === i); return m ? sum(m.posts, 'Alcance') : null; });

    setTimeout(() => {
      const v12 = views12.filter(v => v !== null);
      mkChart(`ch-annual-${y}`, {
        type: 'bar',
        data: {
          labels: labels12,
          datasets: [
            { label: 'Views',  data: views12, backgroundColor: views12.map(v => v === null ? 'rgba(255,255,255,.05)' : '#391bce'), borderRadius: 4, borderSkipped: false },
            { label: 'Alcance', data: reach12, backgroundColor: reach12.map(v => v === null ? 'rgba(255,255,255,.03)' : '#a038f2'), borderRadius: 3, borderSkipped: false }
          ]
        },
        options: { ...cOpts(), plugins: { ...cOpts().plugins, legend: { display: false } }, scales: { ...cOpts().scales, x: { ...cOpts().scales.x, ticks: { ...cOpts().scales.x.ticks, maxTicksLimit: 12 } }, y: { ...cOpts().scales.y, max: yMax(v12) } } }
      });

      const follPts = Array.from({ length: 12 }, (_, i) => {
        const m = yM.find(m => m.mi === i);
        const v = m ? parseFloat((window.acctMap?.[m.key] || {})['Total seguidores']) || null : null;
        return { label: labels12[i], val: v };
      });

      const hasFoll = follPts.some(p => p.val !== null);
      if (hasFoll && document.getElementById(`ch-annual-foll-${y}`)) {
        const validVals = follPts.filter(p => p.val !== null).map(p => p.val);
        const yMinV = Math.floor(Math.min(...validVals) * 0.95);
        const yMaxV = Math.ceil(Math.max(...validVals) * 1.4);
        const xs = validVals.map((_, i) => i), ys = validVals;
        const n  = xs.length;
        const sx = xs.reduce((a, b) => a + b, 0), sy = ys.reduce((a, b) => a + b, 0);
        const sxy = xs.reduce((a, x, i) => a + x * ys[i], 0), sx2 = xs.reduce((a, x) => a + x * x, 0);
        const slope = (n * sxy - sx * sy) / (n * sx2 - sx * sx || 1);
        const intercept = (sy - slope * sx) / n;
        let ti = 0;
        const trend12 = follPts.map(p => { if (p.val !== null) { const v = Math.round(slope * ti + intercept); ti++; return v; } return null; });
        mkChart(`ch-annual-foll-${y}`, {
          type: 'line',
          data: {
            labels: labels12,
            datasets: [
              { label: 'Seguidores', data: follPts.map(p => p.val), borderColor: '#a2e259', backgroundColor: 'rgba(162,226,89,.08)', borderWidth: 2, fill: true, tension: .4, pointRadius: follPts.map(p => p.val !== null ? 3 : 0), spanGaps: false },
              { label: 'Tendência',  data: trend12, borderColor: 'rgba(162,226,89,.35)', borderDash: [4, 4], borderWidth: 1.5, fill: false, tension: 0, pointRadius: 0, spanGaps: false }
            ]
          },
          options: { ...cOpts(), plugins: { ...cOpts().plugins, legend: { display: false } }, scales: { ...cOpts().scales, y: { ...cOpts().scales.y, min: yMinV, max: yMaxV } } }
        });
      }

      const wdEl = document.getElementById(`annual-wd-${y}`);
      if (wdEl) {
        const allYPosts = yM.flatMap(m => m.posts);
        const wdStats   = Array.from({ length: 7 }, () => ({ views: 0, count: 0, likes: 0, shares: 0, comments: 0, saves: 0 }));
        allYPosts.forEach(p => {
          const r = parsePostDate(p['Horário de publicação']);
          if (!r) return;
          const d = r.date.getDay();
          wdStats[d].views    += (parseInt(p['Visualizações'], 10) || 0);
          wdStats[d].likes    += (parseInt(p['Curtidas'], 10) || 0);
          wdStats[d].shares   += (parseInt(p['Compartilhamentos'], 10) || 0);
          wdStats[d].comments += (parseInt(p['Comentários'], 10) || 0);
          wdStats[d].saves    += (parseInt(p['Salvamentos'], 10) || 0);
          wdStats[d].count++;
        });
        const bestWd = wdStats.reduce((bi, s, i) => s.count > 0 && s.views > wdStats[bi].views ? i : bi, 0);
        wdEl.innerHTML = `<div class="weekday-grid">${WD.map((name, i) => {
          const s = wdStats[i];
          const isBest = i === bestWd && s.count > 0;
          const avg = s.count > 0 ? Math.round(s.views / s.count) : 0;
          const eng = s.views > 0 ? ((s.likes + s.shares + s.comments + s.saves) / s.views * 100) : 0;
          if (s.count === 0) return `<div class="weekday-card"><div class="weekday-name">${name}</div><div class="wd-empty">sem dados</div></div>`;
          return `<div class="weekday-card${isBest ? ' wd-best' : ''}">
            <div class="weekday-name">${name}</div>
            <div class="wd-metric-label">Média views</div>
            <div class="wd-metric-val primary">${fmt(avg)}</div>
            <div class="wd-metric-label">Publicações</div>
            <div class="wd-metric-val">${s.count}</div>
            <div class="wd-metric-label">Engajamento</div>
            <div class="wd-metric-val">${eng.toFixed(1)}%</div>
          </div>`;
        }).join('')}</div>`;
      }
    }, 50);
  }
}

/* ─────────────────────────────────────────────
   Init
───────────────────────────────────────────── */

(async function init() {
  const now      = new Date();
  const currYear = now.getFullYear();
  const currMo   = String(now.getMonth() + 1).padStart(2, '0');
  const currKey  = `${currYear}-${currMo}`;

  /* Read optional initial view from <body data-initial-view="..."> */
  const initialView = document.body.dataset.initialView || 'view-home';

  function splitByMonth(posts) {
    const byKey = {};
    posts.forEach(p => {
      const h = p['Horário de publicação'] || '';
      const parts = h.split(' ')[0].split('/');
      if (parts.length < 3) return;
      const y  = parseInt(parts[2]), mo = parseInt(parts[0]) - 1;
      const key = `${y}-${String(mo + 1).padStart(2, '0')}`;
      if (!byKey[key]) byKey[key] = { mi: mo, year: y, key, mo: String(mo + 1).padStart(2, '0'), posts: [] };
      byKey[key].posts.push(p);
    });
    return Object.values(byKey);
  }

  /* Build candidates for all years in YEAR_RANGE */
  const candidates = [];
  YEAR_RANGE.forEach(y => {
    for (let i = 0; i < 12; i++) {
      const mo = String(i + 1).padStart(2, '0');
      candidates.push({ year: y, mi: i, key: `${y}-${mo}`, mo });
    }
  });

  const mFetches = candidates.map(({ year, mi, key, mo }) =>
    fetch(`data/${year}/${mo}/${key}.csv`)
      .then(r => r.ok ? r.text() : null)
      .catch(() => null)
      .then(text => {
        if (!text) return null;
        const posts = parsePosts(Papa.parse(text, { header: true, skipEmptyLines: true }).data);
        return posts.length ? { mi, year, key, mo, posts } : null;
      })
  );

  /* Multi-mês: apenas para o ano atual e anterior, para não gerar centenas de 404s */
  const multiCands = [];
  [currYear - 1, currYear].forEach(y => {
    for (let f = 1; f <= 12; f++) {
      for (let t = f + 1; t <= 12; t++) {
        multiCands.push({ y, key: `${y}-${String(f).padStart(2,'0')}-${String(t).padStart(2,'0')}` });
      }
    }
  });

  const multiFetches = multiCands.map(({ y, key }) =>
    fetch(`data/${y}/${key}.csv`)
      .then(r => r.ok ? r.text() : null)
      .catch(() => null)
      .then(text => {
        if (!text) return null;
        const all = parsePosts(Papa.parse(text, { header: true, skipEmptyLines: true }).data);
        return all.length ? splitByMonth(all) : null;
      })
  );

  const [monthlyRaw, multiRaw] = await Promise.all([Promise.all(mFetches), Promise.all(multiFetches)]);

  const seen = new Set(), results = [];
  monthlyRaw.filter(Boolean).forEach(m => { if (!seen.has(m.key)) { seen.add(m.key); results.push(m); } });
  multiRaw.filter(Boolean).forEach(months => {
    months.forEach(m => { if (!seen.has(m.key)) { seen.add(m.key); if (!m.mo) m.mo = m.key.split('-')[1]; results.push(m); } });
  });
  results.sort((a, b) => a.key.localeCompare(b.key));

  if (!results.length) {
    document.getElementById('app-loading').innerHTML =
      `<div class="empty-wrap"><div class="et">Nenhum dado encontrado</div><p>Suba os arquivos em <code>data/${currYear}/${currMo}/${currKey}.csv</code></p></div>`;
    return;
  }

  const years = [...new Set(results.map(m => m.year))].sort();

  /* Load dados_gerais.xlsx */
  const acctMap = {};
  try {
    const res = await fetch('data/dados_gerais.xlsx');
    if (res.ok) {
      const ab = await res.arrayBuffer();
      const wb = XLSX.read(ab, { type: 'array' });
      wb.SheetNames.forEach(sh => {
        const y = parseInt(sh, 10);
        if (isNaN(y)) return;
        const data = XLSX.utils.sheet_to_json(wb.Sheets[sh], { defval: '' });
        data.forEach(row => {
          if (!row['Mês']) return;
          const mi = MO.findIndex(m => m.toLowerCase() === row['Mês'].trim().toLowerCase());
          if (mi !== -1) acctMap[`${y}-${String(mi + 1).padStart(2,'0')}`] = row;
        });
      });
    }
  } catch (e) {}

  window.acctMap = acctMap;

  /* Check for daily metric files */
  const hasMetrics = {};
  await Promise.all(results.map(async m => {
    const mo = (m.mo || m.key.split('-')[1]).padStart(2, '0');
    const r  = await fetch(`data/${m.year}/${mo}/Visualizações.csv`).catch(() => ({ ok: false }));
    hasMetrics[m.key] = r.ok;
    if (r.ok) {
      const [views, reach, followers] = await Promise.all([
        fetchMetricCsv(m.year, mo, 'Visualizações'),
        fetchMetricCsv(m.year, mo, 'Alcance'),
        fetchMetricCsv(m.year, mo, 'Seguidores')
      ]);
      metricsCache[m.key] = { views, reach, followers };
    }
  }));

  /* Build sidebar nav */
  allMonths = results;
  const multiYear = years.length > 1;

  const bestKeyPerYear = {};
  years.forEach(y => {
    const yM = results.filter(m => m.year === y);
    if (yM.length) {
      const b = yM.reduce((a, b) => sum(b.posts, 'Visualizações') > sum(a.posts, 'Visualizações') ? b : a, yM[0]);
      bestKeyPerYear[y] = b.key;
    }
  });

  let bestYearOverall = years[0];
  let maxYViews = -1;
  years.forEach(y => {
    const v = sum(results.filter(m => m.year === y).flatMap(m => m.posts), 'Visualizações');
    if (v > maxYViews) { maxYViews = v; bestYearOverall = y; }
  });

  function getMonthColor(key) {
    const y      = parseInt(key.split('-')[0]);
    const isCurr = key === currKey;
    const isBest = bestKeyPerYear[y] === key;
    if (isBest) return 'var(--blue)';
    if (isCurr) return 'var(--orange)';
    return 'rgba(255,255,255,.18)';
  }

  const nav = document.getElementById('monthNav');
  years.forEach(y => {
    const yDiv = document.createElement('div');
    yDiv.className = (y === 2025 || y === 2026) ? 'sidebar-section year-header' : 'sidebar-section';
    yDiv.innerHTML = `${y} <span class="chev">▼</span>`;
    nav.appendChild(yDiv);

    const group = document.createElement('div');
    group.className = 'year-group';
    results.filter(m => m.year === y).forEach(m => {
      const btn = document.createElement('button');
      btn.className  = 'nav-tab';
      btn.dataset.view = `view-${m.key}`;
      btn.innerHTML  = `<span class="nav-dot" style="background:${getMonthColor(m.key)}"></span>${MO[m.mi]}`;
      btn.onclick    = () => showView(`view-${m.key}`);
      group.appendChild(btn);
    });
    nav.appendChild(group);
    requestAnimationFrame(() => { group.style.maxHeight = group.scrollHeight + 'px'; });
    yDiv.addEventListener('click', () => {
      const c = group.classList.toggle('coll');
      yDiv.classList.toggle('coll', c);
      if (!c) { group.style.maxHeight = group.scrollHeight + 'px'; } else { group.style.maxHeight = '0'; }
    });
  });

  const divider   = document.createElement('div');   divider.className = 'sidebar-divider';
  const geralDiv  = document.createElement('div');   geralDiv.className = 'sidebar-section'; geralDiv.style.cursor = 'default'; geralDiv.textContent = 'ANUAL';
  document.querySelector('.sidebar-body').appendChild(divider);
  document.querySelector('.sidebar-body').appendChild(geralDiv);

  years.forEach(y => {
    const btn         = document.createElement('button');
    btn.className     = 'nav-tab';
    btn.dataset.view  = `view-annual-${y}`;
    const isCurrYear  = y === currYear;
    const isBestYear  = y === bestYearOverall;
    let yDotColor     = 'rgba(255,255,255,.18)';
    if (isBestYear) yDotColor = 'var(--blue)';
    else if (isCurrYear) yDotColor = 'var(--orange)';
    btn.innerHTML = `<span class="nav-dot" style="background:${yDotColor}"></span>${y}`;
    btn.onclick   = () => showView(`view-annual-${y}`);
    document.querySelector('.sidebar-body').appendChild(btn);
  });

  document.getElementById('btn-annual').style.display = 'none';

  /* Render all views into DOM */
  const byYear = {};
  results.forEach(m => { if (!byYear[m.year]) byYear[m.year] = []; byYear[m.year].push(m); });

  let html = buildHome(years, byYear, acctMap);
  results.forEach(m => {
    const mo  = (m.mo || m.key.split('-')[1]).padStart(2, '0');
    const b   = buildMonth(m.mi, m.posts, m.key, m.year, multiYear, acctMap[m.key] || null, hasMetrics[m.key] || false);
    html += b.html;
    monthChronoMap[m.key] = b.chrono;
  });
  years.forEach(y => { html += buildAnnual(byYear[y], y, acctMap); });
  document.getElementById('mainContent').innerHTML = html;

  /* Home sparklines */
  years.forEach(y => {
    const yM       = byYear[y] || [];
    const sparkData = Array.from({ length: 12 }, (_, i) => { const m = yM.find(m => m.mi === i); return m ? sum(m.posts, 'Visualizações') : null; });
    const el       = document.getElementById(`home-ch-${y}`);
    if (!el) return;
    const accents  = ['#391bce', '#a038f2', '#a2e259', '#c9b8f8'];
    const accent   = accents[years.indexOf(y) % accents.length];
    mkChart(`home-ch-${y}`, {
      type: 'bar',
      data: {
        labels: MO.map(m => m.slice(0, 3)),
        datasets: [{ data: sparkData, backgroundColor: sparkData.map(v => v === null ? 'rgba(255,255,255,.04)' : accent + 'cc'), borderRadius: 3, borderSkipped: false }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0d1030', borderColor: 'rgba(255,255,255,.1)', borderWidth: 1, titleColor: '#efecef', bodyColor: '#8b86a8', callbacks: { label: ctx => ctx.parsed.y === null ? 'sem dados' : ` ${fmt(ctx.parsed.y)} views` } } },
        scales: { x: { grid: { display: false }, ticks: { color: '#8b86a8', font: { size: 9, family: "'Bricolage Grotesque',sans-serif" } } }, y: { display: false } }
      }
    });
  });

  /* Comparison chart */
  if (years.length > 1 && document.getElementById('home-ch-compare')) {
    const accents  = ['#391bce', '#a038f2', '#a2e259', '#c9b8f8'];
    const datasets = years.map((y, yi) => {
      const yM   = byYear[y] || [];
      const vals = Array.from({ length: 12 }, (_, i) => { const m = yM.find(m => m.mi === i); return m ? sum(m.posts, 'Visualizações') : null; });
      return { label: String(y), data: vals, backgroundColor: accents[yi % accents.length] + 'cc', borderRadius: 3, borderSkipped: false };
    });
    const allViewVals = datasets.flatMap(d => d.data).filter(v => v !== null);
    mkChart('home-ch-compare', {
      type: 'bar',
      data: { labels: MO.map(m => m.slice(0, 3)), datasets },
      options: { ...cOpts(), plugins: { ...cOpts().plugins, legend: { display: true, labels: { color: '#8b86a8', font: { family: "'Bricolage Grotesque',sans-serif", size: 11 }, boxWidth: 10, boxHeight: 10 } } }, scales: { ...cOpts().scales, x: { ...cOpts().scales.x, ticks: { ...cOpts().scales.x.ticks, maxTicksLimit: 12 } }, y: { ...cOpts().scales.y, max: yMax(allViewVals) } } }
    });
  }

  /* Followers evolution chart */
  const allMonthsFlat2 = results.sort((a, b) => a.key.localeCompare(b.key));
  const homeFoll = allMonthsFlat2.map(m => ({ label: `${MS[m.mi]}/${String(m.year).slice(-2)}`, val: parseFloat((acctMap[m.key] || {})['Total seguidores']) || null }));
  if (homeFoll.some(f => f.val !== null) && document.getElementById('home-ch-foll')) {
    mkChart('home-ch-foll', {
      type: 'line',
      data: { labels: homeFoll.map(f => f.label), datasets: [{ data: homeFoll.map(f => f.val), borderColor: '#a2e259', backgroundColor: 'rgba(162,226,89,.08)', borderWidth: 2, fill: true, tension: .4, pointRadius: homeFoll.map(f => f.val !== null ? 3 : 0), spanGaps: false }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0d1030', borderColor: 'rgba(255,255,255,.1)', borderWidth: 1, titleColor: '#efecef', bodyColor: '#8b86a8' } }, scales: { x: { grid: { display: false }, ticks: { color: '#8b86a8', font: { size: 11 } } }, y: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#8b86a8', font: { size: 11 }, callback: v => `${fmt(v)}` } } } }
    });
  }

  /* Hamburger */
  const layout = document.getElementById('layout');
  document.getElementById('hamburger').addEventListener('click', () => {
    layout.classList.toggle('collapsed');
    setTimeout(() => window.dispatchEvent(new Event('resize')), 280);
  });

  /* Done */
  document.getElementById('app-loading').style.display = 'none';
  document.getElementById('app').style.display = 'block';

  /* Se a view inicial não existir no DOM (ex: 2026.html sem dados de 2026), cai na home */
  const targetView = document.getElementById(initialView) ? initialView : 'view-home';
  showView(targetView);
})();

/* ─────────────────────────────────────────────
   Favicon — render circular crop
───────────────────────────────────────────── */
(function () {
  const img = new Image();
  img.onload = function () {
    const c   = document.createElement('canvas');
    c.width   = 64; c.height = 64;
    const ctx = c.getContext('2d');
    ctx.beginPath();
    ctx.arc(32, 32, 32, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, 0, 0, 64, 64);
    const link = document.querySelector("link[rel='icon']") || document.createElement('link');
    link.rel  = 'icon';
    link.href = c.toDataURL('image/png');
    document.head.appendChild(link);
  };
  img.src = 'favicon.png';
})();
