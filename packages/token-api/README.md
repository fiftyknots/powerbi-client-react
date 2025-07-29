# Power BI Embedding Service

A Node.js/Express application that provides Service Principal-based authentication and embed token generation for Power BI reports. This service eliminates the need for manual token and URL input in Power BI React applications.

## 🚀 Features

- **Service Principal Authentication**: Secure server-side authentication using Azure Service Principal
- **Automatic Token Generation**: Generates embed tokens for Power BI reports
- **RESTful API**: Clean API endpoints for integration with React applications
- **Comprehensive Error Handling**: Detailed error messages and logging
- **Health Checks**: Built-in health monitoring and configuration validation
- **CORS Support**: Configured for React application integration
- **Environment-based Configuration**: All settings managed through environment variables

## 📋 Prerequisites

Before setting up this service, you'll need:

1. **Azure Service Principal** with Power BI permissions
2. **Power BI Pro/Premium** workspace and reports
3. **Node.js 18+** installed
4. **Power BI Admin** permissions to configure service principal access

## 🔧 Setup Instructions

### 1. Create Azure Service Principal

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Enter application name (e.g., "PowerBI-Embedding-Service")
5. Select **Accounts in this organizational directory only**
6. Click **Register**
7. Note down the **Application (client) ID** and **Directory (tenant) ID**
8. Go to **Certificates & secrets** > **New client secret**
9. Create a secret and note down the **Client secret value**

### 2. Configure Power BI Service Principal

