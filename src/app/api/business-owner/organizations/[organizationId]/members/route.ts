import { NextRequest } from "next/server";

import {
  addOrganizationMember,
  listOrganizationMembers,
} from "@/lib/actions/api/organizations";
import { handleErrorResponse, jsonSuccess } from "@/lib/actions/api/response";
import { requireRole } from "@/lib/actions/api/session";
import { UserRole } from "@/types";

interface RouteContext {
  params: Promise<{
    organizationId: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const sessionUser = await requireRole(request, UserRole.BUSINESS_OWNER);
    const { organizationId } = await context.params;
    const searchParams = new URL(request.url).searchParams;

    const { memberships, pagination } = await listOrganizationMembers(
      sessionUser,
      organizationId,
      searchParams
    );

    return jsonSuccess({
      success: true,
      data: { members: memberships },
      pagination,
    });
  } catch (error) {
    return handleErrorResponse(error, "Failed to fetch organization members");
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const sessionUser = await requireRole(request, UserRole.BUSINESS_OWNER);
    const { organizationId } = await context.params;
    const payload = await request.json();

    const member = await addOrganizationMember(sessionUser, organizationId, payload);

    return jsonSuccess({
      success: true,
      data: { member },
      message: "Member added successfully",
    });
  } catch (error) {
    return handleErrorResponse(error, "Failed to add organization member");
  }
}
