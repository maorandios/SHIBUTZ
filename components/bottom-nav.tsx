"use client";

import { Building2, ClipboardList, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export type AppTab = "home" | "sites" | "workers";

const TABS: Array<{
  id: AppTab;
  label: string;
  icon: typeof ClipboardList;
}> = [
  { id: "home", label: "ראשי", icon: ClipboardList },
  { id: "sites", label: "אתרים", icon: Building2 },
  { id: "workers", label: "עובדים", icon: Users },
];

type BottomNavProps = {
  active: AppTab;
  onChange: (tab: AppTab) => void;
};

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="app-chrome shrink-0 border-t border-border pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
      <div className="mx-auto grid max-w-[34rem] grid-cols-3 pt-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                "pressable relative flex h-14 flex-col items-center justify-center gap-1 px-1 leading-none transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="size-5" aria-hidden />
              <span className="bottom-nav-label max-w-full truncate">
                {tab.label}
              </span>
              {isActive && (
                <span
                  className="absolute bottom-1 h-0.5 w-6 rounded-full bg-primary shadow-[0_0_8px_2px_rgb(255_51_0_/_0.55)]"
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export const TAB_ORDER: AppTab[] = ["home", "sites", "workers"];

export function tabIndex(tab: AppTab): number {
  return TAB_ORDER.indexOf(tab);
}
