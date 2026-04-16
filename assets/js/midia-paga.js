/* ─────────────────────────────────────────────
   midia-paga.js — linkedin · meta ads · spotify
   vml company · 2026
─────────────────────────────────────────────── */

window.AREA_COLOR = '#c9b8f8';

/* ── Parsers ──────────────────────────────────── */
function parseLinkedIn(rows) {
  if (!rows || !rows.length) return null;
  // Linha de total: Canal é vazio e Período = 'TOTAL'
  const totalRow = rows.find(r =>
    String(r['Período']||'').trim().toUpperCase() === 'TOTAL' ||
    (!r['Canal'] || !String(r['Canal']).trim())
  );
  if (!totalRow) return null;

  const campanhas = rows
    .filter(r => r['Canal'] && String(r['Canal']).trim())
    .map(r => ({
      nome:        String(r['Campanha']||''),
      tipo:        String(r['Tipo']||''),
      status:      String(r['Status']||''),
      investimento: _pn(r['Investimento (R$)']),
      impressoes:  _pn(r['Impressões']),
      cliques:     _pn(r['Cliques']),
      ctr:         parseFloat(String(r['CTR (%)']||'0').replace('%','').replace(',','.')) || 0,
      cpc:         _pn(r['CPC (R$)']),
      leads:       _pn(r['Leads (Form)']),
    }));

  return {
    campanhas,
    investimento: _pn(totalRow['Investimento (R$)']),
    impressoes:   _pn(totalRow['Impressões']),
    cliques:      _pn(totalRow['Cliques']),
    ctr:          parseFloat(String(totalRow['CTR (%)']||'0').replace('%','').replace(',','.')) || 0,
    cpc:          _pn(totalRow['CPC (R$)']),
    leads:        _pn(totalRow['Leads (Form)']),
  };
}

function parseMeta(rows) {
  if (!rows || !rows.length) return null;
  const dataRows = rows.filter(r => r['Canal'] && String(r['Canal']).trim() && !isNaN(_pn(r['Investimento (R$)'])));

  if (!dataRows.length) return null;

  const campanhas = dataRows.map(r => ({
    nome:        String(r['Campanha']||''),
    status:      String(r['Status']||''),
    investimento: _pn(r['Investimento (R$)']),
    impressoes:  _pn(r['Impressões']),
    alcance:     _pn(r['Alcance']),
    frequencia:  _pn(r['Frequência']),
    cliquesLink: _pn(r['Cliques no Link']),
    ctr:         parseFloat(String(r['CTR Link (%)']||'0').replace('%','').replace(',','.')) || 0,
    cpcLink:     _pn(r['CPC Link (R$)']),
    leads:       _pn(r['Leads']),
    cpl:         _pn(r['CPL (R$)']),
  }));

  const sum = k => campanhas.reduce((s,c) => s + (c[k]||0), 0);
  const investTotal = sum('investimento');
  const leadsTotal  = sum('leads');

  return {
    campanhas,
    investimento: investTotal,
    impressoes:   sum('impressoes'),
    alcance:      sum('alcance'),
    cliquesLink:  sum('cliquesLink'),
    leads:        leadsTotal,
    cpl:          leadsTotal > 0 ? investTotal / leadsTotal : 0,
  };
}

function parseSpotify(rows) {
  if (!rows || !rows.length) return null;

  const dataRows = rows.filter(r => {
    const gasto = parseFloat(String(r['Gasto']||'0').replace(',','.')) || 0;
    return gasto > 0;
  });

  const anuncios = {};
  dataRows.forEach(r => {
    const nome = String(r['Nome do anúncio']||r['Nome da campanha']||'');
    if (!anuncios[nome]) anuncios[nome] = {nome, gasto:0, impressoes:0, alcance:0, cliques:0};
    anuncios[nome].gasto     += parseFloat(String(r['Gasto']||'0').replace(',','.')) || 0;
    anuncios[nome].impressoes += parseFloat(String(r['Impressões com streams']||'0').replace(',','.')) || 0;
    anuncios[nome].alcance    += parseFloat(String(r['Alcance']||'0').replace(',','.')) || 0;
    anuncios[nome].cliques    += parseFloat(String(r['Cliques']||'0').replace(',','.')) || 0;
  });

  const lista = Object.values(anuncios);
  const sum = k => lista.reduce((s,a) => s + (a[k]||0), 0);

  const gastoTotal = sum('gasto');
  const impressoesTotal = sum('impressoes');

  return {
    anuncios: lista,
    gasto:      gastoTotal,
    impressoes: impressoesTotal,
    alcance:    sum('alcance'),
    cliques:    sum('cliques'),
    cpm:        impressoesTotal > 0 ? (gastoTotal / impressoesTotal * 1000) : 0,
  };
}

