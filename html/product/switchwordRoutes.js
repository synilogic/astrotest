import express from 'express';
import multer from 'multer';
import { switchwordListController } from './switchwordController.js';
import { switchwordCalculation } from './switchwordCalculationController.js'
import { switchwordPurchase } from './switchwordPurchaseController.js'
import { switchwordPurchaseList } from './switchwordPurchaseListController.js'
const router = express.Router();
const upload = multer();
router.post('/switchwordList', upload.none(), switchwordListController);
router.post('/switchwordCalculation', upload.none(), switchwordCalculation);
router.post('/switchwordPurchase', upload.none(), switchwordPurchase);
router.post('/switchwordPurchaseList',upload.none(), switchwordPurchaseList);
export default router;
