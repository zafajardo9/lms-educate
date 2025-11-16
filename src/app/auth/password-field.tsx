"use client";

import { useState } from "react";
import type { InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";
import { EyeClosedIcon, EyeOpenIcon } from "@radix-ui/react-icons";

type PasswordFieldProps = {
  label: string;
} & Pick<
  InputHTMLAttributes<HTMLInputElement>,
  | "id"
  | "name"
  | "value"
  | "onChange"
  | "placeholder"
  | "disabled"
  | "autoComplete"
  | "required"
>;

export function PasswordField({
  label,
  id,
  name,
  value,
  onChange,
  placeholder,
  disabled,
  autoComplete,
  required,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium leading-none">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={isVisible ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-20"
        />
        <button
          type="button"
          onClick={() => setIsVisible((prev) => !prev)}
          className="absolute inset-y-0 right-3 flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
          aria-label={isVisible ? "Hide password" : "Show password"}
        >
          {isVisible ? (
            <EyeClosedIcon className="h-4 w-4" />
          ) : (
            <EyeOpenIcon className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
