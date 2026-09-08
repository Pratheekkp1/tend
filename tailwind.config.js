/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Warm, minimal palette: coral / gold / sage / blush / cream
        accent: {
          50: "#fdeeed",
          100: "#fbdcda",
          200: "#f7bab5",
          300: "#f59d97",
          400: "#f38b84",
          500: "#f28482",
          600: "#dd6d6b",
          700: "#c25553",
          800: "#9c4442",
          900: "#7a3534",
        },
        gold: {
          50: "#fef8ee",
          100: "#fcedd1",
          300: "#f9d78e",
          500: "#f6bd60",
          700: "#c99135",
        },
        sage: {
          50: "#f1f5f3",
          100: "#dfe8e5",
          300: "#a8bfb8",
          500: "#84a59d",
          700: "#5f7d76",
        },
        blush: {
          100: "#fbe9e6",
          300: "#f5cac3",
          500: "#e8a89f",
        },
        surface: {
          light: "#ffffff",
          subtle: "#f7f5f1",
          dark: "#0f0f11",
          "dark-subtle": "#1c1d20",
        },
        ink: {
          light: "#33302c",
          dark: "#f1efec",
        },
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
