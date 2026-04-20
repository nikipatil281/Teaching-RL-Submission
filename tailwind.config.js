/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '.theme-black-coffee'],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: "rgba(var(--color-coffee-50), <alpha-value>)",
          100: "rgba(var(--color-coffee-100), <alpha-value>)",
          200: "rgba(var(--color-coffee-200), <alpha-value>)",
          300: "rgba(var(--color-coffee-300), <alpha-value>)",
          400: "rgba(var(--color-coffee-400), <alpha-value>)",
          500: "rgba(var(--color-coffee-500), <alpha-value>)",
          600: "rgba(var(--color-coffee-600), <alpha-value>)",
          700: "rgba(var(--color-coffee-700), <alpha-value>)",
          800: "rgba(var(--color-coffee-800), <alpha-value>)",
          900: "rgba(var(--color-coffee-900), <alpha-value>)",
          950: "rgba(var(--color-coffee-950), <alpha-value>)",
        },
      },
      animation: {
        blob: "blob 7s infinite",
        "slow-spin": "spin 20s linear infinite",
      },
      keyframes: {
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)"
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)"
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)"
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)"
          }
        }
      }
    },
  },
  plugins: [],
};
