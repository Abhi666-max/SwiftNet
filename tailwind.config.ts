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
        cream: {
          DEFAULT: "#FAFAF7",
          50: "#FDFDFB",
          100: "#FAFAF7",
          200: "#F4F0E8",
          300: "#EDE8DC",
          400: "#E0D9CC",
          border: "#DDD8CE",
        },
        ink: {
          DEFAULT: "#0D0D0D",
          50: "#F5F5F5",
          100: "#4A4A4A",
          200: "#2D2D2D",
          300: "#1A1A1A",
          400: "#0D0D0D",
        },
        crimson: {
          DEFAULT: "#C1121F",
          light: "#E63946",
          dark: "#8B0000",
          muted: "#F5E0E1",
          glow: "rgba(193, 18, 31, 0.12)",
        },
        'crimson-DEFAULT': '#C1121F',
        'crimson-glow': 'rgba(193, 18, 31, 0.12)',
        stone: {
          50: "#FAFAF9",
          100: "#F5F4F0",
          200: "#E8E4DC",
          300: "#C8C4BA",
          400: "#A8A49A",
          500: "#78746A",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif"', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Cascadia Code', 'monospace'],
      },
      boxShadow: {
        'card': '0 2px 12px 0 rgba(13, 13, 13, 0.08)',
        'card-hover': '0 8px 24px 0 rgba(13, 13, 13, 0.12)',
        'crimson': '0 0 20px 0 rgba(193, 18, 31, 0.20)',
        'inner-soft': 'inset 0 1px 3px rgba(0,0,0,0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'ink-spread': 'inkSpread 0.6s ease-out forwards',
        'sakura-fall': 'sakuraFall 8s linear infinite',
        'draw-line': 'drawLine 1s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        inkSpread: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        sakuraFall: {
          '0%': { transform: 'translateY(-20px) rotate(0deg)', opacity: '0' },
          '10%': { opacity: '0.8' },
          '90%': { opacity: '0.6' },
          '100%': { transform: 'translateY(100vh) rotate(360deg)', opacity: '0' },
        },
        drawLine: {
          '0%': { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
