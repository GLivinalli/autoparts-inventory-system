/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#171A21",
        "ink-soft": "#2A2E37",
        surface: "#F6F5F2",
        line: "#DEDBD3",
        muted: "#6B6F76",
        accent: {
          DEFAULT: "#C97A0A",
          soft: "#F1E0C4",
          dark: "#9C5E07",
        },
        steel: {
          DEFAULT: "#35586E",
          soft: "#DCE6EC",
        },
        success: {
          DEFAULT: "#2F7A4C",
          soft: "#DCEFE2",
        },
        danger: {
          DEFAULT: "#B23A2E",
          soft: "#F5DEDB",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["'Barlow Condensed'", "Inter", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
      },
    },
  },
  plugins: [],
};
