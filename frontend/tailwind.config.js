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
        // Nueva Paleta Axioma (Rosa Clínico)
        axioma: {
          50: '#FBF4F6',
          100: '#F8EBF0',
          200: '#F3D7E1',
          300: '#E7A9BE', // Cerebro Logo
          400: '#DD89A4',
          500: '#CF6584',
          600: '#BB4763',
          700: '#A1354C',
          800: '#852F40',
          900: '#702B39',
          950: '#43141D',
        },
        // Grises para Textos y Logo
        axiomaText: {
          DEFAULT: '#646464',
          muted: '#8C8C8A',
          // NUEVOS: texto de apoyo con contraste AA sobre fondos rosa/lavanda
          // y tinta ciruela para títulos.
          soft: '#6B6468',
          ink: '#2E1520',
        },
        // Colores base mantenidos
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
        // NUEVO: serif suave para títulos. Si no se carga Fraunces en layout.tsx,
        // cae a Georgia sin romper nada.
        display: [
          'var(--font-fraunces)',
          'Fraunces',
          'Georgia',
          '"Times New Roman"',
          'serif',
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
        // NUEVAS: sombras teñidas del burdeos de marca (más cálidas que el gris)
        'card': '0 1px 2px rgba(67, 20, 29, 0.05), 0 10px 28px -12px rgba(67, 20, 29, 0.16)',
        'lift': '0 2px 4px rgba(67, 20, 29, 0.06), 0 18px 36px -14px rgba(67, 20, 29, 0.28)',
        'panel': '0 28px 56px -24px rgba(67, 20, 29, 0.5)',
      },
      letterSpacing: {
        'display': '-0.028em',
        'heading': '-0.019em',
      },
      // NUEVO: `animate-fade-in` se usaba en la página pero no estaba definida.
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
};