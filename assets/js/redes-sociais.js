/* ─────────────────────────────────────────────
   redes-sociais.js — instagram: postagens + stories
   vml company · 2026
─────────────────────────────────────────────── */

window.AREA_COLOR = '#a038f2';

/* ── Parsers ──────────────────────────────────── */
function parsePosts(rows) {
  if (!rows || !rows.length) return null;
  const totalRows = rows.filter(r => String(r['Data']||'').trim() === 'Total');
  if (!totalRows.length) return null;

  const posts = totalRows.map((r, i) => ({
    idx: i + 1,
    desc: String(r['Descrição']||'').substring(0, 60) || `Post ${i+1}`,
    tipo: String(r['Tipo de post']||'').includes('Reel') ? 'Reel'
        : String(r['Tipo de post']||'').includes('Carrossel') ? 'Carrossel' : 'Post',
    data: String(r['Horário de publicação']||''),
    visualizacoes:       _pn(r['Visualizações']),
    alcance:             _pn(r['Alcance']),
    curtidas:            _pn(r['Curtidas']),
    compartilhamentos:   _pn(r['Compartilhamentos']),
    seguimentos:         _pn(r['Seguimentos']),
    comentarios:         _pn(r['Comentários']),
    salvamentos:         _pn(r['Salvamentos']),
  }));

  const sum = k => posts.reduce((s,p) => s + (p[k]||0), 0);
  const engajamento = sum('curtidas') + sum('comentarios') + sum('compartilhamentos') + sum('salvamentos');
  const vis = sum('visualizacoes');

  return {
    posts,
    nPosts:            posts.length,
    visualizacoes:     vis,
    alcance:           sum('alcance'),
    curtidas:          sum('curtidas'),
    comentarios:       sum('comentarios'),
    compartilhamentos: sum('compartilhamentos'),
    salvamentos:       sum('salvamentos'),
    seguimentos:       sum('seguimentos'),
    engajamento,
    taxaEngajamento:   vis > 0 ? (engajamento / vis * 100) : 0,
    reels:    posts.filter(p=>p.tipo==='Reel').length,
    carrosseis: posts.filter(p=>p.tipo==='Carrossel').length,
  };
}

function parseStories(rows) {
  if (!rows || !rows.length) return null;
  const totalRows = rows.filter(r => String(r['Data']||'').trim() === 'Total');
  if (!totalRows.length) return null;

  const stories = totalRows.map(r => ({
    visualizacoes: _pn(r['Visualizações']),
    alcance:       _pn(r['Alcance']),
    cliquesNoLink: _pn(r['Cliques no link']),
    respostas:     _pn(r['Respostas']),
    visitasPerfil: _pn(r['Visitas ao perfil']),
    seguimentos:   _pn(r['Seguimentos']),
  }));

  const sum = k => stories.reduce((s, st) => s + (st[k]||0), 0);
  return {
    stories,
    nStories:      stories.length,
    visualizacoes: sum('visualizacoes'),
    alcance:       sum('alcance'),
    cliquesNoLink: sum('cliquesNoLink'),
    respostas:     sum('respostas'),
    visitasPerfil: sum('visitasPerfil'),
    seguimentos:   sum('seguimentos'),
  };
}

/* ── Render ───────────────────────────────────── */
function renderKPIs(posts, stories) {
  const row = document.getElementById('kpi-row');
  if (!row) return;
  const p = posts  || {};
  const s = stories || {};
  const engT = (p.engajamento||0) + (s.respostas||0);
  const segT = (p.seguimentos||0) + (s.seguimentos||0);

  row.innerHTML = `
    <div class="kpi-group-label">postagens</div>
    <div class="kpi" style="--kpi-line:#a038f2">
      <div class="kpi-label">visualizações</div>
      <div class="kpi-val">${_fmtK(p.visualizacoes)}</div>
      <div class="kpi-sub">${_fmt(p.nPosts)} publicações · ${_fmt(p.reels)} reels · ${_fmt(p.carrosseis)} carrosseis</div>
    </div>
    <div class="kpi" style="--kpi-line:#c9b8f8">
      <div class="kpi-label">alcance</div>
      <div class="kpi-val">${_fmtK(p.alcance)}</div>
      <div class="kpi-sub">pessoas únicas atingidas</div>
    </div>
    <div class="kpi" style="--kpi-line:#a2e259">
      <div class="kpi-label">engajamento</div>
      <div class="kpi-val">${_fmtK(p.engajamento)}</div>
      <div class="kpi-sub">taxa ${_fmtPct(p.taxaEngajamento)} · curtidas + comentários + saves + compartilhamentos</div>
    </div>
    <div class="kpi" style="--kpi-line:#391bce">
      <div class="kpi-label">seguimentos ganhos</div>
      <div class="kpi-val">${_fmt(segT)}</div>
      <div class="kpi-sub">posts + stories</div>
    </div>
    <div class="kpi-group-label" style="margin-top:8px">stories</div>
    <div class="kpi" style="--kpi-line:#6b5fd4">
      <div class="kpi-label">visualizações stories</div>
      <div class="kpi-val">${_fmtK(s.visualizacoes)}</div>
      <div class="kpi-sub">${_fmt(s.nStories)} stories no período</div>
    </div>
    <div class="kpi" style="--kpi-line:#a038f2">
      <div class="kpi-label">alcance stories</div>
      <div class="kpi-val">${_fmtK(s.alcance)}</div>
      <div class="kpi-sub">pessoas únicas</div>
    </div>
    <div class="kpi" style="--kpi-line:#c9b8f8">
      <div class="kpi-label">cliques no link</div>
      <div class="kpi-val">${_fmt(s.cliquesNoLink)}</div>
      <div class="kpi-sub">via stories</div>
    </div>
  `;
}

