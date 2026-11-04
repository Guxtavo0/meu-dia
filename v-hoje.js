/* ===== Tela: Hoje ===== */
function toggleItem(id, date){
  const it = state.items.find(i=>i.id===id); if (!it) return;
  mutate(()=>{
    const l = getLog(date, true);
    if (it.type==='meal'){ const m = l.meals[id] || (l.meals[id] = {done:false,text:'',kcal:'',prot:''}); m.done = !m.done; }
    else if (it.type==='gym'){ l.wk.done = !l.wk.done; if (l.wk.done){ const p = planFor(date); l.wk.planId = p ? p.id : null; } }
    else l.done[id] = !l.done[id];
  });
}
A.tgl = el => toggleItem(el.dataset.id, ui.date);
A.openItem = el => {
  const it = state.items.find(i=>i.id===el.dataset.id); if (!it) return;
  if (it.type==='meal'){ ui.tab = 'comida'; ui.food = 'hoje'; ui.open = {}; ui.open[it.id] = true; }
  else if (it.type==='gym'){ ui.tab = 'treino'; ui.tr = 'hoje'; }
  else { openSheet({k:'item', id:it.id, draft:clone(it)}); return; }
  render(false); window.scrollTo(0,0);
};
A.gymToggle = () => mutate(()=>{ const l = getLog(ui.date, true); l.gym = !isGym(ui.date); });
A.glass = el => mutate(()=>{ const l = getLog(ui.date, true), n = +el.dataset.n; l.water = (l.water === n+1) ? n : n+1; });
A.waterAdj = el => mutate(()=>{ const l = getLog(ui.date, true); l.water = Math.max(0, (l.water||0) + (+el.dataset.n)); });
A.energy = el => mutate(()=>{ const l = getLog(ui.date, true); l.sleep.energy = (String(l.sleep.energy) === el.dataset.v) ? '' : el.dataset.v; });
C.sleepH = el => { getLog(ui.date, true).sleep.h = el.value; save(); };
C.dayW = el => { getLog(ui.date, true).weight = el.value; save(); };
C.dayNote = el => { getLog(ui.date, true).note = el.value; save(); };
C.jump = el => { if (el.value){ ui.date = el.value; render(false); window.scrollTo(0,0); } };
A.hideAsk = () => mutate(s=>{ s.settings.hideAsk = true; });

function untilLabel(min, nowM){
  const d = sortKey(min) - sortKey(nowM);
  if (d <= 0) return 'agora';
  if (d < 60) return 'em ' + d + ' min';
  const h = Math.floor(d/60), m = d % 60;
  return 'em ' + h + ' h' + (m ? ' ' + pad(m) : '');
}

function tlRow(x, date, nm){
  const it = x.it, done = isDone(it, date), blk = it.type==='block', l = getLog(date);
  const past = date === todayStr() && sortKey(toMin(x.t)) < sortKey(nm);
  let name = esc(it.title), sub = '';
  if (it.type==='gym'){
    const p = planFor(date);
    name = 'Treino' + (p ? ': ' + esc(p.name) : '');
    sub = (p ? esc(p.focus) + ' · ' + esc(p.est) + ' · ' : '') + 'termina por volta de ' + esc(x.e);
  }
  if (blk) sub = (it.sub ? esc(it.sub) + ' · ' : '') + esc(x.t) + ' às ' + esc(x.e);
  if (it.type==='meal'){ const m = l.meals[it.id]; if (m && m.text) sub = esc(m.text); }
  const tag = it.opt ? '<span class="tag">opcional</span>' : '';
  const nameHTML = (it.type==='meal' || it.type==='gym' || blk)
    ? '<button class="lnk" data-a="openItem" data-id="' + it.id + '">' + name + '</button>' : name;
  const right = isCheckable(it) ? chkHTML(done, 'data-a="tgl" data-id="' + it.id + '"', (done?'Desmarcar ':'Marcar ') + it.title, it.type==='meal') : '<span class="chk-empty"></span>';
  return '<li class="tl-item' + (done?' done':'') + (blk?' blk':'') + (past && !done?' past':'') + '">' +
    '<div class="tl-time">' + esc(x.t) + '</div>' +
    '<div class="tl-body"><div class="tl-name">' + nameHTML + tag + '</div>' + (sub ? '<div class="tl-sub">' + sub + '</div>' : '') + '</div>' + right + '</li>';
}

