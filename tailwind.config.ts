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
        pit: {
          bg: "#1E2022",
          surface: "#252729",
          raised: "#2C2F32",
          deep: "#16181A",
          border: "rgba(255,255,255,0.08)",
          borderStrong: "rgba(255,255,255,0.14)",
        },
        metal: {
          silver: "#C8CDD2",
          aluminum: "#A7AEB4",
          steel: "#8B9298",
          bronze: "#B08D57",
          copper: "#C47A4A",
        },
        neon: {
          amber: "#F0A04B",
          purple: "#A78BFA",
          write: "#FF8A3D",
        },
        forge: {
          // keep old names mapped so existing pages don't break
          900: "#252729",
          800: "#2C2F32",
          700: "#35393D",
          accent: "#C47A4A",
          accentHover: "#D4895A",
        },
      },
      boxShadow: {
        pit: "inset 0 4px 20px rgba(0,0,0,0.55)",
        "pit-deep": "inset 0 6px 28px rgba(0,0,0,0.7)",
        card: "0 10px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)",
        glowAmber: "0 0 24px rgba(240,160,75,0.25)",
        glowPurple: "0 0 24px rgba(167,139,250,0.22)",
        header: "0 8px 30px rgba(0,0,0,0.45)",
      },
      backgroundImage: {
        "pit-radial":
          "radial-gradient(ellipse at top, rgba(196,122,74,0.08), transparent 55%), radial-gradient(ellipse at bottom right, rgba(167,139,250,0.06), transparent 50%)",
        "metal-text":
          "linear-gradient(180deg, #F2F4F6 0%, #C8CDD2 40%, #8B9298 100%)",
        "copper-text":
          "linear-gradient(180deg, #E8B48A 0%, #C47A4A 45%, #8A4E2A 100%)",
        "steel-frame":
          "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
