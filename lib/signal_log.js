// Append signals to a log file for the web UI to stream
const fs = require('fs');
const SIGNALS_LOG = process.env.SIGNALS_LOG || 'signals_log.jsonl';

function appendSignalToLog(obj) {
  try {
    fs.appendFileSync(SIGNALS_LOG, JSON.stringify(obj) + '\n');
  } catch (e) {
    console.error('Failed to append signal to log', e.message);
  }
}

module.exports = { appendSignalToLog };
