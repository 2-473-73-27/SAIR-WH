const express = require('express');
const fetch = require('node-fetch');
const app = express();

const PORT = process.env.PORT || 3000;
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.grand-panel.com/api/v1';
const API_TOKEN = process.env.API_TOKEN || '406b7ca84862d9804dfe2474104545c26ce52f3193df94ec12fab2d8d63c2bb5';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Frontend Output Page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Grand Panel Output Dashboard</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-900 text-slate-100 min-h-screen p-6">
        <div class="max-w-4xl mx-auto">
            <header class="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
                <h1 class="text-2xl font-bold text-emerald-400">Grand Panel Output Dashboard</h1>
                <span id="status-badge" class="px-3 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">Connecting...</span>
            </header>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div class="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg">
                    <h2 class="text-lg font-semibold mb-3 text-slate-300">Configuration</h2>
                    <p class="text-sm text-slate-400 mb-2"><strong>Base URL:</strong> <code class="bg-slate-900 px-2 py-1 rounded text-emerald-300">${API_BASE_URL}</code></p>
                    <p class="text-sm text-slate-400 truncate"><strong>Token:</strong> <code class="bg-slate-900 px-2 py-1 rounded text-slate-300">${API_TOKEN.substring(0, 10)}...</code></p>
                </div>
                <div class="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg flex flex-col justify-between">
                    <h2 class="text-lg font-semibold mb-2 text-slate-300">Actions</h2>
                    <button onclick="fetchApiData()" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-lg transition-colors">Test API Connection</button>
                </div>
            </div>

            <div class="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg">
                <h2 class="text-lg font-semibold mb-3 text-slate-300">API Response Output</h2>
                <pre id="api-output" class="bg-slate-950 p-4 rounded-lg text-emerald-400 text-sm overflow-x-auto min-h-[160px]">Click "Test API Connection" to load data...</pre>
            </div>
        </div>

        <script>
            async function fetchApiData() {
                const outputEl = document.getElementById('api-output');
                const badgeEl = document.getElementById('status-badge');
                outputEl.textContent = 'Fetching data from API...';
                
                try {
                    const res = await fetch('/api/proxy-test');
                    const data = await res.json();
                    outputEl.textContent = JSON.stringify(data, null, 2);
                    if (res.ok) {
                        badgeEl.className = 'px-3 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
                        badgeEl.textContent = 'Online / Connected';
                    } else {
                        badgeEl.className = 'px-3 py-1 text-xs rounded-full bg-red-500/20 text-red-300 border border-red-500/30';
                        badgeEl.textContent = 'Error Response';
                    }
                } catch (err) {
                    outputEl.textContent = 'Connection Error: ' + err.message;
                    badgeEl.className = 'px-3 py-1 text-xs rounded-full bg-red-500/20 text-red-300 border border-red-500/30';
                    badgeEl.textContent = 'Failed';
                }
            }
        </script>
    </body>
    </html>
  `);
});

// Proxy route to safely query the external API without CORS issues
app.get('/api/proxy-test', async (req, res) => {
  try {
    const response = await fetch(`${API_BASE_URL}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message, note: 'Ensure the endpoint path (/status or similar) is valid for your API base URL.' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Grand Panel Output Server running on port ${PORT}`);
});
