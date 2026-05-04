/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4648d4',
          light: '#6063ee',
          dim: '#c0c1ff',
          container: '#e1e0ff',
          on: '#ffffff',
          'on-container': '#07006c',
        },
        secondary: {
          DEFAULT: '#6b38d4',
          light: '#8455ef',
          container: '#e9ddff',
        },
        surface: {
          DEFAULT: '#f9f9ff',
          dim: '#cfdaf2',
          bright: '#f9f9ff',
          container: '#e7eeff',
          'container-high': '#dee8ff',
          'container-highest': '#d8e3fb',
          'container-low': '#f0f3ff',
          'container-lowest': '#ffffff',
        },
        on: {
          surface: '#111c2d',
          'surface-variant': '#464554',
        },
        outline: {
          DEFAULT: '#767586',
          variant: '#c7c4d7',
        },
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
        },
        tertiary: {
          DEFAULT: '#904900',
          container: '#b55d00',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'glass': '0 10px 25px -5px rgba(15, 23, 42, 0.06), 0 4px 6px -2px rgba(15, 23, 42, 0.03)',
        'glass-hover': '0 14px 35px -5px rgba(15, 23, 42, 0.1), 0 6px 10px -2px rgba(15, 23, 42, 0.05)',
        'primary': '0 4px 14px rgba(70, 72, 212, 0.35)',
        'primary-hover': '0 6px 20px rgba(70, 72, 212, 0.45)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
