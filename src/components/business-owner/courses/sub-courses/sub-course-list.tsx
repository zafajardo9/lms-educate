'use client'

import { useState } from 'react'
import { MoreVertical, Pencil, Trash } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { SubCourseCreateModal } from './sub-course-create-modal'
import { SubCourseEditModal } from './sub-course-edit-modal'
import { SubCourseDeleteModal } from './sub-course-delete-modal'
import type { SubCourse } from './types'

interface SubCourseListProps {
    courseId: string
    subCourses: SubCourse[]
}

export function SubCourseList({ courseId, subCourses }: SubCourseListProps) {
    const [editingSubCourse, setEditingSubCourse] = useState<SubCourse | null>(null)
    const [deletingSubCourse, setDeletingSubCourse] = useState<SubCourse | null>(null)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">Modules</h2>
                <SubCourseCreateModal courseId={courseId} />
            </div>

            {subCourses.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                        <p className="mb-2">No modules yet</p>
                        <p className="text-sm">Create a module to start adding lessons.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {subCourses.map((subCourse) => (
                        <Card key={subCourse.id}>
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <div className="space-y-1">
                                    <CardTitle className="text-base font-medium">
                                        {subCourse.title}
                                    </CardTitle>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Badge variant={subCourse.isPublished ? 'default' : 'secondary'}>
                                            {subCourse.isPublished ? 'Published' : 'Draft'}
                                        </Badge>
                                        <span>•</span>
                                        <span>{subCourse._count?.lessons ?? 0} Lessons</span>
                                        <span>•</span>
                                        <span>{subCourse._count?.quizzes ?? 0} Quizzes</span>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8">
                                            <MoreVertical className="h-4 w-4" />
                                            <span className="sr-only">Open menu</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setEditingSubCourse(subCourse)}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => setDeletingSubCourse(subCourse)}
                                            className="text-destructive focus:text-destructive"
                                        >
                                            <Trash className="mr-2 h-4 w-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {subCourse.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {editingSubCourse && (
                <SubCourseEditModal
                    courseId={courseId}
                    subCourse={editingSubCourse}
                    open={!!editingSubCourse}
                    onOpenChange={(open) => !open && setEditingSubCourse(null)}
                />
            )}

            {deletingSubCourse && (
                <SubCourseDeleteModal
                    courseId={courseId}
                    subCourse={deletingSubCourse}
                    open={!!deletingSubCourse}
                    onOpenChange={(open) => !open && setDeletingSubCourse(null)}
                />
            )}
        </div>
    )
}
