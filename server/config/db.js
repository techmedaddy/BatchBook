// =================================================================
// BATCHBOOK API | DATABASE CONNECTION (config/db.js)
// =================================================================

// -----------------------------------------------------------------
// IMPORTS
// -----------------------------------------------------------------

// Import Mongoose, the ODM (Object Data Modeling) library for MongoDB and Node.js.
// It manages relationships between data, provides schema validation, and is used to
// translate between objects in code and the representation of those objects in MongoDB.
import mongoose from 'mongoose';

// -----------------------------------------------------------------
// DATABASE CONNECTION FUNCTION
// -----------------------------------------------------------------

/**
 * Asynchronously connects to the MongoDB database using the URI
 * stored in the environment variables.
 */
const connectDB = async () => {
  try {
    // Attempt to connect to the database.
    // `mongoose.connect()` returns a promise, so we use `await`.
    // The connection string is fetched from the .env file for security and flexibility.
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options are passed to the underlying MongoDB driver.
      // While some are deprecated in newer versions of Mongoose, they are
      // often kept for broader compatibility.
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });

    // If the connection is successful, log a confirmation message to the console.
    // `conn.connection.host` provides the hostname of the connected database,
    // which is useful for verifying the connection target (e.g., localhost vs. a cloud instance).
    console.log(`🔌 MongoDB Connected: ${conn.connection.host}`);

  } catch (error) {
    // If an error occurs during the connection attempt, it will be caught here.
    console.error(`Error connecting to MongoDB: ${error.message}`);

    // Exit the Node.js process with a "failure" code (1).
    // This is a critical step. If the application cannot connect to its database,
    // it cannot function correctly, so it's best to stop it immediately.
    process.exit(1);
  }
};

// -----------------------------------------------------------------
// EXPORT
// -----------------------------------------------------------------

// Export the connectDB function so it can be imported and used in other
// parts of the application, such as the main `server.js` file.
export default connectDB;
