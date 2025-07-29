// =================================================================
// BATCHBOOK API | PDF EXPORTER UTILITY (utils/pdfExporter.js)
// =================================================================

import fs from 'fs';
import path from 'path';
import os from 'os';
import PDFDocument from 'pdfkit';
import moment from 'moment';

// --- HELPER FUNCTIONS ---

/**
 * Adds a cover page to the PDF document with export metadata.
 * @param {PDFDocument} doc - The pdfkit document instance.
 * @param {object} user - The user object with name and email.
 * @param {number} entryCount - The total number of entries being exported.
 */
const addCoverPage = (doc, user, entryCount) => {
  doc
    .fontSize(26)
    .font('Helvetica-Bold')
    .text('BatchBook Journal Export', { align: 'center' });
  doc.moveDown(2);

  doc
    .fontSize(14)
    .font('Helvetica')
    .text(`User: ${user.name} (${user.email})`, { align: 'center' });
  doc.text(`Export Date: ${moment().format('MMMM Do, YYYY')}`, { align: 'center' });
  doc.text(`Total Entries: ${entryCount}`, { align: 'center' });

  doc.addPage();
};

/**
 * Adds a single journal entry to the PDF document.
 * @param {PDFDocument} doc - The pdfkit document instance.
 * @param {object} entry - The journal entry object.
 */
const addEntryToPage = (doc, entry) => {
  doc
    .fontSize(18)
    .font('Helvetica-Bold')
    .text(entry.title, { paragraphGap: 5 });

  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor('grey')
    .text(`Created: ${moment(entry.createdAt).format('MMMM Do, YYYY')} | Last Updated: ${moment(entry.updatedAt).format('MMMM Do, YYYY')}`);

  if (entry.tags && entry.tags.length > 0) {
    doc.text(`Tags: ${entry.tags.join(', ')}`);
  }
  doc.moveDown(1);

  doc
    .fontSize(12)
    .font('Helvetica')
    .fillColor('black')
    .text(entry.content, {
      align: 'justify',
      lineGap: 4,
    });
};

// --- MAIN EXPORT FUNCTION ---

/**
 * Generates a single PDF file from an array of journal entries and saves it to a temporary location.
 *
 * @param {Array<object>} entries - An array of Mongoose entry documents.
 * @param {object} user - The Mongoose user document.
 * @returns {Promise<string>} A promise that resolves with the full path to the temporary PDF file.
 * @throws {Error} if input is invalid or file generation fails.
 */
const exportEntriesToPDF = (entries, user) => {
  return new Promise(async (resolve, reject) => {
    if (!Array.isArray(entries) || entries.length === 0 || !user) {
      return reject(new Error('Invalid entries or user data provided for PDF export.'));
    }

    const timestamp = moment().format('YYYYMMDD-HHmmss');
    const filename = `journal-export-${timestamp}.pdf`;
    const tempFilePath = path.join(os.tmpdir(), filename);

    const doc = new PDFDocument({
      size: 'A4',
      margin: 72, // 1-inch margins
      bufferPages: true, // Good for complex documents
    });

    const writeStream = fs.createWriteStream(tempFilePath);
    doc.pipe(writeStream);

    try {
      // Add the cover page
      addCoverPage(doc, user, entries.length);

      // Add each entry to the document
      entries.forEach((entry, index) => {
        addEntryToPage(doc, entry);

        // Add a page break and a line separator, but not after the last entry
        if (index < entries.length - 1) {
          doc.addPage();
          doc.moveTo(72, 72).lineTo(523, 72).stroke('grey');
          doc.moveDown(2);
        }
      });

      // Finalize the PDF
      doc.end();

      writeStream.on('finish', () => {
        resolve(tempFilePath);
      });

      writeStream.on('error', (err) => {
        reject(new Error(`Failed to write PDF file: ${err.message}`));
      });

    } catch (error) {
      // Clean up the stream and file if an error occurs during generation
      writeStream.end();
      fs.unlink(tempFilePath, () => {}); // Attempt to delete partial file
      reject(new Error(`PDF generation failed: ${error.message}`));
    }
  });
};

export { exportEntriesToPDF };
