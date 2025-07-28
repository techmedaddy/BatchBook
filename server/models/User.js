// =================================================================
// BATCHBOOK API | USER MODEL (models/User.js)
// =================================================================

// -----------------------------------------------------------------
// IMPORTS
// -----------------------------------------------------------------

// Import Mongoose for schema creation and modeling
import mongoose from 'mongoose';

// Import bcryptjs for hashing passwords securely
import bcrypt from 'bcryptjs';

// -----------------------------------------------------------------
// SCHEMA DEFINITION
// -----------------------------------------------------------------

/**
 * Defines the schema for the User collection in MongoDB.
 */
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'], // Field is mandatory
    trim: true, // Removes whitespace from both ends of a string
    maxlength: [50, 'Name cannot be more than 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true, // Ensures every email in the database is unique
    lowercase: true, // Converts email to lowercase before saving
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false, // Prevents the password from being sent back in queries by default
  },
  role: {
    type: String,
    enum: ['user', 'admin'], // The role must be one of these values
    default: 'user', // Default role for new users
  },
  createdAt: {
    type: Date,
    default: Date.now, // Sets the current date and time when a user is created
  },
});

// -----------------------------------------------------------------
// MIDDLEWARE (MONGOOSE HOOKS)
// -----------------------------------------------------------------

// Pre-save hook to hash the password before saving a new user to the database.
// This middleware runs automatically when `user.save()` is called.
userSchema.pre('save', async function (next) {
  // `isModified('password')` checks if the password field has been changed.
  // We only want to hash the password if it's new or has been updated.
  if (!this.isModified('password')) {
    return next();
  }

  // Generate a "salt" for hashing. A salt is random data that is used as an
  // additional input to a one-way function that "hashes" a password.
  // A salt of 10 rounds is generally considered secure.
  const salt = await bcrypt.genSalt(10);

  // Hash the user's plain-text password with the generated salt.
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// -----------------------------------------------------------------
// SCHEMA METHODS
// -----------------------------------------------------------------

// Custom method to compare a candidate password with the user's hashed password.
// This method will be available on all instances of the User model.
userSchema.methods.matchPassword = async function (enteredPassword) {
  // `bcrypt.compare` securely compares the plain-text password with the stored hash.
  // It returns a boolean (true if they match, false otherwise).
  return await bcrypt.compare(enteredPassword, this.password);
};


// -----------------------------------------------------------------
// EXPORT
// -----------------------------------------------------------------

// Create and export the User model based on the schema.
// The model is what we use to interact with the 'users' collection in the database.
const User = mongoose.model('User', userSchema);
export default User;
