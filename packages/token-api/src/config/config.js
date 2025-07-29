import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Application configuration object
 */
export const config = {
  server: {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  
  azure: {
    clientId: process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
    tenantId: process.env.AZURE_TENANT_ID,
    authority: process.env.AZURE_AUTHORITY || 'https://login.microsoftonline.com/'
  },
  
  powerbi: {
    workspaceId: process.env.POWERBI_WORKSPACE_ID,
    reportId: process.env.POWERBI_REPORT_ID,
    apiUrl: process.env.POWERBI_API_URL || 'https://api.powerbi.com',
    scope: process.env.POWERBI_SCOPE || 'https://analysis.windows.net/powerbi/api/.default'
  },
  
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS ? 
      process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) : 
      ['http://localhost:3000', 'http://localhost:5173']
  }
};

/**
 * Validates the configuration
 * @returns {Object} Validation results
 */
export const validateConfig = () => {
  const errors = [];
  const warnings = [];

  // Required Azure configuration
  if (!config.azure.clientId) errors.push('AZURE_CLIENT_ID is required');
  if (!config.azure.clientSecret) errors.push('AZURE_CLIENT_SECRET is required');
  if (!config.azure.tenantId) errors.push('AZURE_TENANT_ID is required');

  // Required Power BI configuration
  if (!config.powerbi.workspaceId) errors.push('POWERBI_WORKSPACE_ID is required');
  if (!config.powerbi.reportId) warnings.push('POWERBI_REPORT_ID not set - will need to be provided in API calls');

  // Validate URLs
  try {
    new URL(config.azure.authority);
  } catch {
    errors.push('AZURE_AUTHORITY must be a valid URL');
  }

  try {
    new URL(config.powerbi.apiUrl);
  } catch {
    errors.push('POWERBI_API_URL must be a valid URL');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Logs the current configuration (without sensitive data)
 */
export const logConfig = () => {
  console.log('📋 Configuration Summary:');
  console.log(`   Server Port: ${config.server.port}`);
  console.log(`   Environment: ${config.server.nodeEnv}`);
  console.log(`   Azure Tenant: ${config.azure.tenantId || 'Not configured'}`);
  console.log(`   Azure Client ID: ${config.azure.clientId ? '***configured***' : 'Not configured'}`);
  console.log(`   Power BI Workspace: ${config.powerbi.workspaceId || 'Not configured'}`);
  console.log(`   Power BI Report: ${config.powerbi.reportId || 'Not configured'}`);
  console.log(`   CORS Origins: ${config.cors.allowedOrigins.join(', ')}`);
};