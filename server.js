const express = require('express');
const mysql = require('mysql2');
const argon2 = require('argon2');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Railway Database Environment Variables support
const db = mysql.createConnection({
    host: process.env.MYSQLHOST || 'localhost',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || '',
    database: process.env.MYSQLDATABASE || 'otp_forward_system',
    port: process.env.MYSQLPORT || 3306
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Database connected successfully.');
});

// API Endpoint for Bot to Forward SMS Reports
app.post('/api/forward-sms', async (req, res) => {
    const { report_date, date_range_val, phone_number, cli, client_name, sms_content } = req.body;

    if (!phone_number || !sms_content) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const query = `INSERT INTO sms_reports (report_date, date_range_val, phone_number, cli, client_name, sms_content, status) VALUES (?, ?, ?, ?, ?, ?, 'Official')`;
    
    db.query(query, [report_date, date_range_val, phone_number, cli, client_name, sms_content], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({ success: true, message: 'Report forwarded and saved successfully' });
    });
});

// API Endpoint to Fetch and Search Reports for Frontend
app.get('/api/reports', (searchReq, searchRes) => {
    const searchQuery = searchReq.query.q || '';
    const query = `SELECT report_date, date_range_val, phone_number, cli, client_name, sms_content, status 
                   FROM sms_reports 
                   WHERE client_name LIKE ? OR phone_number LIKE ? OR cli LIKE ? 
                   ORDER BY id DESC LIMIT 100`;
    
    db.query(query, [`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`], (err, results) => {
        if (err) return searchRes.status(500).json({ error: 'Database query failed' });
        searchRes.json(results);
    });
});

// Secure User Registration with Argon2
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const passwordHash = await argon2.hash(password);
        db.query('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, passwordHash], (err) => {
            if (err) return res.status(400).json({ success: false, message: 'Username already exists' });
            res.json({ success: true, message: 'User registered securely' });
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Encryption error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`New website running on port ${PORT}`);
});
