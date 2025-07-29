// =================================================================
// BATCHBOOK API | PDF GENERATOR UTILITY (utils/pdfGenerator.js)
// =================================================================

import PDFDocument from 'pdfkit';
import moment from 'moment';

/**
 * Generates a PDF document for a single journal entry.
 *
 * @param {object} entry - The Mongoose entry document. Must contain title, content, createdAt, tags.
 * @param {object} user - The Mongoose user document. Must contain name, email.
 * @returns {Promise<Buffer>} A promise that resolves with the PDF data as a Buffer.
 * @throws {Error} if entry or user objects are invalid.
 */
const generateEntryPDF = (entry, user) => {
  return new Promise((resolve, reject) => {
    if (!entry || !user) {
      return reject(new Error('Invalid entry or user data provided.'));
    }

    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: entry.title,
          Author: user.name,
          Subject: 'BatchBook Journal Entry Export',
          Keywords: `journal, batchbook, ${entry.tags?.join(', ')}`,
        },
      });

      // --- PDF Content ---

      // Header: Title
      doc
        .font('Helvetica-Bold')
        .fontSize(20)
        .text(entry.title, { align: 'center' });
      doc.moveDown(0.5);

      // Metadata: Date and Tags
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('grey')
        .text(`Created: ${moment(entry.createdAt).format('MMMM Do YYYY, h:mm a')}`, { align: 'center' });

      if (entry.tags && entry.tags.length > 0) {
        doc.text(`Tags: ${entry.tags.join(', ')}`, { align: 'center' });
      }
      doc.moveDown(2);

      // Body: Content
      doc
        .font('Helvetica')
        .fontSize(12)
        .fillColor('black')
        .text(entry.content, {
          align: 'justify',
          lineGap: 4,
        });

      // Footer: User Info (on the last page)
      const range = doc.bufferedPageRange();
      doc
        .page.margins.bottom = 0;
      doc
        .fontSize(9)
        .fillColor('grey')
        .text(
          `Exported by ${user.name} (${user.email})`,
          range.x,
          doc.page.height - 30, // Position at the bottom
          {
            align: 'center',
            lineBreak: false,
          }
        );

      // --- Stream to Buffer ---

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', (err) => {
        reject(err);
      });

      // Finalize the PDF and end the stream
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};

export { generateEntryPDF };
