const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3000;
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.grand-panel.com/api/v1';
const API_TOKEN = process.env.API_TOKEN || '406b7ca84862d9804dfe2474104545c26ce52f3193df94ec12fab2d8d63c2bb5';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Grand Panel Control Center</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-950 text-slate-100 min-h-screen p-6 font-sans">
        <div class="max-w-6xl mx-auto">
            <header class="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-slate-800 pb-4 gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-emerald-400">Grand Panel Dashboard</h1>
                    <p class="text-xs text-slate-400 mt-1">Target Base URL: <code class="text-slate-300">${API_BASE_URL}</code></p>
                </div>
                <div class="flex items-center gap-3">
                    <span id="status-badge" class="px-3 py-1 text-xs rounded-full bg-slate-800 text-slate-300 border border-slate-700">Awaiting Check</span>
                    <button onclick="fetchAllData()" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">Refresh Stats</button>
                </div>
            </header>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg">
                    <h3 class="text-xs uppercase tracking-wider text-slate-400 mb-1">API Status</h3>
                    <p id="metric-status" class="text-xl font-bold text-slate-200">Checking...</p>
                </div>
                <div class="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg">
                    <h3 class="text-xs uppercase tracking-wider text-slate-400 mb-1">Active Token Scope</h3>
                    <p class="text-sm font-mono text-emerald-300 truncate">${API_TOKEN.substring(0, 16)}...</p>
                </div>
                <div class="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg">
                    <h3 class="text-xs uppercase tracking-wider text-slate-400 mb-1">Railway Environment</h3>
                    <p class="text-sm font-semibold text-emerald-400">Active & Deployed</p>
                </div>
            </div>

            <div class="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg">
                <div class="flex justify-between items-center mb-3">
                    <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-300">Live API Response Stream</h2>
                    <button onclick="clearLogs()" class="text-xs text-slate-400 hover:text-slate-200">Clear Logs</button>
                </div>
                <pre id="api-output" class="bg-slate-950 p-4 rounded-lg text-emerald-400 text-xs font-mono overflow-x-auto min-h-[220px] max-h-[400px]">Dashboard initialized. Click "Refresh Stats" to ping the backend API.</pre>
            </div>
        </div>

        <script>
            async function fetchAllData() {
                const outputEl = document.getElementById('api-output');
                const badgeEl = document.getElementById('status-badge');
                const metricStatus = document.getElementById('metric-status');
                
                outputEl.textContent = 'Sending request to proxy backend...';
                
                try {
                    const res = await fetch('/api/dashboard-stats');
                    const data = await res.json();
                    outputEl.textContent = JSON.stringify(data, null, 2);
                    
                    if (res.ok) {
                        badgeEl.className = 'px-3 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
                        badgeEl.textContent = 'Operational';
                        metricStatus.textContent = 'Online (200 OK)';
                        metricStatus.className = 'text-xl font-bold text-emerald-400';
                    } else {
                        badgeEl.className = 'px-3 py-1 text-xs rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30';
                        badgeEl.textContent = 'Degraded Response';
                        metricStatus.textContent = 'Warning (' + res.status + ')';
                        metricStatus.className = 'text-xl font-bold text-amber-400';
                    }
                } catch (err) {
                    outputEl.textContent = 'Network or Connection Error: ' + err.message;
                    badgeEl.className = 'px-3 py-1 text-xs rounded-full bg-red-500/20 text-red-300 border border-red-500/30';
                    badgeEl.textContent = 'Connection Failed';
                    metricStatus.textContent = 'Offline';
                    metricStatus.className = 'text-xl font-bold text-red-400';
                }
            }

            function clearLogs() {
                document.getElementById('api-output').textContent = 'Logs cleared.';
            }

            window.onload = fetchAllData;
        </script>
    </body>
    </html>
  `);
});

app.get('/api/dashboard-stats', async (req, res) => {
  try {
    const response = await fetch(`${API_BASE_URL}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { rawText: await response.text() };
    }

    res.status(response.status).json({
      success: response.ok,
      httpStatus: response.status,
      timestamp: new Date().toISOString(),
      targetUrl: `${API_BASE_URL}/status`,
      apiResponse: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      hint: 'Verify if the API Base URL is reachable from Railway infrastructure.'
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Grand Panel Dashboard running on port ${PORT}`);
});
