/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Psicoterapia & Bienestar Mental (Deep Slate Navy & Terracotta Sand)
        // Basada en psicología del color clínico: serenidad, confianza médica y calidez humana.
        navy: {
          DEFAULT: '#1c2d42',
          deep: '#142030',
          dark: '#1c2d42',
          mid: '#283e58',
          light: '#3b5577',
        },
        terracotta: {
          DEFAULT: '#d96b43',
          dark: '#c45a33',
          hover: '#bf532c',
          soft: '#f8ded3',
          wash: '#fcf2ed',
        },
        sand: {
          DEFAULT: '#f3ece1',
          light: '#fbf9f5',
          dark: '#e6dbcc',
        },
        ice: {
          DEFAULT: '#dceaf5',
          soft: '#edf4fa',
        },
        heather: {
          DEFAULT: '#eae6f0',
          soft: '#f4f2f7',
        },
        ink: {
          black: '#17202a',
        },
        paper: {
          white: '#ffffff',
        },
        ash: '#9ca3af',
        slate: '#64748b',
        graphite: '#334155',
        charcoal: '#1e293b',
        frost: '#e2e8f0',
        cloud: '#f8fafc',
      },
      fontFamily: {
        sans: [
          '"DM Sans"',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      borderRadius: {
        'button': '40px',
        'card': '24px',
        'card-sm': '16px',
        'tag': '9999px',
      },
      boxShadow: {
        'subtle': 'rgba(23, 32, 42, 0.04) 0px 1px 2px 0px',
        'dropdown': '0 10px 25px -5px rgba(23, 32, 42, 0.08), 0 8px 10px -6px rgba(23, 32, 42, 0.04)',
      },
      letterSpacing: {
        'display': '-0.028em',
        'heading': '-0.019em',
      },
    },
  },
  plugins: [],
};
