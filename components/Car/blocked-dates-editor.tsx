"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2, PlusCircle } from "lucide-react";

interface BlockedRange {
  start: string;
  end: string;
}

interface BlockedDatesEditorProps {
  carId: number;
  initial: BlockedRange[];
}

export function BlockedDatesEditor({ carId, initial }: BlockedDatesEditorProps) {
  const [ranges, setRanges] = useState<BlockedRange[]>(initial);
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  async function save(updated: BlockedRange[]) {
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase
      .from("cars")
      .update({ blocked_dates: updated })
      .eq("id", carId);
    if (err) setError(err.message);
    else setRanges(updated);
    setSaving(false);
  }

  async function addRange() {
    if (!newStart || !newEnd || newEnd < newStart) {
      setError("Please select a valid date range.");
      return;
    }
    // Check overlap with existing ranges
    const overlaps = ranges.some((r) => newStart <= r.end && newEnd >= r.start);
    if (overlaps) {
      setError("This range overlaps with an existing blocked period.");
      return;
    }
    const updated = [...ranges, { start: newStart, end: newEnd }].sort((a, b) =>
      a.start.localeCompare(b.start)
    );
    await save(updated);
    setNewStart("");
    setNewEnd("");
  }

  async function removeRange(index: number) {
    const updated = ranges.filter((_, i) => i !== index);
    await save(updated);
  }

  function fmt(dateStr: string) {
    return new Date(dateStr + "T00:00:00").toLocaleDateString([], { dateStyle: "medium" });
  }

  return (
    <div className="space-y-4">
      {/* Existing blocked ranges */}
      {ranges.length === 0 ? (
        <p className="text-sm text-muted-foreground py-3 text-center border border-dashed rounded-lg">
          No dates blocked yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {ranges.map((r, i) => (
            <li
              key={i}
              className="flex items-center justify-between px-3 py-2 rounded-lg border bg-muted/40 text-sm"
            >
              <span className="font-medium">
                {fmt(r.start)} → {fmt(r.end)}
              </span>
              <button
                type="button"
                onClick={() => removeRange(i)}
                disabled={saving}
                className="text-destructive hover:text-destructive/80 transition-colors ml-3 flex-shrink-0"
                aria-label="Remove blocked range"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add new range */}
      <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
        <p className="text-sm font-medium">Add blocked period</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="block-start" className="text-xs">From</Label>
            <input
              id="block-start"
              type="date"
              value={newStart}
              min={today}
              onChange={(e) => {
                setNewStart(e.target.value);
                if (newEnd && e.target.value > newEnd) setNewEnd("");
                setError("");
              }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="block-end" className="text-xs">To</Label>
            <input
              id="block-end"
              type="date"
              value={newEnd}
              min={newStart || today}
              onChange={(e) => { setNewEnd(e.target.value); setError(""); }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        {error && <p className="text-destructive text-xs">{error}</p>}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRange}
          disabled={saving || !newStart || !newEnd}
        >
          <PlusCircle className="h-4 w-4 mr-1.5" />
          {saving ? "Saving…" : "Block these dates"}
        </Button>
      </div>
    </div>
  );
}
