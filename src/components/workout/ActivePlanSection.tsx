"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface ActivePlanSectionProps {
  planName: string;
  currentWeek: number;
  totalWeeks: number;
  completedDays: number;
  totalDays: number;
  nextWorkoutDay?: string;
  className?: string;
}

export function ActivePlanSection({
  planName,
  currentWeek,
  totalWeeks,
  completedDays,
  totalDays,
  nextWorkoutDay,
  className,
}: ActivePlanSectionProps) {
  const progressPercent = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className={className}
    >
      <Card className="rounded-[1.75rem] border border-border bg-card overflow-hidden">
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Active Plan
              </p>
              <h3 className="text-lg font-black text-foreground truncate">
                {planName}
              </h3>
              <p className="text-sm font-medium text-muted-foreground">
                Week {currentWeek} of {totalWeeks}
              </p>
            </div>
            <Link
              href="/plan"
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-black uppercase tracking-wider hover:bg-accent transition-colors shrink-0"
            >
              View Plan
            </Link>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-foreground">
                {completedDays} of {totalDays} days completed
              </span>
              <span className="font-black text-primary">
                {progressPercent}%
              </span>
            </div>
            <Progress 
              value={progressPercent} 
              className="h-2.5 rounded-full"
            />
          </div>

          {/* Next Workout Info */}
          {nextWorkoutDay && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/50">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                Next: {nextWorkoutDay}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
