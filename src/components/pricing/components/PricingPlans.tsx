import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const tiers = [
  {
    name: "Starter",
    price: "Free",
    description: "Kick off with unlimited draft courses and 50 students.",
    features: [
      "Unlimited draft courses",
      "50 enrolled students",
      "Email support",
      "Community resources",
    ],
    cta: "Start for free",
  },
  {
    name: "Growth",
    price: "$79/mo",
    description: "Best for scaling organizations that need automation.",
    features: [
      "Unlimited published courses",
      "Advanced quizzes & certificates",
      "Automated enrollments",
      "Priority support",
    ],
    cta: "Upgrade to Growth",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For multi-org rollouts, SSO, and compliance requirements.",
    features: [
      "Dedicated CSM",
      "Custom integrations",
      "Security reviews",
      "99.9% uptime SLA",
    ],
    cta: "Talk to sales",
  },
];

export function PricingPlans() {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid gap-8 md:grid-cols-3">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`rounded-2xl border bg-card/60 p-6 shadow-sm ${
              tier.highlighted ? "border-primary shadow-primary/20" : ""
            }`}
          >
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                {tier.name}
              </p>
              <h3 className="text-4xl font-bold text-foreground">
                {tier.price}
              </h3>
              <p className="text-sm text-muted-foreground">
                {tier.description}
              </p>
            </div>
            <ul className="space-y-3 text-sm">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-emerald-500" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              className="mt-6 w-full"
              variant={tier.highlighted ? "default" : "outline"}
            >
              {tier.cta}
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
