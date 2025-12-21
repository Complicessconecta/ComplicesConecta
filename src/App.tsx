import { TooltipProvider } from "@/components/ui/tooltip";
// CRÍTICO: Importar QueryClient de forma segura - verificar que React esté disponible
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import '@/styles/android-grid.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CrossBrowserOptimizer } from '@/components/ui/CrossBrowserOptimizer';
import { AccessibilityEnhancer } from '@/components/ui/AccessibilityEnhancer';
import { MobileOptimizer } from '@/components/ui/MobileOptimizer';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { lazy } from "react";
import { AnimationProvider } from "@/components/animations/AnimationProvider";
import { NotificationProvider } from "@/components/animations/NotificationSystem";
import AdminRoute from '@/components/auth/AdminRoute';
import ModeratorRoute from '@/components/auth/ModeratorRoute';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AppFactory } from '@/demo/AppFactory';
import { MainLayout } from '@/components/layout/MainLayout';


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
import Discover from "@/pages/Discover";
import Demo from "@/pages/Demo";

// Lazy loaded pages for performance optimization - Core features
const Profiles = lazy(() => import("@/components/profiles/shared/Profiles"));
const ProfileDetail = lazy(() => import("@/components/profiles/shared/ProfileDetail"));
const Chat = lazy(() => import("@/pages/Chat"));
const ChatInfo = lazy(() => import("@/pages/ChatInfo"));
const Matches = lazy(() => import("@/pages/Matches"));
const Requests = lazy(() => import("@/pages/Requests"));
const Settings = lazy(() => import("@/pages/Settings"));
const Premium = lazy(() => import("@/pages/Premium"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));

