/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ink: "#05070D",
        shell: "#0B1320",
        gold: "#F4C565",
        mist: "rgba(255,255,255,0.72)",
      },
      boxShadow: {
        card: "0 10px 24px rgba(0,0,0,0.24)",
      },
      borderRadius: {
        card: "28px",
      },
    },
  },
  plugins: [],
};
