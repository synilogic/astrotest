
import express from 'express';
import multer from 'multer';
import {
  productCategory,
  productDetail,
  products,
  addProduct
} from './productController.js';


const upload = multer();
const router = express.Router();

router.post('/productCategory', upload.none(), productCategory);
router.post('/products', upload.none(), products);
router.post('/productDetail', upload.none(), productDetail);
router.post('/addProduct', upload.none(), addProduct);


export default router;
