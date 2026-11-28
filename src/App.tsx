// ============================================================================
// ESTRATEGIA DE CARGA DE PÁGINAS
// ============================================================================
//
// PÁGINAS CRÍTICAS (Carga Inmediata):
// - Index: Página principal, debe cargar instantáneamente
// - Auth: Autenticación, crítica para el flujo de usuario
// - NotFound: Página de error, debe estar siempre disponible
// - Events: Página principal de eventos
// - Discover: Página principal de descubrimiento
//
// PÁGINAS CORE (Lazy Loading):
// - Profiles, ProfileDetail: Funcionalidades principales
// - Chat, ChatInfo: Sistema de chat
// - Matches: Sistema de matches
//
// PÁGINAS ADMIN (Lazy Loading):
// - Admin*, Moderator*: Panel administrativo
//
// PÁGINAS SECUNDARIAS (Lazy Loading):
// - About, Terms, Privacy, etc.: Páginas informativas
// ============================================================================

// Critical pages - loaded immediately
// CRÍTICO: Importar QueryClient de forma segura - verificar que React esté disponible

import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/styles/android-grid.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { CrossBrowserOptimizer } from "@/components/ui/CrossBrowserOptimizer";
import { AccessibilityEnhancer } from "@/components/ui/AccessibilityEnhancer";
import { MobileOptimizer } from "@/components/ui/MobileOptimizer";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { lazy } from "react";
import { lazyWithDefault } from "@/utils/lazyWithDefault";
import { AnimationProvider } from "@/components/animations/AnimationProvider";
import { NotificationProvider } from "@/components/animations/NotificationSystem";
import { APP_ROUTER_USE_TRANSITIONS } from "@/utils/routerConfig";
import AdminRoute from "@/components/auth/AdminRoute";
import ModeratorRoute from "@/components/auth/ModeratorRoute";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AppFactory } from "@/demo/AppFactory";
import { MainLayout } from "@/components/layout/MainLayout";
import ProfileLayout from "@/layouts/ProfileLayout";
import { LoadingProvider } from "@/contexts/LoadingContext";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import Events from "@/pages/Events";
import { Discover } from "@/pages/Discover";
import { Demo } from "@/pages/Demo";
import { ProfileDetailRoute } from "@/pages/ProfileDetailRoute";
import { ImperativeLazyRoute } from "@/pages/ImperativeLazyRoute";

// Lazy loaded pages for performance optimization - Core features
// RONDA 27 (stream B): /profiles ya NO es un `lazy` pelado. El
// chunk se quedaba colgado sin cota y el PageLoader ("Cargando...")
// no tenía salida (test dirigido PR #88: >10 s en "Cargando...").
// Misma exposición al retry perdido del Suspense que /profile/:id
// en la ronda 19 y /requests en la ronda 22. ImperativeLazyRoute
// carga el chunk con tope de 15 s y error con Reintentar; el
// importador es const a nivel de módulo (identidad estable) para
// que el `useEffect` de ImperativeLazyRoute no recargue el chunk
// en cada re-render de App. No hay const lazy de Profiles: se
// importa inline en la ruta.
// RONDA 18 (stream B): /profile/:id ya NO es un `lazy` pelado.
// El chunk `pages-profiles` se quedaba colgado sin cota y el
// PageLoader ("Cargando...") no tenía salida (test dirigido ronda 17,
// PR #77, DO NOT MERGE). ProfileDetailRoute carga el chunk con tope
// de 15 s y error con Reintentar; ver ese archivo.
const Chat = lazyWithDefault(() => import("@/pages/Chat"));
const ChatIntimo = lazyWithDefault(() => import("@/pages/ChatIntimo"));
const ChatInfo = lazyWithDefault(() => import("@/pages/ChatInfo"));
const Matches = lazyWithDefault(() => import("@/pages/Matches"));
// RONDA 21 (stream A, FAIL 1): /friends era 404 — no existía la ruta
// ni la página. Friends lista los amigos con el mismo patrón que
// Matches / Requests.
const Friends = lazyWithDefault(() => import("@/pages/Friends"));
const SwingerDashboard = lazyWithDefault(
  () => import("@/pages/SwingerDashboard"),
);
const Settings = lazyWithDefault(() => import("@/pages/Settings"));
const Premium = lazyWithDefault(() => import("@/pages/Premium"));
const Dashboard = lazyWithDefault(() => import("@/pages/Dashboard"));

