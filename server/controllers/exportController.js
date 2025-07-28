// =================================================================
// BATCHBOOK API | ADVANCED EXPORT CONTROLLER (controllers/exportController.js)
// =================================================================

import asyncHandler from 'express-async-handler';
import PDFDocument from 'pdfkit';
import archiver from 'archiver';
import moment from 'moment';
import Entry from '../models/Entry.js';

// --- HELPER FUNCTIONS ---

/**
 * A helper function to generate the content of a single entry PDF.
 * @param {PDFDocument} doc - The pdfkit document instance.
 * @param {object} entry - The Mongoose entry document.
 */
const addEntryToPdf = (doc, entry) => {
  const wordCount = entry.content.split(/\s+/).filter(Boolean).length;

  doc.fontSize(18).font('Helvetica-Bold').text(entry.title, { paragraphGap: 5 });
  doc.fontSize(10).font('Helvetica').fillColor('grey');
  doc.text(`Created: ${moment(entry.createdAt).format('MMMM Do YYYY, h:mm a')}`);
  doc.text(`Tags: ${entry.tags.join(', ') || 'None'}`);
  doc.text(`Word Count: ${wordCount}`);
  doc.moveDown(1);
  doc.fontSize(12).font('Helvetica').fillColor('black').text(entry.content, {
    align: 'justify',
  });
};

/**
 * Sanitizes a journal entry for JSON export, removing internal fields.
 * @param {object} entry - The Mongoose entry document.
 * @returns {object} A clean entry object.
 */
const sanitizeEntryForExport = (entry) => ({
  title: entry.title,
  content: entry.content,
  mood: entry.mood,
  tags: entry.tags,
  createdAt: entry.createdAt,
  updatedAt: entry.updatedAt,
});


// --- CONTROLLER FUNCTIONS ---

/**
 * @desc    Export a single journal entry as a PDF
 * @route   GET /api/exports/entry/:id/pdf
 * @access  Private
 */
const exportSingleEntryAsPDF = asyncHandler(async (req, res) => {
  const entry = await Entry.findById(req.params.id);

  if (!entry || entry.user.toString() !== req.user.id) {
    res.status(404);
    throw new Error('Journal entry not found or you are not authorized.');
  }

  const filename = `entry-${entry._id}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ margin: 72 });
  doc.pipe(res);
  addEntryToPdf(doc, entry);
  doc.end();
});

/**
 * @desc    Export all user entries as a ZIP of individual PDFs
 * @route   GET /api/exports/all/pdf
 * @access  Private
 */
const exportAllEntriesAsPDF = asyncHandler(async (req, res) => {
  const entries = await Entry.find({ user: req.user.id }).sort({ createdAt: 'desc' });

  if (entries.length === 0) {
    res.status(404);
    throw new Error('No journal entries found to export.');
  }

  const zipFilename = `my-journal-${moment().format('YYYY-MM-DD')}.zip`;
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);

  const manifest = [];

  for (const entry of entries) {
    const doc = new PDFDocument({ margin: 72 });
    const pdfBuffer = await new Promise((resolve) => {
      addEntryToPdf(doc, entry);
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.end();
    });

    const pdfFilename = `entry-${entry._id}.pdf`;
    archive.append(pdfBuffer, { name: pdfFilename });
    manifest.push({
        title: entry.title,
        filename: pdfFilename,
        wordCount: entry.content.split(/\s+/).filter(Boolean).length,
        createdAt: entry.createdAt,
    });
  }

  archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });
  archive.finalize();
});

/**
 * @desc    Export a single journal entry as JSON
 * @route   GET /api/exports/entry/:id/json
 * @access  Private
 */
const exportSingleEntryAsJSON = asyncHandler(async (req, res) => {
    const entry = await Entry.findById(req.params.id);

    if (!entry || entry.user.toString() !== req.user.id) {
        res.status(404);
        throw new Error('Journal entry not found or you are not authorized.');
    }
    
    const filename = `entry-${entry._id}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).json(sanitizeEntryForExport(entry));
});

/**
 * @desc    Export all user entries as a single JSON file
 * @route   GET /api/exports/all/json
 * @access  Private
 */
const exportAllEntriesAsJSON = asyncHandler(async (req, res) => {
    const entries = await Entry.find({ user: req.user.id }).sort({ createdAt: 'desc' });
    const sanitizedEntries = entries.map(sanitizeEntryForExport);
    
    const filename = `journal-entries-${moment().format('YYYYMMDD')}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).json({
        exportDate: new Date().toISOString(),
        entryCount: sanitizedEntries.length,
        entries: sanitizedEntries,
    });
});

/**
 * @desc    Generate and export a PDF summary of journal analytics
 * @route   GET /api/exports/summary
 * @access  Private
 */
const generateSummaryExport = asyncHandler(async (req, res) => {
    const entries = await Entry.find({ user: req.user.id });

    if (entries.length === 0) {
        res.status(404);
        throw new Error('No entries found to generate a summary.');
    }

    // Perform analytics
    let totalWords = 0;
    const tagFrequency = {};
    entries.forEach(entry => {
        totalWords += entry.content.split(/\s+/).filter(Boolean).length;
        entry.tags.forEach(tag => {
            tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
        });
    });
    const sortedTags = Object.entries(tagFrequency).sort((a, b) => b[1] - a[1]);

    // Generate PDF
    const filename = `journal-summary-${moment().format('YYYYMMDD')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ margin: 72 });
    doc.pipe(res);

    doc.fontSize(22).font('Helvetica-Bold').text('Journal Summary & Analytics', { align: 'center', paragraphGap: 20 });
    doc.fontSize(14).font('Helvetica-Bold').text('Overall Statistics', { underline: true });
    doc.fontSize(12).font('Helvetica').text(`Total Entries: ${entries.length}`);
    doc.text(`Total Words Written: ${totalWords}`);
    doc.text(`Average Words Per Entry: ${entries.length > 0 ? (totalWords / entries.length).toFixed(0) : 0}`);
    doc.moveDown(2);

    doc.fontSize(14).font('Helvetica-Bold').text('Most Used Tags', { underline: true });
    if (sortedTags.length > 0) {
        sortedTags.slice(0, 10).forEach(([tag, count]) => {
            doc.fontSize(12).font('Helvetica').text(`- ${tag} (${count} times)`);
        });
    } else {
        doc.fontSize(12).font('Helvetica').text('No tags have been used yet.');
    }

    doc.end();
});


export {
  exportSingleEntryAsPDF,
  exportAllEntriesAsPDF,
  exportSingleEntryAsJSON,
  exportAllEntriesAsJSON,
  generateSummaryExport,
};
