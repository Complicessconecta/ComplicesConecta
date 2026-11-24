// vite.config.ts
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";

export default defineConfig(({ mode }) => {
  loadEnv(mode, process.cwd(), "");

  const spaFallbackForTests = (): Plugin => {
    return {
      name: "spa-fallback-for-testsprite",
      apply: "serve",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          try {
            if (
              !req.url ||
              req.method !== "GET" ||
              req.headers.upgrade?.toLowerCase() === "websocket"
            ) {
              return next();
            }

            const url = req.url.split("?")[0];
            if (
              url.startsWith("/@") ||
              url.startsWith("/src/") ||
              url.startsWith("/assets/") ||
              url.startsWith("/favicon") ||
              url.startsWith("/robots") ||
              url.startsWith("/manifest")
            ) {
              return next();
            }
            if (path.posix.extname(url)) return next();

            const acceptHeader = String(req.headers?.accept ?? "");
            const wantsHtml = acceptHeader.includes("text/html");
            if (wantsHtml) return next();

            const indexHtmlPath = path.resolve(
              server.config.root,
              "index.html",
            );
            const rawHtml = fs.readFileSync(indexHtmlPath, "utf-8");

            const html = await server.transformIndexHtml(url, rawHtml);
            res.statusCode = 200;
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.end(html);
          } catch {
            return next();
          }
        });
      },
    };
  };

  return {
    plugins: [react(), spaFallbackForTests()],
    optimizeDeps: {
      entries: ["index.html"],
      include: ["react", "react-dom", "react-router", "react-router-dom"],
    },
    server: {
      port: 8080,
      host: true,
      strictPort: true,
      allowedHosts: ["tun.testsprite.com", ".tun.testsprite.com"],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react-router", "react-router-dom"],
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
          // Vite 8 usa Rolldown, que solo acepta manualChunks como función
          // (la forma de objeto dejó de ser válida). Misma división de chunks.
          manualChunks: (id) => {
            // Separar vendor libraries grandes
            if (
              id.includes("node_modules/react/") ||
              id.includes("node_modules/react-dom/") ||
              id.includes("node_modules/react-router-dom/")
            ) {
              return "vendor-react";
            }
            if (
              id.includes("node_modules/@radix-ui/react-dialog/") ||
              id.includes("node_modules/@radix-ui/react-dropdown-menu/") ||
              id.includes("node_modules/@radix-ui/react-tabs/")
            ) {
              return "vendor-ui";
            }
            if (id.includes("node_modules/@supabase/supabase-js/")) {
              return "vendor-supabase";
            }
            if (
              id.includes("node_modules/date-fns/") ||
              id.includes("node_modules/crypto-js/") ||
              id.includes("node_modules/ethers/")
            ) {
              return "vendor-utils";
            }
            // Separar páginas grandes
            if (
              id.includes("src/pages/TokensInfo") ||
              id.includes("src/pages/profiles/single/ProfileSingle")
            ) {
              return "pages-large";
            }
            if (
              id.includes("src/pages/Chat") ||
              id.includes("src/pages/ChatInfo")
            ) {
              return "pages-chat";
            }
            if (
              id.includes("src/pages/AIControlCenter") ||
              id.includes("src/components/ai/LegalChatBox") ||
              id.includes("src/ai/useLocalAI") ||
              id.includes("src/ai/AIWorker")
            ) {
              return "pages-ai";
            }
            if (
              id.includes("src/pages/profiles/shared/Profiles") ||
              id.includes("src/pages/profiles/shared/ProfileDetail")
            ) {
              return "pages-profiles";
            }
          },
        },
      },
      cssCodeSplit: true,
      // Aumentar límite tras aplicar manualChunks para evitar warnings no accionables en producción
      chunkSizeWarningLimit: 6000,
      target: "esnext",
      minify: "esbuild",
      esbuild: {
        drop: mode === "production" ? ["console", "debugger"] : [],
      },
      // Configurar PostCSS para mejor compatibilidad CSS
      cssTarget: "chrome61",
      cssMinify: true,
    },
    base: "/",
  };
});
