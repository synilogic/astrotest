import { body, validationResult } from 'express-validator';

// Validation rules matching PHP validation
export const validateSanjeeviniPurchase = [
  body('api_key').notEmpty().withMessage('API key is required'),
  body('user_uni_id').notEmpty().withMessage('User unique ID is required'),
  body('sanjeevini_id').notEmpty().withMessage('Sanjeevini ID is required'),
  body('offer_code').optional(),
  body('reference_id').optional(),
  body('wallet_check').optional().isInt({ min: 0, max: 1 }),
  body('payment_method').optional(),
  body('is_updated').optional().isInt({ min: 0, max: 1 }),
];

// Middleware to handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 0,
      errors: errors.array(),
      message: 'Something went wrong',
      msg: errors.array().map(error => error.msg).join('\n'),
    });
  }
  next();
};

// API logging middleware (equivalent to saveapiLogs in PHP)
export const logApiRequest = (req, res, next) => {
  try {
    // Log API request details
    console.log('API Request:', {
      endpoint: req.originalUrl,
      method: req.method,
      body: req.body,
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // You can implement actual logging to database here
    // Similar to saveapiLogs function in PHP
    
    next();
  } catch (error) {
    console.error('Error logging API request:', error);
    next();
  }
}; 