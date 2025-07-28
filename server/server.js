// =================================================================
// BATCHBOOK API | MAIN ENTRY FILE (server.js)
// =================================================================

// -----------------------------------------------------------------
// IMPORTS
// -----------------------------------------------------------------

// Core Node.js and Express modules
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

// Custom modules
import connectDB from './config/db.js';
import initSocket from './socket.js';

// Route handlers
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import entryRoutes from './routes/entryRoutes.js';
import exportRoutes from './routes/exportRoutes.js';

// Middleware
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// -----------------------------------------------------------------
// INITIALIZATION & CONFIGURATION
// -----------------------------------------------------------------

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB database
connectDB();

// Create an HTTP server instance from the Express app to be used with Socket.IO
const server = http.createServer(app);

// Initialize Socket.IO server and configure CORS
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*', // Restrict to frontend URL in production
    methods: ['GET', 'POST'],
  },
});

// Pass the Socket.IO instance to our custom event handler module
initSocket(io);


// -----------------------------------------------------------------
// GLOBAL MIDDLEWARE
// -----------------------------------------------------------------

// Enable Cross-Origin Resource Sharing for all HTTP routes
app.use(cors());

// Enable Express to parse JSON request bodies
app.use(express.json());


// -----------------------------------------------------------------
// API ROUTES
// -----------------------------------------------------------------

// A simple root endpoint for health checks
app.get('/', (req, res) => {
  res.send('BatchBook API is running...');
});

// Mount the various API route modules
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/entries', entryRoutes);
app.use('/api/exports', exportRoutes);


// -----------------------------------------------------------------
// ERROR HANDLING MIDDLEWARE
// -----------------------------------------------------------------

// This middleware handles requests for routes that do not exist (404)
app.use(notFound);

// This is the global error handler. It must be the last middleware used.
app.use(errorHandler);


// -----------------------------------------------------------------
// SERVER STARTUP
// -----------------------------------------------------------------

const PORT = process.env.PORT || 5000;

// Start the server (the one integrated with Socket.IO)
server.listen(PORT, () => {
  console.log(`🚀 Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
