// =================================================================
// BATCHBOOK API | JWT UTILITIES (utils/tokenUtils.js)
// =================================================================

// -----------------------------------------------------------------
// IMPORTS
// -----------------------------------------------------------------

import jwt from 'jsonwebtoken';

// -----------------------------------------------------------------
// UTILITY FUNCTIONS
// -----------------------------------------------------------------

/**
 * Generates a signed JSON Web Token for a given user ID.
 *
 * @param {string} userId The MongoDB user ID (_id) to embed in the token's payload.
 * @returns {string} A signed JSON Web Token.
 * @throws {Error} if the JWT_SECRET is not defined in environment variables.
 */
const generateToken = (userId) => {
  // Critical security check: ensure the secret key is available.
  if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
    // In a real application, you might want to throw or exit to prevent insecure operation.
    throw new Error('JWT secret key is not configured.');
  }

  // Create the payload for the token.
  const payload = { id: userId };

  // Sign the token with the secret and set an expiration date.
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '30d', // The token will be valid for 30 days.
  });
};

/**
 * Verifies a JWT and returns its decoded payload.
 *
 * @param {string} token The JSON Web Token to verify.
 * @returns {object} The decoded payload from the token (e.g., { id: '...', iat: ..., exp: ... }).
 * @throws {JsonWebTokenError} if the token is invalid, expired, or malformed.
 */
const verifyToken = (token) => {
  if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
    throw new Error('JWT secret key is not configured.');
  }

  try {
    // jwt.verify will automatically handle checking the signature and expiration.
    // If verification fails, it throws an error which is caught by the catch block.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    // Re-throw the original error from jsonwebtoken (e.g., TokenExpiredError, JsonWebTokenError).
    // This allows the calling function (like your auth middleware) to handle it specifically.
    throw error;
  }
};

// -----------------------------------------------------------------
// EXPORT
// -----------------------------------------------------------------

export { generateToken, verifyToken };
