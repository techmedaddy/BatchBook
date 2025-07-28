// =================================================================
// BATCHBOOK API | EXPORT ROUTES (routes/exportRoutes.js)
// =================================================================

// -----------------------------------------------------------------
// IMPORTS
// -----------------------------------------------------------------

import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  exportEntriesAsPDF,
  exportEntriesAsJSON,
} from '../controllers/exportController.js';

// -----------------------------------------------------------------
// INITIALIZATION
// -----------------------------------------------------------------

const router = express.Router();

// -----------------------------------------------------------------
// ROUTE DEFINITIONS
// -----------------------------------------------------------------

// All routes here will be prefixed with `/api/exports` as configured in server.js.

/**
 * @desc    Export user's journal entries as a PDF file
 * @route   GET /api/exports/pdf
 * @access  Private
 */
router.route('/pdf').get(protect, exportEntriesAsPDF);

/**
 * @desc    Export user's journal entries as a JSON object
 * @route   GET /api/exports/json
 * @access  Private
 */
router.route('/json').get(protect, exportEntriesAsJSON);


// -----------------------------------------------------------------
// EXPORT
// -----------------------------------------------------------------

export default router;
