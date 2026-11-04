/* ===== Núcleo: estado, armazenamento, datas, seleções, lembretes, backup ===== */
const KEY = 'meudia.v1', FIRED_KEY = 'meudia.fired';
const DOW_S = ['dom','seg','ter','qua','qui','sex','sáb'];
const DOW_L = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
const DOW_1 = ['D','S','T','Q','Q','S','S'];
const MON_S = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const clone = o => JSON.parse(JSON.stringify(o));
const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = p => (p||'i') + Math.random().toString(36).slice(2,8);

let state, storageOk = true;
function migrate(s){
  const base = clone(SEED);
  for (const k in base) if (!(k in s)) s[k] = base[k];
  for (const k in base.settings) if (!(k in s.settings)) s.settings[k] = base.settings[k];
  for (const k in base.profile) if (!(k in s.profile)) s.profile[k] = base.profile[k];
  return s;
}
function load(){
  try{
    const raw = localStorage.getItem(KEY);
    if (raw){ const s = JSON.parse(raw); if (s && Array.isArray(s.items)) return migrate(s); }
  }catch(e){ storageOk = false; }
  return clone(SEED);
}
function save(){
  try{ localStorage.setItem(KEY, JSON.stringify(state)); storageOk = true; }catch(e){ storageOk = false; }
}

/* datas */
const pad = n => String(n).padStart(2,'0');
const ymd = d => d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parse = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y,m-1,d,12,0,0); };
const addDays = (s,n) => { const d = parse(s); d.setDate(d.getDate()+n); return ymd(d); };
const dowOf = s => parse(s).getDay();
const todayStr = () => ymd(new Date());
const nowMin = () => { const d = new Date(); return d.getHours()*60 + d.getMinutes(); };
const toMin = t => { if (!t) return 0; const [h,m] = t.split(':').map(Number); return h*60 + (m||0); };
const fmtMin = m => { m = ((m%1440)+1440)%1440; return pad(Math.floor(m/60))+':'+pad(m%60); };
const sortKey = m => m < 270 ? m + 1440 : m;   /* 00:00 a 04:29 contam como fim do dia */
const dateLabel = s => { const d = parse(s); return DOW_L[d.getDay()] + ', ' + d.getDate() + ' ' + MON_S[d.getMonth()]; };

/* registro do dia */
function emptyLog(){ return {done:{}, meals:{}, water:0, wk:{done:false, ex:{}, note:''}, sleep:{h:'',energy:''}, weight:'', note:''}; }
function getLog(date, create){
  let l = state.logs[date];
  if (!l){ if (!create) return emptyLog(); l = state.logs[date] = emptyLog(); }
  if (!l.done) l.done = {}; if (!l.meals) l.meals = {}; if (!l.wk) l.wk = {done:false, ex:{}, note:''};
  if (!l.wk.ex) l.wk.ex = {}; if (!l.sleep) l.sleep = {h:'',energy:''};
  return l;
}

/* dia de treino, plano e horário */
function isGym(date){
  const l = state.logs[date];
  if (l && typeof l.gym === 'boolean') return l.gym;
  return state.settings.gymDays.includes(dowOf(date));
}
function planFor(date){
  if (!isGym(date)) return null;
  const l = state.logs[date];
  if (l && l.plan){ const p = state.plans.find(p=>p.id===l.plan); if (p) return p; }
  const id = state.schedule[dowOf(date)];
  const sched = state.plans.find(p=>p.id===id);
  if (sched) return sched;
  /* treino extra em dia não programado: próximo da sequência, depois do último concluído */
  let last = null;
  Object.keys(state.logs).sort().forEach(d=>{ const x = state.logs[d]; if (x.wk && x.wk.done && x.wk.planId && d < date) last = x.wk.planId; });
  const i = state.plans.findIndex(p=>p.id===last);
  return state.plans[(i+1) % state.plans.length] || null;
}
function gymSlot(date){ const d = dowOf(date); return (d===0||d===6) ? state.settings.gymSlot.weekend : state.settings.gymSlot.week; }
function rebuildSchedule(){
  const days = state.settings.gymDays.slice().sort((a,b)=>((a+6)%7)-((b+6)%7));
  const sch = {};
  days.forEach((d,i)=>{ if (state.plans.length) sch[d] = state.plans[i % state.plans.length].id; });
  state.schedule = sch;
}