// Secondary pages - loaded on demand
const FAQ = lazyWithDefault(() => import("@/pages/FAQ"));
const Terms = lazyWithDefault(() => import("@/pages/Terms"));
const Privacy = lazyWithDefault(() => import("@/pages/Privacy"));
const Support = lazyWithDefault(() => import("@/pages/Support"));
const ProjectInfo = lazyWithDefault(() => import("@/pages/ProjectInfo"));
const Security = lazyWithDefault(() => import("@/pages/Security"));
const Guidelines = lazyWithDefault(() => import("@/pages/Guidelines"));
const Legal = lazyWithDefault(() => import("@/pages/Legal"));
// RONDA 21 (stream A, FAIL 5): /ley-olimpia ya NO es un `lazy`
// pelado. El chunk se quedaba colgado sin cota y el PageLoader
// ("Cargando...") no tenía salida (misma exposición al retry perdido
// del Suspense que /profile/:id en la ronda 19). ImperativeLazyRoute
// carga el chunk con tope de 15 s y error con Reintentar; ver ese
// archivo. LeyOlimpia se importa inline en la ruta (no hay const
// lazy), igual que el chunk de perfiles.
const Construction = lazyWithDefault(() => import("@/pages/Construction"));

// Token system - separate chunk
const Tokens = lazyWithDefault(() => import("@/pages/Tokens"));
const TokensInfo = lazyWithDefault(() => import("@/pages/TokensInfo"));
const TokensPrivacy = lazyWithDefault(() => import("@/pages/TokensPrivacy"));
const TokensTerms = lazyWithDefault(() => import("@/pages/TokensTerms"));
const TokensLegal = lazyWithDefault(() => import("@/pages/TokensLegal"));
// RONDA 28 (bloque N): /ai-help ya NO es un `lazy` pelado. El icono
// ✨ ("IA Ayuda") del dock abría la página y se quedaba en PageLoader
// ("Cargando...") sin resolver (captura 433017_16, 04:09 CST): misma
// exposición al retry perdido del Suspense que /profiles (ronda 27),
// /requests (ronda 22) y /admin/dashboard (ronda 21) — el chunk de
// AIControlCenter arrastra WebLLM (el más pesado de los lazy) y sin
// tope el loader no tenía salida. ImperativeLazyRoute carga el chunk
// con tope de 15 s y error con Reintentar; el importador es const a
// nivel de módulo (identidad estable), igual que importProfilesChunk.
// No hay rama demo que añadir: la página es estática + LegalChatBox
// (IA local, sin Supabase); el modelo se descarga en segundo plano
// dentro de la tarjeta, con su propio estado de error.
const importAiHelpChunk = () => import("@/pages/AIControlCenter");

