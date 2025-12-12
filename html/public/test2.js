import express from "express";
import dotenv from 'dotenv';
import bcryptjs from "bcryptjs";
import Joi from "joi";
import db from "../_config/db.js";
import fs from "fs";
import authenticateToken from  "../_middlewares/auth.js";
import UserOtp from "../_models/userOtps.js";
import path from "path";
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from "url";
import { sendDltSms } from "../_helpers/otpSend.js";
import { formatDateTime } from "../_helpers/dateTimeFormat.js";
import { Op } from "sequelize";
import { generateUserApiKey,generateCustomerUniId,getUserData ,generateAstrologerUniId,getAstrologerData,checkUserApiKey,uploadImage} from "../_helpers/common.js";
import User from "../_models/users.js";
import Customer from "../_models/customers.js";
import { ROLE_IDS } from '../_config/constants.js';
import Astrologer from "../_models/astrologers.js";
import AstrologerGallery from "../_models/astrologer_galleries.js";
import AstrologerDocument from "../_models/astrologer_documents.js";
import multer from "multer";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// import getAstrologerAssets from "../_helpers/common.js";

const upload =multer();
dotenv.config();
const router = express.Router();
// Joi Validation schema
const astrologerSchema = Joi.object({
  api_key: Joi.string().required(),
  astrologer_uni_id: Joi.string().required(),
  name: Joi.string().required(),
  email: Joi.string().email().max(50).required(),
  birth_date: Joi.string().required(),
  gender: Joi.string().required(),
  address: Joi.string().required(),
  house_no: Joi.string().required(),
  street_area: Joi.string().required(),
  landmark: Joi.string().required(),
  city: Joi.string().optional().allow(''),
  state: Joi.string().optional().allow(''),
  country: Joi.string().optional().allow(''),
  latitude: Joi.number().optional().allow(null),
  longitude: Joi.number().optional().allow(null),
  pin_code: Joi.string().required(),
  experience: Joi.string().required(),
  display_name: Joi.string().required(),
});

router.post('/astrologer-savedata1',upload.any(), async (req, res) => {
  //const apiLog = await saveApiLogs(req.body);

  try {
    // Validate request data with Joi
    const { error } = astrologerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 0,
        errors: error.details,
        message: "Validation failed",
        msg: error.details.map((e) => e.message).join("\n"),
      });
    }

    const {
      api_key,
      astrologer_uni_id,
      name,
      email,
      birth_date,
      gender,
      address,
      house_no,
      street_area,
      landmark,
      city,
      state,
      country,
      latitude,
      longitude,
      pin_code,
      experience,
      display_name,
    } = req.body;

    const userValidation = await User.findOne({
      where: { user_uni_id: astrologer_uni_id },
    });

    // Check API key validation
    const isValid = await checkUserApiKey(api_key, astrologer_uni_id);
    if (!isValid) {
      const result = {
        status: 0,
        error_code: 101,
        msg: "Unauthorized User... Please login again",
      };
      //await updateApiLogs(apiLog, result);
      return res.status(401).json(result);
    }

    // Unique email validation for astrologers (role_id from config)
    const existingUser = await User.findOne({
      where: {
        email,
        role_id: ROLE_IDS.ASTROLOGER,
        trash: 0,
        ...(userValidation?.id && { id: { [Op.ne]: userValidation.id } }),
      },
    });

    if (existingUser) {
      return res.status(400).json({
        status: 0,
        msg: "Email already in use by another astrologer.",
      });
    }

    // Update Astrologer
    const astroData = await Astrologer.findOne({
      where: { astrologer_uni_id },
    });

    if (!astroData) {
      return res.status(404).json({ status: 0, msg: "Astrologer not found" });
    }

    const updateAstrologer = {
      display_name,
      birth_date,
      pin_code,
      experience,
      gender,
      house_no,
      street_area,
      landmark,
      address,
      city,
      state,
      country,
      longitude,
      latitude,
    };

    if (astroData.process_status < 1) {
      updateAstrologer.process_status = 1;
    }

    await astroData.update(updateAstrologer);

    // Update User
    await User.update(
      { name, email },
      { where: { user_uni_id: astrologer_uni_id } }
    );

    const filter = { user_uni_id: astrologer_uni_id };
    const astroFullData = await getAstrologerData(filter, true);

    const result = {
      status: 1,
      data: astroFullData,
      msg: "User Data Successfully Updated",
    };

   // await updateApiLogs(apiLog, result);
    return res.json(result);
  } catch (err) {
    console.error("Error in saveAstrologerStep1:", err);
    const result = {
      status: 0,
      msg: "Something went wrong.. Try Again",
    };
   // await updateApiLogs(apiLog, result);
    return res.status(500).json(result);
  }
});

