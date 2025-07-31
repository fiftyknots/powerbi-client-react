import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { verify } from 'https://deno.land/x/djwt@v3.0.1/mod.ts'
import { decode } from 'https://deno.land/std@0.168.0/encoding/base64.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', 
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface PowerBIEmbedConfig {
  type: string
  id: string
  embedUrl: string
  accessToken: string
  tokenId: string
  expiration: string
  settings?: any
}

interface AzureTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface PowerBIEmbedTokenResponse {
  token: string
  tokenId: string
  expiration: string
}

interface PowerBIReportResponse {
  id: string
  name: string
  embedUrl: string
  datasetId: string
}

/**
 * Acquires an Azure AD access token using Service Principal credentials
 */
async function getAzureAccessToken(): Promise<string> {
  const clientId = Deno.env.get('AZURE_CLIENT_ID')
  const clientSecret = Deno.env.get('AZURE_CLIENT_SECRET')
  const tenantId = Deno.env.get('AZURE_TENANT_ID')
  const scope = Deno.env.get('POWERBI_SCOPE') || 'https://analysis.windows.net/powerbi/api/.default'

  if (!clientId || !clientSecret || !tenantId) {
    throw new Error('Missing Azure Service Principal configuration')
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`
  
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: scope,
    grant_type: 'client_credentials'
  })

  console.log('🔐 Acquiring Azure AD access token...')
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ Azure AD token error:', errorText)
    throw new Error(`Failed to acquire Azure AD token: ${response.status} ${errorText}`)
  }

  const tokenData: AzureTokenResponse = await response.json()
  console.log('✅ Azure AD access token acquired successfully')
  
  return tokenData.access_token
}

/**
 * Gets Power BI report details
 */
async function getPowerBIReportDetails(accessToken: string, workspaceId: string, reportId: string): Promise<PowerBIReportResponse> {
  const apiUrl = Deno.env.get('POWERBI_API_URL') || 'https://api.powerbi.com'
  const reportUrl = `${apiUrl}/v1.0/myorg/groups/${workspaceId}/reports/${reportId}`

  console.log(`🔄 Fetching Power BI report details for: ${reportId}`)

  const response = await fetch(reportUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ Power BI API error:', errorText)
    throw new Error(`Power BI API error (${response.status}): ${errorText}`)
  }

  const reportData: PowerBIReportResponse = await response.json()
  console.log('✅ Power BI report details fetched successfully')
  
  return reportData
}

/**
 * Generates Power BI embed token
 */
async function generatePowerBIEmbedToken(accessToken: string, workspaceId: string, reportId: string, userId?: string): Promise<PowerBIEmbedTokenResponse> {
  const apiUrl = Deno.env.get('POWERBI_API_URL') || 'https://api.powerbi.com'
  const embedTokenUrl = `${apiUrl}/v1.0/myorg/groups/${workspaceId}/reports/${reportId}/GenerateToken`

  console.log(`🔄 Generating Power BI embed token for report: ${reportId}`)

  const requestBody: any = {
    accessLevel: 'View',
    allowSaveAs: false,
  }

  // If userId is provided, add it for potential RLS (Row Level Security)
  if (userId) {
    requestBody.identities = [{
      username: userId,
      roles: [], // Add specific roles if needed for RLS
      datasets: [] // Add dataset IDs if needed for RLS
    }]
  }

  const response = await fetch(embedTokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ Power BI embed token error:', errorText)
    throw new Error(`Failed to generate embed token (${response.status}): ${errorText}`)
  }

  const embedTokenData: PowerBIEmbedTokenResponse = await response.json()
  console.log('✅ Power BI embed token generated successfully')
  
  return embedTokenData
}

/**
 * Verifies Supabase JWT token
 */
async function verifySupabaseJWT(authHeader: string | null): Promise<any> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header')
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix
  const jwtSecret = Deno.env.get('_SUPABASE_JWT_SECRET')

  if (!jwtSecret) {
    throw new Error('Missing _SUPABASE_JWT_SECRET environment variable')
  }

  console.log('DEBUG: jwtSecret from env: \'' + jwtSecret + '\'.');

  try {
    // Convert the base64 secret to a Uint8Array using Deno's native function
    const rawSecretBytes = decode(jwtSecret);
    // Try different approaches to pass the secret
    console.log('DEBUG: Attempting verification with base64 string secret...')
    
    // First try: Pass the base64 string directly
    try {
      const payload = await verify(token, jwtSecret)
      console.log('✅ JWT verified successfully with base64 string secret')
      return payload
    } catch (error) {
      console.log('❌ Base64 string verification failed:', error.message)
    }
    
    // Second try: Decode base64 and pass as Uint8Array
    try {
      const rawSecretBytes = decode(jwtSecret)
      console.log('DEBUG: rawSecretBytes (hex):', Array.from(rawSecretBytes).map(b => b.toString(16).padStart(2, '0')).join(''))
      
      const payload = await verify(token, rawSecretBytes)
      console.log('✅ JWT verified successfully with Uint8Array secret')
      return payload
    } catch (error) {
      console.log('❌ Uint8Array verification failed:', error.message)
    }
    
    // Third try: Create CryptoKey and use that
    try {
      const rawSecretBytes = decode(jwtSecret)
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        rawSecretBytes,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
      )
      
      const payload = await verify(token, cryptoKey)
      console.log('✅ JWT verified successfully with CryptoKey')
      return payload
    } catch (error) {
      console.log('❌ CryptoKey verification failed:', error.message)
    }
    // If all methods fail, throw an error
    throw new Error('All JWT verification methods failed')
    
  } catch (error) {
    console.error(error);
    console.error('❌ JWT verification failed:', error.message)
    throw new Error('Invalid or expired token')
  }
}

/**
 * Main handler function
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('📡 Power BI embed config request received')

    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    const jwtPayload = await verifySupabaseJWT(authHeader || '')
    console.log('XXX');
    
    // Extract user information from JWT
    const userId = jwtPayload.sub
    const userEmail = jwtPayload.email

    console.log(`🔐 Authenticated request from user: ${userEmail} (${userId})`)

    // Get Power BI configuration from environment
    const workspaceId = Deno.env.get('POWERBI_WORKSPACE_ID')
    const reportId = Deno.env.get('POWERBI_REPORT_ID')

    if (!workspaceId || !reportId) {
      throw new Error('Missing Power BI workspace or report configuration')
    }

    // Get Azure AD access token
    const azureAccessToken = await getAzureAccessToken()

    // Get report details and generate embed token in parallel
    const [reportDetails, embedTokenData] = await Promise.all([
      getPowerBIReportDetails(azureAccessToken, workspaceId, reportId),
      generatePowerBIEmbedToken(azureAccessToken, workspaceId, reportId, userId)
    ])

    // Construct the embed configuration
    const embedConfig: PowerBIEmbedConfig = {
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
            visible: true,
          },
          pageNavigation: {
            visible: true,
          },
        },
        bars: {
          statusBar: {
            visible: true,
          },
        },
      },
    }

    console.log('🎉 Power BI embed configuration generated successfully')

    return new Response(
      JSON.stringify({
        success: true,
        data: embedConfig,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )

  } catch (error) {
    console.error('❌ Error in Power BI embed function:', error.message)

    const statusCode = error.message.includes('Invalid or expired token') ? 401 :
                      error.message.includes('Missing') ? 400 : 500

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: statusCode,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})