/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ========================================
      // COLOR SYSTEM - Semantic & Brand
      // ========================================
      colors: {
        // Brand Colors
        brand: {
          primary: "hsl(var(--color-brand-primary))",
          'primary-foreground': "hsl(var(--color-brand-primary-foreground))",
          'primary-hover': "hsl(var(--color-brand-primary-hover))",
          'primary-active': "hsl(var(--color-brand-primary-active))",
          'primary-disabled': "hsl(var(--color-brand-primary-disabled))",
          secondary: "hsl(var(--color-brand-secondary))",
          'secondary-foreground': "hsl(var(--color-brand-secondary-foreground))",
          'secondary-hover': "hsl(var(--color-brand-secondary-hover))",
        },
        
        // Semantic Colors
        background: "hsl(var(--color-background))",
        foreground: "hsl(var(--color-foreground))",
        muted: {
          DEFAULT: "hsl(var(--color-muted))",
          foreground: "hsl(var(--color-muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--color-accent))",
          foreground: "hsl(var(--color-accent-foreground))",
        },
        
        // Status Colors
        success: {
          DEFAULT: "hsl(var(--color-success))",
          foreground: "hsl(var(--color-success-foreground))",
          hover: "hsl(var(--color-success-hover))",
        },
        warning: {
          DEFAULT: "hsl(var(--color-warning))",
          foreground: "hsl(var(--color-warning-foreground))",
          hover: "hsl(var(--color-warning-hover))",
        },
        destructive: {
          DEFAULT: "hsl(var(--color-destructive))",
          foreground: "hsl(var(--color-destructive-foreground))",
          hover: "hsl(var(--color-destructive-hover))",
        },
        info: {
          DEFAULT: "hsl(var(--color-info))",
          foreground: "hsl(var(--color-info-foreground))",
          hover: "hsl(var(--color-info-hover))",
        },
        
        // Surface Colors
        surface: {
          base: "hsl(var(--color-surface-base))",
          raised: "hsl(var(--color-surface-raised))",
          overlay: "hsl(var(--color-surface-overlay))",
          sunken: "hsl(var(--color-surface-sunken))",
        },
        
        // Text Colors
        text: {
          primary: "hsl(var(--color-text-primary))",
          secondary: "hsl(var(--color-text-secondary))",
          tertiary: "hsl(var(--color-text-tertiary))",
          disabled: "hsl(var(--color-text-disabled))",
          inverse: "hsl(var(--color-text-inverse))",
          link: "hsl(var(--color-text-link))",
          'link-hover': "hsl(var(--color-text-link-hover))",
        },
        
        // Border Colors
        border: {
          subtle: "hsl(var(--color-border-subtle))",
          DEFAULT: "hsl(var(--color-border-default))",
          strong: "hsl(var(--color-border-strong))",
          accent: "hsl(var(--color-border-accent))",
          focus: "hsl(var(--color-border-focus))",
        },
        
        // Interactive States
        hover: "hsl(var(--color-hover-overlay))",
        active: "hsl(var(--color-active-overlay))",
        focus: "hsl(var(--color-focus-ring))",
        selected: "hsl(var(--color-selected-bg))",
        disabled: {
          bg: "hsl(var(--color-disabled-bg))",
          text: "hsl(var(--color-disabled-text))",
        },
      },
      
      // ========================================
      // SPACING SYSTEM - 8px Rhythm
      // ========================================
      spacing: {
        // Base scale
        0: 'var(--space-0)',
        0.5: 'var(--space-0-5)',
        1: 'var(--space-1)',
        1.5: 'var(--space-1-5)',
        2: 'var(--space-2)',
        2.5: 'var(--space-2-5)',
        3: 'var(--space-3)',
        3.5: 'var(--space-3-5)',
        4: 'var(--space-4)',
        5: 'var(--space-5)',
        6: 'var(--space-6)',
        7: 'var(--space-7)',
        8: 'var(--space-8)',
        9: 'var(--space-9)',
        10: 'var(--space-10)',
        11: 'var(--space-11)',
        12: 'var(--space-12)',
        14: 'var(--space-14)',
        16: 'var(--space-16)',
        20: 'var(--space-20)',
        24: 'var(--space-24)',
        28: 'var(--space-28)',
        32: 'var(--space-32)',
        
        // Semantic spacing
        component: 'var(--space-component)',
        section: 'var(--space-section)',
        page: 'var(--space-page)',
        element: 'var(--space-element)',
        gap: 'var(--space-gap)',
      },
      
      // ========================================
      // TYPOGRAPHY SYSTEM
      // ========================================
      fontFamily: {
        sans: ['var(--font-family-sans)'],
        mono: ['var(--font-family-mono)'],
        display: ['var(--font-family-display)'],
      },
      
      fontSize: {
        xs: ['var(--font-size-xs)', { lineHeight: 'var(--line-height-tight)' }],
        sm: ['var(--font-size-sm)', { lineHeight: 'var(--line-height-normal)' }],
        base: ['var(--font-size-base)', { lineHeight: 'var(--line-height-normal)' }],
        lg: ['var(--font-size-lg)', { lineHeight: 'var(--line-height-normal)' }],
        xl: ['var(--font-size-xl)', { lineHeight: 'var(--line-height-normal)' }],
        '2xl': ['var(--font-size-2xl)', { lineHeight: 'var(--line-height-tight)' }],
        '3xl': ['var(--font-size-3xl)', { lineHeight: 'var(--line-height-tight)' }],
        '4xl': ['var(--font-size-4xl)', { lineHeight: 'var(--line-height-tight)' }],
        '5xl': ['var(--font-size-5xl)', { lineHeight: 'var(--line-height-tight)' }],
        
        // Semantic typography
        hero: ['var(--text-hero)', { lineHeight: 'var(--line-height-tight)' }],
      },
      
      fontWeight: {
        thin: 'var(--font-weight-thin)',
        light: 'var(--font-weight-light)',
        normal: 'var(--font-weight-normal)',
        medium: 'var(--font-weight-medium)',
        semibold: 'var(--font-weight-semibold)',
        bold: 'var(--font-weight-bold)',
        extrabold: 'var(--font-weight-extrabold)',
        black: 'var(--font-weight-black)',
      },
      
      lineHeight: {
        none: 'var(--line-height-none)',
        tight: 'var(--line-height-tight)',
        snug: 'var(--line-height-snug)',
        normal: 'var(--line-height-normal)',
        relaxed: 'var(--line-height-relaxed)',
        loose: 'var(--line-height-loose)',
      },
      
      letterSpacing: {
        tighter: 'var(--letter-spacing-tighter)',
        tight: 'var(--letter-spacing-tight)',
        normal: 'var(--letter-spacing-normal)',
        wide: 'var(--letter-spacing-wide)',
        wider: 'var(--letter-spacing-wider)',
        widest: 'var(--letter-spacing-widest)',
      },
      
      // ========================================
      // BORDER RADIUS SYSTEM
      // ========================================
      borderRadius: {
        none: 'var(--radius-none)',
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-base)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
        full: 'var(--radius-full)',
        
        // Semantic radius
        button: 'var(--radius-button)',
        card: 'var(--radius-card)',
        input: 'var(--radius-input)',
        modal: 'var(--radius-modal)',
      },
      
      // ========================================
      // SHADOW SYSTEM
      // ========================================
      boxShadow: {
        // Base shadows
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-md)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
        inner: 'var(--shadow-inner)',
        
        // Colored shadows
        primary: 'var(--shadow-primary)',
        success: 'var(--shadow-success)',
        warning: 'var(--shadow-warning)',
        destructive: 'var(--shadow-destructive)',
        
        // Semantic shadows
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        modal: 'var(--shadow-modal)',
        dropdown: 'var(--shadow-dropdown)',
        tooltip: 'var(--shadow-tooltip)',
      },
      
      // ========================================
      // COMPONENT DIMENSIONS
      // ========================================
      height: {
        'button-sm': 'var(--button-height-sm)',
        'button-md': 'var(--button-height-md)',
        'button-lg': 'var(--button-height-lg)',
        'input': 'var(--input-height)',
        'nav': 'var(--nav-height)',
      },
      
      minHeight: {
        'button-sm': 'var(--button-height-sm)',
        'button-md': 'var(--button-height-md)',
        'button-lg': 'var(--button-height-lg)',
        'input': 'var(--input-height)',
        'nav': 'var(--nav-height)',
      },
      
      maxWidth: {
        modal: 'var(--modal-max-width)',
        'modal-lg': 'var(--modal-max-width-lg)',
      },
      
      // ========================================
      // ANIMATION SYSTEM
      // ========================================
      transitionDuration: {
        fast: 'var(--duration-fast)',
        normal: 'var(--duration-normal)',
        slow: 'var(--duration-slow)',
      },
      
      transitionTimingFunction: {
        linear: 'var(--ease-linear)',
        in: 'var(--ease-in)',
        out: 'var(--ease-out)',
        'in-out': 'var(--ease-in-out)',
        bounce: 'var(--ease-bounce)',
      },
      
      // ========================================
      // Z-INDEX SYSTEM
      // ========================================
      zIndex: {
        dropdown: 'var(--z-dropdown)',
        sticky: 'var(--z-sticky)',
        fixed: 'var(--z-fixed)',
        'modal-backdrop': 'var(--z-modal-backdrop)',
        modal: 'var(--z-modal)',
        popover: 'var(--z-popover)',
        tooltip: 'var(--z-tooltip)',
        toast: 'var(--z-toast)',
      },
      
      // ========================================
      // CUSTOM KEYFRAMES
      // ========================================
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-down": {
          from: { transform: "translateY(-100%)" },
          to: { transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "bounce-in": {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "bounce-in": "bounce-in 0.5s ease-bounce",
      },
    },
  },
  plugins: [
    // Custom plugin for semantic utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        // Semantic text colors
        '.text-primary': {
          color: theme('colors.text.primary'),
        },
        '.text-secondary': {
          color: theme('colors.text.secondary'),
        },
        '.text-tertiary': {
          color: theme('colors.text.tertiary'),
        },
        '.text-disabled': {
          color: theme('colors.text.disabled'),
        },
        '.text-link': {
          color: theme('colors.text.link'),
        },
        '.text-link:hover': {
          color: theme('colors.text.link-hover'),
        },
        
        // Semantic backgrounds
        '.bg-surface-base': {
          backgroundColor: theme('colors.surface.base'),
        },
        '.bg-surface-raised': {
          backgroundColor: theme('colors.surface.raised'),
        },
        '.bg-surface-overlay': {
          backgroundColor: theme('colors.surface.overlay'),
        },
        '.bg-surface-sunken': {
          backgroundColor: theme('colors.surface.sunken'),
        },
        
        // Interactive states
        '.hover-overlay:hover': {
          backgroundColor: theme('colors.hover'),
        },
        '.active-overlay:active': {
          backgroundColor: theme('colors.active'),
        },
        '.focus-ring:focus': {
          boxShadow: `0 0 0 2px ${theme('colors.focus')}`,
        },
        '.selected-bg': {
          backgroundColor: theme('colors.selected'),
        },
        
        // Component-specific utilities
        '.button-primary': {
          backgroundColor: theme('colors.brand.primary'),
          color: theme('colors.brand.primary-foreground'),
          padding: theme('spacing.3') + ' ' + theme('spacing.4'),
          borderRadius: theme('borderRadius.button'),
          height: theme('height.button-md'),
        },
        '.button-primary:hover': {
          backgroundColor: theme('colors.brand.primary-hover'),
        },
        '.button-primary:disabled': {
          backgroundColor: theme('colors.brand.primary-disabled'),
          color: theme('colors.disabled.text'),
        },
        
        '.card': {
          backgroundColor: theme('colors.surface.base'),
          borderRadius: theme('borderRadius.card'),
          boxShadow: theme('boxShadow.card'),
          padding: theme('spacing.6'),
        },
        '.card:hover': {
          boxShadow: theme('boxShadow.card-hover'),
        },
        
        '.input': {
          backgroundColor: theme('colors.background'),
          borderColor: theme('colors.border.DEFAULT'),
          borderRadius: theme('borderRadius.input'),
          padding: theme('spacing.3') + ' ' + theme('spacing.4'),
          height: theme('height.input'),
        },
        '.input:focus': {
          borderColor: theme('colors.border.focus'),
          boxShadow: `0 0 0 1px ${theme('colors.border.focus')}`,
        },
      }
      
      addUtilities(newUtilities)
    },
  ],
}
