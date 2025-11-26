'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PageLayout, PageSection } from '@/components/shared/page-layout'
import { SubCourseList } from './sub-courses/sub-course-list'
import type { SubCourse } from './sub-courses/types'

interface CourseDetailsClientProps {
    course: {
        id: string
        title: string
        description: string | null
        isPublished: boolean
    }
    subCourses: SubCourse[]
}

export function CourseDetailsClient({ course, subCourses }: CourseDetailsClientProps) {
    return (
        <PageLayout
            title={course.title}
            description={course.description || 'Manage your course content'}
            actions={
                <Button variant="outline" asChild>
                    <Link href="/business-owner/dashboard/courses">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Courses
                    </Link>
                </Button>
            }
        >
            <PageSection>
                <SubCourseList courseId={course.id} subCourses={subCourses} />
            </PageSection>
        </PageLayout>
    )
}
