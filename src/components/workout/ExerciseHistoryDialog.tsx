"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { calculate1RM } from "@/types/workout";

interface ExerciseHistorySet {
  setNumber: number;
  weight?: number;
  reps?: number;
  rpe?: number;
  rir?: number;
  setType: string;
  isPR?: boolean;
}

interface ExerciseHistoryEntry {
  date: number;
  workoutName?: string;
  sets: ExerciseHistorySet[];
}

interface ChartPoint {
  date: number;
  value: number;
  label: string;
}

interface ExerciseHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseName: string;
  history: ExerciseHistoryEntry[] | null | undefined;
}

type ProgressMetric = "weight" | "1rm" | "volume";

const METRIC_LABELS: Record<ProgressMetric, string> = {
  weight: "Top Weight",
  "1rm": "Estimated 1RM",
  volume: "Session Volume",
};

function getMetricValue(entry: ExerciseHistoryEntry, metric: ProgressMetric): number {
  const setsWithWeight = entry.sets.filter(
    (set) => set.weight !== undefined && set.reps !== undefined
  );

  if (setsWithWeight.length === 0) {
    return 0;
  }

  if (metric === "volume") {
    return setsWithWeight.reduce(
      (accumulator, set) => accumulator + (set.weight || 0) * (set.reps || 0),
      0
    );
  }

  if (metric === "1rm") {
    return Math.max(
      ...setsWithWeight.map((set) =>
        calculate1RM(set.weight || 0, set.reps || 1)
      )
    );
  }

  return Math.max(...setsWithWeight.map((set) => set.weight || 0));
}

function formatMetricValue(value: number, metric: ProgressMetric): string {
  if (metric === "volume") {
    return value.toLocaleString();
  }

  return `${Math.round(value)} lb`;
}

function formatSetsForRow(entry: ExerciseHistoryEntry): string {
  const formattedSets = entry.sets
    .filter((set) => set.weight !== undefined && set.reps !== undefined)
    .map((set) => `${set.weight}×${set.reps}`);

  if (formattedSets.length === 0) {
    return "No completed weighted sets";
  }

  return formattedSets.join(" · ");
}

function formatDateLabel(timestamp: number): string {
  return format(new Date(timestamp), "MMM d");
}

function buildPolyline(points: ChartPoint[]): string {
  if (points.length === 0) {
    return "";
  }

  const width = 700;
  const height = 220;
  const padding = 24;
  const values = points.map((point) => point.value);
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = maxValue - minValue || 1;

  return points
    .map((point, index) => {
      const x =
        points.length === 1
          ? width / 2
          : padding + (index / (points.length - 1)) * (width - padding * 2);
      const y =
        height -
        padding -
        ((point.value - minValue) / range) * (height - padding * 2);

      return `${x},${y}`;
    })
    .join(" ");
}

