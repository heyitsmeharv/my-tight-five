import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const apiUrl = env.VITE_API_URL;

  return {
    plugins: [react()],
    server: {
      port: 5173,
      // cross-origin requests (avoids CORS preflight issues entirely)
      ...(apiUrl && {
        proxy: {
          '/api': {
            target: apiUrl,
            changeOrigin: true,
            rewrite: path => path.replace(/^\/api/, ''),
          },
        },
      }),
    },
  };
});
