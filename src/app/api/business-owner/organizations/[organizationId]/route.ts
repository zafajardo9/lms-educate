import { NextRequest } from "next/server";

import {
  deleteOrganization,
  getOrganizationById,
  updateOrganization,
} from "@/lib/actions/api/organizations";
import { handleErrorResponse, jsonSuccess } from "@/lib/actions/api/response";
import { requireRole } from "@/lib/actions/api/session";
import { UserRole } from "@/types";

type RouteContext = {
  params: {
    organizationId: string;
  };
};

// GET /api/business-owner/organizations/:organizationId - Fetch single organization
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const sessionUser = await requireRole(request, UserRole.BUSINESS_OWNER);
    const organization = await getOrganizationById(sessionUser, params.organizationId);

    return jsonSuccess({
      success: true,
      data: { organization },
    });
  } catch (error) {
    return handleErrorResponse(error, "Failed to fetch organization");
  }
}

// PUT /api/business-owner/organizations/:organizationId - Update organization
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const sessionUser = await requireRole(request, UserRole.BUSINESS_OWNER);
    const payload = await request.json();
    const organization = await updateOrganization(
      sessionUser,
      params.organizationId,
      payload
    );

    return jsonSuccess({
      success: true,
      data: { organization },
      message: "Organization updated successfully",
    });
  } catch (error) {
    return handleErrorResponse(error, "Failed to update organization");
  }
}

// DELETE /api/business-owner/organizations/:organizationId - Remove organization
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const sessionUser = await requireRole(request, UserRole.BUSINESS_OWNER);
    await deleteOrganization(sessionUser, params.organizationId);

    return jsonSuccess({
      success: true,
      message: "Organization deleted successfully",
    });
  } catch (error) {
    return handleErrorResponse(error, "Failed to delete organization");
  }
}
