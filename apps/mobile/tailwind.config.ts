import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        page: "var(--color-bg-page)",
        card: "var(--color-bg-card)",

        // Borders
        border: "var(--color-border)",
        "border-emphasis": "var(--color-border-emphasis)",

        // Text
        main: "var(--color-text-primary)",
        secondary: "var(--color-text-secondary)",
        muted: "var(--color-text-muted)",

        // Accent (editorial blue)
        accent: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
          bg: "var(--color-accent-bg)",
        },

        // YES (forest green)
        yes: {
          DEFAULT: "var(--color-yes)",
          bg: "var(--color-yes-bg)",
          border: "var(--color-yes-border)",
        },

        // NO (classic red)
        no: {
          DEFAULT: "var(--color-no)",
          bg: "var(--color-no-bg)",
          border: "var(--color-no-border)",
        },

        // States
        success: {
          DEFAULT: "var(--color-success)",
          bg: "var(--color-success-bg)",
        },
        error: {
          DEFAULT: "var(--color-error)",
          bg: "var(--color-error-bg)",
        },
        warning: {
          DEFAULT: "var(--color-warning)",
          bg: "var(--color-warning-bg)",
        },

        // Legacy compatibility
        primary: "var(--color-accent)",
        danger: "var(--color-error)",
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-source-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
