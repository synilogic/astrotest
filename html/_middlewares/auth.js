import jwt from "jsonwebtoken";

// Load secret from env
const JWT_SECRET = process.env.JWT_SECRET || 'syniastro_secret';

const authenticateToken = (req, res, next) => {
  //console.log("hiii");
  // Get token from Authorization header (Bearer token)
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expecting "Bearer <token>"

  if (!token) {
    return res.status(401).json({ status: 0, msg: 'Access denied. No token provided.' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Save decoded payload to request
    next();
  } catch (err) {
    return res.status(403).json({ status: 0, msg: 'Invalid or expired token.' });
  }
};


export default authenticateToken;