router.post('/saveAstrologerStep2',upload.any(),async (req, res) => {
  
      console.log("body",req.body);
  const schema = Joi.object({
    api_key: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    language_id: Joi.string().allow(null, ''),
    category_id: Joi.string().allow(null, ''),
    skills_id: Joi.string().allow(null, ''),
    long_biography: Joi.string().allow(null, ''),
    degrees: Joi.string().allow(null, '')
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    const response = {
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map(d => d.message).join('\n')
    };
    // await updateApiLogs(apiLog, response);
    return res.status(400).json(response);
  }

  const {
    api_key,
    astrologer_uni_id,
    language_id = '',
    skills_id = '',
    category_id = '',
    long_biography,
    degrees
  } = value;

  const authorized = await checkUserApiKey(api_key, astrologer_uni_id);
  if (!authorized) {
    const response = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again'
    };
    // await updateApiLogs(apiLog, response);
    return res.status(401).json(response);
  }

  const astro = await Astrologer.findOne({ where: { astrologer_uni_id } });
  console.log("astrologers",astro);
  if (!astro) {
    const response = { status: 0, msg: 'Astrologer not found' };
    // await updateApiLogs(apiLog, response);
    return res.status(404).json(response);
  }

  // Normalize string to array
  const parseArray = (str) => str?.replace(/\[|\]|\s/g, '')?.split(',').filter(Boolean) || [];

  const languages = parseArray(language_id);
  const skills = parseArray(skills_id);
  const categories = parseArray(category_id);

  await astro.setLanguages(languages);
  await astro.setSkills(skills);
  // await astro.setCategories(categories);

  const updateData = {
    long_biography,
    ...(degrees && { degrees })
  };

  if (astro.process_status < 2) {
    updateData.process_status = 2;
  }

  await Astrologer.update(updateData, {
    where: { astrologer_uni_id }
  });

  const filter = { astrologer_uni_id };
  const astroData = await getAstrologerData(filter, 1);
       console.log("astro data",astroData);
  const result = {
    status: 1,
    data: astroData,
    msg: 'User Data Successfully Updated'
  };

  // await updateApiLogs(apiLog, result);
  return res.json(result);
});

router.post("/saveAstrologerStep4", upload.any(), async (req, res) => {
  try {
    const schema = Joi.object({
      api_key: Joi.string().required(),
      astrologer_uni_id: Joi.string().required(),
      astro_img: Joi.string().optional().allow(null, ""),
      documents: Joi.array().items(
        Joi.object({
          document_type: Joi.string().optional().allow(null, ""),
          front: Joi.string().optional().allow(null, ""),
          back: Joi.string().optional().allow(null, "")
        })
      ).optional(),
      gallery_images: Joi.array().items(Joi.string()).optional(),
    });

    const { error, value: attributes } = schema.validate(req.body, { allowUnknown: true });
    if (error) {
      return res.status(400).json({
        status: 0,
        msg: error.details.map(e => e.message).join("\n"),
        errors: error.details,
      });
    }

    const { api_key, astrologer_uni_id } = attributes;

    if (!(await checkUserApiKey(api_key, astrologer_uni_id))) {
      return res.status(401).json({
        status: 0,
        error_code: 101,
        msg: "Unauthorized User... Please login again",
      });
    }

    const astrologer = await Astrologer.findOne({ where: { astrologer_uni_id } });
    if (!astrologer) {
      return res.status(404).json({ status: 0, msg: "Astrologer not found" });
    }

    const astroImgFolder = path.join(__dirname, "../public/uploads/astrologer/icon");
    const docFolder = path.join(__dirname, "../public/uploads/astrologer/doc");

    [astroImgFolder, docFolder].forEach(folder => {
      if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
    });

    const saveFileWithName = (fieldname, folder, customFilename) => {
      const file = req.files?.find(f => f.fieldname === fieldname);
      if (file) {
        const ext = path.extname(file.originalname) || ".jpg";
        const filename = `${customFilename}${ext}`;
        const fullPath = path.join(folder, filename);
        fs.writeFileSync(fullPath, file.buffer);
        return filename;
      }
      return null;
    };

    // Astro Image
    let astroImgFilename = astrologer.astro_img;

    const astroFile = req.files?.find(f => f.fieldname === "astro_img");
    if (astroFile) {
      if (astroImgFilename) {
        const oldPath = path.join(astroImgFolder, astroImgFilename);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      astroImgFilename = "astro_img.jpg";
      const savePath = path.join(astroImgFolder, astroImgFilename);
      fs.writeFileSync(savePath, astroFile.buffer);
      attributes.astro_img = astroImgFilename;
    }

    // Documents
    if (attributes.documents?.length > 0) {
      await Promise.all(
        attributes.documents.map(async (doc, index) => {
          const frontField = `documents[${index}][front]`;
          const backField = `documents[${index}][back]`;

          const frontFile = saveFileWithName(frontField, docFolder, `document.${index}.front`);
          const backFile = saveFileWithName(backField, docFolder, `document.${index}.back`);

          await AstrologerDocument.create({
            user_uni_id: astrologer_uni_id,
            document_type: doc.document_type || null,
            front: frontFile || doc.front || null,
            back: backFile || doc.back || null,
          });
        })
      );
    }

    // Gallery Images
    if (attributes.gallery_images?.length > 0) {
      await Promise.all(
        attributes.gallery_images.map(async img => {
          await AstrologerGallery.create({
            astrologer_uni_id,
            image: img,
          });
        })
      );
    }

    await astrologer.update({ astro_img: attributes.astro_img });
    const filter = { astrologer_uni_id };
    const astrologerData = await getAstrologerData(filter,1);
    if (astrologerData){
        const user = await Astrologer.findOne({
                where: { astrologer_uni_id },
                include: [{
                    model: User,
                    as : 'user',
                    where: { user_uni_id: astrologer_uni_id },
                    required: false
                }]
            });
      }

    return res.json({
      status: 1,
      data: {
          status: 1,
          data: astrologerData,
          msg: 'Document Uploaded Successfully',
       },
      msg: "Astrologer Profile Updated",
    });
  } catch (err) {
    console.error("Error in /saveAstrologerStep4:", err);
    return res.status(500).json({
      status: 0,
      msg: "Internal Server Error",
    });
  }
});


export default router;