import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import env from '../_config/env.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import create from './create.js';
import list from './list.js';
import update from './update.js';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const PORT = process.env.PORT || env.ports.banners;
const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: env.origin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from main public/uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Banner routes
const prefix = "/banners";
app.use(prefix, create);
app.use(prefix, list);
app.use(prefix, update);

app.listen(PORT, () => {
  console.log(`Banner service is running on port ${PORT}.`);
});
