/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#14213D",
          light: "#1F3059",
          50: "#EEF1F7",
        },
        gold: {
          DEFAULT: "#F2A93B",
          dark: "#D98E1F",
          // Gold for small text on white / cream: #D98E1F only reaches 2.7:1 there.
          deep: "#9A5B00",
          light: "#FCE3B6",
        },
        rise: {
          DEFAULT: "#12A594",
          // Was #0C8577 (4.3:1 on the page background); this passes 4.5:1 for small text.
          dark: "#0A7468",
          light: "#D6F3EF",
        },
        paper: "#FBFAF7",
      },
      fontFamily: {
        // "… Fallback" = metric-matched local font while the real one loads (src/fonts.css).
        display: ["'Space Grotesk'", "'Space Grotesk Fallback'", "sans-serif"],
        body: ["'Inter'", "'Inter Fallback'", "sans-serif"],
      },
      backgroundImage: {
        "rise-line": "linear-gradient(135deg, #14213D 0%, #1F3059 60%, #12A594 100%)",
      },
      keyframes: {
        rise: {
          "0%": { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        rise: "rise 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};
