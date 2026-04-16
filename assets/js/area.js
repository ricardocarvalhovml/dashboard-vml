/* ─────────────────────────────────────────────
   area.js — utilitários compartilhados
   dashboard analytics · vml company · 2026
─────────────────────────────────────────────── */

const _MO = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const _MS = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

/* ── Formatadores ─────────────────────────────── */
const _fmt    = n => (n==null||n===''||isNaN(+n)) ? '—' : (+n).toLocaleString('pt-BR');
const _fmtPct = (n,d=1) => (n==null||n===''||isNaN(+n)) ? '—' : (+n).toFixed(d)+'%';
const _fmtDec = (n,d=2) => (n==null||n===''||isNaN(+n)) ? '—' : (+n).toFixed(d);
const _fmtBRL = n => {
  if (n==null||n===''||isNaN(+n)) return '—';
  return 'R$\u00a0'+(+n).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
};
const _fmtK = n => {
  if (n==null||n===''||isNaN(+n)) return '—';
  const v=+n;
  if (v>=1e6) return (v/1e6).toFixed(1).replace('.',',')+'M';
  if (v>=1e3) return (v/1e3).toFixed(1).replace('.',',')+'k';
  return v.toLocaleString('pt-BR');
};
const _pn = s => {
  if (s==null) return 0;
  return parseFloat(String(s).replace(/\./g,'').replace(',','.').replace('%','').trim())||0;
};
const _normRate = v => { const n=_pn(v); return (n>0&&n<2)?n*100:n; };

/* ── Delta badge ──────────────────────────────── */
function _deltaHtml(curr, prev, invertBad=false) {
  if (prev==null||prev===0||curr==null) return '';
  const pct=((curr-prev)/Math.abs(prev)*100).toFixed(1);
  const up=curr>=prev; const good=invertBad?!up:up;
  return `<span style="font-size:11px;font-weight:700;color:${good?'var(--green)':'#ff8a8a'}">${up?'▲':'▼'} ${Math.abs(pct)}%</span>`;
}

/* ── Charts ───────────────────────────────────── */
const _charts = {};
function _mkChart(id, cfg) {
  if (_charts[id]) { try{_charts[id].destroy();}catch(e){} delete _charts[id]; }
  const el = document.getElementById(id); if (!el) return null;
  return (_charts[id] = new Chart(el, cfg));
}
function _themeColors() {
  const l = document.documentElement.dataset.theme==='light';
  return {
    bg:l?'#ffffff':'#0d1030', border:l?'rgba(0,0,0,.08)':'rgba(255,255,255,.1)',
    title:l?'#12155a':'#efecef', body:l?'#5a5070':'#8b86a8',
    grid:l?'rgba(18,21,90,.06)':'rgba(255,255,255,.04)', tick:l?'#5a5070':'#8b86a8',
  };
}
function _baseOpts(extra={}) {
  const c=_themeColors();
  return {
    responsive:true, maintainAspectRatio:false,
    plugins:{
      legend:{display:false},
      tooltip:{backgroundColor:c.bg,borderColor:c.border,borderWidth:1,titleColor:c.title,bodyColor:c.body,padding:10,
        titleFont:{family:"'Poppins',sans-serif",weight:'700'},bodyFont:{family:"'Poppins',sans-serif",size:12}}
    },
    scales:{
      x:{grid:{display:false},ticks:{color:c.tick,font:{size:11,family:"'Poppins',sans-serif"}}},
      y:{grid:{color:c.grid},ticks:{color:c.tick,font:{size:11,family:"'Poppins',sans-serif"},
        callback:v=>v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'k':v},...(extra.y||{})},...extra
    }
  };
}
function _hbarOpts() {
  const c=_themeColors();
  return {
    responsive:true,maintainAspectRatio:false,indexAxis:'y',
    plugins:{
      legend:{display:false},
      tooltip:{backgroundColor:c.bg,borderColor:c.border,borderWidth:1,titleColor:c.title,bodyColor:c.body,padding:10,
        titleFont:{family:"'Poppins',sans-serif",weight:'700'},bodyFont:{family:"'Poppins',sans-serif",size:12}}
    },
    scales:{
      x:{grid:{color:c.grid},ticks:{color:c.tick,font:{size:11,family:"'Poppins',sans-serif"},
        callback:v=>v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'k':v}},
      y:{grid:{display:false},ticks:{color:c.tick,font:{size:11,family:"'Poppins',sans-serif"},
        callback:v=>v.length>20?v.slice(0,20)+'…':v}}
    }
  };
}
function _donutOpts(pos='bottom') {
  const c=_themeColors();
  return {
    responsive:true,maintainAspectRatio:false,
    plugins:{
      legend:{display:true,position:pos,labels:{color:c.body,font:{size:11,family:"'Poppins',sans-serif"},padding:14,boxWidth:12}},
      tooltip:{backgroundColor:c.bg,borderColor:c.border,borderWidth:1,titleColor:c.title,bodyColor:c.body,padding:10,
        titleFont:{family:"'Poppins',sans-serif",weight:'700'},bodyFont:{family:"'Poppins',sans-serif",size:12}}
    }
  };
}

