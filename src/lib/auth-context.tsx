import React, { createContext, useContext, useEffect, useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { User } from '@/lib/types'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  signup: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useKV<Record<string, { password: string; user: User }>>('users', {})
  const [currentUserId, setCurrentUserId] = useKV<string | null>('currentUserId', null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (currentUserId && users && users[currentUserId]) {
      setUser(users[currentUserId].user)
    } else {
      setUser(null)
    }
    setIsLoading(false)
  }, [currentUserId, users])

  useEffect(() => {
    const initializeAdmin = () => {
      const adminEmail = 'admin@10xscale.ai'
      const adminPassword = 'Jack@123'
      
      const existingAdmin = Object.values(users || {}).find(u => u.user.email === adminEmail)
      
      if (!existingAdmin) {
        const adminId = 'admin_default'
        const adminUser: User = {
          id: adminId,
          email: adminEmail,
          role: 'admin',
          createdAt: Date.now()
        }
        
        setUsers(current => ({
          ...(current || {}),
          [adminId]: { password: adminPassword, user: adminUser }
        }))
      }
    }
    
    if (users !== undefined) {
      initializeAdmin()
    }
  }, [users, setUsers])

  const signup = async (email: string, password: string): Promise<boolean> => {
    const existingUser = Object.values(users || {}).find(u => u.user.email === email)
    if (existingUser) {
      return false
    }

    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newUser: User = {
      id: userId,
      email,
      role: 'student',
      createdAt: Date.now()
    }

    setUsers(current => ({
      ...(current || {}),
      [userId]: { password, user: newUser }
    }))
    setCurrentUserId(userId)
    return true
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    const userEntry = Object.values(users || {}).find(u => u.user.email === email)
    if (!userEntry || userEntry.password !== password) {
      return false
    }

    setCurrentUserId(userEntry.user.id)
    return true
  }

  const logout = () => {
    setCurrentUserId(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
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
