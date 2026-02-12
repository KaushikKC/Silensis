"use client";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  suffix?: string;
}

export function Input({
  label,
  suffix,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-500">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          className={`
            w-full bg-input-bg rounded-xl px-4 py-2.5 text-sm font-medium
            border border-transparent focus:border-accent focus:outline-none
            placeholder:text-gray-400 transition-colors
            ${suffix ? "pr-14" : ""} ${className}
          `}
          {...props}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