// Admin pages - separate chunk
// RONDA 21 (stream A, FAIL 2): /admin/dashboard ya NO es un `lazy`
// pelado bajo el Suspense de MainLayout (misma exposición al retry
// perdido que /profile/:id en la ronda 19: loader congelado >24 s).
// ImperativeLazyRoute carga el chunk con tope de 15 s y error con
// Reintentar; el `Admin` nombrado (sin default) lo resuelve el
// wrapper (primer export), igual que lazyWithDefault. No hay const
// lazy de Admin: se importa inline en la ruta.
// Ronda 21 (coordinador): los importadores son consts a nivel de
// módulo (identidad estable): una flecha inline en la ruta sería una
// función nueva en cada render de App y el `useEffect` de
// ImperativeLazyRoute (deps `[importer, ...]`) recargaría el chunk
// con un flash de PageLoader en cada re-render.
const importAdminChunk = () => import("@/pages/admin/Admin");
const importLeyOlimpiaChunk = () => import("@/pages/LeyOlimpia");
// RONDA 27 (stream B): importador de /profiles, ver comentario de
// arriba (mismo patrón que importRequestsChunk, ronda 22).
const importProfilesChunk = () => import("@/pages/profiles/shared/Profiles");
// RONDA 22 (stream C): /requests ya NO es un `lazy` pelado. Misma
// exposición al retry perdido del Suspense que /admin/dashboard y
// /ley-olimpia en la ronda 21 (test dirigido PR #81, 2026-11-27
// 00:47-01:08 CST): PageLoader ("Cargando...") congelado >18 s en la
// primera carga, solo salía con recarga manual. ImperativeLazyRoute
// carga el chunk con tope de 15 s y error con Reintentar.
const importRequestsChunk = () => import("@/pages/Requests");
// Ronda 22 (stream A): /moderators/dashboard usa el mismo patrón
// imperativo que /admin/dashboard (FAIL 2 ronda 21). Su `lazy` pelado
// bajo el Suspense de MainLayout dejaba el loader congelado >15 s en
// la primera carga (test dirigido PR #81, 00:47–01:08 CST 27 nov).
// Mismo tope de 15 s y panel de error con Reintentar; el importador
// es const a nivel de módulo (identidad estable) para que el
// `useEffect` de ImperativeLazyRoute no recargue el chunk en cada
// re-render de App. El módulo solo exporta el default
// (ModeratorDashboard), que el wrapper resuelve igual que
// lazyWithDefault.
const importModeratorDashboardChunk = () =>
  import("@/pages/moderators/ModeratorDashboard");
const AdminSelectDashboard = lazyWithDefault(
  () => import("@/pages/admin/AdminSelectDashboard"),
);
const AdminProduction = lazyWithDefault(
  () => import("@/pages/admin/AdminProduction"),
);
const AdminUsers = lazyWithDefault(() => import("@/pages/admin/Users"));
const AdminPartners = lazyWithDefault(
  () => import("@/pages/admin/AdminPartners"),
);

// Clubs system
const Clubs = lazyWithDefault(() => import("@/pages/Clubs"));
const ClubsComingSoon = lazyWithDefault(
  () => import("@/pages/ClubsComingSoon"),
);
const ClubsDemo = lazyWithDefault(() => import("@/pages/ClubsDemo"));
const ClubsPublic = lazyWithDefault(() => import("@/pages/ClubsPublic"));

// Shop CMPX tokens
const Shop = lazyWithDefault(() => import("@/pages/Shop"));