/* ── Tema ─────────────────────────────────────── */
function _updateLogo(l) {
  const img=document.getElementById('sidebar-logo');
  if(img) img.src=l?'/assets/img/logo-escuro.png':'/assets/img/logo.png';
  const ic=document.getElementById('theme-icon'); if(!ic) return;
  ic.innerHTML=l
    ?`<svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
    :`<svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
}
function initTheme() {
  const s=localStorage.getItem('dashboard-theme')||'';
  document.documentElement.dataset.theme=s; _updateLogo(s==='light');
}
function toggleTheme() {
  const h=document.documentElement; const l=h.dataset.theme==='light';
  h.dataset.theme=l?'':'light'; localStorage.setItem('dashboard-theme',h.dataset.theme);
  _updateLogo(!l);
  if(typeof window._onThemeChange==='function') window._onThemeChange();
}

/* ── Sidebar ──────────────────────────────────── */
function buildSidebarNav(months, activeKey, onSelect) {
  const nav=document.getElementById('monthNav'); if(!nav) return;
  nav.innerHTML='';
  if(!months.length) {
    nav.innerHTML='<div style="font-size:12px;opacity:.4;padding:8px 4px">nenhum dado disponível</div>'; return;
  }
  const color=window.AREA_COLOR||'#a038f2';
  const byYear={};
  months.forEach(m=>{if(!byYear[m.year])byYear[m.year]=[];byYear[m.year].push(m);});
  Object.keys(byYear).sort((a,b)=>b-a).forEach(y=>{
    const sec=document.createElement('div');
    sec.className='sidebar-section year-header';
    sec.style.cssText='cursor:default;display:flex;align-items:center;justify-content:space-between;gap:4px';
    const lbl=document.createElement('span'); lbl.textContent=y; lbl.style.cssText='flex:1;padding:2px 0';
    const chev=document.createElement('span'); chev.className='chev'; chev.textContent='▾';
    chev.style.cssText='font-size:8px;opacity:.5;transition:transform .2s;cursor:pointer;padding:2px 4px';
    sec.appendChild(lbl); sec.appendChild(chev); nav.appendChild(sec);
    const grp=document.createElement('div'); grp.className='year-group';
    byYear[y].forEach(m=>{
      const btn=document.createElement('button');
      btn.className='nav-tab'+(m.key===activeKey?' active':'');
      btn.dataset.key=m.key;
      btn.innerHTML=`<span class="nav-dot" style="background:${color}"></span>${_MO[m.mi]}`;
      btn.onclick=()=>{
        document.querySelectorAll('#monthNav .nav-tab').forEach(t=>t.classList.remove('active'));
        btn.classList.add('active'); if(onSelect) onSelect(m);
      };
      grp.appendChild(btn);
    });
    nav.appendChild(grp);
    requestAnimationFrame(()=>{ grp.style.maxHeight=grp.scrollHeight+'px'; });
    const toggle=()=>{ const c=grp.classList.toggle('coll'); grp.style.maxHeight=c?'0':grp.scrollHeight+'px'; chev.style.transform=c?'rotate(-90deg)':''; };
    chev.addEventListener('click',toggle); lbl.addEventListener('click',toggle);
  });
}

