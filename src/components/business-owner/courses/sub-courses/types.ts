export interface SubCourse {
    id: string
    title: string
    description: string
    order: number
    isPublished: boolean
    courseId: string
    _count?: {
        lessons: number
        quizzes: number
    }
}

export interface CreateSubCourseInput {
    title: string
    description: string
    isPublished?: boolean
    order?: number
}

export interface UpdateSubCourseInput {
    title?: string
    description?: string
    isPublished?: boolean
    order?: number
}

export interface ReorderSubCourseInput {
    subCourseIds: string[]
}
