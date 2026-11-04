/* ===== Tela: Ajustes (perfil, academia, água, lembretes, backup) ===== */
const OPT = {
  sex:[['','Prefiro não informar'],['f','Feminino'],['m','Masculino']],
  exp:[['','Não respondi'],['nunca','Nunca treinei musculação'],['pouca','Já treinei, mas parei (menos de 6 meses de prática)'],['inter','Treino há mais de 6 meses']],
  goal:[['','Não respondi'],['massa','Ganhar massa muscular'],['gordura','Perder gordura'],['saude','Saúde e constância']]
};
const selHTML = (id, k, opts, val) => '<select id="' + id + '" data-c="prof" data-k="' + k + '">' + opts.map(o=>'<option value="' + o[0] + '"' + (o[0]===val ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select>';

C.prof = el => quiet(()=>{ state.profile[el.dataset.k] = el.value; });
C.setNum = el => mutate(s=>{ const v = parseInt(el.value, 10); s.settings[el.dataset.k] = v > 0 ? v : s.settings[el.dataset.k]; });
C.setStr = el => quiet(()=>{ state.settings[el.dataset.k] = el.value; });
C.slot = el => quiet(()=>{ state.settings.gymSlot[el.dataset.w][+el.dataset.i] = el.value || state.settings.gymSlot[el.dataset.w][+el.dataset.i]; });
C.remTime = el => quiet(()=>{ const it = state.items.find(i=>i.id===el.dataset.id); if (it) it.remindAt = (el.value && el.value !== it.time) ? el.value : null; });
C.lead = el => mutate(s=>{ s.settings.lead = +el.value; });
A.theme = el => mutate(s=>{ s.settings.theme = el.dataset.v; });
A.gymDay = el => mutate(s=>{
  const d = +el.dataset.d, g = s.settings.gymDays;
  s.settings.gymDays = g.includes(d) ? g.filter(x=>x!==d) : g.concat(d);
  rebuildSchedule();
});
A.flag = el => mutate(s=>{ s.settings[el.dataset.k] = !s.settings[el.dataset.k]; });
A.remMaster = async () => {
  const on = !state.settings.remindOn;
  if (on){
    const p = await askPermission();
    if (p === 'denied') toast('As notificações estão bloqueadas no navegador. Os avisos aparecerão só dentro do app.');
    else if (p === 'indisponivel') toast('Este navegador não oferece notificações. Os avisos aparecerão só dentro do app.');
  }
  mutate(s=>{ s.settings.remindOn = on; });
};
A.remTest = async () => { await askPermission(); notify('Meu Dia', 'Este é um lembrete de teste.', 'teste'); };

function copyOrShow(title, text){
  const show = () => openSheet({k:'text', title, text});
  try{
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(()=>toast('Copiado.'), show); else show();
  }catch(e){ show(); }
}
A.expJson = () => {
  const name = 'meu-dia-backup-' + todayStr() + '.json', ok = PWA && downloadText(name, exportJSON(), 'application/json');
  if (ok) toast('Backup gerado. Procure na pasta de downloads.'); else copyOrShow('Backup', exportJSON());
};
A.copyJson = () => copyOrShow('Backup', exportJSON());
A.expIcs = () => {
  const txt = buildICS(), ok = PWA && downloadText('meu-dia-lembretes.ics', txt, 'text/calendar');
  if (ok) toast('Arquivo gerado. Abra-o para importar no calendário.'); else copyOrShow('Lembretes (.ics)', txt);
};
C.importFile = el => {
  const f = el.files && el.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => { try{ importJSON(String(r.result)); render(); toast('Dados restaurados.'); }catch(e){ toast('Não consegui ler este arquivo.'); } };
  r.readAsText(f);
};
A.impPaste = () => {
  const t = $('#impText'); if (!t || !t.value.trim()) return;
  try{ importJSON(t.value); render(); toast('Dados restaurados.'); }catch(e){ toast('Texto de backup inválido.'); }
};
A.resetAsk = el => { ui.confirm = ui.confirm === el.dataset.v ? null : el.dataset.v; render(); };
A.resetDo = () => {
  const k = ui.confirm; ui.confirm = null;
  if (k === 'logs') mutate(s=>{ s.logs = {}; }); else { state = clone(SEED); save(); render(); }
  toast(k === 'logs' ? 'Registros apagados.' : 'Padrões restaurados.');
};
SHEETS.text = s => '<h2>' + esc(s.title) + '</h2><p class="small muted">Selecione tudo, copie e guarde em um lugar seguro (por exemplo, enviando para você mesmo).</p><textarea id="shareText" readonly rows="10" style="font-family:var(--f-mono);font-size:12px">' + esc(s.text) + '</textarea><div class="row wrapr"><button class="btn acc grow" data-a="selText">Selecionar tudo</button><button class="btn ghost" data-a="close">Fechar</button></div>';
A.selText = () => { const t = $('#shareText'); if (t){ t.focus(); t.select(); try{ document.execCommand('copy'); toast('Copiado.'); }catch(e){} } };

function permLabel(){
  try{ if (!('Notification' in window)) return 'indisponível neste navegador'; return {granted:'permitidas', denied:'bloqueadas no navegador', default:'ainda não permitidas'}[Notification.permission] || Notification.permission; }catch(e){ return 'indisponível'; }
}
function remRows(list){
  return '<ul class="list">' + list.map(it=>{
    const t = it.type==='gym' ? state.settings.gymSlot.week[0] : it.time;
    return '<li><div class="grow"><div style="font-weight:700;line-height:1.25">' + esc(it.type==='water' ? 'Beber água' : it.title) + '</div><div class="tiny muted">' + esc(daysSummary(it.days) + (it.when ? ' · ' + whenLabel(it.when) : '')) + '</div></div>' +
      '<input type="time" id="rt-' + it.id + '" style="width:7.2rem" aria-label="Horário do aviso" value="' + esc(it.remindAt || t || '') + '" data-c="remTime" data-id="' + it.id + '">' +
      swHTML(it.remind, 'data-a="remindOn" data-id="' + it.id + '"', 'Lembrete: ' + it.title) + '</li>';
  }).join('') + '</ul>';
}

VIEWS.ajustes = function(){
  const st = state.settings, p = state.profile;
  let out = installCard();

  out += '<section class="card stack"><h2>Aparência</h2><div class="seg" role="group" aria-label="Tema">' + [['auto','Automático'],['light','Claro'],['dark','Escuro']].map(([v,l])=>'<button type="button" aria-pressed="' + (st.theme===v) + '" data-a="theme" data-v="' + v + '">' + l + '</button>').join('') + '</div></section>';

  out += '<section class="card stack"><h2>Perfil</h2><p class="small muted">Estas respostas ficam só neste aparelho e servem para afinar o treino e o cardápio. Sem elas, nada de calorias ou metas é calculado.</p>' +
    '<div class="grid2">' + fld('Altura (cm)', '<input type="number" inputmode="numeric" id="p-height" data-c="prof" data-k="height" value="' + esc(p.height) + '">') + fld('Peso informado', '<input type="text" id="p-wn" data-c="prof" data-k="weightNote" value="' + esc(p.weightNote) + '">') + '</div>' +
    '<div class="grid2">' + fld('Idade', '<input type="number" inputmode="numeric" id="p-age" data-c="prof" data-k="age" value="' + esc(p.age) + '">') + fld('Sexo', selHTML('p-sex', 'sex', OPT.sex, p.sex)) + '</div>' +
    fld('Experiência com musculação', selHTML('p-exp', 'exp', OPT.exp, p.exp)) + fld('Objetivo principal', selHTML('p-goal', 'goal', OPT.goal, p.goal)) +
    fld('Lesões, dores, condições de saúde, alergias ou restrições alimentares', '<textarea id="p-limits" data-c="prof" data-k="limits" placeholder="Se não houver, deixe em branco">' + esc(p.limits) + '</textarea>') +
    fld('Dias de faculdade e horário real de dormir', '<input type="text" id="p-class" data-c="prof" data-k="classDays" placeholder="ex.: seg a qui; durmo à 0h30" value="' + esc(p.classDays) + '">') +
    fld('Tempo de deslocamento até a academia e equipamentos disponíveis', '<input type="text" id="p-gym" data-c="prof" data-k="gymInfo" placeholder="ex.: 15 min a pé; tem halteres e máquinas" value="' + esc(p.gymInfo) + '">') + '</section>';

  out += '<section class="card stack"><h2>Academia</h2><div class="field"><span>Dias de treino</span><div class="days" role="group" aria-label="Dias de treino">' +
    [1,2,3,4,5,6,0].map(d=>'<button type="button" aria-pressed="' + st.gymDays.includes(d) + '" aria-label="' + DOW_L[d] + '" data-a="gymDay" data-d="' + d + '">' + DOW_S[d].slice(0,3) + '</button>').join('') + '</div></div>' +
    '<p class="small muted">Com 3 dias, deixe pelo menos um dia livre entre eles. Ao mudar os dias, as fichas são redistribuídas na ordem. O cartão Sono planejado, em Rotina, mostra quanto sobra de sono em cada noite.</p>' +
    '<div class="grid2">' + fld('Dia útil: início', '<input type="time" id="gs-w0" data-c="slot" data-w="week" data-i="0" value="' + esc(st.gymSlot.week[0]) + '">') + fld('Dia útil: fim', '<input type="time" id="gs-w1" data-c="slot" data-w="week" data-i="1" value="' + esc(st.gymSlot.week[1]) + '">') +
    fld('Fim de semana: início', '<input type="time" id="gs-e0" data-c="slot" data-w="weekend" data-i="0" value="' + esc(st.gymSlot.weekend[0]) + '">') + fld('Fim de semana: fim', '<input type="time" id="gs-e1" data-c="slot" data-w="weekend" data-i="1" value="' + esc(st.gymSlot.weekend[1]) + '">') + '</div></section>';

  out += '<section class="card stack"><h2>Água</h2><div class="grid2">' + fld('Meta (copos por dia)', '<input type="number" inputmode="numeric" min="1" max="30" id="s-wg" data-c="setNum" data-k="waterGoal" value="' + st.waterGoal + '">') +
    fld('Tamanho do copo (ml)', '<input type="number" inputmode="numeric" min="50" max="1000" step="50" id="s-gl" data-c="setNum" data-k="glassMl" value="' + st.glassMl + '">') + '</div><p class="small muted">Meta atual: ' + (st.waterGoal*st.glassMl) + ' ml por dia. É um ponto de partida, ajuste conforme calor, treino e orientação profissional.</p></section>';

  out += '<section class="card stack"><div class="row sp"><h2>Metas de nutrição</h2>' + swHTML(st.trackMacros, 'data-a="flag" data-k="trackMacros"', 'Acompanhar calorias e proteína') + '</div>' +
    '<p class="small muted">Opcional e desligado por padrão. Quando ligado, cada refeição ganha campos para calorias e proteína.</p>' +
    (st.trackMacros ? '<div class="grid2">' + fld('Meta de calorias (kcal)', '<input type="number" inputmode="numeric" id="s-kc" data-c="setStr" data-k="kcalGoal" value="' + esc(st.kcalGoal) + '" placeholder="definida por você">') + fld('Meta de proteína (g)', '<input type="number" inputmode="numeric" id="s-pg" data-c="setStr" data-k="protGoal" value="' + esc(st.protGoal) + '" placeholder="definida por você">') + '</div>' +
      '<div class="callout">Referência geral para adultos saudáveis que treinam força: 1,4 a 2,0 g de proteína por kg de peso por dia (cerca de 110 a 160 g para 78 a 80 kg). Isso não é prescrição. O app não sugere meta de calorias: use a que um nutricionista ou médico definir.</div>' : '') + '</section>';

  /* lembretes */
  const meals = state.items.filter(i=>i.type==='meal').sort((a,b)=>sortKey(toMin(a.time)) - sortKey(toMin(b.time)));
  const tasks = state.items.filter(i=>i.type==='task' || i.type==='gym').sort((a,b)=>sortKey(toMin(a.time || '05:15')) - sortKey(toMin(b.time || '05:15')));
  const water = state.items.filter(i=>i.type==='water').sort((a,b)=>toMin(a.time) - toMin(b.time));
  out += '<section class="card stack"><div class="row sp"><h2>Lembretes</h2>' + swHTML(st.remindOn, 'data-a="remMaster"', 'Ativar lembretes') + '</div>' +
    '<p class="small muted">Notificações: ' + permLabel() + '.</p>' +
    '<div class="callout"><b>Como funcionam:</b> o app avisa no horário enquanto estiver aberto ou em segundo plano. Com o app totalmente fechado, o celular só dispara avisos que estejam no calendário. Para isso, exporte os lembretes abaixo e abra o arquivo no seu calendário: cada aviso vira um alarme que toca mesmo com o app fechado. No iPhone, as notificações só funcionam com o app instalado na tela de início.</div>' +
    '<div class="grid2">' + fld('Avisar antes (min)', '<select id="s-lead" data-c="lead">' + [0,5,10,15].map(v=>'<option value="' + v + '"' + (st.lead===v ? ' selected' : '') + '>' + (v ? v + ' min antes' : 'No horário') + '</option>').join('') + '</select>') +
    '<div class="field"><span>Vibrar ao avisar</span><div class="row" style="min-height:44px">' + swHTML(st.sound, 'data-a="flag" data-k="sound"', 'Vibrar') + '</div></div></div>' +
    '<div class="row wrapr"><button class="btn ghost sm" data-a="remTest">' + ic('bell','sm') + ' Testar aviso</button><button class="btn ghost sm" data-a="expIcs">' + ic('down','sm') + ' Exportar para o calendário (.ics)</button></div>' +
    '<details><summary>Refeições (' + meals.length + ')</summary>' + remRows(meals) + '</details>' +
    '<details><summary>Tarefas e treino (' + tasks.length + ')</summary>' + remRows(tasks) + '</details>' +
    '<details><summary>Água (' + water.length + ')</summary>' + remRows(water) + '<button class="btn ghost sm" data-a="newItem" data-type="water">' + ic('plus','sm') + ' Novo lembrete de água</button></details></section>';

  /* backup */
  out += '<section class="card stack"><h2>Backup dos dados</h2><p class="small muted">Tudo fica salvo apenas neste aparelho, sem conta. Se você limpar os dados do navegador, desinstalar o app ou trocar de celular, os registros se perdem. Faça backup de vez em quando (por exemplo, uma vez por semana).</p>' +
    '<div class="row wrapr"><button class="btn acc sm" data-a="expJson">' + ic('down','sm') + ' Baixar backup</button><button class="btn ghost sm" data-a="copyJson">Copiar texto do backup</button></div>' +
    '<div class="field"><span>Restaurar de um arquivo de backup</span><input type="file" id="impFile" accept=".json,application/json" data-c="importFile"></div>' +
    '<details><summary>Restaurar colando o texto</summary><div class="stack"><textarea id="impText" rows="4" placeholder="Cole aqui o texto do backup"></textarea><button class="btn ghost sm" data-a="impPaste">Restaurar</button></div></details>' +
    '<p class="tiny muted">' + (storageOk ? 'Armazenamento local funcionando.' : 'Atenção: o navegador não está deixando salvar neste aparelho agora. Os dados ficam só nesta sessão.') + '</p></section>';

  /* zona de risco */
  out += '<section class="card stack"><h2>Apagar</h2><div class="row wrapr"><button class="btn danger sm" data-a="resetAsk" data-v="logs">Apagar todos os registros</button><button class="btn danger sm" data-a="resetAsk" data-v="all">Restaurar tudo ao padrão</button></div>' +
    (ui.confirm ? '<div class="callout"><b>' + (ui.confirm==='logs' ? 'Apagar todos os registros dos dias?' : 'Voltar rotina, cardápio, ficha e ajustes ao padrão e apagar os registros?') + '</b> Não dá para desfazer. Faça um backup antes.<div class="row wrapr" style="margin-top:8px"><button class="btn danger sm" data-a="resetDo">Sim, apagar</button><button class="btn ghost sm" data-a="resetAsk" data-v="' + ui.confirm + '">Cancelar</button></div></div>' : '') + '</section>';
  return out;
};
