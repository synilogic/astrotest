
// import { validationResult } from 'express-validator';
import { checkUserApiKey } from '../_helpers/common.js';
import { serviceCalculationLogic } from './serviceCalculationLogic.js';
//import { saveApiLogs } from '../_helpers/helper.js';
import { constants } from '../_config/constants.js';

export const serviceCalculation = async (req, res) => {
    //const apiLog = await saveApiLogs(req.body);
    const { api_key, user_uni_id, customer_uni_id, astrologer_uni_id, service_assign_id } = req.body;

    if (!api_key || !user_uni_id || !customer_uni_id || !astrologer_uni_id || !service_assign_id) {
        return res.status(400).json({
            status: 0,
            msg: 'Missing required fields',
        });
    }

    const isValidUser = await checkUserApiKey(api_key, user_uni_id);
    if (!isValidUser) {
        return res.status(401).json({
            status: 0,
            error_code: 101,
            msg: 'Unauthorized User... Please login again',
        });
    }

    try {
        const result = await serviceCalculationLogic(req.body);

        // ✅ Safe check to avoid undefined access
        if (!result || typeof result.status === 'undefined') {
            return res.status(500).json({
                status: 0,
                msg: 'Invalid response from service calculation logic',
            });
        }

        return res.status(200).json(result);
    } catch (err) {
        console.error('Error in serviceCalculation:', err);
        return res.status(500).json({
            status: 0,
            msg: 'Internal Server Error',
        });
    }
};
