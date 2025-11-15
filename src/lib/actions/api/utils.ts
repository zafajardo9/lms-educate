import { PaginationMetadata } from './types'

export function buildPagination(page: number, limit: number, total: number): PaginationMetadata {
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  }
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}
