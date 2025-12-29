const express = require('express');
const app = express();

const cors = require('cors');

// CORS configuration - use '*' to allow all origins, or specify specific origins
const allowedOrigins = [
  'http://localhost:4200',
  'https://barcode-frontend-eight.vercel.app',
  '*' // Allow all origins if '*' is present
];

// Normalize origin by removing trailing slash
const normalizeOrigin = (origin) => {
  if (!origin) return origin;
  return origin.replace(/\/$/, '');
};

// CORS Debug Mode - Set CORS_DEBUG=true in environment to allow all origins (for testing only)
const CORS_DEBUG = process.env.CORS_DEBUG === 'true';

if (CORS_DEBUG) {
  console.warn('⚠️  CORS DEBUG MODE: Allowing all origins (for testing only!)');
  app.use(cors({
    origin: true, // Allow all origins in debug mode
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
    preflightContinue: false,
    optionsSuccessStatus: 200
  }));
} else {
  // Check if '*' is in allowedOrigins to allow all origins
  const allowAllOrigins = allowedOrigins.includes('*');
  
  if (allowAllOrigins) {
    console.warn('⚠️  CORS: Allowing all origins (wildcard * is enabled)');
    app.use(cors({
      origin: true, // Allow all origins
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
      exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
      preflightContinue: false,
      optionsSuccessStatus: 200
    }));
  } else {
    // Configure CORS middleware using cors package with specific origins
    app.use(cors({
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
          console.log('✅ CORS: Allowing request with no origin');
          return callback(null, true);
        }
        
        // Normalize the origin (remove trailing slash)
        const normalizedOrigin = normalizeOrigin(origin);
        
        // Filter out '*' from allowedOrigins for comparison
        const specificOrigins = allowedOrigins.filter(o => o !== '*');
        
        // Check if origin is in allowed list (case-insensitive, handle trailing slashes)
        const isAllowed = specificOrigins.some(allowed => {
          const normalizedAllowed = normalizeOrigin(allowed);
          return normalizedOrigin.toLowerCase() === normalizedAllowed.toLowerCase();
        });
        
        if (isAllowed) {
          console.log(`✅ CORS: Allowing origin: ${origin}`);
          callback(null, true);
        } else {
          // Log blocked origin for debugging
          console.warn(`⚠️  CORS blocked origin: ${origin}`);
          console.warn(`   Allowed origins: ${specificOrigins.join(', ')}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
      exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
      preflightContinue: false,
      optionsSuccessStatus: 200
    }));
  }
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
