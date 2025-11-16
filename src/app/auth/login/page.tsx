"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserRole } from "@/types";
import { ROLE_OPTIONS, type RoleOption } from "../role-options";
import { PasswordField } from "../password-field";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [showRoleSelection, setShowRoleSelection] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const roleOptions = ROLE_OPTIONS;

  const activeRole = selectedRole
    ? roleOptions.find((option) => option.role === selectedRole)
    : undefined;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRole) {
      toast.error("Please select your role first.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const result = await response.json();
      console.log("Login API Response:", JSON.stringify(result, null, 2));

      if (!response.ok || !result.success) {
        toast.error(result?.error?.message || "Login failed");
        return;
      }

      // Validate user role exists
      const userRole = result.data?.user?.role as UserRole;
      console.log("Extracted role:", userRole, "Type:", typeof userRole);
      console.log("Full user object:", result.data?.user);
      
      if (!userRole) {
        console.error("Login error: User role is undefined", result);
        toast.error("Login failed: Invalid user role. Please contact support.");
        return;
      }

      toast.success("Login successful!");
      const roleRoute = userRole.toLowerCase().replace(/_/g, "-");
      console.log("Redirecting to:", `/${roleRoute}/dashboard`, "Role:", userRole);
      router.push(`/${roleRoute}/dashboard`);
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (email: string, password: string) => {
    setFormData({ email, password });
  };

  const handleRoleSelect = (role: UserRole, demo?: RoleOption["demo"]) => {
    setSelectedRole(role);
    if (demo) {
      fillDemoCredentials(demo.email, demo.password);
    }
    setShowRoleSelection(false);
  };

  const handleChangeRole = () => {
    setShowRoleSelection(true);
    setSelectedRole(null);
    setFormData({ email: "", password: "" });
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Sign in to your account</h2>
        <p className="text-sm text-muted-foreground">
          Choose your role first, then enter your credentials.
        </p>
      </div>

      {showRoleSelection ? (
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="grid w-full max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roleOptions.map(
              ({ label, description, role, icon: Icon, demo }) => (
              <button
                key={role}
                type="button"
                onClick={() => handleRoleSelect(role, demo)}
                className="flex h-full w-full flex-col items-center rounded-2xl border border-border bg-card/95 px-6 py-7 text-center shadow-sm transition hover:-translate-y-1 hover:border-primary hover:shadow-lg"
              >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-medium text-base">{label}</span>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </button>
              )
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-5 rounded-2xl bg-card/95 p-6 shadow-lg backdrop-blur border border-border">
          {activeRole && (
            <div className="flex flex-col items-center gap-3 rounded-lg bg-primary/5 px-5 py-4 text-center">
              <div>
                <p className="text-sm font-medium text-primary uppercase tracking-wide">
                  {activeRole.label}
                </p>
                <p className="text-xs text-muted-foreground max-w-md">
                  {activeRole.description}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleChangeRole}>
                Edit role
              </Button>
            </div>
          )}

          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium leading-none"
                >
                  Email address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={
                    activeRole?.demo?.email
                      ? `e.g. ${activeRole.demo.email}`
                      : "your@email.com"
                  }
                  disabled={isLoading}
                />
              </div>

              <PasswordField
                label="Password"
                id="password"
                name="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                disabled={isLoading}
              />

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                Don't have an account?{" "}
              </span>
              <Link
                href="/auth/register"
                className="font-medium text-primary hover:underline"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
