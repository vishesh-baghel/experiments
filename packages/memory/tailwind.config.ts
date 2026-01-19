import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds (Zed dark theme)
        'bg-primary': '#0e1015',
        'bg-secondary': '#13161c',
        'bg-tertiary': '#1a1d24',
        'bg-elevated': '#1e2128',

        // Text
        'text-primary': '#f1f2f4',
        'text-secondary': '#b8bdc7',
        'text-muted': '#a8afbd',
        'text-subtle': '#6b7280',

        // Accents
        'accent-blue': '#0751cf',
        'accent-blue-light': '#9dbcfb',
        'accent-blue-hover': '#0862e8',
        'accent-cyan': '#56d4dd',
        'accent-purple': '#9e9eff',

        // Semantic
        success: '#4ade80',
        warning: '#fbbf24',
        error: '#f87171',
        info: '#60a5fa',
      },
      fontFamily: {
        headline: ['Lora', 'Georgia', 'Times New Roman', 'serif'],
        body: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      borderColor: {
        DEFAULT: 'rgba(255, 255, 255, 0.08)',
        hover: 'rgba(255, 255, 255, 0.12)',
        accent: 'rgba(7, 81, 207, 0.5)',
      },
      borderRadius: {
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
