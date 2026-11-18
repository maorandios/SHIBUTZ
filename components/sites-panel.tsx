"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { AddEntitySheet } from "@/components/add-entity-sheet";
import { EntityManager } from "@/components/entity-manager";
import { Button } from "@/components/ui/button";
import { findDuplicateName, normalizeName } from "@/lib/assignments";
import { createId } from "@/lib/id";
import type { AppData } from "@/lib/types";

type SitesPanelProps = {
  data: AppData;
  onAdd: (name: string) => { ok: true } | { ok: false; error: string };
  onRename: (
    id: string,
    name: string,
  ) => { ok: true } | { ok: false; error: string };
  onDelete: (id: string) => void;
  onNotice: (message: string, type?: "success" | "error" | "info") => void;
};

export function SitesPanel({
  data,
  onAdd,
  onRename,
  onDelete,
  onNotice,
}: SitesPanelProps) {
  const [open, setOpen] = useState(false);

  const handleBulkAdd = (raw: string) => {
    const lines = raw
      .split(/\r?\n/)
      .map((line) => normalizeName(line))
      .filter(Boolean);

    let added = 0;
    let skipped = 0;
    const known = data.sites.map((site) => ({ id: site.id, name: site.name }));

    for (const name of lines) {
      if (findDuplicateName(known, name)) {
        skipped += 1;
        continue;
      }
      const result = onAdd(name);
      if (result.ok) {
        known.push({ id: createId(), name });
        added += 1;
      } else {
        skipped += 1;
      }
    }

    return { ok: true, added, skipped };
  };

  return (
    <div className="space-y-4 px-4 py-4">
      <Button
        type="button"
        className="pressable w-full"
        size="lg"
        onClick={() => setOpen(true)}
      >
        <Building2 className="size-4" />
        הוספת אתר חדש
      </Button>

      <EntityManager
        variant="site"
        entities={data.sites}
        emptyText="אין אתרים עדיין"
        onRename={onRename}
        onDelete={onDelete}
        onNotice={onNotice}
      />

      {open && (
        <AddEntitySheet
          title="הוספת אתר"
          variant="site"
          singlePlaceholder="שם אתר"
          bulkToggleLabel="הוספת מספר אתרים"
          bulkPlaceholder={"שם אתר בכל שורה\nאתר רעננה\nאתר הרצליה"}
          onClose={() => setOpen(false)}
          onSaveSingle={onAdd}
          onSaveBulk={handleBulkAdd}
          onNotice={onNotice}
        />
      )}
    </div>
  );
}
