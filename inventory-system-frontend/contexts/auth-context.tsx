"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { type AuthState, authService } from "@/lib/auth"

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>
  loginWithAzureAD: (authCode: string, codeVerifier?: string) => Promise<boolean>
  initiateAzureLogin: () => string
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  })

  useEffect(() => {
    // Check for existing user session on mount
    const user = authService.getCurrentUser()
    setState({
      user,
      isLoading: false,
      isAuthenticated: !!user,
    })
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      const user = await authService.login(email, password)

      if (user) {
        authService.setCurrentUser(user)
        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
        })
        return true
      } else {
        setState((prev) => ({ ...prev, isLoading: false }))
        return false
      }
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }))
      return false
    }
  }

  const loginWithAzureAD = async (authCode: string, codeVerifier?: string): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      const user = await authService.loginWithAzureAD(authCode, codeVerifier)

      if (user) {
        authService.setCurrentUser(user)
        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
        })
        return true
      } else {
        setState((prev) => ({ ...prev, isLoading: false }))
        return false
      }
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }))
      return false
    }
  }

  const initiateAzureLogin = (): string => {
    return authService.initiateAzureLogin()
  }

  const logout = async (): Promise<void> => {
    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      await authService.logout()
      authService.setCurrentUser(null)
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      })
    } catch (error) {
      // Even if logout fails, clear local state
      authService.setCurrentUser(null)
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      })
    }
  }

  const value: AuthContextType = {
    ...state,
    login,
    loginWithAzureAD,
    initiateAzureLogin,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
