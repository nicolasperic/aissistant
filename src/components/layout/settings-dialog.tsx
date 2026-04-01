"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettings } from "@/components/layout/settings-context";
import type { WeekStartDay } from "@/lib/settings";

const DAY_OPTIONS: { value: WeekStartDay; label: string }[] = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
const WEEK_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

function RangeRow({
  label,
  beforeValue,
  afterValue,
  options,
  unit,
  onBeforeChange,
  onAfterChange,
}: {
  label: string;
  beforeValue: number;
  afterValue: number;
  options: number[];
  unit: string;
  onBeforeChange: (v: number) => void;
  onAfterChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Past ({unit})</span>
          <Select value={String(beforeValue)} onValueChange={(v) => onBeforeChange(Number(v))}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((n) => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Future ({unit})</span>
          <Select value={String(afterValue)} onValueChange={(v) => onAfterChange(Number(v))}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((n) => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

export function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const { settings, update } = useSettings();

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Settings className="h-4 w-4" />
        <span className="sr-only">Settings</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Week starts on</label>
              <Select
                value={String(settings.weekStartsOn)}
                onValueChange={(v) =>
                  update({ weekStartsOn: Number(v) as WeekStartDay })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-4 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dashboard Charts</p>
              <RangeRow
                label="Quarterly & Yearly Goals"
                beforeValue={settings.quarterlyMonthsBefore}
                afterValue={settings.quarterlyMonthsAfter}
                options={MONTH_OPTIONS}
                unit="months"
                onBeforeChange={(v) => update({ quarterlyMonthsBefore: v })}
                onAfterChange={(v) => update({ quarterlyMonthsAfter: v })}
              />
              <RangeRow
                label="Weekly Goals"
                beforeValue={settings.weeklyWeeksBefore}
                afterValue={settings.weeklyWeeksAfter}
                options={WEEK_OPTIONS}
                unit="weeks"
                onBeforeChange={(v) => update({ weeklyWeeksBefore: v })}
                onAfterChange={(v) => update({ weeklyWeeksAfter: v })}
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={() => setOpen(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
