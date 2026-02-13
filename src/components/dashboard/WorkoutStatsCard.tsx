"use client";

import { Card, CardContent } from "@/components/ui/card";

interface WorkoutStatsCardProps {
  waterIntake: number;
  waterGoal: number;
  calorieIntake: number;
  calorieGoal: number;
}

export function WorkoutStatsCard({
  waterIntake,
  waterGoal,
  calorieIntake,
  calorieGoal,
}: WorkoutStatsCardProps) {
  const waterProgress = Math.min(waterIntake / waterGoal, 1);
  const calorieProgress = Math.min(calorieIntake / calorieGoal, 1);
  const waterPercent = Math.round(waterProgress * 100);
  const caloriePercent = Math.round(calorieProgress * 100);

  return (
    <Card className="border-border bg-card">
      <CardContent className="space-y-4 p-5">
        <div className="rounded-2xl border border-border bg-secondary px-4 py-3">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Today&apos;s Progress
          </p>
          <p className="mt-1 text-3xl font-black leading-none text-foreground">
            {Math.round((waterPercent + caloriePercent) / 2)}%
            <span className="ml-2 text-base text-muted-foreground">complete</span>
          </p>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-border bg-secondary p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-black text-foreground">Water</span>
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                {waterPercent}%
              </span>
            </div>
            <p className="text-2xl font-black leading-none text-foreground">
              {waterIntake}
              <span className="ml-1 text-sm text-muted-foreground">/ {waterGoal} glasses</span>
            </p>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${waterPercent}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-secondary p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-black text-foreground">Calories</span>
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                {caloriePercent}%
              </span>
            </div>
            <p className="text-2xl font-black leading-none text-foreground">
              {calorieIntake.toLocaleString()}
              <span className="ml-1 text-sm text-muted-foreground">
                / {calorieGoal.toLocaleString()} kcal
              </span>
            </p>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${caloriePercent}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
