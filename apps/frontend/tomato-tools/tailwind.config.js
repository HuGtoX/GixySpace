/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#FF6347",
        "primary-dark": "#FF6347",
        "dark-primary": "#FF6347",
        weibo: {
          DEFAULT: "#E6162D",
          60: "#E6162D99",
        },
        zhihu: {
          DEFAULT: "#0F88EB",
          60: "#0F88EB99",
        },
        github: {
          DEFAULT: "#24292E",
          60: "#24292E99",
        },
        juejin: {
          DEFAULT: "#1e80ff",
          60: "#1e80ff99",
        },
        xueqiu: {
          DEFAULT: "rgb(96 165 250)",
          60: "rgb(96 165 250 / 0.6)",
        },
        bilibili: {
          DEFAULT: "#FB7299",
          60: "#FB729999",
        },
        douyin: {
          DEFAULT: "#000000",
          60: "#00000099",
        },
        toutiao: {
          DEFAULT: "#FF6347",
          60: "#FF634799",
        },
        dark: {
          primary: "#D17A66",
          secondary: "#EC4899",
          bg1: "#1f2937",
          bg2: "#374151",
        },
      },
      animation: {
        progress: "progress 2s ease-in-out infinite",
      },
      keyframes: {
        progress: {
          "0%": { transform: "translateX(-100%)" },
          "50%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
    },
  },
  plugins: [],
};
