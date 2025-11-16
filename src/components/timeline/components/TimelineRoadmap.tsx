const milestones = [
  {
    quarter: "Q1 2024",
    title: "Multi-Organization Support",
    details: "Launch parent-child org hierarchy and shared course catalogs.",
    status: "done",
  },
  {
    quarter: "Q2 2024",
    title: "Student Engagement Suite",
    details: "Discussion threads, richer notifications, and skill badges.",
    status: "done",
  },
  {
    quarter: "Q3 2024",
    title: "AI-Assisted Authoring",
    details: "Smart outlines, question generation, and translation assistance.",
    status: "in-progress",
  },
  {
    quarter: "Q4 2024",
    title: "Enterprise Insights",
    details: "Executive dashboards, cohort benchmarking, and SLA tooling.",
    status: "up-next",
  },
];

const statusStyles: Record<string, string> = {
  done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
  "in-progress":
    "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
  "up-next":
    "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200",
};

export function TimelineRoadmap() {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="space-y-6">
        {milestones.map((item) => (
          <div
            key={item.quarter}
            className="rounded-2xl border bg-card/60 px-6 py-5 shadow-sm"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-primary">
                  {item.quarter}
                </p>
                <h3 className="text-2xl font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="text-muted-foreground">{item.details}</p>
              </div>
              <span
                className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                  statusStyles[item.status]
                }`}
              >
                {item.status.replace("-", " ")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
