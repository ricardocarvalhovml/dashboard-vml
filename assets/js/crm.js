/* ─────────────────────────────────────────────
   crm.js — Email Marketing Dashboard
   vml company · Temeron · 2026
   Lê crm.xlsx de assets/data/YYYY/MM/
   Colunas: Data de envio, Assunto, Leads selecionados,
            Taxa de entrega, Taxa de abertura, Taxa de clique (CTR)
─────────────────────────────────────────────── */

/* ── helpers locais ── */
const _cFmt    = n => (n == null || isNaN(Number(n))) ? '—' : Number(n).toLocaleString('pt-BR');
const _cFmtPct = n => (n == null || isNaN(Number(n))) ? '—' : Number(n).toFixed(1) + '%';
const _MO_CRM  = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const _MS_CRM  = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const _YEARS_CRM = [2025, 2026];

const _cCharts = {};
function _cMkChart(id, cfg) {
  if (_cCharts[id]) _cCharts[id].destroy();
  const el = document.getElementById(id);
  if (el) _cCharts[id] = new Chart(el, cfg);
}

function _cTheme() {
  const l = document.documentElement.dataset.theme === 'light';
  return {
    bg:     l ? '#ffffff' : '#0d1030',
    border: l ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.1)',
    title:  l ? '#12155a' : '#efecef',
    body:   l ? '#5a5070' : '#8b86a8',
    grid:   l ? 'rgba(18,21,90,.06)' : 'rgba(255,255,255,.04)',
    tick:   l ? '#5a5070' : '#8b86a8',
  };
}

function _cBaseOpts(extra) {
  const c = _cTheme();
  return {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: c.bg, borderColor: c.border, borderWidth: 1,
        titleColor: c.title, bodyColor: c.body,
        titleFont: { family:"'Poppins',sans-serif", weight:'700' },
        bodyFont:  { family:"'Poppins',sans-serif", size: 12 }
      }
    },
    scales: {
      x: { grid:{ display:false }, ticks:{ color:c.tick, font:{ size:10, family:"'Poppins',sans-serif" }, callback: v => extra?.xPct ? v+'%' : v } },
      y: { grid:{ color:c.grid  }, ticks:{ color:c.tick, font:{ size:10, family:"'Poppins',sans-serif" } } }
    },
    ...extra
  };
}

/* Horizontal bar chart */
function _cHBar(id, labels, data, color, suffix) {
  const c = _cTheme();
  _cMkChart(id, {
    type: 'bar',
    data: { labels, datasets: [{ data, backgroundColor: color + 'cc', borderRadius: 4, borderWidth: 0 }] },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: c.bg, borderColor: c.border, borderWidth: 1,
          titleColor: c.title, bodyColor: c.body,
          titleFont: { family:"'Poppins',sans-serif", weight:'700' },
          bodyFont:  { family:"'Poppins',sans-serif", size:12 },
          callbacks: { label: item => `  ${item.formattedValue}${suffix}` }
        }
      },
      scales: {
        x: { grid:{ color:c.grid }, ticks:{ color:c.tick, font:{ size:10, family:"'Poppins',sans-serif" }, callback: v => v+suffix } },
        y: { grid:{ display:false }, ticks:{ color:c.tick, font:{ size:11, family:"'Poppins',sans-serif" } } }
      }
    }
  });
}

/* ── Parse xlsx rows ── */
function _cParseRows(rows) {
  return rows.filter(r => {
    const d = String(r['Data de envio (dd/mm/aaaa)'] || '').trim();
    return d.match(/^\d{4}[-/]\d{2}[-/]\d{2}/) || d.match(/^(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)/i);
  }).map(r => {
    const entrega  = parseFloat(String(r['Taxa de entrega']  || 0)) || 0;
    const abertura = parseFloat(String(r['Taxa de abertura'] || 0)) || 0;
    const ctr      = parseFloat(String(r['Taxa de clique (CTR)'] || 0)) || 0;
    return {
      data:     String(r['Data de envio (dd/mm/aaaa)'] || '').substring(0,10),
      assunto:  String(r['Assunto'] || '').trim() || '—',
      leads:    parseFloat(r['Leads selecionados']) || 0,
      entrega:  entrega > 2 ? entrega : entrega * 100,
      abertura: abertura > 2 ? abertura : abertura * 100,
      ctr:      ctr > 2 ? ctr : ctr * 100,
    };
  }).filter(r => r.leads > 0 || r.abertura > 0);
}

