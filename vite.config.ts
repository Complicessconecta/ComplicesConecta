// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const _env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: 8080,
      host: '0.0.0.0',
      strictPort: false,
      middlewareMode: false,
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        port: 8080,
      },
      fs: {
        strict: false,
        allow: ['..']
      },
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, PUT, PATCH, POST, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      // 🔧 Fix para Node.js 18 - Deshabilitar hash en HTML para evitar crypto.hash error
      reportCompressedSize: false,
      rollupOptions: {
        output: {
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
          // 🚀 OPTIMIZACIÓN: Code-splitting ultra-agresivo para evitar chunks >1000kB
          manualChunks(id) {
            // Vendor chunks - Librerías pesadas separadas
            if (id.includes('node_modules')) {
              if (id.includes('react') && id.includes('react-dom')) {
                return 'vendor-react';
              }
              if (id.includes('react-dom')) {
                return 'vendor-react-dom';
              }
              if (id.includes('@supabase')) {
                return 'vendor-supabase';
              }
              if (id.includes('@radix-ui')) {
                return 'vendor-radix';
              }
              if (id.includes('framer-motion')) {
                return 'vendor-framer';
              }
              if (id.includes('date-fns')) {
                return 'vendor-datefns';
              }
              if (id.includes('crypto-js')) {
                return 'vendor-crypto';
              }
              if (id.includes('ethers')) {
                return 'vendor-ethers';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-lucide';
              }
              if (id.includes('tailwindcss') || id.includes('postcss')) {
                return 'vendor-styling';
              }
              // Separar otros vendors grandes
              if (id.includes('typescript') || id.includes('vite')) {
                return 'vendor-build';
              }
              // Fallback para otros vendors pequeños
              return 'vendor-other';
            }
            
            // Feature chunks - Código de la app por feature
            if (id.includes('src/components/tokens')) {
              return 'feature-tokens';
            }
            if (id.includes('src/components/profiles')) {
              return 'feature-profiles';
            }
            if (id.includes('src/components/chat')) {
              return 'feature-chat';
            }
            if (id.includes('src/components/ui')) {
              return 'feature-ui';
            }
            if (id.includes('src/services')) {
              return 'services';
            }
            if (id.includes('src/pages')) {
              return 'pages';
            }
            if (id.includes('src/hooks')) {
              return 'hooks';
            }
          },
        },
      },
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1000,
      target: 'esnext',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: true
        }
      }
    },
    base: '/',
  };
});
