import fetch from 'node-fetch';
import { config } from '../config/config.js';
import authService from './authService.js';

class PowerBIService {
  constructor() {
    this.baseUrl = config.powerbi.apiUrl;
  }

  /**
   * Generates embed token for a Power BI report
   * @param {string} accessToken - Azure AD access token
   * @param {string} reportId - Power BI report ID (optional, uses config if not provided)
   * @param {string} workspaceId - Power BI workspace ID (optional, uses config if not provided)
   * @returns {Promise<Object>} Embed token response
   */
  async generateEmbedToken(accessToken, reportId = null, workspaceId = null) {
    try {
      const targetReportId = reportId || config.powerbi.reportId;
      const targetWorkspaceId = workspaceId || config.powerbi.workspaceId;

      if (!targetReportId || !targetWorkspaceId) {
        throw new Error('Report ID and Workspace ID are required');
      }

      console.log(`🔄 Generating embed token for report: ${targetReportId}`);

      const embedTokenUrl = `${this.baseUrl}/v1.0/myorg/groups/${targetWorkspaceId}/reports/${targetReportId}/GenerateToken`;
      
      const requestBody = {
        accessLevel: 'View',
        allowSaveAs: false
      };

      const response = await fetch(embedTokenUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Power BI API error (${response.status}): ${errorText}`);
      }

      const embedTokenData = await response.json();
      console.log('✅ Embed token generated successfully');
      
      return embedTokenData;
    } catch (error) {
      console.error('❌ Error generating embed token:', error.message);
      throw error;
    }
  }

  /**
   * Gets report details including embed URL
   * @param {string} accessToken - Azure AD access token
   * @param {string} reportId - Power BI report ID
   * @param {string} workspaceId - Power BI workspace ID
   * @returns {Promise<Object>} Report details
   */
  async getReportDetails(accessToken, reportId = null, workspaceId = null) {
    try {
      const targetReportId = reportId || config.powerbi.reportId;
      const targetWorkspaceId = workspaceId || config.powerbi.workspaceId;

      console.log(`🔄 Fetching report details for: ${targetReportId}`);

      const reportUrl = `${this.baseUrl}/v1.0/myorg/groups/${targetWorkspaceId}/reports/${targetReportId}`;

      const response = await fetch(reportUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Power BI API error (${response.status}): ${errorText}`);
      }

      const reportData = await response.json();
      console.log('✅ Report details fetched successfully');
      
      return reportData;
    } catch (error) {
      console.error('❌ Error fetching report details:', error.message);
      throw error;
    }
  }

  /**
   * Gets complete embedding configuration for a report
   * @param {string} reportId - Power BI report ID (optional)
   * @param {string} workspaceId - Power BI workspace ID (optional)
   * @returns {Promise<Object>} Complete embed configuration
   */
  async getEmbedConfig(reportId = null, workspaceId = null) {
    try {
      console.log('🚀 Starting Power BI embed configuration process...');
      
      // Get access token
      const accessToken = await authService.getAccessToken();
      
      // Get report details and embed token in parallel
      const [reportDetails, embedTokenData] = await Promise.all([
        this.getReportDetails(accessToken, reportId, workspaceId),
        this.generateEmbedToken(accessToken, reportId, workspaceId)
      ]);

      const embedConfig = {
        type: 'report',
        id: reportDetails.id,
        embedUrl: reportDetails.embedUrl,
        accessToken: embedTokenData.token,
        tokenId: embedTokenData.tokenId,
        expiration: embedTokenData.expiration,
        settings: {
          panes: {
            filters: {
              expanded: false,
              visible: true
            },
            pageNavigation: {
              visible: true
            }
          },
          bars: {
            statusBar: {
              visible: true
            }
          }
        }
      };

      console.log('🎉 Embed configuration generated successfully');
      return embedConfig;
    } catch (error) {
      console.error('❌ Error generating embed configuration:', error.message);
      throw error;
    }
  }

  /**
   * Lists all reports in the workspace
   * @param {string} workspaceId - Power BI workspace ID (optional)
   * @returns {Promise<Array>} List of reports
   */
  async listReports(workspaceId = null) {
    try {
      const targetWorkspaceId = workspaceId || config.powerbi.workspaceId;
      console.log(`🔄 Fetching reports from workspace: ${targetWorkspaceId}`);

      const accessToken = await authService.getAccessToken();
      const reportsUrl = `${this.baseUrl}/v1.0/myorg/groups/${targetWorkspaceId}/reports`;

      const response = await fetch(reportsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Power BI API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ Found ${data.value.length} reports in workspace`);
      
      return data.value;
    } catch (error) {
      console.error('❌ Error listing reports:', error.message);
      throw error;
    }
  }
}

export default new PowerBIService();