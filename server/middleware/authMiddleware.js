// =================================================================
// BATCHBOOK API | AUTHENTICATION MIDDLEWARE (middleware/authMiddleware.js)
// =================================================================

// -----------------------------------------------------------------
// IMPORTS
// -----------------------------------------------------------------

import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // Import the User model to fetch user data

// -----------------------------------------------------------------
// PROTECTION MIDDLEWARE
// -----------------------------------------------------------------

/**
 * Middleware to protect routes that require authentication.
 * It verifies a JWT from the Authorization header.
 * If the token is valid, it fetches the user from the database and
 * attaches them to the request object as `req.user`.
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Check for the Authorization header and ensure it's a Bearer token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 2. Extract the token from the "Bearer <token>" string
      token = req.headers.authorization.split(' ')[1];

      // 3. Verify the token using the secret key
      // This will throw an error if the token is invalid or expired
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Fetch the user associated with the token's ID
      // We attach the user object to the request (`req.user`) for use in subsequent route handlers.
      // We explicitly exclude the password field for security.
      req.user = await User.findById(decoded.id).select('-password');

      // If user is not found with this ID (e.g., user was deleted), deny access
      if (!req.user) {
          return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      // 5. Proceed to the next middleware or route handler
      next();
    } catch (error) {
      // This block catches errors from jwt.verify (e.g., token expired, invalid signature)
      console.error('Token verification failed:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // If no token is found in the header at all
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// -----------------------------------------------------------------
// EXPORT
// -----------------------------------------------------------------

export { protect };
