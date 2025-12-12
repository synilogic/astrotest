import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import sanjeeviniRoutes from './sanjeeviniRoutes.js';
import db from '../_config/db.js';


dotenv.config();

const app = express();
const PORT = process.env.SANJEVANI_PORT || 8008;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api', sanjeeviniRoutes);

// Health Check
app.get('/', (req, res) => {
  res.send('Sanjeevini service running...');
});

// DB Test & Server Start
(async () => {
  try {
    await db.authenticate();
    console.log('Database connected for Sanjeevini.');

    app.listen(PORT, () => {
      console.log(`Sanjeevini service listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Unable to connect to the database:', err);
    process.exit(1);
  }
})();
