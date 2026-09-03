/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        // Sakura / cherry-blossom palette
        accent: {
          50: "#fff1f5",
          100: "#ffe1eb",
          200: "#ffc2d6",
          300: "#ff9dbe",
          400: "#f97ba3",
          500: "#ec5a8a",
          600: "#d43f70",
          700: "#b02f58",
          800: "#8a2545",
          900: "#6b1e37",
        },
        surface: {
          light: "#fffaf8",
          subtle: "#fdf3f3",
          dark: "#1c1420",
          "dark-subtle": "#251a29",
        },
        ink: {
          light: "#4a3540",
          dark: "#f3e8ec",
        },
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
