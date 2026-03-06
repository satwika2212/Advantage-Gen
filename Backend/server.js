// ============================================
// FILE: server.js
// PURPOSE: Main server file with CORS configured
// ============================================

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// ============================================
// MIDDLEWARE - Things that process requests
// ============================================

// ✅ IMPORTANT: CORS configuration goes HERE
// Allow frontend (React on port 3000) to talk to backend
app.use(cors({
  origin: 'http://localhost:5173', // React app address
  credentials: true
}));

// Parse JSON data from requests
app.use(express.json({ limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Log all requests (helpful for debugging)
app.use((req, res, next) => {
  console.log(`📡 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ============================================
// DATABASE CONNECTION
// ============================================
// ... your database code ...

// ============================================
// ROUTES - API endpoints
// ============================================
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// ============================================
// ROOT ROUTE
// ============================================
app.get('/', (req, res) => {
  res.json({
    message: '🚀 AdVantage Gen API',
    status: 'running'
  });
});

// ============================================
// ERROR HANDLING
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ 
    success: false, 
    error: err.message || 'Something went wrong!' 
  });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
🚀 Server running!    
  `);
});