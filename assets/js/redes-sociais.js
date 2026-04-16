/* ─────────────────────────────────────────────
   redes-sociais.js — Social Dashboard
   vml company · Temeron · 2026
   Lê redes-sociais-postagens.xlsx de assets/data/YYYY/MM/
─────────────────────────────────────────────── */

const _rsFmt    = n => (n == null || isNaN(Number(n))) ? '—' : Number(n).toLocaleString('pt-BR');
const _rsFmtPct = n => (n == null || isNaN(Number(n))) ? '—' : Number(n).toFixed(1) + '%';
const _MO_RS    = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const _YEARS_RS = [2025, 2026];

const _rsCharts = {};
function _rsMkChart(id, cfg) {
  if (_rsCharts[id]) _rsCharts[id].destroy();
  const el = document.getElementById(id);
  if (el) _rsCharts[id] = new Chart(el, cfg);
}
function _rsTheme() {
  const l = document.documentElement.dataset.theme === 'light';
  return { bg: l?'#ffffff':'#0d1030', border: l?'rgba(0,0,0,.08)':'rgba(255,255,255,.1)', title: l?'#12155a':'#efecef', body: l?'#5a5070':'#8b86a8', grid: l?'rgba(18,21,90,.06)':'rgba(255,255,255,.04)', tick: l?'#5a5070':'#8b86a8' };
}
function _rsHBar(id, labels, data, color) {
  const c = _rsTheme();
  _rsMkChart(id, { type:'bar', data:{ labels, datasets:[{ data, backgroundColor:color+'cc', borderRadius:4, borderWidth:0 }] }, options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false}, tooltip:{ backgroundColor:c.bg, borderColor:c.border, borderWidth:1, titleColor:c.title, bodyColor:c.body, titleFont:{family:"'Poppins',sans-serif",weight:'700'}, bodyFont:{family:"'Poppins',sans-serif",size:12} } }, scales:{ x:{ grid:{color:c.grid}, ticks:{color:c.tick,font:{size:10,family:"'Poppins',sans-serif"},callback:v=>v>=1000?(v/1000).toFixed(1)+'k':v} }, y:{ grid:{display:false}, ticks:{color:c.tick,font:{size:11,family:"'Poppins',sans-serif"}} } } } });
}
function _rsBar(id, labels, data, colors) {
  const c = _rsTheme();
  _rsMkChart(id, { type:'bar', data:{ labels, datasets:[{ data, backgroundColor:colors||'#a038f2cc', borderRadius:4, borderWidth:0 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false}, tooltip:{ backgroundColor:c.bg, borderColor:c.border, borderWidth:1, titleColor:c.title, bodyColor:c.body, titleFont:{family:"'Poppins',sans-serif",weight:'700'}, bodyFont:{family:"'Poppins',sans-serif",size:12} } }, scales:{ x:{ grid:{display:false}, ticks:{color:c.tick,font:{size:10,family:"'Poppins',sans-serif"}} }, y:{ grid:{color:c.grid}, ticks:{color:c.tick,font:{size:10,family:"'Poppins',sans-serif"},callback:v=>v>=1000?(v/1000).toFixed(1)+'k':v} } } } });
}
function _rsTipoKey(t) { const s=(t||'').toLowerCase(); if(s.includes('carrossel'))return'carrossel'; if(s.includes('reel'))return'reel'; if(s.includes('story')||s.includes('storie'))return'story'; return'post'; }
function _rsTipoColor(t) { return {'carrossel':'#a038f2','reel':'#391bce','story':'#6b5fd4','post':'#c9b8f8'}[_rsTipoKey(t)]||'#391bce'; }
function _rsParseDate(s) { if(!s)return null; const str=String(s).trim(); let m=str.match(/^(\d{4})-(\d{2})-(\d{2})/); if(m)return`${m[3]}/${m[2]}/${m[1]}`; m=str.match(/^(\d{2})\/(\d{2})\/(\d{4})/); if(m)return`${m[2]}/${m[1]}/${m[3]}`; return null; }

