import { PricingHero, PricingPlans, PricingFAQ } from "@/components/pricing";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-linear-to-b from-background via-background to-muted/40">
      <PricingHero />
      <PricingPlans />
      <PricingFAQ />
    </main>
  );
}
