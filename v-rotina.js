/* ===== Tela: Rotina e hábitos + painel de edição de itens ===== */
const TYPE_NAME = {task:'tarefa', meal:'refeição', block:'bloco', gym:'treino', water:'lembrete de água'};
function slotByDow(d){ return (d===0||d===6) ? state.settings.gymSlot.weekend : state.settings.gymSlot.week; }
function rowsForWeekday(d){
  return state.items.map((it,i)=>({it,i}))
    .filter(x=>x.it.type!=='water' && isActiveOnWeekday(x.it, d))
    .map(x=>({it:x.it, i:x.i, t: x.it.type==='gym' ? slotByDow(d)[0] : x.it.time, e: x.it.type==='gym' ? slotByDow(d)[1] : (x.it.end||'')}))
    .filter(x=>x.t)
    .sort((a,b)=>sortKey(toMin(a.t)) - sortKey(toMin(b.t)) || a.i - b.i);
}
function sleepNights(){
  const out = [];
  [1,2,3,4,5,6,0].forEach(d=>{
    const nx = (d+1) % 7;
    const bed = state.items.find(it=>it.role==='sleep' && isActiveOnWeekday(it,d));
    const wake = state.items.find(it=>it.role==='wake' && isActiveOnWeekday(it,nx));
    if (!bed || !wake) return;
    const hrs = (1440 + toMin(wake.time) - sortKey(toMin(bed.time))) / 60;
    out.push({d, nx, bed:bed.time, wake:wake.time, hrs});
  });
  return out;
}

