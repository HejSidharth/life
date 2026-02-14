"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Dumbbell, Moon, Activity, Target, Flame, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

// Floating cloud animation styles
const cloudStyles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) translateX(0px); }
    50% { transform: translateY(-8px) translateX(4px); }
  }
  @keyframes float-delayed {
    0%, 100% { transform: translateY(0px) translateX(0px); }
    50% { transform: translateY(-6px) translateX(-3px); }
  }
  @keyframes float-slow {
    0%, 100% { transform: translateY(0px) translateX(0px); }
    50% { transform: translateY(-10px) translateX(2px); }
  }
  .cloud-float {
    animation: float 6s ease-in-out infinite;
  }
  .cloud-float-delayed {
    animation: float-delayed 8s ease-in-out infinite;
    animation-delay: 2s;
  }
  .cloud-float-slow {
    animation: float-slow 10s ease-in-out infinite;
    animation-delay: 1s;
  }
`;

export type DayType = "push" | "pull" | "legs" | "upper" | "lower" | "full_body" | "rest" | "other";

interface Prescription {
  _id: string;
  exerciseName: string;
  targetSets: number;
  targetReps: string;
}

interface TodayDayCardProps {
  dayName?: string;
  focus?: string;
  estimatedMinutes?: number;
  prescriptions: Prescription[];
  isRestDay: boolean;
  onStartWorkout: () => void;
  className?: string;
}

const dayTypeConfig: Record<DayType, { label: string; icon: typeof Dumbbell; color: string; bgColor: string }> = {
  push: {
    label: "PUSH DAY",
    icon: Target,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  pull: {
    label: "PULL DAY",
    icon: Zap,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  legs: {
    label: "LEG DAY",
    icon: Flame,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  upper: {
    label: "UPPER BODY",
    icon: Dumbbell,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
  lower: {
    label: "LOWER BODY",
    icon: Activity,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  full_body: {
    label: "FULL BODY",
    icon: Flame,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  rest: {
    label: "REST DAY",
    icon: Moon,
    color: "text-slate-600",
    bgColor: "bg-slate-100",
  },
  other: {
    label: "WORKOUT",
    icon: Dumbbell,
    color: "text-primary",
    bgColor: "bg-secondary",
  },
};

function getDayTypeFromFocus(focus?: string): DayType {
  if (!focus) return "other";
  const lowerFocus = focus.toLowerCase();
  if (lowerFocus.includes("push")) return "push";
  if (lowerFocus.includes("pull")) return "pull";
  if (lowerFocus.includes("leg")) return "legs";
  if (lowerFocus.includes("upper")) return "upper";
  if (lowerFocus.includes("lower")) return "lower";
  if (lowerFocus.includes("full")) return "full_body";
  if (lowerFocus.includes("rest")) return "rest";
  return "other";
}

export function TodayDayCard({
  dayName,
  focus,
  estimatedMinutes,
  prescriptions,
  isRestDay,
  onStartWorkout,
  className,
}: TodayDayCardProps) {
  const dayType = isRestDay ? "rest" : getDayTypeFromFocus(focus);
  const config = dayTypeConfig[dayType];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <style>{cloudStyles}</style>
      <Card className={cn(
        "relative overflow-hidden rounded-[1.75rem] border border-border bg-card"
      )}>
        {/* Floating Clouds - Only for workout days */}
        {!isRestDay && (
          <>
            {/* Cloud 1 - Top left */}
            <div 
              className="absolute -left-8 top-4 w-24 h-12 bg-gradient-to-br from-white/40 to-white/20 rounded-full blur-sm cloud-float"
              style={{ zIndex: 0 }}
            />
            {/* Cloud 2 - Top right */}
            <div 
              className="absolute -right-4 top-8 w-20 h-10 bg-gradient-to-br from-white/30 to-white/15 rounded-full blur-sm cloud-float-delayed"
              style={{ zIndex: 0 }}
            />
            {/* Cloud 3 - Middle right */}
            <div 
              className="absolute right-4 top-1/2 w-16 h-8 bg-gradient-to-br from-white/25 to-white/10 rounded-full blur-sm cloud-float-slow"
              style={{ zIndex: 0 }}
            />
            {/* Subtle sky gradient overlay */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-[#4a7fc9]/5 via-transparent to-[#6b9bd0]/5 pointer-events-none"
              style={{ zIndex: 0 }}
            />
          </>
        )}
        <CardContent className="p-5 relative" style={{ zIndex: 1 }}>
          {/* Header with Day Type Badge */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className={cn(
              "flex items-center gap-2.5 px-3 py-1.5 rounded-full",
              config.bgColor
            )}>
              <Icon className={cn("h-4 w-4", config.color)} />
              <span className={cn("text-xs font-black tracking-wider", config.color)}>
                {config.label}
              </span>
            </div>
            {!isRestDay && estimatedMinutes && (
              <span className="text-xs font-semibold text-muted-foreground">
                {estimatedMinutes} min
              </span>
            )}
          </div>

          {/* Day Name */}
          <h2 className="text-2xl font-black text-foreground mb-1">
            {isRestDay ? "Recovery Day" : (dayName || "Today's Workout")}
          </h2>
          
          {!isRestDay && focus && (
            <p className="text-sm font-medium text-muted-foreground mb-4">
              {focus}
            </p>
          )}

          {isRestDay && (
            <p className="text-sm font-medium text-muted-foreground mb-4">
              Take time to recover. Light stretching or walking is encouraged.
            </p>
          )}

          {/* Exercise Preview */}
          {!isRestDay && prescriptions.length > 0 && (
            <div className="space-y-2 mb-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {prescriptions.length} Exercises
              </p>
              <div className="space-y-1.5">
                {prescriptions.slice(0, 3).map((prescription) => (
                  <div
                    key={prescription._id}
                    className="flex items-center justify-between rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm"
                  >
                    <span className="font-semibold text-foreground truncate pr-2">
                      {prescription.exerciseName}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                      {prescription.targetSets} × {prescription.targetReps}
                    </span>
                  </div>
                ))}
                {prescriptions.length > 3 && (
                  <p className="text-xs font-medium text-muted-foreground px-1">
                    +{prescriptions.length - 3} more
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Button */}
          {isRestDay ? (
            <Button
              variant="outline"
              className="w-full rounded-full border-border bg-background font-black uppercase tracking-wider h-12"
              onClick={onStartWorkout}
            >
              Start Active Recovery
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              className="w-full rounded-full font-black uppercase tracking-wider h-12 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={onStartWorkout}
            >
              Start Workout
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
