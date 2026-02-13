import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        page: "#f1f5f9",
        "page-warm": "#f8fafc",
        card: "#ffffff",
        "input-bg": "#f1f5f9",
        "input-focus": "#e2e8f0",
        accent: "#0f766e",
        "accent-hover": "#0d9488",
        "accent-muted": "#ccfbf1",
        long: "#059669",
        "long-bg": "#ecfdf5",
        short: "#dc2626",
        "short-bg": "#fef2f2",
        "text-primary": "#0f172a",
        "text-secondary": "#64748b",
        "text-muted": "#94a3b8",
        border: "#e2e8f0",
        "border-light": "#f1f5f9",
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        "card-hover":
          "0 4px 12px -2px rgb(0 0 0 / 0.06), 0 2px 6px -2px rgb(0 0 0 / 0.04)",
        "card-elevated":
          "0 8px 24px -4px rgb(0 0 0 / 0.06), 0 4px 12px -4px rgb(0 0 0 / 0.04)",
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