// Stories info pages
const StoriesInfo = lazyWithDefault(() => import("@/pages/StoriesInfo"));
const ProfileSingle = lazy(
  () => import("@/pages/profiles/single/ProfileSingle"),
);
const Stories = lazyWithDefault(() => import("@/pages/Stories"));
const ProfileCouple = lazy(
  () =>
    import("@/pages/profiles/couple/ProfileCouple") as Promise<{
      default: any;
    }>,
);
const EditProfileSingle = lazy(
  () => import("@/pages/profiles/single/EditProfileSingle"),
);
const EditProfileCouple = lazy(
  () => import("@/pages/profiles/couple/EditProfileCouple"),
);
const Feed = lazyWithDefault(() => import("@/pages/Feed"));
const VideoChat = lazyWithDefault(() => import("@/pages/VideoChat"));
const VIPEvents = lazyWithDefault(() => import("@/pages/VIPEvents"));
const VirtualGifts = lazyWithDefault(() => import("@/pages/VirtualGifts"));
const Marketplace = lazyWithDefault(() => import("@/pages/Marketplace"));
const Info = lazyWithDefault(() => import("@/pages/Info"));
const About = lazyWithDefault(() => import("@/pages/About"));
const Careers = lazyWithDefault(() => import("@/pages/Careers"));
const AdminCareerApplications = lazy(
  () => import("@/pages/admin/AdminCareerApplications"),
);
const AdminModerators = lazyWithDefault(
  () => import("@/pages/admin/AdminModerators"),
);
const AdminAnalytics = lazyWithDefault(
  () => import("@/pages/admin/AdminAnalytics"),
);
const ModeratorRequest = lazyWithDefault(
  () => import("@/pages/ModeratorRequest"),
);
const Moderators = lazyWithDefault(() => import("@/pages/Moderators"));
const Blog = lazyWithDefault(() => import("@/pages/Blog"));
const ChatAuthenticated = lazyWithDefault(
  () => import("@/pages/ChatAuthenticated"),
);
const Donations = lazyWithDefault(() => import("@/pages/Donations"));
const Invest = lazyWithDefault(() => import("@/pages/Invest"));
const TemplateDemo = lazyWithDefault(() => import("@/pages/TemplateDemo"));
const News = lazyWithDefault(() => import("@/pages/News"));
const Notifications = lazyWithDefault(() => import("@/pages/Notifications"));
const Investors = lazyWithDefault(() => import("@/pages/Investors"));
const NFTs = lazyWithDefault(() => import("@/pages/NFTs"));

