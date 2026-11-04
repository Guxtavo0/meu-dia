/* ===== Infraestrutura de interface ===== */
const $ = (s, r) => (r||document).querySelector(s);
const $$ = (s, r) => Array.from((r||document).querySelectorAll(s));
const ICON = {
  hoje:'<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4M9 15l2 2 4-4"/>',
  rotina:'<path d="M10 6h10M10 12h10M10 18h10M3.5 6l1.5 1.5L7.5 5M3.5 12l1.5 1.5L7.5 11M3.5 18l1.5 1.5L7.5 17"/>',
  comida:'<path d="M6 3v7a2 2 0 0 0 4 0V3M8 3v18M17 21V3c-2.2 1.4-3 4-3 7v3h3"/>',
  treino:'<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
  progresso:'<path d="M4 20V11M10 20V4M16 20v-6M3 20h18"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  l:'<path d="M15 5l-7 7 7 7"/>', r:'<path d="M9 5l7 7-7 7"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', minus:'<path d="M5 12h14"/>',
  trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5"/>',
  edit:'<path d="M4 20l1-4L16 5l3 3L8 19zM14 7l3 3"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  bell:'<path d="M6 17v-6a6 6 0 0 1 12 0v6l1.5 2h-15zM10 21h4"/>',
  down:'<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>', up:'<path d="M12 16V5M7 9l5-5 5 5M5 20h14"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  back:'<path d="M15 5l-7 7 7 7"/>',
  timer:'<circle cx="12" cy="13.5" r="7"/><path d="M12 10v4l2.5 1.5M9.5 2.5h5"/>',
  moon:'<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>'
};
const ic = (n, cls) => '<svg class="ic ' + (cls||'') + '" viewBox="0 0 24 24" aria-hidden="true">' + ICON[n] + '</svg>';
const chkHTML = (on, attrs, label, sq) =>
  '<button class="chk' + (sq?' sq':'') + '" role="checkbox" aria-checked="' + (!!on) + '" aria-label="' + esc(label) + '" ' + attrs + '><i><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></i></button>';
const swHTML = (on, attrs, label) => '<button class="sw" role="switch" aria-checked="' + (!!on) + '" aria-label="' + esc(label) + '" ' + attrs + '></button>';
const daysSummary = d => {
  const s = d.slice().sort((a,b)=>a-b).join('');
  if (s==='0123456') return 'todos os dias';
  if (s==='12345') return 'seg a sex';
  if (s==='06') return 'sáb e dom';
  if (!d.length) return 'nenhum dia';
  return [1,2,3,4,5,6,0].filter(x=>d.includes(x)).map(x=>DOW_S[x]).join(', ');
};
const daysChips = (sel, action, extra) => '<div class="days" role="group" aria-label="Dias da semana">' +
  [1,2,3,4,5,6,0].map(d=>'<button type="button" aria-pressed="' + sel.includes(d) + '" aria-label="' + DOW_L[d] + '" data-a="' + action + '" data-d="' + d + '" ' + (extra||'') + '>' + DOW_1[d] + '</button>').join('') + '</div>';
const whenLabel = w => w==='gym' ? 'só em dia de treino' : w==='nogym' ? 'só em dia sem treino' : '';

/* tema */
function applyTheme(){
  const t = state.settings.theme, r = document.documentElement;
  if (t==='light'||t==='dark') r.setAttribute('data-theme', t); else r.removeAttribute('data-theme');
}

/* cabeçalho e navegação */
const TABS = [['hoje','Hoje'],['rotina','Rotina'],['comida','Comida'],['treino','Treino'],['progresso','Progresso']];
const DATE_TABS = ['hoje','comida','treino'];
function relLabel(date){
  const t = todayStr();
  if (date===t) return 'hoje'; if (date===addDays(t,-1)) return 'ontem'; if (date===addDays(t,1)) return 'amanhã';
  return '';
}
function headerHTML(){
  const tab = ui.tab;
  if (tab==='ajustes') return '<div class="wrap"><button class="ib" data-a="back" aria-label="Voltar">' + ic('back') + '</button><div class="hdr-title"><div class="hdr-kicker">Meu Dia</div><h1>Ajustes</h1></div></div>';
  const withDate = DATE_TABS.includes(tab);
  let kick, title;
  if (withDate){
    const d = parse(ui.date), rel = relLabel(ui.date);
    kick = (rel ? rel + ' · ' : '') + DOW_L[d.getDay()];
    title = d.getDate() + ' ' + MON_S[d.getMonth()];
  } else {
    kick = 'Meu Dia'; title = {rotina:'Rotina',progresso:'Progresso'}[tab];
  }
  return '<div class="wrap"><div class="hdr-title"><div class="hdr-kicker">' + esc(kick) + '</div><h1>' + esc(title) + '</h1></div>' +
    (withDate ? '<button class="ib" data-a="day" data-n="-1" aria-label="Dia anterior">' + ic('l') + '</button><button class="ib" data-a="day" data-n="1" aria-label="Próximo dia">' + ic('r') + '</button>' : '') +
    '<button class="ib" data-a="go" data-t="ajustes" aria-label="Ajustes">' + ic('gear') + '</button></div>';
}
function navHTML(){
  return '<div class="wrap">' + TABS.map(([id,l])=>'<button data-a="go" data-t="' + id + '"' + (ui.tab===id?' aria-current="page"':'') + '>' + ic(id) + '<span>' + l + '</span></button>').join('') + '</div>';
}

