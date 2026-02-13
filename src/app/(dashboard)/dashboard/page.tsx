"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useActiveDate } from "@/hooks/use-active-date";
import { getDayPhase } from "@/lib/dayPhase";
import { format } from "date-fns";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { MascotSceneHero } from "@/components/dashboard/MascotSceneHero";
import { WorkoutStatsCard } from "@/components/dashboard/WorkoutStatsCard";
import { motion } from "framer-motion";
import { Flame, Heart, Plus, Store } from "lucide-react";

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

function DashboardContent() {
  const router = useRouter();
  const { user, isLoaded: userLoaded } = useUser();
  const userId = user?.id;

  const { selectedDate, isToday } = useActiveDate();

  const [showOnboarding, setShowOnboarding] = useState(false);

  // Fetch real stats from Convex for the selected date
  const stats = useQuery(
    api.stats.getTodayStats,
    userId ? { userId, date: selectedDate.getTime() } : "skip"
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

  const dayPhase = getDayPhase();

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
  const calorieProgress = Math.min(
    100,
    Math.round((todayStats.food.calories / Math.max(todayStats.goals.calories, 1)) * 100)
  );
  const carbsProgress = Math.min(
    100,
    Math.round((todayStats.food.carbs / Math.max(todayStats.goals.carbs, 1)) * 100)
  );
  const fatsProgress = Math.min(
    100,
    Math.round((todayStats.food.fat / Math.max(todayStats.goals.fat, 1)) * 100)
  );
  const proteinProgress = Math.min(
    100,
    Math.round((todayStats.food.protein / Math.max(todayStats.goals.protein, 1)) * 100)
  );
  const waterGlasses = Math.round(todayStats.water.current / 250);
  const heartSlots = 4;
  const activeHearts = Math.min(heartSlots, Math.max(1, streakData?.streak ? Math.ceil(streakData.streak / 3) : 1));

  if (!userLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Onboarding Modal */}
      {userId && (
        <OnboardingFlow
          open={showOnboarding}
          onOpenChange={setShowOnboarding}
          onComplete={() => setShowOnboarding(false)}
          clerkId={userId}
        />
      )}

      <MascotSceneHero
        sceneKey="dashboard"
        title=""
        subtitle={`${isToday ? dayPhase : "Selected Day"} · ${format(selectedDate, "MMMM do")}`}
        dateLabel={format(selectedDate, "yyyy")}
        showMascot={false}
        sceneMode="sky"
        compact
        skyColor="#2f67c7"
        footer={(
          <div className="flex items-end justify-between">
            <div>
              <p className="text-5xl font-black leading-none text-white">{user?.firstName || "Pal"}</p>
              <div className="mt-3 flex items-center gap-2">
                {Array.from({ length: heartSlots }).map((_, index) => (
                  <Heart
                    key={`heart-${index}`}
                    className={`h-7 w-7 ${
                      index < activeHearts
                        ? "fill-[#ff6043] text-[#ff6043]"
                        : "fill-white/20 text-white/50"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="mb-1 flex items-center gap-5 text-white">
              <div className="flex items-center gap-1.5">
                <Flame className="h-5 w-5 text-[#ffd45a]" />
                <span className="text-lg font-black">{streakData?.streak || 0}</span>
              </div>
              <button
                type="button"
                onClick={() => router.push("/settings")}
                className="rounded-full border border-white/30 bg-white/10 p-2.5 text-white transition-opacity hover:opacity-90"
                aria-label="Open shop"
              >
                <Store className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      />

      {/* Nutrition Card */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, type: "spring", stiffness: 260, damping: 30 }}
        className="rounded-[2rem] border border-border bg-card p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold tracking-wide text-muted-foreground">
              Calories eaten
            </p>
            <p className="mt-2 text-6xl font-black leading-none text-foreground">
              {todayStats.food.calories}
              <span className="ml-2 text-4xl text-muted-foreground">kcal</span>
            </p>
            <p className="mt-2 text-sm font-bold text-muted-foreground">
              {calorieProgress}% of {todayStats.goals.calories} kcal goal
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/food?date=${format(selectedDate, "yyyy-MM-dd")}`)}
            className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-foreground text-background transition-opacity hover:opacity-90"
            aria-label="Log food"
          >
            <Plus className="h-8 w-8" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <MacroStat
            label="Carbs"
            current={todayStats.food.carbs}
            goal={todayStats.goals.carbs}
            progress={carbsProgress}
          />
          <MacroStat
            label="Fats"
            current={todayStats.food.fat}
            goal={todayStats.goals.fat}
            progress={fatsProgress}
          />
          <MacroStat
            label="Proteins"
            current={todayStats.food.protein}
            goal={todayStats.goals.protein}
            progress={proteinProgress}
          />
        </div>
      </motion.section>

      <div className="grid grid-cols-2 gap-3">
        <SimpleMetricCard
          title="Water"
          value={`${waterGlasses}`}
          subtitle={`/ ${userProfile?.dailyWaterTarget || 8} glasses`}
          ctaLabel="Log water"
          onClick={() => router.push(`/hydration?date=${format(selectedDate, "yyyy-MM-dd")}`)}
        />
        <SimpleMetricCard
          title="Exercise"
          value={`${todayStats.exercise.minutes}`}
          subtitle={`/ ${todayStats.goals.exerciseMinutes} min`}
          ctaLabel={isToday ? "Start workout" : "View workout"}
          onClick={() => router.push(`/exercise?date=${format(selectedDate, "yyyy-MM-dd")}`)}
        />
      </div>

      {/* NEW: Workout Stats Card */}
      {userProfile?.onboardingCompletedAt && (
        <WorkoutStatsCard
          waterIntake={Math.round(todayStats.water.current / 250)}
          waterGoal={userProfile?.dailyWaterTarget || 8}
          calorieIntake={todayStats.food.calories}
          calorieGoal={userProfile?.dailyCalorieTarget || 2000}
        />
      )}

    </div>
  );
}

function MacroStat({
  label,
  current,
  goal,
  progress,
}: {
  label: string;
  current: number;
  goal: number;
  progress: number;
}) {
  return (
    <div className="space-y-2">
      <p className="text-lg font-black text-muted-foreground">{label}</p>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-3xl font-black leading-none text-foreground">
        {current}
        <span className="ml-1 text-xl text-muted-foreground">/ {goal}g</span>
      </p>
    </div>
  );
}

function SimpleMetricCard({
  title,
  value,
  subtitle,
  ctaLabel,
  onClick,
}: {
  title: string;
  value: string;
  subtitle: string;
  ctaLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[1.5rem] border border-border bg-card p-4 text-left transition-opacity hover:opacity-90"
    >
      <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="mt-2 text-5xl font-black leading-none text-foreground">{value}</p>
      <p className="mt-1 text-sm font-bold text-muted-foreground">{subtitle}</p>
      <p className="mt-4 text-xs font-black uppercase tracking-widest text-primary">{ctaLabel}</p>
    </button>
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
