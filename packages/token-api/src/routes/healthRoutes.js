import express from 'express';
import { config, validateConfig } from '../config/config.js';
import authService from '../services/authService.js';

const router = express.Router();

/**
 * GET /api/health
 * Returns application health status
 */
router.get('/', async (req, res) => {
  try {
    const configValidation = validateConfig();
    const authConfigValid = authService.validateConfig();
    
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: config.server.nodeEnv,
      configuration: {
        isValid: configValidation.isValid && authConfigValid,
        errors: configValidation.errors,
        warnings: configValidation.warnings
      },
      services: {
        authentication: authConfigValid ? 'ready' : 'misconfigured',
        powerbi: configValidation.isValid ? 'ready' : 'misconfigured'
      }
    };

    const statusCode = health.configuration.isValid ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    console.error('❌ Health check error:', error.message);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * GET /api/health/auth
 * Tests authentication by attempting to get an access token
 */
router.get('/auth', async (req, res) => {
  try {
    console.log('🔍 Testing authentication...');
    
    const accessToken = await authService.getAccessToken();
    
    res.json({
      status: 'ok',
      message: 'Authentication successful',
      hasToken: !!accessToken,
      tokenLength: accessToken ? accessToken.length : 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Authentication failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;