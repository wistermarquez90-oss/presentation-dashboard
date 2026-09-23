import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  // Tus datos exactos de GitHub Pages
  site: 'https://wistermarquez90-oss.github.io',
  base: '/presentation-dashboard',
  
  integrations: [react(), tailwind()]
});