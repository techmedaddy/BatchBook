// =================================================================
// BATCHBOOK API | USER VALIDATION MIDDLEWARE (validators/userValidators.js)
// =================================================================

// -----------------------------------------------------------------
// IMPORTS
// -----------------------------------------------------------------

import { body, validationResult } from 'express-validator';

// -----------------------------------------------------------------
// VALIDATION RESULT HANDLER
// -----------------------------------------------------------------

/**
 * Middleware to handle the result of express-validator validations.
 * If there are errors, it sends a 400 response with the error details.
 * If validation passes, it calls the next middleware.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// -----------------------------------------------------------------
// VALIDATION CHAINS
// -----------------------------------------------------------------

/**
 * Validation chain for user registration.
 * Checks for name, a valid email, and a password with a minimum length.
 */
const validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required.')
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters.'),

  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(), // Sanitizes the email (e.g., to lowercase)

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'),

  handleValidationErrors, // This middleware runs after the checks above
];

/**
 * Validation chain for user login.
 * Checks for a valid email and ensures a password is provided.
 */
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('password').notEmpty().withMessage('Password is required.'),

  handleValidationErrors,
];

/**
 * Validation chain for updating a user's profile.
 * All fields are optional, but if they are provided, they are validated.
 */
const validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters.'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'),

  handleValidationErrors,
];


// -----------------------------------------------------------------
// EXPORT
// -----------------------------------------------------------------

export { validateRegister, validateLogin, validateUpdateProfile };
