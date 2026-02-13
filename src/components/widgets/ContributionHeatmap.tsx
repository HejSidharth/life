"use client";

import { motion } from "framer-motion";
import { format, subDays, eachDayOfInterval, isSameDay } from "date-fns";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface ContributionHeatmapProps {
  counts: Record<string, number>;
  onDateClick?: (date: Date) => void;
}

export function ContributionHeatmap({ counts, onDateClick }: ContributionHeatmapProps) {
  // Generate last 18 weeks (about 4 months) for mobile-friendly view
  // Or 52 weeks for desktop? Let's stick to a manageable amount
  const days = useMemo(() => {
    const end = new Date();
    const start = subDays(end, 18 * 7 - 1); // 18 weeks
    return eachDayOfInterval({ start, end });
  }, []);

  const getIntensity = (count: number) => {
    if (!count) return "bg-secondary";
    if (count < 3) return "bg-primary/20";
    if (count < 6) return "bg-primary/40";
    if (count < 10) return "bg-accent/70";
    return "bg-primary";
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Activity Insights
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-muted-foreground">Less</span>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-sm bg-secondary" />
            <div className="w-2 h-2 rounded-sm bg-primary/20" />
            <div className="w-2 h-2 rounded-sm bg-primary/40" />
            <div className="w-2 h-2 rounded-sm bg-accent/70" />
            <div className="w-2 h-2 rounded-sm bg-primary" />
          </div>
          <span className="text-[10px] font-bold text-muted-foreground">More</span>
        </div>
      </div>

      <div className="bg-secondary border border-border/70 rounded-[2rem] p-6 overflow-x-auto hide-scrollbar">
        <div className="flex gap-1.5 min-w-max">
          {/* Group into weeks */}
          {Array.from({ length: 18 }).map((_, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1.5">
              {Array.from({ length: 7 }).map((_, dayIndex) => {
                const day = days[weekIndex * 7 + dayIndex];
                if (!day || day > new Date()) return <div key={dayIndex} className="w-3 h-3" />;
                
                const dateStr = format(day, "yyyy-MM-dd");
                const count = counts[dateStr] || 0;
                
                return (
                  <motion.div
                    key={dayIndex}
                    onClick={() => onDateClick?.(day)}
                    whileHover={{ scale: 1.2, zIndex: 10 }}
                    className={cn(
                      "w-3 h-3 rounded-sm transition-colors cursor-pointer",
                      getIntensity(count)
                    )}
                    title={`${dateStr}: ${count} entries`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
