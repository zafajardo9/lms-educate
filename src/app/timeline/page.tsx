import { TimelineHero, TimelineRoadmap } from "@/components/timeline";

export default function TimelinePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40">
      <TimelineHero />
      <TimelineRoadmap />
    </main>
  );
}
