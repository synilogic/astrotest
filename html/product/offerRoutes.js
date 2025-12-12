import express from 'express';
import multer from 'multer';
import { offerList } from './offerController.js';
const upload = multer();
const router = express.Router();
router.post('/offerList', upload.none(), offerList);
export default router;
