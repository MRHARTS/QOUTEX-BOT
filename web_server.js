// Simple web server that serves a static UI and streams live signals
require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const PORT = process.env.WEB_PORT || 3000;
const SIGNALS_LOG = process.env.SIGNALS_LOG || 'signals_log.jsonl';

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

// Helper: read last N lines from file
function readLastLines(file, n) {
  try {
    const data = fs.readFileSync(file, 'utf8');
    const lines = data.trim().split(/\r?\n/).filter(Boolean);
    const last = lines.slice(-n).map(l => JSON.parse(l));
    return last;
  } catch (e) {
    return [];
  }
}

// Track file size to read appended content
let lastSize = 0;
function updateLastSize() {
  try {
    const st = fs.statSync(SIGNALS_LOG);
    lastSize = st.size;
  } catch (e) {
    lastSize = 0;
  }
}
updateLastSize();

wss.on('connection', (ws) => {
  // send last 100 signals
  const last = readLastLines(SIGNALS_LOG, 100);
  ws.send(JSON.stringify({ type: 'history', data: last }));
});

// Poll the file for changes every 1s
setInterval(() => {
  fs.stat(SIGNALS_LOG, (err, st) => {
    if (err) return; // file may not exist yet
    if (st.size > lastSize) {
      const stream = fs.createReadStream(SIGNALS_LOG, { start: lastSize, end: st.size });
      let buf = '';
      stream.on('data', chunk => { buf += chunk.toString(); });
      stream.on('end', () => {
        const lines = buf.trim().split(/\r?\n/).filter(Boolean);
        for (const l of lines) {
          let obj = null;
          try { obj = JSON.parse(l); } catch (e) { continue; }
          const msg = JSON.stringify({ type: 'signal', data: obj });
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) client.send(msg);
          });
        }
        lastSize = st.size;
      });
    }
  });
}, 1000);

server.listen(PORT, () => {
  console.log(`Web UI listening on http://localhost:${PORT}`);
  console.log(`WebSocket endpoint ws://localhost:${PORT}/ws`);
});