/* ── Render ───────────────────────────────────── */
function renderKPIs(li, meta, sp) {
  const row = document.getElementById('kpi-row');
  if (!row) return;

  const investTotal = (li?.investimento||0) + (meta?.investimento||0) + (sp?.gasto||0);
  const leadsTotal  = (li?.leads||0) + (meta?.leads||0);
  const cplMedio    = leadsTotal > 0 ? investTotal / leadsTotal : 0;
  const impressoesTotal = (li?.impressoes||0) + (meta?.impressoes||0) + (sp?.impressoes||0);

  row.innerHTML = `
    <div class="kpi" style="--kpi-line:#c9b8f8">
      <div class="kpi-label">investimento total</div>
      <div class="kpi-val">${_fmtBRL(investTotal)}</div>
      <div class="kpi-sub">linkedin + meta ads + spotify</div>
    </div>
    <div class="kpi" style="--kpi-line:#a038f2">
      <div class="kpi-label">leads captados</div>
      <div class="kpi-val">${_fmt(leadsTotal)}</div>
      <div class="kpi-sub">linkedin + meta ads</div>
    </div>
    <div class="kpi" style="--kpi-line:#a2e259">
      <div class="kpi-label">cpl médio</div>
      <div class="kpi-val">${leadsTotal > 0 ? _fmtBRL(cplMedio) : '—'}</div>
      <div class="kpi-sub">custo por lead</div>
    </div>
    <div class="kpi" style="--kpi-line:#391bce">
      <div class="kpi-label">impressões totais</div>
      <div class="kpi-val">${_fmtK(impressoesTotal)}</div>
      <div class="kpi-sub">todas as plataformas</div>
    </div>
  `;
}

function renderPlatformCards(li, meta, sp) {
  const el = document.getElementById('platform-cards');
  if (!el) return;

  const card = (name, color, textColor, kpis) => `
    <div class="platform-card" style="border-top-color:${color}">
      <div class="platform-card-name" style="color:${color}">${name}</div>
      <div class="platform-kpis">${kpis.map(k=>`
        <div>
          <div class="platform-kpi-val">${k.val}</div>
          <div class="platform-kpi-lbl">${k.lbl}</div>
        </div>`).join('')}
      </div>
    </div>`;

  el.innerHTML = [
    card('linkedin ads', '#0A66C2', '#0A66C2', [
      {val: li ? _fmtBRL(li.investimento) : '—', lbl: 'investimento'},
      {val: li ? _fmtK(li.impressoes) : '—',     lbl: 'impressões'},
      {val: li ? _fmtK(li.cliques) : '—',         lbl: 'cliques'},
      {val: li ? _fmt(li.leads) : '—',             lbl: 'leads (form)'},
    ]),
    card('meta ads', '#1877F2', '#1877F2', [
      {val: meta ? _fmtBRL(meta.investimento) : '—', lbl: 'investimento'},
      {val: meta ? _fmtK(meta.impressoes) : '—',     lbl: 'impressões'},
      {val: meta ? _fmt(meta.leads) : '—',            lbl: 'leads'},
      {val: meta && meta.leads > 0 ? _fmtBRL(meta.cpl) : '—', lbl: 'cpl'},
    ]),
    card('spotify ads', '#1DB954', '#1DB954', [
      {val: sp ? _fmtBRL(sp.gasto) : '—',         lbl: 'investimento'},
      {val: sp ? _fmtK(sp.impressoes) : '—',       lbl: 'impressões (streams)'},
      {val: sp ? _fmtK(sp.alcance) : '—',          lbl: 'alcance'},
      {val: sp && sp.cpm > 0 ? _fmtBRL(sp.cpm) : '—', lbl: 'cpm'},
    ]),
  ].join('');
}

function renderCharts(li, meta, sp) {
  const investTotal = (li?.investimento||0) + (meta?.investimento||0) + (sp?.gasto||0);
  if (!investTotal) return;

  /* Investimento por plataforma */
  _mkChart('chart-invest-plat', {
    type: 'doughnut',
    data: {
      labels: ['LinkedIn Ads','Meta Ads','Spotify Ads'],
      datasets:[{
        data: [li?.investimento||0, meta?.investimento||0, sp?.gasto||0],
        backgroundColor: ['#0A66C2','#1877F2','#1DB954'],
        borderWidth: 0,
      }]
    },
    options: {
      ..._donutOpts(),
      plugins: {
        ..._donutOpts().plugins,
        tooltip: {
          ..._donutOpts().plugins.tooltip,
          callbacks: { label: (item) => `  ${item.label}: ${_fmtBRL(item.raw)}` }
        }
      }
    }
  });

  /* Leads por plataforma */
  _mkChart('chart-leads-plat', {
    type: 'bar',
    data: {
      labels: ['LinkedIn','Meta Ads'],
      datasets:[{
        data: [li?.leads||0, meta?.leads||0],
        backgroundColor: ['#0A66C2cc','#1877F2cc'],
        borderRadius: 6, borderWidth: 0,
      }]
    },
    options: _baseOpts()
  });

  /* Campanhas Meta — investimento */
  if (meta && meta.campanhas.length) {
    const top = [...meta.campanhas].sort((a,b)=>b.investimento-a.investimento).slice(0,5);
    _mkChart('chart-meta-campanhas', {
      type: 'bar',
      data: {
        labels: top.map(c => c.nome.substring(0,35)),
        datasets:[{
          data: top.map(c => c.investimento),
          backgroundColor: '#1877F2cc',
          borderRadius: 4, borderWidth: 0,
        }]
      },
      options: {
        ..._hbarOpts(),
        plugins: {
          ..._hbarOpts().plugins,
          tooltip: {
            ..._hbarOpts().plugins.tooltip,
            callbacks: { label: item => `  ${_fmtBRL(item.raw)}` }
          }
        }
      }
    });
  }

  /* Spotify por anúncio */
  if (sp && sp.anuncios.length) {
    const top = [...sp.anuncios].sort((a,b)=>b.impressoes-a.impressoes).slice(0,5);
    _mkChart('chart-spotify-anuncios', {
      type: 'bar',
      data: {
        labels: top.map(a => a.nome.substring(0,30)),
        datasets:[{
          data: top.map(a => a.impressoes),
          backgroundColor: '#1DB954cc',
          borderRadius: 4, borderWidth: 0,
        }]
      },
      options: _hbarOpts()
    });
  }
}

