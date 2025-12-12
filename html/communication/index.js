import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import env from '../_config/env.js';
import chat from './chat.js';
import voiceCall from './voiceCall.js';
import videoCall from './videoCall.js';
import joinLiveStream from './joinLiveStream.js';
import { loadAppConfig } from '../bootstrapConfig.js';
import path from "path";
import upcomingLiveAstrologer from './upcomingLiveAstrologer.js';
import sendFileOnCall from './sendFileOnCall.js';
import getFileOnCall from './getFileOnCall.js';
import astroCallHistory from './astroCallHistory.js';


const PORT = process.env.communication_PORT || env.ports.communication;

const app = express();
app.use(helmet());
dotenv.config();
// Static file serving (for images like customer uploads)
app.use('/uploads', express.static(path.resolve('public/uploads')));
app.use('/assets', express.static(path.resolve('public/assets')));

// Setup context middleware early

const corsOptions = {
    origin: env.origin
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const prefix = "/api"
app.use( prefix, chat);
app.use( prefix, voiceCall);
app.use( prefix, videoCall);
app.use( prefix, joinLiveStream);
app.use( prefix, upcomingLiveAstrologer);
app.use( prefix, sendFileOnCall);
app.use( prefix, getFileOnCall);
app.use( prefix, astroCallHistory);



(async () => {
    try {
      await loadAppConfig(); // Load config from DB before handling requests
      app.listen(PORT, () => {
        console.log(`communication service is running on port ${PORT}.`);
      });
    } catch (error) {
      console.error('Error loading app config:', error);
      process.exit(1); // Exit if config fails
    }
  })();
  




