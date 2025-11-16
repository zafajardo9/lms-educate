const stats = [
  { value: "10K+", label: "Active Students" },
  { value: "500+", label: "Expert Lecturers" },
  { value: "1,000+", label: "Quality Courses" },
  { value: "95%", label: "Satisfaction Rate" },
];

export function StatsShowcase() {
  return (
    <section className="bg-card py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 text-center md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className="text-4xl font-bold text-primary mb-2">
                {stat.value}
              </div>
              <div className="text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
