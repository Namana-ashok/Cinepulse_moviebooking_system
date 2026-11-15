const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const apiRoutes = require('./routes/api');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('replace-this')) {
  console.warn('WARNING: Set a private JWT_SECRET in .env before using accounts outside local development.');
}
const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
    origin: [
        'http://127.0.0.1:5500',
        'http://localhost:5500'
    ]
}));
app.use(express.json({ limit: '100kb' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false }));
app.use('/api', apiRoutes);
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.use((err, _req, res, _next) => {
  console.error(err.message);
  if (err.name === 'ValidationError') return res.status(400).json({ error: 'Some submitted data is invalid.' });
  if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid ID format.' });
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Server error. Check the terminal for details.' });
});
const port = Number(process.env.PORT || 3000);
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cinepulse')
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(port, () => console.log(`CinePulse running at http://localhost:${port}`));
  })
  .catch(err => { console.error('Could not connect to MongoDB:', err.message); process.exit(1); });
