(function(){
  const signalsEl = document.getElementById('signals');
  const statusEl = document.getElementById('status');
  const wsUrl = (location.protocol === 'https:' ? 'wss' : 'ws') + '://' + location.host + '/ws';
  const ws = new WebSocket(wsUrl);
  function renderSignal(s) {
    const div = document.createElement('div');
    div.className = 'signal ' + (s.signal === 'BUY' ? 'buy' : 'sell');
    div.innerHTML = `<div><strong>${s.signal}</strong> <span class="meta">${s.asset} @ ${s.timeframe} — ${new Date(s.ts).toLocaleString()}</span></div>
                     <div>Price: ${s.price}</div>
                     <div class="meta">SMA short: ${Number(s.smaShort).toFixed(6)} SMA long: ${Number(s.smaLong).toFixed(6)} ATR: ${Number(s.atr).toFixed(8)}</div>`;
    signalsEl.insertBefore(div, signalsEl.firstChild);
    // keep only last 200
    while (signalsEl.childElementCount > 200) signalsEl.removeChild(signalsEl.lastChild);
  }
  ws.onopen = () => { statusEl.textContent = 'connected'; };
  ws.onclose = () => { statusEl.textContent = 'disconnected'; };
  ws.onerror = () => { statusEl.textContent = 'error'; };
  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      if (msg.type === 'history') {
        statusEl.textContent = 'loaded history';
        msg.data.reverse().forEach(renderSignal);
      } else if (msg.type === 'signal') {
        renderSignal(msg.data);
      }
    } catch (e) { console.error(e); }
  };
})();
