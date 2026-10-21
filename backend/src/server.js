import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requestLogger } from './middlewares/requestLogger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { sendError } from './utils/apiResponse.js';
import apiRoutes from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Security HTTP headers
app.use(helmet());

// CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  process.env.ADMIN_URL || 'http://localhost:3001',
  'http://localhost:5173', // Vite default dev port
  'http://localhost:5174',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy blocks access from origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
  })
);

// Morgan request logging
app.use(requestLogger);

// Body parsers: preserve raw body for Stripe webhook signature verification
app.use(
  express.json({
    verify: (req, res, buf) => {
      if (req.originalUrl.startsWith('/api/webhooks')) {
        req.rawBody = buf;
      }
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Mount main API routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Lakbay Tour & Travel Booking Platform API',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// 404 Not Found Handler
app.use((req, res) => {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
});

// Global Error Handler
app.use(errorHandler);

// Start HTTP Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, HOST, () => {
    console.log(`[Lakbay API] Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`[Lakbay API] Health check available at: http://localhost:${PORT}/api/health`);
  });
}

export default app;
