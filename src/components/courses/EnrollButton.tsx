'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { enrollInCourse } from '@/lib/actions/courses'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface EnrollButtonProps {
  courseId: string
}

export default function EnrollButton({ courseId }: EnrollButtonProps) {
  const router = useRouter()
  const [isEnrolling, setIsEnrolling] = useState(false)

  const handleEnroll = async () => {
    setIsEnrolling(true)
    
    try {
      const result = await enrollInCourse(courseId)
      
      if (result.success) {
        toast.success('Successfully enrolled in course!')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to enroll in course')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsEnrolling(false)
    }
  }

  return (
    <Button 
      onClick={handleEnroll}
      disabled={isEnrolling}
    >
      {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
    </Button>
  )
}