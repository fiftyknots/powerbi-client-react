import { ConfidentialClientApplication } from '@azure/msal-node';
import { config } from '../config/config.js';

class AuthService {
  constructor() {
    this.msalConfig = {
      auth: {
        clientId: config.azure.clientId,
        clientSecret: config.azure.clientSecret,
        authority: `${config.azure.authority}${config.azure.tenantId}`
      }
    };
    
    this.confidentialClientApp = new ConfidentialClientApplication(this.msalConfig);
  }

  /**
   * Acquires access token using Service Principal (client credentials flow)
   * @returns {Promise<string>} Access token for Power BI API
   */
  async getAccessToken() {
    try {
      const clientCredentialRequest = {
        scopes: [config.powerbi.scope],
        skipCache: false
      };

      console.log('🔐 Acquiring access token using Service Principal...');
      const response = await this.confidentialClientApp.acquireTokenByClientCredential(clientCredentialRequest);
      
      if (!response || !response.accessToken) {
        throw new Error('Failed to acquire access token');
      }

      console.log('✅ Access token acquired successfully');
      return response.accessToken;
    } catch (error) {
      console.error('❌ Error acquiring access token:', error.message);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Validates the current authentication configuration
   * @returns {boolean} True if configuration is valid
   */
  validateConfig() {
    const requiredFields = [
      config.azure.clientId,
      config.azure.clientSecret,
      config.azure.tenantId
    ];

    const isValid = requiredFields.every(field => field && field.trim() !== '');
    
    if (!isValid) {
      console.error('❌ Authentication configuration is incomplete');
      return false;
    }

    console.log('✅ Authentication configuration is valid');
    return true;
  }
}

export default new AuthService();