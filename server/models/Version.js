// =================================================================
// BATCHBOOK API | VERSION HISTORY MODEL (models/Version.js)
// =================================================================

import mongoose from 'mongoose';

/**
 * Defines the schema for the Version collection in MongoDB.
 * Each document represents a historical snapshot of a journal entry.
 */
const versionSchema = new mongoose.Schema(
  {
    // A reference to the parent journal entry this version belongs to.
    entry: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Entry',
    },
    // A reference to the user who owns the parent entry.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    // The title of the entry at the time this version was saved.
    title: {
      type: String,
      required: [true, 'A title is required for the version.'],
      trim: true,
    },
    // The full content of the entry at the time this version was saved.
    content: {
      type: String,
      required: [true, 'Content is required for the version.'],
    },
    // The tags associated with the entry at that point in time.
    tags: {
      type: [String],
      default: [],
    },
    // An optional, user-defined note to describe the version (e.g., "Pre-refactor draft").
    note: {
      type: String,
      trim: true,
    },
    // The source indicating why this version was created.
    source: {
      type: String,
      required: true,
      enum: {
        values: ['auto', 'manual', 'restore'],
        message: '{VALUE} is not a supported source. Must be auto, manual, or restore.',
      },
      default: 'auto',
    },
  },
  {
    // Automatically adds `createdAt` and `updatedAt` fields.
    timestamps: true,
    versionKey: false,
  }
);

// --- INDEXES ---
// Create indexes to optimize queries for finding versions by entry or user.
versionSchema.index({ entry: 1, createdAt: -1 }); // For fetching versions of an entry quickly.
versionSchema.index({ user: 1, createdAt: -1 }); // For any user-level version analytics.


// --- STATIC METHODS ---

/**
 * A static method to create a new Version document from an existing Entry document.
 * This centralizes the logic for snapshotting an entry's state.
 *
 * @param {object} entry - A Mongoose document instance of an Entry.
 * @param {string} source - The reason for creating this version ('auto', 'manual', 'restore').
 * @returns {Promise<object>} A promise that resolves to the newly created Version document.
 */
versionSchema.statics.createFromEntry = async function (entry, source = 'auto') {
  if (!entry || !entry._id) {
    throw new Error('A valid entry document must be provided to create a version.');
  }

  const versionData = {
    entry: entry._id,
    user: entry.user,
    title: entry.title,
    content: entry.content,
    tags: entry.tags,
    source: source,
  };

  return this.create(versionData);
};


// --- EXPORT ---

const Version = mongoose.model('Version', versionSchema);
export default Version;
