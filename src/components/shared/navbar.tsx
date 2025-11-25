"use client";

import { useState } from "react";
import {
  Bell,
  Link2,
  ZoomIn,
  ZoomOut,
  Check,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  href?: string;
}

// Mock notifications - replace with real data
const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "New Course Available",
    message: "Introduction to React has been added to your catalog.",
    time: "5 min ago",
    read: false,
    href: "/courses",
  },
  {
    id: "2",
    title: "Assignment Due",
    message: "Your assignment for JavaScript Basics is due tomorrow.",
    time: "1 hour ago",
    read: false,
    href: "/assignments",
  },
  {
    id: "3",
    title: "Certificate Earned",
    message: "Congratulations! You've earned a certificate for HTML Fundamentals.",
    time: "2 hours ago",
    read: true,
    href: "/certificates",
  },
  {
    id: "4",
    title: "New Message",
    message: "You have a new message from your instructor.",
    time: "Yesterday",
    read: true,
    href: "/messages",
  },
];

export function Navbar() {
  const [zoom, setZoom] = useState(100);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 10, 150);
    setZoom(newZoom);
    document.documentElement.style.fontSize = `${newZoom}%`;
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 10, 70);
    setZoom(newZoom);
    document.documentElement.style.fontSize = `${newZoom}%`;
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <TooltipProvider delayDuration={0}>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-end gap-2 border-b border-border bg-background px-4">
        {/* Share Link Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShareLink}
              className="h-9 w-9"
            >
              <Link2 className="h-4 w-4" />
              <span className="sr-only">Share page link</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Share page link</TooltipContent>
        </Tooltip>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 px-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                disabled={zoom <= 70}
                className="h-8 w-8"
              >
                <ZoomOut className="h-4 w-4" />
                <span className="sr-only">Zoom out</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom out</TooltipContent>
          </Tooltip>

          <span className="min-w-[3rem] text-center text-xs font-medium text-muted-foreground">
            {zoom}%
          </span>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                disabled={zoom >= 150}
                className="h-8 w-8"
              >
                <ZoomIn className="h-4 w-4" />
                <span className="sr-only">Zoom in</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom in</TooltipContent>
          </Tooltip>
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                  <span className="sr-only">Notifications</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Notifications</TooltipContent>
          </Tooltip>

          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-auto px-2 py-1 text-xs font-normal text-primary hover:text-primary"
                >
                  <Check className="mr-1 h-3 w-3" />
                  Mark all as read
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {notifications.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={cn(
                      "flex cursor-pointer flex-col items-start gap-1 p-3",
                      !notification.read && "bg-muted/50"
                    )}
                  >
                    <div className="flex w-full items-start justify-between gap-2">
                      <span className="font-medium text-sm">
                        {notification.title}
                      </span>
                      {!notification.read && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex w-full items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        {notification.time}
                      </span>
                      {notification.href && (
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-sm text-primary">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
    </TooltipProvider>
  );
}
