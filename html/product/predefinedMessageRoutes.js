// routes/predefinedMessageRoutes.js
import express from 'express';
import multer from 'multer';
import {
  getPredefinedMessages,
  getPredefinedMessageCategory,
} from './predefinedMessageController.js';

const router = express.Router();
const upload = multer();

router.post('/getPredefinedMessages', upload.none(), getPredefinedMessages);
router.post('/getPredefinedMessageCategory', upload.none(), getPredefinedMessageCategory);

export default router;
