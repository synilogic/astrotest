import express from 'express';
import multer from 'multer';
import { paidKundliManualCalculation } from './paidKundliManualController.js';
import { paidKundliManualListController } from './paidKundliManualController.js';
import { paidKundliManualPurchaseController } from './paidKundliManualController.js';
import { paidKundliManualOrderList } from './paidKundliManualController.js';
const router = express.Router();
const upload = multer();

router.post('/paidKundliManualCalculation',upload.none(), paidKundliManualCalculation);
router.post('/paidKundliManualList', upload.none(), paidKundliManualListController);
router.post('/paidKundliManualPurchase', upload.none(), paidKundliManualPurchaseController);
router.post('/paidKundliManualOrderList', upload.none(), paidKundliManualOrderList);



export default router;

