import { TooltipProvider } from "@/components/ui/tooltip";
// CRÍTICO: Importar QueryClient de forma segura - verificar que React esté disponible
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/styles/android-grid.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CrossBrowserOptimizer } from "@/components/ui/CrossBrowserOptimizer";
import { AccessibilityEnhancer } from "@/components/ui/AccessibilityEnhancer";
import { MobileOptimizer } from "@/components/ui/MobileOptimizer";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { lazy } from "react";
import { lazyWithDefault } from "@/utils/lazyWithDefault";
import { AnimationProvider } from "@/components/animations/AnimationProvider";
import { NotificationProvider } from "@/components/animations/NotificationSystem";
import AdminRoute from "@/components/auth/AdminRoute";
import ModeratorRoute from "@/components/auth/ModeratorRoute";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AppFactory } from "@/demo/AppFactory";
import { MainLayout } from "@/components/layout/MainLayout";
import ProfileLayout from "@/layouts/ProfileLayout";

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
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import Events from "@/pages/Events";
import { Discover } from "@/pages/Discover";
import { Demo } from "@/pages/Demo";

// Lazy loaded pages for performance optimization - Core features
const Profiles = lazyWithDefault(() => import("@/pages/profiles/shared/Profiles"));
const ProfileDetail = lazy(
  () => import("@/pages/profiles/shared/ProfileDetail"),
);
const Chat = lazyWithDefault(() => import("@/pages/Chat"));
const ChatInfo = lazyWithDefault(() => import("@/pages/ChatInfo"));
const Matches = lazyWithDefault(() => import("@/pages/Matches"));
const Requests = lazyWithDefault(() => import("@/pages/Requests"));
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
const LeyOlimpia = lazyWithDefault(() => import("@/pages/LeyOlimpia"));
const Construction = lazyWithDefault(() => import("@/pages/Construction"));

// Token system - separate chunk
const Tokens = lazyWithDefault(() => import("@/pages/Tokens"));
const TokensInfo = lazyWithDefault(() => import("@/pages/TokensInfo"));
const TokensPrivacy = lazyWithDefault(() => import("@/pages/TokensPrivacy"));
const TokensTerms = lazyWithDefault(() => import("@/pages/TokensTerms"));
const TokensLegal = lazyWithDefault(() => import("@/pages/TokensLegal"));
const AIControlCenter = lazyWithDefault(() => import("@/pages/AIControlCenter"));

// Admin pages - separate chunk
const Admin = lazyWithDefault(() => import("@/pages/admin/Admin"));
const AdminProduction = lazyWithDefault(() => import("@/pages/admin/AdminProduction"));
const AdminUsers = lazyWithDefault(() => import("@/pages/admin/Users"));
const AdminPartners = lazyWithDefault(() => import("@/pages/admin/AdminPartners"));

// Clubs system
const Clubs = lazyWithDefault(() => import("@/pages/Clubs"));

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
const AdminModerators = lazyWithDefault(() => import("@/pages/admin/AdminModerators"));
const AdminAnalytics = lazyWithDefault(() => import("@/pages/admin/AdminAnalytics"));
const ModeratorDashboard = lazyWithDefault(() => import("@/pages/ModeratorDashboard"));
const ModeratorRequest = lazyWithDefault(() => import("@/pages/ModeratorRequest"));
const Moderators = lazyWithDefault(() => import("@/pages/Moderators"));
const Blog = lazyWithDefault(() => import("@/pages/Blog"));
const ChatAuthenticated = lazyWithDefault(() => import("@/pages/ChatAuthenticated"));
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
          <CrossBrowserOptimizer>
            <AccessibilityEnhancer>
              <MobileOptimizer>
                <AnimationProvider>
                  <NotificationProvider>
                    <AppFactory>
                      <Router>
                        <Routes>
                          {/* Main Layout wraps all pages except maybe standalone ones if any */}
                          <Route element={<MainLayout />}>
                            <Route path="/" element={<Index />} />
                            <Route
                              path="/auth"
                              element={
                                <ProtectedRoute requireAuth={false}>
                                  <Auth />
                                </ProtectedRoute>
                              }
                            />
                            <Route path="/demo" element={<Demo />} />
                            <Route path="/faq" element={<FAQ />} />
                            <Route path="/feed" element={<Feed />} />
                            <Route path="/profiles" element={<Profiles />} />

                            <Route element={<ProfileLayout />}>
                              <Route
                                path="/profile/:id"
                                element={<ProfileDetail />}
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
                            <Route path="/chat-info" element={<ChatInfo />} />
                            <Route path="/matches" element={<Matches />} />
                            <Route path="/requests" element={<Requests />} />
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
                              element={<AIControlCenter />}
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
                                  <Admin />
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
                            <Route
                              path="/ley-olimpia"
                              element={<LeyOlimpia />}
                            />
                            <Route
                              path="/construction"
                              element={<Construction />}
                            />
                            <Route path="/video-chat" element={<VideoChat />} />
                            <Route path="/vip-events" element={<VIPEvents />} />
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
                            <Route path="/clubs" element={<Clubs />} />
                            <Route path="/clubs/:slug" element={<Clubs />} />
                            <Route
                              path="/moderators/dashboard"
                              element={
                                <ModeratorRoute>
                                  <ModeratorDashboard />
                                </ModeratorRoute>
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
                            <Route path="/donations" element={<Donations />} />
                            <Route path="/invest" element={<Invest />} />
                            <Route
                              path="/template-demo"
                              element={<TemplateDemo />}
                            />
                            <Route path="/news" element={<News />} />
                            <Route
                              path="/notifications"
                              element={<Notifications />}
                            />
                            <Route path="/investors" element={<Investors />} />
                            <Route path="/nfts" element={<NFTs />} />
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
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
