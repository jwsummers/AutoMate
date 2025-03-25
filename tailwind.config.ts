
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
                // Custom colors for AutoMate
                'neon-blue': '#00f3ff',
                'neon-purple': '#bc13fe',
                'neon-pink': '#ff36ab',
                'dark-bg': '#0f1117',
                'dark-card': '#181a20',
				'dark-card-hover': '#1e2028',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
                'pulse-glow': {
                    '0%, 100%': { 
                        boxShadow: '0 0 8px 2px rgba(0, 243, 255, 0.3)',
                        opacity: '1'
                    },
                    '50%': { 
                        boxShadow: '0 0 16px 4px rgba(0, 243, 255, 0.6)',
                        opacity: '0.9'
                    }
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' }
                },
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
                'slide-in-right': {
                    '0%': { transform: 'translateX(100%)' },
                    '100%': { transform: 'translateX(0)' }
                },
                'shimmer': {
                    '0%': { backgroundPosition: '-500px 0' },
                    '100%': { backgroundPosition: '500px 0' }
                }
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
                'pulse-glow': 'pulse-glow 2s infinite',
                'float': 'float 6s ease-in-out infinite',
				'fade-in': 'fade-in 0.3s ease-out',
                'slide-in-right': 'slide-in-right 0.3s ease-out',
                'shimmer': 'shimmer 2.5s infinite linear'
			},
            backgroundImage: {
                'hero-pattern': 'linear-gradient(to bottom, rgba(15, 17, 23, 0.8), rgba(15, 17, 23, 1)), url("https://images.unsplash.com/photo-1610647752706-3bb12232b3ab?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3")',
                'gradient-radial': 'radial-gradient(circle, var(--tw-gradient-stops))',
                'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01))',
                'neon-gradient': 'linear-gradient(90deg, #00f3ff, #bc13fe, #ff36ab)',
                'shimmer-gradient': 'linear-gradient(90deg, transparent, rgba(0, 243, 255, 0.2), transparent)',
            }
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
