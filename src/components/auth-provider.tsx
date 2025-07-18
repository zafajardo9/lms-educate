'use client'

import { ReactNode } from 'react'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  // For now, we'll just return the children directly
  // Better Auth handles session management internally
  return <>{children}</>
}