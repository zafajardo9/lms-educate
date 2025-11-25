"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { UserRole } from "@/types";
import { ROLE_OPTIONS } from "../role-options";
import { PasswordField } from "../password-field";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [showRoleSelection, setShowRoleSelection] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const roleOptions = ROLE_OPTIONS;

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

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: selectedRole,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.error?.message || "Registration failed");
        return;
      }

      toast.success("Account created successfully! Please sign in.");
      router.push("/auth/login");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setShowRoleSelection(false);
  };

  const handleChangeRole = () => {
    setShowRoleSelection(true);
    setSelectedRole(null);
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Create your account</h2>
        <p className="text-sm text-muted-foreground">
          Pick the role that matches how you’ll use the platform.
        </p>
      </div>

      {showRoleSelection ? (
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="grid w-full max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roleOptions.map(({ label, description, role, icon: Icon }) => (
              <button
                key={role}
                type="button"
                onClick={() => handleRoleSelect(role)}
                className="flex h-full w-full flex-col items-center rounded-2xl border border-border bg-card/95 px-6 py-7 text-center shadow-xs transition hover:-translate-y-1 hover:border-primary hover:shadow-lg"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-medium text-base">{label}</span>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-5 rounded-2xl bg-card/95 p-6 shadow-lg backdrop-blur-sm border border-border">
          {selectedRole && (
            <div className="flex flex-col items-center gap-3 rounded-lg bg-primary/5 px-5 py-4 text-center">
              <div>
                <p className="text-sm font-medium text-primary uppercase tracking-wide">
                  {roleOptions.find(({ role }) => role === selectedRole)?.label}
                </p>
                <p className="text-xs text-muted-foreground max-w-md">
                  {
                    roleOptions.find(({ role }) => role === selectedRole)
                      ?.description
                  }
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
                <label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
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
                  placeholder="john@example.com"
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <PasswordField
                  label="Password"
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 8 characters"
                  disabled={isLoading}
                />

                <PasswordField
                  label="Confirm Password"
                  id="confirmPassword"
                  name="confirmPassword"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                Already have an account?{" "}
              </span>
              <Link
                href="/auth/login"
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
