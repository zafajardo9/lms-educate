import { Mail, MessageCircle, Phone } from "lucide-react";

const channels = [
  {
    title: "Email Support",
    detail: "support@lmseducate.com",
    description: "Best for onboarding questions or general inquiries.",
    icon: Mail,
  },
  {
    title: "Live Chat",
    detail: "Weekdays 8AM – 6PM PST",
    description: "Connect with a product specialist in-app.",
    icon: MessageCircle,
  },
  {
    title: "Sales & Partnerships",
    detail: "+1 (555) 123-4567",
    description: "Enterprise plans, custom integrations, and training.",
    icon: Phone,
  },
];

export function ContactChannels() {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid gap-8 md:grid-cols-3">
        {channels.map((channel) => (
          <div
            key={channel.title}
            className="rounded-2xl border bg-card/50 p-6 shadow-sm"
          >
            <channel.icon className="h-6 w-6 text-primary" />
            <h3 className="mt-4 text-xl font-semibold text-foreground">
              {channel.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {channel.description}
            </p>
            <p className="mt-3 text-base font-medium text-foreground">
              {channel.detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
