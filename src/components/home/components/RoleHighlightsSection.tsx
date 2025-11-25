import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, Shield, BookOpen, Users } from "lucide-react";

const roleCards = [
  {
    icon: Shield,
    title: "Business Owner",
    description: "Complete platform control and management",
    bullets: [
      "Manage organizations and users",
      "View platform-wide analytics",
      "Configure billing and plans",
      "Oversee all courses and content",
    ],
  },
  {
    icon: BookOpen,
    title: "Lecturer",
    description: "Create and deliver engaging courses",
    bullets: [
      "Build comprehensive courses",
      "Create quizzes and assessments",
      "Track student progress",
      "Grade and provide feedback",
    ],
  },
  {
    icon: Users,
    title: "Student",
    description: "Learn at your own pace and track progress",
    bullets: [
      "Browse and enroll in courses",
      "Access learning materials",
      "Take quizzes and earn certificates",
      "Monitor your learning journey",
    ],
  },
];

export function RoleHighlightsSection() {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Built for Every Role
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Whether you're managing a platform, teaching courses, or learning new
          skills, we have the perfect tools for you.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {roleCards.map((role) => (
          <Card
            key={role.title}
            className="border-2 hover:border-primary transition-colors"
          >
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <role.icon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{role.title}</CardTitle>
              <CardDescription>{role.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {role.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      {bullet}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
