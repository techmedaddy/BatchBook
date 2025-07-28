// =================================================================
// BATCHBOOK API | SEARCH CONTROLLER (controllers/searchController.js)
// =================================================================

import asyncHandler from 'express-async-handler';
import Entry from '../models/Entry.js';
import moment from 'moment';

/**
 * @desc    Search journal entries with advanced filters
 * @route   GET /api/search
 * @access  Private
 */
const searchEntries = asyncHandler(async (req, res) => {
  // --- 1. Extract and Sanitize Query Parameters ---
  const { q, tags, startDate, endDate, exactMatch } = req.query;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // --- 2. Build Dynamic Mongoose Filter Object ---
  const filter = { user: req.user._id }; // Base filter: always scope to the logged-in user

  // Keyword Search (Fuzzy or Exact)
  if (q) {
    const searchPattern = exactMatch === 'true' ? `^${q}$` : q;
    const regex = new RegExp(searchPattern, 'i'); // 'i' for case-insensitivity
    filter.$or = [{ title: regex }, { content: regex }];
  }

  // Tag Filtering
  if (tags) {
    const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
    filter.tags = { $in: tagArray }; // Find entries containing at least one of the tags
  }

  // Date Range Filtering
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      if (!moment(startDate, 'YYYY-MM-DD', true).isValid()) {
        res.status(400);
        throw new Error('Invalid startDate format. Please use YYYY-MM-DD.');
      }
      filter.createdAt.$gte = moment(startDate).startOf('day').toDate();
    }
    if (endDate) {
      if (!moment(endDate, 'YYYY-MM-DD', true).isValid()) {
        res.status(400);
        throw new Error('Invalid endDate format. Please use YYYY-MM-DD.');
      }
      filter.createdAt.$lte = moment(endDate).endOf('day').toDate();
    }
  }

  // --- 3. Execute Database Queries ---
  try {
    // First, get the total count of documents that match the filter for pagination metadata
    const totalResults = await Entry.countDocuments(filter);

    // Then, fetch the paginated and sorted results
    const entries = await Entry.find(filter)
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit);

    // --- 4. Send Formatted Response ---
    res.status(200).json({
      page,
      limit,
      totalResults,
      totalPages: Math.ceil(totalResults / limit),
      entries,
    });
  } catch (error) {
    res.status(500);
    throw new Error('An error occurred while searching for entries.');
  }
});

export { searchEntries };
