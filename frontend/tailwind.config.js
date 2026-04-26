/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f9ff",
          100: "#dff4ff",
          200: "#b7e6ff",
          300: "#7ed4ff",
          400: "#3ebeff",
          500: "#0a9be9",
          600: "#007abf",
          700: "#00639b",
          800: "#03527f",
          900: "#0a4669"
        }
      }
    }
  },
  plugins: []
};
