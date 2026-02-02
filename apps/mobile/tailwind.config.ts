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
        page: "var(--bg-page)",
        card: "var(--bg-card)",
        border: "var(--border-subtle)",
        
        // Text
        main: "var(--text-main)",
        muted: "var(--text-muted)",
        
        // Actions
        primary: "var(--primary)",
        success: "var(--success)",
        danger: "var(--danger)",
      },
    },
  },
  plugins: [],
};
export default config;
