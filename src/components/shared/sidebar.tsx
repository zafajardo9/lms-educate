"use client";

import type React from "react";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  ChevronDown,
  ChevronRight,
  Search,
  Bell,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import {
  type NavItem,
  ROLE_LABELS,
  ROLE_NAV,
  bottomNavItems,
} from "./sidebar-nav-config";

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
  const [isCollapsed, setIsCollapsed] = useState(false);

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
    <TooltipProvider delayDuration={0}>
    <aside className={cn(
      "flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className={cn(
        "flex items-center border-b border-sidebar-border py-5 transition-all",
        isCollapsed ? "justify-center px-2" : "px-5"
      )}>
        {!isCollapsed && (
          <>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="ml-3 flex-1 overflow-hidden">
              <h1 className="text-base font-semibold text-sidebar-foreground">
                LearnHub
              </h1>
              <p className="text-xs text-muted-foreground">Learning Platform</p>
            </div>
          </>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              {isCollapsed ? (
                <PanelLeft className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          </TooltipContent>
        </Tooltip>
      </div>

      {!isCollapsed ? (
        <div className="px-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="h-9 border-0 bg-secondary pl-9 text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </div>
      ) : (
        <div className="flex justify-center py-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground">
                <Search className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Search</TooltipContent>
          </Tooltip>
        </div>
      )}

      <nav className={cn("flex-1 overflow-y-auto", isCollapsed ? "px-2" : "px-3")}>
        {isPending && (
          <div className="space-y-3 px-2">
            {[...Array(6)].map((_, index) => (
              <Skeleton
                key={`sidebar-skeleton-${index}`}
                className={cn("h-9", isCollapsed ? "w-9" : "w-full")}
              />
            ))}
          </div>
        )}

        {!isPending && (
          <div className="space-y-6">
            {activeSections.map((section) => (
              <div key={section.label} className="space-y-1">
                {!isCollapsed && (
                  <p className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {section.label}
                  </p>
                )}
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
                      isCollapsed={isCollapsed}
                      onToggle={() => toggleExpand(item.label)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </nav>

      <div className={cn("border-t border-sidebar-border py-3", isCollapsed ? "px-2" : "px-3")}>
        {bottomNavItems.map((item) => (
          <NavItemComponent
            key={item.label}
            item={item}
            pathname={pathname}
            isExpanded={false}
            isActive={isLinkActive(item.href, pathname)}
            isCollapsed={isCollapsed}
            onToggle={() => {}}
          />
        ))}
      </div>

      <div className={cn("border-t border-sidebar-border", isCollapsed ? "p-2" : "p-3")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "flex w-full items-center rounded-lg py-2 transition-colors hover:bg-sidebar-accent",
              isCollapsed ? "justify-center px-0" : "gap-3 px-3"
            )}>
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src="/professional-avatar.png" />
                <AvatarFallback className="bg-primary text-sm text-primary-foreground">
                  {userInitials || "U"}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <>
                  <div className="flex-1 overflow-hidden text-left">
                    <p className="truncate text-sm font-medium text-sidebar-foreground">
                      {userName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {headerSubtitle}
                    </p>
                  </div>
                  <Bell className="h-4 w-4 shrink-0 text-muted-foreground" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isCollapsed ? "center" : "end"} side={isCollapsed ? "right" : "top"} className="w-56">
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
    </TooltipProvider>
  );
}

function NavItemComponent({
  item,
  pathname,
  isExpanded,
  isActive,
  isCollapsed,
  onToggle,
}: {
  item: NavItem;
  pathname: string;
  isExpanded: boolean;
  isActive: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
}) {
  const hasChildren = item.children && item.children.length > 0;
  const Icon = item.icon;

  const itemClasses = cn(
    "flex w-full items-center rounded-lg py-2 text-sm transition-colors",
    isCollapsed ? "justify-center px-0" : "gap-3 px-3",
    isActive && !hasChildren
      ? "bg-sidebar-accent text-sidebar-foreground"
      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
  );

  // Collapsed view with tooltip
  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {hasChildren ? (
            <button onClick={onToggle} className={itemClasses}>
              <Icon className="h-4 w-4 shrink-0" />
            </button>
          ) : (
            <Link href={item.href ?? "#"} className={itemClasses}>
              <Icon className="h-4 w-4 shrink-0" />
            </Link>
          )}
        </TooltipTrigger>
        <TooltipContent side="right">
          {item.label}
          {hasChildren && item.children && (
            <div className="mt-1 space-y-1 border-t border-border pt-1">
              {item.children.map((child) => (
                <Link
                  key={child.label}
                  href={child.href}
                  className="block text-xs text-muted-foreground hover:text-foreground"
                >
                  {child.label}
                </Link>
              ))}
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  // Expanded view
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
