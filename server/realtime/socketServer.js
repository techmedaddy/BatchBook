// =================================================================
// BATCHBOOK API | REAL-TIME SOCKET SERVER (realtime/socketServer.js)
// =================================================================

import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Entry from '../models/Entry.js';

/**
 * Initializes and configures the Socket.IO server and its event listeners.
 * @param {http.Server} server - The raw Node.js HTTP server instance.
 * @returns {Server} The configured Socket.IO server instance.
 */
const initSocketServer = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || '*', // Best practice: restrict to your frontend's URL in production
      methods: ['GET', 'POST'],
    },
  });

  // --- Socket.IO Authentication Middleware ---
  // This runs for every incoming connection before it's established.
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided.'));
    }

    try {
      // Verify the JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Optional but recommended: Check if the user still exists in the database
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('Authentication error: User not found.'));
      }

      // Attach the user's ID to the socket object for use in event handlers
      socket.userId = decoded.id;
      next();
    } catch (err) {
      // If token is invalid or expired
      next(new Error('Authentication error: Invalid token.'));
    }
  });

  // --- Main Connection Handler ---
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id} (UserID: ${socket.userId})`);

    // Event: Join a room specific to a journal entry
    socket.on('joinEntry', ({ entryId }) => {
      if (entryId) {
        socket.join(entryId);
        console.log(`User ${socket.userId} joined room for entry ${entryId}`);
      }
    });

    // Event: User is typing
    socket.on('typing', ({ entryId, contentPreview }) => {
      if (entryId) {
        // Broadcast to everyone in the room except the sender
        socket.to(entryId).emit('typing', {
          userId: socket.userId,
          contentPreview,
        });
      }
    });

    // Event: Auto-save entry content
    socket.on('save', async ({ entryId, content, title }) => {
      if (!entryId) return;

      try {
        // Find and update the entry, but only if it belongs to the authenticated user
        const entry = await Entry.findOneAndUpdate(
          { _id: entryId, user: socket.userId }, // Security check: ensures ownership
          { content, title },
          { new: true } // Return the updated document
        );

        if (entry) {
          // Broadcast to all clients in the room (including sender) that the entry is synced
          io.to(entryId).emit('synced', {
            entryId: entry._id,
            updatedAt: entry.updatedAt,
            message: 'Entry saved successfully.',
          });
        } else {
          // If entry is not found or user is not the owner, send an error to the sender
          socket.emit('saveError', { entryId, message: 'Save failed: Entry not found or permission denied.' });
        }
      } catch (error) {
        console.error('Socket save error:', error);
        socket.emit('saveError', { entryId, message: 'An error occurred on the server while saving.' });
      }
    });

    // Event: Client disconnects
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.id} (UserID: ${socket.userId})`);
    });
  });

  return io;
};

export { initSocketServer };
