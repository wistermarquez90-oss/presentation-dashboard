/** @type {import('tailwindcss').Config} */
export default {
  // Esta línea es la clave: le dice a Tailwind que lea tu Dashboard.jsx
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {},
  },
  plugins: [],
}