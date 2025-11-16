import {
  LandingHeader,
  HeroSection,
  RoleHighlightsSection,
  FeatureHighlights,
  CallToActionSection,
  LandingFooter,
} from "@/components/home";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <LandingHeader />
      <HeroSection />
      <RoleHighlightsSection />
      <FeatureHighlights />
      <CallToActionSection />
      <LandingFooter />
    </div>
  );
}
