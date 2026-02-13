"use client";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  suffix?: string;
}

export function Input({ label, suffix, className = "", ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-semibold text-text-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          className={`
            w-full bg-input-bg rounded-xl px-4 py-2.5 text-sm font-medium text-text-primary
            border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none
            placeholder:text-text-muted transition-all duration-200
            ${suffix ? "pr-14" : ""} ${className}
          `}
          {...props}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-muted font-medium">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
