import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { marketingNavLinks } from "@/components/home/constants";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

const policyLinks = [
  { label: "Security", href: "/legal/security" },
  { label: "Terms", href: "/legal/terms" },
  { label: "Privacy", href: "/legal/privacy" },
];

const contactLinks = [
  { label: "zafajardo9@gmail.com", href: "mailto:zafajardo9@gmail.com" },
  { label: "+1 (555) 123-4567", href: "tel:+15551234567" },
];

const creatorSocials = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/zafajardo9/" },
  { label: "GitHub", href: "https://github.com/" },
];

export function LandingFooter() {
  return (
    <footer className="bg-foreground text-background py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[2fr_1.5fr_1fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight">
                  LMS Educate
                </p>
                <p className="text-xs uppercase tracking-[0.2em] text-background/70">
                  Learning without limits
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-background/80 max-w-md">
              We craft modern learning experiences for business owners,
              lecturers, and students. From onboarding to analytics, every
              touchpoint is designed for clarity and momentum.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold uppercase tracking-wide text-background/70 mb-4">
              Explore
            </h3>
            <div className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm text-background/80">
              {marketingNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:text-background transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold uppercase tracking-wide text-background/70 mb-3">
                Policies
              </h3>
              <ul className="space-y-2 text-sm text-background/80">
                {policyLinks.map((link) => (
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
            <div>
              <h3 className="text-base font-semibold uppercase tracking-wide text-background/70 mb-3">
                Contact
              </h3>
              <ul className="space-y-2 text-sm text-background/80">
                {contactLinks.map((link) => (
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
            <div>
              <h3 className="text-base font-semibold uppercase tracking-wide text-background/70 mb-3">
                Creator
              </h3>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="secondary"
                    className="w-full justify-between text-sm text-foreground"
                  >
                    Meet the Creator
                    <span className="text-xs text-foreground/70">
                      Hover to view socials
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-60 space-y-3 text-sm"
                  side="top"
                  align="end"
                >
                  <p className="font-medium text-foreground">Creator Links</p>
                  <ul className="space-y-2 text-muted-foreground">
                    {creatorSocials.map((social) => (
                      <li key={social.label}>
                        <Link
                          href={social.href}
                          className="hover:text-foreground transition-colors"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {social.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground">
                    Prefer email? Reach me anytime at{" "}
                    <Link
                      href="mailto:zafajardo9@gmail.com"
                      className="underline"
                    >
                      zafajardo9@gmail.com
                    </Link>
                    .
                  </p>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-background/20 pt-8 text-sm text-background/70 md:flex-row md:items-center md:justify-between">
          <p>
            &copy; {new Date().getFullYear()} LMS Educate. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs tracking-wide uppercase">
            <span>Secure by design</span>
            <span className="h-4 w-px bg-background/30" aria-hidden />
            <span>Cloud-native</span>
            <span className="h-4 w-px bg-background/30" aria-hidden />
            <span>99.9% uptime</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
