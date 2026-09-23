/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: "#0b111e",
        neon: "#00d2ff",
        glass: "rgba(255,255,255,0.06)"
      },
      boxShadow: {
        neon: "0 0 24px rgba(0,210,255,0.25)",
        glow: "0 0 40px rgba(0,210,255,0.12)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