/* itens do dia */
function itemTime(it, date){ return it.type==='gym' ? gymSlot(date)[0] : it.time; }
function itemEnd(it, date){ return it.type==='gym' ? gymSlot(date)[1] : (it.end||''); }
function isActive(it, date){
  if (!it.enabled) return false;
  const d = dowOf(date);
  if (!it.days.includes(d)) return false;
  const g = isGym(date);
  if (it.when === 'gym' && !g) return false;
  if (it.when === 'nogym' && g) return false;
  return true;
}
const TYPE_ORDER = {task:1, water:2, meal:2, gym:3, block:0};
function timeline(date){
  return state.items
    .map((it,i)=>({it, i, t:itemTime(it,date), e:itemEnd(it,date)}))
    .filter(x=>x.it.type!=='water' && x.t && isActive(x.it, date))
    .sort((a,b)=> sortKey(toMin(a.t)) - sortKey(toMin(b.t)) || (TYPE_ORDER[a.it.type]||0) - (TYPE_ORDER[b.it.type]||0) || a.i - b.i);
}
function isDone(it, date){
  const l = getLog(date);
  if (it.type==='meal') return !!(l.meals[it.id] && l.meals[it.id].done);
  if (it.type==='gym') return !!l.wk.done;
  return !!l.done[it.id];
}
function isCheckable(it){ return it.type!=='block' || it.check; }
function progress(date){
  let done = 0, total = 0;
  timeline(date).forEach(x=>{
    if (!isCheckable(x.it)) return;
    const d = isDone(x.it, date);
    if (x.it.opt){ if (d){ done++; total++; } return; }
    total++; if (d) done++;
  });
  total++; if (getLog(date).water >= state.settings.waterGoal) done++;
  return {done, total, pct: total ? Math.round(done/total*100) : 0};
}
function mealsOf(date){ return timeline(date).filter(x=>x.it.type==='meal'); }

/* lembretes */
function reminderMin(it, date){
  if (it.remindAt) return toMin(it.remindAt);
  const t = itemTime(it, date); if (!t) return null;
  return toMin(t) - (state.settings.lead||0);
}
function remindersOf(date){
  return state.items.filter(it=>it.remind && it.type!=='block' && isActive(it,date))
    .map(it=>({it, min:reminderMin(it,date)})).filter(r=>r.min!=null && r.min>=0)
    .sort((a,b)=>a.min-b.min);
}
function reminderText(it, date){
  if (it.type==='water') return 'Hora de beber água.';
  if (it.type==='meal') return 'Hora da refeição.';
  if (it.type==='gym'){ const p = planFor(date); return p ? 'Hoje: ' + p.name + '.' : 'Hora do treino.'; }
  return 'Está na hora.';
}
function getFired(){ try{ return JSON.parse(localStorage.getItem(FIRED_KEY)||'{}'); }catch(e){ return {}; } }
function setFired(f){ try{ localStorage.setItem(FIRED_KEY, JSON.stringify(f)); }catch(e){} }
function tick(){
  if (!state.settings.remindOn) return;
  const date = todayStr(), now = nowMin(), fired = getFired();
  const f = fired[date] || [];
  const out = [];
  remindersOf(date).forEach(r=>{
    const k = r.it.id + '@' + fmtMin(r.min);
    if (now >= r.min && now - r.min <= 10 && !f.includes(k)){ f.push(k); out.push(r); }
  });
  if (out.length){
    const nf = {}; nf[date] = f; setFired(nf);
    out.forEach(r=>notify(r.it.type==='water' ? 'Água' : r.it.type==='gym' ? 'Treino' : r.it.title, reminderText(r.it, date), r.it.id));
  }
}
function notify(title, body, tag){
  try{ if (navigator.vibrate && state.settings.sound) navigator.vibrate([120,60,120]); }catch(e){}
  let shown = false;
  try{
    if ('Notification' in window && Notification.permission === 'granted'){
      if (navigator.serviceWorker && navigator.serviceWorker.controller){
        navigator.serviceWorker.ready.then(reg=>reg.showNotification(title,{body,tag,icon:'icon-192.png',badge:'icon-192.png'}));
      } else { new Notification(title,{body,tag}); }
      shown = true;
    }
  }catch(e){}
  if (!shown || document.visibilityState === 'visible') toast(title + ': ' + body);
}
async function askPermission(){
  try{
    if (!('Notification' in window)) return 'indisponivel';
    if (Notification.permission === 'granted') return 'granted';
    return await Notification.requestPermission();
  }catch(e){ return 'indisponivel'; }
}

