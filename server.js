const express = require('express');
const path = require('path');

const app = express();

// Must use the port provided by Railway
const PORT = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname)));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// It is very important to use 0.0.0.0 here
// so that Railway can detect and bind to the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Lamex SMS Server is running on port ${PORT}`);
});
