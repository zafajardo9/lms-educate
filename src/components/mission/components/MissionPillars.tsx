const pillars = [
  {
    title: "Access for All",
    description:
      "Break down barriers with multilingual content, mobile-first UX, and inclusive design patterns for every learner.",
  },
  {
    title: "Insight-Driven Teaching",
    description:
      "Give instructors real-time analytics so they can iterate on lessons, assessments, and engagement strategies.",
  },
  {
    title: "Community at the Core",
    description:
      "Connect students, lecturers, and business owners with collaboration spaces, announcements, and shared goals.",
  },
];

export function MissionPillars() {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid gap-8 md:grid-cols-3">
        {pillars.map((pillar) => (
          <div
            key={pillar.title}
            className="rounded-2xl border bg-card/50 p-6 shadow-xs"
          >
            <h3 className="text-xl font-semibold text-foreground mb-3">
              {pillar.title}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {pillar.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
