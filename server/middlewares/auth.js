const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Vérifier la présence de JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    // Récupérer le token du header Authorization
    const authHeader = req.header('Authorization');
    console.log('Auth header received:', authHeader ? authHeader.substring(0, 30) + '...' : 'Missing');

    if (!authHeader) {
      return res.status(401).json({ message: 'No authentication token provided' });
    }

    // Vérifier le format du token (Bearer TOKEN)
    if (!authHeader.startsWith('Bearer ')) {
      console.log('Invalid token format - missing Bearer prefix');
      return res.status(401).json({ message: 'Invalid token format - missing Bearer prefix' });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      console.log('Token is empty after removing Bearer prefix');
      return res.status(401).json({ message: 'Token is empty' });
    }

    console.log('Attempting to verify token...');
    
    try {
      // Vérifier et décoder le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded successfully:', {
        userId: decoded._id || decoded.id,
        exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'No expiration'
      });

      // Trouver l'utilisateur
      const user = await User.findById(decoded._id || decoded.id);
      if (!user) {
        console.log('User not found in database:', decoded._id || decoded.id);
        return res.status(401).json({ message: 'User not found' });
      }

      console.log('User found:', {
        id: user._id,
        role: user.role
      });

      // Ajouter l'utilisateur à la requête
      req.user = user;
      req.token = token;

      next();
    } catch (jwtError) {
      console.error('JWT verification error:', {
        name: jwtError.name,
        message: jwtError.message
      });
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = auth; 