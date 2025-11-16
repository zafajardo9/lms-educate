const impactStats = [
  { label: "Learners served", value: "45,000+" },
  { label: "Organizations onboarded", value: "120+" },
  { label: "Avg. course rating", value: "4.8/5" },
];

export function MissionImpact() {
  return (
    <section className="bg-muted/40 py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary mb-2">
              Impact
            </p>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Learning results you can measure.
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Every release ships with instrumentation so business owners and
              lecturers know how learners are progressing. From adaptive quizzes
              to cohorts analytics, we bake accountability into the platform.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {impactStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border bg-card/60 p-4 text-center"
              >
                <p className="text-2xl font-bold text-primary">{stat.value}</p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
