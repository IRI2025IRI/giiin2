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
        // デザイン刷新（紫×金の"天野喜孝風"→ティール×ゴールド）に伴い、
        // コンポーネント側の purple-* クラスは変更せず、パレットの実体だけをティール系に差し替える
        purple: {
          50: "#eef8f7",
          100: "#d6ece9",
          200: "#b8ded9",
          300: "#8fcfc6",
          400: "#4fb0a4",
          500: "#0e8a98",
          600: "#0c7481",
          700: "#0b5f6a",
          800: "#0b4f58",
          900: "#0a3d3a",
          950: "#0a201e",
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
