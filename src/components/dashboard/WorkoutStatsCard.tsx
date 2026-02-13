"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Flame, Droplets, Utensils, Dumbbell } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";

interface WorkoutStatsCardProps {
  streak: number;
  weeklyWorkouts: {
    _id: string;
    completedAt: number;
    totalVolume: number;
  }[];
  weeklyGoal: number;
  waterIntake: number;
  waterGoal: number;
  calorieIntake: number;
  calorieGoal: number;
}

export function WorkoutStatsCard({
  streak,
  weeklyWorkouts,
  weeklyGoal,
  waterIntake,
  waterGoal,
  calorieIntake,
  calorieGoal,
}: WorkoutStatsCardProps) {
  // Generate last 7 days for heatmap
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday start
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const weekDayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  const getWorkoutForDay = (day: Date) => {
    return weeklyWorkouts.find((w) => {
      const workoutDate = new Date(w.completedAt);
      return isSameDay(workoutDate, day);
    });
  };

  const workoutsThisWeek = weeklyWorkouts.length;
  const weeklyProgress = Math.min(workoutsThisWeek / weeklyGoal, 1);
  const waterProgress = Math.min(waterIntake / waterGoal, 1);
  const calorieProgress = Math.min(calorieIntake / calorieGoal, 1);

  return (
    <Card className="border-border/40 bg-zinc-950/50">
      <CardContent className="p-5 space-y-5">
        {/* Streak Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{streak} Day Streak</div>
              <div className="text-xs text-zinc-500">Keep it going!</div>
            </div>
          </div>
        </div>

        {/* Weekly Heatmap */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-300">This Week</span>
            <span className="text-sm text-zinc-500">
              {workoutsThisWeek}/{weeklyGoal} workouts
            </span>
          </div>

          <div className="flex gap-2">
            {weekDays.map((day, index) => {
              const workout = getWorkoutForDay(day);
              const isToday = isSameDay(day, today);
              const hasWorkout = !!workout;

              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      "w-full aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all",
                      hasWorkout
                        ? "bg-white text-black"
                        : isToday
                        ? "bg-zinc-800 border-2 border-zinc-700 text-zinc-500"
                        : "bg-zinc-900/50 text-zinc-600"
                    )}
                  >
                    {hasWorkout && <Dumbbell className="w-4 h-4" />}
                  </div>
                  <span className="text-xs text-zinc-600 font-bold">{weekDayLabels[index]}</span>
                </div>
              );
            })}
          </div>

          {/* Weekly Progress Bar */}
          <div className="space-y-1">
            <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${weeklyProgress * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-zinc-500">
              <span>{Math.round(weeklyProgress * 100)}% of weekly goal</span>
              <span>{weeklyGoal - workoutsThisWeek > 0 ? `${weeklyGoal - workoutsThisWeek} more to go` : "Goal reached!"}</span>
            </div>
          </div>
        </div>

        {/* Daily Progress */}
        <div className="space-y-3">
          <div className="text-sm font-semibold text-zinc-300">Today&apos;s Progress</div>

          <div className="space-y-3">
            {/* Water */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                <Droplets className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-300">Water</span>
                  <span className="text-zinc-500">
                    {waterIntake}/{waterGoal} glasses
                  </span>
                </div>
                <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${waterProgress * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Calories */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                <Utensils className="w-4 h-4 text-green-500" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-300">Calories</span>
                  <span className="text-zinc-500">
                    {calorieIntake.toLocaleString()}/{calorieGoal.toLocaleString()} kcal
                  </span>
                </div>
                <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${calorieProgress * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
