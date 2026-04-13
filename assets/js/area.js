/* ─────────────────────────────────────────────
   area.js — Dashboard genérico por área
   Espera AREA_CONFIG definido no HTML da página.
   VML Company · Temeron · 2026

   CORREÇÕES:
   [1] _updateLogo: caminhos absolutos /assets/img/ (não relativos)
   [2] toggleTheme: versão única e correta, sem conflito com inline
   [3] _YEARS: range amplo (2022–2030), igual ao redes-sociais.js
   [4] init(): try-catch global — loading spinner nunca fica preso
   [5] Suporte a .xlsx como fallback do .csv (via SheetJS)
   [6] Prioridade: CSV/XLSX existente > estado vazio com —
   [7] Dados da fonte indicados no header (arquivo ou API)
─────────────────────────────────────────────── */

const _MO = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const _MS = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const _YEARS = [2022,2023,2024,2025,2026,2027,2028,2029,2030]; /* [FIX 3] range amplo */

const _fmt    = n => (n == null || n === '' || isNaN(Number(n))) ? '—' : Number(n).toLocaleString('pt-BR');
const _fmtPct = n => (n == null || n === '' || isNaN(Number(n))) ? '—' : Number(n).toFixed(1) + '%';
const _fmtDec = n => (n == null || n === '' || isNaN(Number(n))) ? '—' : Number(n).toFixed(1);
const _fmtBRL = n => (n == null || n === '' || isNaN(Number(n))) ? '—' : 'R$ ' + Number(n).toLocaleString('pt-BR');

const _charts = {};
function _mkChart(id, cfg) {
  if (_charts[id]) _charts[id].destroy();
  const el = document.getElementById(id);
  if (el) _charts[id] = new Chart(el, cfg);
}

function _themeColors() {
  const s = document.documentElement.dataset.theme === 'light';
  return {
    bg:     s ? '#ffffff'              : '#0d1030',
    border: s ? 'rgba(0,0,0,.08)'     : 'rgba(255,255,255,.1)',
    title:  s ? '#12155a'             : '#efecef',
    body:   s ? '#5a5070'             : '#8b86a8',
    grid:   s ? 'rgba(18,21,90,.06)'  : 'rgba(255,255,255,.04)',
    tick:   s ? '#5a5070'             : '#8b86a8',
  };
}

function _baseOpts() {
  const c = _themeColors();
  return {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: c.bg, borderColor: c.border, borderWidth: 1,
        titleColor: c.title, bodyColor: c.body,
        titleFont: { family:"'Poppins',sans-serif", weight:'700' },
        bodyFont:  { family:"'Poppins',sans-serif", size:12 } }
    },
    scales: {
      x: { grid:{ display:false }, ticks:{ color:c.tick, font:{ size:11, family:"'Poppins',sans-serif" } } },
      y: { grid:{ color:c.grid  }, ticks:{ color:c.tick, font:{ size:11, family:"'Poppins',sans-serif" },
        callback: v => v >= 1000 ? (v/1000).toFixed(1)+'k' : v } }
    }
  };
}

/* ─────────────────────────────────────────────
   [FIX 1+2] Theme — caminhos absolutos, sem conflito
─────────────────────────────────────────────── */
function _updateLogo(isLight) {
  /* [FIX 1] Usa /assets/img/ em vez de caminhos relativos */
  const l = document.getElementById('sidebar-logo');
  if (l) l.src = isLight ? '/assets/img/logo-escuro.png' : '/assets/img/logo.png';
  const icon = document.getElementById('theme-icon');
  if (!icon) return;
  icon.innerHTML = isLight
    ? '<svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
    : '<svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
}

function initTheme() {
  const s = localStorage.getItem('dashboard-theme') || '';
  document.documentElement.dataset.theme = s;
  _updateLogo(s === 'light');
}

