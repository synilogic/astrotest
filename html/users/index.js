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
app.use('/uploads', express.static(path.resolve('public/uploads')));
app.use('/assets', express.static(path.resolve('public/assets')));
const PORT = process.env.PORT || env.ports.users;
// Middleware
app.use(cors({ origin: env.origin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
// Static file serving (for images like customer uploads)
console.log("Static files served from:", path.resolve('public/uploads'));
// Route prefix
const prefix = '/api';
app.use(prefix, otp);
app.use(prefix, customerdash);
app.use(prefix, deleteAccount);
// Start server
app.listen(PORT, () => {
  console.log(`Authentication service is running on port ${PORT}`);
});