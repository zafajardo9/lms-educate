import mongoose, { Schema, Document } from 'mongoose'
import {
  Organization as IOrganization,
  OrganizationMembership as IOrganizationMembership,
  OrganizationPlan,
  OrganizationStatus,
  OrganizationRole,
  InvitationStatus,
} from '@/types'

const ORGANIZATION_PLAN_VALUES = [
  OrganizationPlan.FREE,
  OrganizationPlan.PRO,
  OrganizationPlan.GROWTH,
  OrganizationPlan.ENTERPRISE,
]

const ORGANIZATION_STATUS_VALUES = [
  OrganizationStatus.ACTIVE,
  OrganizationStatus.PAUSED,
  OrganizationStatus.SUSPENDED,
]

const ORGANIZATION_ROLE_VALUES = [
  OrganizationRole.OWNER,
  OrganizationRole.ADMIN,
  OrganizationRole.INSTRUCTOR,
  OrganizationRole.REVIEWER,
  OrganizationRole.LEARNER,
]

const INVITATION_STATUS_VALUES = [
  InvitationStatus.PENDING,
  InvitationStatus.ACCEPTED,
  InvitationStatus.DECLINED,
  InvitationStatus.EXPIRED,
]

const organizationSchema = new Schema<IOrganization & Document>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  description: {
    type: String,
    maxlength: 2000,
  },
  logoUrl: {
    type: String,
  },
  primaryColor: {
    type: String,
  },
  secondaryColor: {
    type: String,
  },
  timezone: {
    type: String,
    default: 'UTC',
  },
  locale: {
    type: String,
    default: 'en',
  },
  plan: {
    type: String,
    enum: ORGANIZATION_PLAN_VALUES,
    default: OrganizationPlan.FREE,
  },
  status: {
    type: String,
    enum: ORGANIZATION_STATUS_VALUES,
    default: OrganizationStatus.ACTIVE,
  },
  ownerId: {
    type: String,
    required: true,
  },
  metadata: Schema.Types.Mixed,
}, {
  timestamps: true,
})

organizationSchema.index({ slug: 1 }, { unique: true })
organizationSchema.index({ ownerId: 1 })
organizationSchema.index({ plan: 1 })
organizationSchema.index({ status: 1 })

const organizationMembershipSchema = new Schema<IOrganizationMembership & Document>({
  organizationId: {
    type: String,
    required: true,
    index: true,
    ref: 'Organization',
  },
  userId: {
    type: String,
    ref: 'User',
  },
  role: {
    type: String,
    enum: ORGANIZATION_ROLE_VALUES,
    default: OrganizationRole.LEARNER,
  },
  invitationEmail: {
    type: String,
    lowercase: true,
    trim: true,
  },
  invitationStatus: {
    type: String,
    enum: INVITATION_STATUS_VALUES,
    default: InvitationStatus.PENDING,
  },
  invitedById: {
    type: String,
  },
  joinedAt: {
    type: Date,
  },
  metadata: Schema.Types.Mixed,
}, {
  timestamps: true,
})

organizationMembershipSchema.index({ organizationId: 1, userId: 1 }, { unique: true, sparse: true })
organizationMembershipSchema.index({ organizationId: 1, invitationEmail: 1 })

export const Organization = mongoose.models.Organization || mongoose.model('Organization', organizationSchema)
export const OrganizationMembership = mongoose.models.OrganizationMembership || mongoose.model('OrganizationMembership', organizationMembershipSchema)