// CRÍTICO: Crear QueryClient fuera del componente para evitar recreación en cada render
// Configuración optimizada para producción
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos (antes cacheTime)
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <LoadingProvider>
            <CrossBrowserOptimizer>
              <AccessibilityEnhancer>
                <MobileOptimizer>
                  <AnimationProvider>
                    <NotificationProvider>
                      <AppFactory>
                        {/* RONDA 17 (stream A): `useTransitions={false}`
                            (ver src/utils/routerConfig.ts). Con el valor
                            por defecto (`true`) cada navegación va en
                            `startTransition` y, con el chunk destino en
                            frío, React retiene la vista vieja sin
                            loader — el síntoma de la ronda 16 en los 5
                            caminos. En urgente, el fallback de
                            MainLayout commitea de inmediato. */}
                        <Router useTransitions={APP_ROUTER_USE_TRANSITIONS}>
                          <Routes>
                            {/* Main Layout wraps all pages except maybe standalone ones if any */}
                            <Route element={<MainLayout />}>
                              <Route path="/" element={<Index />} />
                              {/* /landing es la misma landing pública que
                                  "/" (ronda 6, punto 14): antes era 404.
                                  Index ya redirige al perfil propio
                                  cuando hay sesión. */}
                              <Route path="/landing" element={<Index />} />
                              <Route
                                path="/auth"
                                element={
                                  <ProtectedRoute requireAuth={false}>
                                    <Auth />
                                  </ProtectedRoute>
                                }
                              />
                              {/* Ronda 6: /register, /signup y /login eran 404
                                (solo existía /auth). Redirigen al flujo que
                                funciona; /register y /signup abren la
                                pestaña de registro de /auth. */}
                              <Route
                                path="/register"
                                element={
                                  <Navigate to="/auth?tab=signup" replace />
                                }
                              />
                              <Route
                                path="/signup"
                                element={
                                  <Navigate to="/auth?tab=signup" replace />
                                }
                              />
                              <Route
                                path="/login"
                                element={<Navigate to="/auth" replace />}
                              />
                              <Route path="/demo" element={<Demo />} />
                              <Route path="/faq" element={<FAQ />} />
                              <Route path="/feed" element={<Feed />} />
                              <Route
                                path="/profiles"
                                element={
                                  <ImperativeLazyRoute
                                    importer={importProfilesChunk}
                                    chunkName="pages-profiles"
                                    errorTitle="No se pudo cargar la página de perfiles"
                                    fallbackPath="/"
                                    fallbackLabel="Volver al inicio"
                                  />
                                }
                              />

                              <Route
                                element={
                                  <ProtectedRoute>
                                    <ProfileLayout />
                                  </ProtectedRoute>
                                }
                              >
                                <Route
                                  path="/profile/:id"
                                  element={<ProfileDetailRoute />}
                                />
                                <Route
                                  path="/profile"
                                  element={<ProfileSingle />}
                                />
                                <Route
                                  path="/profile-single"
                                  element={<ProfileSingle />}
                                />
                                <Route
                                  path="/profile-couple"
                                  element={<ProfileCouple />}
                                />
                                <Route
                                  path="/edit-profile-single"
                                  element={<EditProfileSingle />}
                                />
                                <Route
                                  path="/edit-profile-couple"
                                  element={<EditProfileCouple />}
                                />
                              </Route>
                              <Route path="/events" element={<Events />} />
                              <Route
                                path="/chat/:id"
                                element={
                                  <ProtectedRoute>
                                    <Chat />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="/chat"
                                element={
                                  <ProtectedRoute>
                                    <Chat />
                                  </ProtectedRoute>
                                }
                              />
                              {/* Ronda 6: /chat-intimo existía como idea pero
                                era 404; abre el mismo chat íntimo del dock
                                a pantalla completa, con "Cerrar" a
                                /requests. */}
                              <Route
                                path="/chat-intimo"
                                element={
                                  <ProtectedRoute>
                                    <ChatIntimo />
                                  </ProtectedRoute>
                                }
                              />
                              <Route path="/chat-info" element={<ChatInfo />} />
                              <Route path="/matches" element={<Matches />} />
                              <Route path="/friends" element={<Friends />} />
                              <Route
                                path="/requests"
                                element={
                                  <ImperativeLazyRoute
                                    importer={importRequestsChunk}
                                    chunkName="pages-requests"
                                    errorTitle="No se pudo cargar la página de solicitudes"
                                    fallbackPath="/"
                                    fallbackLabel="Volver al inicio"
                                  />
                                }
                              />
                              <Route path="/discover" element={<Discover />} />
                              <Route path="/stories" element={<Stories />} />
                              <Route
                                path="/stories/info"
                                element={<StoriesInfo />}
                              />
                              <Route
                                path="/stories/features"
                                element={<StoriesInfo />}
                              />
                              <Route
                                path="/stories/benefits"
                                element={<StoriesInfo />}
                              />
                              <Route
                                path="/tokens"
                                element={
                                  <ProtectedRoute>
                                    <Tokens />
                                  </ProtectedRoute>
                                }
                              />
                              <Route path="/settings" element={<Settings />} />
                              <Route
                                path="/swinger-dashboard"
                                element={<SwingerDashboard />}
                              />
                              <Route path="/premium" element={<Premium />} />
                              <Route
                                path="/dashboard"
                                element={
                                  <ProtectedRoute>
                                    <Dashboard />
                                  </ProtectedRoute>
                                }
                              />
                              <Route path="/support" element={<Support />} />
                              <Route path="/terms" element={<Terms />} />
                              <Route path="/privacy" element={<Privacy />} />
                              <Route
                                path="/tokens-info"
                                element={<TokensInfo />}
                              />
                              <Route
                                path="/tokens-privacy"
                                element={<TokensPrivacy />}
                              />
                              <Route
                                path="/tokens-terms"
                                element={<TokensTerms />}
                              />
                              <Route
                                path="/tokens-legal"
                                element={<TokensLegal />}
                              />
                              <Route
                                path="/ai-help"
                                element={
                                  <ImperativeLazyRoute
                                    importer={importAiHelpChunk}
                                    chunkName="pages-ai-help"
                                    errorTitle="No se pudo cargar la IA Ayuda"
                                    fallbackPath="/"
                                    fallbackLabel="Volver al inicio"
                                  />
                                }
                              />
                              <Route path="/shop" element={<Shop />} />
                              <Route
                                path="/project-info"
                                element={<ProjectInfo />}
                              />
                              <Route
                                path="/admin"
                                element={
                                  <AdminRoute>
                                    <AdminSelectDashboard />
                                  </AdminRoute>
                                }
                              />
                              <Route
                                path="/admin/dashboard"
                                element={
                                  <AdminRoute>
                                    <ImperativeLazyRoute
                                      importer={importAdminChunk}
                                      chunkName="pages-admin"
                                      errorTitle="No se pudo cargar el panel de administración"
                                      fallbackPath="/"
                                      fallbackLabel="Volver al inicio"
                                    />
                                  </AdminRoute>
                                }
                              />
                              <Route
                                path="/admin-production"
                                element={
                                  <AdminRoute>
                                    <AdminProduction />
                                  </AdminRoute>
                                }
                              />
                              <Route
                                path="/admin/users"
                                element={
                                  <AdminRoute>
                                    <AdminUsers />
                                  </AdminRoute>
                                }
                              />
                              <Route path="/security" element={<Security />} />
                              <Route
                                path="/guidelines"
                                element={<Guidelines />}
                              />
                              <Route path="/legal" element={<Legal />} />
                              {/* Ronda 8 (punto 12/13a): /docs/legal/ no tenía
                                ruta y caía en el catch-all 404 aunque el
                                rewrite de Vercel sí sirve index.html. Es
                                el mismo índice legal estilizado de /legal
                                (React Router ignora la barra final, así que
                                /docs/legal/ también casa). Los .md crudos
                                de public/docs/legal/ se siguen sirviendo
                                como estáticos y no pasan por el SPA. */}
                              <Route path="/docs/legal" element={<Legal />} />
                              {/* Ronda 21 (stream A, FAIL 4): /docs/legal
                                existía como índice pero /docs/legal/terms
                                caía en el catch-all 404 aunque el índice
                                lo lista (con styledRoute "/terms"). Las
                                tres URLs directas reutilizan las páginas
                                existentes; /docs/legal/ley-olimpia usa el
                                mismo wrapper imperativo que /ley-olimpia
                                (FAIL 5). */}
                              <Route
                                path="/docs/legal/terms"
                                element={<Terms />}
                              />
                              <Route
                                path="/docs/legal/privacy"
                                element={<Privacy />}
                              />
                              <Route
                                path="/docs/legal/ley-olimpia"
                                element={
                                  <ImperativeLazyRoute
                                    importer={importLeyOlimpiaChunk}
                                    chunkName="pages-ley-olimpia"
                                    errorTitle="No se pudo cargar el documento"
                                    fallbackPath="/docs/legal"
                                    fallbackLabel="Volver a documentos legales"
                                  />
                                }
                              />
                              <Route
                                path="/ley-olimpia"
                                element={
                                  <ImperativeLazyRoute
                                    importer={importLeyOlimpiaChunk}
                                    chunkName="pages-ley-olimpia"
                                    errorTitle="No se pudo cargar el documento"
                                    fallbackPath="/docs/legal"
                                    fallbackLabel="Volver a documentos legales"
                                  />
                                }
                              />
                              {!import.meta.env.PROD && (
                                <Route
                                  path="/construction"
                                  element={<Construction />}
                                />
                              )}
                              <Route
                                path="/video-chat"
                                element={<VideoChat />}
                              />
                              <Route
                                path="/vip-events"
                                element={<VIPEvents />}
                              />
                              <Route
                                path="/virtual-gifts"
                                element={<VirtualGifts />}
                              />
                              <Route
                                path="/marketplace"
                                element={<Marketplace />}
                              />
                              <Route path="/info" element={<Info />} />
                              <Route path="/about" element={<About />} />
                              <Route path="/careers" element={<Careers />} />
                              <Route
                                path="/admin/career-applications"
                                element={
                                  <AdminRoute>
                                    <AdminCareerApplications />
                                  </AdminRoute>
                                }
                              />
                              <Route
                                path="/admin/moderators"
                                element={
                                  <AdminRoute>
                                    <AdminModerators />
                                  </AdminRoute>
                                }
                              />
                              <Route
                                path="/admin/analytics"
                                element={
                                  <AdminRoute>
                                    <AdminAnalytics />
                                  </AdminRoute>
                                }
                              />
                              <Route
                                path="/admin/partners"
                                element={
                                  <AdminRoute>
                                    <AdminPartners />
                                  </AdminRoute>
                                }
                              />
                              <Route
                                path="/clubs/demo"
                                element={<ClubsDemo />}
                              />
                              <Route path="/clubs" element={<Clubs />} />
                              <Route path="/clubs/:slug" element={<Clubs />} />
                              <Route
                                path="/clubs-public"
                                element={<ClubsPublic />}
                              />
                              <Route
                                path="/clubs-public/:slug"
                                element={<ClubsPublic />}
                              />
                              <Route
                                path="/clubs-coming-soon"
                                element={<ClubsComingSoon />}
                              />
                              <Route
                                path="/moderators/dashboard"
                                element={
                                  <ModeratorRoute>
                                    <ImperativeLazyRoute
                                      importer={importModeratorDashboardChunk}
                                      chunkName="pages-moderators-dashboard"
                                      errorTitle="No se pudo cargar el panel de moderación"
                                      fallbackPath="/moderators"
                                      fallbackLabel="Volver a moderadores"
                                    />
                                  </ModeratorRoute>
                                }
                              />
                              {/* Ronda 21 (stream A, FAIL 3): el botón
                                «Dashboard Demo» de /moderators navegaba
                                a /moderator-dashboard, que no existía
                                (404). Ya apunta a /moderators/dashboard;
                                este redirect cubre enlaces/marcadores
                                viejos (patrón ronda 6). */}
                              <Route
                                path="/moderator-dashboard"
                                element={
                                  <Navigate
                                    to="/moderators/dashboard"
                                    replace
                                  />
                                }
                              />
                              <Route
                                path="/moderators"
                                element={<Moderators />}
                              />
                              <Route
                                path="/moderator-request"
                                element={<ModeratorRequest />}
                              />
                              <Route path="/blog" element={<Blog />} />
                              <Route
                                path="/chat-authenticated"
                                element={<ChatAuthenticated />}
                              />
                              <Route
                                path="/donations"
                                element={<Donations />}
                              />
                              <Route path="/invest" element={<Invest />} />
                              {!import.meta.env.PROD && (
                                <Route
                                  path="/template-demo"
                                  element={<TemplateDemo />}
                                />
                              )}
                              <Route path="/news" element={<News />} />
                              <Route
                                path="/notifications"
                                element={<Notifications />}
                              />
                              <Route
                                path="/investors"
                                element={<Investors />}
                              />
                              <Route path="/nfts" element={<NFTs />} />
                              {/* Ronda 8 (punto 13): /404 NO existía como
                                ruta. El ErrorBoundary raíz (main.tsx)
                                redirige en producción a /404 ante
                                cualquier error de render, así que un error
                                en cualquier página terminaba en el
                                catch-all "*" con la página 404. Con ruta
                                propia, /404 es una ruta real y el error
                                muestra la misma página 404 por diseño,
                                no por un hueco del router. */}
                              <Route path="/404" element={<NotFound />} />
                              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                              <Route path="*" element={<NotFound />} />
                            </Route>
                          </Routes>
                        </Router>
                      </AppFactory>
                    </NotificationProvider>
                  </AnimationProvider>
                </MobileOptimizer>
              </AccessibilityEnhancer>
            </CrossBrowserOptimizer>
          </LoadingProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
