/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe6ff",
          200: "#bfd2ff",
          300: "#94b3ff",
          400: "#6088ff",
          500: "#3b63f6",
          600: "#2645e4",
          700: "#1f36c2",
          800: "#1e319a",
          900: "#1e2f7a",
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06)",
        lift: "0 10px 30px -12px rgba(16,24,40,.18)",
      },
      animation: {
        "fade-in": "fadeIn .25s ease-out both",
        "slide-up": "slideUp .3s ease-out both",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        slideUp: {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
