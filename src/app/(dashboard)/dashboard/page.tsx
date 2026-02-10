"use client";

import { motion } from "framer-motion";
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { 
  ChevronRight,
  Plus
} from "lucide-react";
import { WidgetCard } from "@/components/widgets/WidgetCard";
import { ContributionHeatmap } from "@/components/widgets/ContributionHeatmap";
import { CalendarStrip } from "@/components/navigation/CalendarStrip";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useActiveDate } from "@/hooks/use-active-date";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface TodayStats {
  food: { calories: number; protein: number; carbs: number; fat: number };
  water: { current: number };
  exercise: { minutes: number; count: number };
  goals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    water: number;
    exerciseMinutes: number;
  };
}

interface Activity {
  type: "food" | "exercise" | "hydration" | "pr";
  name: string;
  detail: string;
  timestamp: number;
  highlight?: boolean;
}

const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
    },
  },
};

function DashboardContent() {
  const router = useRouter();
  const { user, isLoaded: userLoaded } = useUser();
  const userId = user?.id;

  const { selectedDate, isToday, setDate } = useActiveDate();

  const [greeting, setGreeting] = useState("Good morning");

  // Fetch real stats from Convex for the selected date
  const stats = useQuery(
    api.stats.getTodayStats,
    userId ? { userId, date: selectedDate.getTime() } : "skip"
  );
  
  const recentActivityRaw = useQuery(
    api.stats.getRecentActivity,
    userId ? { userId, limit: 5 } : "skip"
  );

  const contributionHistory = useQuery(
    api.stats.getContributionHistory,
    userId ? { userId, days: 126 } : "skip"
  ) || {};

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const todayStats: TodayStats = (stats as any) || {
    food: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    water: { current: 0 },
    exercise: { minutes: 0, count: 0 },
    goals: {
      calories: 2000,
      protein: 150,
      carbs: 250,
      fat: 65,
      water: 2500,
      exerciseMinutes: 60,
    },
  };

  const recentActivity: Activity[] = (recentActivityRaw as any) || [];

  if (!userLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Calendar Navigation */}
      <CalendarStrip selectedDate={selectedDate} onDateChange={setDate} />

      {/* Header Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <h1 className="text-4xl font-black tracking-tight leading-none">
          {isToday ? greeting : format(selectedDate, "EEEE")}, {user?.firstName || "there"}
        </h1>
        <p className="text-zinc-500 mt-2 font-medium">
          {isToday 
            ? "Consistency is key to excellence." 
            : format(selectedDate, "MMMM do, yyyy")}
        </p>
      </motion.div>

      {/* Stats Widgets Grid */}
      <motion.div
        className="widget-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <WidgetCard
            title="Calories"
            value={todayStats.food.calories}
            subtitle={`/ ${todayStats.goals.calories} kcal`}
            progress={{
              value: todayStats.food.calories,
              max: todayStats.goals.calories,
            }}
            color="#A1A1AA"
            onClick={() => router.push(`/food?date=${format(selectedDate, 'yyyy-MM-dd')}`)}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <WidgetCard
            title="Protein"
            value={`${todayStats.food.protein}g`}
            subtitle={`/ ${todayStats.goals.protein}g`}
            progress={{
              value: todayStats.food.protein,
              max: todayStats.goals.protein,
            }}
            color="#A1A1AA"
            onClick={() => router.push(`/food?date=${format(selectedDate, 'yyyy-MM-dd')}`)}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <WidgetCard
            title="Water"
            value={`${(todayStats.water.current / 1000).toFixed(1)}L`}
            subtitle={`/ ${(todayStats.goals.water / 1000).toFixed(1)}L`}
            progress={{
              value: todayStats.water.current,
              max: todayStats.goals.water,
            }}
            color="#A1A1AA"
            onClick={() => router.push(`/hydration?date=${format(selectedDate, 'yyyy-MM-dd')}`)}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <WidgetCard
            title="Exercise"
            value={`${todayStats.exercise.minutes}m`}
            subtitle={`/ ${todayStats.goals.exerciseMinutes} min`}
            progress={{
              value: todayStats.exercise.minutes,
              max: todayStats.goals.exerciseMinutes,
            }}
            color="#A1A1AA"
            onClick={() => router.push(`/exercise?date=${format(selectedDate, 'yyyy-MM-dd')}`)}
          />
        </motion.div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, ...springTransition }}
        className="space-y-3"
      >
        <h2 className="text-lg font-semibold px-1">Quick Actions</h2>
        
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            transition={springTransition}
          >
            <Button
              onClick={() => router.push(`/exercise?date=${format(selectedDate, 'yyyy-MM-dd')}`)}
              className="w-full h-16 rounded-2xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold border border-border/50 shadow-sm"
            >
              {isToday ? "Start Workout" : "Log Training"}
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            transition={springTransition}
          >
            <Button
              onClick={() => router.push(`/food?date=${format(selectedDate, 'yyyy-MM-dd')}`)}
              className="w-full h-16 rounded-2xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold border border-border/50 shadow-sm"
            >
              Log Food
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, ...springTransition }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <motion.button
            className="text-sm text-muted-foreground flex items-center hover:text-foreground transition-colors"
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.95 }}
            transition={springTransition}
          >
            View all
            <ChevronRight className="w-4 h-4 ml-0.5" />
          </motion.button>
        </div>

        <div className="space-y-2">
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No activity yet. Time to get started!
            </p>
          ) : (
            recentActivity.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 0.6 + index * 0.08,
                  ...springTransition,
                }}
                whileHover={{ scale: 1.01, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl cursor-pointer",
                  "bg-card border border-border/50",
                  "hover:border-white/20 transition-all shadow-sm"
                )}
              >
              <div className="flex items-center gap-3">
                <div>
                  <p className={cn(
                    "font-bold capitalize text-zinc-200",
                    activity.highlight && "text-white"
                  )}>
                    {activity.name}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">
                    {activity.detail}
                  </p>
                </div>
              </div>
                
                <span className="text-xs text-muted-foreground">
                  {new Date(activity.timestamp).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Contribution Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, ...springTransition }}
      >
        <ContributionHeatmap 
          counts={contributionHistory} 
          onDateClick={setDate}
        />
      </motion.div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