/* despacho de eventos */
const A = {}, C = {}, VIEWS = {};
let prevTab = 'hoje';
document.addEventListener('click', e=>{
  const el = e.target.closest('[data-a]');
  if (!el) return;
  const fn = A[el.dataset.a];
  if (fn){ e.preventDefault(); fn(el, e); }
});
document.addEventListener('change', e=>{
  const el = e.target.closest('[data-c]');
  if (el && C[el.dataset.c]) C[el.dataset.c](el, e);
});
document.addEventListener('keydown', e=>{ if (e.key==='Escape' && ui.sheet) closeSheet(); });

A.go = el => {
  if (el.dataset.t==='ajustes' && ui.tab!=='ajustes') prevTab = ui.tab;
  ui.tab = el.dataset.t; render(false); window.scrollTo(0,0);
};
A.back = () => { ui.tab = prevTab || 'hoje'; render(false); window.scrollTo(0,0); };
A.day = el => { ui.date = addDays(ui.date, +el.dataset.n); render(false); window.scrollTo(0,0); };
A.today = () => { ui.date = todayStr(); render(false); };

function render(keepScroll){
  const y = window.scrollY;
  applyTheme();
  $('#hdr').innerHTML = headerHTML();
  $('#main').innerHTML = (VIEWS[ui.tab] || VIEWS.hoje)();
  $('#nav').innerHTML = navHTML();
  $('#nav').hidden = ui.tab==='ajustes';
  if (keepScroll !== false) window.scrollTo(0, y);
}

/* painéis de edição */
function openSheet(s){ ui.sheet = s; renderSheet(); setTimeout(()=>{ const f = $('#sheetRoot [data-f]'); if (f && f.tagName!=='BUTTON') try{ f.focus({preventScroll:true}); }catch(e){} }, 30); }
function closeSheet(){ ui.sheet = null; $('#sheetRoot').innerHTML = ''; render(); }
function renderSheet(){
  const s = ui.sheet; if (!s){ $('#sheetRoot').innerHTML = ''; return; }
  const body = (SHEETS[s.k] || (()=>''))(s);
  $('#sheetRoot').innerHTML = '<div class="scrim" data-a="scrim"><div class="sheet" role="dialog" aria-modal="true">' + body + '</div></div>';
}
A.scrim = (el, e) => { if (e.target === el) closeSheet(); };
A.close = () => closeSheet();
const SHEETS = {};
function captureSheet(){
  const s = ui.sheet; if (!s || !s.draft) return;
  $$('#sheetRoot [data-f]').forEach(f=>{
    if (f.tagName==='BUTTON') return;
    const v = f.type==='checkbox' ? f.checked : f.value;
    if (f.dataset.ex !== undefined) s.draft.ex[+f.dataset.ex][f.dataset.f] = v; else s.draft[f.dataset.f] = v;
  });
}
const fld = (label, inner) => '<label class="field"><span>' + esc(label) + '</span>' + inner + '</label>';
const inp = (f, v, type, extra) => '<input type="' + (type||'text') + '" data-f="' + f + '" value="' + esc(v) + '" ' + (extra||'') + '>';

/* cronômetro de descanso */
const rest = {end:0, h:null};
function startRest(sec){
  clearInterval(rest.h); rest.end = Date.now() + sec*1000;
  let el = $('#rest');
  if (!el){ el = document.createElement('button'); el.id = 'rest'; el.className = 'toast'; el.style.fontFamily = 'var(--f-mono)'; el.setAttribute('aria-label','Cancelar cronômetro de descanso'); el.addEventListener('click', stopRest); document.body.appendChild(el); }
  el.hidden = false;
  const upd = () => {
    const left = Math.max(0, Math.round((rest.end - Date.now())/1000));
    el.textContent = 'Descanso ' + Math.floor(left/60) + ':' + pad(left%60) + ' (toque para parar)';
    if (left <= 0){ stopRest(); try{ if (navigator.vibrate) navigator.vibrate([200,100,200]); }catch(e){} toast('Descanso terminado. Próxima série.'); }
  };
  upd(); rest.h = setInterval(upd, 500);
}
function stopRest(){ clearInterval(rest.h); const el = $('#rest'); if (el) el.hidden = true; }
