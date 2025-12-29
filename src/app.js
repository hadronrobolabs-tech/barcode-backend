const express = require('express');
const app = express();

const cors = require('cors');

// CORS configuration - Allow all origins
// This MUST be the FIRST middleware to handle preflight OPTIONS requests
console.log('🔧 CORS: Configuring to allow all origins');

app.use(cors({
  origin: '*', // Allow all origins
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Access-Control-Allow-Origin'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Explicitly handle OPTIONS requests for all routes
app.options('*', cors());

// Add request logging for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
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
