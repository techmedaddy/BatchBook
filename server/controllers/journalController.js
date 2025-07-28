// =================================================================
// BATCHBOOK API | JOURNAL CONTROLLERS (controllers/journalController.js)
// =================================================================

// -----------------------------------------------------------------
// IMPORTS
// -----------------------------------------------------------------

// A utility to handle async errors in Express without needing try-catch blocks in every function.
import asyncHandler from 'express-async-handler';
// The Mongoose model for our journal entries.
import Journal from '../models/Entry.js'; // Note: We'll create Entry.js next.

// -----------------------------------------------------------------
// CONTROLLER FUNCTIONS
// -----------------------------------------------------------------

/**
 * @desc    Create a new journal entry
 * @route   POST /api/entries
 * @access  Private
 */
const createJournal = asyncHandler(async (req, res) => {
  const { title, content } = req.body;

  // 1. Validate input
  if (!title || !content) {
    res.status(400); // Bad Request
    throw new Error('Please provide both a title and content for the journal entry.');
  }

  // 2. Create the journal entry
  const journal = new Journal({
    title,
    content,
    user: req.user._id, // Associate the entry with the logged-in user
  });

  // 3. Save to the database
  const createdJournal = await journal.save();

  // 4. Respond with the created journal
  res.status(201).json(createdJournal);
});


/**
 * @desc    Get all journals for the logged-in user
 * @route   GET /api/entries
 * @access  Private
 */
const getUserJournals = asyncHandler(async (req, res) => {
  // Find all journals where the 'user' field matches the logged-in user's ID.
  // Sort them by creation date in descending order (newest first).
  const journals = await Journal.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json(journals);
});


/**
 * @desc    Get a single journal entry by its ID
 * @route   GET /api/entries/:id
 * @access  Private
 */
const getJournalById = asyncHandler(async (req, res) => {
  const journal = await Journal.findById(req.params.id);

  // 1. Check if the journal exists
  if (!journal) {
    res.status(404);
    throw new Error('Journal entry not found.');
  }

  // 2. Verify that the logged-in user is the owner of the journal
  if (journal.user.toString() !== req.user._id.toString()) {
    res.status(401); // Unauthorized
    throw new Error('You are not authorized to access this journal entry.');
  }

  // 3. Respond with the journal data
  res.status(200).json(journal);
});


/**
 * @desc    Update a journal entry
 * @route   PUT /api/entries/:id
 * @access  Private
 */
const updateJournal = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  const journal = await Journal.findById(req.params.id);

  // 1. Check if the journal exists
  if (!journal) {
    res.status(404);
    throw new Error('Journal entry not found.');
  }

  // 2. Verify ownership
  if (journal.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('You are not authorized to update this journal entry.');
  }

  // 3. Update fields if they are provided in the request body
  journal.title = title || journal.title;
  journal.content = content || journal.content;

  // 4. Save the updated journal and respond
  const updatedJournal = await journal.save();
  res.status(200).json(updatedJournal);
});


/**
 * @desc    Delete a journal entry
 * @route   DELETE /api/entries/:id
 * @access  Private
 */
const deleteJournal = asyncHandler(async (req, res) => {
  const journal = await Journal.findById(req.params.id);

  // 1. Check if the journal exists
  if (!journal) {
    res.status(404);
    throw new Error('Journal entry not found.');
  }

  // 2. Verify ownership
  if (journal.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('You are not authorized to delete this journal entry.');
  }

  // 3. Remove the journal from the database
  await journal.deleteOne(); // Use deleteOne() on the document instance

  // 4. Respond with a success message
  res.status(200).json({ message: 'Journal entry successfully deleted.' });
});


// -----------------------------------------------------------------
// EXPORT
// -----------------------------------------------------------------

export {
  createJournal,
  getUserJournals,
  getJournalById,
  updateJournal,
  deleteJournal,
};
