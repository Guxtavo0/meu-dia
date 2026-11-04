/* ===== Tela: Alimentação ===== */
const CAT_ORDER = [CAT.prot, CAT.lat, CAT.gra, CAT.pad, CAT.fru, CAT.out];
function quiet(fn){ fn(); save(); }

A.foodTab = el => { ui.food = el.dataset.v; render(); };
A.mealOpen = el => { ui.open[el.dataset.id] = !ui.open[el.dataset.id]; render(); };
const mealLog = (date, id) => { const l = getLog(date, true); return l.meals[id] || (l.meals[id] = {done:false,text:'',kcal:'',prot:''}); };
C.mealText = el => quiet(()=>{ mealLog(ui.date, el.dataset.id).text = el.value; });
C.mealKcal = el => quiet(()=>{ mealLog(ui.date, el.dataset.id).kcal = el.value; });
C.mealProt = el => quiet(()=>{ mealLog(ui.date, el.dataset.id).prot = el.value; });
A.mealUseSuggested = el => mutate(()=>{
  const it = state.items.find(i=>i.id===el.dataset.id), m = mealLog(ui.date, it.id);
  m.text = (it.items||[]).filter(f=>!f.o).map(f=>f.t).join('; '); m.done = true;
});
A.remindOn = el => mutate(()=>{ const it = state.items.find(i=>i.id===el.dataset.id); if (it) it.remind = !it.remind; });
A.shopCheck = el => mutate(s=>{ const c = s.shop.checked; c[el.dataset.k] = !c[el.dataset.k]; });
A.shopExtraCheck = el => mutate(s=>{ const x = s.shop.extra.find(e=>e.id===el.dataset.id); if (x) x.done = !x.done; });
A.shopExtraDel = el => mutate(s=>{ s.shop.extra = s.shop.extra.filter(e=>e.id!==el.dataset.id); });
A.shopAdd = () => {
  const i = $('#shopNew'), v = i && i.value.trim(); if (!v) return;
  mutate(s=>{ s.shop.extra.push({id:uid('x'), t:v, done:false}); });
};
A.shopClear = () => mutate(s=>{ s.shop.checked = {}; s.shop.extra.forEach(e=>e.done = false); });

function mealCard(x, date){
  const it = x.it, l = getLog(date), m = l.meals[it.id] || {}, open = !!ui.open[it.id], done = !!m.done;
  let h = '<article class="card meal"><div class="meal-h"><div class="tl-time">' + esc(x.t) + '</div>' +
    '<div><button class="lnk" style="text-decoration:none" data-a="mealOpen" data-id="' + it.id + '" aria-expanded="' + open + '">' + esc(it.title) + '</button>' + (it.opt ? '<span class="tag">opcional</span>' : '') +
    (m.text ? '<div class="tl-sub">' + esc(m.text) + '</div>' : '') + '</div>' +
    chkHTML(done, 'data-a="tgl" data-id="' + it.id + '"', (done?'Desmarcar ':'Marcar ') + it.title, true) + '</div>';
  if (open){
    h += '<div class="meal-b">' + (it.note ? '<p class="small muted">' + esc(it.note) + '</p>' : '') +
      '<div><div class="lbl">Sugestão</div><ul>' + (it.items||[]).map(f=>'<li' + (f.o ? ' class="muted"' : '') + '>' + esc(f.t) + (f.o ? ' (se precisar)' : '') + '</li>').join('') + '</ul>' +
      '<div class="row wrapr" style="margin-top:8px"><button class="btn ghost sm" data-a="mealUseSuggested" data-id="' + it.id + '">Comi o sugerido</button></div></div>' +
      fld('O que comi de verdade', '<textarea id="mt-' + it.id + '" data-c="mealText" data-id="' + it.id + '" placeholder="ex.: 2 ovos, pão com requeijão, café com leite">' + esc(m.text||'') + '</textarea>');
    if (state.settings.trackMacros) h += '<div class="grid2">' + fld('Calorias (opcional)', '<input type="number" inputmode="numeric" id="mk-' + it.id + '" data-c="mealKcal" data-id="' + it.id + '" value="' + esc(m.kcal||'') + '" placeholder="kcal">') +
      fld('Proteína g (opcional)', '<input type="number" inputmode="numeric" id="mp-' + it.id + '" data-c="mealProt" data-id="' + it.id + '" value="' + esc(m.prot||'') + '" placeholder="g">') + '</div>';
    if ((it.alts||[]).length) h += '<div><div class="lbl">Alternativas acessíveis</div><ul>' + it.alts.map(a=>'<li>' + esc(a) + '</li>').join('') + '</ul></div>';
    if ((it.swaps||[]).length) h += '<div class="stack"><div class="lbl">Trocas</div>' + it.swaps.map(s=>'<div class="swap"><span>' + esc(s[0]) + '</span><span class="ar">' + ic('r','sm') + '</span><b>' + esc(s[1]) + '</b></div>').join('') + '</div>';
    h += '<div class="row wrapr"><button class="btn ghost sm" data-a="editItem" data-id="' + it.id + '">' + ic('edit','sm') + ' Editar refeição</button></div></div>';
  }
  return h + '</article>';
}

