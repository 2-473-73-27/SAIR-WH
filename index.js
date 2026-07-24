const { default: makeWASocket, useMultiFileAuthState, delay, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const http = require('http');
const { parse } = require('querystring');

// --- HTTP SERVER & DASHBOARD UI ---
const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/pair') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      const params = parse(body);
      const phoneNumber = params.phone ? params.phone.replace(/[^0-9]/g, '') : '';
      const service = params.service || '1';

      if (!phoneNumber) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Phone number is required!' }));
        return;
      }

      try {
        // Real WhatsApp Pairing Code Generation Logic
        const pairCode = await getWhatsAppPairingCode(phoneNumber);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ code: pairCode }));
      } catch (err) {
        console.error('Pairing error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to generate code. Try again.' }));
      }
    });
    return;
  }

  // HTML Dashboard Interface
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SA!R MD - Dashboard</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0b0f19; color: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
            .dashboard-card { background: #1e293b; padding: 35px; border-radius: 16px; width: 100%; max-width: 420px; box-shadow: 0 10px 25px rgba(0,0,0,0.6); text-align: center; }
            .profile-circle { width: 80px; height: 80px; background: linear-gradient(135deg, #3b82f6, #9333ea); border-radius: 50%; display: flex; justify-content: center; align-items: center; margin: 0 auto 15px; font-weight: bold; font-size: 14px; color: white; box-shadow: 0 4px 10px rgba(59,130,246,0.4); text-align: center; padding: 5px; word-break: break-word; }
            h2 { color: #38bdf8; margin-bottom: 5px; font-size: 22px; }
            .subtitle { color: #94a3b8; font-size: 13px; margin-bottom: 25px; }
            .form-group { margin-bottom: 20px; text-align: left; }
            label { display: block; font-size: 13px; color: #cbd5e1; margin-bottom: 8px; font-weight: 600; }
            select, input { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #475569; background: #0f172a; color: white; font-size: 14px; box-sizing: border-box; }
            select:focus, input:focus { outline: none; border-color: #38bdf8; }
            .btn-pair { background: #2563eb; color: white; border: none; width: 100%; padding: 12px; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; transition: 0.3s; margin-top: 5px; }
            .btn-pair:hover { background: #1d4ed8; }
            .code-box { margin-top: 20px; background: #0f172a; border: 2px dashed #38bdf8; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 22px; letter-spacing: 4px; color: #4ade80; display: none; }
            .loading { color: #facc15; font-size: 14px; margin-top: 10px; display: none; }
        </style>
    </head>
    <body>
        <div class="dashboard-card">
            <div class="profile-circle">SA!R MD</div>
            <h2>Dashboard Panel</h2>
            <div class="subtitle">WhatsApp MD Bot & Script Keyboard</div>
            
            <div class="form-group">
                <label>Choose Service (Limit 20):</label>
                <select id="serviceSelect">
                    <option value="1">Service 1: WhatsApp Bot Basic</option>
                    <option value="2">Service 2: AI Auto-Reply Bot</option>
                    <option value="3">Service 3: Group Management Pro</option>
                    <option value="4">Service 4: Script Keyboard Custom</option>
                    <option value="5">Service 5: Full Advanced Automation</option>
                </select>
            </div>

            <div class="form-group">
                <label>WhatsApp Number:</label>
                <input type="text" id="whatsappNumber" placeholder="923XXXXXXXXX">
            </div>

            <button class="btn-pair" onclick="generatePairCode()">Pair WhatsApp</button>
            <div class="loading" id="loadingText">Connecting to WhatsApp server... Please wait.</div>
            <div class="code-box" id="pairCodeDisplay">_ _ _ _ _ _ _ _</div>
        </div>

        <script>
            async function generatePairCode() {
                const number = document.getElementById('whatsappNumber').value;
                const service = document.getElementById('serviceSelect').value;
                if(!number) {
                    alert('Please enter your WhatsApp number first!');
                    return;
                }
                
                document.getElementById('loadingText').style.display = 'block';
                document.getElementById('pairCodeDisplay').style.display = 'none';

                try {
                    const response = await fetch('/pair', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: 'phone=' + encodeURIComponent(number) + '&service=' + encodeURIComponent(service)
                    });
                    const data = await response.json();
                    
                    document.getElementById('loadingText').style.display = 'none';
                    if(data.code) {
                        const codeBox = document.getElementById('pairCodeDisplay');
                        codeBox.innerText = data.code;
                        codeBox.style.display = 'block';
                    } else {
                        alert(data.error || 'Failed to get code.');
                    }
                } catch(e) {
                    document.getElementById('loadingText').style.display = 'none';
                    alert('Server connection error!');
                }
            }
        </script>
    </body>
    </html>
  `);
});

server.listen(process.env.PORT || 3000);

// --- BACKEND WHATSAPP SOCKET & PAIRING HANDLER ---
async function getWhatsAppPairingCode(phoneNumber) {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_session');
  
  const sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.macOS('Desktop'),
    auth: state
  });

  sock.ev.on('creds.update', saveCreds);

  // Wait for socket connection to stabilize
  await delay(4000);

  if (!sock.authState.creds.registered) {
    let code = await sock.requestPairingCode(phoneNumber);
    // Format code neatly with hyphens if needed or return raw string
    return code?.match(/.{1,4}/g)?.join('-') || code;
  } else {
    throw new Error('Device is already registered!');
  }
                  }