/* [FIX 2] toggleTheme é definida UMA vez aqui; as páginas não precisam da versão inline */
function toggleTheme() {
  const h = document.documentElement;
  const isLight = h.dataset.theme === 'light';
  h.dataset.theme = isLight ? '' : 'light';
  localStorage.setItem('dashboard-theme', h.dataset.theme);
  _updateLogo(h.dataset.theme === 'light');
  if (window._areaState) renderMonth(window._areaState.current, window._areaState.all);
}

/* ─────────────────────────────────────────────
   Sidebar
─────────────────────────────────────────────── */
function buildSidebarNav(months) {
  const nav = document.getElementById('monthNav');
  if (!nav || !months.length) return;

  const byYear = {};
  months.forEach(m => { if (!byYear[m.year]) byYear[m.year] = []; byYear[m.year].push(m); });

  Object.keys(byYear).sort().forEach(y => {
    const section = document.createElement('div');
    section.className = 'sidebar-section year-header';
    section.innerHTML = `${y} <span class="chev">▼</span>`;
    nav.appendChild(section);

    const group = document.createElement('div');
    group.className = 'year-group';

    byYear[y].forEach(m => {
      const btn = document.createElement('button');
      btn.className = 'nav-tab';
      btn.dataset.key = m.key;
      btn.innerHTML = `<span class="nav-dot" style="background:${AREA_CONFIG.color}"></span>${_MO[m.mi]}`;
      btn.onclick = () => showMonth(m);
      group.appendChild(btn);
    });

    nav.appendChild(group);
    requestAnimationFrame(() => { group.style.maxHeight = group.scrollHeight + 'px'; });

    section.addEventListener('click', () => {
      const c = group.classList.toggle('coll');
      section.classList.toggle('coll', c);
      group.style.maxHeight = c ? '0' : group.scrollHeight + 'px';
    });
  });
}

/* ─────────────────────────────────────────────
   KPI rendering
─────────────────────────────────────────────── */
function renderKPIs(m) {
  const row = document.getElementById('kpi-row');
  if (!row) return;
  row.innerHTML = AREA_CONFIG.kpis.map(kpi => {
    const raw = m?.data?.[kpi.key];
    let val;
    if      (kpi.pct)      val = _fmtPct(raw);
    else if (kpi.decimal)  val = _fmtDec(raw);
    else if (kpi.currency) val = _fmtBRL(raw);
    else                   val = _fmt(raw);

    let deltaHtml = '';
    if (m?.prev && m.prev.data?.[kpi.key] != null && raw != null) {
      const curr = parseFloat(raw) || 0;
      const prev = parseFloat(m.prev.data[kpi.key]) || 0;
      if (prev > 0) {
        const pct    = ((curr - prev) / prev * 100).toFixed(1);
        const up     = curr >= prev;
        const isGood = kpi.invertDelta ? !up : up;
        deltaHtml = `<div class="kpi-sub" style="color:${isGood ? 'var(--green)' : '#ff8a8a'}">${up ? '▲' : '▼'} ${Math.abs(pct)}% vs mês anterior</div>`;
      }
    }

    return `<div class="kpi" style="--kpi-line:${kpi.color || AREA_CONFIG.color}">
      <div class="kpi-label">${kpi.label}</div>
      <div class="kpi-val">${val}</div>
      ${deltaHtml || `<div class="kpi-sub">${kpi.sub}</div>`}
    </div>`;
  }).join('');
}

