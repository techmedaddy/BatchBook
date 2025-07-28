// =================================================================
// BATCHBOOK API | VERSIONING ROUTES (routes/versionRoutes.js)
// =================================================================

import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getEntryVersions,
  getSpecificVersion,
  restoreVersion,
  // deleteVersion, // Assuming this will be created in the controller
} from '../controllers/versionController.js';

const router = express.Router();

// Note: All routes in this file will be mounted under `/api/versions` in server.js.

/**
 * @desc    Get all historical versions for a single entry
 * @route   GET /api/versions/:entryId
 * @access  Private
 */
router.route('/:entryId').get(protect, getEntryVersions);

/**
 * @desc    Get a specific version of an entry
 * @route   GET /api/versions/:entryId/:versionId
 * @access  Private
 */
router.route('/:entryId/:versionId').get(protect, getSpecificVersion);
// .delete(protect, deleteVersion); // Uncomment when deleteVersion controller is implemented

/**
 * @desc    Restore an entry to a previous version's state
 * @route   POST /api/versions/:entryId/restore/:versionId
 * @access  Private
 */
router.route('/:entryId/restore/:versionId').post(protect, restoreVersion);

export default router;
    