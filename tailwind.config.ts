import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#f5f9fc",
        foreground: "#123047",
        border: "#d7e4ec",
        input: "#ffffff",
        ring: "#00b7a7",
        card: "#ffffff",
        "card-foreground": "#123047",
        primary: {
          DEFAULT: "#0c4f74",
          foreground: "#f8fcff",
        },
        secondary: {
          DEFAULT: "#e6f2f7",
          foreground: "#123047",
        },
        muted: {
          DEFAULT: "#edf6fa",
          foreground: "#5d7587",
        },
        accent: {
          DEFAULT: "#00b7a7",
          foreground: "#f8fffe",
        },
        destructive: {
          DEFAULT: "#c73c4b",
          foreground: "#ffffff",
        },
        sidebar: {
          DEFAULT: "#163b58",
          foreground: "#f3fbff",
          muted: "#214c70",
          accent: "#00b7a7",
          border: "#2a597f",
        },
        chart: {
          1: "#0c4f74",
          2: "#00b7a7",
          3: "#1e7cb8",
          4: "#5cc6f2",
          5: "#8fe3d9",
        },
      },
      borderRadius: {
        lg: "1rem",
        md: "0.75rem",
        sm: "0.5rem",
      },
      boxShadow: {
        panel: "0 18px 45px rgba(12, 79, 116, 0.12)",
      },
      backgroundImage: {
        "page-grid":
          "radial-gradient(circle at top, rgba(0, 183, 167, 0.14), transparent 35%), linear-gradient(rgba(12, 79, 116, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(12, 79, 116, 0.04) 1px, transparent 1px)",
      },
      backgroundSize: {
        "page-grid": "auto, 24px 24px, 24px 24px",
      },
    },
  },
  plugins: [],
};

export default config;
