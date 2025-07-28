// =================================================================
// BATCHBOOK API | JWT GENERATOR UTILITY (utils/generateToken.js)
// =================================================================

// -----------------------------------------------------------------
// IMPORTS
// -----------------------------------------------------------------

// Import the jsonwebtoken library, used for creating and verifying tokens.
import jwt from 'jsonwebtoken';

// -----------------------------------------------------------------
// TOKEN GENERATOR FUNCTION
// -----------------------------------------------------------------

/**
 * Generates a signed JSON Web Token for a given user ID.
 *
 * @param {string} id The MongoDB user ID (_id) to embed in the token's payload.
 * @returns {string} A signed JSON Web Token.
 */
const generateToken = (id) => {
  // Check if the JWT_SECRET is available in the environment variables.
  // This is a critical security check.
  if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
    process.exit(1);
  }

  // Create and sign the token.
  return jwt.sign(
    // 1. Payload: The data to store in the token. Here, we store the user's ID.
    // This allows us to identify the user when the token is sent back to the server.
    { id },

    // 2. Secret Key: The secret used to sign the token. It's fetched from
    // environment variables to keep it secure and out of the source code.
    process.env.JWT_SECRET,

    // 3. Options: Configuration for the token, such as its expiration time.
    {
      expiresIn: '30d', // The token will be valid for 30 days.
    }
  );
};

// -----------------------------------------------------------------
// EXPORT
// -----------------------------------------------------------------

// Export the function to make it available for use in other files,
// such as your authentication controller.
export default generateToken;
