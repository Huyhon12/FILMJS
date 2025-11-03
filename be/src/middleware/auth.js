// File: middleware/auth.js

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET; 
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in the environment variables");
}

const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Không tìm thấy token, yêu cầu đăng nhập' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        req.user = { 
            customerId: decoded.id 
        };
        
        next();
    } catch (err) {
        console.error('Token verification error:', err.message);
        res.status(401).json({ message: 'Token không hợp lệ' });
    }
};

module.exports = auth;