import express from 'express';
import { sanjeeviniList } from './sanjeeviniController.js';

const router = express.Router();
router.post('/sanjeeviniList', sanjeeviniList);

export default router;
