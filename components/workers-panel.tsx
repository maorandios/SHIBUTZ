"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { AddEntitySheet } from "@/components/add-entity-sheet";
import { EntityManager } from "@/components/entity-manager";
import { Button } from "@/components/ui/button";
import type { AppData } from "@/lib/types";

type WorkersPanelProps = {
  data: AppData;
  onAdd: (name: string) => { ok: true } | { ok: false; error: string };
  onRename: (
    id: string,
    name: string,
  ) => { ok: true } | { ok: false; error: string };
  onDelete: (id: string) => void;
  onBulkAdd: (raw: string) => {
    ok: boolean;
    added: number;
    skipped: number;
  };
  onNotice: (message: string, type?: "success" | "error" | "info") => void;
};

export function WorkersPanel({
  data,
  onAdd,
  onRename,
  onDelete,
  onBulkAdd,
  onNotice,
}: WorkersPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4 px-4 py-4">
      <Button
        type="button"
        className="pressable w-full"
        size="lg"
        onClick={() => setOpen(true)}
      >
        <UserPlus className="size-4" />
        הוספת עובד חדש
      </Button>

      <EntityManager
        variant="worker"
        entities={data.workers}
        emptyText="אין עובדים עדיין"
        onRename={onRename}
        onDelete={onDelete}
        onNotice={onNotice}
      />

      {open && (
        <AddEntitySheet
          title="הוספת עובד"
          variant="worker"
          singlePlaceholder="שם עובד"
          bulkToggleLabel="הוספת מספר עובדים"
          bulkPlaceholder={"שם עובד בכל שורה\nאחמד חסן\nמוחמד עלי"}
          onClose={() => setOpen(false)}
          onSaveSingle={onAdd}
          onSaveBulk={onBulkAdd}
          onNotice={onNotice}
        />
      )}
    </div>
  );
}
