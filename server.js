const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  console.log(`📡 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

const apiRoutes = require('./routes/api');

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.json({
    message: '🚀 Welcome to AdVantage Gen API',
    version: '1.0.0',
    endpoints: {
      test: 'GET /api/test',
      styles: 'GET /api/styles',
      enhance: 'POST /api/enhance-prompt',
      generate: 'POST /api/generate-image',
      pipeline: 'POST /api/full-pipeline'
    },
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /',
      'GET /api/test',
      'GET /api/styles',
      'POST /api/enhance-prompt',
      'POST /api/generate-image',
      'POST /api/full-pipeline'
    ]
  });
});


app.use((err, req, res, next) => {
  console.error(' Server error:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`

     Running on: http://localhost:${PORT}  
 Environment: ${process.env.NODE_ENV || 'development'}    

  `);
  
  console.log('Available endpoints:');
  console.log(`GET  → http://localhost:${PORT}/`);
  console.log(`GET  → http://localhost:${PORT}/api/test`);
  console.log(`GET  → http://localhost:${PORT}/api/styles`);
  console.log(`POST → http://localhost:${PORT}/api/enhance-prompt`);
  console.log(`POST → http://localhost:${PORT}/api/generate-image`);
  console.log(`POST → http://localhost:${PORT}/api/full-pipeline`);
});