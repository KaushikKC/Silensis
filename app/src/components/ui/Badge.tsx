"use client";

interface BadgeProps {
  variant?: "long" | "short" | "neutral";
  children: React.ReactNode;
  className?: string;
}

const variants = {
  long: "bg-long-bg text-long",
  short: "bg-short-bg text-short",
  neutral: "bg-border-light text-text-secondary",
};

export function Badge({
  variant = "neutral",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
