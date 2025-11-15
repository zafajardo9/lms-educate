'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { signIn } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, GraduationCap, Shield, BookOpen, UserRound } from 'lucide-react'
import { UserRole } from '@/types'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.STUDENT)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const roleOptions = useMemo(
    () => ([
      {
        label: 'Business Owner',
        description: 'Full platform access, manage organizations, billing, and staff.',
        role: UserRole.BUSINESS_OWNER,
        icon: Shield,
        demo: { email: 'admin@lms.com', password: 'admin123' },
      },
      {
        label: 'Lecturer',
        description: 'Create courses, grade learners, and collaborate with reviewers.',
        role: UserRole.LECTURER,
        icon: BookOpen,
        demo: { email: 'lecturer@lms.com', password: 'lecturer123' },
      },
      {
        label: 'Student',
        description: 'Enroll in courses, take quizzes, and monitor your progress.',
        role: UserRole.STUDENT,
        icon: UserRound,
        demo: { email: 'student@lms.com', password: 'student123' },
      },
    ]),
    []
  )

  const activeRole = roleOptions.find((option) => option.role === selectedRole) ?? roleOptions[2]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await signIn.email({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        toast.error(error.message || 'Login failed')
      } else {
        toast.success('Login successful!')
        // Redirect based on user role
        const userRole = data?.user?.role as UserRole
        const roleRoute = userRole?.toLowerCase().replace('_', '-')
        router.push(`/${roleRoute}/dashboard`)
      }
    } catch (error) {
      toast.error('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemoCredentials = (email: string, password: string) => {
    setFormData({ email, password })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-gray-900">LMS Platform</h1>
          </div>
        </div>
        <p className="mt-2 text-center text-sm text-gray-600">
          Your Learning Management System
        </p>
      </div>
      
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription>
              Choose your role, then enter your credentials to access the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3">
              {roleOptions.map(({ label, description, role, icon: Icon, demo }) => {
                const isActive = selectedRole === role
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      setSelectedRole(role)
                      fillDemoCredentials(demo.email, demo.password)
                    }}
                    className={`flex w-full items-start rounded-lg border p-4 text-left transition hover:border-primary hover:bg-primary/5 ${
                      isActive ? 'border-primary bg-primary/5 shadow-sm' : 'border-border'
                    }`}
                  >
                    <Icon className={`mr-3 mt-1 h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{label}</span>
                        {isActive && <span className="text-xs rounded-full bg-primary text-primary-foreground px-2 py-0.5">Selected</span>}
                      </div>
                      <p className="text-sm text-muted-foreground">{description}</p>
                      <p className="text-xs text-muted-foreground mt-1">Demo: {demo.email} / {demo.password}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Email address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={`e.g. ${activeRole.demo.email}`}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            {/* Sign Up Link */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link href="/auth/register" className="font-medium text-primary hover:underline">
                Create account
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}