import type { ReactNode } from "react";
import { GraduationCap } from "lucide-react";
import { AuthBackButton } from "./back-button";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-muted flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mb-4">
          <AuthBackButton />
        </div>
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">LMS Platform</h1>
          </div>
        </div>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Empowering modern learning
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md w-full">
        {children}
      </div>
    </div>
  );
}
