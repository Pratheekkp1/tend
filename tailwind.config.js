/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        accent: {
          50: "#eef4ff",
          100: "#dfe8ff",
          200: "#c2d3ff",
          300: "#9ab3ff",
          400: "#6f8bff",
          500: "#4c65f7",
          600: "#3a4bde",
          700: "#2f3ab3",
          800: "#2a318c",
          900: "#272d6f",
        },
        surface: {
          light: "#ffffff",
          subtle: "#f6f7fb",
          dark: "#15161c",
          "dark-subtle": "#1e202a",
        },
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
