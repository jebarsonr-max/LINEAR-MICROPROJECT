/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        scientific: {
          bg: "#F5F7FC",
          card: "#FFFFFF",
          text: "#172554",
          subtext: "#64748B",
          sidebar: "#172554",
          primary: "#2563EB",
          primaryHover: "#1D4ED8",
          violet: "#7C3AED",
          violetLight: "#F5F3FF",
          blueLight: "#EFF6FF",
          border: "#E2E8F0",
          success: "#15803D",
          error: "#B91C1C",
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
