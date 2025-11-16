import {
  BookOpen,
  TrendingUp,
  Award,
  Users,
  CheckCircle,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Course Management",
    description:
      "Create and organize lessons, quizzes, and multimedia content in one workspace.",
    accent: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-200",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description:
      "Monitor engagement with dashboards for completions, time-on-task, and scores.",
    accent:
      "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-200",
  },
  {
    icon: Award,
    title: "Certificates",
    description:
      "Issue branded certificates automatically when learners meet completion goals.",
    accent:
      "bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-200",
  },
  {
    icon: Users,
    title: "User Management",
    description:
      "Control organizations, roles, and permissions with guardrails baked in.",
    accent:
      "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-200",
  },
  {
    icon: CheckCircle,
    title: "Assessments",
    description:
      "Build quizzes with multiple question types, rubrics, and automated grading.",
    accent: "bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-200",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description:
      "Enterprise-ready security with granular access control and audit logs.",
    accent: "bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-200",
  },
];

export function FeatureHighlights() {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Powerful Features
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Everything you need to create, manage, and deliver exceptional
          learning experiences.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title} className="flex gap-4">
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${feature.accent}`}
            >
              <feature.icon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
