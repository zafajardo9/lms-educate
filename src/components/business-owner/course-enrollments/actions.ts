"use server";

import { cookies, headers } from "next/headers";
import type { EnrollmentsResponse, GetEnrollmentsParams } from "./types";

async function getBaseUrl() {
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    return `${protocol}://${host}`;
}

async function getAuthHeaders() {
    const cookieStore = await cookies();
    return { "Content-Type": "application/json", Cookie: cookieStore.toString() };
}

export async function getEnrollments(
    courseId: string,
    params: GetEnrollmentsParams = {}
): Promise<EnrollmentsResponse> {
    const baseUrl = await getBaseUrl();
    const authHeaders = await getAuthHeaders();

    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.limit) searchParams.set("limit", params.limit.toString());
    if (params.search) searchParams.set("search", params.search);
    if (params.cohortId) searchParams.set("cohortId", params.cohortId);
    if (params.groupId) searchParams.set("groupId", params.groupId);
    if (params.status) searchParams.set("status", params.status);
    if (params.startDate) searchParams.set("startDate", params.startDate);
    if (params.endDate) searchParams.set("endDate", params.endDate);

    const response = await fetch(
        `${baseUrl}/api/business-owner/courses/${courseId}/enrollments?${searchParams.toString()}`,
        {
            headers: authHeaders,
            cache: "no-store",
        }
    );

    if (!response.ok) {
        throw new Error("Failed to fetch enrollments");
    }

    const result = await response.json();
    return result.data;
}

export async function getAvailableStudents() {
    const baseUrl = await getBaseUrl();
    const authHeaders = await getAuthHeaders();

    const response = await fetch(
        `${baseUrl}/api/business-owner/users?role=STUDENT&limit=100`,
        {
            headers: authHeaders,
            cache: "no-store",
        }
    );

    if (!response.ok) return [];

    const result = await response.json();
    return result.data?.users || [];
}

export async function getCourseCohorts(courseId: string) {
    const baseUrl = await getBaseUrl();
    const authHeaders = await getAuthHeaders();

    const response = await fetch(
        `${baseUrl}/api/business-owner/courses/${courseId}/cohorts`,
        {
            headers: authHeaders,
            cache: "no-store",
        }
    );

    if (!response.ok) return [];

    const result = await response.json();
    return result.data?.cohorts || [];
}

export async function getCourseGroups(courseId: string) {
    const baseUrl = await getBaseUrl();
    const authHeaders = await getAuthHeaders();

    const response = await fetch(
        `${baseUrl}/api/business-owner/courses/${courseId}/groups`,
        {
            headers: authHeaders,
            cache: "no-store",
        }
    );

    if (!response.ok) return [];

    const result = await response.json();
    return result.data?.groups || [];
}
