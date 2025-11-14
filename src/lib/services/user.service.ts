import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { UserRole } from '@/types'

export class UserService {
  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12)
    return bcrypt.hash(password, salt)
  }

  /**
   * Compare a candidate password with a hashed password
   */
  static async comparePassword(candidatePassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, hashedPassword)
  }

  /**
   * Create a new user with hashed password
   */
  static async createUser(data: {
    email: string
    name: string
    password?: string
    role?: UserRole
    isActive?: boolean
  }) {
    const hashedPassword = data.password ? await this.hashPassword(data.password) : undefined

    return prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: data.role || UserRole.STUDENT,
        isActive: data.isActive !== false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Exclude password from response
      },
    })
  }

  /**
   * Update user password
   */
  static async updatePassword(userId: string, newPassword: string) {
    const hashedPassword = await this.hashPassword(newPassword)
    
    return prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    })
  }

  /**
   * Get user by email (including password for authentication)
   */
  static async getUserByEmailWithPassword(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
      },
    })
  }

  /**
   * Get user by ID (excluding password)
   */
  static async getUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
      },
    })
  }
}
