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
}

export const ProfileNavTabs: React.FC<ProfileNavTabsProps> = ({
  activeTab,
  onTabChange,
  isOwnProfile = false,
}) => {
  const allTabs = [
    {
      id: "posts",
      label: "Posts",
      icon: Grid3X3,
      count: 12,
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
      className="flex border-b border-white/20 w-full overflow-x-auto scrollbar-hide"
      role="tablist"
      aria-orientation="horizontal"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        const commonClassName = cn(
          "flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors relative min-h-[48px] min-w-[100px]",
          isActive
            ? "text-white border-b-2 border-fuchsia-400"
            : "text-white/60 hover:text-white/80",
        );

        const badgeClassName = cn(
          "text-xs px-2 py-0.5 rounded-full transition-colors",
          isActive
            ? "bg-fuchsia-500/20 text-fuchsia-300"
            : "bg-white/10 text-white/50",
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