/* calendário (.ics): alarmes que funcionam com o app fechado */
function buildICS(){
  const wk = ['SU','MO','TU','WE','TH','FR','SA'];
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Meu Dia//PT-BR//','CALSCALE:GREGORIAN'];
  const base = new Date(); const stamp = ymd(base).replace(/-/g,'') + 'T' + pad(base.getHours()) + pad(base.getMinutes()) + '00';
  const mon = parse(addDays(todayStr(), -((dowOf(todayStr())+6)%7)));  /* segunda desta semana */
  const dayDate = d => { const x = new Date(mon); x.setDate(mon.getDate() + ((d+6)%7)); return ymd(x).replace(/-/g,''); };
  const clean = s => String(s).replace(/[\\;,]/g, m=>'\\'+m).replace(/\n/g,'\\n');
  state.items.filter(it=>it.remind && it.enabled && it.type!=='block').forEach(it=>{
    const byday = []; let first = null;
    [1,2,3,4,5,6,0].forEach(d=>{
      if (isActiveOnWeekday(it, d)){ byday.push(wk[d]); if (first==null) first = d; }
    });
    if (!byday.length) return;
    const refDate = addDays(ymd(mon), (first+6)%7);
    const m = (()=>{ const t = it.type==='gym' ? gymSlot(refDate)[0] : it.time; const r = it.remindAt ? toMin(it.remindAt) : toMin(t) - (state.settings.lead||0); return r; })();
    if (m < 0) return;
    const start = dayDate(first) + 'T' + pad(Math.floor(m/60)) + pad(m%60) + '00';
    const end = dayDate(first) + 'T' + pad(Math.floor((m+10)/60)%24) + pad((m+10)%60) + '00';
    lines.push('BEGIN:VEVENT','UID:'+it.id+'-'+stamp+'@meudia','DTSTAMP:'+stamp,'DTSTART:'+start,'DTEND:'+end,
      'RRULE:FREQ=WEEKLY;BYDAY='+byday.join(','),'SUMMARY:'+clean(it.type==='water' ? 'Beber água' : it.title),
      'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+clean(it.title),'TRIGGER:PT0M','END:VALARM','END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
function isActiveOnWeekday(it, d){
  if (!it.enabled || !it.days.includes(d)) return false;
  const g = state.settings.gymDays.includes(d);
  if (it.when==='gym' && !g) return false;
  if (it.when==='nogym' && g) return false;
  return true;
}

/* backup */
function exportJSON(){ return JSON.stringify({app:'meu-dia', exportedAt:new Date().toISOString(), data:state}, null, 1); }
function importJSON(text){
  const o = JSON.parse(text);
  const s = o && o.data ? o.data : o;
  if (!s || !Array.isArray(s.items) || !s.settings || !s.logs) throw new Error('Arquivo não reconhecido.');
  state = migrate(s); save();
}
function downloadText(name, text, mime){
  try{
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], {type:mime||'text/plain'}));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    return true;
  }catch(e){ return false; }
}

/* lista de compras semanal a partir das refeições planejadas */
function weeklyShopping(){
  const days = [0,1,2,3,4,5,6], gd = state.settings.gymDays, agg = {};
  state.items.filter(it=>it.type==='meal' && it.enabled).forEach(it=>{
    let n = 0;
    days.forEach(d=>{
      if (!it.days.includes(d)) return;
      const g = gd.includes(d);
      if (it.when==='gym' && !g) return;
      if (it.when==='nogym' && g) return;
      n++;
    });
    if (!n) return;
    (it.items||[]).forEach(f=>{
      if (!f.s || f.o) return;
      const k = f.s.n + '|' + f.s.u;
      const a = agg[k] || (agg[k] = {n:f.s.n, u:f.s.u, cat:f.s.cat, q:0});
      a.q += f.s.q * n;
    });
  });
  const unitFmt = a=>{
    let q = a.q, u = a.u;
    if (u==='g'){ if (q>=1000) return (Math.round(q/100)/10).toString().replace('.',',') + ' kg'; return Math.round(q/10)*10 + ' g'; }
    if (u==='ml'){ if (q>=1000) return (Math.round(q/100)/10).toString().replace('.',',') + ' L'; return Math.round(q/10)*10 + ' ml'; }
    if (u==='fatia') return Math.ceil(q) + ' fatias';
    if (a.n==='Ovos'){ const dz = Math.ceil(q/12*2)/2; return Math.ceil(q) + ' ovos (≈ ' + String(dz).replace('.',',') + ' dúzia)'; }
    return Math.ceil(q) + ' un';
  };
  const out = {};
  Object.values(agg).forEach(a=>{ (out[a.cat] || (out[a.cat] = [])).push({key:a.n+'|'+a.u, n:a.n, label:unitFmt(a)}); });
  return out;
}

/* interface: estado de tela */
const ui = {tab:'hoje', date:todayStr(), food:'hoje', range:7, sheet:null, exSel:null, open:{}};
function toast(msg){
  let t = document.getElementById('toast');
  if (!t){ t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role','status'); document.body.appendChild(t); }
  t.textContent = msg; t.hidden = false;
  clearTimeout(toast.h); toast.h = setTimeout(()=>{ t.hidden = true; }, 3800);
}
function mutate(fn){ fn(state); save(); render(); }
