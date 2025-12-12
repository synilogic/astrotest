import express from 'express';
import multer from 'multer'

import { sanjeeviniList } from './sanjeeviniController.js';
import { sanjeeviniCalculation } from './sanjeeviniCalculationController.js';
import { sanjeeviniPurchase, sanjeeviniPurchaseWithGateway } from './sanjeeviniPurchaseController.js'
import { sanjeeviniPurchaseList } from './sanjeeviniPurchaseListController.js';
import { validateSanjeeviniPurchase, handleValidationErrors, logApiRequest } from '../_middlewares/sanjeeviniValidation.js';
const upload = multer();
const router = express.Router();
router.post('/sanjeeviniList',upload.none(), sanjeeviniList);
router.post('/sanjeeviniCalculation',upload.none(), sanjeeviniCalculation);
router.post('/sanjeeviniPurchase', upload.none(), logApiRequest, validateSanjeeviniPurchase, handleValidationErrors, sanjeeviniPurchaseWithGateway);
router.post('/sanjeeviniPurchaseList',upload.none(), sanjeeviniPurchaseList);
router.post('/sanjeeviniPurchaseBasic', sanjeeviniPurchase);

export default router;

