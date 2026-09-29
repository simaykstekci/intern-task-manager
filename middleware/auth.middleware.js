import jwt from 'jsonwebtoken';
export const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            error: 'Authentication required. Bearer token missing.',
        });
        return;
    }
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'dev-secret-key-fallback';
    try {
        const decoded = jwt.verify(token, secret);
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
        };
        next();
    }
    catch (err) {
        res.status(401).json({
            error: 'Invalid or expired authentication token',
        });
    }
};