async function _rsFetchMonth(year, mo) {
  try {
    const r = await fetch(`/assets/data/${year}/${mo}/redes-sociais-postagens.xlsx`);
    if (r.ok) {
      const ab = await r.arrayBuffer();
      const wb = XLSX.read(ab, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      const totals = rows.filter(r => String(r['Data']||'').trim()==='Total'||String(r['Comentário de dados']||'').trim()==='Total');
      const data = totals.length ? totals : rows.filter(r => r['Tipo de post'] && r['Visualizações']);
      if (data.length) return data;
    }
  } catch (_) {}
  return null;
}

function _rsRender(rows, year, mi) {
  const posts = rows.map(r => ({
    tipo: String(r['Tipo de post']||'').trim(),
    dataStr: _rsParseDate(r['Horário de publicação']),
    descricao: String(r['Descrição']||'').trim(),
    link: String(r['Link permanente']||'').trim(),
    visualizacoes: parseInt(r['Visualizações'])||0,
    alcance: parseInt(r['Alcance'])||0,
    curtidas: parseInt(r['Curtidas'])||0,
    compartilhamentos: parseInt(r['Compartilhamentos'])||0,
    comentarios: parseInt(r['Comentários'])||0,
    salvamentos: parseInt(r['Salvamentos'])||0,
  })).filter(p => p.visualizacoes>0||p.alcance>0);

  const totalAlcance = posts.reduce((s,p)=>s+p.alcance,0);
  const totalViews   = posts.reduce((s,p)=>s+p.visualizacoes,0);
  const totalInt     = posts.reduce((s,p)=>s+p.curtidas+p.compartilhamentos+p.comentarios+p.salvamentos,0);
  const engMedio     = totalViews > 0 ? totalInt/totalViews*100 : 0;

  const ey = document.getElementById('page-eyebrow');
  if (ey) ey.textContent = `redes sociais · ${_MO_RS[mi]} ${year}`;

  const kpiRow = document.getElementById('kpi-row');
  if (kpiRow) kpiRow.innerHTML = `
    <div class="kpi" style="--kpi-line:#a038f2"><div class="kpi-label">alcance total</div><div class="kpi-val">${totalAlcance>=1000?(totalAlcance/1000).toFixed(1)+'k':_rsFmt(totalAlcance)}</div><div class="kpi-sub">${posts.length} publicações</div></div>
    <div class="kpi" style="--kpi-line:#391bce"><div class="kpi-label">visualizações</div><div class="kpi-val">${totalViews>=1000?(totalViews/1000).toFixed(1)+'k':_rsFmt(totalViews)}</div><div class="kpi-sub">posts + reels</div></div>
    <div class="kpi" style="--kpi-line:#c9b8f8"><div class="kpi-label">interações</div><div class="kpi-val">${_rsFmt(totalInt)}</div><div class="kpi-sub">curtidas · salv. · coment.</div></div>
    <div class="kpi" style="--kpi-line:#a2e259"><div class="kpi-label">engajamento médio</div><div class="kpi-val">${_rsFmtPct(engMedio)}</div><div class="kpi-sub">interações / visualizações</div></div>
  `;

  const rc = document.getElementById('resumo-card');
  if (rc) {
    const tipoCount = posts.reduce((m,p)=>{ const k=_rsTipoKey(p.tipo); m[k]=(m[k]||0)+1; return m; }, {});
    const topAlcance = [...posts].sort((a,b)=>b.alcance-a.alcance)[0];
    rc.innerHTML = `
      <div class="card-header"><div class="card-title">resumo do período</div></div>
      <div class="summary-row"><span class="summary-label">publicações</span><span class="summary-value">${posts.length}</span></div>
      <div class="summary-row"><span class="summary-label">alcance total</span><span class="summary-value">${totalAlcance>=1000?(totalAlcance/1000).toFixed(1)+'k':_rsFmt(totalAlcance)}</span></div>
      <div class="summary-row"><span class="summary-label">visualizações</span><span class="summary-value">${totalViews>=1000?(totalViews/1000).toFixed(1)+'k':_rsFmt(totalViews)}</span></div>
      <div class="summary-row"><span class="summary-label">interações</span><span class="summary-value">${_rsFmt(totalInt)}</span></div>
      ${tipoCount.reel?`<div class="summary-row"><span class="summary-label">reels</span><span class="summary-value">${tipoCount.reel}</span></div>`:''}
      ${tipoCount.carrossel?`<div class="summary-row"><span class="summary-label">carrosseis</span><span class="summary-value">${tipoCount.carrossel}</span></div>`:''}
      ${topAlcance?`<div class="summary-row"><span class="summary-label">maior alcance</span><span class="summary-value summary-value--accent">${topAlcance.alcance>=1000?(topAlcance.alcance/1000).toFixed(1)+'k':_rsFmt(topAlcance.alcance)}</span></div>`:''}
    `;
  }

  const byAlcance = [...posts].sort((a,b)=>b.alcance-a.alcance).slice(0,8);
  _rsHBar('chart-alcance', byAlcance.map(p=>`${_rsTipoKey(p.tipo).substring(0,1).toUpperCase()} · ${p.dataStr?p.dataStr.substring(0,5):'—'}`), byAlcance.map(p=>p.alcance), '#a038f2');

  const byInt = [...posts].sort((a,b)=>(b.curtidas+b.comentarios+b.compartilhamentos+b.salvamentos)-(a.curtidas+a.comentarios+a.compartilhamentos+a.salvamentos)).slice(0,8);
  _rsHBar('chart-interacoes', byInt.map(p=>`${_rsTipoKey(p.tipo).substring(0,1).toUpperCase()} · ${p.dataStr?p.dataStr.substring(0,5):'—'}`), byInt.map(p=>p.curtidas+p.comentarios+p.compartilhamentos+p.salvamentos), '#391bce');

  const tipos = ['reel','carrossel','story','post'].filter(t=>posts.some(p=>_rsTipoKey(p.tipo)===t));
  _rsBar('chart-tipos', tipos, tipos.map(t=>posts.filter(p=>_rsTipoKey(p.tipo)===t).reduce((s,p)=>s+p.alcance,0)), tipos.map(t=>_rsTipoColor(t)+'cc'));

  const tbl = document.getElementById('data-table');
  if (!tbl) return;
  const sorted = [...posts].sort((a,b)=>b.alcance-a.alcance);
  tbl.innerHTML = `
    <div class="card-header"><div class="card-title">auditoria de posts</div><div class="card-sub">ordenado por alcance</div></div>
    <div class="table-wrap"><table>
      <thead><tr><th>tipo</th><th class="num">data</th><th class="num">alcance</th><th class="num">visualizações</th><th class="num">curtidas</th><th class="num">compartilhamentos</th><th class="num">salvamentos</th><th class="num">engajamento</th></tr></thead>
      <tbody>${sorted.map(p=>{ const eng=p.visualizacoes>0?(p.curtidas+p.comentarios+p.compartilhamentos+p.salvamentos)/p.visualizacoes*100:0; return`<tr><td><span style="font-size:11px;padding:2px 8px;border-radius:20px;background:${_rsTipoColor(p.tipo)}33;color:${_rsTipoColor(p.tipo)};font-weight:700">${_rsTipoKey(p.tipo)}</span></td><td class="num" style="color:var(--muted);white-space:nowrap">${p.dataStr||'—'}</td><td class="num" style="font-weight:700">${p.alcance>=1000?(p.alcance/1000).toFixed(1)+'k':_rsFmt(p.alcance)}</td><td class="num" style="color:var(--muted)">${p.visualizacoes>=1000?(p.visualizacoes/1000).toFixed(1)+'k':_rsFmt(p.visualizacoes)}</td><td class="num">${_rsFmt(p.curtidas)}</td><td class="num">${_rsFmt(p.compartilhamentos)}</td><td class="num">${_rsFmt(p.salvamentos)}</td><td class="num" style="color:${eng>=2?'var(--green)':'var(--muted)'}">${_rsFmtPct(eng)}</td></tr>`; }).join('')}</tbody>
    </table></div>
  `;
}

function _rsBuildNav(months) {
  const nav = document.getElementById('monthNav');
  if (!nav||!months.length) return;
  const byYear={};
  months.forEach(m=>{ if(!byYear[m.year])byYear[m.year]=[]; byYear[m.year].push(m); });
  Object.keys(byYear).sort().forEach(y => {
    const sec=document.createElement('div'); sec.className='sidebar-section year-header'; sec.style.cssText='cursor:pointer;display:flex;align-items:center;justify-content:space-between'; sec.innerHTML=`<span>${y}</span><span class="chev" style="font-size:8px;opacity:.5;transition:transform .2s">▾</span>`; nav.appendChild(sec);
    const grp=document.createElement('div'); grp.className='year-group';
    byYear[y].forEach(m=>{ const btn=document.createElement('button'); btn.className='nav-tab'; btn.dataset.key=m.key; btn.innerHTML=`<span class="nav-dot" style="background:#a038f2"></span>${_MO_RS[m.mi]}`; btn.onclick=()=>{ document.querySelectorAll('#monthNav .nav-tab').forEach(t=>t.classList.remove('active')); btn.classList.add('active'); _rsRender(m.rows,m.year,m.mi); }; grp.appendChild(btn); });
    nav.appendChild(grp); requestAnimationFrame(()=>{ grp.style.maxHeight=grp.scrollHeight+'px'; });
    sec.addEventListener('click',()=>{ const c=grp.classList.toggle('coll'); grp.style.maxHeight=c?'0':grp.scrollHeight+'px'; const ch=sec.querySelector('.chev'); if(ch)ch.style.transform=c?'rotate(-90deg)':''; });
  });
}

(async function() {
  initTheme();
  const layout=document.getElementById('layout'), ham=document.getElementById('hamburger');
  if(ham&&layout) ham.addEventListener('click',()=>{ layout.classList.toggle('collapsed'); setTimeout(()=>window.dispatchEvent(new Event('resize')),280); });
  try {
    const months=[];
    await Promise.all(_YEARS_RS.flatMap(y=>Array.from({length:12},(_,i)=>i+1).map(async mn=>{ const mo=String(mn).padStart(2,'0'); const rows=await _rsFetchMonth(y,mo); if(rows)months.push({year:y,mi:mn-1,mo,key:`${y}-${mo}`,rows}); })));
    months.sort((a,b)=>a.key.localeCompare(b.key));
    document.getElementById('app-loading').style.display='none';
    document.getElementById('app').style.display='block';
    if(!months.length){ document.getElementById('no-data-banner').style.display='block'; return; }
    _rsBuildNav(months);
    const latest=months[months.length-1];
    document.querySelectorAll(`[data-key="${latest.key}"]`).forEach(b=>b.classList.add('active'));
    _rsRender(latest.rows,latest.year,latest.mi);
  } catch(err) {
    console.error('[redes-sociais.js]',err);
    document.getElementById('app-loading').innerHTML=`<div style="text-align:center;padding:40px"><div style="font-size:24px">⚠️</div><div style="font-weight:700;margin-top:12px">erro ao carregar dados</div></div>`;
  }
})();
