/* ===== Tela: Academia ===== */
function lastSets(exId, before){
  const ds = Object.keys(state.logs).filter(d=>d < before).sort().reverse();
  for (const d of ds){
    const e = state.logs[d].wk && state.logs[d].wk.ex && state.logs[d].wk.ex[exId];
    if (e && e.sets && e.sets.some(s=>s && (s.kg!=='' || s.reps!==''))) return {date:d, sets:e.sets};
  }
  return null;
}
const exLog = (date, id, n) => {
  const l = getLog(date, true), e = l.wk.ex[id] || (l.wk.ex[id] = {done:false, sets:[]});
  while (e.sets.length < n) e.sets.push({kg:'', reps:''});
  return e;
};
A.trTab = el => { ui.tr = el.dataset.v; render(); };
A.exDone = el => mutate(()=>{ const e = exLog(ui.date, el.dataset.id, +el.dataset.n); e.done = !e.done; });
C.setKg = el => quiet(()=>{ exLog(ui.date, el.dataset.ex, +el.dataset.i + 1).sets[+el.dataset.i].kg = el.value; });
C.setReps = el => quiet(()=>{ exLog(ui.date, el.dataset.ex, +el.dataset.i + 1).sets[+el.dataset.i].reps = el.value; });
C.wkNote = el => quiet(()=>{ getLog(ui.date, true).wk.note = el.value; });
C.planPick = el => mutate(()=>{ getLog(ui.date, true).plan = el.value; });
A.exRest = el => startRest(parseInt(el.dataset.s, 10) || 60);
A.finishWk = () => { const was = getLog(ui.date).wk.done; toggleItem('gym', ui.date); if (!was) toast('Treino registrado. Bom trabalho.'); };
A.histGo = el => { ui.date = el.dataset.d; ui.tr = 'hoje'; render(false); window.scrollTo(0,0); };
C.schedPlan = el => mutate(s=>{ s.schedule[el.dataset.d] = el.value; });

