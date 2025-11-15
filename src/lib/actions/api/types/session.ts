import { UserRole } from '@/types'

export interface SessionUser {
  id: string
  role: UserRole
  email?: string
  name?: string
}