/* ── Descoberta de meses ──────────────────────── */
async function discoverMonths(primaryFile) {
  const now=new Date(); const thisYM=now.getFullYear()*100+(now.getMonth()+1);
  const candidates=[];
  for(let year=2022;year<=2030;year++){
    for(let mo=1;mo<=12;mo++){
      if(year*100+mo>thisYM) break;
      candidates.push({year,mi:mo-1,mo:String(mo).padStart(2,'0'),key:`${year}-${String(mo).padStart(2,'0')}`});
    }
  }
  const files=Array.isArray(primaryFile)?primaryFile:[primaryFile];
  const results=await Promise.all(candidates.map(async c=>{
    const base=`/assets/data/${c.year}/${c.mo}`;
    for(const f of files){
      for(const ext of ['.xlsx','.csv']){
        try{const r=await fetch(`${base}/${f}${ext}`,{method:'HEAD'});if(r.ok)return c;}catch{}
      }
    }
    return null;
  }));
  return results.filter(Boolean);
}

/* ── Carregamento de arquivo ──────────────────── */
async function loadFile(year, mo, filename, opts={}) {
  const base=`/assets/data/${year}/${mo}`;
  const exts=opts.preferXLSX?['.xlsx','.csv']:['.csv','.xlsx'];
  for(const ext of exts){
    try{
      const r=await fetch(`${base}/${filename}${ext}`); if(!r.ok) continue;
      if(ext==='.csv'){
        let text=await r.text(); if(!text.trim()) continue;
        if(opts.findHeader){
          const lines=text.split('\n'); const idx=lines.findIndex(l=>l.startsWith(opts.findHeader));
          if(idx===-1) continue; text=lines.slice(idx).join('\n');
        }
        const result=Papa.parse(text.trim(),{header:true,skipEmptyLines:true,dynamicTyping:false,transform:val=>String(val).trim()});
        if(result.data.length) return result.data;
      } else {
        if(!window.XLSX) continue;
        const ab=await r.arrayBuffer();
        const wb=XLSX.read(ab,{type:'array'});
        const ws=wb.Sheets[wb.SheetNames[0]];
        const rows=XLSX.utils.sheet_to_json(ws,{defval:'',raw:false});
        if(rows.length) return rows;
      }
    }catch(e){}
  }
  return null;
}

/* ── UI helpers ───────────────────────────────── */
function initHamburger() {
  const layout=document.getElementById('layout'); const ham=document.getElementById('hamburger');
  if(ham&&layout) ham.addEventListener('click',()=>{ layout.classList.toggle('collapsed'); setTimeout(()=>window.dispatchEvent(new Event('resize')),280); });
}
function showApp() {
  const l=document.getElementById('app-loading'); const a=document.getElementById('app');
  if(l) l.style.display='none'; if(a) a.style.display='block';
}
function showError(msg) {
  const l=document.getElementById('app-loading');
  if(l) l.innerHTML=`<div style="text-align:center;padding:40px"><div style="font-size:24px;margin-bottom:12px">⚠️</div><div style="font-weight:700;margin-bottom:6px">${msg}</div><div style="font-size:13px;opacity:.6">verifique o console para detalhes</div></div>`;
}
function toggleAreas() {
  const el=document.getElementById('areas-list'); if(!el) return;
  el.classList.toggle('coll');
  const c=document.querySelector('#areas-toggle .chev'); if(c) c.style.transform=el.classList.contains('coll')?'rotate(-90deg)':'';
}
function togglePeriodo() {
  const el=document.getElementById('periodo-list'); if(!el) return;
  el.classList.toggle('coll');
  const c=document.querySelector('#periodo-toggle .chev'); if(c) c.style.transform=el.classList.contains('coll')?'rotate(-90deg)':'';
}
