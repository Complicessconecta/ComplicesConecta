// vite.config.ts
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

            const indexHtmlPath = path.resolve(server.config.root, "index.html");
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
          // 🚀 OPTIMIZACIÓN: code splitting manual para resolver warning >1000KB.
          // Vite 8 usa Rolldown: `manualChunks` (función) NO mueve los
          // módulos compartidos estáticos — solo los destinos de dynamic
          // import — y si `codeSplitting` está presente, `manualChunks`
          // se ignora. Por eso toda la división vive aquí, en grupos
          // `codeSplitting` (misma división que el manualChunks
          // anterior, más el grupo `shared-core`).
          // RONDA 15 (stream C, dock lento — test PR #74): los
          // primitivos UI compartidos (Button, Card, Input, Badge, cn,
          // logger) y el núcleo auth/demo (useAuth, demo-registration,
          // useToast, usePersistedState, cliente Supabase, app-config,
          // anonymous, friends, useFeatures, tabs, avatar,
          // TokensSubnav, SafeImage, Modal) los tragaban los chunks
          // gigantes pages-ai (6,3 MB, runtime @mlc-ai), pages-chat
          // (1,6 MB, @datadog/rxjs/neo4j) y pages-large (2,3 MB,
          // @tensorflow): TODAS las rutas lazy los necesitan, así que
          // navegar a /tokens o /settings esperaba a descargar esos
          // 10 MB antes de pintar (la URL cambiaba al instante y el
          // contenido tardaba segundos; el primer intento de Config
          // solo se vio tras recargar, ya con los chunks en caché).
          // El grupo `shared-core` (prioridad mayor que las páginas)
          // los saca a su propio chunk pequeño, dependencia estática
          // del entry: las rutas solo descargan su chunk de página.
          // `includeDependenciesRecursively` (default true) mete
          // también sus dependencias (framer-motion, cva, ...) en el
          // grupo, para que no quede nada compartido dentro de
          // pages-ai/pages-chat/pages-large.
          codeSplitting: {
            groups: [
              {
                name: "vendor-react",
                test: (id: string) =>
                  id.includes("node_modules/react/") ||
                  id.includes("node_modules/react-dom/") ||
                  id.includes("node_modules/react-router-dom/"),
                priority: 30,
              },
              {
                name: "vendor-ui",
                test: (id: string) =>
                  id.includes("node_modules/@radix-ui/react-dialog/") ||
                  id.includes("node_modules/@radix-ui/react-dropdown-menu/") ||
                  id.includes("node_modules/@radix-ui/react-tabs/") ||
                  // Ronda 15 (stream C): framer-motion se partía en dos —
                  // 57 módulos en shared-core y AnimatePresence en
                  // pages-large (lo importa StakingModal vía TokenDashboard
                  // → /tokens arrastraba pages-large entera, 2,5 MB). Al
                  // no tener grupo propio, `includeDependenciesRecursively`
                  // lo repartía según el importador. Grupo propio y
                  // compartido: todo framer-motion en vendor-ui.
                  id.includes("node_modules/framer-motion/"),
                priority: 29,
              },
              {
                name: "vendor-supabase",
                test: (id: string) =>
                  id.includes("node_modules/@supabase/supabase-js/"),
                priority: 28,
              },
              {
                name: "shared-core",
                test: (id: string) =>
                  id.includes("src/components/ui/buttons/Button") ||
                  id.includes("src/components/ui/cards/Card") ||
                  id.includes("src/components/ui/forms/Input") ||
                  id.includes("src/components/ui/badge") ||
                  id.includes("src/shared/lib/cn") ||
                  id.includes("src/lib/logger") ||
                  id.includes("src/components/ui/tabs") ||
                  id.includes("src/components/ui/avatar") ||
                  id.includes("src/components/ui/progress") ||
                  id.includes("src/features/auth/useAuth") ||
                  id.includes("src/lib/demo-registration") ||
                  id.includes("src/hooks/useToast") ||
                  id.includes("src/hooks/usePersistedState") ||
                  id.includes("src/integrations/supabase/client") ||
                  id.includes("src/lib/app-config") ||
                  id.includes("src/config/app-config") ||
                  id.includes("src/lib/anonymous") ||
                  id.includes("src/lib/friends") ||
                  id.includes("src/hooks/useFeatures") ||
                  id.includes("src/components/TokensSubnav") ||
                  id.includes("src/components/ui/SafeImage") ||
                  id.includes("src/components/ui/Modal") ||
                  id.includes("src/components/ui/UnifiedCard") ||
                  id.includes("src/services/payments/NFTService") ||
                  // Ronda 15 (stream C): TokenService lo importan Chat,
                  // Tokens, ChatRoomService y varios servicios — sin grupo
                  // propio el chunking automático lo metía en pages-chat
                  // (lo arrastraba useTokens → /tokens). Es pequeño
                  // (solo supabase + logger) y compartido: a shared-core.
                  id.includes("src/services/payments/TokenService") ||
                  // Ronda 15 (stream C): el entry (main → App → MainLayout
                  // → Index/Discover/DemoSelector) importaba estáticamente
                  // módulos que vivían en los chunks gigantes, así que el
                  // BOOT precargaba pages-large/chat/profiles (~9 MB) y el
                  // hilo principal se saturaba parseándolos: al navegar
                  // con el dock, el chunk de la ruta (pequeño) esperaba a
                  // que el hilo se liberara. Estos 9 módulos son pequeños
                  // (cada uno solo depende de shared-core o de datos demo)
                  // y los usa el layout/la home: a shared-core, para que
                  // el boot ya no arrastre ningún chunk gigante.
                  id.includes("src/lib/intimateChat") ||
                  id.includes("src/features/profile/useProfileTheme") ||
                  id.includes("src/components/modals/compliance-signup-form") ||
                  id.includes("src/components/modals/FeatureModal") ||
                  id.includes("src/components/profiles/shared/DistanceBadge") ||
                  id.includes("src/utils/discover/generateRandomProfiles") ||
                  id.includes("src/components/modals/CompatibilityModal") ||
                  id.includes("src/components/Footer") ||
                  id.includes(
                    "src/services/social/couple/AdvancedCoupleService",
                  ) ||
                  // Ronda 15 (stream C): MatchService lo usa Discover (en
                  // el entry) para likes/matches — sin grupo propio vivía
                  // en pages-large y era el último vínculo que precargaba
                  // el gigante en el boot. Solo depende de supabase +
                  // logger: a shared-core. (Discover además importaba el
                  // barril `@/services/social`: ahora importa directo.)
                  id.includes("src/services/social/social/MatchService") ||
                  id.includes("src/services/payments/WalletService") ||
                  id.includes("src/features/auth/useBiometricAuth") ||
                  id.includes("src/components/ui/switch") ||
                  id.includes("src/components/ui/label") ||
                  id.includes("src/components/ui/textarea") ||
                  id.includes("src/components/ui/checkbox") ||
                  id.includes("src/components/ui/radio-group") ||
                  id.includes("src/components/ui/dropdown-menu") ||
                  id.includes("src/components/ui/tooltip") ||
                  id.includes("src/components/ui/forms/file-upload") ||
                  id.includes("src/components/DecorativeHearts") ||
                  id.includes("src/lib/geolocation") ||
                  id.includes("src/hooks/useGeolocation") ||
                  id.includes("src/lib/demo-wallet") ||
                  id.includes("src/lib/imageService") ||
                  id.includes("src/lib/profile-interests") ||
                  id.includes("src/lib/env-utils") ||
                  id.includes("src/lib/safe-storage") ||
                  id.includes("src/lib/notifications") ||
                  id.includes("src/lib/profileCompleteness") ||
                  id.includes("src/lib/profileLabels") ||
                  id.includes("src/lib/secureMediaService") ||
                  id.includes("src/lib/storage/private-media") ||
                  id.includes("src/lib/advancedFeatures") ||
                  id.includes("src/components/wallet/DemoWallet") ||
                  id.includes(
                    "src/services/social/notifications/OneSignalService",
                  ),
                priority: 26,
              },
              {
                name: "vendor-utils",
                test: (id: string) =>
                  id.includes("node_modules/date-fns/") ||
                  id.includes("node_modules/crypto-js/") ||
                  id.includes("node_modules/ethers/"),
                priority: 27,
              },
              {
                name: "pages-large",
                test: (id: string) =>
                  id.includes("src/pages/TokensInfo") ||
                  id.includes("src/pages/profiles/single/ProfileSingle"),
                priority: 25,
              },
              {
                name: "pages-chat",
                test: (id: string) =>
                  id.includes("src/pages/Chat") ||
                  id.includes("src/pages/ChatInfo"),
                priority: 24,
              },
              {
                name: "pages-ai",
                test: (id: string) =>
                  id.includes("src/pages/AIControlCenter") ||
                  id.includes("src/components/ai/LegalChatBox") ||
                  id.includes("src/ai/useLocalAI") ||
                  id.includes("src/ai/AIWorker"),
                priority: 23,
              },
              {
                name: "pages-profiles",
                test: (id: string) =>
                  id.includes("src/pages/profiles/shared/Profiles") ||
                  id.includes("src/pages/profiles/shared/ProfileDetail"),
                priority: 22,
              },
            ],
          },
        },
      },
      cssCodeSplit: true,
      // Configuración de compatibilidad para Android WebViews (Android 10 - 17)
      chunkSizeWarningLimit: 6000,
      target: "es2020",
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
