import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import path from 'path';
import env from '../_config/env.js';
import vendorRegistration from "./vendorControllers.js"
// import otp from './otpLogin.js';

dotenv.config(); // ✅ Load environment variables early

const app = express();
const PORT = process.env.PORT || env.ports.vendors;

// Middleware
app.use(cors({ origin: env.origin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

const prefix = "/vendor"
app.use( prefix,vendorRegistration);

// Static file serving (for images like customer uploads)
app.use('/uploads', express.static(path.resolve('public/uploads')));

// Route prefix
// const prefix = '/auth';
// app.use(prefix, otp);

// Start server
app.listen(PORT, () => {
  console.log(`Authentication service is running on port ${PORT}`);
});
