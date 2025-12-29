const express = require('express');
const app = express();

const cors = require('cors');

// CORS configuration - Allow all origins
// Set CORS_DEBUG=false in environment to restrict to specific origins
const CORS_DEBUG = process.env.CORS_DEBUG !== 'false'; // Default to true (allow all)

// Apply CORS as the FIRST middleware - this is critical!
if (CORS_DEBUG) {
  console.warn('⚠️  CORS: Allowing all origins (wildcard enabled)');
  app.use(cors({
    origin: true, // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    exposedHeaders: ['Content-Length'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  }));
  
  // Add request logging for debugging
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
    next();
  });
} else {
  // Specific origins mode (when CORS_DEBUG=false)
  const allowedOrigins = [
    'http://localhost:4200',
    'https://barcode-frontend-eight.vercel.app'
  ];
  
  app.use(cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.warn(`⚠️  CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    exposedHeaders: ['Content-Length'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  }));
}

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
