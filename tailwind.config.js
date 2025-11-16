const { fontFamily } = require("tailwindcss/defaultTheme");

module.exports = {
  mode: "jit",
  purge: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter var", ...fontFamily.sans],
      },
      borderRadius: {
        DEFAULT: "8px",
        secondary: "4px",
        container: "12px",
      },
      boxShadow: {
        DEFAULT: "0 1px 4px rgba(0, 0, 0, 0.1)",
        hover: "0 2px 8px rgba(0, 0, 0, 0.12)",
      },
      colors: {
        // Cores originais mantidas para compatibilidade
        primary: {
          DEFAULT: "#4F46E5",
          hover: "#4338CA",
        },
        secondary: {
          DEFAULT: "#6B7280",
          hover: "#4B5563",
        },
        accent: {
          DEFAULT: "#8B5CF6",
          hover: "#7C3AED",
        },
        // Nova paleta Campori Paulistana
        campori: {
          navy: "#023E73",      // Azul marinho principal
          darkGreen: "#0F402E", // Verde escuro
          green: "#025918",     // Verde médio
          brown: "#733702",     // Marrom/dourado
          darkRed: "#260707",   // Vermelho escuro/bordô
          // Variações para hover e estados
          navyHover: "#034a8c",
          darkGreenHover: "#1a5a42",
          greenHover: "#037020",
          brownHover: "#8a4203",
          darkRedHover: "#3a0a0a",
        },
      },
      spacing: {
        "form-field": "16px",
        section: "32px",
      },
    },
  },
  variants: {
    extend: {
      boxShadow: ["hover", "active"],
    },
  },
};
