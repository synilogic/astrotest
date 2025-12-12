import express from 'express';
import multer from 'multer';
import { getReviews } from './reviewController.js';
import { addReviews } from './addReviewsController.js';


const router = express.Router();
const upload = multer();

router.post('/getReviews', upload.none(), getReviews);
router.post('/addReviews', upload.none(), addReviews);

export default router;


