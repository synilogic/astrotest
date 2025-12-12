import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import path from 'path';
import env from '../_config/env.js';
import welcomeRoutes from "./welcomeController.js"
import getQuoteCategory from "./getQuoteCategory.js"
import { loadAppConfig } from '../bootstrapConfig.js';
import '../_models/associateModels.js'

// import otp from './otpLogin.js';

dotenv.config(); // ✅ Load environment variables early

const app = express();
const PORT = process.env.WELCOME_PORT || env.ports.welcome;

// Middleware
app.use(cors({ origin: env.origin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

const prefix = "/api"
app.use( prefix,welcomeRoutes);
app.use( prefix,getQuoteCategory);


// Static file serving (for images like customer uploads)
app.use('/uploads', express.static(path.resolve('public/uploads')));
app.use('/assets', express.static(path.resolve('public/assets')));
// Route prefix
// const prefix = '/auth';
// app.use(prefix, otp);

// Load DB settings and start the app
(async () => {
  try {
    await loadAppConfig(); // Load config from DB before handling requests
    app.listen(PORT, () => {
      console.log(`Authentication service is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error loading app config:', error);
    process.exit(1); // Exit if config fails
  }
})();