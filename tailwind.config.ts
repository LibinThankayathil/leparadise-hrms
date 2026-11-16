import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#F0F9F4',
          100: '#E1F3EA',
          200: '#C3E7D5',
          300: '#95D4B5',
          400: '#5FBA8F',
          500: '#389E70',
          600: '#2D7A58', // Exact primary button green from the image
          700: '#256549',
          800: '#20513C',
          900: '#1B4332',
        },
        canvas: '#F4F6F5',
        card: '#FFFFFF',
        sidebar: '#FBFDFB',
        line: '#EAECF0',
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(16, 24, 40, 0.05)',
        'card': '0 4px 20px -2px rgba(16, 24, 40, 0.04), 0 2px 6px -1px rgba(16, 24, 40, 0.02)',
      },
    },
  },
  plugins: [],
};
export default config;
