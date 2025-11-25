import type { ReactNode } from "react";
import { LMSSidebar } from "@/components/shared/sidebar";
import { Navbar } from "@/components/shared/navbar";

export default function BusinessOwnerLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <LMSSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
