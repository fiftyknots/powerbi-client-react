import express from 'express';
import cors from 'cors';
import { config, validateConfig, logConfig } from './src/config/config.js';
import { errorHandler, notFoundHandler } from './src/middleware/errorHandler.js';
import embedRoutes from './src/routes/embedRoutes.js';
import healthRoutes from './src/routes/healthRoutes.js';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📝 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/embed', embedRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Power BI Embedding Service',
    version: '1.0.0',
    description: 'Service Principal-based Power BI embedding solution',
    endpoints: {
      health: '/api/health',
      embedConfig: '/api/embed/config',
      embedToken: '/api/embed/token',
      reports: '/api/embed/reports'
    },
    documentation: 'See README.md for setup and usage instructions',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Startup validation and server launch
async function startServer() {
  console.log('🚀 Starting Power BI Embedding Service...');
  
  // Log configuration
  logConfig();
  
  // Validate configuration
  const validation = validateConfig();
  
  if (!validation.isValid) {
    console.error('❌ Configuration validation failed:');
    validation.errors.forEach(error => console.error(`   • ${error}`));
    process.exit(1);
  }
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️  Configuration warnings:');
    validation.warnings.forEach(warning => console.warn(`   • ${warning}`));
  }
  
  // Start server
  const server = app.listen(config.server.port, () => {
    console.log(`✅ Server running on port ${config.server.port}`);
    console.log(`🌐 Health check: http://localhost:${config.server.port}/api/health`);
    console.log(`📊 Embed config: http://localhost:${config.server.port}/api/embed/config`);
    console.log('🎉 Ready for Power BI embedding requests!');
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('📴 SIGTERM received, shutting down gracefully...');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('📴 SIGINT received, shutting down gracefully...');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});