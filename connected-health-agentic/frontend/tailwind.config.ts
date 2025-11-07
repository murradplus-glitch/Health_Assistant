import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0E7490',
        accent: '#FDBA74',
        danger: '#DC2626'
      }
    }
  },
  plugins: []
};

export default config;
