export interface Student {
    id: string;
    name: string;
    email: string;
    profile?: {
        avatar: string | null;
    } | null;
}

export interface Cohort {
    id: string;
    name: string;
}

export interface Group {
    id: string;
    name: string;
    type: string;
}

export interface Enrollment {
    id: string;
    student: Student;
    cohort: Cohort | null;
    groups: Group[];
    progress: number;
    enrolledAt: string | Date;
    completedAt: string | Date | null;
    lastAccessedAt: string | Date | null;
}

export interface EnrollmentsResponse {
    courseId: string;
    courseTitle: string;
    enrollments: Enrollment[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface GetEnrollmentsParams {
    page?: number;
    limit?: number;
    search?: string;
    cohortId?: string;
    groupId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
}
