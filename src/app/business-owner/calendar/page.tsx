import { PageLayout, PageCard } from "@/components/shared/page-layout";

export default function CalendarPage() {
  return (
    <PageLayout
      title="Calendar"
      description="View and manage your schedule"
    >
      <PageCard>
        <p className="text-muted-foreground">
          Calendar page - Schedule and events will be displayed here.
        </p>
      </PageCard>
    </PageLayout>
  );
}
