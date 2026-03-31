/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        rubik: ['Rubik-Regular', 'sans-serif'],
        "rubik-bold": ["Rubik-Bold", "sans-serif"],
        "rubik-extrabold": ["Rubik-ExtraBold", "sans-serif"],
        "rubik-medium": ["Rubik-Medium", "sans-serif"],
        "rubik-semibold": ["Rubik-SemiBold", "sans-serif"],
        "rubik-light": ["Rubik-Light", "sans-serif"],
      },
      colors: {
        // Primary - Deep Navy
        primary: {
          50: '#EEF2F6',
          100: '#D5DFE9',
          200: '#AABFD3',
          300: '#7F9FBD',
          400: '#547FA7',
          500: '#1E3A5F',
          600: '#1A3254',
          700: '#152A47',
          800: '#11223A',
          900: '#0C1A2D',
          DEFAULT: '#1E3A5F',
          light: 'rgba(30, 58, 95, 0.08)',
        },
        // Accent - Warm Coral
        accent: {
          50: '#FDF4F2',
          100: '#FCE8E4',
          200: '#F8D1C9',
          300: '#F4BAAE',
          400: '#ECA393',
          500: '#E07A5F',
          600: '#D66B4F',
          700: '#C45A3F',
          800: '#A84A33',
          900: '#8C3A27',
          DEFAULT: '#E07A5F',
          light: 'rgba(224, 122, 95, 0.12)',
        },
        // Supporting colors
        gold: {
          DEFAULT: '#D4A03E',
          light: 'rgba(212, 160, 62, 0.1)',
        },
        forest: {
          DEFAULT: '#2E7D5A',
          light: 'rgba(46, 125, 90, 0.1)',
        },
        // Status colors
        success: {
          DEFAULT: '#2E7D5A',
          light: 'rgba(46, 125, 90, 0.1)',
        },
        warning: {
          DEFAULT: '#D4A03E',
          light: 'rgba(212, 160, 62, 0.1)',
        },
        danger: {
          DEFAULT: '#C43B3B',
          light: 'rgba(196, 59, 59, 0.1)',
        },
        info: {
          DEFAULT: '#4B7BEC',
          light: 'rgba(75, 123, 236, 0.1)',
        },
        // Background colors
        background: {
          DEFAULT: '#FAFBFC',
          dark: '#0D1117',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          elevated: '#F7F8FA',
          dark: '#161B22',
          'dark-elevated': '#21262D',
        },
        // Text colors
        text: {
          DEFAULT: '#1A1F36',
          secondary: '#525F7F',
          muted: '#8898AA',
          dark: '#F0F6FC',
          'dark-secondary': '#8B949E',
          'dark-muted': '#6E7681',
        },
        // Border colors
        border: {
          DEFAULT: '#E6E8EB',
          light: '#F0F2F5',
          dark: '#30363D',
          'dark-light': '#21262D',
        },
        // Legacy compatibility
        black: {
          DEFAULT: '#000000',
          100: '#8898AA',
          200: '#525F7F',
          300: '#1A1F36',
        },
      },
      spacing: {
        // 8px grid system
        'px': '1px',
        '0': '0',
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '3.5': '14px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '9': '36px',
        '10': '40px',
        '11': '44px',
        '12': '48px',
        '14': '56px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
        '28': '112px',
        '32': '128px',
      },
      borderRadius: {
        'none': '0',
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'DEFAULT': '16px',
        'lg': '20px',
        'xl': '24px',
        '2xl': '32px',
        'full': '9999px',
        // Component-specific
        'card': '20px',
        'card-lg': '24px',
        'button': '12px',
        'button-sm': '8px',
        'input': '12px',
        'badge': '8px',
        'modal': '24px',
      },
      fontSize: {
        // Display
        'display-1': ['48px', { lineHeight: '56px', letterSpacing: '-0.5px' }],
        'display-2': ['40px', { lineHeight: '48px', letterSpacing: '-0.5px' }],
        // Headings
        'h1': ['32px', { lineHeight: '40px', letterSpacing: '-0.25px' }],
        'h2': ['28px', { lineHeight: '36px', letterSpacing: '-0.25px' }],
        'h3': ['24px', { lineHeight: '32px', letterSpacing: '-0.25px' }],
        'h4': ['20px', { lineHeight: '28px' }],
        'h5': ['18px', { lineHeight: '26px' }],
        'h6': ['16px', { lineHeight: '24px' }],
        // Body
        'body-lg': ['18px', { lineHeight: '28px' }],
        'body': ['16px', { lineHeight: '24px' }],
        'body-sm': ['14px', { lineHeight: '20px' }],
        'body-xs': ['12px', { lineHeight: '16px' }],
        // Special
        'caption': ['12px', { lineHeight: '16px', letterSpacing: '0.5px' }],
        'label': ['14px', { lineHeight: '20px' }],
        'badge': ['11px', { lineHeight: '16px', letterSpacing: '0.75px' }],
        'price': ['24px', { lineHeight: '32px', letterSpacing: '-0.25px' }],
        'price-lg': ['28px', { lineHeight: '36px', letterSpacing: '-0.25px' }],
      },
      boxShadow: {
        'none': 'none',
        'xs': '0 1px 2px rgba(26, 31, 54, 0.04)',
        'sm': '0 2px 4px rgba(26, 31, 54, 0.06)',
        'md': '0 4px 8px rgba(26, 31, 54, 0.08)',
        'lg': '0 8px 16px rgba(26, 31, 54, 0.1)',
        'xl': '0 12px 24px rgba(26, 31, 54, 0.12)',
        '2xl': '0 16px 32px rgba(26, 31, 54, 0.15)',
        // Colored shadows
        'primary': '0 4px 12px rgba(30, 58, 95, 0.25)',
        'accent': '0 4px 12px rgba(224, 122, 95, 0.3)',
        'card': '0 2px 8px rgba(26, 31, 54, 0.06)',
        'card-hover': '0 8px 16px rgba(26, 31, 54, 0.1)',
        'fab': '0 6px 12px rgba(30, 58, 95, 0.3)',
      },
      animation: {
        'shimmer': 'shimmer 1.5s infinite',
        'pulse-soft': 'pulse-soft 2s infinite',
        'scale-in': 'scale-in 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { opacity: 0.3 },
          '50%': { opacity: 0.7 },
          '100%': { opacity: 0.3 },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}