VIEWS.treino = function(){
  if (!ui.tr) ui.tr = 'hoje';
  const date = ui.date;
  let out = '<div class="seg" role="group" aria-label="Seção de treino">' +
    [['hoje','Treino'],['ficha','Ficha'],['hist','Histórico']].map(([v,l])=>'<button type="button" aria-pressed="' + (ui.tr===v) + '" data-a="trTab" data-v="' + v + '">' + l + '</button>').join('') + '</div>';

  if (ui.tr==='hoje'){
    if (!isGym(date)){
      const days = state.settings.gymDays.slice().sort((a,b)=>((a+6)%7)-((b+6)%7));
      out += '<section class="card stack"><h2>Dia de descanso</h2><p class="muted">É quando o músculo se recupera. Nada para registrar hoje.</p>' +
        '<p class="small">Dias de treino da semana: <b>' + (days.length ? days.map(d=>DOW_S[d] + ' (' + esc((state.plans.find(p=>p.id===state.schedule[d])||{name:'?'}).name) + ')').join(', ') : 'nenhum') + '</b>.</p>' +
        '<button class="btn ghost" data-a="gymToggle">Treinar neste dia mesmo assim</button></section>';
      return out;
    }
    const plan = planFor(date), l = getLog(date);
    if (!plan) return out + '<div class="empty">Nenhuma ficha cadastrada. Crie uma em Ficha.</div>';
    const slot = gymSlot(date), exs = plan.ex;
    const doneN = exs.filter(e=>l.wk.ex[e.id] && l.wk.ex[e.id].done).length;
    out += '<section class="card stack"><div class="row sp"><h2>' + esc(plan.name) + '</h2><span class="pill' + (l.wk.done ? ' ok' : '') + '">' + (l.wk.done ? 'Concluído' : doneN + ' de ' + exs.length) + '</span></div>' +
      '<div class="small muted">' + esc(plan.focus) + ' · ' + esc(plan.est) + ' · ' + esc(slot[0]) + ' às ' + esc(slot[1]) + ' (com deslocamento)</div>' +
      '<div class="bar" aria-hidden="true"><i style="width:' + (exs.length ? Math.round(doneN/exs.length*100) : 0) + '%"></i></div>' +
      (state.plans.length > 1 ? fld('Treino de hoje', '<select id="planPick" data-c="planPick">' + state.plans.map(p=>'<option value="' + p.id + '"' + (p.id===plan.id ? ' selected' : '') + '>' + esc(p.name + ': ' + p.focus) + '</option>').join('') + '</select>') : '') + '</section>';
    out += '<div class="callout"><b>Aquecimento:</b> 5 min de caminhada ou bike leve e 1 a 2 séries leves do primeiro exercício. Termine cada série com 2 a 3 repetições sobrando.</div>';
    exs.forEach(ex=>{
      const e = l.wk.ex[ex.id] || {done:false, sets:[]}, last = lastSets(ex.id, date), n = ex.sets;
      let rows = '';
      for (let i=0; i<n; i++){
        const s = e.sets[i] || {kg:'', reps:''}, ls = last && last.sets[i];
        rows += '<div class="n">' + (i+1) + '</div>' +
          '<input type="number" inputmode="decimal" step="0.5" min="0" id="kg-' + ex.id + '-' + i + '" aria-label="Carga da série ' + (i+1) + ' em kg" placeholder="' + esc(ls && ls.kg !== '' ? ls.kg : 'kg') + '" value="' + esc(s.kg) + '" data-c="setKg" data-ex="' + ex.id + '" data-i="' + i + '">' +
          '<input type="number" inputmode="numeric" min="0" id="rp-' + ex.id + '-' + i + '" aria-label="Repetições da série ' + (i+1) + '" placeholder="' + esc(ls && ls.reps !== '' ? ls.reps : 'reps') + '" value="' + esc(s.reps) + '" data-c="setReps" data-ex="' + ex.id + '" data-i="' + i + '">';
      }
      out += '<article class="card ex' + (e.done ? ' done' : '') + '"><div class="ex-h"><div class="grow"><div class="nm">' + esc(ex.name) + '</div>' +
        '<div class="tiny muted mono">' + n + ' × ' + esc(ex.reps) + ' · descanso ' + esc(ex.rest) + '</div></div>' +
        '<button class="ib" data-a="exRest" data-s="' + esc(ex.rest) + '" aria-label="Cronômetro de descanso de ' + esc(ex.rest) + '">' + ic('timer','sm') + '</button>' +
        chkHTML(e.done, 'data-a="exDone" data-id="' + ex.id + '" data-n="' + n + '"', (e.done?'Desmarcar ':'Concluir ') + ex.name, true) + '</div>' +
        (last ? '<div class="hint" style="padding-bottom:6px">Última vez (' + esc(dateLabel(last.date).split(',')[1].trim()) + '): ' + esc(last.sets.filter(s=>s.kg!==''||s.reps!=='').map(s=>(s.kg!=='' ? s.kg + ' kg' : '') + (s.reps!=='' ? ' × ' + s.reps : '')).join(' · ')) + '</div>' : '') +
        '<div class="sets"><span class="h">Série</span><span class="h" style="text-align:center">Carga (kg)</span><span class="h" style="text-align:center">Reps</span>' + rows + '</div>' +
        (ex.tip ? '<details style="padding:0 14px"><summary class="small">Como fazer</summary><p class="small muted" style="padding-bottom:12px">' + esc(ex.tip) + '</p></details>' : '') + '</article>';
    });
    out += '<section class="card stack">' + fld('Como foi o treino?', '<textarea id="wkNote" data-c="wkNote" placeholder="Opcional: dor, disposição, o que ajustar na próxima vez">' + esc(l.wk.note||'') + '</textarea>') +
      '<button class="btn ' + (l.wk.done ? 'ghost' : 'acc') + ' block" data-a="finishWk">' + (l.wk.done ? 'Reabrir treino' : 'Concluir treino') + '</button></section>';
    return out;
  }

  if (ui.tr==='ficha'){
    const order = [1,2,3,4,5,6,0];
    out += '<section class="card stack"><h2>Semana</h2><div class="grid3" style="grid-template-columns:repeat(7,1fr);gap:4px">' + order.map(d=>{
      const g = state.settings.gymDays.includes(d), p = g && state.plans.find(x=>x.id===state.schedule[d]);
      return '<div class="stat" style="padding:8px 2px;text-align:center;' + (g ? 'border-color:var(--accent)' : '') + '"><span class="mono" style="margin:0">' + DOW_S[d] + '</span><b style="font-size:24px;' + (g ? 'color:var(--accent)' : 'color:var(--ink-2)') + '">' + (g ? esc(p ? p.id : '?') : '–') + '</b></div>';
    }).join('') + '</div><p class="small muted">Dias de treino e horários ficam em Ajustes, Academia. Fora desses dias é descanso.</p>' +
      state.settings.gymDays.slice().sort((a,b)=>((a+6)%7)-((b+6)%7)).map(d=>'<div class="row sp"><span>' + DOW_L[d] + '</span><select id="sch-' + d + '" style="width:auto;min-width:9rem" data-c="schedPlan" data-d="' + d + '">' + state.plans.map(p=>'<option value="' + p.id + '"' + (state.schedule[d]===p.id ? ' selected' : '') + '>' + esc(p.name) + '</option>').join('') + '</select></div>').join('') + '</section>';
    out += '<div class="callout warnbox">Esta ficha é um ponto de partida para <b>iniciante</b>: corpo inteiro, 3 dias por semana, sem exigir equipamento raro. Ela só fica definitiva quando você confirmar seu nível, lesões e objetivo (Ajustes, Perfil).</div>';
    state.plans.forEach(p=>{
      out += '<details class="card"' + (ui.open['pl'+p.id] ? ' open' : '') + '><summary>' + esc(p.name) + ': ' + esc(p.focus) + '</summary><ol style="margin:0 0 10px;padding-left:20px">' +
        p.ex.map(e=>'<li style="margin:4px 0">' + esc(e.name) + ' <span class="mono small muted">' + e.sets + ' × ' + esc(e.reps) + ' · ' + esc(e.rest) + '</span></li>').join('') + '</ol>' +
        '<button class="btn ghost sm" data-a="editPlan" data-id="' + p.id + '">' + ic('edit','sm') + ' Editar ' + esc(p.name) + '</button></details>';
    });
    out += '<button class="btn acc" data-a="newPlan">' + ic('plus','sm') + ' Nova ficha</button>';
    out += '<div class="sec-title">Orientações</div>' + TRAIN_GUIDE.map(g=>'<details class="card"><summary>' + esc(g[0]) + '</summary><p class="small muted" style="padding-bottom:6px">' + esc(g[1]) + '</p></details>').join('');
    return out;
  }

  /* histórico */
  const ds = Object.keys(state.logs).filter(d=>{ const w = state.logs[d].wk; return w && (w.done || Object.values(w.ex||{}).some(e=>e.done || (e.sets||[]).some(s=>s.kg!==''||s.reps!==''))); }).sort().reverse();
  out += '<p class="small muted">Toque em um treino para ver ou editar os registros daquele dia.</p>';
  if (!ds.length) out += '<div class="empty">Ainda não há treinos registrados.</div>';
  else out += '<ul class="list card" style="padding:0 14px">' + ds.slice(0,60).map(d=>{
    const w = state.logs[d].wk, p = state.plans.find(x=>x.id===(w.planId || state.logs[d].plan)) || null;
    const nEx = Object.values(w.ex||{}).filter(e=>e.done).length;
    const top = []; Object.keys(w.ex||{}).forEach(id=>{ (w.ex[id].sets||[]).forEach(s=>{ if (+s.kg > 0) top.push(+s.kg); }); });
    return '<li><div class="grow"><button class="lnk" style="text-decoration:none" data-a="histGo" data-d="' + d + '">' + esc(dateLabel(d)) + '</button><div class="tiny muted">' + esc(p ? p.name : 'Treino') + ' · ' + nEx + ' exercício' + (nEx===1?'':'s') + ' concluído' + (nEx===1?'':'s') + (top.length ? ' · maior carga ' + Math.max.apply(null, top) + ' kg' : '') + '</div></div>' + (w.done ? '<span class="pill ok">Feito</span>' : '<span class="pill">Parcial</span>') + '</li>';
  }).join('') + '</ul>';
  return out;
};

