/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 50: "#eff7f3", 100: "#dceee5", 500: "#25855f", 600: "#176b4a", 700: "#12563d", 900: "#123b2e" },
        ink: "#18352c",
        canvas: "#f5f7f2",
        sand: "#f0eadd"
      },
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"] },
      boxShadow: { soft: "0 8px 30px rgba(24, 53, 44, .055)" }
    }
  }
};
