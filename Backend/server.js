const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// CORS middleware - VERY IMPORTANT for frontend connection
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📡 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Import routes
const apiRoutes = require('./routes/api');

// Use routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: '🚀 AdVantage Gen API',
    status: 'running',
    endpoints: {
      test: '/api/test',
      options: '/api/options',
      generateImage: '/api/generate-image',
      generateCaption: '/api/generate-caption',
      fullCampaign: '/api/full-campaign',
      campaigns: '/api/campaigns'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.stack);
  res.status(500).json({ 
    success: false, 
    error: err.message || 'Something went wrong!'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
┌─────────────────────────────────────┐
│   🚀 AdVantage Gen API Server       │
├─────────────────────────────────────┤
│   Status: Running                    │
│   Port: ${PORT}                        │
│   Test: http://localhost:${PORT}/api/test │
│   Full: http://localhost:${PORT}/api/full-campaign │
└─────────────────────────────────────┘
  `);
});