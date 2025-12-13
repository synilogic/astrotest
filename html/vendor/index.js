import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import env from '../_config/env.js';
import vendorRegistration from "./vendorControllers.js"
// import otp from './otpLogin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config(); // ✅ Load environment variables early

const app = express();
const PORT = process.env.PORT || env.ports.vendors;

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

// Mount vendor routes - ensure router is properly initialized
const prefix = "/vendor"
try {
  console.log('[Vendor Server] Mounting routes with prefix:', prefix)
  console.log('[Vendor Server] Router type:', typeof vendorRegistration)
  console.log('[Vendor Server] Is router:', vendorRegistration && typeof vendorRegistration === 'function')
  app.use(prefix, vendorRegistration)
  console.log('[Vendor Server] ✅ Routes mounted successfully')
} catch (error) {
  console.error('[Vendor Server] ❌ Error mounting routes:', error)
  console.error('[Vendor Server] Error stack:', error.stack)
  process.exit(1)
}

// Static file serving (for images like customer uploads) with CORS headers
// Use a simpler approach for Express 5.x compatibility
const uploadsPath = path.join(__dirname, '../public/uploads');

// CORS middleware for static files
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

// Serve static files
app.use('/uploads', express.static(uploadsPath));

// Route prefix
// const prefix = '/auth';
// app.use(prefix, otp);

// Start server
app.listen(PORT, () => {
  console.log(`Authentication service is running on port ${PORT}`);
});
