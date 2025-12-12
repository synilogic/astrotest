
import express from 'express';
import multer from 'multer';
import {
  productCategory,
  productDetail,
  products,      
} from './productController.js';


const upload = multer();
const router = express.Router();

router.post('/productCategory', upload.none(), productCategory);
router.post('/products', upload.none(), products);
router.post('/productDetail', upload.none(), productDetail);


export default router;
