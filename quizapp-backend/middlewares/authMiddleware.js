import jwt from 'jsonwebtoken';

export const authenticateUser = (req, res, next) => {
  try {
    // 1. Get token from headers
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token missing or invalid' });
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Attach user info to request object
    req.user = {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username
    };

    next(); // Go to next middleware / controller
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: 'Authentication failed' });
  }
};
