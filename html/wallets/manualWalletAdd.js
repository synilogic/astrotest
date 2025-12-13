import express from 'express';
import multer from 'multer';
import Joi from 'joi';
import dotenv from 'dotenv';
import WalletModel from '../_models/wallet.js';
import UserModel from '../_models/users.js';

dotenv.config();

const router = express.Router();
const upload = multer();

/**
 * Manual Wallet Add (Admin only)
 * POST /api/manualWalletAdd
 * Body: {
 *   user_uni_id: string,
 *   amount: number,
 *   description: string (optional)
 * }
 */
router.post('/manualWalletAdd', upload.none(), async (req, res) => {
  try {
    // Validation schema
    const schema = Joi.object({
      user_uni_id: Joi.string().required(),
      amount: Joi.number().positive().required(),
      description: Joi.string().optional().default('Manual wallet recharge by admin'),
      admin_note: Joi.string().optional()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.json({
        status: 0,
        msg: error.details[0].message
      });
    }

    const { user_uni_id, amount, description, admin_note } = value;

    // Check if user exists
    const user = await UserModel.findOne({
      where: { user_uni_id }
    });

    if (!user) {
      return res.json({
        status: 0,
        msg: 'User not found'
      });
    }

    // Generate unique reference ID
    const reference_id = `MANUAL_${Date.now()}`;

    // Create wallet entry
    const walletEntry = await WalletModel.create({
      user_uni_id,
      reference_id,
      gateway_order_id: reference_id,
      gateway_payment_id: '',
      transaction_code: 'add_wallet_manual_admin',
      wallet_history_description: description,
      transaction_amount: amount,
      amount: amount,
      main_type: 'cr', // credit
      status: 1, // completed
      offer_status: 0,
      gst_amount: 0,
      coupan_amount: 0,
      payment_method: 'Manual',
      where_from: 'admin',
      currency_code: 'INR',
      currency_symbol: '₹',
      exchange_rate: 1.00,
      admin_note: admin_note || ''
    });

    // Calculate new balance
    const creditResult = await WalletModel.findAll({
      where: {
        user_uni_id,
        main_type: 'cr',
        status: 1
      },
      attributes: [[WalletModel.sequelize.literal('SUM(amount / exchange_rate)'), 'total_cr']],
      raw: true
    });

    const debitResult = await WalletModel.findAll({
      where: {
        user_uni_id,
        main_type: 'dr',
        status: 1
      },
      attributes: [[WalletModel.sequelize.literal('SUM(amount / exchange_rate)'), 'total_dr']],
      raw: true
    });

    const totalCr = parseFloat(creditResult[0].total_cr) || 0;
    const totalDr = parseFloat(debitResult[0].total_dr) || 0;
    const newBalance = Number((totalCr - totalDr).toFixed(2));

    return res.json({
      status: 1,
      msg: 'Wallet amount added successfully',
      data: {
        user_uni_id,
        user_name: user.name,
        amount_added: amount,
        new_balance: newBalance,
        transaction_id: walletEntry.id,
        reference_id
      }
    });

  } catch (error) {
    console.error('[manualWalletAdd] Error:', error);
    return res.status(500).json({
      status: 0,
      msg: 'Internal server error',
      error: error.message
    });
  }
});

export default router;

