import type { ReactNode } from "react";
import { LMSSidebar } from "@/components/shared/sidebar";

export default function LecturerLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <LMSSidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}