/* ── Fetch xlsx for a month ── */
async function _cFetchMonth(year, mo) {
  try {
    const r = await fetch(`/assets/data/${year}/${mo}/crm.xlsx`);
    if (r.ok) {
      const ab = await r.arrayBuffer();
      const wb = XLSX.read(ab, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      const parsed = _cParseRows(rows);
      if (parsed.length) return parsed;
    }
  } catch (_) {}
  return null;
}

/* ── Render ── */
function _cRender(rows, year, mi) {
  const nC = rows.length;
  const totalLeads   = rows.reduce((s, r) => s + r.leads, 0);
  const avgEntrega   = nC ? rows.reduce((s, r) => s + r.entrega, 0) / nC : 0;
  const avgAbertura  = nC ? rows.reduce((s, r) => s + r.abertura, 0) / nC : 0;
  const avgCTR       = nC ? rows.reduce((s, r) => s + r.ctr, 0) / nC : 0;

  /* Header */
  const ey = document.getElementById('page-eyebrow');
  if (ey) ey.textContent = `email marketing · ${_MO_CRM[mi]} ${year}`;

  /* KPIs */
  const kpiRow = document.getElementById('kpi-row');
  if (kpiRow) kpiRow.innerHTML = `
    <div class="kpi" style="--kpi-line:#391bce">
      <div class="kpi-label">leads alcançados</div>
      <div class="kpi-val">${_cFmt(totalLeads)}</div>
      <div class="kpi-sub">${nC} campanha${nC !== 1 ? 's' : ''}</div>
    </div>
    <div class="kpi" style="--kpi-line:#a038f2">
      <div class="kpi-label">taxa de entrega</div>
      <div class="kpi-val">${_cFmtPct(avgEntrega)}</div>
      <div class="kpi-sub">média do período</div>
    </div>
    <div class="kpi" style="--kpi-line:#c9b8f8">
      <div class="kpi-label">taxa de abertura</div>
      <div class="kpi-val">${_cFmtPct(avgAbertura)}</div>
      <div class="kpi-sub">média do período</div>
    </div>
    <div class="kpi" style="--kpi-line:#a2e259">
      <div class="kpi-label">ctr médio</div>
      <div class="kpi-val">${_cFmtPct(avgCTR)}</div>
      <div class="kpi-sub">taxa de clique</div>
    </div>
  `;

  /* Resumo card */
  const rc = document.getElementById('resumo-card');
  if (rc) {
    const topAb = [...rows].sort((a,b) => b.abertura - a.abertura)[0];
    const topCtr = [...rows].sort((a,b) => b.ctr - a.ctr)[0];
    const topLeads = [...rows].sort((a,b) => b.leads - a.leads)[0];
    rc.innerHTML = `
      <div class="card-header"><div class="card-title">resumo do período</div></div>
      <div class="summary-row"><span class="summary-label">total de leads</span><span class="summary-value">${_cFmt(totalLeads)}</span></div>
      <div class="summary-row"><span class="summary-label">campanhas enviadas</span><span class="summary-value">${nC}</span></div>
      <div class="summary-row"><span class="summary-label">entrega média</span><span class="summary-value">${_cFmtPct(avgEntrega)}</span></div>
      <div class="summary-row"><span class="summary-label">abertura média</span><span class="summary-value">${_cFmtPct(avgAbertura)}</span></div>
      <div class="summary-row"><span class="summary-label">ctr médio</span><span class="summary-value">${_cFmtPct(avgCTR)}</span></div>
      ${topAb ? `<div class="summary-row"><span class="summary-label">maior abertura</span><span class="summary-value summary-value--accent">${_cFmtPct(topAb.abertura)}</span></div>` : ''}
      ${topCtr ? `<div class="summary-row"><span class="summary-label">maior ctr</span><span class="summary-value summary-value--accent">${_cFmtPct(topCtr.ctr)}</span></div>` : ''}
    `;
  }

  /* Chart: top 8 abertura */
  const byAb = [...rows].sort((a,b) => b.abertura - a.abertura).slice(0, 8);
  _cHBar('chart-abertura',
    byAb.map(r => r.assunto.length > 40 ? r.assunto.substring(0,40)+'…' : r.assunto),
    byAb.map(r => r.abertura),
    '#391bce', '%'
  );

  /* Chart: top 8 leads */
  const byLd = [...rows].sort((a,b) => b.leads - a.leads).slice(0, 8);
  _cHBar('chart-leads',
    byLd.map(r => r.assunto.length > 40 ? r.assunto.substring(0,40)+'…' : r.assunto),
    byLd.map(r => r.leads),
    '#a038f2', ''
  );

  /* Chart: CTR ranking */
  const byCtr = [...rows].filter(r => r.ctr > 0).sort((a,b) => b.ctr - a.ctr).slice(0, 8);
  if (byCtr.length) {
    _cHBar('chart-ctr',
      byCtr.map(r => r.assunto.length > 40 ? r.assunto.substring(0,40)+'…' : r.assunto),
      byCtr.map(r => r.ctr),
      '#a2e259', '%'
    );
  }

  /* Table */
  const tbl = document.getElementById('data-table');
  if (!tbl) return;
  const sorted = [...rows].sort((a,b) => b.abertura - a.abertura);
  tbl.innerHTML = `
    <div class="card-header"><div class="card-title">auditoria de campanhas</div><div class="card-sub">ordenado por abertura</div></div>
    <div class="table-wrap"><table>
      <thead><tr>
        <th>assunto</th>
        <th class="num">data</th>
        <th class="num">leads</th>
        <th class="num">entrega</th>
        <th class="num">abertura</th>
        <th class="num">ctr</th>
      </tr></thead>
      <tbody>${sorted.map(r => `<tr>
        <td style="max-width:340px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.assunto}</td>
        <td class="num" style="color:var(--muted);white-space:nowrap">${r.data}</td>
        <td class="num">${_cFmt(r.leads)}</td>
        <td class="num">${_cFmtPct(r.entrega)}</td>
        <td class="num" style="color:var(--blue);font-weight:700">${_cFmtPct(r.abertura)}</td>
        <td class="num" style="color:${r.ctr > 0 ? 'var(--green)' : 'var(--muted)'}">${_cFmtPct(r.ctr)}</td>
      </tr>`).join('')}</tbody>
    </table></div>
  `;
}

/* ── buildSidebarNav local ── */
function _cBuildNav(months) {
  const nav = document.getElementById('monthNav');
  if (!nav || !months.length) return;
  const byYear = {};
  months.forEach(m => { if (!byYear[m.year]) byYear[m.year] = []; byYear[m.year].push(m); });
  Object.keys(byYear).sort().forEach(y => {
    const sec = document.createElement('div');
    sec.className = 'sidebar-section year-header';
    sec.style.cssText = 'cursor:pointer;display:flex;align-items:center;justify-content:space-between';
    sec.innerHTML = `<span>${y}</span><span class="chev" style="font-size:8px;opacity:.5;transition:transform .2s">▾</span>`;
    nav.appendChild(sec);
    const grp = document.createElement('div');
    grp.className = 'year-group';
    byYear[y].forEach(m => {
      const btn = document.createElement('button');
      btn.className = 'nav-tab';
      btn.dataset.key = m.key;
      btn.innerHTML = `<span class="nav-dot" style="background:#391bce"></span>${_MO_CRM[m.mi]}`;
      btn.onclick = () => {
        document.querySelectorAll('#monthNav .nav-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        _cRender(m.rows, m.year, m.mi);
      };
      grp.appendChild(btn);
    });
    nav.appendChild(grp);
    requestAnimationFrame(() => { grp.style.maxHeight = grp.scrollHeight + 'px'; });
    sec.addEventListener('click', () => {
      const c = grp.classList.toggle('coll');
      grp.style.maxHeight = c ? '0' : grp.scrollHeight + 'px';
      const chev = sec.querySelector('.chev');
      if (chev) chev.style.transform = c ? 'rotate(-90deg)' : '';
    });
  });
}

/* ── Init ── */
(async function() {
  initTheme();
  const layout = document.getElementById('layout');
  const ham = document.getElementById('hamburger');
  if (ham && layout) ham.addEventListener('click', () => {
    layout.classList.toggle('collapsed');
    setTimeout(() => window.dispatchEvent(new Event('resize')), 280);
  });

  try {
    const months = [];
    await Promise.all(_YEARS_CRM.flatMap(y =>
      Array.from({ length: 12 }, (_, i) => i + 1).map(async mn => {
        const mo = String(mn).padStart(2, '0');
        const rows = await _cFetchMonth(y, mo);
        if (rows) months.push({ year: y, mi: mn - 1, mo, key: `${y}-${mo}`, rows });
      })
    ));
    months.sort((a, b) => a.key.localeCompare(b.key));

    document.getElementById('app-loading').style.display = 'none';
    document.getElementById('app').style.display = 'block';

    if (!months.length) {
      document.getElementById('no-data-banner').style.display = 'block';
      return;
    }

    _cBuildNav(months);
    const latest = months[months.length - 1];
    document.querySelectorAll(`[data-key="${latest.key}"]`).forEach(b => b.classList.add('active'));
    _cRender(latest.rows, latest.year, latest.mi);

  } catch (err) {
    console.error('[crm.js]', err);
    document.getElementById('app-loading').innerHTML =
      `<div style="text-align:center;padding:40px"><div style="font-size:24px">⚠️</div><div style="font-weight:700;margin-top:12px">erro ao carregar dados</div></div>`;
  }
})();
