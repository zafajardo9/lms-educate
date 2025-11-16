import {
  ContactHero,
  ContactChannels,
  ContactCallouts,
} from "@/components/contact";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40">
      <ContactHero />
      <ContactChannels />
      <ContactCallouts />
    </main>
  );
}
