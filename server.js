const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

let liveOtpDatabase = [];

app.post('/api/manager/upload-numbers', (req, res) => {
    const { entries } = req.body;
    if (entries && Array.isArray(entries)) {
        liveOtpDatabase = entries;
        return res.json({ success: true, message: "Official database updated successfully." });
    }
    res.status(400).json({ success: false, message: "Invalid payload format." });
});

app.post('/api/receive-incoming-otp', (req, res) => {
    const { number, otp, appSource, country } = req.body;
    const timestamp = new Date().toLocaleTimeString();

    const existingIndex = liveOtpDatabase.findIndex(item => item.number === number);
    if (existingIndex !== -1) {
        liveOtpDatabase[existingIndex].otp = otp;
        liveOtpDatabase[existingIndex].cli = appSource || "Unknown App";
        liveOtpDatabase[existingIndex].country = country || "Global";
        liveOtpDatabase[existingIndex].time = timestamp;
        liveOtpDatabase[existingIndex].report = "Delivered (Original)";
    } else {
        liveOtpDatabase.unshift({
            member: "Member_" + (liveOtpDatabase.length + 1),
            number: number,
            otp: otp,
            range: "Custom",
            cli: appSource || "Official App",
            country: country || "Global",
            time: timestamp,
            report: "Delivered (Original)"
        });
    }
    res.json({ success: true, message: "Real OTP recorded successfully." });
});

app.get('/api/get-official-sms', (req, res) => {
    res.json({ success: true, data: liveOtpDatabase });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
