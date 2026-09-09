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
          light: "#FCE3B6",
        },
        rise: {
          DEFAULT: "#12A594",
          dark: "#0C8577",
          light: "#D6F3EF",
        },
        paper: "#FBFAF7",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
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
