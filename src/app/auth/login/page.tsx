'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { signIn } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, GraduationCap } from 'lucide-react'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

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
        router.push('/dashboard')
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
              Enter your credentials to access the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Demo Accounts Info */}
            <Card className="mb-6 bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-blue-900">Demo Accounts</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <div className="grid gap-2 text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start h-auto p-2 text-blue-700 hover:bg-blue-100"
                    onClick={() => fillDemoCredentials('admin@lms.com', 'admin123')}
                  >
                    <span className="mr-2">👑</span>
                    <div className="text-left">
                      <div className="font-medium">Business Owner</div>
                      <div className="text-xs opacity-70">admin@lms.com / admin123</div>
                    </div>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start h-auto p-2 text-blue-700 hover:bg-blue-100"
                    onClick={() => fillDemoCredentials('lecturer@lms.com', 'lecturer123')}
                  >
                    <span className="mr-2">👨‍🏫</span>
                    <div className="text-left">
                      <div className="font-medium">Lecturer</div>
                      <div className="text-xs opacity-70">lecturer@lms.com / lecturer123</div>
                    </div>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start h-auto p-2 text-blue-700 hover:bg-blue-100"
                    onClick={() => fillDemoCredentials('student@lms.com', 'student123')}
                  >
                    <span className="mr-2">👨‍🎓</span>
                    <div className="text-left">
                      <div className="font-medium">Student</div>
                      <div className="text-xs opacity-70">student@lms.com / student123</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
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
                  placeholder="Enter your email"
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}