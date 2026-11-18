"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAssignedCount } from "@/lib/assignments";
import { formatHebrewDate, previousDay } from "@/lib/dates";
import type { AppData } from "@/lib/types";

type CopyFromDateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: AppData;
  targetDate: string;
  onCopy: (sourceDate: string) => void;
};

export function CopyFromDateDialog({
  open,
  onOpenChange,
  data,
  targetDate,
  onCopy,
}: CopyFromDateDialogProps) {
  if (!open) return null;

  return (
    <CopyFromDateDialogInner
      key={targetDate}
      data={data}
      targetDate={targetDate}
      onOpenChange={onOpenChange}
      onCopy={onCopy}
    />
  );
}

function CopyFromDateDialogInner({
  data,
  targetDate,
  onOpenChange,
  onCopy,
}: {
  data: AppData;
  targetDate: string;
  onOpenChange: (open: boolean) => void;
  onCopy: (sourceDate: string) => void;
}) {
  const [sourceDate, setSourceDate] = useState(previousDay(targetDate));
  const [confirmReplaceOpen, setConfirmReplaceOpen] = useState(false);

  const sourceCount = getAssignedCount(data, sourceDate);
  const targetCount = getAssignedCount(data, targetDate);

  const runCopy = () => {
    onCopy(sourceDate);
    onOpenChange(false);
    setConfirmReplaceOpen(false);
  };

  const handleConfirm = () => {
    if (targetCount > 0) {
      setConfirmReplaceOpen(true);
      return;
    }
    runCopy();
  };

  return (
    <>
      <AlertDialog
        open
        onOpenChange={(next) => {
          if (!next) onOpenChange(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>העתק שיבוץ מיום קודם</AlertDialogTitle>
            <AlertDialogDescription>
              בחרו תאריך מקור. השיבוץ הקיים בתאריך הנוכחי יוחלף אם יש בו נתונים.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Label htmlFor="source-date">תאריך מקור</Label>
            <Input
              id="source-date"
              type="date"
              value={sourceDate}
              onChange={(event) => setSourceDate(event.target.value)}
            />
            <p className="text-xs text-neutral-500">
              {formatHebrewDate(sourceDate)} · {sourceCount} עובדים משובצים
            </p>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>העתק</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmReplaceOpen} onOpenChange={setConfirmReplaceOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>להחליף שיבוץ קיים?</AlertDialogTitle>
            <AlertDialogDescription>
              לתאריך {formatHebrewDate(targetDate)} כבר יש {targetCount} שיבוצים.
              ההעתקה תחליף אותם בשיבוץ מ־{formatHebrewDate(sourceDate)}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={runCopy}>החלף והעתק</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
