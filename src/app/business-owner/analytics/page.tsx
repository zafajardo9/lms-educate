import { PageLayout, PageCard } from "@/components/shared/page-layout";

export default function AnalyticsPage() {
  return (
    <PageLayout
      title="Analytics"
      description="View platform statistics and insights"
    >
      <PageCard>
        <p className="text-muted-foreground">
          Analytics page - Charts, graphs, and platform metrics will be displayed here.
        </p>
      </PageCard>
    </PageLayout>
  );
}
