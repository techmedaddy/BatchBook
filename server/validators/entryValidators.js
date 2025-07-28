// =================================================================
// BATCHBOOK API | ENTRY VALIDATION MIDDLEWARE (validators/entryValidators.js)
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
 * Validation chain for creating a new journal entry.
 * Ensures that both title and content are provided and not empty.
 */
const validateCreateEntry = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required and cannot be empty.'),

  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required and cannot be empty.'),

  handleValidationErrors,
];

/**
 * Validation chain for updating an existing journal entry.
 * Fields are optional, but if provided, they cannot be empty.
 */
const validateUpdateEntry = [
  body('title')
    .optional() // This field does not have to be present
    .trim()
    .notEmpty()
    .withMessage('Title cannot be an empty string.'),

  body('content')
    .optional() // This field does not have to be present
    .trim()
    .notEmpty()
    .withMessage('Content cannot be an empty string.'),

  handleValidationErrors,
];

// -----------------------------------------------------------------
// EXPORT
// -----------------------------------------------------------------

export { validateCreateEntry, validateUpdateEntry };
