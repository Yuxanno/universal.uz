/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 🎨 MODERN DESIGN SYSTEM 2025 - White • Red • Black
        
        // Primary: RED - Main brand color, CTAs, important actions
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',  // Main red
          600: '#dc2626',  // Primary CTA
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a'
        },
        
        // Neutral: White to Black scale
        neutral: {
          0: '#ffffff',    // Pure white
          50: '#fafafa',   // Off-white
          100: '#f5f5f5',  // Light gray
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',  // Near black
          950: '#0a0a0a'   // Pure black
        },
        
        // Keep gray for compatibility
        gray: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a'
        },
        
        // Red alias for primary
        red: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a'
        },
        
        // Aliases for compatibility
        surface: {
          0: '#ffffff',
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a'
        },
        brand: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a'
        },
        success: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a'
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a'
        },
        warning: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a'
        }
      },
      fontFamily: {
        sans: [
          'Inter var',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif'
        ],
        display: [
          'SF Pro Display',
          'Inter var',
          'Inter',
          'system-ui',
          'sans-serif'
        ],
        mono: [
          'SF Mono',
          'JetBrains Mono',
          'Fira Code',
          'Consolas',
          'monospace'
        ]
      },
      fontSize: {
        // 📏 TYPOGRAPHY SCALE - 8px base
        '2xs': ['0.625rem', { lineHeight: '0.875rem', fontWeight: '400' }],      // 10px
        'xs': ['0.75rem', { lineHeight: '1rem', fontWeight: '400' }],            // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],        // 14px
        'base': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],           // 16px
        'lg': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '500' }],        // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],         // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],            // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem', fontWeight: '700' }],       // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem', fontWeight: '700' }],         // 36px
        '5xl': ['3rem', { lineHeight: '1.16', fontWeight: '800' }],              // 48px
        '6xl': ['3.75rem', { lineHeight: '1.1', fontWeight: '800' }]             // 60px
      },
      spacing: {
        // 🎯 SPACING SCALE - 8px grid system
        '18': '4.5rem',   // 72px
        '88': '22rem',    // 352px
        '128': '32rem'    // 512px
      },
      borderRadius: {
        // 🔲 MODERN BORDER RADIUS - 12-20px range
        'none': '0',
        'sm': '0.5rem',      // 8px
        'DEFAULT': '0.75rem', // 12px - default
        'md': '0.875rem',    // 14px
        'lg': '1rem',        // 16px - buttons, inputs
        'xl': '1.25rem',     // 20px - cards, modals
        '2xl': '1.5rem',     // 24px - large cards
        '3xl': '2rem',       // 32px
        'full': '9999px'
      },
      boxShadow: {
        // 💫 SOFT SHADOWS - Minimal and elegant
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.02)',
        'sm': '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.03)',
        'DEFAULT': '0 2px 8px -2px rgb(0 0 0 / 0.05), 0 4px 12px -4px rgb(0 0 0 / 0.04)',
        'md': '0 4px 16px -4px rgb(0 0 0 / 0.06), 0 8px 24px -8px rgb(0 0 0 / 0.05)',
        'lg': '0 8px 24px -8px rgb(0 0 0 / 0.08), 0 16px 48px -12px rgb(0 0 0 / 0.06)',
        'xl': '0 16px 48px -12px rgb(0 0 0 / 0.1), 0 24px 64px -16px rgb(0 0 0 / 0.08)',
        '2xl': '0 24px 64px -16px rgb(0 0 0 / 0.12)',
        'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.03)',
        'none': 'none',
        // Red glow for focus states
        'red': '0 0 0 3px rgb(239 68 68 / 0.1)',
        'red-lg': '0 0 0 4px rgb(239 68 68 / 0.15)'
      },
      animation: {
        // ✨ ANIMATIONS - Minimal and smooth
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-up': 'fadeUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'spin': 'spin 1s linear infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' }
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' }
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' }
        }
      },
      transitionTimingFunction: {
        // 🎬 TIMING FUNCTIONS
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
      },
      transitionDuration: {
        // ⏱️ DURATIONS - Standard timing
        '200': '200ms',
        '300': '300ms'
      },
      screens: {
        'xs': '475px',
        '3xl': '1600px',
        '4xl': '1920px'
      }
    }
  },
  plugins: []
}
