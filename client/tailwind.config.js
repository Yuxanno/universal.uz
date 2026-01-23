/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        // 🎨 LOGO-BASED COLOR SYSTEM - White & Red Professional Palette
        
        // Brand: Main brand color (RED from logo)
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
        
        // Primary: RED - Main actions, links, focus states (LOGO COLOR)
        primary: {
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
        
        // Surface: Neutral colors for backgrounds, text, borders (WHITE-FIRST)
        surface: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712'
        },
        
        // Gray: Neutral colors for text, borders, backgrounds (WHITE-FIRST)
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712'
        },
        
        // Accent: Red variant - Special highlights (LOGO-BASED)
        accent: {
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
        
        // Success: Positive actions, confirmations
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16'
        },
        
        // Warning: Caution, attention needed
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03'
        },
        
        // Danger: Destructive actions, errors
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
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif'
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'Consolas',
          'Monaco',
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
        // 🔲 BORDER RADIUS - Consistent system
        'sm': '0.5rem',      // 8px - small elements
        'DEFAULT': '0.5rem', // 8px - default
        'md': '0.625rem',    // 10px
        'lg': '0.75rem',     // 12px - buttons, inputs, badges
        'xl': '1rem',        // 16px - cards
        '2xl': '1.25rem',    // 20px - large cards, modals
        '3xl': '1.5rem',     // 24px
        '4xl': '2rem'        // 32px
      },
      boxShadow: {
        // 💫 SHADOW SYSTEM - 3 levels
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.03)',
        'sm': '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        'DEFAULT': '0 2px 8px -2px rgb(0 0 0 / 0.08), 0 4px 12px -4px rgb(0 0 0 / 0.06)',
        'md': '0 4px 12px -2px rgb(0 0 0 / 0.08), 0 8px 24px -4px rgb(0 0 0 / 0.08)',
        'lg': '0 8px 24px -4px rgb(0 0 0 / 0.1), 0 16px 48px -8px rgb(0 0 0 / 0.08)',
        'xl': '0 16px 48px -8px rgb(0 0 0 / 0.12), 0 24px 64px -12px rgb(0 0 0 / 0.1)',
        '2xl': '0 24px 64px -12px rgb(0 0 0 / 0.16)',
        'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.04)',
        'none': 'none'
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
