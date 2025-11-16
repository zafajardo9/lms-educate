import Link from "next/link";
import { GraduationCap } from "lucide-react";

const footerLinks = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/auth/register" },
      { label: "Pricing", href: "/auth/register" },
      { label: "Demo", href: "/auth/register" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/auth/register" },
      { label: "Blog", href: "/auth/register" },
      { label: "Contact", href: "/auth/register" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/auth/register" },
      { label: "Terms", href: "/auth/register" },
      { label: "Security", href: "/auth/register" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">LMS Educate</span>
            </div>
            <p className="text-sm text-background/80">
              Empowering education through innovative learning management
              solutions.
            </p>
          </div>
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="text-base font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-2 text-sm text-background/80">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="hover:text-background transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-background/30 mt-8 pt-8 text-center text-sm text-background/70">
          <p>
            &copy; {new Date().getFullYear()} LMS Educate. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
