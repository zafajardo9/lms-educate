const faqs = [
  {
    question: "Can I switch plans later?",
    answer:
      "Yes. Upgrade or downgrade anytime. We prorate the difference and keep your data intact.",
  },
  {
    question: "Do you offer discounts for education nonprofits?",
    answer:
      "We offer 30% discounts for qualifying nonprofits and public institutions. Contact sales to verify.",
  },
  {
    question: "Is support included?",
    answer:
      "Email support is included for all tiers. Growth and Enterprise plans include live chat and success reviews.",
  },
];

export function PricingFAQ() {
  return (
    <section className="bg-muted/40 py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {faqs.map((faq) => (
            <div
              key={faq.question}
              className="rounded-2xl border bg-card/80 p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-foreground">
                {faq.question}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
