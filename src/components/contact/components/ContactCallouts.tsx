const callouts = [
  {
    title: "Enterprise Enablement",
    description:
      "Dedicated success manager, SSO setup, and custom training tracks.",
  },
  {
    title: "Migration Assistance",
    description:
      "Move courses, users, and analytics from legacy LMS platforms without downtime.",
  },
  {
    title: "Accessibility Reviews",
    description:
      "WCAG 2.2 AA reviews for custom content and branded experiences.",
  },
];

export function ContactCallouts() {
  return (
    <section className="bg-muted/50 py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {callouts.map((callout) => (
            <div
              key={callout.title}
              className="rounded-2xl border bg-card p-6 shadow-xs"
            >
              <h3 className="text-lg font-semibold text-foreground">
                {callout.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {callout.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
