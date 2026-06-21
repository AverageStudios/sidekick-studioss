"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

type AsyncSubmitButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  label: string;
  pendingLabel: string;
  icon?: ReactNode;
  pendingIcon?: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
};

export function AsyncSubmitButton({
  label,
  pendingLabel,
  icon,
  pendingIcon,
  variant = "primary",
  size = "md",
  className,
  disabled,
  ...props
}: AsyncSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;

  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      className={className}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      {...props}
    >
      {pending ? pendingIcon || <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {pending ? pendingLabel : label}
    </Button>
  );
}
