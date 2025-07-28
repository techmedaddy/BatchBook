// =================================================================
// BATCHBOOK API | AUTHENTICATION CONTROLLERS (controllers/authController.js)
// =================================================================

// -----------------------------------------------------------------
// IMPORTS
// -----------------------------------------------------------------

import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// -----------------------------------------------------------------
// HELPER FUNCTION - GENERATE JWT
// -----------------------------------------------------------------

/**
 * Generates a signed JSON Web Token.
 * @param {string} id The user ID to embed in the token payload.
 * @returns {string} The signed JWT.
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d', // Use expiry from .env or default to 7 days
  });
};


// -----------------------------------------------------------------
// CONTROLLER FUNCTIONS
// -----------------------------------------------------------------

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // 1. Validation
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide name, email, and password');
  }

  // 2. Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User with that email already exists');
  }

  // 3. Create new user
  // Password hashing is handled by the pre-save hook in the User model
  const user = await User.create({
    name,
    email,
    password,
  });

  // 4. Respond with user data and token if creation is successful
  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});


/**
 * @desc    Authenticate a user (login)
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 1. Check for email and password in the request
  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide an email and password');
  }

  // 2. Find user by email, ensuring the password field is included
  const user = await User.findOne({ email }).select('+password');

  // 3. Check if user exists and if the password matches
  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    // Use a generic error message for security
    res.status(401);
    throw new Error('Invalid email or password');
  }
});


/**
 * @desc    Get the current logged-in user's profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  // The 'protect' middleware has already run and attached the user object to req.user.
  // The user object was fetched from the DB inside the middleware.
  const user = req.user;

  if (user) {
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});


// -----------------------------------------------------------------
// EXPORT
// -----------------------------------------------------------------

export { registerUser, loginUser, getCurrentUser };
