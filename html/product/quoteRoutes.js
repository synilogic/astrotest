// routes/quoteRoutes.js
import express from 'express';
import { getQuote } from './quoteController.js';
import multer from 'multer';
const router = express.Router();
const upload = multer();

router.post('/getQuote',upload.none(), getQuote);

export default router;