/* ─────────────────────────────────────────────
   Chart rendering
─────────────────────────────────────────────── */
function renderCharts(months) {
  if (!months.length) return;
  const labels = months.map(m => _MS[m.mi] + '/' + String(m.year).slice(-2));

  AREA_CONFIG.charts.forEach(ch => {
    const el = document.getElementById(ch.id);
    if (!el) return;
    const vals  = months.map(m => parseFloat(m.data?.[ch.key]) || 0);
    const color = ch.color || AREA_CONFIG.color;
    const opts  = _baseOpts();

    _mkChart(ch.id, {
      type: ch.type || 'bar',
      data: {
        labels,
        datasets: [{
          data: vals,
          borderColor:          color,
          backgroundColor:      ch.type === 'line' ? color + '18' : color + 'cc',
          borderWidth:          ch.type === 'line' ? 2 : 0,
          borderRadius:         ch.type === 'line' ? 0 : 4,
          fill:                 ch.type === 'line',
          tension:              0.4,
          pointRadius:          ch.type === 'line' ? 3 : 0,
          pointHoverRadius:     ch.type === 'line' ? 5 : 0,
          pointBackgroundColor: color,
          spanGaps:             true,
        }]
      },
      options: {
        ...opts,
        scales: { ...opts.scales, y: { ...opts.scales.y, reverse: ch.reverseY || false } }
      }
    });
  });
}

