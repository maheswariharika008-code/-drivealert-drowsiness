/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cockpit: {
          bg: "#0A0E13",
          panel: "#0F151C",
          hairline: "rgba(255,255,255,0.08)",
          textPrimary: "#E7EEF4",
          textMuted: "#8B98A5",
        },
        safe: { DEFAULT: "#22D3B0", dim: "#0E4F44" },
        warn: { DEFAULT: "#FBBF24", dim: "#5A430D" },
        danger: { DEFAULT: "#FB4141", dim: "#5C1414" },
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      backdropBlur: { glass: "16px" },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.35)",
        glow_safe: "0 0 24px rgba(34,211,176,0.35)",
        glow_warn: "0 0 24px rgba(251,191,36,0.35)",
        glow_danger: "0 0 24px rgba(251,65,65,0.45)",
      },
      keyframes: {
        sweep: { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } },
        pulseRing: {
          "0%": { boxShadow: "0 0 0 0 rgba(251,65,65,0.55)" },
          "70%": { boxShadow: "0 0 0 14px rgba(251,65,65,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(251,65,65,0)" },
        },
      },
      animation: {
        sweep: "sweep 3s linear infinite",
        pulseRing: "pulseRing 1.4s ease-out infinite",
      },
    },
  },
  plugins: [],
};
