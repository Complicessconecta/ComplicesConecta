import React from "react";
import { Grid3X3, Play, Upload, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export type TabType = "posts" | "stories" | "gallery" | "matches";

export interface TabItem {
  id: TabType;
  label: string;
  icon: LucideIcon;
  count: number;
  visible: boolean;
}

interface ProfileNavTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isOwnProfile?: boolean;
  /**
   * Posts que la pestaña realmente renderiza. Antes era un 12 fijo para
   * TODOS los perfiles, mientras el contenido solo mostraba el post de
   * ejemplo de Ana (o ninguno): en el perfil propio la pestaña decía
   * "Ver Posts 12" y el contenido "No hay posts aún" (punto 14d, ronda 7;
   * mismo patrón contradictorio de /profile/3 antes del punto 13).
   * El llamador lo calcula desde lo que renderiza; el default 12 solo
   * conserva el comportamiento anterior si alguien no lo pasa.
   */
  postsCount?: number;
}

export const ProfileNavTabs: React.FC<ProfileNavTabsProps> = ({
  activeTab,
  onTabChange,
  isOwnProfile = false,
  postsCount = 12,
}) => {
  const allTabs = [
    {
      id: "posts",
      label: "Posts",
      icon: Grid3X3,
      count: postsCount,
      visible: true,
    },
    {
      id: "stories",
      label: "Historias",
      icon: Play,
      count: 5,
      visible: true,
    },
    {
      id: "gallery",
      label: "Galería",
      icon: Upload,
      count: 24,
      visible: true,
    },
    {
      id: "matches",
      label: "Matches",
      icon: Users,
      count: 2,
      visible: isOwnProfile,
    },
  ] satisfies TabItem[];

  const tabs: TabItem[] = allTabs.filter((tab) => tab.visible);

  return (
    <div
      className="flex border-b border-slate-200 dark:border-white/20 w-full overflow-x-auto scrollbar-hide"
      role="tablist"
      aria-orientation="horizontal"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        const commonClassName = cn(
          "flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors relative min-h-[48px] min-w-[100px]",
          isActive
            ? "text-slate-900 dark:text-white border-b-2 border-fuchsia-500 dark:border-fuchsia-400"
            : "text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white/80",
        );

        const badgeClassName = cn(
          "text-xs px-2 py-0.5 rounded-full transition-colors",
          isActive
            ? "bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-300"
            : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/50",
        );

        if (isActive) {
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={commonClassName}
              aria-label={`Ver ${tab.label}`}
              aria-selected="true"
              role="tab"
            >
              <Icon className="w-5 h-5" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className={badgeClassName}>{tab.count}</span>

              {/* Active Indicator Gradient Background for better visibility */}
              <div className="absolute inset-0 bg-linear-to-t from-fuchsia-500/10 to-transparent pointer-events-none" />
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={commonClassName}
            aria-label={`Ver ${tab.label}`}
            aria-selected="false"
            role="tab"
          >
            <Icon className="w-5 h-5" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className={badgeClassName}>{tab.count}</span>
          </button>
        );
      })}
    </div>
  );
};
