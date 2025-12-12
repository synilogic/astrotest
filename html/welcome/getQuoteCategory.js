import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import Joi from "joi";
import { Op } from "sequelize";
import QuoteCategoryModel from "../_models/quote_categories.js";

dotenv.config();
const router = express.Router();
const upload = multer();

router.post("/getQuoteCategory", upload.none(), async (req, res) => {
  try {
    // Ensure req.body is always an object
    const body = req.body || {};

    // Validate input
    const schema = Joi.object({
      offset: Joi.number().min(0).optional().allow(null, ''),
      status: Joi.any().optional().allow(null, ''),
    });

    const { error } = schema.validate(body);
    if (error) {
      return res.status(400).json({
        status: 0,
        message: "Validation failed",
        errors: error.details,
        msg: error.details.map((err) => err.message).join("\n"),
      });
    }

    // Parse offset safely, fallback to 0
    const offset = parseInt(body.offset) || 0;
    const limit = 6;

    // Default to status = 1
    const status = body.status !== undefined && body.status !== '' && body.status !== null ? body.status : 1;

    const where = { status };

    const categories = await QuoteCategoryModel.findAll({
      where,
      order: [["id", "DESC"]],
      limit,
      offset,
    });

    if (!categories || categories.length === 0) {
      return res.status(200).json({
        status: 0,
        msg: "No Record Found",
      });
    }

    return res.status(200).json({
      status: 1,
      msg: "Success",
      offset: offset + limit,
      data: categories,
    });
  } catch (err) {
    console.error("Error in getQuoteCategory:", err);
    return res.status(500).json({
      status: 0,
      msg: "Something went wrong... Try again",
    });
  }
});

export default router;