1. Go to [Power BI Admin Portal](https://app.powerbi.com/admin-portal)
2. Navigate to **Tenant settings**
3. Find **Developer settings** > **Allow service principals to use Power BI APIs**
4. Enable the setting and add your service principal
5. Navigate to your Power BI workspace
6. Go to **Workspace settings** > **Access**
7. Add your service principal as **Admin** or **Member**

### 3. Install Dependencies

```bash
npm install
```

### 4. Environment Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update the `.env` file with your values:
```env
# Azure Service Principal Configuration
AZURE_CLIENT_ID=your-service-principal-client-id
AZURE_CLIENT_SECRET=your-service-principal-client-secret
AZURE_TENANT_ID=your-tenant-id

# Power BI Configuration
POWERBI_WORKSPACE_ID=your-powerbi-workspace-id
POWERBI_REPORT_ID=your-powerbi-report-id

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration (comma-separated origins)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 5. Find Your Power BI IDs

**Workspace ID:**
- Open your Power BI workspace in browser
- Copy the GUID from the URL: `https://app.powerbi.com/groups/{workspace-id}/`

**Report ID:**
- Open a report in your workspace
- Copy the GUID from the URL: `https://app.powerbi.com/groups/{workspace-id}/reports/{report-id}/`

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3001` (or your configured PORT).

## 📡 API Endpoints

### Health Check
```
GET /api/health
```
Returns service health and configuration status.

### Authentication Test
```
GET /api/health/auth
```
Tests Service Principal authentication.

### Get Embed Configuration
```
GET /api/embed/config?reportId={id}&workspaceId={id}
```
Returns complete embed configuration including token and URL.

**Query Parameters:**
- `reportId` (optional): Specific report ID (uses env default if not provided)
- `workspaceId` (optional): Specific workspace ID (uses env default if not provided)

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "report",
    "id": "report-id",
    "embedUrl": "https://app.powerbi.com/reportEmbed",
    "accessToken": "embed-token",
    "tokenId": "token-id",
    "expiration": "2024-01-01T12:00:00Z",
    "settings": {
      "panes": {
        "filters": { "expanded": false, "visible": true },
        "pageNavigation": { "visible": true }
      }
    }
  }
}
```

### Get Embed Token Only
```
GET /api/embed/token?reportId={id}&workspaceId={id}
```
Returns just the embed token information.

### List Reports
```
GET /api/embed/reports?workspaceId={id}
```
Lists all reports in the workspace.

### Custom Embed Configuration
```
POST /api/embed/config
Content-Type: application/json

{
  "reportId": "your-report-id",
  "workspaceId": "your-workspace-id",
  "settings": {
    "panes": {
      "filters": { "visible": false }
    }
  }
}
```

## 🔗 Integration with React Applications

### Using with powerbi-client-react

Instead of manually entering tokens in the React demo, make API calls to this service:

```javascript
// In your React component
useEffect(() => {
  const loadEmbedConfig = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/embed/config');
      const result = await response.json();
      
      if (result.success) {
        setEmbedConfig(result.data);
      }
    } catch (error) {
      console.error('Failed to load embed config:', error);
    }
  };

  loadEmbedConfig();
}, []);
```

### Example React Integration

```javascript
import { PowerBIEmbed } from 'powerbi-client-react';
import { models } from 'powerbi-client';

function PowerBIReport() {
  const [embedConfig, setEmbedConfig] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/embed/config')
      .then(response => response.json())
      .then(result => {
        if (result.success) {
          setEmbedConfig(result.data);
        }
      });
  }, []);

  if (!embedConfig) return <div>Loading...</div>;

  return (
    <PowerBIEmbed
      embedConfig={embedConfig}
      eventHandlers={new Map([
        ['loaded', () => console.log('Report loaded')],
        ['rendered', () => console.log('Report rendered')]
      ])}
      cssClassName="report-style-class"
      getEmbeddedComponent={(embeddedReport) => {
        // Store reference if needed
      }}
    />
  );
}
```

## 🔒 Security Best Practices

1. **Environment Variables**: Never commit `.env` files to version control
2. **Client Secret Protection**: Rotate client secrets regularly
3. **CORS Configuration**: Restrict origins to your application domains only
4. **HTTPS**: Use HTTPS in production environments
5. **Token Expiration**: Implement token refresh logic in your client applications
6. **Rate Limiting**: Consider implementing rate limiting for production use

## 🐛 Troubleshooting

### Common Issues

**"Authentication failed"**
- Verify your Service Principal credentials in `.env`
- Ensure the Service Principal has been added to Power BI workspace
- Check that Power BI service principal API access is enabled

**"Power BI API error (403)"**
- Verify workspace permissions for your Service Principal
- Ensure the Service Principal is added as Admin/Member in workspace settings
- Check Power BI tenant settings allow service principal access

**"Report not found"**
- Verify the `POWERBI_REPORT_ID` and `POWERBI_WORKSPACE_ID` in `.env`
- Ensure the report exists and is published in the specified workspace

**"CORS error in React app"**
- Check `ALLOWED_ORIGINS` in `.env` includes your React app URL
- Verify your React app is running on the allowed origin

### Debug Mode

Set `NODE_ENV=development` in your `.env` file for detailed error messages and stack traces.

### Health Checks

Use the health check endpoints to verify configuration:

```bash
# Check overall health
curl http://localhost:3001/api/health

# Test authentication
curl http://localhost:3001/api/health/auth
```

## 📈 Monitoring and Logging

The service includes comprehensive logging:

- **Request Logging**: All API requests are logged with timestamps
- **Authentication Events**: Service Principal authentication attempts
- **Error Tracking**: Detailed error messages with context
- **Configuration Validation**: Startup validation with warnings/errors

## 🚀 Production Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3001
ALLOWED_ORIGINS=https://your-production-domain.com
```

### PM2 Deployment (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start application with PM2
pm2 start server.js --name powerbi-embedding-service

# Monitor
pm2 monit

# View logs
pm2 logs powerbi-embedding-service
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```

## 📚 Additional Resources

- [Power BI Embedded Documentation](https://docs.microsoft.com/en-us/power-bi/developer/embedded/)
- [Power BI REST API Reference](https://docs.microsoft.com/en-us/rest/api/power-bi/)
- [powerbi-client-react GitHub](https://github.com/Microsoft/PowerBI-client-react)
- [PowerBI-Developer-Samples](https://github.com/Microsoft/PowerBI-Developer-Samples)

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the [Power BI Developer Community](https://community.powerbi.com/t5/Developer/bd-p/Developer)
3. Create an issue in this repository with detailed error messages and configuration (without sensitive data)