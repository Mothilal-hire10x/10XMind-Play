import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@/lib/types'
import { authAPI, getToken } from '@/lib/api-client'
import { trackSignUp, trackSignIn } from '@/lib/mixpanel'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  signup: (email: string, password: string, rollNo?: string, name?: string, dob?: string) => Promise<boolean>
  logout: () => void
  refreshUser: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken()
      if (token) {
        try {
          const currentUser = await authAPI.getCurrentUser()
          setUser(currentUser)
        } catch (error) {
          console.error('Failed to get current user:', error)
          // Token might be invalid, clear it
          authAPI.logout()
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const signup = async (email: string, password: string, rollNo?: string, name?: string, dob?: string): Promise<boolean> => {
    try {
      const newUser = await authAPI.signup(email, password, rollNo, name, dob)
      setUser(newUser)
      
      trackSignUp(newUser.id, newUser.email, name, rollNo, dob)
      
      return true
    } catch (error) {
      console.error('Signup failed:', error)
      return false
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const loggedInUser = await authAPI.login(email, password)
      setUser(loggedInUser)
      
      trackSignIn(loggedInUser.id, true)
      
      return true
    } catch (error) {
      console.error('Login failed:', error)
      
      trackSignIn(0, false)
      
      return false
    }
  }

  const logout = () => {
    authAPI.logout()
    setUser(null)
  }

  const refreshUser = async () => {
    try {
      const currentUser = await authAPI.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

