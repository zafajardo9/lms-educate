import { NextResponse } from 'next/server'

import { ServiceError } from './errors'

export interface ApiSuccess<T = any> {
  success: true
  data?: T
  message?: string
  pagination?: any
}

export interface ApiErrorBody {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export function jsonSuccess<T>(body: ApiSuccess<T>, init?: ResponseInit) {
  return NextResponse.json(body, init)
}

export function handleErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof ServiceError) {
    return NextResponse.json<ApiErrorBody>(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.status }
    )
  }

  console.error('API Error:', error)
  return NextResponse.json<ApiErrorBody>(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: fallbackMessage,
      },
    },
    { status: 500 }
  )
}
