// =================================================================
// BATCHBOOK API | AUTHENTICATION ROUTES (routes/authRoutes.js)
// =================================================================

// -----------------------------------------------------------------
// IMPORTS
// -----------------------------------------------------------------

import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // Import the User model
import { protect } from '../middleware/authMiddleware.js'; // Import protection middleware

// Initialize the express router
const router = express.Router();

// -----------------------------------------------------------------
// HELPER FUNCTION - GENERATE JWT
// -----------------------------------------------------------------

/**
 * Generates a signed JSON Web Token.
 * @param {string} id The user ID to embed in the token.
 * @returns {string} The signed JWT.
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d', // Token will expire in 7 days
  });
};


// -----------------------------------------------------------------
// ROUTE DEFINITIONS
// -----------------------------------------------------------------

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validation: Check if all required fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    // 2. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // 3. Create new user in the database
    // The password will be automatically hashed by the pre-save hook in the User model
    const user = await User.create({
      name,
      email,
      password,
    });

    // 4. If user was created successfully, respond with user data and a token
    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});


// @desc    Authenticate a user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validation: Check for email and password
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide an email and password' });
        }

        // 2. Find user by email
        // We use .select('+password') to explicitly include the password,
        // which is excluded by default in the User model schema.
        const user = await User.findOne({ email }).select('+password');

        // 3. Check if user exists and if password matches
        // The `matchPassword` method is a custom method defined on our User schema
        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            // Use a generic message for security to not reveal whether the email or password was wrong
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});


// @desc    Get current user's profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
    try {
        // The 'protect' middleware has already verified the token and attached the user's
        // ID to the request object (req.user).
        // We find the user but exclude the password from the result.
        const user = await User.findById(req.user.id).select('-password');

        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});


// -----------------------------------------------------------------
// EXPORT
// -----------------------------------------------------------------

export default router;
