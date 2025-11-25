"use client";

import type React from "react";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Users,
  BarChart3,
  Calendar,
  MessageSquare,
  FileText,
  Award,
  ChevronDown,
  ChevronRight,
  Search,
  Bell,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/auth-client";
import { UserRole } from "@/types";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  badge?: string | number;
  children?: { label: string; href: string; badge?: string | number }[];
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.BUSINESS_OWNER]: "Business Owner",
  [UserRole.LECTURER]: "Lecturer",
  [UserRole.STUDENT]: "Student",
};

const ROLE_NAV: Record<UserRole, NavSection[]> = {
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
          href: "/business-owner/dashboard",
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
              href: "/business-owner/dashboard/courses",
            },
            {
              label: "Create Course",
              href: "/business-owner/dashboard/courses/create",
            },
          ],
        },
        {
          label: "Certificates",
          icon: Award,
          href: "/business-owner/dashboard",
        },
      ],
    },
    {
      label: "Administration",
      items: [
        {
          label: "Users",
          icon: Users,
          href: "/business-owner/dashboard/users",
        },
        {
          label: "Analytics",
          icon: BarChart3,
          href: "/business-owner/dashboard",
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

const bottomNavItems: NavItem[] = [
  { label: "Settings", icon: Settings, href: "/settings" },
  { label: "Help Center", icon: HelpCircle, href: "/help" },
];

const isKnownRole = (value: string): value is UserRole => {
  return (Object.values(UserRole) as string[]).includes(value);
};

const isLinkActive = (href: string | undefined, pathname: string) => {
  if (!href) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
};

export function LMSSidebar() {
  const { data: session, isPending } = useSession();
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const role = useMemo(() => {
    const rawRole = session?.user?.role;
    if (rawRole && isKnownRole(rawRole)) {
      return rawRole;
    }
    return undefined;
  }, [session?.user?.role]);

  const sections = role ? ROLE_NAV[role] : undefined;
  const activeSections = sections ?? ROLE_NAV[UserRole.STUDENT];

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const userName = session?.user?.name || session?.user?.email || "User";
  const userInitials = userName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const headerSubtitle = role ? ROLE_LABELS[role] : "Loading profile";

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <GraduationCap className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-sidebar-foreground">
            LearnHub
          </h1>
          <p className="text-xs text-muted-foreground">Learning Platform</p>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="h-9 border-0 bg-secondary pl-9 text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3">
        {isPending && (
          <div className="space-y-3 px-2">
            {[...Array(6)].map((_, index) => (
              <Skeleton
                key={`sidebar-skeleton-${index}`}
                className="h-9 w-full"
              />
            ))}
          </div>
        )}

        {!isPending && (
          <div className="space-y-6">
            {activeSections.map((section) => (
              <div key={section.label} className="space-y-1">
                <p className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {section.label}
                </p>
                {section.items.map((item) => {
                  const childActive = item.children?.some((child) =>
                    isLinkActive(child.href, pathname)
                  );
                  const itemActive =
                    isLinkActive(item.href, pathname) || Boolean(childActive);
                  const shouldExpand =
                    childActive || expandedItems.includes(item.label);

                  return (
                    <NavItemComponent
                      key={item.label}
                      item={item}
                      pathname={pathname}
                      isExpanded={shouldExpand}
                      isActive={itemActive}
                      onToggle={() => toggleExpand(item.label)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-3">
        {bottomNavItems.map((item) => (
          <NavItemComponent
            key={item.label}
            item={item}
            pathname={pathname}
            isExpanded={false}
            isActive={isLinkActive(item.href, pathname)}
            onToggle={() => {}}
          />
        ))}
      </div>

      <div className="border-t border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-sidebar-accent">
              <Avatar className="h-9 w-9">
                <AvatarImage src="/professional-avatar.png" />
                <AvatarFallback className="bg-primary text-sm text-primary-foreground">
                  {userInitials || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-sidebar-foreground">
                  {userName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {headerSubtitle}
                </p>
              </div>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}

function NavItemComponent({
  item,
  pathname,
  isExpanded,
  isActive,
  onToggle,
}: {
  item: NavItem;
  pathname: string;
  isExpanded: boolean;
  isActive: boolean;
  onToggle: () => void;
}) {
  const hasChildren = item.children && item.children.length > 0;
  const Icon = item.icon;

  const itemClasses = cn(
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
    isActive && !hasChildren
      ? "bg-sidebar-accent text-sidebar-foreground"
      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
  );

  return (
    <div>
      {hasChildren ? (
        <button onClick={onToggle} className={itemClasses}>
          <Icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          {item.badge && (
            <Badge
              variant="secondary"
              className="h-5 min-w-5 justify-center bg-primary/20 text-xs text-primary"
            >
              {item.badge}
            </Badge>
          )}
          <span className="text-muted-foreground">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
        </button>
      ) : (
        <Link href={item.href ?? "#"} className={itemClasses}>
          <Icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          {item.badge && (
            <Badge
              variant="secondary"
              className="h-5 min-w-5 justify-center bg-primary/20 text-xs text-primary"
            >
              {item.badge}
            </Badge>
          )}
        </Link>
      )}

      {hasChildren && isExpanded && (
        <div className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-4">
          {item.children?.map((child) => {
            const childActive = isLinkActive(child.href, pathname);
            return (
              <Link
                key={child.label}
                href={child.href}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors",
                  childActive
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <span className="flex-1 text-left">{child.label}</span>
                {child.badge && (
                  <Badge
                    variant="secondary"
                    className="h-5 min-w-5 justify-center bg-primary/20 text-xs text-primary"
                  >
                    {child.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
