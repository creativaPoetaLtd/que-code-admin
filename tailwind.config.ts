import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "#001a0d",
          dark: "#002914",
        },
        // QiewCode colors
        qc: {
          green: {
            DEFAULT: "#00b514",
            light: "#00e619",
            dark: "#008a0f",
            darker: "#006b0c",
          },
          teal: {
            DEFAULT: "#06b6d4",
            light: "#22d3ee",
            dark: "#0891b2",
          },
          gold: {
            DEFAULT: "#d4a517",
            light: "#fbbf24",
            dark: "#b8860b",
          },
        },
        admin: {
          primary: {
            DEFAULT: "#00b514",
            light: "#00e619",
            dark: "#008a0f",
            foreground: "#ffffff",
          },
          secondary: {
            DEFAULT: "#06b6d4",
            light: "#22d3ee",
            dark: "#0891b2",
            foreground: "#ffffff",
          },
          destructive: {
            DEFAULT: "#ff5722",
            light: "#ff7849",
            dark: "#e64a19",
            foreground: "#ffffff",
          },
          warning: {
            DEFAULT: "#f59e0b",
            light: "#fbbf24",
            dark: "#d97706",
            foreground: "#ffffff",
          },
          success: {
            DEFAULT: "#00b514",
            light: "#00e619",
            dark: "#008a0f",
            foreground: "#ffffff",
          },
          info: {
            DEFAULT: "#3b82f6",
            light: "#60a5fa",
            dark: "#2563eb",
            foreground: "#ffffff",
          },
          bg: {
            DEFAULT: "#0a0f0d",
            soft: "#0f1612",
            card: "rgba(15, 22, 18, 0.98)",
            hover: "rgba(0, 181, 20, 0.08)",
          },
          nav: "rgba(10, 15, 13, 0.98)",
          border: {
            DEFAULT: "rgba(255, 255, 255, 0.08)",
            light: "rgba(255, 255, 255, 0.12)",
            accent: "rgba(0, 181, 20, 0.3)",
          },
          text: {
            DEFAULT: "#f9fafb",
            soft: "#cbd5e1",
            muted: "#94a3b8",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        dropdownOpen: {
          from: {
            opacity: "0",
            transform: "scale(0.95) translateY(-10px)",
          },
          to: {
            opacity: "1",
            transform: "scale(1) translateY(0)",
          },
        },
        fadeIn: {
          from: {
            opacity: "0",
            transform: "translateY(10px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        dropdown: "dropdownOpen 0.2s ease-out forwards",
        fadeIn: "fadeIn 0.3s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
