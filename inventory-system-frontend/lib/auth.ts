// Authentication utilities and types
import apiClient from "@/lib/api-client"

export interface User {
  id: string
  email: string
  name: string
  firstName?: string
  lastName?: string
  role: "admin" | "manager" | "user"
  department?: string
  azureId?: string // Azure AD object ID
  groups?: string[] // Azure AD groups
  authMethod?: "local" | "azure"
  companyId?: string
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

// Azure AD SSO configuration interface
export interface AzureADConfig {
  tenantId: string
  clientId: string
  clientSecret: string
  redirectUri: string
  autoProvision: boolean
  requireSSO: boolean
  syncGroups: boolean
}

// Authentication service
export const authService = {
  login: async (email: string, password: string): Promise<User | null> => {
    try {
      const response = await apiClient.login(email, password)
      const { user } = response
      
      // Transform backend user to frontend User interface
      const transformedUser: User = {
        id: user.id,
        email: user.email,
        name: user.name || user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role || "user",
        department: user.department,
        azureId: user.azureAdId,
        authMethod: "local",
        companyId: user.companyId,
      }
      
      return transformedUser
    } catch (error) {
      console.error('Login error:', error)
      return null
    }
  },

  loginWithAzureAD: async (authCode: string, codeVerifier?: string): Promise<User | null> => {
    try {
      console.log('=== Azure AD Login (Token Exchange) ===');
      console.log('Auth Code:', authCode ? authCode.substring(0, 20) + '...' : 'NOT PROVIDED');
      console.log('Code Verifier:', codeVerifier ? 'PROVIDED (length: ' + codeVerifier.length + ')' : 'NOT PROVIDED');
      
      // Exchange the auth code for tokens with Azure AD
      const tokenEndpoint = `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_TENANT_ID}/oauth2/v2.0/token`
      
      console.log('Token Endpoint:', tokenEndpoint);
      console.log('Azure Config:', {
        tenantId: process.env.NEXT_PUBLIC_AZURE_TENANT_ID || 'NOT SET',
        clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || 'NOT SET',
        redirectUri: process.env.NEXT_PUBLIC_AZURE_REDIRECT_URI || 'NOT SET'
      });
      
      const params = new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || '',
        grant_type: 'authorization_code',
        code: authCode,
        redirect_uri: process.env.NEXT_PUBLIC_AZURE_REDIRECT_URI || 'http://localhost:3000/auth/callback',
        code_verifier: codeVerifier || '',
      })
      
      console.log('Request Parameters:', {
        client_id: params.get('client_id'),
        grant_type: params.get('grant_type'),
        redirect_uri: params.get('redirect_uri'),
        code: params.get('code')?.substring(0, 20) + '...',
        code_verifier: params.get('code_verifier') ? 'SET' : 'EMPTY'
      });

      console.log('Making token exchange request...');
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      })

      console.log('Token Exchange Response Status:', response.status);
      
      if (!response.ok) {
        const error = await response.json()
        console.error('=== Token Exchange Failed ===');
        console.error('Status:', response.status);
        console.error('Error Response:', error);
        console.error('Error Code:', error.error);
        console.error('Error Description:', error.error_description);
        return null
      }

      const tokens = await response.json()
      
      // Store tokens in localStorage for later use (e.g., fetching user photo)
      localStorage.setItem('azureTokens', JSON.stringify({
        access_token: tokens.access_token,
        expires_in: tokens.expires_in,
        timestamp: Date.now()
      }))
      
      // Decode the ID token to get user information
      const idToken = tokens.id_token
      const payload = JSON.parse(atob(idToken.split('.')[1]))
      
      // Send user data to backend to create/update user and get app tokens
      const azureUserData = {
        email: payload.email || payload.preferred_username,
        name: payload.name || payload.preferred_username,
        azureId: payload.oid || payload.sub,
        department: payload.department,
      }
      
      const backendResponse = await apiClient.loginWithAzure(azureUserData)
      
      const { user } = backendResponse
      
      // Transform backend user to frontend User interface
      const transformedUser: User = {
        id: user.id,
        email: user.email,
        name: user.name || user.email,
        firstName: payload.given_name,
        lastName: payload.family_name,
        role: user.role || "user",
        department: user.department,
        azureId: payload.oid,
        groups: payload.groups,
        authMethod: "azure",
        companyId: user.companyId,
      }
      
      return transformedUser
    } catch (error) {
      console.error('Azure AD login error:', error)
      return null
    }
  },

  initiateAzureLogin: (): string => {
    console.log('=== Initiating Azure AD Login ===');
    
    // In production, this would construct the Azure AD authorization URL
    // Using environment variables or backend config
    const config = {
      tenantId: process.env.NEXT_PUBLIC_AZURE_TENANT_ID || "your-tenant-id",
      clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || "your-client-id",
      redirectUri: process.env.NEXT_PUBLIC_AZURE_REDIRECT_URI || "http://localhost:3000/auth/callback",
      scope: "openid profile email User.Read User.ReadBasic.All",
    }
    
    console.log('Azure AD Config:', {
      tenantId: config.tenantId,
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      scope: config.scope
    });

    // Generate PKCE challenge
    const generateCodeChallenge = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
      let codeVerifier = ''
      for (let i = 0; i < 128; i++) {
        codeVerifier += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      
      console.log('Generated PKCE Code Verifier (length):', codeVerifier.length);
      
      // Store code verifier for later use when exchanging the code
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pkce_code_verifier', codeVerifier)
        console.log('PKCE Code Verifier stored in sessionStorage');
      }
      
      // For simplicity, using plain method (S256 would require crypto API)
      return codeVerifier
    }

    const codeChallenge = generateCodeChallenge()

    const authUrl =
      `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/authorize?` +
      `client_id=${config.clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(config.redirectUri)}&` +
      `scope=${encodeURIComponent(config.scope)}&` +
      `response_mode=query&` +
      `code_challenge=${codeChallenge}&` +
      `code_challenge_method=plain`
    
    console.log('Authorization URL:', authUrl);
    console.log('=== Azure AD Login Initiated ===');

    return authUrl
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.logout()
      // Clear Azure tokens if they exist
      localStorage.removeItem('azureTokens')
    } catch (error) {
      console.error('Logout error:', error)
      // Continue with local logout even if API call fails
      localStorage.removeItem('azureTokens')
    }
  },

  getCurrentUser: (): User | null => {
    // Check if we have a user in localStorage
    const userData = localStorage.getItem("user")
    if (!userData) return null
    
    try {
      const user = JSON.parse(userData)
      // Transform to frontend User interface
      return {
        id: user.id,
        email: user.email,
        name: user.name || user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role || "user",
        department: user.department,
        azureId: user.azureAdId || user.azureId,
        authMethod: user.authMethod || "local",
        companyId: user.companyId,
      }
    } catch (error) {
      console.error('Error parsing user data:', error)
      return null
    }
  },

  setCurrentUser: (user: User | null): void => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user))
    } else {
      localStorage.removeItem("user")
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
    }
  },
}