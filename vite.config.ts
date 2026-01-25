// vite.config.ts
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    optimizeDeps: {
      entries: ["index.html"],
    },
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

          // Suprimir warning no accionable: Rollup no moverá módulos de dynamic import a otro chunk
          // (Sucede cuando manualChunks contiene módulos también referenciados por dynamic import)
          if (
            warning.message &&
            warning.message.includes(
              "dynamic import will not move module into another chunk",
            )
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
