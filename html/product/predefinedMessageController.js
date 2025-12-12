import { Op, Sequelize } from 'sequelize';
import { PredefinedMessage } from '../_models/predefinedMessage.js';
import { checkUserApiKey } from '../_helpers/common.js';
import { PredefinedMessageCategory } from '../_models/predefinedMessageCategoryModel.js';
// import { saveApiLogs, updateApiLogs } from '../_helpers/helper.js';

const LIMIT = 15;

// ✅ GET predefined messages
export const getPredefinedMessages = async (req, res) => {
    // const apiLog = await saveApiLogs(req.body);

    const {
        api_key,
        user_uni_id,
        message_type = 'chat',
        category_id,
        created_by,
        offset = 0,
    } = req.body;

    const errors = [];
    if (!api_key) errors.push("api_key is required");
    if (!user_uni_id) errors.push("user_uni_id is required");

    if (errors.length > 0) {
        const result = {
            status: 0,
            errors,
            message: 'Something went wrong',
            msg: errors.join('\n'),
        };
        // await updateApiLogs(apiLog, result);
        return res.json(result);
    }

    const isValid = await checkUserApiKey(api_key, user_uni_id);
    if (!isValid) {
        const result = {
            status: 0,
            error_code: 101,
            msg: 'Unauthorized User... Please login again',
        };
        // await updateApiLogs(apiLog, result);
        return res.json(result);
    }

    const where = {
        status: 1,
        message_type,
    };

    if (category_id !== undefined && category_id !== '') {
        where.predefined_message_category_id = category_id;
    }

    if (created_by !== undefined && created_by !== '') {
        where.created_by = created_by;
    }

    try {
        const messages = await PredefinedMessage.findAll({
            where,
            offset: parseInt(offset),
            limit: LIMIT,
            order: [['id', 'DESC']],
        });

        const result = messages.length > 0
            ? {
                status: 1,
                msg: 'Result Found',
                offset: parseInt(offset) + LIMIT,
                predefined_messages: messages,
            }
            : { status: 0, msg: 'Data Not Found !!' };

        // await updateApiLogs(apiLog, result);
        return res.json(result);
    } catch (error) {
        return res.json({ status: 0, msg: 'Server Error', error: error.message });
    }
};

// ✅ GET predefined message categories (from same table)
export const getPredefinedMessageCategory = async (req, res) => {
    const { api_key, user_uni_id, offset = 0 } = req.body;

    const errors = [];
    if (!api_key) errors.push("api_key is required");
    if (!user_uni_id) errors.push("user_uni_id is required");

    if (errors.length > 0) {
        return res.json({
            status: 0,
            errors,
            message: 'Something went wrong',
            msg: errors.join('\n'),
        });
    }

    const isValid = await checkUserApiKey(api_key, user_uni_id);
    if (!isValid) {
        return res.json({
            status: 0,
            error_code: 101,
            msg: 'Unauthorized User... Please login again',
        });
    }

    try {
        const categories = await PredefinedMessageCategory.findAll({
            attributes: [
                'id',
                'title',
                'status',
                'created_at',
                'updated_at',
                [
                    Sequelize.literal(`(
                        SELECT COUNT(*) 
                        FROM predefined_messages AS pm 
                        WHERE pm.predefined_message_category_id = PredefinedMessageCategory.id
                          AND pm.status = 1
                    )`),
                    'message_count'
                ]
            ],
            where: { status: 1 },
            order: [['id', 'DESC']],
            offset: parseInt(offset),
            limit: LIMIT,
            raw: true,
        });

        const result = categories.length > 0
            ? {
                status: 1,
                msg: 'Result Found',
                offset: parseInt(offset) + LIMIT,
                predefined_message_category: categories,
            }
            : { status: 0, msg: 'Data Not Found !!' };

        return res.json(result);
    } catch (error) {
        return res.json({ status: 0, msg: 'Server Error', error: error.message });
    }
};