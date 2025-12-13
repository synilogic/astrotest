import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import env from '../_config/env.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { readdir } from 'fs/promises';
import { initRedis } from '../_config/redis.js';

// Setup __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || env.ports.astrologers;

const app = express();
dotenv.config();

const corsOptions = {
    origin: env.origin
};
app.use(cors(corsOptions));

// Configure helmet to allow cross-origin resources for images
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const prefix = "/api";
// Serve static files - use __dirname to ensure correct path resolution
// Add CORS headers for static files
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', env.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static(path.join(__dirname, '../public/uploads')));

app.use('/assets', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', env.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static(path.join(__dirname, '../public/assets')));

console.log('Static files served from:', path.join(__dirname, '../public/uploads'));

// Dynamically load all route files
const loadRoutes = async () => {
    try {
        const files = await readdir(__dirname);
        const routeFiles = files.filter(file => {
            // Exclude index.js, non-JS files, and common/helper files
            return file.endsWith('.js') && 
                   file !== 'index.js' && 
                   !file.includes('common') &&
                   !file.includes('sequence');
        });

        // Dynamically import and register all route files
        for (const file of routeFiles) {
            try {
                const routeModule = await import(`./${file}`);
                if (routeModule.default && typeof routeModule.default === 'function') {
                    app.use(prefix, routeModule.default);
                    console.log(`✓ Loaded route: ${file}`);
                }
            } catch (err) {
                console.error(`✗ Failed to load route ${file}:`, err.message);
            }
        }
    } catch (err) {
        console.error('Error loading routes:', err);
    }
};

// Initialize routes and start server
(async () => {
    await loadRoutes();
    await initRedis(); // Initialize Redis cache
    
    app.listen(PORT, () => {
        console.log(`Astrologer service is running on port ${PORT}.`);
    });
})();
