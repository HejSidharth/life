"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus } from "lucide-react";
import { WidgetCard } from "@/components/widgets/WidgetCard";
import { CalendarStrip } from "@/components/navigation/CalendarStrip";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useActiveDate } from "@/hooks/use-active-date";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { WorkoutStatsCard } from "@/components/dashboard/WorkoutStatsCard";

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

function DashboardContent() {
  const router = useRouter();
  const { user, isLoaded: userLoaded } = useUser();
  const userId = user?.id;

  const { selectedDate, isToday, setDate } = useActiveDate();

  const [greeting, setGreeting] = useState("Good morning");
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Fetch real stats from Convex for the selected date
  const stats = useQuery(
    api.stats.getTodayStats,
    userId ? { userId, date: selectedDate.getTime() } : "skip"
  );

  const recentActivityRaw = useQuery(
    api.stats.getRecentActivity,
    userId ? { userId, limit: 5 } : "skip"
  );

  // New: User profile and workout stats
  const userProfile = useQuery(
    api.users.getProfile,
    userId ? { clerkId: userId } : "skip"
  );

  const streakData = useQuery(
    api.workouts.getWorkoutStreak,
    userId ? { userId } : "skip"
  );

  const thisWeekWorkouts = useQuery(
    api.workouts.getThisWeekWorkouts,
    userId ? { userId } : "skip"
  );

  const getOrCreateUser = useMutation(api.users.getOrCreate);

  // Create user on first load
  useEffect(() => {
    const email = user?.emailAddresses?.[0]?.emailAddress;
    if (userId && email) {
      getOrCreateUser({
        clerkId: userId,
        email: email,
        name: user.fullName || undefined,
      });
    }
  }, [userId, user?.emailAddresses, user?.fullName, getOrCreateUser]);

  // Check if onboarding is needed
  useEffect(() => {
    if (userProfile && !userProfile.onboardingCompletedAt) {
      setShowOnboarding(true);
    }
  }, [userProfile]);

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
      calories: userProfile?.dailyCalorieTarget || 2000,
      protein: userProfile?.dailyProteinTarget || 150,
      carbs: userProfile?.dailyCarbsTarget || 250,
      fat: userProfile?.dailyFatTarget || 65,
      water: (userProfile?.dailyWaterTarget || 8) * 250, // Convert glasses to ml
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
      {/* Onboarding Modal */}
      {userId && (
        <OnboardingFlow
          open={showOnboarding}
          onOpenChange={setShowOnboarding}
          onComplete={() => setShowOnboarding(false)}
          clerkId={userId}
        />
      )}

      {/* Calendar Navigation */}
      <CalendarStrip selectedDate={selectedDate} onDateChange={setDate} />

      {/* Header Greeting */}
      <div>
        <h1 className="text-4xl font-black tracking-tight leading-none">
          {isToday ? greeting : format(selectedDate, "EEEE")}, {user?.firstName || "there"}
        </h1>
        <p className="text-zinc-500 mt-2 font-medium">
          {isToday
            ? "Consistency is key to excellence."
            : format(selectedDate, "MMMM do, yyyy")}
        </p>
      </div>

      {/* Stats Widgets Grid */}
      <div className="widget-grid">
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
      </div>

      {/* NEW: Workout Stats Card */}
      {userProfile?.onboardingCompletedAt && (
        <WorkoutStatsCard
          streak={streakData?.streak || 0}
          weeklyWorkouts={(thisWeekWorkouts || []) as any}
          weeklyGoal={userProfile?.weeklyWorkoutGoal || 4}
          waterIntake={Math.round(todayStats.water.current / 250)}
          waterGoal={userProfile?.dailyWaterTarget || 8}
          calorieIntake={todayStats.food.calories}
          calorieGoal={userProfile?.dailyCalorieTarget || 2000}
        />
      )}

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold px-1">Quick Actions</h2>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => router.push(`/exercise?date=${format(selectedDate, 'yyyy-MM-dd')}`)}
            className="w-full h-16 rounded-2xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold border border-border/50 shadow-sm"
          >
            {isToday ? "Start Workout" : "Log Training"}
          </Button>

          <Button
            onClick={() => router.push(`/food?date=${format(selectedDate, 'yyyy-MM-dd')}`)}
            className="w-full h-16 rounded-2xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold border border-border/50 shadow-sm"
          >
            Log Food
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <button className="text-sm text-muted-foreground flex items-center hover:text-foreground transition-colors">
            View all
            <ChevronRight className="w-4 h-4 ml-0.5" />
          </button>
        </div>

        <div className="space-y-2">
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No activity yet. Time to get started!
            </p>
          ) : (
            recentActivity.map((activity, index) => (
              <div
                key={index}
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
              </div>
            ))
          )}
        </div>
      </div>
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