VIEWS.comida = function(){
  const date = ui.date;
  let out = '<div class="seg" role="group" aria-label="Seção de alimentação">' +
    [['hoje','Dia'],['compras','Compras'],['plano','Plano']].map(([v,l])=>'<button type="button" aria-pressed="' + (ui.food===v) + '" data-a="foodTab" data-v="' + v + '">' + l + '</button>').join('') + '</div>';

  if (ui.food==='hoje'){
    const ms = mealsOf(date), req = ms.filter(x=>!x.it.opt), l = getLog(date);
    const doneN = req.filter(x=>isDone(x.it, date)).length;
    const left = ms.filter(x=>!x.it.opt && !isDone(x.it, date));
    out += '<section class="card stack"><div class="row sp"><h2>Refeições</h2><span class="mono small">' + doneN + ' de ' + req.length + '</span></div>' +
      '<div class="bar" aria-hidden="true"><i style="width:' + (req.length ? Math.round(doneN/req.length*100) : 0) + '%"></i></div>' +
      '<p class="small muted">' + (left.length ? 'Faltam: ' + left.map(x=>esc(x.it.title) + ' (' + esc(x.t) + ')').join(', ') + '.' : (req.length ? 'Todas as refeições marcadas.' : 'Sem refeições neste dia.')) + '</p>';
    if (state.settings.trackMacros){
      let k = 0, p = 0; Object.values(l.meals).forEach(m=>{ k += +m.kcal || 0; p += +m.prot || 0; });
      const kg = state.settings.kcalGoal, pg = state.settings.protGoal;
      out += '<div class="grid2"><div class="stat"><b>' + k + '</b><span>kcal registradas' + (kg ? ' (meta ' + esc(kg) + ')' : '') + '</span></div><div class="stat"><b>' + p + '</b><span>g de proteína' + (pg ? ' (meta ' + esc(pg) + ')' : '') + '</span></div></div>';
    }
    out += '</section>';
    out += (ms.length ? '<p class="small muted">Toque no nome da refeição para ver o cardápio, as alternativas e as trocas.</p>' : '') + ms.map(x=>mealCard(x, date)).join('');
    /* hidratação */
    const rem = remindersOf(date).filter(r=>r.it.type==='water').map(r=>fmtMin(r.min));
    out += '<section class="card stack"><h2>Hidratação</h2><ul class="small" style="margin:0;padding-left:18px"><li>Um copo ao acordar e um junto de cada refeição.</li><li>Deixe uma garrafa na mesa do trabalho e outra na mochila da faculdade.</li>' +
      '<li>Meta atual: ' + state.settings.waterGoal + ' copos de ' + state.settings.glassMl + ' ml (' + (state.settings.waterGoal*state.settings.glassMl) + ' ml). Ajuste em Ajustes.</li>' +
      (rem.length ? '<li>Lembretes de água neste dia: ' + rem.join(', ') + '.</li>' : '') + '</ul>' +
      '<p class="tiny muted">Sede, calor e treino mudam a necessidade. Urina bem clara ao longo do dia costuma indicar que está bom.</p></section>';
    return out;
  }

  if (ui.food==='compras'){
    const shop = weeklyShopping(), ck = state.shop.checked;
    out += '<p class="small muted">Estimativa para 1 pessoa, calculada a partir das refeições ativas na semana (muda se você mudar os dias de treino ou o plano). Arroz e feijão estão em quantidade crua. Ajuste ao seu consumo.</p>';
    CAT_ORDER.forEach(c=>{
      if (!shop[c]) return;
      out += '<section class="card"><div class="lbl" style="margin-bottom:4px">' + esc(c) + '</div><ul class="list">' +
        shop[c].map(f=>'<li>' + chkHTML(ck[f.key], 'data-a="shopCheck" data-k="' + esc(f.key) + '"', f.n, true) + '<div class="grow"' + (ck[f.key] ? ' style="color:var(--ink-2);text-decoration:line-through"' : '') + '>' + esc(f.n) + '</div><span class="mono small">' + esc(f.label) + '</span></li>').join('') + '</ul></section>';
    });
    out += '<section class="card stack"><div class="lbl">Outros itens</div><ul class="list">' +
      state.shop.extra.map(e=>'<li>' + chkHTML(e.done, 'data-a="shopExtraCheck" data-id="' + e.id + '"', e.t, true) + '<div class="grow"' + (e.done ? ' style="color:var(--ink-2);text-decoration:line-through"' : '') + '>' + esc(e.t) + '</div><button class="ib" data-a="shopExtraDel" data-id="' + e.id + '" aria-label="Remover ' + esc(e.t) + '">' + ic('x','sm') + '</button></li>').join('') + '</ul>' +
      '<div class="row"><input type="text" id="shopNew" placeholder="Adicionar item" aria-label="Novo item da lista"><button class="btn acc" data-a="shopAdd" aria-label="Adicionar">' + ic('plus','sm') + '</button></div>' +
      '<button class="btn ghost sm" data-a="shopClear">Desmarcar tudo</button></section>';
    return out;
  }

  /* plano */
  const meals = state.items.filter(it=>it.type==='meal').slice().sort((a,b)=>sortKey(toMin(a.time)) - sortKey(toMin(b.time)));
  out += '<p class="small muted">Todas as refeições cadastradas. Cada uma vale para os dias indicados. Para mudar horário, dias ou alimentos, toque em editar.</p>' +
    '<ul class="list card" style="padding:0 14px">' + meals.map(it=>
      '<li><span class="time">' + esc(it.time) + '</span><div class="grow"><div style="font-weight:700">' + esc(it.title) + (it.enabled ? '' : ' <span class="tag">desativada</span>') + '</div><div class="tiny muted">' + esc(daysSummary(it.days) + (it.when ? ' · ' + whenLabel(it.when) : '')) + '</div></div>' +
      swHTML(it.remind, 'data-a="remindOn" data-id="' + it.id + '"', 'Lembrete de ' + it.title) + '<button class="ib" data-a="editItem" data-id="' + it.id + '" aria-label="Editar ' + esc(it.title) + '">' + ic('edit','sm') + '</button></li>').join('') + '</ul>' +
    '<button class="btn acc" data-a="newItem" data-type="meal">' + ic('plus','sm') + ' Nova refeição</button>' +
    '<div class="callout">As quantidades são aproximadas e não definem meta de calorias. Para definir calorias e proteína de verdade, o app precisa de idade, sexo e objetivo (veja Ajustes, Perfil). Em caso de condição de saúde ou restrição alimentar, vale combinar com um nutricionista.</div>';
  return out;
};
