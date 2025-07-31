import { createClient } from 'supabase'

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

  console.log('📤 Sending request to Power BI API:', embedTokenUrl)
  console.log('📤 Request body:', JSON.stringify(requestBody, null, 2))
  const response = await fetch(embedTokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  console.log(`📥 Power BI embed token API response status: ${response.status} ${response.statusText}`)
  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ Power BI embed token error (response not ok):', response.status, errorText)
    throw new Error(`Failed to generate embed token (${response.status}): ${errorText}`)

async function getAuthenticatedUser(req: Request) {
  // Create Supabase client with service role for JWT verification
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    }
  )

  // Get the authenticated user
  const { data: { user }, error } = await supabaseClient.auth.getUser()

  let embedTokenData
  try {
    embedTokenData = await response.json()
    console.log('📥 Received raw embed token data:', JSON.stringify(embedTokenData, null, 2))
  } catch (jsonError: any) {
    const rawResponseText = await response.text()
    console.error('❌ Error parsing embed token JSON response:', jsonError.message, 'Raw response:', rawResponseText)
    throw new Error(`Failed to parse embed token response: ${jsonError.message}`)
  }
  
  // Validate the response structure
  if (!embedTokenData || typeof embedTokenData.token !== 'string' || typeof embedTokenData.tokenId !== 'string' || typeof embedTokenData.expiration !== 'string') {
    console.error('❌ Embed token data is missing expected properties or malformed:', JSON.stringify(embedTokenData))
    throw new Error('Power BI embed token response is missing expected "token", "tokenId", or "expiration" properties')
  }
  }
  console.log('✅ Power BI embed token generated successfully')

  return user
}

/**
 * Main handler function
 */
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('📡 Power BI embed config request received')

    // Get authenticated user
    const user = await getAuthenticatedUser(req)
    
    console.log(`🔐 Authenticated request from user: ${user.email} (${user.id})`)

    // Extract user information
    const userId = user.id
    const userEmail = user.email

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