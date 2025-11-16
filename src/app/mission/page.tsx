import {
  MissionHero,
  MissionPillars,
  MissionImpact,
} from "@/components/mission";

export default function MissionPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40">
      <MissionHero />
      <MissionPillars />
      <MissionImpact />
    </main>
  );
}
