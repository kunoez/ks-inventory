"use client"

import { Suspense } from "react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { loginWithAzureAD } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)
  const [hasProcessed, setHasProcessed] = useState(false)

  useEffect(() => {
    // Prevent multiple executions
    if (hasProcessed) return
    
    async function handleCallback() {
      setHasProcessed(true)
      console.log('=== Azure AD Callback Processing ===');
      
      try {
        // Check for error in the callback
        const errorParam = searchParams.get("error")
        const errorDescription = searchParams.get("error_description")
        
        console.log('Callback URL Parameters:');
        console.log('- Error:', errorParam || 'None');
        console.log('- Error Description:', errorDescription || 'None');
        console.log('- Has code:', searchParams.has('code'));
        
        if (errorParam) {
          const decodedError = errorDescription ? decodeURIComponent(errorDescription) : errorParam
          console.error('Azure AD returned error:', decodedError);
          setError(`Authentication failed: ${decodedError}`)
          setIsProcessing(false)
          return
        }

        // Get the authorization code
        const code = searchParams.get("code")
        
        console.log('Authorization Code:', code ? code.substring(0, 20) + '...' : 'NOT FOUND');
        
        if (!code) {
          console.error('No authorization code in callback URL');
          setError("No authorization code received")
          setIsProcessing(false)
          return
        }

        // Get the PKCE code verifier from session storage
        console.log('Checking for PKCE code verifier in sessionStorage...');
        const codeVerifier = sessionStorage.getItem("pkce_code_verifier")
        
        console.log('PKCE Code Verifier:', codeVerifier ? 'FOUND (length: ' + codeVerifier.length + ')' : 'NOT FOUND');
        
        // Log all sessionStorage keys for debugging
        console.log('SessionStorage keys:', Object.keys(sessionStorage));
        
        if (!codeVerifier) {
          console.error('PKCE code verifier not found in sessionStorage');
          setError("PKCE code verifier not found. Please try logging in again.")
          setIsProcessing(false)
          return
        }

        // Exchange the code for tokens
        // Note: In production, this should be done through your backend
        // to keep the client secret secure
        const success = await loginWithAzureAD(code, codeVerifier)
        
        if (success) {
          // Clear the PKCE verifier
          sessionStorage.removeItem("pkce_code_verifier")
          
          // Use window.location to force a full page reload
          // This ensures the AuthContext re-initializes with the new user data
          window.location.href = "/"
        } else {
          setError("Failed to complete authentication")
        }
      } catch (err) {
        console.error("Authentication callback error:", err)
        setError("An unexpected error occurred during authentication")
      } finally {
        setIsProcessing(false)
      }
    }

    handleCallback()
  }, []) // Remove dependencies to prevent re-execution

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>
            {isProcessing ? "Processing your login..." : "Authentication callback"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">
                Completing authentication with Microsoft...
              </p>
            </div>
          ) : error ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="flex justify-center">
                <button
                  onClick={() => router.push("/")}
                  className="text-sm text-primary hover:underline"
                >
                  Return to login
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                Redirecting to dashboard...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">
                Loading authentication...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}