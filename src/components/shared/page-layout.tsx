import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageLayoutProps {
  children: ReactNode;
  /** Page title displayed at the top */
  title?: string;
  /** Optional description below the title */
  description?: string;
  /** Actions to display on the right side of the header (e.g., buttons) */
  actions?: ReactNode;
  /** Additional className for the container */
  className?: string;
  /** Whether to use full width without max-width constraint */
  fullWidth?: boolean;
}

/**
 * PageLayout - Consistent page wrapper for all role pages
 *
 * Usage:
 * ```tsx
 * <PageLayout
 *   title="Dashboard"
 *   description="Welcome back!"
 *   actions={<Button>Create New</Button>}
 * >
 *   {content}
 * </PageLayout>
 * ```
 */
export function PageLayout({
  children,
  title,
  description,
  actions,
  className,
  fullWidth = false,
}: PageLayoutProps) {
  return (
    <div className={cn("flex flex-col min-h-screen", className)}>
      {/* Page Header */}
      {(title || actions) && (
        <header className="border-b border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
          <div
            className={cn(
              "flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between",
              !fullWidth && "mx-auto max-w-7xl"
            )}
          >
            <div className="space-y-1">
              {title && (
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  {title}
                </h1>
              )}
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2 shrink-0">{actions}</div>
            )}
          </div>
        </header>
      )}

      {/* Page Content */}
      <main className="flex-1">
        <div className={cn("px-6 py-6", !fullWidth && "mx-auto max-w-7xl")}>
          {children}
        </div>
      </main>
    </div>
  );
}

interface PageSectionProps {
  children: ReactNode;
  /** Section title */
  title?: string;
  /** Optional description */
  description?: string;
  /** Actions for this section */
  actions?: ReactNode;
  /** Additional className */
  className?: string;
}

/**
 * PageSection - Consistent section wrapper within a page
 *
 * Usage:
 * ```tsx
 * <PageSection title="Recent Activity" actions={<Button size="sm">View All</Button>}>
 *   {content}
 * </PageSection>
 * ```
 */
export function PageSection({
  children,
  title,
  description,
  actions,
  className,
}: PageSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      {(title || actions) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            {title && (
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 shrink-0">{actions}</div>
          )}
        </div>
      )}
      <div>{children}</div>
    </section>
  );
}

interface PageCardProps {
  children: ReactNode;
  /** Additional className */
  className?: string;
  /** Whether to add padding inside the card */
  noPadding?: boolean;
}

/**
 * PageCard - Consistent card wrapper for content blocks
 *
 * Usage:
 * ```tsx
 * <PageCard>
 *   {content}
 * </PageCard>
 * ```
 */
export function PageCard({
  children,
  className,
  noPadding = false,
}: PageCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card text-card-foreground shadow-xs",
        !noPadding && "p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

interface PageGridProps {
  children: ReactNode;
  /** Number of columns (1-4) */
  columns?: 1 | 2 | 3 | 4;
  /** Additional className */
  className?: string;
}

/**
 * PageGrid - Responsive grid layout for cards/items
 *
 * Usage:
 * ```tsx
 * <PageGrid columns={3}>
 *   <PageCard>Item 1</PageCard>
 *   <PageCard>Item 2</PageCard>
 *   <PageCard>Item 3</PageCard>
 * </PageGrid>
 * ```
 */
export function PageGrid({ children, columns = 3, className }: PageGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {children}
    </div>
  );
}
