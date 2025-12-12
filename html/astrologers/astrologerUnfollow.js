import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import Joi from "joi";
import { Op } from "sequelize";
import { checkUserApiKey } from "../_helpers/common.js";
import Follower from "../_models/followers.js";

dotenv.config();
const router = express.Router();
const upload = multer();

router.post("/astrologerUnfollow", upload.none(), async (req, res) => {
  const schema = Joi.object({
    api_key: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    user_uni_id: Joi.string().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 0,
      message: "Validation failed",
      errors: error.details,
      msg: error.details.map((err) => err.message).join("\n"),
    });
  }

  const { api_key, astrologer_uni_id, user_uni_id } = req.body;

  try {
    const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
    if (!isAuthorized) {
      return res.status(401).json({
        status: 0,
        error_code: 101,
        msg: "Unauthorized User... Please login again",
      });
    }

    // Check if it's already unfollowed
    const count = await Follower.count({
      where: {
        astrologer_uni_id,
        user_uni_id,
        status: 0,
      },
    });

    if (count <= 0) {
      const existing = await Follower.findOne({
        where: {
          astrologer_uni_id,
          user_uni_id,
        },
      });

      if (existing) {
        await existing.update({ status: 0 });
      } else {
        await Follower.create({
          astrologer_uni_id,
          user_uni_id,
          status: 0,
        });
      }

      return res.status(200).json({
        status: 1,
        msg: "Successfully Unfollow",
      });
    } else {
      return res.status(200).json({
        status: 0,
        msg: "Already Unfollow",
      });
    }
  } catch (err) {
    console.error("Error in astrologerUnfollow:", err);
    return res.status(500).json({
      status: 0,
      msg: "Something went wrong.. Try Again",
    });
  }
});

export default router;
