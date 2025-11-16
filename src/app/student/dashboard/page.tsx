'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useSession } from '@/lib/auth-client'
import { UserRole } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Award, Clock, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function StudentDashboard() {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/auth/login')
      return
    }
    if (session?.user?.role && session.user.role !== UserRole.STUDENT) {
      const role = session.user.role.toLowerCase().replace(/_/g, '-')
      console.log('[Student Dashboard] Redirecting to:', `/${role}/dashboard`)
      router.push(`/${role}/dashboard`)
    }
  }, [session, isPending, router])

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session || session.user.role !== UserRole.STUDENT) {
    return null
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {session.user.name}! Continue your learning journey.
          </p>
        </div>
        <Link href="/student/dashboard/courses">
          <Button>
            <BookOpen className="mr-2 h-4 w-4" />
            Browse Courses
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">3 in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Certificates earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42h</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <p className="text-xs text-muted-foreground">Average completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Continue Learning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Introduction to React</h3>
                <div className="w-full bg-secondary rounded-full h-2 mb-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>65% complete</span>
                  <span>Lesson 13 of 20</span>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Advanced TypeScript</h3>
                <div className="w-full bg-secondary rounded-full h-2 mb-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '30%' }}></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>30% complete</span>
                  <span>Lesson 6 of 20</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5" />
                <div>
                  <p className="font-medium">React Quiz Due</p>
                  <p className="text-xs text-muted-foreground">Tomorrow at 11:59 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5" />
                <div>
                  <p className="font-medium">TypeScript Assignment</p>
                  <p className="text-xs text-muted-foreground">In 3 days</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                <div>
                  <p className="font-medium">Final Project</p>
                  <p className="text-xs text-muted-foreground">In 2 weeks</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Browse Courses CTA */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg mb-1">Explore More Courses</h3>
              <p className="text-sm text-muted-foreground">
                Discover new skills and expand your knowledge
              </p>
            </div>
            <Link href="/student/dashboard/courses">
              <Button>Browse Courses</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
