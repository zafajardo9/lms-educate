'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import { deleteSubCourse } from './actions'
import type { SubCourse } from './types'

interface SubCourseDeleteModalProps {
    courseId: string
    subCourse: SubCourse
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function SubCourseDeleteModal({
    courseId,
    subCourse,
    open,
    onOpenChange,
}: SubCourseDeleteModalProps) {
    const [isPending, setIsPending] = useState(false)

    async function onDelete() {
        setIsPending(true)
        try {
            const result = await deleteSubCourse(courseId, subCourse.id)
            if (result.success) {
                toast.success('Module deleted successfully')
                onOpenChange(false)
            } else {
                toast.error(result.error || 'Failed to delete module')
            }
        } catch (error) {
            toast.error('Something went wrong')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the module
                        "{subCourse.title}" and remove all its lessons and quizzes.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            onDelete()
                        }}
                        disabled={isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
