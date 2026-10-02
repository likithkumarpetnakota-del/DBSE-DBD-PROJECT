/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#ece4f9", // softest lavender background
          900: "#f4effc", // main lavender white background
          850: "#ffffff", // card surface pure white
          800: "#ffffff", // card container white
          700: "#f3e8ff", // soft lavender hover
          600: "#d8b4fe", // border tint
        },
        accent: {
          blue: "#7c3aed", // rich primary lavender floret violet
          violet: "#9333ea", // vibrant purple accent
          cyan: "#4c1d95", // deep royal lavender core purple
        },
        status: {
          safe: "#16a34a",
          warn: "#d97706",
          danger: "#dc2626",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(124,58,237,0.15), 0 8px 30px -8px rgba(124,58,237,0.25)",
        "glow-violet": "0 0 0 1px rgba(147,51,234,0.18), 0 8px 30px -8px rgba(147,51,234,0.3)",
        "glow-danger": "0 0 0 1px rgba(220,38,38,0.25), 0 8px 30px -8px rgba(220,38,38,0.35)",
      },
      animation: {
        "pulse-ring": "pulse-ring 2.2s cubic-bezier(0.4,0,0.6,1) infinite",
        scan: "scan 3s linear infinite",
        "fade-in": "fade-in 0.4s ease-out",
        "slide-up": "slide-up 0.45s cubic-bezier(0.16,1,0.3,1)",
        "toast-in": "toast-in 0.35s cubic-bezier(0.16,1,0.3,1)",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%": { transform: "scale(1.5)", opacity: "0" },
          "100%": { transform: "scale(1.5)", opacity: "0" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "toast-in": {
          "0%": { opacity: "0", transform: "translateX(40px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      backgroundImage: {
        "grid-glow":
          "radial-gradient(circle at 20% 20%, rgba(124,58,237,0.08), transparent 40%), radial-gradient(circle at 80% 0%, rgba(147,51,234,0.08), transparent 40%)",
      },
    },
  },
  plugins: [],
};
