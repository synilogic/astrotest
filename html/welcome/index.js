import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import env from '../_config/env.js';
import welcomeRoutes from "./welcomeController.js"
import getQuoteCategory from "./getQuoteCategory.js"
import { loadAppConfig } from '../bootstrapConfig.js';
import '../_models/associateModels.js'
import { initRedis } from '../_config/redis.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// import otp from './otpLogin.js';

dotenv.config(); // ✅ Load environment variables early

const app = express();
const PORT = process.env.WELCOME_PORT || env.ports.welcome;

// Middleware - CORS configuration for all routes
app.use(cors({ 
  origin: env.origin || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// CORS middleware already handles OPTIONS requests, so we don't need a separate handler

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure helmet to allow cross-origin resources for images
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http:", "*"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));

// Mount welcome routes - ensure routers are properly initialized
const prefix = "/api"
try {
  console.log('[Welcome Server] Mounting routes with prefix:', prefix)
  console.log('[Welcome Server] welcomeRoutes type:', typeof welcomeRoutes)
  console.log('[Welcome Server] getQuoteCategory type:', typeof getQuoteCategory)
  app.use(prefix, welcomeRoutes)
  app.use(prefix, getQuoteCategory)
  console.log('[Welcome Server] ✅ Routes mounted successfully')
} catch (error) {
  console.error('[Welcome Server] ❌ Error mounting routes:', error)
  console.error('[Welcome Server] Error stack:', error.stack)
  process.exit(1)
}

// Static file serving (for images like customer uploads)
// Use __dirname to ensure correct path resolution regardless of current working directory
// Add CORS headers for static files - Express 5.x compatible approach
const uploadsPath = path.join(__dirname, '../public/uploads');
const assetsPath = path.join(__dirname, '../public/assets');

// CORS middleware for /uploads static files
app.use('/uploads', (req, res, next) => {
  // Set comprehensive CORS headers
  res.header('Access-Control-Allow-Origin', env.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Serve static files for /uploads
app.use('/uploads', express.static(uploadsPath));

// CORS middleware for /assets static files
app.use('/assets', (req, res, next) => {
  // Set comprehensive CORS headers
  res.header('Access-Control-Allow-Origin', env.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Serve static files for /assets
app.use('/assets', express.static(assetsPath));

console.log('Static files served from:', path.join(__dirname, '../public/uploads'));
// Route prefix
// const prefix = '/auth';
// app.use(prefix, otp);

// Load DB settings and start the app
(async () => {
  try {
    await loadAppConfig(); // Load config from DB before handling requests
    await initRedis(); // Initialize Redis cache
    app.listen(PORT, () => {
      console.log(`Welcome service is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error loading app config:', error);
    process.exit(1); // Exit if config fails
  }
})();