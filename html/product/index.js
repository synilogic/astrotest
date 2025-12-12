import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import env from '../_config/env.js';
import path from 'path';
import productRoutes from './productRoutes.js';
import reviewRoute  from './reviewRoutes.js';
import sequelize from '../_config/db.js';
import suggestionRoute from './suggestionRoute.js'
import { loadAppConfig } from '../bootstrapConfig.js';
import addAddress from './addAddress.js';
import productCalculation from './productCalculation.js';
import productPurchase from './productPurchase.js';
import serviceRoutes from './serviceRoutes.js';
import offerRoutes from './offerRoutes.js';
import kundliRoutes from './kundliRoutes.js'
import sanjeeviniRoutes from './sanjeeviniRoutes.js';
import '../_models/associateModels.js'
import noticeRoutes from './noticeRoutes.js'
import quoteRoutes from './quoteRoutes.js'
import predefinedMessageRoutes from './predefinedMessageRoutes.js'
import blogRoutes from './blogRoutes.js'
import switchwordRoutes from './switchwordRoutes.js'
import pdfBookRoutes from './pdfBookRoutes.js';
import openAIProfileList from './openAIProfileList.js';
import OpenAiPredicationCalculation from './openaipredicationcalculation.js';
import  addOpenAIProfile from './addOpenAIProfile.js';
import paidKundliManualRoutes from './paidKundliManualRoutes.js'

dotenv.config();

const app = express();

const PORT = process.env.PRODUCTS_PORT || env.ports.product;

// Parse JSON body
app.use(express.json());

// Serve category images
app.use('/uploads', express.static(path.resolve('public/uploads')));
app.use('/assets', express.static(path.resolve('public/assets')));
app.use('/img', express.static(path.resolve('public/assets/img/')));
app.use('/paid_kundli_pdf', express.static(path.resolve('public/paid_kundli_pdf')));

app.use('/api', productRoutes);
app.use('/api', reviewRoute )
app.use('/api', addAddress )
app.use('/api', productCalculation )
app.use('/api', productPurchase )
app.use('/api', offerRoutes );
app.use('/api', suggestionRoute);
app.use('/api', serviceRoutes);
app.use('/api', kundliRoutes);
app.use('/api', sanjeeviniRoutes);
app.use('/api', noticeRoutes);
app.use('/api', quoteRoutes);
app.use('/api', predefinedMessageRoutes)
app.use('/api', blogRoutes)
app.use('/api', switchwordRoutes)
app.use('/api', pdfBookRoutes);
app.use('/api', paidKundliManualRoutes);
app.use('/api', openAIProfileList);
app.use('/api', OpenAiPredicationCalculation);
app.use('/api', addOpenAIProfile);





// Start server with DB connection
const startServer = async () => {
  try {
    await sequelize.authenticate();
    await loadAppConfig();
    console.log('Connected to MySQL database.');

    app.listen(PORT, () => {
      console.log(`Server running at ${PORT}`);
    });

  } catch (err) {
    console.error('Failed to connect to DB:', err.message);
    process.exit(1);
  }
};

startServer();
