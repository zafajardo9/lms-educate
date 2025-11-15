import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { APIError } from 'better-auth/api'

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { UserRole } from '@/types'

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: 'Invalid role. Must be BUSINESS_OWNER, LECTURER, or STUDENT' }),
  }),
})

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const data = signUpSchema.parse(payload)

    const result = await auth.api.signUpEmail({
      body: {
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role,
      },
      headers: request.headers,
    })

    let user = await prisma.user.findUnique({
      where: { id: result.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name || data.name,
          role: data.role,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    }

    await prisma.userProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          user,
          message: 'Account created successfully. Please sign in.',
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        },
        { status: 400 }
      )
    }

    if (error instanceof APIError) {
      const status = error.status ?? 400
      return NextResponse.json(
        {
          success: false,
          error: {
            code: (error as APIError).code ?? 'AUTH_ERROR',
            message: error.message ?? 'Failed to create account',
          },
        },
        { status }
      )
    }

    console.error('Sign-up error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create account. Please try again.',
        },
      },
      { status: 500 }
    )
  }
}

