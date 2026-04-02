export interface User {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Session {
  id: string
  token: string
  expiresAt: Date
  userId: string
  createdAt: Date
  updatedAt: Date
  ipAddress: string | null
  userAgent: string | null
}

export interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
}
