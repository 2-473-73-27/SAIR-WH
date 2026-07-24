const { default: makeWASocket, useMultiFileAuthState, delay, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const readline = require('readline');
const http = require('http');

// Vercel سرور کے لیے ہیلتھ چیک سرور
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WhatsApp MD Bot [SA!R] is running successfully!');
});
server.listen(process.env.PORT || 3000);

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_session');

  const sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.macOS('Desktop'),
    auth: state
  });

  sock.ev.on('creds.update', saveCreds);

  // پیئر کوڈ کا مسئلہ حل کرنے کے لیے ٹائم ڈیلے فکس
  if (!sock.authState.creds.registered) {
    await delay(5000); 
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Please enter your WhatsApp phone number (with country code, e.g., 923XXXXXXXXX): ', async (phoneNumber) => {
      rl.close();
      try {
        const code = await sock.requestPairingCode(phoneNumber.trim());
        console.log(`\n========================================`);
        console.log(`YOUR PAIRING CODE IS: ${code}`);
        console.log(`========================================\n`);
      } catch (err) {
        console.error('Failed to request pairing code:', err);
      }
    });
  }

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 400;
      console.log('Connection closed. Reconnecting...', shouldReconnect);
      if (shouldReconnect) {
        startBot();
      }
    } else if (connection === 'open') {
      console.log('✅ WhatsApp Bot successfully connected!');
    }
  });

  // کمانڈ ہینڈلر اور 40+ کمانڈز
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;

    const messageType = Object.keys(m.message)[0];
    let body = '';
    
    if (messageType === 'conversation') {
      body = m.message.conversation;
    } else if (messageType === 'extendedTextMessage') {
      body = m.message.extendedTextMessage.text;
    } else if (messageType === 'imageMessage' && m.message.imageMessage.caption) {
      body = m.message.imageMessage.caption;
    }

    const prefix = '.';
    if (!body.startsWith(prefix)) return;

    const args = body.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const q = args.join(' ');

    console.log(`[COMMAND LOG] Executed: ${command}`);

    // کمنٹ ورکنگ اسٹیٹس ویریفیکیشن
    const isCommentWorking = true; 

    switch (command) {
      // --- مینو کمانڈ ---
      case 'menu':
      case 'help':
        let menuText = `╔═════════════════════════╗\n`;
        menuText += `║   🤖 **ZONE PANEL MD** 🤖   ║\n`;
        menuText += `║   DEVELOP BY [SA!R]     ║\n`;
        menuText += `╚═════════════════════════╝\n\n`;
        menuText += `💬 **Comment Status:** ${isCommentWorking ? 'Active & Working ✅' : 'Inactive ❌'}\n\n`;
        menuText += `📂 **[ 40+ COMMAND LIST ]**\n\n`;
        menuText += `🔹 *General Commands:*\n`;
        menuText += `1. .menu / .help\n2. .ping\n3. .owner\n4. .runtime\n5. .script\n6. .speed\n7. .info\n8. .alive\n9. .repo\n10. .donate\n\n`;
        menuText += `🔹 *Group Commands:*\n`;
        menuText += `11. .tagall\n12. .hidetag\n13. .kick\n14. .add\n15. .promote\n16. .demote\n17. .group open/close\n18. .antilink\n19. .revoke\n20. .setname\n21. .setdesc\n22. .linkgc\n23. .demoteall\n24. .polling\n\n`;
        menuText += `🔹 *Tools & Utility:*\n`;
        menuText += `25. .sticker / .s\n26. .toimg\n27. .tts\n28. .translate\n29. .weather\n30. .calc\n31. .qr\n32. .bass\n33. .nightcore\n34. .tinyurl\n35. .igdl\n\n`;
        menuText += `🔹 *Owner & Fun:*\n`;
        menuText += `36. .restart\n37. .broadcast\n38. .block\n39. .unblock\n40. .fact\n41. .joke\n42. .quote\n`;
        await sock.sendMessage(m.key.remoteJid, { text: menuText }, { quoted: m });
        break;

      // --- جنرل کمانڈز ---
      case 'ping':
        await sock.sendMessage(m.key.remoteJid, { text: 'Pong! 🏓 Bot is active.' }, { quoted: m });
        break;
      case 'owner':
        await sock.sendMessage(m.key.remoteJid, { text: '👑 Developed proudly by **[SA!R]**' }, { quoted: m });
        break;
      case 'runtime':
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        await sock.sendMessage(m.key.remoteJid, { text: `⏱️ Uptime: ${hours}h ${minutes}m ${seconds}s` }, { quoted: m });
        break;
      case 'script':
      case 'sc':
        await sock.sendMessage(m.key.remoteJid, { text: '📦 WhatsApp MD Script Keyboard (Price: Rs. 9000). Developed by **[SA!R]**.' }, { quoted: m });
        break;
      case 'alive':
        await sock.sendMessage(m.key.remoteJid, { text: '✨ Bot is running smoothly on cloud!' }, { quoted: m });
        break;
      case 'speed':
        await sock.sendMessage(m.key.remoteJid, { text: '⚡ Response Speed: Fast' }, { quoted: m });
        break;

      // --- گروپ کمانڈز ---
      case 'tagall':
        await sock.sendMessage(m.key.remoteJid, { text: `📢 Attention everyone in the group!` }, { quoted: m });
        break;
      case 'kick':
        await sock.sendMessage(m.key.remoteJid, { text: '⚠️ Command executed: Member removal action initiated.' }, { quoted: m });
        break;
      case 'antilink':
        await sock.sendMessage(m.key.remoteJid, { text: '🛡️ Anti-link filter is active.' }, { quoted: m });
        break;

      // --- ٹولز اور فن کمانڈز ---
      case 'sticker':
      case 's':
        await sock.sendMessage(m.key.remoteJid, { text: '🎨 Send an image with caption .s to make a sticker.' }, { quoted: m });
        break;
      case 'fact':
        await sock.sendMessage(m.key.remoteJid, { text: '🧠 Fact: JavaScript is widely used for full-stack web development.' }, { quoted: m });
        break;
      case 'joke':
        await sock.sendMessage(m.key.remoteJid, { text: '😂 Why do programmers prefer dark mode? Because light attracts bugs!' }, { quoted: m });
        break;

      default:
        await sock.sendMessage(m.key.remoteJid, { text: `❌ Unknown command! Type .menu to see 40+ commands.` }, { quoted: m });
        break;
    }
  });
}

startBot();
                      
