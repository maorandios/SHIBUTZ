"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { SiteCard } from "@/components/site-card";
import { Button } from "@/components/ui/button";
import { getSiteWorkerCount } from "@/lib/assignments";
import { cn } from "@/lib/utils";
import {
  buildWhatsAppMessage,
  openWhatsAppShare,
} from "@/lib/whatsapp";
import type { AppData } from "@/lib/types";

type HomePanelProps = {
  data: AppData;
  dateKey: string;
  onOpenSite: (siteId: string) => void;
  onNotice?: (message: string, type?: "success" | "error" | "info") => void;
};

export function HomePanel({
  data,
  dateKey,
  onOpenSite,
  onNotice,
}: HomePanelProps) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const sharedRef = useRef(false);

  const selectedMessage = useMemo(() => {
    if (!selectionMode || selectedIds.size === 0) return null;
    return buildWhatsAppMessage(data, dateKey, [...selectedIds]);
  }, [selectionMode, selectedIds, data, dateKey]);

  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const enterSelection = (siteId: string) => {
    setSelectionMode(true);
    setSelectedIds(new Set([siteId]));
  };

  const toggleSite = (siteId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(siteId)) next.delete(siteId);
      else next.add(siteId);
      return next;
    });
  };

  const shareSelected = () => {
    if (!selectedMessage) {
      onNotice?.("אין שיבוצים באתרים שנבחרו", "info");
      return;
    }

    const message = selectedMessage;
    sharedRef.current = true;
    // Leave share UI immediately so return-from-WhatsApp shows the home list.
    exitSelection();
    openWhatsAppShare(message);
  };

  useEffect(() => {
    const clearAfterReturn = () => {
      if (document.visibilityState !== "visible") return;
      if (!sharedRef.current) return;
      sharedRef.current = false;
      exitSelection();
    };

    document.addEventListener("visibilitychange", clearAfterReturn);
    window.addEventListener("focus", clearAfterReturn);
    window.addEventListener("pageshow", clearAfterReturn);

    return () => {
      document.removeEventListener("visibilitychange", clearAfterReturn);
      window.removeEventListener("focus", clearAfterReturn);
      window.removeEventListener("pageshow", clearAfterReturn);
    };
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "grid overflow-hidden border-b border-border bg-background transition-[grid-template-rows,opacity]",
          selectionMode
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        )}
        style={{
          transitionDuration: "var(--duration-nav)",
          transitionTimingFunction: "var(--ease-nav)",
        }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex gap-2 px-4 py-3">
            <Button
              type="button"
              className="pressable flex-1"
              size="lg"
              disabled={!selectedMessage}
              onClick={shareSelected}
            >
              <MessageCircle className="size-4" />
              שיתוף בוואטסאפ
              {selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="pressable"
              onClick={exitSelection}
              aria-label="ביטול"
            >
              <X className="size-4" />
              ביטול
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {data.sites.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/60 px-4 py-5 text-center text-sm text-muted-foreground">
            אין אתרים עדיין. הוסיפו אתרים בלשונית ״אתרים״.
          </div>
        ) : (
          <div className="grid gap-2">
            {data.sites.map((site) => (
              <SiteCard
                key={site.id}
                site={site}
                count={getSiteWorkerCount(data, dateKey, site.id)}
                selectionMode={selectionMode}
                selected={selectedIds.has(site.id)}
                onSelect={selectionMode ? toggleSite : onOpenSite}
                onLongPress={enterSelection}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
