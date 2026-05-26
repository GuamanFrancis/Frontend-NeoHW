import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = env.VITE_DEV_PROXY_TARGET || env.VITE_API_URL || 'http://localhost:3000';
  const apiProxyPaths = [
    '/auth',
    '/users',
    '/products',
    '/categories',
    '/attributes',
    '/compatibility',
    '/ai',
    '/orders',
    '/payments',
  ] as const;

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        ...Object.fromEntries(
          apiProxyPaths.map((path) => [
            path,
            {
              target: backendTarget,
              changeOrigin: true,
            },
          ]),
        ),
        '/admin': {
          target: backendTarget,
          changeOrigin: true,
          bypass: (req) => {
            const acceptHeader = req.headers.accept ?? '';
            if (acceptHeader.includes('text/html')) {
              return req.url;
            }

            return undefined;
          },
        },
      },
    },
  };
});
