import { defineConfig } from 'vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = dirname(fileURLToPath(import.meta.url));

// Cada página HTML es una entrada (sitio de varias páginas, sin framework)
const PAGINAS = [
  'index', 'componentes', 'producto', 'comparar', 'configurador', 'configuraciones', 'herramientas',
  'guias', 'guia', 'ingresar', 'registro', 'cuenta', 'armado', 'pedido', 'compartido', 'accesorios', 'admin', '404',
];

// La API (backend NestJS) corre en el puerto 3000. En desarrollo, Vite reenvía /api allí,
// así el navegador ve un solo origen y la cookie de sesión funciona sin configurar CORS.
const API = process.env.API_URL || 'http://127.0.0.1:3000';

export default defineConfig({
  server: {
    port: 5173,
    proxy: { '/api': { target: API, changeOrigin: true } },
  },
  preview: {
    port: 4173,
    proxy: { '/api': { target: API, changeOrigin: true } },
  },
  build: {
    rollupOptions: {
      input: Object.fromEntries(PAGINAS.map((p) => [p, resolve(RAIZ, `${p}.html`)])),
    },
  },
});
