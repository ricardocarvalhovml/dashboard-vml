/* ─────────────────────────────────────────────
   crm.js — email marketing · rd station
   vml company · 2026
─────────────────────────────────────────────── */

window.AREA_COLOR = '#391bce';

/* ── Parser ───────────────────────────────────── */
function parseCRM(rows) {
  if (!rows || !rows.length) return null;

  const col = 'Data de envio (dd/mm/aaaa)';
  let currentSegmento = 'geral';
  const campaigns = [];

  for (const row of rows) {
    const dateVal = String(row[col] || '').trim();

    // Linha vazia
    if (!dateVal || dateVal === '') continue;

    // Linha de segmento: texto sem data (ex: "LEADS FRIOS", "BASE RD", "CLIENTES VML")
    const isDate = dateVal.match(/^\d{4}-\d{2}-\d{2}/) || dateVal.match(/^\d{2}\/\d{2}\/\d{4}/);
    if (!isDate) {
      if (dateVal.length < 40 && isNaN(parseFloat(dateVal))) {
        currentSegmento = dateVal.toLowerCase();
      }
      continue;
    }

    const leads      = _pn(row['Leads selecionados']);
    const rawEntrega = _pn(row['Taxa de entrega']);
    const rawAbertura= _pn(row['Taxa de abertura']);
    const rawClique  = _pn(row['Taxa de clique (CTR)']);

    // Linha de sumário de seção: leads=0 e taxas estão no formato fração (0.90)
    if (leads === 0 && rawEntrega < 2) continue;

    campaigns.push({
      data:         dateVal,
      nome:         String(row['Nome do email']||'').trim(),
      assunto:      String(row['Assunto']||'').trim(),
      leads,
      taxaEntrega:  _normRate(rawEntrega),
      taxaAbertura: _normRate(rawAbertura),
      taxaClique:   _normRate(rawClique),
      segmento:     currentSegmento,
    });
  }

  if (!campaigns.length) return null;

  const sum     = k => campaigns.reduce((s,c) => s + (c[k]||0), 0);
  const mean    = k => campaigns.length ? sum(k)/campaigns.length : 0;

  return {
    campaigns,
    nCampanhas:       campaigns.length,
    totalLeads:       sum('leads'),
    mediaTaxaEntrega: mean('taxaEntrega'),
    mediaTaxaAbertura:mean('taxaAbertura'),
    mediaTaxaClique:  mean('taxaClique'),
    segmentos:        [...new Set(campaigns.map(c=>c.segmento))],
  };
}

/* ── Render ───────────────────────────────────── */
function renderKPIs(data) {
  const row = document.getElementById('kpi-row');
  if (!row || !data) return;

  row.innerHTML = `
    <div class="kpi" style="--kpi-line:#391bce">
      <div class="kpi-label">campanhas enviadas</div>
      <div class="kpi-val">${_fmt(data.nCampanhas)}</div>
      <div class="kpi-sub">${data.segmentos.map(s=>`<span style="opacity:.7">${s}</span>`).join(' · ')}</div>
    </div>
    <div class="kpi" style="--kpi-line:#a038f2">
      <div class="kpi-label">leads alcançados</div>
      <div class="kpi-val">${_fmtK(data.totalLeads)}</div>
      <div class="kpi-sub">total de envios do período</div>
    </div>
    <div class="kpi" style="--kpi-line:#c9b8f8">
      <div class="kpi-label">taxa de entrega</div>
      <div class="kpi-val">${_fmtPct(data.mediaTaxaEntrega)}</div>
      <div class="kpi-sub">média das campanhas</div>
    </div>
    <div class="kpi" style="--kpi-line:#a2e259">
      <div class="kpi-label">taxa de abertura</div>
      <div class="kpi-val">${_fmtPct(data.mediaTaxaAbertura)}</div>
      <div class="kpi-sub">média das campanhas</div>
    </div>
    <div class="kpi" style="--kpi-line:#6b5fd4">
      <div class="kpi-label">taxa de clique (ctr)</div>
      <div class="kpi-val">${_fmtPct(data.mediaTaxaClique)}</div>
      <div class="kpi-sub">média das campanhas</div>
    </div>
  `;
}

