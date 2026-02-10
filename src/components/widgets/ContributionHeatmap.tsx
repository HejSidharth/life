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
    if (!count) return "bg-zinc-900";
    if (count < 3) return "bg-zinc-700";
    if (count < 6) return "bg-zinc-500";
    if (count < 10) return "bg-zinc-300";
    return "bg-white";
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">
          Activity Insights
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-zinc-600">Less</span>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-sm bg-zinc-900" />
            <div className="w-2 h-2 rounded-sm bg-zinc-700" />
            <div className="w-2 h-2 rounded-sm bg-zinc-500" />
            <div className="w-2 h-2 rounded-sm bg-zinc-300" />
            <div className="w-2 h-2 rounded-sm bg-white" />
          </div>
          <span className="text-[10px] font-bold text-zinc-600">More</span>
        </div>
      </div>

      <div className="bg-zinc-900/30 border border-white/5 rounded-[2rem] p-6 overflow-x-auto hide-scrollbar">
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
