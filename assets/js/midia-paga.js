/* ─────────────────────────────────────────────
   midia-paga.js — Mídia Paga Dashboard
   vml company · Temeron · 2026
   Lê midia-paga.csv de assets/data/YYYY/MM/
   Colunas: Campanha,Formato,Canal,Investimento,
            Impressoes,Alcance,Frequencia,TaxaCliques,Conversoes,CPA
─────────────────────────────────────────────── */

const _mpFmt    = n => (n == null || isNaN(Number(n))) ? '—' : Number(n).toLocaleString('pt-BR');
const _mpFmtPct = n => (n == null || isNaN(Number(n))) ? '—' : Number(n).toFixed(2) + '%';
const _mpFmtBRL = n => (n == null || isNaN(Number(n))) ? '—' : 'R$ ' + Number(n).toLocaleString('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:2 });
const _MO_MP    = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const _YEARS_MP = [2025, 2026];

const _mpCharts = {};
function _mpMkChart(id, cfg) {
  if (_mpCharts[id]) _mpCharts[id].destroy();
  const el = document.getElementById(id);
  if (el) _mpCharts[id] = new Chart(el, cfg);
}

function _mpTheme() {
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

function _mpHBar(id, labels, data, color, suffix, prefix) {
  const c = _mpTheme();
  _mpMkChart(id, {
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
          callbacks: { label: item => `  ${prefix || ''}${item.formattedValue}${suffix || ''}` }
        }
      },
      scales: {
        x: { grid:{ color:c.grid }, ticks:{ color:c.tick, font:{ size:10, family:"'Poppins',sans-serif" }, callback: v => `${prefix||''}${v>=1000?(v/1000).toFixed(1)+'k':v}${suffix||''}` } },
        y: { grid:{ display:false }, ticks:{ color:c.tick, font:{ size:11, family:"'Poppins',sans-serif" } } }
      }
    }
  });
}

function _mpParseCsv(rows) {
  return rows.filter(r => r['Campanha'] && String(r['Campanha']).trim()).map(r => ({
    campanha:    String(r['Campanha'] || '').trim(),
    formato:     String(r['Formato']  || '').trim(),
    canal:       String(r['Canal']    || '').trim(),
    investimento: parseFloat(String(r['Investimento'] || 0).replace(',','.')) || 0,
    impressoes:  parseInt(r['Impressoes'] || 0) || 0,
    alcance:     parseInt(r['Alcance']    || 0) || 0,
    frequencia:  parseFloat(r['Frequencia'] || 0) || 0,
    taxaCliques: parseFloat(String(r['TaxaCliques'] || 0).replace(',','.')) || 0,
    conversoes:  parseInt(r['Conversoes'] || 0) || 0,
    cpa:         parseFloat(String(r['CPA'] || 0).replace(',','.')) || 0,
  })).filter(r => r.investimento > 0);
}

async function _mpFetchMonth(year, mo) {
  try {
    const r = await fetch(`/assets/data/${year}/${mo}/midia-paga.csv`);
    if (r.ok) {
      const text = await r.text();
      if (text && text.trim()) {
        const parsed = Papa.parse(text.trim(), { header: true, skipEmptyLines: true });
        const rows = _mpParseCsv(parsed.data);
        if (rows.length) return rows;
      }
    }
  } catch (_) {}
  return null;
}

function _mpCanaisColor(canal) {
  const m = { 'intermodal':'#391bce', 'manager':'#a038f2', 'tributário':'#a038f2', 'auditoria':'#c9b8f8', 'ebook':'#6b5fd4' };
  const low = canal.toLowerCase();
  for (const [k, v] of Object.entries(m)) if (low.includes(k)) return v;
  return '#391bce';
}

