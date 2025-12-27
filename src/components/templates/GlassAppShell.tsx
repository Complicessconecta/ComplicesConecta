import React from 'react';
import {
  Bell,
  Search,
  Sun,
  Moon,
  LayoutGrid,
  RefreshCw,
  Camera,
  PenTool,
  Film,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export type GlassHeaderLink = {
  label: string;
  href?: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
};

export type GlassSidebarItem = {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  onClick?: () => void;
};

export type GlassSidebarSection = {
  title: string;
  items: GlassSidebarItem[];
};

export type GlassAppShellProps = {
  className?: string;
  title?: string;
  headerLinks?: GlassHeaderLink[];
  sidebarSections?: GlassSidebarSection[];
  notificationsCount?: number;
  profile?: {
    name: string;
    avatarUrl: string;
  };
  showThemeToggle?: boolean;
  themeMode?: 'dark' | 'light';
  onToggleTheme?: () => void;
  searchPlaceholder?: string;
  backgroundVideoSrc?: string;
  children: React.ReactNode;
};

const DEFAULT_HEADER_LINKS: GlassHeaderLink[] = [
  { label: 'Apps', active: true },
  { label: 'Tu trabajo', badge: 3 },
  { label: 'Descubrir' },
  { label: 'Market', badge: 2 },
];

const DEFAULT_SIDEBAR_SECTIONS: GlassSidebarSection[] = [
  {
    title: 'Apps',
    items: [
      { label: 'Todas', icon: LayoutGrid },
      { label: 'Actualizaciones', icon: RefreshCw, badge: 3 },
    ],
  },
  {
    title: 'CategorÃ­as',
    items: [
      { label: 'FotografÃ­a', icon: Camera },
      { label: 'DiseÃ±o', icon: PenTool },
      { label: 'Video', icon: Film },
      { label: 'UI/UX', icon: Sparkles },
    ],
  },
];

export const GlassAppShell: React.FC<GlassAppShellProps> = ({
  className,
  title = 'ComplicesConecta',
  headerLinks = DEFAULT_HEADER_LINKS,
  sidebarSections = DEFAULT_SIDEBAR_SECTIONS,
  notificationsCount = 0,
  profile = {
    name: 'Demo',
    avatarUrl:
      'https://images.unsplash.com/photo-1600353068440-6361ef3a86e8?auto=format&fit=crop&w=120&q=80',
  },
  showThemeToggle = true,
  themeMode = 'dark',
  onToggleTheme,
  searchPlaceholder = 'Buscar...',
  backgroundVideoSrc,
  children,
}) => {
  return (
    <div className={cn('relative min-h-[100dvh] w-full', className)}>
      <div className="fixed inset-0 -z-10">
        {backgroundVideoSrc ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src={backgroundVideoSrc} type="video/mp4" />
          </video>
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-indigo-950 to-blue-950" />
        <div className="absolute inset-0 bg-black/35" />
      </div>

      <div className="mx-auto w-full max-w-[1250px] px-3 py-6 md:px-8">
        <div
          className={cn(
            'h-[90dvh] w-full overflow-hidden rounded-2xl',
            'border border-white/15 bg-white/10 backdrop-blur-xl',
            'shadow-[0_20px_80px_rgba(0,0,0,0.45)]'
          )}
        >
          <header className="flex h-14 items-center gap-4 border-b border-white/10 px-4 md:px-6">
            <div className="hidden items-center gap-2 md:flex">
              <div className="h-3 w-3 rounded-full bg-red-500/80" />
              <div className="h-3 w-3 rounded-full bg-yellow-400/80" />
              <div className="h-3 w-3 rounded-full bg-green-500/80" />
              <span className="ml-2 hidden max-w-[220px] truncate text-sm font-semibold text-white/85 lg:inline">
                {title}
              </span>
            </div>

            <nav className="hidden items-center gap-1 md:flex">
              {headerLinks.map((l) => {
                const content = (
                  <span
                    className={cn(
                      'relative inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm',
                      l.active
                        ? 'text-white bg-white/10'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <span>{l.label}</span>
                    {typeof l.badge === 'number' ? (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/10 px-1.5 text-[11px] text-white/90">
                        {l.badge}
                      </span>
                    ) : null}
                  </span>
                );

                if (l.href) {
                  return (
                    <a key={l.label} href={l.href} className="select-none">
                      {content}
                    </a>
                  );
                }

                return (
                  <button
                    key={l.label}
                    type="button"
                    onClick={l.onClick}
                    className="select-none"
                  >
                    {content}
                  </button>
                );
              })}
            </nav>

            <div className="ml-auto flex flex-1 items-center justify-end gap-2 md:justify-between md:gap-4">
              <div className="hidden w-full max-w-md md:block">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                  <input
                    className={cn(
                      'h-9 w-full rounded-md pl-9 pr-3 text-sm',
                      'border border-white/10 bg-black/20',
                      'text-white/90 placeholder:text-white/40',
                      'outline-none focus:ring-2 focus:ring-purple-600/40'
                    )}
                    placeholder={searchPlaceholder}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                  aria-label="Notificaciones"
                >
                  <Bell className="h-4 w-4" />
                  {notificationsCount > 0 ? (
                    <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-1.5 text-[11px] font-semibold text-white">
                      {notificationsCount}
                    </span>
                  ) : null}
                </button>

                {showThemeToggle ? (
                  <button
                    type="button"
                    onClick={onToggleTheme}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                    aria-label="Cambiar tema"
                  >
                    {themeMode === 'dark' ? (
                      <Moon className="h-4 w-4" />
                    ) : (
                      <Sun className="h-4 w-4" />
                    )}
                  </button>
                ) : null}

                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-white/80 hover:bg-white/10"
                  aria-label="Perfil"
                >
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                  <span className="hidden text-sm font-semibold md:inline">
                    {profile.name}
                  </span>
                  <ChevronDown className="hidden h-4 w-4 md:inline" />
                </button>
              </div>
            </div>
          </header>

          <div className="flex h-[calc(90dvh-3.5rem)]">
            <aside className="hidden w-64 shrink-0 overflow-auto border-r border-white/10 p-4 md:block">
              <div className="space-y-5">
                {sidebarSections.map((section) => (
                  <div key={section.title} className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/50">
                      {section.title}
                    </div>
                    <div className="space-y-1">
                      {section.items.map((it) => {
                        const Icon = it.icon;

                        const content = (
                          <span className="inline-flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white">
                            <Icon className="h-4 w-4 text-white/70" />
                            <span className="truncate">{it.label}</span>
                            {typeof it.badge === 'number' ? (
                              <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/10 px-1.5 text-[11px] text-white/90">
                                {it.badge}
                              </span>
                            ) : null}
                          </span>
                        );

                        if (it.href) {
                          return (
                            <a key={it.label} href={it.href} className="block">
                              {content}
                            </a>
                          );
                        }

                        return (
                          <button
                            key={it.label}
                            type="button"
                            className="block w-full text-left"
                            onClick={it.onClick}
                          >
                            {content}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            <main className="flex-1 overflow-auto p-4 md:p-6">
              <div className="min-h-full rounded-2xl border border-white/10 bg-black/20 p-4 md:p-6">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

