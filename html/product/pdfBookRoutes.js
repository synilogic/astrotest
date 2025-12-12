// routes/pdfBookRoutes.js

import express from 'express';
import multer from 'multer';
import {
  pdfBookCategory,
  pdfBookList
} from './pdfBookController.js';
import { pdfBookCalculation } from './pdfBookCalculationController.js';
import { pdfBookPurchase } from './pdfBookPurchaseController.js';
import { pdfBookPurchaseList } from './pdfBookOrderController.js'

const router = express.Router();
const upload = multer();

router.post('/pdfBookCategory', upload.none(), pdfBookCategory);
router.post('/pdfBookList',upload.none(), pdfBookList);
router.post('/pdfBookCalculation', upload.none(), pdfBookCalculation);
router.post('/pdfBookPurchase',upload.none(), pdfBookPurchase);
router.post('/pdfBookPurchaseList',upload.none(), pdfBookPurchaseList);
export default router;
