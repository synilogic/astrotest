import express from 'express';
import multer from 'multer';
import { paidKundliOrderList } from './paidKundliOrderController.js';
import { paidKundliCalculation } from './paidKundliCalculationController.js';
import { paidKundliManualPurchaseController } from './paidKundliPurchaseController.js';
const upload = multer();
const router = express.Router();

router.post('/paidKundliOrderList', upload.none(), paidKundliOrderList);
router.post('/paidKundliCalculation', upload.none(), paidKundliCalculation);
router.post('/paidKundliPurchase', upload.none(),  paidKundliManualPurchaseController);
export default router;
