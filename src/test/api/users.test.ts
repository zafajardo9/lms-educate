import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/business-owner/users/route'
import { GET as getUserById, PUT as updateUser, DELETE as deleteUser } from '@/app/api/business-owner/users/[id]/route'
import { GET as getProfile, PUT as updateProfile } from '@/app/api/business-owner/users/[id]/profile/route'
import { User, UserProfile } from '@/lib/models/User'
import { UserRole } from '@/types'
import connectDB from '@/lib/mongodb'

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}))

// Mock the database connection
vi.mock('@/lib/mongodb', () => ({
  default: vi.fn(),
}))

// Mock the User and UserProfile models
vi.mock('@/lib/models/User', () => ({
  User: {
    find: vi.fn(),
    findById: vi.fn(),
    findOne: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
    create: vi.fn(),
    countDocuments: vi.fn(),
  },
  UserProfile: {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}))

const mockAuth = vi.mocked(await import('@/lib/auth')).auth
const mockConnectDB = vi.mocked(connectDB)
const mockUser = vi.mocked(User)
const mockUserProfile = vi.mocked(UserProfile)

describe('User Management API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConnectDB.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('GET /api/users', () => {
    it('should return users list for business owner', async () => {
      // Mock business owner session
      mockAuth.api.getSession.mockResolvedValue({
        user: { id: '1', role: UserRole.BUSINESS_OWNER }
      })

      // Mock database responses
      mockUser.countDocuments.mockResolvedValue(2)
      mockUser.find.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([
          {
            _id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            role: UserRole.STUDENT,
            isActive: true,
            createdAt: new Date(),
          },
          {
            _id: '2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            role: UserRole.LECTURER,
            isActive: true,
            createdAt: new Date(),
          },
        ]),
      })

      const request = new NextRequest('http://localhost:3000/api/users?page=1&limit=10')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.users).toHaveLength(2)
      expect(data.data.pagination.total).toBe(2)
    })

    it('should deny access for non-business owner', async () => {
      mockAuth.api.getSession.mockResolvedValue({
        user: { id: '1', role: UserRole.STUDENT }
      })

      const request = new NextRequest('http://localhost:3000/api/users')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('FORBIDDEN')
    })

    it('should deny access for unauthenticated user', async () => {
      mockAuth.api.getSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/users')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('POST /api/users', () => {
    it('should create a new user for business owner', async () => {
      mockAuth.api.getSession.mockResolvedValue({
        user: { id: '1', role: UserRole.BUSINESS_OWNER }
      })

      mockUser.findOne.mockResolvedValue(null) // No existing user
      mockUser.create.mockResolvedValue({
        _id: '2',
        name: 'New User',
        email: 'newuser@example.com',
        role: UserRole.STUDENT,
        isActive: true,
        toJSON: () => ({
          id: '2',
          name: 'New User',
          email: 'newuser@example.com',
          role: UserRole.STUDENT,
          isActive: true,
        }),
      })

      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        role: UserRole.STUDENT,
      }

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        body: JSON.stringify(userData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.user.email).toBe('newuser@example.com')
    })

    it('should reject duplicate email', async () => {
      mockAuth.api.getSession.mockResolvedValue({
        user: { id: '1', role: UserRole.BUSINESS_OWNER }
      })

      mockUser.findOne.mockResolvedValue({ email: 'existing@example.com' })

      const userData = {
        name: 'New User',
        email: 'existing@example.com',
        password: 'password123',
        role: UserRole.STUDENT,
      }

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        body: JSON.stringify(userData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('USER_EXISTS')
    })

    it('should validate required fields', async () => {
      mockAuth.api.getSession.mockResolvedValue({
        user: { id: '1', role: UserRole.BUSINESS_OWNER }
      })

      const invalidData = {
        name: '',
        email: 'invalid-email',
        password: '123', // Too short
      }

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('GET /api/users/[id]', () => {
    it('should return user for business owner', async () => {
      mockAuth.api.getSession.mockResolvedValue({
        user: { id: '1', role: UserRole.BUSINESS_OWNER }
      })

      mockUser.findById.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue({
          _id: '2',
          name: 'John Doe',
          email: 'john@example.com',
          role: UserRole.STUDENT,
          isActive: true,
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/users/2')
      const response = await getUserById(request, { params: { id: '2' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.user.email).toBe('john@example.com')
    })

    it('should allow user to access their own data', async () => {
      mockAuth.api.getSession.mockResolvedValue({
        user: { id: '2', role: UserRole.STUDENT }
      })

      mockUser.findById.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue({
          _id: '2',
          name: 'John Doe',
          email: 'john@example.com',
          role: UserRole.STUDENT,
          isActive: true,
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/users/2')
      const response = await getUserById(request, { params: { id: '2' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should deny access to other users data', async () => {
      mockAuth.api.getSession.mockResolvedValue({
        user: { id: '1', role: UserRole.STUDENT }
      })

      const request = new NextRequest('http://localhost:3000/api/users/2')
      const response = await getUserById(request, { params: { id: '2' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('FORBIDDEN')
    })
  })

  describe('PUT /api/users/[id]', () => {
    it('should update user for business owner', async () => {
      mockAuth.api.getSession.mockResolvedValue({
        user: { id: '1', role: UserRole.BUSINESS_OWNER }
      })

      mockUser.findByIdAndUpdate.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          _id: '2',
          name: 'Updated Name',
          email: 'john@example.com',
          role: UserRole.LECTURER,
          isActive: true,
        }),
      })

      const updateData = {
        name: 'Updated Name',
        role: UserRole.LECTURER,
      }

      const request = new NextRequest('http://localhost:3000/api/users/2', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await updateUser(request, { params: { id: '2' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.user.name).toBe('Updated Name')
    })

    it('should prevent non-business owner from changing roles', async () => {
      mockAuth.api.getSession.mockResolvedValue({
        user: { id: '2', role: UserRole.STUDENT }
      })

      const updateData = {
        name: 'Updated Name',
        role: UserRole.LECTURER,
      }

      const request = new NextRequest('http://localhost:3000/api/users/2', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await updateUser(request, { params: { id: '2' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error.message).toContain('Only business owners can change user roles')
    })
  })

  describe('DELETE /api/users/[id]', () => {
    it('should delete user for business owner', async () => {
      mockAuth.api.getSession.mockResolvedValue({
        user: { id: '1', role: UserRole.BUSINESS_OWNER }
      })

      mockUser.findByIdAndDelete.mockResolvedValue({
        _id: '2',
        name: 'John Doe',
        email: 'john@example.com',
      })

      const request = new NextRequest('http://localhost:3000/api/users/2')
      const response = await deleteUser(request, { params: { id: '2' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('User deleted successfully')
    })

    it('should deny delete access for non-business owner', async () => {
      mockAuth.api.getSession.mockResolvedValue({
        user: { id: '2', role: UserRole.STUDENT }
      })

      const request = new NextRequest('http://localhost:3000/api/users/2')
      const response = await deleteUser(request, { params: { id: '2' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('FORBIDDEN')
    })
  })

  describe('Profile Management', () => {
    describe('GET /api/users/[id]/profile', () => {
      it('should return user profile', async () => {
        mockAuth.api.getSession.mockResolvedValue({
          user: { id: '2', role: UserRole.STUDENT }
        })

        mockUserProfile.findOne.mockReturnValue({
          lean: vi.fn().mockResolvedValue({
            userId: '2',
            bio: 'Test bio',
            phone: '123-456-7890',
          }),
        })

        const request = new NextRequest('http://localhost:3000/api/users/2/profile')
        const response = await getProfile(request, { params: { id: '2' } })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data.profile.bio).toBe('Test bio')
      })
    })

    describe('PUT /api/users/[id]/profile', () => {
      it('should update user profile', async () => {
        mockAuth.api.getSession.mockResolvedValue({
          user: { id: '2', role: UserRole.STUDENT }
        })

        mockUserProfile.findOneAndUpdate.mockReturnValue({
          lean: vi.fn().mockResolvedValue({
            userId: '2',
            bio: 'Updated bio',
            phone: '123-456-7890',
          }),
        })

        const profileData = {
          bio: 'Updated bio',
          phone: '123-456-7890',
        }

        const request = new NextRequest('http://localhost:3000/api/users/2/profile', {
          method: 'PUT',
          body: JSON.stringify(profileData),
          headers: { 'Content-Type': 'application/json' },
        })

        const response = await updateProfile(request, { params: { id: '2' } })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data.profile.bio).toBe('Updated bio')
      })
    })
  })
})