import {flag, gapLabel, relativeRows} from './relative.js';

const demo = {playerId: 'me', drivers: [
  {id:'a',position:4,number:'12',countryCode:'BR',firstName:'Rafael',lastName:'Costa',gapSeconds:-5.842},
  {id:'b',position:5,number:'27',countryCode:'ES',firstName:'Alejandro',lastName:'Martín',gapSeconds:-2.316},
  {id:'c',position:6,number:'8',countryCode:'US',firstName:'James',lastName:'Walker',gapSeconds:-0.784},
  {id:'me',position:7,number:'21',countryCode:'AR',firstName:'Nicolás',lastName:'Fernández',gapSeconds:0},
  {id:'d',position:8,number:'46',countryCode:'IT',firstName:'Luca',lastName:'Moretti',gapSeconds:1.259},
  {id:'e',position:9,number:'05',countryCode:'GB',firstName:'Oliver',lastName:'Smith',gapSeconds:3.607},
  {id:'f',position:10,number:'93',countryCode:'DE',firstName:'Max',lastName:'Weber',gapSeconds:6.192}
]};
const container = document.querySelector('#drivers');
const status = document.querySelector('#status');
const caption = document.querySelector('#caption');
function cell(text, className) {
  const el = document.createElement('span');
  el.className = className;
  el.setAttribute('role','cell');
  el.textContent = text;
  return el;
}
function render(data) {
  if (!data || !Array.isArray(data.drivers) || !data.drivers.every(d => d && typeof d === 'object')) throw new Error('Invalid drivers');
  const rows = relativeRows(data.drivers, data.playerId);
  if (!rows.length) throw new Error('Player missing');
  container.replaceChildren(...rows.map(d => {
    const isPlayer = d.id === data.playerId;
    const row = document.createElement('div');
    row.className = `driver${isPlayer ? ' player' : ''}`;
    row.setAttribute('role','row');
    const nationality = cell(flag(d.countryCode),'flag');
    nationality.setAttribute('aria-label',d.countryCode || 'Nacionalidad desconocida');
    row.append(cell(d.position ?? '—','position'),cell(d.number ?? '—','number'),nationality,cell(`${d.firstName ?? ''} ${d.lastName ?? ''}`.trim() || 'Piloto','name'),cell(gapLabel(d.gapSeconds,isPlayer),'gap'));
    return row;
  }));
}
const endpoint = new URLSearchParams(location.search).get('ws');
const native = new URLSearchParams(location.search).has('native');
window.updateTelemetry = data => {
  if (!data) { container.classList.add('stale'); status.textContent='SIN SESIÓN'; caption.textContent='Esperando iRacing'; return; }
  try { render(data); container.classList.remove('stale'); status.textContent='EN VIVO'; caption.textContent='Diferencias estimadas · referencia: tu auto'; }
  catch { container.classList.add('stale'); status.textContent='SIN DATOS'; }
};
if (native) window.updateTelemetry(null);
else if (!endpoint) render(demo);
else {
  let socket;
  let retry;
  let lastFrame = 0;
  function state(label, message) { status.textContent=label; caption.textContent=message; }
  function connect() {
    state('CONECTANDO','Esperando telemetría de iRacing');
    try {
      const url = new URL(endpoint);
      if (!['ws:','wss:'].includes(url.protocol)) throw new Error('Invalid protocol');
      socket = new WebSocket(url);
    } catch { state('ERROR','Dirección WebSocket inválida'); return; }
    socket.onmessage = event => {
      try { render(JSON.parse(event.data)); lastFrame=Date.now(); container.classList.remove('stale'); state('EN VIVO','Referencia: tu auto'); }
      catch { container.classList.add('stale'); state('ERROR','Formato de telemetría inválido'); }
    };
    socket.onerror = () => state('SIN CONEXIÓN','No se pudo conectar con la telemetría');
    socket.onclose = () => { container.classList.add('stale'); state('DESCONECTADO','Reconectando con la telemetría…'); retry=setTimeout(connect,3000); };
  }
  connect();
  const timer=setInterval(() => { if(lastFrame && Date.now()-lastFrame>5000) { container.classList.add('stale'); state('SIN DATOS','La telemetría dejó de actualizarse'); } },1000);
  window.addEventListener('pagehide',()=>{clearTimeout(retry);clearInterval(timer);if(socket){socket.onclose=null;socket.close();}});
}