VIEWS.rotina = function(){
  if (ui.rd == null) ui.rd = dowOf(todayStr());
  const d = ui.rd, rows = rowsForWeekday(d);
  let out = '';

  /* sono planejado */
  const nights = sleepNights();
  if (nights.length){
    const short = nights.filter(n=>n.hrs < 6);
    out += '<section class="card stack"><div class="row sp"><h2>Sono planejado</h2><span class="lbl">horas por noite</span></div><div class="stack" style="gap:6px">' +
      nights.map(n=>'<div class="row" style="gap:8px"><span class="mono small" style="width:5.4rem">' + DOW_S[n.d] + ' → ' + DOW_S[n.nx] + '</span><div class="bar thin grow" aria-hidden="true"><i style="width:' + Math.min(100, n.hrs/9*100) + '%;' + (n.hrs<6?'background:var(--amber)':'') + '"></i></div><span class="mono small" style="width:3.2rem;text-align:right">' + String(Math.round(n.hrs*10)/10).replace('.',',') + ' h</span></div>').join('') + '</div>' +
      '<p class="small muted">Dormir às ' + esc(nights[0].bed) + ' e acordar cedo para treinar deixa poucas horas. A faixa geral recomendada para adultos é de 7 a 9 horas.</p>' +
      (short.length ? '<div class="callout warnbox"><b>Noites abaixo de 6 h:</b> ' + short.map(n=>DOW_S[n.d] + ' → ' + DOW_S[n.nx] + ' (' + String(Math.round(n.hrs*10)/10).replace('.',',') + ' h)').join(', ') + '. Se a semana pesar, tire um dos treinos de dia útil e use o domingo (Ajustes, Academia). A faculdade termina às 23h30, então o fim da noite não tem muito como ceder.</div>' : '') + '</section>';
  }

  /* dia da semana */
  out += '<div class="sec-title">Rotina da semana</div>' +
    '<div class="days" role="group" aria-label="Escolher dia da semana">' + [1,2,3,4,5,6,0].map(x=>'<button type="button" aria-pressed="' + (d===x) + '" aria-label="' + DOW_L[x] + '" data-a="rotDay" data-d="' + x + '">' + DOW_S[x].slice(0,3) + '</button>').join('') + '</div>' +
    '<div class="small muted">' + DOW_L[d] + (state.settings.gymDays.includes(d) ? ' · dia de treino' : '') + '</div>';
  if (!rows.length) out += '<div class="empty">Nada para este dia.</div>';
  else out += '<ul class="list card" style="padding:0 14px">' + rows.map(x=>{
    const it = x.it, w = whenLabel(it.when);
    const meta = [it.type==='meal' ? 'refeição' : it.type==='gym' ? 'treino' : it.type==='block' ? 'bloco' : '', x.e && it.type!=='gym' ? 'até ' + x.e : '', w].filter(Boolean).join(' · ');
    return '<li><span class="time">' + esc(x.t) + '</span><div class="grow"><button class="lnk" style="font-weight:700;text-decoration:none" data-a="editItem" data-id="' + it.id + '">' + esc(it.title) + '</button>' +
      (meta ? '<div class="tiny muted">' + esc(meta) + '</div>' : '') + '</div>' + (it.remind ? '<span class="muted" title="Com lembrete">' + ic('bell','sm') + '</span>' : '') + '<button class="ib" data-a="editItem" data-id="' + it.id + '" aria-label="Editar ' + esc(it.title) + '">' + ic('edit','sm') + '</button></li>';
  }).join('') + '</ul>';
  out += '<div class="row wrapr"><button class="btn acc" data-a="newItem" data-type="task">' + ic('plus','sm') + ' Nova tarefa</button><button class="btn ghost" data-a="newItem" data-type="block">' + ic('plus','sm') + ' Novo bloco de horário</button></div>';

  /* todas as tarefas */
  const tasks = state.items.filter(it=>it.type==='task' || it.type==='block');
  out += '<details class="card"><summary>Todas as tarefas e blocos (' + tasks.length + ')</summary><ul class="list">' + tasks.map(it=>
    '<li><div class="grow"><button class="lnk" style="font-weight:700;text-decoration:none" data-a="editItem" data-id="' + it.id + '">' + esc(it.title) + '</button><div class="tiny muted">' + esc((it.time||'') + (it.end?' às '+it.end:'') + ' · ' + daysSummary(it.days) + (it.when?' · '+whenLabel(it.when):'')) + '</div></div>' +
    swHTML(it.enabled, 'data-a="itemOn" data-id="' + it.id + '"', 'Ativar ' + it.title) + '</li>').join('') + '</ul></details>';
  out += '<p class="small muted">Os horários de segunda a sexta seguem a rotina que você descreveu. Fim de semana é uma sugestão minha: ajuste como preferir. Refeições ficam em Comida, treino em Treino, lembretes em Ajustes.</p>';
  return out;
};
A.rotDay = el => { ui.rd = +el.dataset.d; render(); };
A.itemOn = el => mutate(()=>{ const it = state.items.find(i=>i.id===el.dataset.id); if (it) it.enabled = !it.enabled; });
A.editItem = el => { const it = state.items.find(i=>i.id===el.dataset.id); if (it) openSheet({k:'item', id:it.id, draft:clone(it)}); };
A.newItem = el => {
  const t = el.dataset.type;
  const base = {id:uid(t[0]), type:t, title:'', time:'12:00', days:[1,2,3,4,5], when:null, enabled:true, remind:false, remindAt:null, opt:false};
  if (t==='block'){ base.end = '13:00'; base.check = false; }
  if (t==='meal'){ base.items = []; base.alts = []; base.swaps = []; base.note = ''; }
  openSheet({k:'item', isNew:true, draft:base});
};