function renderCharts(posts, stories) {
  if (!posts) return;

  /* Top posts por visualizações */
  const topPosts = [...posts.posts].sort((a,b) => b.visualizacoes - a.visualizacoes).slice(0, 6);
  const labels   = topPosts.map(p => `${p.tipo} ${p.idx}`);
  const fullDesc = topPosts.map(p => p.desc);
  _mkChart('chart-top-posts', {
    type: 'bar',
    data: {
      labels,
      datasets:[{
        data: topPosts.map(p => p.visualizacoes),
        backgroundColor: '#a038f2cc',
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
            title: (items) => fullDesc[items[0].dataIndex],
            label: (item) => `  ${_fmtK(item.raw)} visualizações`
          }
        }
      }
    }
  });

  /* Tipo de conteúdo */
  _mkChart('chart-tipo', {
    type: 'doughnut',
    data: {
      labels: ['Reels', 'Carrosseis'],
      datasets:[{
        data: [posts.reels, posts.carrosseis],
        backgroundColor: ['#a038f2','#c9b8f8'],
        borderWidth: 0,
      }]
    },
    options: _donutOpts()
  });

  /* Engajamento breakdown */
  _mkChart('chart-engaj', {
    type: 'doughnut',
    data: {
      labels: ['Curtidas','Comentários','Compartilhamentos','Salvamentos'],
      datasets:[{
        data: [posts.curtidas, posts.comentarios, posts.compartilhamentos, posts.salvamentos],
        backgroundColor: ['#a038f2','#391bce','#c9b8f8','#a2e259'],
        borderWidth: 0,
      }]
    },
    options: _donutOpts()
  });

  /* Stories: visualizações */
  if (stories && stories.stories.length) {
    const topStories = [...stories.stories]
      .sort((a,b) => b.visualizacoes - a.visualizacoes)
      .slice(0, 6)
      .map((s, i) => ({...s, label: `Story ${i+1}`}));

    _mkChart('chart-stories', {
      type: 'bar',
      data: {
        labels: topStories.map(s => s.label),
        datasets:[{
          data: topStories.map(s => s.visualizacoes),
          backgroundColor: '#6b5fd4cc',
          borderRadius: 4, borderWidth: 0,
        }]
      },
      options: _hbarOpts()
    });
  }
}

function renderTable(posts) {
  const el = document.getElementById('data-table');
  if (!el || !posts || !posts.posts.length) return;

  const rows = [...posts.posts].sort((a,b) => b.visualizacoes - a.visualizacoes).map(p => `
    <tr>
      <td><span class="tipo-badge tipo-${p.tipo.toLowerCase()}">${p.tipo}</span></td>
      <td style="max-width:260px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--muted);font-size:12px">${p.desc}</td>
      <td class="num">${_fmtK(p.visualizacoes)}</td>
      <td class="num">${_fmtK(p.alcance)}</td>
      <td class="num">${_fmt(p.curtidas)}</td>
      <td class="num">${_fmt(p.comentarios)}</td>
      <td class="num">${_fmt(p.compartilhamentos)}</td>
      <td class="num">${_fmt(p.salvamentos)}</td>
      <td class="num">${_fmt(p.seguimentos)}</td>
    </tr>`).join('');

  el.innerHTML = `
    <div class="card-header"><div class="card-title">detalhamento por publicação</div></div>
    <div class="table-wrap"><table>
      <thead><tr>
        <th>tipo</th><th>descrição</th>
        <th class="num">visualizações</th><th class="num">alcance</th>
        <th class="num">curtidas</th><th class="num">comentários</th>
        <th class="num">compartilhamentos</th><th class="num">salvamentos</th><th class="num">seguimentos</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}

/* ── Init ─────────────────────────────────────── */
(async function init() {
  initTheme();
  initHamburger();

  let currentPosts = null, currentStories = null;

  window._onThemeChange = () => {
    if (currentPosts || currentStories) renderCharts(currentPosts, currentStories);
  };

  try {
    const months = await discoverMonths('redes-sociais-postagens');

    if (!months.length) {
      showApp();
      document.getElementById('no-data-banner').style.display = 'block';
      return;
    }

    const latest = months[months.length - 1];
    buildSidebarNav(months, latest.key, loadAndRender);

    await loadAndRender(latest);

  } catch (err) {
    console.error('[redes-sociais]', err);
    showError('erro ao carregar dados');
  }

  async function loadAndRender(m) {
    const eyebrow = document.getElementById('page-eyebrow');
    if (eyebrow) eyebrow.textContent = `redes sociais · ${_MO[m.mi]} ${m.year}`;

    const [postsRows, storiesRows] = await Promise.all([
      loadFile(m.year, m.mo, 'redes-sociais-postagens', {preferXLSX: true}),
      loadFile(m.year, m.mo, 'redes-sociais-stories',   {preferXLSX: true}),
    ]);

    currentPosts   = postsRows   ? parsePosts(postsRows)     : null;
    currentStories = storiesRows ? parseStories(storiesRows) : null;

    showApp();
    renderKPIs(currentPosts, currentStories);
    renderCharts(currentPosts, currentStories);
    renderTable(currentPosts);

    if (!currentPosts && !currentStories) {
      document.getElementById('no-data-banner').style.display = 'block';
    } else {
      document.getElementById('no-data-banner').style.display = 'none';
    }
  }
})();
