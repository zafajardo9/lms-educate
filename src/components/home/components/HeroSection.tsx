import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function HeroSection() {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center max-w-4xl mx-auto">
        <Badge
          variant="secondary"
          className="inline-flex items-center gap-2 rounded-full border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary mb-6"
        >
          <Sparkles className="h-4 w-4" />
          Modern Learning Management System
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
          Transform Your{" "}
          <span className="text-primary">Learning Experience</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          A comprehensive platform for business owners, lecturers, and students.
          Create, manage, and deliver engaging courses with powerful tools and
          analytics.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/register">
            <Button size="lg" className="text-lg px-8">
              Learn Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button size="lg" variant="outline" className="text-lg px-8">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