/* ----- painel de edição ----- */
SHEETS.item = function(s){
  const d = s.draft, t = d.type, gymT = t==='gym';
  const keyName = {task:'tarefa', meal:'refeição', block:'bloco de horário', gym:'treino', water:'lembrete de água'}[t];
  let h = '<h2>' + (s.isNew ? 'Nova ' : 'Editar ') + keyName + '</h2>';
  if (!gymT) h += fld('Nome', inp('title', d.title, 'text', 'id="f-title" placeholder="ex.: Estudar 30 min"'));
  if (gymT) h += '<p class="small muted">O horário do treino é definido em Ajustes, Academia.</p>';
  else h += '<div class="grid2">' + fld(t==='block' ? 'Início' : 'Horário', inp('time', d.time, 'time', 'id="f-time"')) + (t==='block' ? fld('Fim', inp('end', d.end||'', 'time', 'id="f-end"')) : '') + '</div>';
  h += '<div class="field"><span>Dias da semana</span>' + daysChips(d.days, 'sDay') + '</div>';
  if (!gymT) h += '<div class="field"><span>Quando</span><div class="seg">' +
    [[null,'Sempre'],['gym','Dia de treino'],['nogym','Sem treino']].map(([v,l])=>'<button type="button" aria-pressed="' + (d.when===v) + '" data-a="sWhen" data-v="' + (v||'') + '">' + l + '</button>').join('') + '</div></div>';
  if (t!=='block') h += '<div class="row sp"><span>Lembrete</span>' + swHTML(d.remind, 'data-a="sFlag" data-k="remind"', 'Lembrete') + '</div>' +
    (d.remind ? fld('Avisar às (vazio: no horário do item)', inp('remindAt', d.remindAt||'', 'time', 'id="f-remindAt"')) : '');
  if (t==='block') h += '<div class="row sp"><span>Posso marcar como concluído</span>' + swHTML(d.check, 'data-a="sFlag" data-k="check"', 'Concluível') + '</div>';
  if (t==='meal'){
    h += '<div class="row sp"><span>Opcional (não pesa no progresso)</span>' + swHTML(d.opt, 'data-a="sFlag" data-k="opt"', 'Opcional') + '</div>' +
      fld('Alimentos (um por linha)', '<textarea data-f="itemsText" id="f-items" rows="5">' + esc(d.itemsText != null ? d.itemsText : (d.items||[]).map(f=>f.t).join('\n')) + '</textarea>') +
      fld('Alternativas (uma por linha)', '<textarea data-f="altsText" id="f-alts" rows="3">' + esc(d.altsText != null ? d.altsText : (d.alts||[]).join('\n')) + '</textarea>') +
      fld('Observação', '<textarea data-f="note" id="f-note" rows="2">' + esc(d.note||'') + '</textarea>');
  }
  h += '<div class="row wrapr"><button class="btn acc grow" data-a="saveItem">Salvar</button><button class="btn ghost" data-a="close">Cancelar</button></div>';
  if (!s.isNew && !gymT) h += s.confirmDel
    ? '<div class="callout">Excluir "' + esc(d.title) + '"? Os registros antigos continuam no histórico.<div class="row wrapr" style="margin-top:8px"><button class="btn danger sm" data-a="delItem">Excluir de vez</button><button class="btn ghost sm" data-a="sFlag" data-k="__cd">Manter</button></div></div>'
    : '<button class="btn danger block" data-a="sFlag" data-k="__cd">' + ic('trash','sm') + ' Excluir</button>';
  return h;
};
A.sDay = el => {
  captureSheet(); const d = ui.sheet.draft, n = +el.dataset.d;
  d.days = d.days.includes(n) ? d.days.filter(x=>x!==n) : d.days.concat(n); renderSheet();
};
A.sWhen = el => { captureSheet(); ui.sheet.draft.when = el.dataset.v || null; renderSheet(); };
A.sFlag = el => {
  captureSheet(); const k = el.dataset.k;
  if (k==='__cd') ui.sheet.confirmDel = !ui.sheet.confirmDel; else ui.sheet.draft[k] = !ui.sheet.draft[k];
  renderSheet();
};
A.saveItem = () => {
  captureSheet(); const s = ui.sheet, d = s.draft;
  if (d.type!=='gym' && !String(d.title||'').trim()){ toast('Dê um nome ao item.'); return; }
  if (d.type!=='gym' && !/^\d{2}:\d{2}$/.test(d.time||'')){ toast('Informe o horário.'); return; }
  if (!d.days.length){ toast('Escolha pelo menos um dia.'); return; }
  d.title = String(d.title||'').trim() || d.title;
  if (!d.remindAt) d.remindAt = null;
  if (d.type==='block' && !d.end) d.end = '';
  if (d.type==='meal'){
    const old = d.items || [];
    const lines = String(d.itemsText != null ? d.itemsText : old.map(f=>f.t).join('\n')).split('\n').map(x=>x.trim()).filter(Boolean);
    d.items = lines.map((t,i)=>{ const o = old.find(f=>f.t===t) || {}; return Object.assign({t}, o.s ? {s:o.s} : {}, o.o ? {o:true} : {}); });
    d.alts = String(d.altsText != null ? d.altsText : (d.alts||[]).join('\n')).split('\n').map(x=>x.trim()).filter(Boolean);
  }
  delete d.itemsText; delete d.altsText;
  mutate(()=>{
    const i = state.items.findIndex(x=>x.id===d.id);
    if (i >= 0) state.items[i] = Object.assign(state.items[i], d); else state.items.push(d);
  });
  closeSheet(); toast('Salvo.');
};
A.delItem = () => { const id = ui.sheet.draft.id; mutate(()=>{ state.items = state.items.filter(x=>x.id!==id); }); closeSheet(); toast('Excluído.'); };
