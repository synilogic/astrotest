import express from 'express';
import Joi from 'joi';
import multer from 'multer';
import dotenv from 'dotenv';
import { checkUserApiKey } from '../_helpers/common.js';
import UserAddress from '../_models/userAddress.js';

dotenv.config();
const router = express.Router();
const upload = multer();

router.post('/addAddress', upload.none(), async (req, res) => {


  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    name: Joi.string().required(),
    email: Joi.string().required(),
    phone: Joi.string().required(),
    house_no: Joi.string().optional().allow(null, ''),
    street_area: Joi.string().optional().allow(null, ''),
    landmark: Joi.string().optional().allow(null, ''),
    address: Joi.string().optional().allow(null, ''),
    city: Joi.string().optional().allow(null, ''),
    state: Joi.string().optional().allow(null, ''),
    country: Joi.string().optional().allow(null, ''),
    latitude: Joi.string().optional().allow(null, ''),
    longitude: Joi.string().optional().allow(null, ''),
    pincode: Joi.string().optional().allow(null, ''),
    status: Joi.number().optional()
  });

   

  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const result = {
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map(e => e.message).join('\n')
    };

    return res.status(400).json(result);
  }

  const { api_key, user_uni_id } = value;

  const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
  if (!isAuthorized) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again'
    };
   
    return res.status(401).json(result);
  }

  try {
    const newAddress = await UserAddress.create({
      ...value,
      status: 1
    });

    const result = {
      status: 1,
      data: newAddress,
      msg: 'User Address created'
    };

    return res.status(200).json(result);
  } catch (err) {
    console.error('Error creating address:', err);
    const result = {
      status: 0,
      msg: 'Something went wrong'
    };

    return res.status(500).json(result);
  }
});

export default router;
