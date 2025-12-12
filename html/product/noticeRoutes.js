import express from 'express';
import { getNotice } from './noticeController.js';
import multer from 'multer';

const router = express.Router();
const upload = multer();

router.post('/getNotice',upload.none(), getNotice); 

export default router;