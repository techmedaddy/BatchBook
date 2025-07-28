// =================================================================
// BATCHBOOK API | ERROR HANDLING MIDDLEWARE (middleware/errorMiddleware.js)
// =================================================================

// -----------------------------------------------------------------
// 404 NOT FOUND HANDLER
// -----------------------------------------------------------------

/**
 * Middleware to handle requests for routes that don't exist.
 * This should be placed after all other route definitions in the main server file.
 * It creates a 404 error and passes it to the global error handler.
 *
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {function} next - The next middleware function.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};


// -----------------------------------------------------------------
// GLOBAL ERROR HANDLER
// -----------------------------------------------------------------

/**
 * Centralized error handling middleware.
 * This should be the last piece of middleware loaded in the main server file.
 * It catches all errors passed by `next(error)` and sends a formatted JSON response.
 *
 * @param {Error} err - The error object.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {function} next - The next middleware function (unused here, but required for Express to recognize it as an error handler).
 */
const errorHandler = (err, req, res, next) => {
  // If the status code is 200 (default success), it means an error was thrown
  // without a specific status code being set. In that case, default to 500.
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode);

  res.json({
    message: err.message,
    // For security, only include the error stack trace if the application
    // is running in a development environment.
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};


// -----------------------------------------------------------------
// EXPORT
// -----------------------------------------------------------------

export { notFound, errorHandler };