function renderTables(li, meta, sp) {
  /* Meta campanhas */
  const metaEl = document.getElementById('table-meta');
  if (metaEl && meta && meta.campanhas.length) {
    const rows = meta.campanhas.map(c => `<tr>
      <td style="max-width:220px;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.nome}</td>
      <td class="num">${_fmtBRL(c.investimento)}</td>
      <td class="num">${_fmtK(c.impressoes)}</td>
      <td class="num">${_fmtK(c.alcance)}</td>
      <td class="num">${_fmt(c.leads)}</td>
      <td class="num">${c.leads>0?_fmtBRL(c.cpl):'—'}</td>
    </tr>`).join('');
    metaEl.innerHTML = `
      <div class="card-header"><div class="card-title">meta ads · campanhas</div></div>
      <div class="table-wrap"><table>
        <thead><tr><th>campanha</th><th class="num">invest.</th><th class="num">impressões</th><th class="num">alcance</th><th class="num">leads</th><th class="num">cpl</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;
  }

  /* LinkedIn campanhas */
  const liEl = document.getElementById('table-linkedin');
  if (liEl && li && li.campanhas.length) {
    const rows = li.campanhas.map(c => `<tr>
      <td style="max-width:220px;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.nome}</td>
      <td class="num">${_fmtBRL(c.investimento)}</td>
      <td class="num">${_fmtK(c.impressoes)}</td>
      <td class="num">${_fmtK(c.cliques)}</td>
      <td class="num">${_fmtPct(c.ctr)}</td>
    </tr>`).join('');
    liEl.innerHTML = `
      <div class="card-header"><div class="card-title">linkedin ads · campanhas</div></div>
      <div class="table-wrap"><table>
        <thead><tr><th>campanha</th><th class="num">invest.</th><th class="num">impressões</th><th class="num">cliques</th><th class="num">ctr</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;
  }
}

/* ── Init ─────────────────────────────────────── */
(async function init() {
  initTheme();
  initHamburger();

  let cur = {li: null, meta: null, sp: null};

  window._onThemeChange = () => renderCharts(cur.li, cur.meta, cur.sp);

  try {
    const months = await discoverMonths(['midia-meta','midia-linkedin','midia-spotify']);

    if (!months.length) {
      showApp();
      document.getElementById('no-data-banner').style.display = 'block';
      return;
    }

    const latest = months[months.length - 1];
    buildSidebarNav(months, latest.key, loadAndRender);
    await loadAndRender(latest);

  } catch (err) {
    console.error('[midia-paga]', err);
    showError('erro ao carregar dados');
  }

  async function loadAndRender(m) {
    const eyebrow = document.getElementById('page-eyebrow');
    if (eyebrow) eyebrow.textContent = `mídia paga · ${_MO[m.mi]} ${m.year}`;

    const [liRows, metaRows, spRows] = await Promise.all([
      loadFile(m.year, m.mo, 'midia-linkedin'),
      loadFile(m.year, m.mo, 'midia-meta'),
      loadFile(m.year, m.mo, 'midia-spotify', {findHeader: 'ID da campanha'}),
    ]);

    cur.li   = liRows   ? parseLinkedIn(liRows)  : null;
    cur.meta = metaRows ? parseMeta(metaRows)     : null;
    cur.sp   = spRows   ? parseSpotify(spRows)    : null;

    showApp();

    const hasData = cur.li || cur.meta || cur.sp;
    document.getElementById('no-data-banner').style.display = hasData ? 'none' : 'block';

    if (hasData) {
      renderKPIs(cur.li, cur.meta, cur.sp);
      renderPlatformCards(cur.li, cur.meta, cur.sp);
      renderCharts(cur.li, cur.meta, cur.sp);
      renderTables(cur.li, cur.meta, cur.sp);
    }
  }
})();