function _mpRender(rows, year, mi) {
  const totalInvest   = rows.reduce((s,r) => s + r.investimento, 0);
  const totalConv     = rows.reduce((s,r) => s + r.conversoes, 0);
  const totalImp      = rows.reduce((s,r) => s + r.impressoes, 0);
  const avgCPA        = totalConv > 0 ? totalInvest / totalConv : 0;
  const avgCTR        = rows.length ? rows.reduce((s,r) => s + r.taxaCliques, 0) / rows.length : 0;

  /* Header */
  const ey = document.getElementById('page-eyebrow');
  if (ey) ey.textContent = `mídia paga · ${_MO_MP[mi]} ${year}`;

  /* KPIs */
  const kpiRow = document.getElementById('kpi-row');
  if (kpiRow) kpiRow.innerHTML = `
    <div class="kpi" style="--kpi-line:#391bce">
      <div class="kpi-label">investimento total</div>
      <div class="kpi-val">${_mpFmtBRL(totalInvest)}</div>
      <div class="kpi-sub">${rows.length} campanhas</div>
    </div>
    <div class="kpi" style="--kpi-line:#a038f2">
      <div class="kpi-label">impressões</div>
      <div class="kpi-val">${totalImp >= 1000 ? (totalImp/1000).toFixed(1)+'k' : _mpFmt(totalImp)}</div>
      <div class="kpi-sub">exibições totais</div>
    </div>
    <div class="kpi" style="--kpi-line:#a2e259">
      <div class="kpi-label">conversões</div>
      <div class="kpi-val">${_mpFmt(totalConv)}</div>
      <div class="kpi-sub">leads gerados</div>
    </div>
    <div class="kpi" style="--kpi-line:#c9b8f8">
      <div class="kpi-label">cpa médio</div>
      <div class="kpi-val">${_mpFmtBRL(avgCPA)}</div>
      <div class="kpi-sub">custo por aquisição</div>
    </div>
  `;

  /* Resumo card */
  const rc = document.getElementById('resumo-card');
  if (rc) {
    const topConv = [...rows].sort((a,b) => b.conversoes - a.conversoes)[0];
    const topCPA  = [...rows].filter(r=>r.cpa>0).sort((a,b) => a.cpa - b.cpa)[0];
    rc.innerHTML = `
      <div class="card-header"><div class="card-title">resumo do período</div></div>
      <div class="summary-row"><span class="summary-label">investimento total</span><span class="summary-value">${_mpFmtBRL(totalInvest)}</span></div>
      <div class="summary-row"><span class="summary-label">campanhas ativas</span><span class="summary-value">${rows.length}</span></div>
      <div class="summary-row"><span class="summary-label">total de conversões</span><span class="summary-value">${_mpFmt(totalConv)}</span></div>
      <div class="summary-row"><span class="summary-label">cpa médio</span><span class="summary-value">${_mpFmtBRL(avgCPA)}</span></div>
      <div class="summary-row"><span class="summary-label">ctr médio</span><span class="summary-value">${_mpFmtPct(avgCTR)}</span></div>
      ${topConv ? `<div class="summary-row"><span class="summary-label">top conversão</span><span class="summary-value summary-value--accent">${topConv.campanha.substring(0,25)}…</span></div>` : ''}
      ${topCPA  ? `<div class="summary-row"><span class="summary-label">menor cpa</span><span class="summary-value summary-value--accent">${_mpFmtBRL(topCPA.cpa)}</span></div>` : ''}
    `;
  }

  /* Chart: conversões por campanha */
  const byConv = [...rows].sort((a,b) => b.conversoes - a.conversoes);
  _mpHBar('chart-conversoes',
    byConv.map(r => r.campanha.length > 28 ? r.campanha.substring(0,28)+'…' : r.campanha),
    byConv.map(r => r.conversoes),
    '#a2e259', '', ''
  );

  /* Chart: investimento por campanha */
  const byInvest = [...rows].sort((a,b) => b.investimento - a.investimento);
  _mpHBar('chart-investimento',
    byInvest.map(r => r.campanha.length > 28 ? r.campanha.substring(0,28)+'…' : r.campanha),
    byInvest.map(r => r.investimento),
    '#391bce', '', 'R$ '
  );

  /* Chart: CTR por campanha */
  const byCTR = [...rows].sort((a,b) => b.taxaCliques - a.taxaCliques);
  _mpHBar('chart-ctr',
    byCTR.map(r => r.campanha.length > 28 ? r.campanha.substring(0,28)+'…' : r.campanha),
    byCTR.map(r => r.taxaCliques),
    '#c9b8f8', '%', ''
  );

  /* Table */
  const tbl = document.getElementById('data-table');
  if (!tbl) return;
  const sorted = [...rows].sort((a,b) => b.conversoes - a.conversoes);
  tbl.innerHTML = `
    <div class="card-header"><div class="card-title">auditoria de campanhas</div><div class="card-sub">ordenado por conversões</div></div>
    <div class="table-wrap"><table>
      <thead><tr>
        <th>campanha</th>
        <th>canal</th>
        <th class="num">investimento</th>
        <th class="num">impressões</th>
        <th class="num">ctr</th>
        <th class="num">conversões</th>
        <th class="num">cpa</th>
      </tr></thead>
      <tbody>${sorted.map(r => `<tr>
        <td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.campanha}</td>
        <td><span style="font-size:11px;padding:2px 8px;border-radius:20px;background:${_mpCanaisColor(r.canal)}33;color:${_mpCanaisColor(r.canal)};font-weight:700;white-space:nowrap">${r.canal}</span></td>
        <td class="num">${_mpFmtBRL(r.investimento)}</td>
        <td class="num" style="color:var(--muted)">${r.impressoes >= 1000 ? (r.impressoes/1000).toFixed(1)+'k' : _mpFmt(r.impressoes)}</td>
        <td class="num">${_mpFmtPct(r.taxaCliques)}</td>
        <td class="num" style="color:var(--green);font-weight:700">${_mpFmt(r.conversoes)}</td>
        <td class="num" style="color:${r.cpa < avgCPA ? 'var(--green)' : 'var(--muted)'}">${_mpFmtBRL(r.cpa)}</td>
      </tr>`).join('')}</tbody>
    </table></div>
  `;
}

function _mpBuildNav(months) {
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
      btn.innerHTML = `<span class="nav-dot" style="background:#c9b8f8"></span>${_MO_MP[m.mi]}`;
      btn.onclick = () => {
        document.querySelectorAll('#monthNav .nav-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        _mpRender(m.rows, m.year, m.mi);
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
    await Promise.all(_YEARS_MP.flatMap(y =>
      Array.from({ length: 12 }, (_, i) => i + 1).map(async mn => {
        const mo = String(mn).padStart(2, '0');
        const rows = await _mpFetchMonth(y, mo);
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

    _mpBuildNav(months);
    const latest = months[months.length - 1];
    document.querySelectorAll(`[data-key="${latest.key}"]`).forEach(b => b.classList.add('active'));
    _mpRender(latest.rows, latest.year, latest.mi);

  } catch (err) {
    console.error('[midia-paga.js]', err);
    document.getElementById('app-loading').innerHTML =
      `<div style="text-align:center;padding:40px"><div style="font-size:24px">⚠️</div><div style="font-weight:700;margin-top:12px">erro ao carregar dados</div></div>`;
  }
})();
