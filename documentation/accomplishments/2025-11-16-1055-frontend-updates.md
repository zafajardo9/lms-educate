# Frontend Updates — Nov 16, 2025 @ 10:55 AM (UTC+08)

## Highlights

- Launched the public marketing experience (Home, Mission, Timeline, Pricing, Contact) using mirrored page/component folders plus shadcn/ui primitives.
- Documented Axios + TanStack usage and the light/dark theming approach in `FRONTEND_CODING_PRACTICES.md`.
- Added ThemeProvider + ThemeToggle, ensuring the landing header and layout respect semantic Tailwind tokens.
- Built a premium landing footer with unified navigation, policy links, direct email (zafajardo9@gmail.com), and creator socials (LinkedIn/GitHub popover).

## Supporting Details

- Middleware now treats `/`, `/mission`, `/timeline`, `/pricing`, and `/contact` as public so visitors can browse without auth.
- Hero CTA text changed to "Learn Now" and all hero badges/buttons use shadcn components.
- Shared `marketingNavLinks` keeps header/footer menus in sync (including the new Blog placeholder).
- Contact block now surfaces only direct touchpoints: zafajardo9@gmail.com and +1 (555) 123-4567.

## Next Ideas

1. Implement the Blog experience referenced in the nav set.
2. Hook footer policy links to real legal pages once available.
3. Add basic analytics to track CTA engagement per role section.
