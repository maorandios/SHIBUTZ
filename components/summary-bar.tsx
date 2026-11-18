import { CheckCircle2, CircleDashed, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type SummaryBarProps = {
  total: number;
  assigned: number;
  available: number;
};

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
}) {
  return (
    <div className="flex aspect-square flex-col items-center justify-center rounded-xl border border-border bg-card px-2 py-2">
      <Icon className="mb-2.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="text-2xl font-semibold tabular-nums leading-none text-foreground">
        {value}
      </span>
      <span className="mt-1 text-center text-[11px] leading-tight text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export function SummaryBar({ total, assigned, available }: SummaryBarProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Stat label="סה״כ עובדים" value={total} icon={Users} />
      <Stat label="משובצים" value={assigned} icon={CheckCircle2} />
      <Stat label="פנויים" value={available} icon={CircleDashed} />
    </div>
  );
}
