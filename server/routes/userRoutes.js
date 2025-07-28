// =================================================================
// BATCHBOOK API | USER ROUTES (routes/userRoutes.js)
// =================================================================

// -----------------------------------------------------------------
// IMPORTS
// -----------------------------------------------------------------

import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getUserProfile,
  updateUserProfile,
} from '../controllers/userController.js';

// -----------------------------------------------------------------
// INITIALIZATION
// -----------------------------------------------------------------

const router = express.Router();

// -----------------------------------------------------------------
// ROUTE DEFINITIONS
// -----------------------------------------------------------------

// All routes defined here will be prefixed with `/api/users` (as configured in server.js).
// We are chaining the routes for the '/profile' endpoint.
// The `protect` middleware is applied first, ensuring that any request
// to get or update the profile must have a valid authentication token.

router
  .route('/profile')
  .get(protect, getUserProfile) // Handles GET /api/users/profile
  .put(protect, updateUserProfile); // Handles PUT /api/users/profile

// -----------------------------------------------------------------
// EXPORT
// -----------------------------------------------------------------

export default router;
