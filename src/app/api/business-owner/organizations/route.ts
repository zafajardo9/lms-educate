import { NextRequest } from "next/server";

import { handleErrorResponse, jsonSuccess } from "@/lib/actions/api/response";
import { requireRole } from "@/lib/actions/api/session";
import {
  listOrganizations,
  createOrganization,
} from "@/lib/actions/api/organizations";
import { UserRole } from "@/types";

// GET /api/business-owner/organizations - List organizations for business owner
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await requireRole(request, UserRole.BUSINESS_OWNER);
    const searchParams = new URL(request.url).searchParams;
    const { organizations, pagination } = await listOrganizations(
      sessionUser,
      searchParams
    );

    return jsonSuccess({
      success: true,
      data: { organizations },
      pagination,
    });
  } catch (error) {
    return handleErrorResponse(error, "Failed to fetch organizations");
  }
}

// POST /api/business-owner/organizations - Create a new organization
export async function POST(request: NextRequest) {
  try {
    const sessionUser = await requireRole(request, UserRole.BUSINESS_OWNER);
    const payload = await request.json();
    const organization = await createOrganization(sessionUser, payload);

    return jsonSuccess(
      {
        success: true,
        data: { organization },
        message: "Organization created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleErrorResponse(error, "Failed to create organization");
  }
}
