"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { format, addMonths, startOfMonth } from "date-fns";

interface WorkoutProgressHeroProps {
  recentWorkouts: {
    totalVolume: number;
    completedAt: number;
  }[];
}

export function WorkoutProgressHero({ recentWorkouts }: WorkoutProgressHeroProps) {
  const chartData = useMemo(() => {
    if (recentWorkouts.length < 2) return [];

    // Sort by date ascending
    const sorted = [...recentWorkouts]
      .filter(w => w.completedAt)
      .sort((a, b) => a.completedAt - b.completedAt);

    // Group by month/week or just show last 15 sessions
    const lastSessions = sorted.slice(-15);

    const baseData = lastSessions.map((w, i) => ({
      index: i,
      volume: w.totalVolume,
      date: format(new Date(w.completedAt), "MMM d"),
      isProjected: false,
    }));

    // Calculate projection (simple linear growth based on last 5 sessions)
    const recentSample = baseData.slice(-5);
    const firstVol = recentSample[0].volume;
    const lastVol = recentSample[recentSample.length - 1].volume;
    const avgGrowth = (lastVol - firstVol) / (recentSample.length - 1 || 1);
    
    // Safety check for negative growth or static
    const projectedGrowth = Math.max(avgGrowth, lastVol * 0.02);

    const projectedData = Array.from({ length: 5 }).map((_, i) => ({
      index: baseData.length + i,
      volume: lastVol + (projectedGrowth * (i + 1)),
      date: "Projected",
      isProjected: true,
    }));

    return [...baseData, ...projectedData];
  }, [recentWorkouts]);

  const stats = useMemo(() => {
    if (chartData.length === 0) return null;
    const current = chartData.find(d => !d.isProjected && d.index === Math.max(...chartData.filter(x => !x.isProjected).map(x => x.index)))?.volume || 0;
    const target = chartData[chartData.length - 1].volume;
    const targetDate = format(addMonths(new Date(), 3), "MMMM yyyy");
    
    return {
      current,
      target: Math.round(target / 1000) * 1000,
      targetDate,
    };
  }, [chartData]);

  if (!stats || chartData.length === 0) return null;

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-zinc-900/40 backdrop-blur-xl overflow-hidden rounded-[2.5rem]">
        <CardContent className="p-8 pt-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-white">Projected progress</h2>
            <div className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Volume (lbs)
            </div>
          </div>

          <div className="h-[240px] w-full relative">
            {/* Custom Badges */}
            <div className="absolute left-0 top-4 z-10">
              <div className="px-3 py-1.5 rounded-xl bg-zinc-800/80 backdrop-blur-sm border border-zinc-700 text-xs font-bold text-zinc-100">
                {stats.current.toLocaleString()} lbs
              </div>
            </div>
            
            <div className="absolute right-0 top-[20%] z-10">
              <div className="px-3 py-1.5 rounded-xl bg-primary text-black text-xs font-black shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                {stats.target.toLocaleString()} lbs
              </div>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fff" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#fff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl shadow-2xl">
                          <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">{payload[0].payload.date}</p>
                          <p className="text-lg font-bold text-white">{Math.round(payload[0].value as number).toLocaleString()} lbs</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="#fff"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorVol)"
                  animationDuration={2000}
                />
                <ReferenceLine 
                  segment={[
                    { x: chartData.length - 6, y: chartData[chartData.length - 6].volume }, 
                    { x: chartData.length - 1, y: chartData[chartData.length - 1].volume }
                  ]} 
                  stroke="#666" 
                  strokeWidth={2} 
                  strokeDasharray="5 5" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-between items-center mt-4 px-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Today</span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">{stats.targetDate}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
