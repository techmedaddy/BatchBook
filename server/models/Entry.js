// =================================================================
// BATCHBOOK API | ENTRY MODEL (models/Entry.js)
// =================================================================

// -----------------------------------------------------------------
// IMPORTS
// -----------------------------------------------------------------

import mongoose from 'mongoose';

// -----------------------------------------------------------------
// SCHEMA DEFINITION
// -----------------------------------------------------------------

/**
 * Defines the schema for the Entry collection in MongoDB.
 */
const entrySchema = new mongoose.Schema(
  {
    // The 'user' field creates a relationship between this entry and a user.
    // It stores the ObjectId of the user who created the entry.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // This tells Mongoose that the ObjectId refers to a document in the 'User' collection.
    },
    title: {
      type: String,
      required: [true, 'Please provide a title for your entry.'],
      trim: true, // Removes leading/trailing whitespace.
      maxlength: [100, 'Title cannot be more than 100 characters.'],
    },
    content: {
      type: String,
      required: [true, 'Please provide content for your entry.'],
    },
    mood: {
      type: String,
      // The 'enum' validator ensures that the mood can only be one of the specified values.
      enum: [
        'happy',
        'sad',
        'neutral',
        'angry',
        'excited',
        'anxious',
        'grateful',
        'tired',
        'other',
      ],
      // This field is optional.
    },
    // NEW FIELD: An array of strings for tagging entries.
    tags: {
      type: [String],
      default: [], // Defaults to an empty array if not provided.
    },
  },
  // ---------------------------------------------------------------
  // SCHEMA OPTIONS
  // ---------------------------------------------------------------
  {
    // `timestamps: true` automatically adds `createdAt` and `updatedAt` fields
    // to the schema and manages them.
    timestamps: true,
    // `versionKey: false` disables the `__v` field that Mongoose adds by default.
    versionKey: false,
  }
);

// -----------------------------------------------------------------
// MIDDLEWARE (MONGOOSE HOOKS)
// -----------------------------------------------------------------

// Pre-save hook to sanitize the tags array.
// This runs before a document is saved.
entrySchema.pre('save', function (next) {
  // Check if the tags field has been modified.
  if (this.isModified('tags')) {
    // Trim whitespace from each tag and filter out any empty strings
    // that might result from trimming.
    this.tags = this.tags.map(tag => tag.trim()).filter(tag => tag.length > 0);
  }
  next();
});


// -----------------------------------------------------------------
// EXPORT
// -----------------------------------------------------------------

// Create and export the Entry model based on the schema.
const Entry = mongoose.model('Entry', entrySchema);
export default Entry;
