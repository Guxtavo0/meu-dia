/* ===== Tela: Progresso e estatísticas ===== */
const CW = 320, CH = 150, ML = 32, MR = 10, MT = 10, MB = 22, PH = CH - MT - MB;
const fmtN = v => String(Math.round(v*10)/10).replace('.', ',');
const shortDate = d => { const x = parse(d); return x.getDate() + '/' + (x.getMonth()+1); };

function hasData(d){
  const l = state.logs[d]; if (!l) return false;
  return Object.values(l.done||{}).some(Boolean) || Object.values(l.meals||{}).some(m=>m && m.done) || (l.water||0) > 0 ||
    !!(l.wk && l.wk.done) || Object.values((l.wk && l.wk.ex) || {}).some(e=>e && e.done);
}
function lastDays(n){ const t = todayStr(), a = []; for (let i=n-1; i>=0; i--) a.push(addDays(t, -i)); return a; }
const sy = (v, min, max) => MT + (1 - (v-min)/(max-min)) * PH;
function gridLines(ticks, min, max, fmt){
  return ticks.map(t=>{ const y = sy(t, min, max).toFixed(1);
    return '<line class="grid" x1="' + ML + '" x2="' + (CW-MR) + '" y1="' + y + '" y2="' + y + '"/><text x="' + (ML-6) + '" y="' + (+y+3) + '" text-anchor="end">' + fmt(t) + '</text>'; }).join('');
}
function tableTwin(head, rows){
  return '<details><summary class="small">Ver valores em tabela</summary><div style="overflow-x:auto"><table class="tbl"><thead><tr>' + head.map(h=>'<th>' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' +
    rows.map(r=>'<tr>' + r.map((c,i)=>'<td' + (i ? ' class="n"' : '') + '>' + esc(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div></details>';
}
let roId = 0;
function readout(){ return '<div class="small mono readout" id="ro' + (++roId) + '" aria-live="polite">Toque em uma marca para ver o valor.</div>'; }
A.pt = el => {
  const card = el.closest('.card'), ro = card && card.querySelector('.readout');
  if (ro) ro.textContent = el.dataset.t;
};

/* colunas: values 0..max, null = sem dado */
function columns(values, labels, xl, max, fmt, unit, tk){
  const n = values.length, slot = (CW - ML - MR) / n, bw = Math.min(24, slot * 0.7), r = 4;
  const ticks = tk || [0, max/2, max];
  let g = gridLines(ticks, 0, max, v=>String(Math.round(v)));
  values.forEach((v, i)=>{
    const x = ML + slot*i + (slot-bw)/2, txt = labels[i] + ': ' + (v==null ? 'sem registro' : fmt(v) + unit);
    if (v==null || v<=0){ g += '<rect class="zero" x="' + x.toFixed(1) + '" y="' + (CH-MB-2) + '" width="' + bw.toFixed(1) + '" height="2" fill="var(--line)"/>'; }
    else {
      const h = Math.max(3, v/max*PH), y = CH - MB - h, rr = Math.min(r, bw/2, h);
      g += '<path fill="var(--accent)" d="M' + x.toFixed(1) + ',' + (y+h).toFixed(1) + 'V' + (y+rr).toFixed(1) + 'Q' + x.toFixed(1) + ',' + y.toFixed(1) + ' ' + (x+rr).toFixed(1) + ',' + y.toFixed(1) + 'H' + (x+bw-rr).toFixed(1) + 'Q' + (x+bw).toFixed(1) + ',' + y.toFixed(1) + ' ' + (x+bw).toFixed(1) + ',' + (y+rr).toFixed(1) + 'V' + (y+h).toFixed(1) + 'Z"/>';
    }
    g += '<rect class="hit" data-a="pt" data-t="' + esc(txt) + '" x="' + (ML + slot*i).toFixed(1) + '" y="' + MT + '" width="' + slot.toFixed(1) + '" height="' + PH + '" fill="transparent"/>';
    if (xl[i]) g += '<text x="' + (x + bw/2).toFixed(1) + '" y="' + (CH-6) + '" text-anchor="middle">' + esc(xl[i]) + '</text>';
  });
  return '<svg class="chart" viewBox="0 0 ' + CW + ' ' + CH + '" role="img" aria-label="Gráfico de colunas">' + g + '</svg>';
}
/* linha: pts [{t:número, v, label}] */
function lineChart(pts, min, max, ticks, fmt, unit, xl){
  const t0 = pts[0].t, t1 = pts[pts.length-1].t, span = (t1 - t0) || 1, inner = CW - ML - MR - 8;
  const px = p => ML + 4 + (pts.length===1 ? inner/2 : (p.t - t0)/span * inner);
  let g = gridLines(ticks, min, max, fmt);
  const d = pts.map((p,i)=>(i ? 'L' : 'M') + px(p).toFixed(1) + ',' + sy(p.v, min, max).toFixed(1)).join('');
  if (pts.length > 1) g += '<path class="ar" d="' + d + 'L' + px(pts[pts.length-1]).toFixed(1) + ',' + (CH-MB) + 'L' + px(pts[0]).toFixed(1) + ',' + (CH-MB) + 'Z"/><path class="ln" d="' + d + '"/>';
  pts.forEach((p,i)=>{
    const last = i === pts.length-1, cx = px(p).toFixed(1), cy = sy(p.v, min, max).toFixed(1);
    if (last || pts.length <= 24) g += '<circle class="pt' + (last ? ' last' : '') + '" cx="' + cx + '" cy="' + cy + '" r="' + (last ? 5 : 4) + '" stroke="var(--surface)" stroke-width="2"/>';
    g += '<circle data-a="pt" data-t="' + esc(p.label + ': ' + fmt(p.v) + unit) + '" cx="' + cx + '" cy="' + cy + '" r="14" fill="transparent"/>';
  });
  const lp = pts[pts.length-1], lx = px(lp), ly = sy(lp.v, min, max);
  g += '<text x="' + Math.min(CW-MR, lx + 2).toFixed(1) + '" y="' + Math.max(MT + 8, ly - 10).toFixed(1) + '" text-anchor="end" style="fill:var(--ink);font-weight:500">' + fmt(lp.v) + unit + '</text>';
  g += '<text x="' + ML + '" y="' + (CH-6) + '" text-anchor="start">' + esc(xl[0]) + '</text>';
  if (pts.length > 1) g += '<text x="' + (CW-MR) + '" y="' + (CH-6) + '" text-anchor="end">' + esc(xl[1]) + '</text>';
  return '<svg class="chart" viewBox="0 0 ' + CW + ' ' + CH + '" role="img" aria-label="Gráfico de linha">' + g + '</svg>';
}

C.exSel = el => { ui.exSel = el.value; render(); };
C.wToday = el => {
  const v = el.value.replace(',', '.'); mutate(()=>{ getLog(todayStr(), true).weight = v; });
  if (v) toast('Peso registrado.');
};
A.heatGo = el => { ui.date = el.dataset.d; ui.tab = 'hoje'; render(false); window.scrollTo(0,0); };
A.range = el => { ui.range = +el.dataset.n; render(); };

VIEWS.progresso = function(){
  roId = 0;
  const n = ui.range || 7, days = lastDays(n), today = todayStr();
  const tracked = days.filter(hasData);
  let out = '<div class="seg" role="group" aria-label="Período">' + [[7,'7 dias'],[30,'30 dias']].map(([v,l])=>'<button type="button" aria-pressed="' + (n===v) + '" data-a="range" data-n="' + v + '">' + l + '</button>').join('') + '</div>';

  /* resumo */
  const avg = tracked.length ? Math.round(tracked.reduce((a,d)=>a + progress(d).pct, 0) / tracked.length) : null;
  let mDone = 0, mTot = 0, gymDone = 0, gymPlan = 0;
  tracked.forEach(d=>{ mealsOf(d).filter(x=>!x.it.opt).forEach(x=>{ mTot++; if (isDone(x.it, d)) mDone++; }); });
  days.forEach(d=>{ if (isGym(d) && d <= today && (hasData(d) || state.logs[d])) gymPlan++; if (getLog(d).wk.done) gymDone++; });
  const wkStart = addDays(today, -((dowOf(today)+6)%7)), wkDays = [0,1,2,3,4,5,6].map(i=>addDays(wkStart, i));
  const wkDone = wkDays.filter(d=>getLog(d).wk.done).length, wkPlan = state.settings.gymDays.length;
  const good = tracked.filter(d=>progress(d).pct >= 50).length;
  out += '<div class="stats3"><div class="stat"><b>' + wkDone + '/' + wkPlan + '</b><span>treinos nesta semana</span></div>' +
    '<div class="stat"><b>' + (avg==null ? '–' : avg + '%') + '</b><span>média de tarefas</span></div>' +
    '<div class="stat"><b>' + (mTot ? Math.round(mDone/mTot*100) + '%' : '–') + '</b><span>refeições feitas</span></div></div>';
  out += '<p class="small muted">' + (tracked.length
    ? 'Você registrou ' + tracked.length + ' de ' + n + ' dias e passou de metade das tarefas em ' + good + '. Dias imperfeitos contam: o que pesa é voltar no dia seguinte.'
    : 'Ainda não há registros neste período. Marque tarefas em Hoje e os números aparecem aqui.') + '</p>';

  /* conclusão por dia */
  const vals = days.map(d=>hasData(d) ? progress(d).pct : null);
  const xl = days.map((d,i)=> n===7 ? DOW_S[dowOf(d)].slice(0,1).toUpperCase() : (i===0 || i===14 || i===n-1 ? shortDate(d) : ''));
  out += '<section class="card stack"><h2>Tarefas concluídas por dia</h2>' + columns(vals, days.map(d=>dateLabel(d)), xl, 100, v=>String(Math.round(v)), '%') + readout() +
    tableTwin(['Dia','Concluído'], days.map((d,i)=>[dateLabel(d), vals[i]==null ? 'sem registro' : vals[i] + '%'])) + '</section>';

  /* últimos 28 dias */
  const h28 = lastDays(28), first = dowOf(h28[0]), offset = (first + 6) % 7;
  let heat = ['seg','ter','qua','qui','sex','sáb','dom'].map(x=>'<div class="head" aria-hidden="true">' + x.slice(0,1).toUpperCase() + '</div>').join('');
  for (let i=0; i<offset; i++) heat += '<div class="head" aria-hidden="true"></div>';
  h28.forEach(d=>{
    const p = hasData(d) ? progress(d).pct : -1, lv = p < 0 ? '' : p >= 70 ? ' l3' : p >= 40 ? ' l2' : ' l1';
    heat += '<div role="button" tabindex="0" class="' + lv.trim() + (d===today ? ' today' : '') + '" data-a="heatGo" data-d="' + d + '" aria-label="' + esc(dateLabel(d)) + (p<0 ? ', sem registro' : ', ' + p + '%') + '">' + parse(d).getDate() + '</div>';
  });
  out += '<section class="card stack"><h2>Últimos 28 dias</h2><div class="heat">' + heat + '</div><p class="tiny muted">Quanto mais escuro, mais tarefas feitas. Cinza é dia sem registro. Toque para abrir o dia.</p></section>';

  /* frequência das refeições */
  const byTitle = {};
  tracked.forEach(d=>{ mealsOf(d).filter(x=>!x.it.opt).forEach(x=>{ const b = byTitle[x.it.title] || (byTitle[x.it.title] = {t:x.it.title, m:toMin(x.t), d:0, n:0}); b.n++; if (isDone(x.it, d)) b.d++; }); });
  const mrows = Object.values(byTitle).sort((a,b)=>sortKey(a.m) - sortKey(b.m));
  if (mrows.length) out += '<section class="card stack"><h2>Frequência das refeições</h2><div class="stack" style="gap:8px">' + mrows.map(r=>
    '<div><div class="row sp small"><span>' + esc(r.t) + '</span><span class="mono">' + r.d + '/' + r.n + '</span></div><div class="bar thin" aria-hidden="true"><i style="width:' + Math.round(r.d/r.n*100) + '%"></i></div></div>').join('') + '</div>' +
    tableTwin(['Refeição','Feitas','Previstas'], mrows.map(r=>[r.t, String(r.d), String(r.n)])) + '</section>';

  /* evolução das cargas */
  const exs = []; state.plans.forEach(p=>p.ex.forEach(e=>exs.push({id:e.id, name:e.name, plan:p.name})));
  if (!ui.exSel || !exs.find(e=>e.id===ui.exSel)) ui.exSel = exs.length ? exs[0].id : null;
  if (ui.exSel){
    const pts = []; Object.keys(state.logs).sort().forEach(d=>{
      const e = state.logs[d].wk && state.logs[d].wk.ex && state.logs[d].wk.ex[ui.exSel]; if (!e) return;
      let best = 0, reps = ''; (e.sets||[]).forEach(s=>{ if (+s.kg > best){ best = +s.kg; reps = s.reps; } });
      if (best > 0) pts.push({t:parse(d).getTime(), v:best, label:dateLabel(d), reps});
    });
    out += '<section class="card stack"><h2>Evolução das cargas</h2>' + fld('Exercício', '<select id="exSel" data-c="exSel">' + exs.map(e=>'<option value="' + e.id + '"' + (e.id===ui.exSel ? ' selected' : '') + '>' + esc(e.plan + ': ' + e.name) + '</option>').join('') + '</select>');
    if (pts.length){
      const mx = Math.max.apply(null, pts.map(p=>p.v)), mn = Math.min.apply(null, pts.map(p=>p.v));
      const lo = Math.max(0, Math.floor((mn - Math.max(2, (mx-mn)*0.2)) / 2) * 2), hi = Math.ceil((mx + Math.max(2, (mx-mn)*0.2)) / 2) * 2;
      out += '<p class="small muted">Maior carga de cada treino, em kg.</p>' + lineChart(pts, lo, hi, [lo, (lo+hi)/2, hi], v=>fmtN(v), ' kg', [shortDate(ymd(new Date(pts[0].t))), shortDate(ymd(new Date(pts[pts.length-1].t)))]) + readout() +
        tableTwin(['Treino','Maior carga','Reps'], pts.map(p=>[p.label, fmtN(p.v) + ' kg', p.reps || '–']));
    } else out += '<div class="empty">Registre cargas na tela Treino para ver a evolução.</div>';
    out += '</section>';
  }

  /* peso */
  const wp = []; Object.keys(state.logs).sort().forEach(d=>{ const w = parseFloat(String(state.logs[d].weight).replace(',', '.')); if (w > 0) wp.push({t:parse(d).getTime(), v:w, label:dateLabel(d)}); });
  const todayW = state.logs[today] && state.logs[today].weight || '';
  out += '<section class="card stack"><h2>Peso corporal</h2><p class="small muted">Registro opcional. Pesar sempre no mesmo horário ajuda a comparar.</p>' +
    fld('Peso de hoje (kg)', '<input type="number" inputmode="decimal" step="0.1" min="20" max="400" id="wToday" placeholder="ex.: 79,5" value="' + esc(todayW) + '" data-c="wToday">');
  if (wp.length){
    const vs = wp.map(p=>p.v), mn = Math.min.apply(null, vs), mx = Math.max.apply(null, vs), pad2 = Math.max(1, (mx-mn)*0.25);
    const lo = Math.floor(mn - pad2), hi = Math.ceil(mx + pad2);
    out += lineChart(wp, lo, hi, [lo, (lo+hi)/2, hi], v=>fmtN(v), ' kg', [shortDate(ymd(new Date(wp[0].t))), shortDate(ymd(new Date(wp[wp.length-1].t)))]) + readout() +
      tableTwin(['Dia','Peso'], wp.slice().reverse().map(p=>[p.label, fmtN(p.v) + ' kg']));
  } else out += '<div class="empty">Sem registros de peso ainda.</div>';
  out += '</section>';

  /* sono e disposição */
  const s14 = lastDays(14), sl = s14.map(d=>{ const h = parseFloat(String(getLog(d).sleep.h).replace(',', '.')); return h > 0 ? h : null; });
  const en = s14.map(d=>{ const e = +getLog(d).sleep.energy; return e > 0 ? e : null; });
  const lx = s14.map((d,i)=>i===0 || i===13 || i===6 ? shortDate(d) : '');
  if (sl.some(v=>v!=null) || en.some(v=>v!=null)){
    out += '<section class="card stack"><h2>Sono e disposição</h2><div class="lbl">Horas dormidas, 14 dias</div>' + columns(sl, s14.map(dateLabel), lx, 10, v=>fmtN(v), ' h') + readout() +
      '<div class="lbl">Disposição de 1 a 5</div>' + columns(en, s14.map(dateLabel), lx, 5, v=>String(v), ' de 5', [0,1,2,3,4,5]) + readout() +
      tableTwin(['Dia','Sono','Disposição'], s14.map((d,i)=>[dateLabel(d), sl[i]==null ? '–' : fmtN(sl[i]) + ' h', en[i]==null ? '–' : en[i] + ' de 5'])) + '</section>';
  } else out += '<section class="card stack"><h2>Sono e disposição</h2><p class="small muted">Anote as horas dormidas e a disposição em Hoje, no cartão "Como estou". Os gráficos aparecem aqui.</p></section>';
  return out;
};
