"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { format, addMonths } from "date-fns";

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
      <Card className="overflow-hidden rounded-[2rem] border border-border bg-card">
        <CardContent className="p-8 pt-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-foreground">Projected progress</h2>
            <div className="rounded-full border border-border bg-background px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Volume (lbs)
            </div>
          </div>

          <div className="h-[240px] w-full relative">
            {/* Custom Badges */}
            <div className="absolute left-0 top-4 z-10">
              <div className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-black text-foreground">
                {stats.current.toLocaleString()} lbs
              </div>
            </div>
            
            <div className="absolute right-0 top-[20%] z-10">
              <div className="rounded-xl border border-border bg-foreground px-3 py-1.5 text-xs font-black text-background">
                {stats.target.toLocaleString()} lbs
              </div>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-2xl border border-border bg-card p-3">
                          <p className="mb-1 text-[10px] font-black uppercase text-muted-foreground">{payload[0].payload.date}</p>
                          <p className="text-lg font-black text-foreground">{Math.round(payload[0].value as number).toLocaleString()} lbs</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="hsl(var(--primary))"
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
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={2} 
                  strokeDasharray="5 5" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-between items-center mt-4 px-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Today</span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{stats.targetDate}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
