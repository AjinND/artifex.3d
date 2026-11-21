import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FAF8F4",
        blush: "#F8E8E0",
        lavender: "#E4EBE2",
        mint: "#D4E4D9",
        sky: "#E0EBF5",
        peach: "#FFE5D9",
        sage: "#D4E4D9",
        lilac: "#DDD5F3",
        coral: "#F5C4B8",
        primary: {
          DEFAULT: "#354B40",
          dark: "#273B30",
        },
        secondary: {
          DEFAULT: "#E4EBE2",
          dark: "#626960",
        },
        text: {
          primary: "#282C29",
          secondary: "#626960",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Arial", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
        "6xl": "3rem",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out infinite 2s",
        blob: "blob 8s ease-in-out infinite",
        shimmer: "shimmer 2s infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-15px) rotate(2deg)" },
        },
        blob: {
          "0%, 100%": {
            borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
          },
          "50%": {
            borderRadius: "30% 60% 70% 40% / 50% 60% 30% 60%",
          },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
