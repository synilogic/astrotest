import express from 'express';
import multer from 'multer';
import { getSuggestionHistoryController } from './suggestionHistoryController.js';

const router = express.Router();
const upload = multer();

router.post('/getSuggestionHistory', upload.none(), getSuggestionHistoryController);

export default router;