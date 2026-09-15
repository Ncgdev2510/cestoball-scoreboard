/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          petrol: '#0B4E65',      // Deep Petrol / Azul Petróleo
          steel: '#3F7F9E',       // Steel Cyan / Azul Acero Interactivo
          rose: '#E2C9CA',        // Muted Rose / Crema Neutro Claro
          terracotta: '#D8A996',  // Warm Terracotta Sand / Melocotón Cálido
          bronze: '#B47C50',      // Warm Bronze / Cobre / Acento Visitante
          dark: '#07151c',        // Midnight Petrol Dark Background
          card: '#0c202a',        // Panel and Card Surface
          surface: '#112b38',     // Secondary Button / Input Surface
        },
      },
    },
  },
  plugins: [],
};
