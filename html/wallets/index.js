import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import env from '../_config/env.js';
import { loadAppConfig } from '../bootstrapConfig.js';
import getWalletBalance from './getWalletBalance.js';
import rechargeVoucher from './rechargeVoucher.js';
import proceedPaymentRequest from './proceedPaymentRequest.js';
import updateOnlinePayment from './updateOnlinePayment.js'
import getpayoutList from './getpayoutList.js'
import withdrawalRequest from './withdrawalRequest.js'




dotenv.config(); 

const PORT = process.env.PORT || env.ports.wallets;

const app = express();


// Security headers
app.use(helmet());

// CORS config
const corsOptions = {
    origin: env.origin
};
app.use(cors(corsOptions));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Prefix routes
const prefix = "/api";
app.use(prefix, getWalletBalance);
app.use(prefix, rechargeVoucher);
app.use(prefix, proceedPaymentRequest);
app.use(prefix, updateOnlinePayment);
app.use(prefix, getpayoutList);
app.use(prefix, withdrawalRequest);



// Load DB settings and start the app
(async () => {
  try {
    await loadAppConfig(); // Load config from DB before handling requests
    app.listen(PORT, () => {
      console.log(`Wallets service is running on port ${PORT}.`);
    });
  } catch (error) {
    console.error('Error loading app config:', error);
    process.exit(1); // Exit if config fails
  }
})();
