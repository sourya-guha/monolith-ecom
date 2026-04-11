const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    console.log('[auth] Missing bearer token for', req.method, req.originalUrl);
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[auth] Authenticated user:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.log('[auth] Invalid token for', req.method, req.originalUrl, err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};