export function ExerciseHistoryDialog({
  open,
  onOpenChange,
  exerciseName,
  history,
}: ExerciseHistoryDialogProps) {
  const [metric, setMetric] = useState<ProgressMetric>("weight");

  const sortedHistory = useMemo(() => {
    if (!history) {
      return [];
    }

    return [...history].sort((a, b) => a.date - b.date);
  }, [history]);

  const chartPoints = useMemo(() => {
    return sortedHistory.map((entry) => ({
      date: entry.date,
      value: getMetricValue(entry, metric),
      label: formatDateLabel(entry.date),
    }));
  }, [metric, sortedHistory]);

  const latestValue = chartPoints.length > 0 ? chartPoints[chartPoints.length - 1].value : 0;
  const bestValue = chartPoints.length > 0 ? Math.max(...chartPoints.map((point) => point.value)) : 0;
  const firstValue = chartPoints.length > 0 ? chartPoints[0].value : 0;
  const percentChange =
    chartPoints.length > 1 && firstValue > 0
      ? Math.round(((latestValue - firstValue) / firstValue) * 100)
      : 0;

  const polyline = buildPolyline(chartPoints);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-8 sm:p-10">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-bold">{exerciseName} History</DialogTitle>
        </DialogHeader>

        <div className="space-y-10">
          <div className="flex flex-wrap gap-3">
            {(Object.keys(METRIC_LABELS) as ProgressMetric[]).map((metricKey) => (
              <Button
                key={metricKey}
                variant={metric === metricKey ? "default" : "outline"}
                size="sm"
                onClick={() => setMetric(metricKey)}
                className="rounded-full px-6"
              >
                {METRIC_LABELS[metricKey]}
              </Button>
            ))}
          </div>

          {chartPoints.length === 0 ? (
            <Card className="border-zinc-900 bg-zinc-950/50">
              <CardContent className="py-20 text-center text-sm text-muted-foreground">
                Complete at least one set for this exercise to unlock progress charts.
              </CardContent>
            </Card>
          ) : (
            <Card className="border-zinc-900 bg-zinc-950/50">
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-3 gap-8 text-sm">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-1">Latest</p>
                    <p className="text-xl font-bold text-zinc-100">{formatMetricValue(latestValue, metric)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-1">Best</p>
                    <p className="text-xl font-bold text-zinc-100">{formatMetricValue(bestValue, metric)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-1">Trend</p>
                    <p
                      className={cn(
                        "text-xl font-bold",
                        percentChange > 0 && "text-green-500",
                        percentChange < 0 && "text-destructive",
                        percentChange === 0 && "text-zinc-100"
                      )}
                    >
                      {percentChange > 0 ? "+" : ""}
                      {percentChange}%
                    </p>
                  </div>
                </div>

                <div className="relative pt-4">
                  <svg
                    viewBox="0 0 700 220"
                    className="w-full h-48 rounded-2xl bg-black/40 border border-zinc-900/50"
                    role="img"
                    aria-label={`${METRIC_LABELS[metric]} over time`}
                  >
                    <polyline
                      points={polyline}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="text-white"
                    />
                    {chartPoints.map((point, index) => {
                      const values = chartPoints.map((valuePoint) => valuePoint.value);
                      const maxValue = Math.max(...values, 1);
                      const minValue = Math.min(...values, 0);
                      const range = maxValue - minValue || 1;
                      const padding = 24;
                      const x =
                        chartPoints.length === 1
                          ? 350
                          : padding + (index / (chartPoints.length - 1)) * (700 - padding * 2);
                      const y =
                        220 -
                        padding -
                        ((point.value - minValue) / range) * (220 - padding * 2);

                      return (
                        <circle
                          key={`${point.date}-${index}`}
                          cx={x}
                          cy={y}
                          r="5"
                          className="fill-white stroke-black stroke-2"
                        />
                      );
                    })}
                  </svg>
                </div>

                <div className="flex justify-between text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-1">
                  <span>{chartPoints[0]?.label}</span>
                  <span>{chartPoints[chartPoints.length - 1]?.label}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-zinc-900 bg-zinc-950/50">
            <CardContent className="p-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-6">Recent Sessions</h3>
              {history && history.length > 0 ? (
                <div className="space-y-4">
                  {[...history]
                    .sort((a, b) => b.date - a.date)
                    .slice(0, 12)
                    .map((entry) => (
                      <div
                        key={`${entry.date}-${entry.workoutName || "workout"}`}
                        className="flex items-start justify-between gap-4 border-b border-zinc-900 pb-4 last:border-0 last:pb-0"
                      >
                        <div>
                          <p className="text-sm font-bold text-zinc-100 mb-0.5">
                            {entry.workoutName || "Workout"}
                          </p>
                          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                            {formatDateLabel(entry.date)}
                          </p>
                        </div>
                        <p className="text-xs font-medium text-zinc-500 text-right pt-1">
                          {formatSetsForRow(entry)}
                        </p>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-600 text-center py-4">No sessions recorded yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
