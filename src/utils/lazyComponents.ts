import { lazyWithDefault } from "@/utils/lazyWithDefault";

// Lazy loading with chunk names for better debugging
export const LazyPages = {
  // Admin components - separate chunk
  Admin: lazyWithDefault(
    () => import(/* webpackChunkName: "admin" */ "@/pages/admin/Admin"),
  ),
  AdminProduction: lazyWithDefault(
    () =>
      import(/* webpackChunkName: "admin" */ "@/pages/admin/AdminProduction"),
  ),
  AdminCareerApplications: lazyWithDefault(
    () =>
      import(
        /* webpackChunkName: "admin" */ "@/pages/admin/AdminCareerApplications"
      ),
  ),
  AdminModerators: lazyWithDefault(
    () =>
      import(/* webpackChunkName: "admin" */ "@/pages/admin/AdminModerators"),
  ),
  ModeratorDashboard: lazyWithDefault(
    () => import(/* webpackChunkName: "admin" */ "@/pages/ModeratorDashboard"),
  ),

  // Token system - separate chunk
  Tokens: lazyWithDefault(
    () => import(/* webpackChunkName: "tokens" */ "@/pages/Tokens"),
  ),
  TokensInfo: lazyWithDefault(
    () => import(/* webpackChunkName: "tokens" */ "@/pages/TokensInfo"),
  ),
  TokensPrivacy: lazyWithDefault(
    () => import(/* webpackChunkName: "tokens" */ "@/pages/TokensPrivacy"),
  ),
  TokensTerms: lazyWithDefault(
    () => import(/* webpackChunkName: "tokens" */ "@/pages/TokensTerms"),
  ),
  TokensLegal: lazyWithDefault(
    () => import(/* webpackChunkName: "tokens" */ "@/pages/TokensLegal"),
  ),

  // Profile system - separate chunk
  Profiles: lazyWithDefault(
    () =>
      import(
        /* webpackChunkName: "profiles" */ "@/pages/profiles/shared/Profiles"
      ),
  ),
  ProfileDetail: lazyWithDefault(
    () =>
      import(
        /* webpackChunkName: "profiles" */ "@/components/profiles/shared/ProfileDetail"
      ),
  ),
  ProfileSingle: lazyWithDefault(
    () =>
      import(
        /* webpackChunkName: "profiles" */ "@/pages/profiles/single/ProfileSingle"
      ),
  ),
  ProfileCouple: lazyWithDefault(
    () =>
      import(
        /* webpackChunkName: "profiles" */ "@/pages/profiles/couple/ProfileCouple"
      ),
  ),
  EditProfileSingle: lazyWithDefault(
    () =>
      import(
        /* webpackChunkName: "profiles" */ "@/pages/profiles/single/EditProfileSingle"
      ),
  ),
  EditProfileCouple: lazyWithDefault(
    () =>
      import(
        /* webpackChunkName: "profiles" */ "@/pages/profiles/couple/EditProfileCouple"
      ),
  ),

  // Chat system - separate chunk
  Chat: lazyWithDefault(
    () => import(/* webpackChunkName: "chat" */ "@/pages/Chat"),
  ),
  ChatInfo: lazyWithDefault(
    () => import(/* webpackChunkName: "chat" */ "@/pages/ChatInfo"),
  ),
  ChatAuthenticated: lazyWithDefault(
    () => import(/* webpackChunkName: "chat" */ "@/pages/ChatAuthenticated"),
  ),

  // Stories and content - separate chunk
  Stories: lazyWithDefault(
    () => import(/* webpackChunkName: "content" */ "@/pages/Stories"),
  ),
  StoriesInfo: lazyWithDefault(
    () => import(/* webpackChunkName: "content" */ "@/pages/StoriesInfo"),
  ),
  Feed: lazyWithDefault(
    () => import(/* webpackChunkName: "content" */ "@/pages/Feed"),
  ),
  Blog: lazyWithDefault(
    () => import(/* webpackChunkName: "content" */ "@/pages/Blog"),
  ),

  // Info/Legal pages - separate chunk
  FAQ: lazyWithDefault(
    () => import(/* webpackChunkName: "info" */ "@/pages/FAQ"),
  ),
  Terms: lazyWithDefault(
    () => import(/* webpackChunkName: "info" */ "@/pages/Terms"),
  ),
  Privacy: lazyWithDefault(
    () => import(/* webpackChunkName: "info" */ "@/pages/Privacy"),
  ),
  Support: lazyWithDefault(
    () => import(/* webpackChunkName: "info" */ "@/pages/Support"),
  ),
  Security: lazyWithDefault(
    () => import(/* webpackChunkName: "info" */ "@/pages/Security"),
  ),
  Guidelines: lazyWithDefault(
    () => import(/* webpackChunkName: "info" */ "@/pages/Guidelines"),
  ),
  Legal: lazyWithDefault(
    () => import(/* webpackChunkName: "info" */ "@/pages/Legal"),
  ),
  About: lazyWithDefault(
    () => import(/* webpackChunkName: "info" */ "@/pages/About"),
  ),
  ProjectInfo: lazyWithDefault(
    () => import(/* webpackChunkName: "info" */ "@/pages/ProjectInfo"),
  ),

  // Core features - separate chunk
  Matches: lazyWithDefault(
    () => import(/* webpackChunkName: "core" */ "@/pages/Matches"),
  ),
  Requests: lazyWithDefault(
    () => import(/* webpackChunkName: "core" */ "@/pages/Requests"),
  ),
  Settings: lazyWithDefault(
    () => import(/* webpackChunkName: "core" */ "@/pages/Settings"),
  ),
  Discover: lazyWithDefault(
    () => import(/* webpackChunkName: "core" */ "@/pages/Discover"),
  ),
  Premium: lazyWithDefault(
    () => import(/* webpackChunkName: "core" */ "@/pages/Premium"),
  ),
  Dashboard: lazyWithDefault(
    () => import(/* webpackChunkName: "core" */ "@/pages/Dashboard"),
  ),

  // Other pages
  Careers: lazyWithDefault(
    () => import(/* webpackChunkName: "misc" */ "@/pages/Careers"),
  ),
  ModeratorRequest: lazyWithDefault(
    () => import(/* webpackChunkName: "misc" */ "@/pages/ModeratorRequest"),
  ),
  Donations: lazyWithDefault(
    () => import(/* webpackChunkName: "misc" */ "@/pages/Donations"),
  ),
  TemplateDemo: lazyWithDefault(
    () => import(/* webpackChunkName: "misc" */ "@/pages/TemplateDemo"),
  ),
};
