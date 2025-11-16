"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AuthBackButton() {
  const router = useRouter();

  const handleBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  }, [router]);

  return (
    <Button
      type="button"
      variant="ghost"
      className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary"
      onClick={handleBack}
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </Button>
  );
}
