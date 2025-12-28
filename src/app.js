const express = require('express');
const app = express();

const cors = require('cors');

// CORS configuration - allow both localhost (development) and Vercel (production)
const allowedOrigins = [
  'http://localhost:4200',
  'https://barcode-frontend-eight.vercel.app'
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Check if origin is in allowed list
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  
  next();
});

require('./config/db');
const errorMiddleware = require('./middlewares/error.middleware');

app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'OK' }));

app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/components', require('./modules/component/component.routes'));
app.use('/api/categories', require('./modules/category/category.routes'));
app.use('/api/kits', require('./modules/kit/kit.routes'));
app.use('/api/barcodes', require('./modules/barcode/barcode.routes'));
app.use('/api/scans', require('./modules/scan/scan.routes'));
app.use('/api/boxes', require('./modules/box/box.routes'));
app.use('/api/history', require('./modules/history/history.routes'));

app.use(errorMiddleware);
module.exports = app;
