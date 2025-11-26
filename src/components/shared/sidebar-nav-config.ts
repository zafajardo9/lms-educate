import type React from "react";
import {
  BookOpen,
  LayoutDashboard,
  Settings,
  Users,
  BarChart3,
  Calendar,
  MessageSquare,
  Award,
  HelpCircle,
} from "lucide-react";
import { UserRole } from "@/types";

export interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  badge?: string | number;
  children?: { label: string; href: string; badge?: string | number }[];
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.BUSINESS_OWNER]: "Business Owner",
  [UserRole.LECTURER]: "Lecturer",
  [UserRole.STUDENT]: "Student",
};

export const ROLE_NAV: Record<UserRole, NavSection[]> = {
  [UserRole.BUSINESS_OWNER]: [
    {
      label: "Overview",
      items: [
        {
          label: "Dashboard",
          icon: LayoutDashboard,
          href: "/business-owner/dashboard",
        },
        {
          label: "Calendar",
          icon: Calendar,
          href: "/business-owner/calendar",
        },
      ],
    },
    {
      label: "Course Ops",
      items: [
        {
          label: "Courses",
          icon: BookOpen,
          children: [
            {
              label: "All Courses",
              href: "/business-owner/courses",
            },

          ],
        },
        {
          label: "Certificates",
          icon: Award,
          href: "/business-owner/certificates",
        },
      ],
    },
    {
      label: "Administration",
      items: [
        {
          label: "Users",
          icon: Users,
          href: "/business-owner/users",
        },
        {
          label: "Analytics",
          icon: BarChart3,
          href: "/business-owner/analytics",
        },
      ],
    },
  ],
  [UserRole.LECTURER]: [
    {
      label: "Overview",
      items: [
        {
          label: "Dashboard",
          icon: LayoutDashboard,
          href: "/lecturer/dashboard",
        },
      ],
    },
    {
      label: "Teaching",
      items: [
        {
          label: "Courses",
          icon: BookOpen,
          children: [
            { label: "My Courses", href: "/lecturer/dashboard/courses" },
            {
              label: "Create Course",
              href: "/lecturer/dashboard/courses/create",
            },
          ],
        },
        {
          label: "Messages",
          icon: MessageSquare,
          href: "/lecturer/dashboard",
        },
      ],
    },
  ],
  [UserRole.STUDENT]: [
    {
      label: "Overview",
      items: [
        {
          label: "Dashboard",
          icon: LayoutDashboard,
          href: "/student/dashboard",
        },
      ],
    },
    {
      label: "Learning",
      items: [
        {
          label: "My Courses",
          icon: BookOpen,
          children: [
            { label: "All Courses", href: "/student/dashboard/courses" },
          ],
        },
        {
          label: "Calendar",
          icon: Calendar,
          href: "/student/dashboard",
        },
      ],
    },
  ],
};

export const bottomNavItems: NavItem[] = [
  { label: "Settings", icon: Settings, href: "/settings" },
  { label: "Help Center", icon: HelpCircle, href: "/help" },
];
