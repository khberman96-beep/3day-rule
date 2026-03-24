/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Outfit'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        base: {
          900: "#0a0f1a",
          800: "#0f172a",
          700: "#1e293b",
          600: "#334155",
          500: "#475569",
          400: "#64748b",
          300: "#94a3b8",
          200: "#cbd5e1",
          100: "#e2e8f0",
        },
        accent: "#F59E0B",
        urgent: "#EF4444",
        success: "#10B981",
        info: "#3B82F6",
        purple: "#8B5CF6",
        pink: "#EC4899",
        orange: "#F97316",
      },
    },
  },
  plugins: [],
};
