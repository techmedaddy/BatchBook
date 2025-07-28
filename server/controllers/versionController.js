// =================================================================
// BATCHBOOK API | VERSIONING CONTROLLER (controllers/versionController.js)
// =================================================================

import asyncHandler from 'express-async-handler';
import Entry from '../models/Entry.js';
import Version from '../models/Version.js'; // Assuming this model exists
import mongoose from 'mongoose';

/**
 * @desc    Get all historical versions for a single journal entry
 * @route   GET /api/entries/:entryId/versions
 * @access  Private
 */
const getEntryVersions = asyncHandler(async (req, res) => {
  const { entryId } = req.params;

  // First, verify the user owns the parent entry
  const entry = await Entry.findOne({ _id: entryId, user: req.user.id });
  if (!entry) {
    res.status(404);
    throw new Error('Entry not found or you do not have permission to view it.');
  }

  // Fetch all associated versions, sorted from newest to oldest
  const versions = await Version.find({ entryId }).sort({ createdAt: -1 });

  res.status(200).json(versions);
});

/**
 * @desc    Get a specific version of a journal entry
 * @route   GET /api/entries/:entryId/versions/:versionId
 * @access  Private
 */
const getSpecificVersion = asyncHandler(async (req, res) => {
  const { entryId, versionId } = req.params;

  // Find the specific version and ensure it belongs to the correct entry
  const version = await Version.findOne({ _id: versionId, entryId });

  if (!version) {
    res.status(404);
    throw new Error('Version not found for the specified entry.');
  }

  // Verify the user owns the parent entry before showing the version's content
  const entry = await Entry.findOne({ _id: entryId, user: req.user.id });
  if (!entry) {
    res.status(403);
    throw new Error('You are not authorized to view this version.');
  }

  res.status(200).json(version);
});

/**
 * @desc    Restore an entry to a previous version
 * @route   POST /api/entries/:entryId/versions/:versionId/restore
 * @access  Private
 */
const restoreVersion = asyncHandler(async (req, res) => {
  const { entryId, versionId } = req.params;

  const entry = await Entry.findById(entryId);
  if (!entry || entry.user.toString() !== req.user.id) {
    res.status(403);
    throw new Error('You are not authorized to modify this entry.');
  }

  const versionToRestore = await Version.findById(versionId);
  if (!versionToRestore || versionToRestore.entryId.toString() !== entryId) {
    res.status(404);
    throw new Error('Version to restore not found for this entry.');
  }

  // Before overwriting, save the current state as a new version to avoid data loss
  await Version.create({
    entryId: entry._id,
    title: entry.title,
    content: entry.content,
  });

  // Restore the entry's content from the selected historical version
  entry.title = versionToRestore.title;
  entry.content = versionToRestore.content;
  // The `updatedAt` timestamp will be automatically updated on save
  const updatedEntry = await entry.save();

  res.status(200).json({
    message: 'Entry successfully restored to a previous version.',
    entry: updatedEntry,
  });
});

export { getEntryVersions, getSpecificVersion, restoreVersion };