/* ─────────────────────────────────────────────
   Monthly data table
─────────────────────────────────────────────── */
function renderTable(months) {
  const el = document.getElementById('data-table');
  if (!el || !months.length) return;

  const kpis = AREA_CONFIG.kpis;
  const th   = kpis.map(k => `<th class="num">${k.label}</th>`).join('');

  const rows = [...months].reverse().map(m => {
    const tds = kpis.map(kpi => {
      const raw = m.data?.[kpi.key];
      let val;
      if      (kpi.pct)      val = _fmtPct(raw);
      else if (kpi.decimal)  val = _fmtDec(raw);
      else if (kpi.currency) val = _fmtBRL(raw);
      else                   val = _fmt(raw);
      return `<td class="num">${val}</td>`;
    }).join('');
    const srcBadge = m.source
      ? `<span style="font-size:10px;opacity:.5;margin-left:6px;font-weight:400">${m.source === 'api' ? '⚡ api' : '📄 arquivo'}</span>`
      : '';
    return `<tr><td style="white-space:nowrap;color:var(--muted);font-weight:600">${_MO[m.mi]} ${m.year}${srcBadge}</td>${tds}</tr>`;
  }).join('');

  el.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Mês</th>${th}</tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

/* ─────────────────────────────────────────────
   Page header
─────────────────────────────────────────────── */
function updateHeader(m) {
  const eyebrow = document.getElementById('page-eyebrow');
  const sub     = document.getElementById('page-sub');
  if (eyebrow) eyebrow.textContent = `${AREA_CONFIG.name} · ${_MO[m.mi]} ${m.year}`;
  if (sub)     sub.textContent     = AREA_CONFIG.subtitle;
}

/* ─────────────────────────────────────────────
   Navigation
─────────────────────────────────────────────── */
function showMonth(m) {
  document.querySelectorAll('#monthNav .nav-tab').forEach(t => t.classList.remove('active'));
  const btn = document.querySelector(`[data-key="${m.key}"]`);
  if (btn) btn.classList.add('active');
  updateHeader(m);
  renderKPIs(m);
  window._areaState = { current: m, all: window._areaState?.all || [] };
}

function renderMonth(m, all) {
  updateHeader(m);
  renderKPIs(m);
  renderCharts(all);
  renderTable(all);
}

/* ─────────────────────────────────────────────
   Empty state — layout nunca quebra
─────────────────────────────────────────────── */
function showEmptyState() {
  const kpiRow = document.getElementById('kpi-row');
  if (kpiRow) kpiRow.innerHTML = AREA_CONFIG.kpis.map(kpi =>
    `<div class="kpi" style="--kpi-line:${kpi.color || AREA_CONFIG.color}">
      <div class="kpi-label">${kpi.label}</div>
      <div class="kpi-val">—</div>
      <div class="kpi-sub">${kpi.sub}</div>
    </div>`
  ).join('');
  const noData = document.getElementById('no-data-banner');
  if (noData) noData.style.display = 'block';
}

/* ─────────────────────────────────────────────
   [FIX 5] Fetch com fallback CSV → XLSX → null
─────────────────────────────────────────────── */
async function _fetchMonthFile(year, mo, csvFilename) {
  const base = `/assets/data/${year}/${mo}`;

  /* Tentativa 1: CSV */
  try {
    const r = await fetch(`${base}/${csvFilename}`);
    if (r.ok) {
      const text = await r.text();
      if (text && text.trim()) {
        const parsed = Papa.parse(text.trim(), { header: true, skipEmptyLines: true });
        if (parsed.data.length) return { rows: parsed.data, source: 'csv' };
      }
    }
  } catch (_) {}

  /* Tentativa 2: XLSX (mesmo nome, extensão trocada) */
  if (window.XLSX) {
    const xlsxName = csvFilename.replace(/\.csv$/i, '.xlsx');
    try {
      const r = await fetch(`${base}/${xlsxName}`);
      if (r.ok) {
        const ab = await r.arrayBuffer();
        const wb = XLSX.read(ab, { type: 'array' });
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
        if (rows.length) return { rows, source: 'xlsx' };
      }
    } catch (_) {}
  }

  return null; /* Sem dados → exibe — */
}

/* ─────────────────────────────────────────────
   [FIX 4+6+7] Init — try-catch, prioridade, fonte indicada
─────────────────────────────────────────────── */
(async function init() {
  /* [FIX 2] initTheme agora usa caminhos corretos */
  initTheme();

  /* Hamburger */
  const layout = document.getElementById('layout');
  const ham    = document.getElementById('hamburger');
  if (ham && layout) ham.addEventListener('click', () => {
    layout.classList.toggle('collapsed');
    setTimeout(() => window.dispatchEvent(new Event('resize')), 280);
  });

  /* [FIX 4] try-catch global — loading spinner nunca fica preso */
  try {
    /* Montar lista de candidatos por mês */
    const candidates = [];
    _YEARS.forEach(y => {
      for (let i = 1; i <= 12; i++) {
        const mo = String(i).padStart(2, '0');
        candidates.push({ year: y, mi: i - 1, key: `${y}-${mo}`, mo });
      }
    });

    /* [FIX 5+6] Busca com fallback CSV → XLSX → null */
    const fetches = candidates.map(c =>
      _fetchMonthFile(c.year, c.mo, AREA_CONFIG.file)
        .then(result => {
          if (!result) return null;
          return { ...c, data: result.rows[0], source: result.source };
        })
        .catch(() => null)
    );

    const raw = (await Promise.all(fetches)).filter(Boolean);
    raw.sort((a, b) => a.key.localeCompare(b.key));
    raw.forEach((m, i) => { m.prev = i > 0 ? raw[i - 1] : null; });

    /* Esconde loading, mostra app */
    document.getElementById('app-loading').style.display = 'none';
    document.getElementById('app').style.display         = 'block';

    if (!raw.length) {
      showEmptyState();
      return;
    }

    buildSidebarNav(raw);
    window._areaState = { current: raw[raw.length - 1], all: raw };
    renderMonth(raw[raw.length - 1], raw);

    /* Clique na sidebar */
    document.addEventListener('click', e => {
      const btn = e.target.closest('#monthNav .nav-tab');
      if (!btn) return;
      const key = btn.dataset.key;
      const m   = raw.find(m => m.key === key);
      if (!m) return;
      document.querySelectorAll('#monthNav .nav-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      window._areaState.current = m;
      renderMonth(m, raw);
    });

  } catch (err) {
    /* [FIX 4] Garante que a tela nunca fica no loading infinito */
    console.error('[area.js] Erro na inicialização:', err);
    const loading = document.getElementById('app-loading');
    if (loading) loading.innerHTML =
      `<div style="text-align:center;padding:40px">
        <div style="font-size:24px;margin-bottom:12px">⚠️</div>
        <div style="font-weight:700;margin-bottom:6px">erro ao carregar dados</div>
        <div style="font-size:13px;opacity:.6">verifique o console para detalhes</div>
      </div>`;
    document.getElementById('app-loading').style.display = 'block';
    const app = document.getElementById('app');
    if (app) app.style.display = 'none';
  }
})();
