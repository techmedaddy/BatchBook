// =================================================================
// BATCHBOOK API | JSON EXPORTER UTILITY (utils/jsonExporter.js)
// =================================================================

import fs from 'fs';
import path from 'path';
import os from 'os';
import moment from 'moment';

/**
 * A helper function to sanitize a journal entry for export,
 * removing internal or unnecessary fields.
 * @param {object} entry - A Mongoose entry document.
 * @returns {object} A clean entry object suitable for export.
 */
const sanitizeEntry = (entry) => ({
  title: entry.title,
  content: entry.content,
  mood: entry.mood,
  tags: entry.tags,
  createdAt: entry.createdAt,
  updatedAt: entry.updatedAt,
});

/**
 * Creates a JSON file from an array of journal entries and returns its path.
 * The file is stored in the operating system's temporary directory.
 *
 * @param {Array<object>} entries - An array of Mongoose entry documents.
 * @param {object} user - The Mongoose user document containing name and email.
 * @returns {Promise<string>} A promise that resolves with the full path to the temporary JSON file.
 * @throws {Error} if input data is invalid or file creation fails.
 */
const exportEntriesToJSON = async (entries, user) => {
  if (!Array.isArray(entries) || !user) {
    throw new Error('Invalid entries or user data provided for JSON export.');
  }

  try {
    // 1. Structure the final JSON data object.
    const exportData = {
      user: {
        name: user.name,
        email: user.email,
      },
      exportedAt: new Date().toISOString(),
      entryCount: entries.length,
      entries: entries.map(sanitizeEntry),
    };

    // 2. Convert the data object to a formatted JSON string for readability.
    const jsonString = JSON.stringify(exportData, null, 2);

    // 3. Define a unique filename and a path in the system's temp directory.
    const timestamp = moment().format('YYYYMMDD-HHmmss');
    const filename = `journal-export-${timestamp}.json`;
    const tempFilePath = path.join(os.tmpdir(), filename);

    // 4. Asynchronously write the JSON string to the temporary file.
    await fs.promises.writeFile(tempFilePath, jsonString);

    // 5. Return the path, which the controller can use with res.download().
    return tempFilePath;

  } catch (error) {
    console.error('Failed to generate JSON export file:', error);
    // Throw a more generic error to the controller.
    throw new Error('Could not generate the JSON export file.');
  }
};

export { exportEntriesToJSON };
