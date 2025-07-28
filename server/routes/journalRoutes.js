// =================================================================
// BATCHBOOK API | JOURNAL ENTRY ROUTES (routes/entryRoutes.js)
// =================================================================

// -----------------------------------------------------------------
// IMPORTS
// -----------------------------------------------------------------

import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createJournal,
  getUserJournals,
  getJournalById,
  updateJournal,
  deleteJournal,
} from '../controllers/journalController.js';

// -----------------------------------------------------------------
// INITIALIZATION
// -----------------------------------------------------------------

const router = express.Router();

// -----------------------------------------------------------------
// ROUTE DEFINITIONS
// -----------------------------------------------------------------

// All routes defined here are automatically prefixed with `/api/entries`
// as configured in `server.js`.

// We can chain the .get() and .post() methods for the same base route ('/').
// The 'protect' middleware is applied first to secure both endpoints.
router
    .route('/')
    .get(protect, getUserJournals)  // Handles GET requests to /api/entries
    .post(protect, createJournal); // Handles POST requests to /api/entries

// Similarly, we chain methods for routes that include an ID parameter.
// The 'protect' middleware secures all these operations as well.
router
    .route('/:id')
    .get(protect, getJournalById)       // Handles GET requests to /api/entries/:id
    .put(protect, updateJournal)      // Handles PUT requests to /api/entries/:id
    .delete(protect, deleteJournal);  // Handles DELETE requests to /api/entries/:id

// -----------------------------------------------------------------
// EXPORT
// -----------------------------------------------------------------

export default router;
