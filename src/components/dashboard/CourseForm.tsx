'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCourse, updateCourse } from '@/lib/actions/courses'
import { Course, CourseLevel } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import toast from 'react-hot-toast'

interface CourseFormProps {
  course?: Course
  mode: 'create' | 'edit'
}

export default function CourseForm({ course, mode }: CourseFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    
    try {
      let result
      if (mode === 'create') {
        result = await createCourse(formData)
      } else {
        result = await updateCourse(course!.id, formData)
      }

      if (result.success) {
        toast.success(mode === 'create' ? 'Course created successfully!' : 'Course updated successfully!')
        router.push('/dashboard/courses')
        router.refresh()
      } else {
        toast.error(result.error || 'Something went wrong')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Create New Course' : 'Edit Course'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Course Title *
            </label>
            <Input
              id="title"
              name="title"
              type="text"
              required
              maxLength={200}
              defaultValue={course?.title || ''}
              placeholder="Enter course title"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              required
              maxLength={2000}
              rows={4}
              defaultValue={course?.description || ''}
              placeholder="Enter course description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="level" className="text-sm font-medium">
                Level *
              </label>
              <select
                id="level"
                name="level"
                required
                defaultValue={course?.level || CourseLevel.BEGINNER}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={CourseLevel.BEGINNER}>Beginner</option>
                <option value={CourseLevel.INTERMEDIATE}>Intermediate</option>
                <option value={CourseLevel.ADVANCED}>Advanced</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium">
                Category
              </label>
              <Input
                id="category"
                name="category"
                type="text"
                maxLength={100}
                defaultValue={course?.category || ''}
                placeholder="e.g., Programming, Design"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="tags" className="text-sm font-medium">
              Tags
            </label>
            <Input
              id="tags"
              name="tags"
              type="text"
              defaultValue={course?.tags?.join(', ') || ''}
              placeholder="Enter tags separated by commas"
            />
            <p className="text-xs text-gray-500">
              Separate multiple tags with commas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="price" className="text-sm font-medium">
                Price ($)
              </label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                defaultValue={course?.price || ''}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="thumbnail" className="text-sm font-medium">
                Thumbnail URL
              </label>
              <Input
                id="thumbnail"
                name="thumbnail"
                type="url"
                defaultValue={course?.thumbnail || ''}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          {mode === 'edit' && (
            <div className="flex items-center space-x-2">
              <input
                id="isPublished"
                name="isPublished"
                type="checkbox"
                defaultChecked={course?.isPublished || false}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isPublished" className="text-sm font-medium">
                Publish course (make it available to students)
              </label>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting 
                ? (mode === 'create' ? 'Creating...' : 'Updating...') 
                : (mode === 'create' ? 'Create Course' : 'Update Course')
              }
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}