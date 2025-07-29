import express from 'express';
import powerbiService from '../services/powerbiService.js';

const router = express.Router();

/**
 * GET /api/embed/config
 * Returns complete embed configuration for the default report
 */
router.get('/config', async (req, res) => {
  try {
    console.log('📡 API Request: GET /api/embed/config');
    
    const { reportId, workspaceId } = req.query;
    const embedConfig = await powerbiService.getEmbedConfig(reportId, workspaceId);
    
    res.json({
      success: true,
      data: embedConfig,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error in /api/embed/config:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/embed/token
 * Returns just the embed token for a report
 */
router.get('/token', async (req, res) => {
  try {
    console.log('📡 API Request: GET /api/embed/token');
    
    const { reportId, workspaceId } = req.query;
    
    // Get access token first
    const accessToken = await authService.getAccessToken();
    
    // Generate embed token
    const embedTokenData = await powerbiService.generateEmbedToken(accessToken, reportId, workspaceId);
    
    res.json({
      success: true,
      data: {
        token: embedTokenData.token,
        tokenId: embedTokenData.tokenId,
        expiration: embedTokenData.expiration
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error in /api/embed/token:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/embed/reports
 * Lists all reports in the workspace
 */
router.get('/reports', async (req, res) => {
  try {
    console.log('📡 API Request: GET /api/embed/reports');
    
    const { workspaceId } = req.query;
    const reports = await powerbiService.listReports(workspaceId);
    
    res.json({
      success: true,
      data: reports.map(report => ({
        id: report.id,
        name: report.name,
        embedUrl: report.embedUrl,
        datasetId: report.datasetId
      })),
      count: reports.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error in /api/embed/reports:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/embed/config
 * Returns embed configuration for specific report and workspace
 */
router.post('/config', async (req, res) => {
  try {
    console.log('📡 API Request: POST /api/embed/config');
    
    const { reportId, workspaceId, settings } = req.body;
    
    if (!reportId || !workspaceId) {
      return res.status(400).json({
        success: false,
        error: 'reportId and workspaceId are required',
        timestamp: new Date().toISOString()
      });
    }
    
    const embedConfig = await powerbiService.getEmbedConfig(reportId, workspaceId);
    
    // Apply custom settings if provided
    if (settings) {
      embedConfig.settings = { ...embedConfig.settings, ...settings };
    }
    
    res.json({
      success: true,
      data: embedConfig,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error in POST /api/embed/config:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;