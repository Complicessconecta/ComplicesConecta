// vite.config.ts
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "tailwindcss";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    server: {
      port: 8080,
      host: true,
      strictPort: true,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          // Suprimir warnings de Supabase sobre "default" export
          if (
            warning.code === "THIS_IS_UNDEFINED" ||
            (warning.message &&
              warning.message.includes('default" is not exported'))
          ) {
            return;
          }
          warn(warning);
        },
        output: {
          chunkFileNames: "assets/js/[name]-[hash].js",
          entryFileNames: "assets/js/[name]-[hash].js",
          assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
          // 🚀 OPTIMIZACIÓN: Manual chunks para resolver warning >1000KB
          manualChunks: {
            // Separar vendor libraries grandes
            "vendor-react": ["react", "react-dom", "react-router-dom"],
            "vendor-ui": [
              "@radix-ui/react-dialog",
              "@radix-ui/react-dropdown-menu",
              "@radix-ui/react-tabs",
            ],
            "vendor-supabase": ["@supabase/supabase-js"],
            "vendor-utils": ["date-fns", "crypto-js", "ethers"],
            // Separar tipos grandes de Supabase (solo si se importan)
            // 'types-supabase': ['./src/types/supabase-generated'],
            // Separar páginas grandes
            "pages-large": [
              "./src/pages/TokensInfo",
              "./src/pages/profiles/single/ProfileSingle",
            ],
            "pages-chat": ["./src/pages/Chat", "./src/pages/ChatInfo"],
            "pages-ai": [
              "./src/pages/AIControlCenter",
              "./src/components/ai/LegalChatBox",
              "./src/ai/useLocalAI",
              "./src/ai/AIWorker",
            ],
            "pages-profiles": [
              "./src/pages/profiles/shared/Profiles",
              "./src/pages/profiles/shared/ProfileDetail",
            ],
            // Separar servicios complejos
            "services-advanced": [
              "./src/services/AdvancedCacheService",
              "./src/services/ContentModerationService",
            ],
          },
        },
      },
      cssCodeSplit: true,
      // Aumentar límite tras aplicar manualChunks para evitar warnings no accionables en producción
      chunkSizeWarningLimit: 6000,
      target: "esnext",
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: mode === "production", // Remover console.log en producción
          drop_debugger: true,
        },
      },
    },
    base: "/",
  };
});
