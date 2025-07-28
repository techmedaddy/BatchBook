// =================================================================
// BATCHBOOK API | USER CONTROLLERS (controllers/userController.js)
// =================================================================

// -----------------------------------------------------------------
// IMPORTS
// -----------------------------------------------------------------

import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js'; // Assuming you have a token generator utility

// -----------------------------------------------------------------
// CONTROLLER FUNCTIONS
// -----------------------------------------------------------------

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getUserProfile = asyncHandler(async (req, res) => {
  // The `protect` middleware has already fetched the user and attached it to `req.user`.
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
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

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateUserProfile = asyncHandler(async (req, res) => {
  // Find the currently logged-in user in the database.
  const user = await User.findById(req.user._id);

  if (user) {
    // Update fields only if they are provided in the request body.
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    // If a new password is provided, update it.
    // The pre-save hook in the User model will automatically hash it.
    if (req.body.password) {
      user.password = req.body.password;
    }

    // Save the updated user document.
    const updatedUser = await user.save();

    // Respond with the updated user details and a new token.
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      token: generateToken(updatedUser._id), // Issue a new token in case payload data changes
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});


// -----------------------------------------------------------------
// EXPORT
// -----------------------------------------------------------------

export { getUserProfile, updateUserProfile };
