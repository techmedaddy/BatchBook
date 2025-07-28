// =================================================================
// BATCHBOOK API | ERROR HANDLING MIDDLEWARE (middleware/errorMiddleware.js)
// =================================================================

/**
 * Centralized error handling middleware for the Express application.
 * This function catches errors passed from other parts of the application
 * (e.g., by express-async-handler) and formats a consistent JSON response.
 *
 * @param {Error} err - The error object.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {function} next - The next middleware function in the stack.
 */
const errorHandler = (err, req, res, next) => {
  // Determine the status code for the response.
  // If the response object already has a status code set (and it's not the default 200), use it.
  // Otherwise, default to 500 (Internal Server Error).
  // This allows controllers to set specific status codes like 400 or 404 before throwing an error.
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Set the HTTP status code for the response.
  res.status(statusCode);

  // Send back a JSON response with the error details.
  res.json({
    message: err.message,
    // Include the stack trace in the response ONLY if the application
    // is running in a 'development' environment. This is a crucial security
    // measure to avoid exposing internal server details in production.
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

// -----------------------------------------------------------------
// EXPORT
// -----------------------------------------------------------------

export { errorHandler };