/* ----- edição de ficha ----- */
A.editPlan = el => { const p = state.plans.find(x=>x.id===el.dataset.id); if (p) openSheet({k:'plan', draft:clone(p)}); };
A.newPlan = () => openSheet({k:'plan', isNew:true, draft:{id:uid('p'), name:'Treino ' + String.fromCharCode(65 + state.plans.length), focus:'Corpo inteiro', est:'≈ 60 min', ex:[{id:uid('e'), name:'', sets:3, reps:'8 a 12', rest:'90 s', tip:''}]}});
SHEETS.plan = function(s){
  const d = s.draft;
  let h = '<h2>' + (s.isNew ? 'Nova ficha' : 'Editar ficha') + '</h2>' + fld('Nome', inp('name', d.name, 'text', 'id="p-name"')) +
    '<div class="grid2">' + fld('Foco', inp('focus', d.focus, 'text', 'id="p-focus"')) + fld('Duração', inp('est', d.est, 'text', 'id="p-est"')) + '</div><div class="lbl">Exercícios</div>';
  d.ex.forEach((e,i)=>{
    h += '<div class="card stack" style="background:var(--bg)"><div class="row"><b class="mono">' + (i+1) + '</b><div class="grow"><input type="text" id="e-name-' + i + '" aria-label="Nome do exercício ' + (i+1) + '" data-f="name" data-ex="' + i + '" value="' + esc(e.name) + '" placeholder="Nome do exercício"></div>' +
      '<button class="ib" data-a="exMove" data-i="' + i + '" data-n="-1" aria-label="Subir"' + (i===0?' disabled':'') + '>' + ic('up','sm') + '</button><button class="ib" data-a="exMove" data-i="' + i + '" data-n="1" aria-label="Descer"' + (i===d.ex.length-1?' disabled':'') + '>' + ic('down','sm') + '</button></div>' +
      '<div class="grid3">' + fld('Séries', '<input type="number" inputmode="numeric" min="1" max="10" id="e-sets-' + i + '" data-f="sets" data-ex="' + i + '" value="' + esc(e.sets) + '">') +
      fld('Repetições', '<input type="text" id="e-reps-' + i + '" data-f="reps" data-ex="' + i + '" value="' + esc(e.reps) + '">') +
      fld('Descanso', '<input type="text" id="e-rest-' + i + '" data-f="rest" data-ex="' + i + '" value="' + esc(e.rest) + '">') + '</div>' +
      fld('Como fazer (opcional)', '<textarea rows="2" id="e-tip-' + i + '" data-f="tip" data-ex="' + i + '">' + esc(e.tip||'') + '</textarea>') +
      '<button class="btn danger sm" data-a="exDel" data-i="' + i + '">' + ic('trash','sm') + ' Remover exercício</button></div>';
  });
  h += '<button class="btn ghost" data-a="exAdd">' + ic('plus','sm') + ' Adicionar exercício</button>' +
    '<div class="row wrapr"><button class="btn acc grow" data-a="savePlan">Salvar</button><button class="btn ghost" data-a="close">Cancelar</button></div>';
  if (!s.isNew && state.plans.length > 1) h += s.confirmDel
    ? '<div class="callout">Excluir "' + esc(d.name) + '"? Os registros antigos continuam no histórico.<div class="row wrapr" style="margin-top:8px"><button class="btn danger sm" data-a="delPlan">Excluir de vez</button><button class="btn ghost sm" data-a="planCd">Manter</button></div></div>'
    : '<button class="btn danger block" data-a="planCd">' + ic('trash','sm') + ' Excluir ficha</button>';
  return h;
};
A.planCd = () => { captureSheet(); ui.sheet.confirmDel = !ui.sheet.confirmDel; renderSheet(); };
A.exAdd = () => { captureSheet(); ui.sheet.draft.ex.push({id:uid('e'), name:'', sets:3, reps:'8 a 12', rest:'90 s', tip:''}); renderSheet(); };
A.exDel = el => { captureSheet(); ui.sheet.draft.ex.splice(+el.dataset.i, 1); renderSheet(); };
A.exMove = el => {
  captureSheet(); const a = ui.sheet.draft.ex, i = +el.dataset.i, j = i + (+el.dataset.n);
  if (j < 0 || j >= a.length) return; const t = a[i]; a[i] = a[j]; a[j] = t; renderSheet();
};
A.savePlan = () => {
  captureSheet(); const d = ui.sheet.draft;
  if (!String(d.name).trim()){ toast('Dê um nome à ficha.'); return; }
  d.ex = d.ex.filter(e=>String(e.name).trim()).map(e=>Object.assign(e, {sets: Math.max(1, parseInt(e.sets,10) || 3)}));
  if (!d.ex.length){ toast('Adicione pelo menos um exercício.'); return; }
  mutate(()=>{ const i = state.plans.findIndex(p=>p.id===d.id); if (i >= 0) state.plans[i] = d; else state.plans.push(d); });
  closeSheet(); toast('Ficha salva.');
};
A.delPlan = () => {
  const id = ui.sheet.draft.id;
  mutate(()=>{ state.plans = state.plans.filter(p=>p.id!==id); Object.keys(state.schedule).forEach(k=>{ if (state.schedule[k]===id) state.schedule[k] = state.plans[0].id; }); });
  closeSheet(); toast('Ficha excluída.');
};
