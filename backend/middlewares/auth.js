// =====================================================
// Middleware ตรวจสอบ JWT
// ตรวจสอบ Authorization header และแนบข้อมูลผู้ใช้ลง req.user ให้ทุก route ใช้ต่อ
// =====================================================




const jwt = require('jsonwebtoken');


// ==============================
// JWT verification flow
// ==============================
module.exports = (req, res, next) => {
    try {
        const auth = req.headers.authorization;
        if (!auth || !auth.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const token = auth.split(' ')[1];
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        // attach user info to request
        req.user = {
            id: payload.id,
            role: payload.role,
            adminLevel: payload.adminLevel || null,
            username: payload.username,
            fullname: payload.fullname,
            accountSource: payload.accountSource
        };

        next();
    } catch (err) {
        console.error('Auth Middleware Error:', err.message);
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};