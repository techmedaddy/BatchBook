// =================================================================
// BATCHBOOK API | GITHUB SYNC CONTROLLER (controllers/githubSyncController.js)
// =================================================================

import asyncHandler from 'express-async-handler';
import axios from 'axios';
import User from '../models/User.js';
import Entry from '../models/Entry.js';

const GITHUB_API_URL = 'https://api.github.com';

// Helper to create a configured axios instance for GitHub API calls
const createGithubClient = (token) => {
  return axios.create({
    baseURL: GITHUB_API_URL,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
};

/**
 * @desc    Link a user's GitHub account
 * @route   POST /api/github/link
 * @access  Private
 */
const linkGitHubAccount = asyncHandler(async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) {
    res.status(400);
    throw new Error('GitHub access token is required.');
  }

  try {
    const githubClient = createGithubClient(accessToken);
    const { data: githubUser } = await githubClient.get('/user');

    const user = await User.findById(req.user.id);
    user.github = {
      username: githubUser.login,
      accessToken: accessToken, // Note: Consider encrypting this token at rest
    };
    await user.save();

    res.status(200).json({
      message: 'GitHub account linked successfully.',
      githubUsername: githubUser.login,
    });
  } catch (error) {
    res.status(error.response?.status || 500);
    throw new Error(error.response?.data?.message || 'Failed to link GitHub account.');
  }
});

/**
 * @desc    Create or get the sync repository for the user
 * @route   POST /api/github/repo
 * @access  Private
 */
const createOrGetRepo = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user.github?.accessToken) {
        res.status(400);
        throw new Error('GitHub account not linked.');
    }

    if (user.github.repoUrl) {
        return res.status(200).json({ repoUrl: user.github.repoUrl });
    }

    const repoName = `journal-sync-${user._id}`;
    const githubClient = createGithubClient(user.github.accessToken);

    try {
        const { data: repo } = await githubClient.post('/user/repos', {
            name: repoName,
            private: true,
            description: 'Automated sync repository for BatchBook journal entries.',
        });

        user.github.repoName = repo.name;
        user.github.repoUrl = repo.html_url;
        await user.save();

        res.status(201).json({ repoUrl: repo.html_url });
    } catch (error) {
        // Handle case where repo already exists
        if (error.response?.status === 422) {
            const repoUrl = `https://github.com/${user.github.username}/${repoName}`;
            user.github.repoName = repoName;
            user.github.repoUrl = repoUrl;
            await user.save();
            return res.status(200).json({ repoUrl });
        }
        res.status(error.response?.status || 500);
        throw new Error(error.response?.data?.message || 'Failed to create or find repository.');
    }
});


/**
 * @desc    Sync a single journal entry to GitHub
 * @route   POST /api/github/sync/:id
 * @access  Private
 */
const syncJournalEntry = asyncHandler(async (req, res) => {
  const { id: entryId } = req.params;
  const user = await User.findById(req.user.id);
  const entry = await Entry.findById(entryId);

  if (!user.github?.accessToken || !user.github?.repoName) {
    res.status(400);
    throw new Error('GitHub account or sync repository not configured.');
  }
  if (!entry || entry.user.toString() !== req.user.id) {
    res.status(404);
    throw new Error('Journal entry not found or you do not have permission.');
  }

  // Format content to Markdown
  const markdownContent = `# ${entry.title}\n\n**Date:** ${entry.createdAt.toDateString()}\n**Tags:** ${entry.tags.join(', ')}\n\n---\n\n${entry.content}`;
  const contentBase64 = Buffer.from(markdownContent).toString('base64');
  const filePath = `entries/${entry._id}.md`;
  const commitMessage = `Sync entry: ${entry.title}`;

  const githubClient = createGithubClient(user.github.accessToken);
  const url = `/repos/${user.github.username}/${user.github.repoName}/contents/${filePath}`;
  
  try {
    const { data } = await githubClient.put(url, {
      message: commitMessage,
      content: contentBase64,
    });
    res.status(200).json({ message: 'Entry synced successfully.', url: data.content.html_url });
  } catch (error) {
    res.status(error.response?.status || 500);
    throw new Error(error.response?.data?.message || 'Failed to sync entry to GitHub.');
  }
});


/**
 * @desc    Sync all journal entries for a user to GitHub
 * @route   POST /api/github/sync-all
 * @access  Private
 */
const bulkSyncAllEntries = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user.github?.accessToken || !user.github?.repoName) {
        res.status(400);
        throw new Error('GitHub account or sync repository not configured.');
    }

    const entries = await Entry.find({ user: req.user.id });
    const githubClient = createGithubClient(user.github.accessToken);
    const syncPromises = entries.map(entry => {
        const markdownContent = `# ${entry.title}\n\n${entry.content}`;
        const contentBase64 = Buffer.from(markdownContent).toString('base64');
        const filePath = `entries/${entry._id}.md`;
        const url = `/repos/${user.github.username}/${user.github.repoName}/contents/${filePath}`;
        
        return githubClient.put(url, {
            message: `Sync entry: ${entry.title}`,
            content: contentBase64,
        }).then(() => ({ status: 'fulfilled', entryId: entry._id }))
          .catch(err => ({ status: 'rejected', entryId: entry._id, reason: err.response?.data?.message || 'Unknown error' }));
    });

    const results = await Promise.allSettled(syncPromises);
    const summary = results.map(r => r.value); // Extract values from settled promises

    res.status(200).json({
        message: 'Bulk sync operation completed.',
        summary,
    });
});


/**
 * @desc    Disconnect user's GitHub account
 * @route   POST /api/github/disconnect
 * @access  Private
 */
const disconnectGitHub = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (user) {
    user.github = undefined; // Remove the entire github object
    await user.save();
  }
  // Advanced: Add logic here to revoke the OAuth token via GitHub's API if needed.
  res.status(200).json({ message: 'GitHub account has been disconnected.' });
});

export {
  linkGitHubAccount,
  createOrGetRepo,
  syncJournalEntry,
  bulkSyncAllEntries,
  disconnectGitHub,
};
