// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  // ── Dark mode via class on <html> ──
  darkMode: "class",

  content: ["./index.html", "./src/**/*.{ts,tsx}"],
};

export default config;
