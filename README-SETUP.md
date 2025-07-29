# Power BI Secured Embed Setup Guide

This guide will help you set up the Power BI Secured Embed application with Supabase.

## Prerequisites

1. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
2. **Power BI Service Principal**: Set up an Azure AD Service Principal with Power BI API access
3. **Supabase CLI**: Install the Supabase CLI following [these instructions](https://supabase.com/docs/guides/cli)

## Setup Steps

### 1. Initialize Supabase Project

If you haven't already initialized Supabase in your project:

```bash
# From the project root
supabase init
```

### 2. Start Local Supabase Development

```bash
supabase start
```

This will start all Supabase services locally. Note the URLs and keys provided.

### 3. Configure Environment Variables

Copy the environment file and configure it:

```bash
cd packages/powerbi-secured-embed
cp .env.example .env
```

Edit `.env` with your Supabase project details:

```env
REACT_APP_SUPABASE_URL=http://localhost:54321
REACT_APP_SUPABASE_ANON_KEY=your-local-anon-key
```

### 4. Set Supabase Secrets

Configure the secrets needed by the Edge Function:

```bash
# Azure Service Principal Configuration
supabase secrets set AZURE_CLIENT_ID=your-service-principal-client-id
supabase secrets set AZURE_CLIENT_SECRET=your-service-principal-client-secret
supabase secrets set AZURE_TENANT_ID=your-tenant-id

# Power BI Configuration
supabase secrets set POWERBI_WORKSPACE_ID=your-powerbi-workspace-id
supabase secrets set POWERBI_REPORT_ID=your-powerbi-report-id
supabase secrets set POWERBI_API_URL=https://api.powerbi.com
supabase secrets set POWERBI_SCOPE=https://analysis.windows.net/powerbi/api/.default

# Supabase JWT Secret (get this from your Supabase dashboard)
supabase secrets set SUPABASE_JWT_SECRET=your-jwt-secret
```

### 5. Deploy the Edge Function

```bash
supabase functions deploy get-powerbi-embed-config
```

### 6. Install Dependencies and Start the Application

```bash
# From the project root
npm install

# Start the secured embed application
npm run start:secured-embed
```

## Testing the Application

1. Open your browser to `http://localhost:3002`
2. Sign up for a new account or sign in with existing credentials
3. Once authenticated, the Power BI report should load automatically
4. Test token refresh by waiting for the token to expire (or manually triggering it)

## Production Deployment

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key from the project settings

### 2. Configure Production Environment

Update your production environment variables:

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-production-anon-key
```

### 3. Set Production Secrets

```bash
# Link to your production project
supabase link --project-ref your-project-ref

# Set production secrets
supabase secrets set AZURE_CLIENT_ID=your-service-principal-client-id --project-ref your-project-ref
# ... repeat for all secrets
```

### 4. Deploy Edge Function to Production

```bash
supabase functions deploy get-powerbi-embed-config --project-ref your-project-ref
```

### 5. Build and Deploy Frontend

```bash
# Build the application
npm run build --workspace=powerbi-secured-embed

# Deploy to your preferred hosting service (Netlify, Vercel, etc.)
```

## Security Considerations

1. **Row-Level Security**: The Edge Function includes support for passing user IDs to Power BI for RLS
2. **Token Refresh**: The application automatically refreshes tokens before they expire
3. **CORS**: The Edge Function is configured with appropriate CORS headers
4. **JWT Verification**: All requests to the Edge Function are verified for valid authentication

## Troubleshooting

### Common Issues

1. **"Missing Azure Service Principal configuration"**
   - Ensure all Azure secrets are set correctly
   - Verify your Service Principal has Power BI API permissions

2. **"Power BI API error (403)"**
   - Check that your Service Principal is added to the Power BI workspace
   - Verify Power BI tenant settings allow service principal access

3. **"Invalid or expired token"**
   - Check that your SUPABASE_JWT_SECRET matches your project's JWT secret
   - Ensure the user is properly authenticated

4. **CORS errors**
   - Verify your site URL is configured correctly in Supabase Auth settings
   - Check that the Edge Function CORS headers match your frontend URL

### Debug Mode

To enable debug logging in the Edge Function, check the Supabase Functions logs:

```bash
supabase functions logs get-powerbi-embed-config
```

## Support

For issues specific to this implementation, check:
1. Supabase Functions logs
2. Browser developer console
3. Power BI Admin Portal audit logs