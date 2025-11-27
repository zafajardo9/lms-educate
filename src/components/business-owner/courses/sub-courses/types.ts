export interface LessonSummary {
    id: string
    title: string
    order: number
    isPublished: boolean
    duration?: number | null
}

export interface QuizSummary {
    id: string
    title: string
    description?: string | null
    order: number
    isPublished: boolean
    _count?: {
        questions: number
    }
}

export interface SubCourse {
    id: string
    title: string
    description: string
    order: number
    isPublished: boolean
    courseId: string
    lessons?: LessonSummary[]
    quizzes?: QuizSummary[]
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
