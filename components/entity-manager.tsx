"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { EntityActionSheet } from "@/components/entity-action-sheet";
import { Button } from "@/components/ui/button";

type Entity = { id: string; name: string };

type EntityManagerProps = {
  variant: "worker" | "site";
  entities: Entity[];
  emptyText: string;
  onRename: (
    id: string,
    name: string,
  ) => { ok: true } | { ok: false; error: string };
  onDelete: (id: string) => void;
  onNotice: (message: string, type?: "success" | "error" | "info") => void;
};

export function EntityManager({
  variant,
  entities,
  emptyText,
  onRename,
  onDelete,
  onNotice,
}: EntityManagerProps) {
  const [editTarget, setEditTarget] = useState<Entity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Entity | null>(null);

  if (entities.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/60 px-4 py-4 text-sm text-muted-foreground">
        {emptyText}
      </div>
    );
  }

  return (
    <>
      <ul className="overflow-hidden rounded-xl border border-border bg-card">
        {entities.map((entity) => (
          <li
            key={entity.id}
            className="border-b border-border/70 px-3 py-2 last:border-b-0"
          >
            <div className="flex min-h-11 items-center justify-between gap-2">
              <span className="truncate text-sm font-medium text-foreground">
                {entity.name}
              </span>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="pressable size-9"
                  aria-label={`שנה שם של ${entity.name}`}
                  onClick={() => setEditTarget(entity)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="pressable size-9 text-destructive"
                  aria-label={`מחק את ${entity.name}`}
                  onClick={() => setDeleteTarget(entity)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {editTarget && (
        <EntityActionSheet
          mode="edit"
          variant={variant}
          entity={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={(name) => onRename(editTarget.id, name)}
          onNotice={onNotice}
        />
      )}

      {deleteTarget && (
        <EntityActionSheet
          mode="delete"
          variant={variant}
          entity={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            onDelete(deleteTarget.id);
            onNotice("נמחק בהצלחה", "success");
          }}
        />
      )}
    </>
  );
}