function renderCharts(data) {
  if (!data || !data.campaigns.length) return;

  const all = data.campaigns;

  /* Top 8 por abertura */
  const topAbertura = [...all].sort((a,b) => b.taxaAbertura - a.taxaAbertura).slice(0, 8);
  _mkChart('chart-abertura', {
    type: 'bar',
    data: {
      labels: topAbertura.map(c => {
        const s = c.assunto || c.nome;
        return s.length > 32 ? s.slice(0,32)+'…' : s;
      }),
      datasets:[{
        data: topAbertura.map(c => c.taxaAbertura),
        backgroundColor: topAbertura.map(c => {
          if (c.taxaAbertura >= 20) return '#a2e259cc';
          if (c.taxaAbertura >= 14) return '#a038f2cc';
          return '#391bcecc';
        }),
        borderRadius: 4, borderWidth: 0,
      }]
    },
    options: {
      ..._hbarOpts(),
      plugins: {
        ..._hbarOpts().plugins,
        tooltip: {
          ..._hbarOpts().plugins.tooltip,
          callbacks: {
            title: items => topAbertura[items[0].dataIndex].assunto || topAbertura[items[0].dataIndex].nome,
            label: item => `  abertura: ${_fmtPct(item.raw)}`
          }
        }
      }
    }
  });

  /* Leads por campanha */
  const topLeads = [...all].sort((a,b) => b.leads - a.leads).slice(0, 8);
  _mkChart('chart-leads', {
    type: 'bar',
    data: {
      labels: topLeads.map(c => {
        const s = c.assunto || c.nome;
        return s.length > 32 ? s.slice(0,32)+'…' : s;
      }),
      datasets:[{
        data: topLeads.map(c => c.leads),
        backgroundColor: '#391bcecc',
        borderRadius: 4, borderWidth: 0,
      }]
    },
    options: {
      ..._hbarOpts(),
      plugins: {
        ..._hbarOpts().plugins,
        tooltip: {
          ..._hbarOpts().plugins.tooltip,
          callbacks: {
            title: items => topLeads[items[0].dataIndex].assunto || topLeads[items[0].dataIndex].nome,
            label: item => `  ${_fmt(item.raw)} leads`
          }
        }
      }
    }
  });

  /* Distribuição por segmento */
  const segCount = {};
  all.forEach(c => { segCount[c.segmento] = (segCount[c.segmento]||0) + 1; });
  _mkChart('chart-segmentos', {
    type: 'doughnut',
    data: {
      labels: Object.keys(segCount),
      datasets:[{
        data: Object.values(segCount),
        backgroundColor: ['#391bce','#a038f2','#6b5fd4','#c9b8f8','#a2e259'],
        borderWidth: 0,
      }]
    },
    options: _donutOpts()
  });
}

function renderTable(data) {
  const el = document.getElementById('data-table');
  if (!el || !data) return;

  const bySegmento = {};
  data.campaigns.forEach(c => {
    if (!bySegmento[c.segmento]) bySegmento[c.segmento] = [];
    bySegmento[c.segmento].push(c);
  });

  let html = '<div class="card-header"><div class="card-title">campanhas enviadas no período</div></div><div class="table-wrap"><table>';
  html += '<thead><tr><th>segmento</th><th>assunto</th><th class="num">leads</th><th class="num">entrega</th><th class="num">abertura</th><th class="num">clique</th></tr></thead><tbody>';

  Object.entries(bySegmento).forEach(([seg, items]) => {
    items.sort((a,b) => new Date(b.data) - new Date(a.data)).forEach(c => {
      const abClass = c.taxaAbertura >= 20 ? 'color:var(--green)' : c.taxaAbertura >= 14 ? '' : 'color:var(--muted)';
      html += `<tr>
        <td><span class="segment-lbl">${seg}</span></td>
        <td style="max-width:280px;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.assunto||c.nome}</td>
        <td class="num">${_fmtK(c.leads)}</td>
        <td class="num">${_fmtPct(c.taxaEntrega)}</td>
        <td class="num" style="${abClass}"><strong>${_fmtPct(c.taxaAbertura)}</strong></td>
        <td class="num">${_fmtPct(c.taxaClique)}</td>
      </tr>`;
    });
  });

  html += '</tbody></table></div>';
  el.innerHTML = html;
}

/* ── Init ─────────────────────────────────────── */
(async function init() {
  initTheme();
  initHamburger();

  let currentData = null;

  window._onThemeChange = () => { if (currentData) renderCharts(currentData); };

  try {
    const months = await discoverMonths('crm');

    if (!months.length) {
      showApp();
      document.getElementById('no-data-banner').style.display = 'block';
      return;
    }

    const latest = months[months.length - 1];
    buildSidebarNav(months, latest.key, loadAndRender);
    await loadAndRender(latest);

  } catch (err) {
    console.error('[crm]', err);
    showError('erro ao carregar dados');
  }

  async function loadAndRender(m) {
    const eyebrow = document.getElementById('page-eyebrow');
    if (eyebrow) eyebrow.textContent = `email marketing · ${_MO[m.mi]} ${m.year}`;

    const rows = await loadFile(m.year, m.mo, 'crm', {preferXLSX: true});
    currentData = rows ? parseCRM(rows) : null;

    showApp();
    document.getElementById('no-data-banner').style.display = currentData ? 'none' : 'block';

    if (currentData) {
      renderKPIs(currentData);
      renderCharts(currentData);
      renderTable(currentData);
    }
  }
})();
