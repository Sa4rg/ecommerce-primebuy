const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/health', (req, res) => {
  res.json({ ok: true, message: "API running ✅" });
});

app.use('/api', require('./routes/index'));

app.use(require('./middlewares/error.middleware'));

module.exports = app;