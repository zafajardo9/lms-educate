import { PageLayout, PageCard } from "@/components/shared/page-layout";

export default function CertificatesPage() {
  return (
    <PageLayout
      title="Certificates"
      description="Manage course certificates and templates"
    >
      <PageCard>
        <p className="text-muted-foreground">
          Certificates page - Certificate templates and issued certificates will be displayed here.
        </p>
      </PageCard>
    </PageLayout>
  );
}