VIEWS.hoje = function(){
  const date = ui.date, today = todayStr(), isToday = date === today;
  const pr = progress(date), log = getLog(date), gym = isGym(date), plan = planFor(date);
  const tl = timeline(date), nm = nowMin(), nk = sortKey(nm);
  let out = '';

  /* perguntas pendentes */
  const p = state.profile;
  if (!state.settings.hideAsk && (p.exp==='' || p.goal==='' || p.age==='')){
    out += '<section class="card stack"><h2>Preciso de algumas respostas</h2><p class="small muted">O treino e o cardápio são um ponto de partida para iniciante. Para afinar (nível, objetivo, idade, lesões, dias de faculdade), preencha o perfil. Nada é inventado: sem resposta, nada é calculado.</p><div class="row wrapr"><button class="btn acc sm" data-a="go" data-t="ajustes">Preencher perfil</button><button class="btn ghost sm" data-a="hideAsk">Agora não</button></div></section>';
  }

  /* progresso */
  out += '<section class="card stack"><div class="prog"><div class="pct">' + pr.pct + '<small>%</small></div><div class="meta"><div class="tl-name">' + pr.done + ' de ' + pr.total + ' feitos</div><div class="small muted">' +
    (gym ? 'Dia de treino' + (plan ? ': ' + esc(plan.name) : '') : 'Dia de descanso do treino') + '</div></div>' +
    '<div class="bar" role="progressbar" aria-valuenow="' + pr.pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="Progresso do dia"><i style="width:' + pr.pct + '%"></i></div></div>' +
    '<div class="row wrapr sp"><span class="small muted">' + (isToday ? '' : 'Você está vendo ' + esc(dateLabel(date)) + '. ') + '</span><span class="row">' +
    (isToday ? '' : '<button class="btn ghost sm" data-a="today">Ir para hoje</button>') +
    '<button class="btn ghost sm" data-a="gymToggle">' + (gym ? (isToday ? 'Hoje não vou treinar' : 'Sem treino neste dia') : (isToday ? 'Treinar hoje' : 'Treino neste dia')) + '</button></span></div></section>';

  /* próximo */
  if (isToday){
    const nxt = tl.find(x=>isCheckable(x.it) && !isDone(x.it, date) && sortKey(toMin(x.t)) >= nk - 0);
    if (nxt){
      const nmz = nxt.it.type==='gym' ? 'Treino' + (plan ? ': ' + plan.name : '') : nxt.it.title;
      out += '<section class="card next stack"><div class="row sp"><span class="lbl" style="color:var(--signal)">Próximo · ' + untilLabel(toMin(nxt.t), nm) + '</span><span class="mono small">' + esc(nxt.t) + '</span></div>' +
        '<div class="t">' + esc(nmz) + '</div><div class="row wrapr"><button class="btn acc sm" data-a="tgl" data-id="' + nxt.it.id + '">' + ic('check','sm') + ' Marcar como feito</button>' +
        (nxt.it.type==='meal' || nxt.it.type==='gym' ? '<button class="btn ghost sm" data-a="openItem" data-id="' + nxt.it.id + '">Ver detalhes</button>' : '') + '</div></section>';
    } else {
      out += '<section class="card"><div class="tl-name">Nada mais agendado para hoje.</div><div class="small muted">O que ficou sem marcar continua disponível na linha do tempo.</div></section>';
    }
  }

  /* linha do tempo */
  out += '<div class="sec-title">Cronograma</div>';
  if (!tl.length) out += '<div class="empty">Nada cadastrado para este dia. Adicione tarefas em Rotina.</div>';
  else {
    let html = '', placed = !isToday;
    tl.forEach(x=>{
      if (!placed && sortKey(toMin(x.t)) > nk){ html += '<li class="tl-item nowrow"><div class="tl-time"></div><div class="tl-body now">agora ' + fmtMin(nm) + '</div><span></span></li>'; placed = true; }
      html += tlRow(x, date, nm);
    });
    if (!placed) html += '<li class="tl-item nowrow"><div class="tl-time"></div><div class="tl-body now">agora ' + fmtMin(nm) + '</div><span></span></li>';
    out += '<ul class="tl">' + html + '</ul>';
  }

  /* água */
  const goal = state.settings.waterGoal, gl = state.settings.glassMl, n = log.water || 0, total = Math.max(goal, n);
  let glasses = '';
  for (let i=0; i<total; i++) glasses += '<button class="glass" aria-pressed="' + (i < n) + '" aria-label="Copo ' + (i+1) + '" data-a="glass" data-n="' + i + '"></button>';
  out += '<section class="card stack"><div class="row sp"><h2>Água</h2><span class="mono small">' + n + ' de ' + goal + ' copos · ' + (n*gl) + ' ml</span></div><div class="water">' + glasses + '</div>' +
    '<div class="row"><button class="btn ghost sm" data-a="waterAdj" data-n="-1" aria-label="Tirar um copo">' + ic('minus','sm') + '</button><button class="btn ghost sm" data-a="waterAdj" data-n="1">' + ic('plus','sm') + ' Copo de ' + gl + ' ml</button></div></section>';

  /* sono e disposição */
  const en = String(log.sleep.energy || '');
  out += '<section class="card stack"><h2>Como estou</h2><div class="grid2">' +
    fld('Horas dormidas na noite anterior', '<input type="number" inputmode="decimal" min="0" max="16" step="0.5" id="sleepH" placeholder="ex.: 6" value="' + esc(log.sleep.h) + '" data-c="sleepH">') +
    fld('Peso em kg (opcional)', '<input type="number" inputmode="decimal" min="20" max="400" step="0.1" id="dayW" placeholder="ex.: 79,5" value="' + esc(log.weight||'') + '" data-c="dayW">') + '</div>' +
    '<div class="field"><span>Disposição (1 a 5)</span><div class="seg">' +
    [1,2,3,4,5].map(v=>'<button type="button" aria-pressed="' + (en===String(v)) + '" data-a="energy" data-v="' + v + '">' + v + '</button>').join('') + '</div></div>' +
    fld('Anotação do dia', '<textarea id="dayNote" placeholder="Opcional" data-c="dayNote">' + esc(log.note) + '</textarea>') + '</section>';

  /* outro dia */
  out += '<section class="card flat"><div class="field"><span>Consultar ou editar outro dia</span><input type="date" id="jump" value="' + date + '" max="' + addDays(today, 30) + '" data-c="jump"></div></section>';
  return out;
};
