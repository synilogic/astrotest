import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import env from '../_config/env.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
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
import { initRedis } from '../_config/redis.js';
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
import appointmentDurationRoutes from './appointmentDurationRoutes.js';
import slotBookingRoutes from './slotBookingRoutes.js';
import architectRoomRoutes from './architectRoomRoutes.js';
import architectServiceOrderRoutes from './architectServiceOrderRoutes.js';

dotenv.config();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

const PORT = process.env.PRODUCTS_PORT || env.ports.product;

// CORS configuration
app.use(cors({ origin: env.origin }));

// Helmet middleware with cross-origin resource policy for images
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Parse JSON body
app.use(express.json());

// Parse URL-encoded form data (required for multer upload.none() middleware)
app.use(express.urlencoded({ extended: true }));

// Serve category images with CORS - use __dirname for correct path resolution
const uploadsPath = path.join(__dirname, '../public/uploads');
const assetsPath = path.join(__dirname, '../public/assets');
const imgPath = path.join(__dirname, '../public/assets/img');
const paidKundliPath = path.join(__dirname, '../public/paid_kundli_pdf');

console.log('Product service static files served from:');
console.log('  /uploads ->', uploadsPath);
console.log('  /assets ->', assetsPath);
console.log('  /img ->', imgPath);
console.log('  /paid_kundli_pdf ->', paidKundliPath);

app.use('/uploads', cors({ origin: env.origin }), express.static(uploadsPath));
app.use('/assets', cors({ origin: env.origin }), express.static(assetsPath));
app.use('/img', cors({ origin: env.origin }), express.static(imgPath));
app.use('/paid_kundli_pdf', cors({ origin: env.origin }), express.static(paidKundliPath));

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
app.use('/api', appointmentDurationRoutes);
app.use('/api', slotBookingRoutes);
app.use('/api', architectRoomRoutes);
app.use('/api', architectServiceOrderRoutes);





// Start server with DB connection
const startServer = async () => {
  try {
    await sequelize.authenticate();
    await loadAppConfig();
    await initRedis(); // Initialize Redis cache
    console.log('Connected to MySQL database.');

    app.listen(PORT, () => {
      console.log(`Product service running at ${PORT}`);
    });

  } catch (err) {
    console.error('Failed to connect to DB:', err.message);
    process.exit(1);
  }
};

startServer();
