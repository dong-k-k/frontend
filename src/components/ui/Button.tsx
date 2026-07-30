import type { ComponentProps } from "react";
import Link from "next/link";

const base =
  "inline-flex items-center justify-center rounded-[10px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const variants = {
  primary: "bg-accent text-ink hover:brightness-95",
  secondary: "border border-disabled bg-surface text-ink-soft font-semibold hover:bg-page",
};

const sizes = {
  md: "px-7 py-3 text-sm",
  sm: "px-5 py-3 text-[13.5px] font-semibold",
};

interface ButtonProps extends ComponentProps<"button"> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export function Button({ variant = "primary", size = "md", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}

interface LinkButtonProps extends ComponentProps<typeof Link> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export function LinkButton({ variant = "primary", size = "md", className = "", ...props }: LinkButtonProps) {
  return <Link className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}
