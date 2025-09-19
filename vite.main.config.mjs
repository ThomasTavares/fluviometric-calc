import { defineConfig } from 'vite';
import { builtinModules } from 'module';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      // keep better-sqlite3 out of the bundle so Node/Electron requires it at runtime
      external: ['better-sqlite3', ...builtinModules],
    },
  },
});
