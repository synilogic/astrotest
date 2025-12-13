import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import path from 'path';
import env from '../_config/env.js';
import otp from './otpLogin.js';
import customerdash from './customerDashbord.js';
import deleteAccount from './deleteAccount.js';


dotenv.config();
import { fileURLToPath } from 'url';
// Only needed if you're using ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || env.ports.users;

// Middleware
app.use(cors({ origin: env.origin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure Helmet to allow cross-origin resources
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

// Static file serving with CORS headers
// Use __dirname to get absolute path (works regardless of current working directory)
const uploadsPath = path.join(__dirname, '../public/uploads');
const assetsPath = path.join(__dirname, '../public/assets');

app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', env.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static(uploadsPath));

app.use('/assets', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', env.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static(assetsPath));
// Static file serving (for images like customer uploads)
console.log("Static files served from:", uploadsPath);
// Route prefix
const prefix = '/api';
app.use(prefix, otp);
app.use(prefix, customerdash);
app.use(prefix, deleteAccount);
// Start server
app.listen(PORT, () => {
  console.log(`Authentication service is running on port ${PORT}`);
});