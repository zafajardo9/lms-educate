import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { APIError } from 'better-auth/api'

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { UserRole } from '@/types'

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const data = signInSchema.parse(payload)

    const { headers: authHeaders, response } = await auth.api.signInEmail({
      body: {
        email: data.email,
        password: data.password,
      },
      headers: request.headers,
      returnHeaders: true,
    })

    const roleFromAuth = ((response.user as Record<string, any>).role as UserRole) ?? UserRole.STUDENT
    const isActiveFromAuth = ((response.user as Record<string, any>).isActive as boolean | undefined) ?? true

    let user = await prisma.user.findUnique({
      where: { id: response.user.id },
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

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name ?? data.email,
          role: roleFromAuth,
          isActive: isActiveFromAuth,
        },
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

    const nextResponse = NextResponse.json(
      {
        success: true,
        data: {
          user,
          message: 'Sign in successful',
        },
      },
      { status: 200 }
    )

    authHeaders.forEach((value, key) => {
      nextResponse.headers.append(key, value)
    })

    return nextResponse
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
      const status = error.status ?? 401
      return NextResponse.json(
        {
          success: false,
          error: {
            code: (error as APIError).code ?? 'AUTH_ERROR',
            message: error.message ?? 'Failed to sign in',
          },
        },
        { status }
      )
    }

    console.error('Sign-in error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to sign in. Please try again.',
        },
      },
      { status: 500 }
    )
  }
}

