import type { ComponentType } from 'react'
import { BackpackIcon, BookmarkIcon, PersonIcon } from '@radix-ui/react-icons'
import { UserRole } from '@/types'

type RoleIcon = ComponentType<{ className?: string }>

export type RoleOption = {
  label: string
  description: string
  role: UserRole
  icon: RoleIcon
  demo?: {
    email: string
    password: string
  }
}

export const ROLE_OPTIONS: RoleOption[] = [
  {
    label: 'Business Owner',
    description: 'Full platform access, manage organizations, billing, and staff.',
    role: UserRole.BUSINESS_OWNER,
    icon: BackpackIcon,
    demo: { email: 'admin@lms.com', password: 'admin123' },
  },
  {
    label: 'Lecturer',
    description: 'Create courses, grade learners, and collaborate with reviewers.',
    role: UserRole.LECTURER,
    icon: BookmarkIcon,
    demo: { email: 'lecturer@lms.com', password: 'lecturer123' },
  },
  {
    label: 'Student',
    description: 'Enroll in courses, take quizzes, and monitor your progress.',
    role: UserRole.STUDENT,
    icon: PersonIcon,
    demo: { email: 'student@lms.com', password: 'student123' },
  },
]
