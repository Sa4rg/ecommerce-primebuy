/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      screens: {
        xxs: "250px",
        xs: "480px",
        md2: "900px",
      },
      colors: {
        pb: {
          bg: "var(--pb-bg)",
          "bg-subtle": "var(--pb-bg-subtle)",
          surface: "var(--pb-surface)",
          "surface-2": "var(--pb-surface-2)",
          text: "var(--pb-text)",
          "text-secondary": "var(--pb-text-secondary)",
          muted: "var(--pb-muted)",
          border: "var(--pb-border)",
          "border-light": "var(--pb-border-light)",
          primary: "var(--pb-primary)",
          "primary-hover": "var(--pb-primary-hover)",
          accent: "var(--pb-accent)",
          "accent-hover": "var(--pb-accent-hover)",
          success: "var(--pb-success)",
          error: "var(--pb-error)",
          warning: "var(--pb-warning)",
        },
      },
      fontFamily: {
        display: ["Inter", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};