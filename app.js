/* ===== Inicialização ===== */
let installEvt = null;
function installCard(){
  if (!PWA) return '';
  const standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone;
  if (standalone) return '';
  return '<section class="card stack"><h2>Instalar no celular</h2>' + (installEvt ? '<button class="btn acc" data-a="install">Instalar o app</button>' : '') +
    '<p class="small muted">Android (Chrome): menu de três pontos, depois "Instalar app" ou "Adicionar à tela inicial". iPhone (Safari): botão Compartilhar, depois "Adicionar à Tela de Início".</p></section>';
}
A.install = async () => {
  if (!installEvt) return;
  try{ installEvt.prompt(); await installEvt.userChoice; }catch(e){}
  installEvt = null; render();
};
if (PWA){
  window.addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); installEvt = e; if (ui.tab==='ajustes') render(); });
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) window.addEventListener('load', ()=>{ navigator.serviceWorker.register('sw.js').catch(()=>{}); });
}

document.addEventListener('keydown', e=>{
  if ((e.key==='Enter' || e.key===' ') && e.target.matches && e.target.matches('[role=button][data-a]')){ e.preventDefault(); e.target.click(); }
});

let lastToday = todayStr();
function rollover(){
  const t = todayStr();
  if (t !== lastToday){ if (ui.date === lastToday) ui.date = t; lastToday = t; return true; }
  return false;
}
function idleRender(){
  const a = document.activeElement;
  if (ui.sheet || (a && a.matches && a.matches('input,textarea,select'))) return;
  render();
}

state = load();
try{ if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); }catch(e){}
render(false);
setInterval(()=>{ tick(); if (rollover() || ui.tab==='hoje') idleRender(); }, 30000);
document.addEventListener('visibilitychange', ()=>{ if (document.visibilityState==='visible'){ rollover(); tick(); idleRender(); } });
setTimeout(tick, 1500);
