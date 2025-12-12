import express from 'express';
import multer from 'multer';

import { serviceAstrologerList } from './serviceAstrologerListController.js';
// import { serviceCalculation } from './serviceCalculationLogic.js';
import { serviceCalculation } from './serviceController.js'
import { servicePurchase } from './servicePurchaseController.js';
import { serviceVideoCall, serviceVideoCallValidator } from './serviceVideoCallController.js';
const router = express.Router();
const upload = multer();

router.post('/serviceAstrologerList', upload.none(),  serviceAstrologerList);
router.post('/serviceCalculation', upload.none(), serviceCalculation);
router.post('/servicePurchase',upload.none(), servicePurchase);
router.post('/serviceVideoCall', upload.none(),serviceVideoCallValidator, serviceVideoCall)
export default router;