// Secondary pages - loaded on demand
const FAQ = lazy(() => import("@/pages/FAQ"));
const Terms = lazy(() => import("@/pages/Terms"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Support = lazy(() => import("@/pages/Support"));
const ProjectInfo = lazy(() => import("@/pages/ProjectInfo"));
const Security = lazy(() => import("@/pages/Security"));
const Guidelines = lazy(() => import("@/pages/Guidelines"));
const Legal = lazy(() => import("@/pages/Legal"));

// Token system - separate chunk
const Tokens = lazy(() => import("@/pages/Tokens"));
const TokensInfo = lazy(() => import("@/pages/TokensInfo"));
const TokensPrivacy = lazy(() => import("@/pages/TokensPrivacy"));
const TokensTerms = lazy(() => import("@/pages/TokensTerms"));
const TokensLegal = lazy(() => import("@/pages/TokensLegal"));
const AIControlCenter = lazy(() => import("@/pages/AIControlCenter"));

// Admin pages - separate chunk
const Admin = lazy(() => import("@/pages/admin/Admin"));
const AdminProduction = lazy(() => import("@/pages/admin/AdminProduction"));
const AdminUsers = lazy(() => import("@/pages/admin/Users"));
const AdminPartners = lazy(() => import("@/pages/admin/AdminPartners"));

// Clubs system
const Clubs = lazy(() => import("@/pages/Clubs"));

// Shop CMPX tokens
const Shop = lazy(() => import("@/pages/Shop"));

// Stories info pages
const StoriesInfo = lazy(() => import("@/pages/StoriesInfo"));
const ProfileSingle = lazy(() => import("@/components/profiles/single/ProfileSingle"));
const Stories = lazy(() => import("@/pages/Stories"));
const ProfileCouple = lazy(
  () => import("@/components/profiles/couple/ProfileCouple") as Promise<{ default: any }>
);
const EditProfileSingle = lazy(() => import("@/components/profiles/single/EditProfileSingle"));
const EditProfileCouple = lazy(() => import("@/components/profiles/couple/EditProfileCouple"));
const Feed = lazy(() => import("@/pages/Feed"));
const VideoChat = lazy(() => import("@/pages/VideoChat"));
const VIPEvents = lazy(() => import("@/pages/VIPEvents"));
const VirtualGifts = lazy(() => import("@/pages/VirtualGifts"));
const Marketplace = lazy(() => import("@/pages/Marketplace"));
const Info = lazy(() => import("@/pages/Info"));
const About = lazy(() => import("@/pages/About"));
const Careers = lazy(() => import("@/pages/Careers"));
const AdminCareerApplications = lazy(() => import("@/pages/admin/AdminCareerApplications"));
const AdminModerators = lazy(() => import("@/pages/admin/AdminModerators"));
const AdminAnalytics = lazy(() => import("@/pages/admin/AdminAnalytics"));
const ModeratorDashboard = lazy(() => import("@/pages/ModeratorDashboard"));
const ModeratorRequest = lazy(() => import("@/pages/ModeratorRequest"));
const Moderators = lazy(() => import("@/pages/Moderators"));
const Blog = lazy(() => import("@/pages/Blog"));
const ChatAuthenticated = lazy(() => import("@/pages/ChatAuthenticated"));
const Donations = lazy(() => import("@/pages/Donations"));
const Invest = lazy(() => import("@/pages/Invest"));
const TemplateDemo = lazy(() => import("@/pages/TemplateDemo"));
const News = lazy(() => import("@/pages/News"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Investors = lazy(() => import("@/pages/Investors"));
const NFTs = lazy(() => import("@/pages/NFTs"));

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
                                    <Route path="/auth" element={
                                        <ProtectedRoute requireAuth={false}>
                                        <Auth />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/demo" element={<Demo />} />
                                    <Route path="/faq" element={<FAQ />} />
                                    <Route path="/feed" element={<Feed />} />
                                    <Route path="/profiles" element={<Profiles />} />
                                    <Route path="/profile/:id" element={<ProfileDetail />} />
                                    <Route path="/profile" element={<ProfileSingle />} />
                                    <Route path="/profile-single" element={<ProfileSingle />} />
                                    <Route path="/profile-couple" element={<ProfileCouple />} />
                                    <Route path="/edit-profile-single" element={<EditProfileSingle />} />
                                    <Route path="/edit-profile-couple" element={<EditProfileCouple />} />
                                    <Route path="/events" element={<Events />} />
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
                                    <Route path="/stories/info" element={<StoriesInfo />} />
                                    <Route path="/stories/features" element={<StoriesInfo />} />
                                    <Route path="/stories/benefits" element={<StoriesInfo />} />
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
                                    <Route path="/dashboard" element={
                                        <ProtectedRoute>
                                        <Dashboard />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/support" element={<Support />} />
                                    <Route path="/terms" element={<Terms />} />
                                    <Route path="/privacy" element={<Privacy />} />
                                    <Route path="/tokens-info" element={<TokensInfo />} />
                                    <Route path="/tokens-privacy" element={<TokensPrivacy />} />
                                    <Route path="/tokens-terms" element={<TokensTerms />} />
                                    <Route path="/tokens-legal" element={<TokensLegal />} />
                                    <Route path="/ai-help" element={<AIControlCenter />} />
                                    <Route path="/shop" element={<Shop />} />
                                    <Route path="/project-info" element={<ProjectInfo />} />
                                    <Route path="/admin" element={
                                        <AdminRoute>
                                        <Admin />
                                        </AdminRoute>
                                    } />
                                    <Route path="/admin-production" element={
                                        <AdminRoute>
                                        <AdminProduction />
                                        </AdminRoute>
                                    } />
                                    <Route path="/admin/users" element={
                                        <AdminRoute>
                                        <AdminUsers />
                                        </AdminRoute>
                                    } />
                                    <Route path="/security" element={<Security />} />
                                    <Route path="/guidelines" element={<Guidelines />} />
                                    <Route path="/legal" element={<Legal />} />
                                    <Route path="/video-chat" element={<VideoChat />} />
                                    <Route path="/vip-events" element={<VIPEvents />} />
                                    <Route path="/virtual-gifts" element={<VirtualGifts />} />
                                    <Route path="/marketplace" element={<Marketplace />} />
                                    <Route path="/info" element={<Info />} />
                                    <Route path="/about" element={<About />} />
                                    <Route path="/careers" element={<Careers />} />
                                    <Route path="/admin/career-applications" element={
                                        <AdminRoute>
                                        <AdminCareerApplications />
                                        </AdminRoute>
                                    } />
                                    <Route path="/admin/moderators" element={
                                        <AdminRoute>
                                        <AdminModerators />
                                        </AdminRoute>
                                    } />
                                    <Route path="/admin/analytics" element={
                                        <AdminRoute>
                                        <AdminAnalytics />
                                        </AdminRoute>
                                    } />
                                    <Route path="/admin/partners" element={
                                        <AdminRoute>
                                        <AdminPartners />
                                        </AdminRoute>
                                    } />
                                    <Route path="/clubs" element={<Clubs />} />
                                    <Route path="/clubs/:slug" element={<Clubs />} />
                                    <Route path="/moderators/dashboard" element={
                                        <ModeratorRoute>
                                        <ModeratorDashboard />
                                        </ModeratorRoute>
                                    } />
                                    <Route path="/moderators" element={<Moderators />} />
                                    <Route path="/moderator-request" element={<ModeratorRequest />} />
                                    <Route path="/blog" element={<Blog />} />
                                    <Route path="/chat-authenticated" element={<ChatAuthenticated />} />
                                    <Route path="/donations" element={<Donations />} />
                                    <Route path="/invest" element={<Invest />} />
                                    <Route path="/template-demo" element={<TemplateDemo />} />
                                    <Route path="/news" element={<News />} />
                                    <Route path="/notifications" element={<Notifications />} />
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
