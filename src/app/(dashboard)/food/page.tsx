"use client";

import { motion } from "framer-motion";
import { useState, Suspense } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useActiveDate } from "@/hooks/use-active-date";
import { getDayPhase } from "@/lib/dayPhase";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { FoodLogFlow, FoodData } from "@/components/food/FoodLogFlow";
import { MascotSceneHero } from "@/components/dashboard/MascotSceneHero";
import type { Id } from "convex/_generated/dataModel";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";
type FoodSource = "manual" | "usda" | "open_food_facts" | "imported";

interface FoodLogItem {
  _id: string;
  name: string;
  mealType: MealType;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  portionSize: string;
  source?: FoodSource;
  sourceConfidence?: number;
}

interface FavoriteFoodItem {
  _id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  portionSize: string;
}

interface DailyGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

function FoodContent() {
  const { user } = useUser();
  const userId = user?.id;

  const { selectedDate, isToday, getLogTimestamp } = useActiveDate();
  const dayPhase = getDayPhase();

  // Convex Queries
  const foods = (useQuery(
    api.foods.getByDateRange,
    userId ? { 
      userId, 
      startDate: new Date(selectedDate).setHours(0,0,0,0),
      endDate: new Date(selectedDate).setHours(23,59,59,999)
    } : "skip"
  ) || []) as FoodLogItem[];
  
  const dailyGoalQuery = useQuery(
    api.stats.getTodayStats,
    userId ? { userId, date: selectedDate.getTime() } : "skip"
  ) as { goals?: DailyGoals } | undefined;
  const recentFoodsRaw = useQuery(
    api.foods.getRecent,
    userId ? { userId, limit: 20 } : "skip"
  );
  const favoriteFoodsRaw = useQuery(
    api.favorites.getFoodFavorites,
    userId ? { userId } : "skip"
  );

  const goals = dailyGoalQuery?.goals || {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
  };

  // Convex Mutations
  const addFood = useMutation(api.foods.add);
  const removeFood = useMutation(api.foods.remove);
  const seedPackagedFoods = useMutation(api.foodCatalog.seedPackagedFoods);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>("lunch");
  const recentFoods = (recentFoodsRaw || []) as FoodLogItem[];
  const favoriteFoods = (favoriteFoodsRaw || []) as FavoriteFoodItem[];

  const totalNutrition = foods.reduce(
    (acc: { calories: number; protein: number; carbs: number; fat: number }, food: { calories: number; protein: number; carbs: number; fat: number }) => ({
      calories: acc.calories + food.calories,
      protein: acc.protein + food.protein,
      carbs: acc.carbs + food.carbs,
      fat: acc.fat + food.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  const bananaSlots = 5;
  const metCalories = totalNutrition.calories >= goals.calories;
  const metProtein = totalNutrition.protein >= goals.protein;
  const metCarbs = totalNutrition.carbs >= goals.carbs;
  const metFat = totalNutrition.fat >= goals.fat;
  const metCount = [metCalories, metProtein, metCarbs, metFat].filter(Boolean).length;
  const activeBananas = Math.min(bananaSlots, metCount + (metCount === 4 ? 1 : 0));

  const mealGroups = {
    breakfast: foods.filter((f: { mealType: string }) => f.mealType === "breakfast"),
    lunch: foods.filter((f: { mealType: string }) => f.mealType === "lunch"),
    dinner: foods.filter((f: { mealType: string }) => f.mealType === "dinner"),
    snack: foods.filter((f: { mealType: string }) => f.mealType === "snack"),
  };

  const handleLogFood = async (data: FoodData) => {
    if (!userId) return;
    await addFood({
      userId,
      name: data.name,
      mealType: data.mealType,
      calories: data.calories,
      protein: data.protein,
      carbs: data.carbs,
      fat: data.fat,
      fiber: data.fiber,
      portionSize: data.portionSize,
      notes: data.notes,
      consumedAt: getLogTimestamp(),
      source: "manual" as FoodSource,
      barcode: data.barcode,
    });
  };

  const handleSeedFoods = async () => {
    await seedPackagedFoods({});
  };

  return (
    <div className="space-y-6 pb-10">
      <MascotSceneHero
        sceneKey="food"
        title={isToday ? "Nutrition" : format(selectedDate, "EEEE")}
        subtitle={isToday ? `${dayPhase} · Fuel your performance.` : format(selectedDate, "MMMM do, yyyy")}
        dateLabel={format(selectedDate, "yyyy")}
        showMascot={false}
        sceneMode="sky"
        compact
        minHeight="10.375rem"
        skyColor="#2f6fd6"
        className="pt-3"
        footer={(
          <div className="mt-1 flex items-center justify-start gap-1.5">
            {Array.from({ length: bananaSlots }).map((_, index) => (
              <span
                key={`banana-${index}`}
                className={`text-lg leading-none ${index < activeBananas ? "opacity-100" : "opacity-35"}`}
                aria-hidden
              >
                🍌
              </span>
            ))}
            <span className="ml-1 text-sm font-black text-white">
              {activeBananas}/{bananaSlots}
            </span>
          </div>
        )}
      />

      {/* Daily Summary Card */}
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, ...springTransition }}
        className="rounded-[2rem] border border-border bg-card p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold tracking-wide text-muted-foreground">
              Calories Remaining
            </p>
            <h2 className="mt-2 text-6xl font-black leading-none text-foreground">
              {Math.max(0, goals.calories - totalNutrition.calories)}
              <span className="ml-2 text-4xl text-muted-foreground">kcal</span>
            </h2>
            <p className="mt-2 text-sm font-bold text-muted-foreground">
              {totalNutrition.calories} consumed of {goals.calories} goal
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-background px-4 py-3 text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Consumed</p>
            <p className="mt-1 text-2xl font-black text-foreground">
              {totalNutrition.calories}
              <span className="ml-1 text-sm text-muted-foreground">kcal</span>
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <MacroProgress label="Protein" current={totalNutrition.protein} goal={goals.protein} unit="g" />
          <MacroProgress label="Carbs" current={totalNutrition.carbs} goal={goals.carbs} unit="g" />
          <MacroProgress label="Fat" current={totalNutrition.fat} goal={goals.fat} unit="g" />
        </div>
      </motion.section>

      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        transition={springTransition}
      >
        <div className="rounded-[1.75rem] border border-border bg-card p-2">
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="h-11 w-full rounded-2xl border border-border bg-foreground text-[10px] font-black uppercase tracking-[0.2em] text-background transition-transform active:scale-95"
          >
            Add Food Entry
          </Button>
        </div>
      </motion.div>

      <section className="rounded-[1.75rem] border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-foreground">Quick Add</h3>
          <Button variant="outline" size="sm" onClick={handleSeedFoods} className="rounded-full border-border bg-background font-bold">
            Seed Foods
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {favoriteFoods.slice(0, 6).map((food) => (
            <Button
              key={food._id}
              variant="outline"
              size="sm"
              onClick={() =>
                addFood({
                  userId: userId!,
                  name: food.name,
                  mealType: selectedMealType,
                  calories: food.calories,
                  protein: food.protein,
                  carbs: food.carbs,
                  fat: food.fat,
                  fiber: food.fiber,
                  portionSize: food.portionSize,
                  consumedAt: getLogTimestamp(),
                  source: "manual" as FoodSource,
                })
              }
              className="rounded-full border-border bg-background text-xs font-bold"
            >
              {food.name}
            </Button>
          ))}
          {favoriteFoods.length === 0 && (
            <p className="text-xs font-semibold text-muted-foreground">No favorites yet. Entries will appear here automatically.</p>
          )}
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Recent meals</p>
          <div className="flex flex-wrap gap-2">
            {recentFoods.slice(0, 6).map((food) => (
              <Button
                key={food._id}
                variant="secondary"
                size="sm"
                onClick={() =>
                  addFood({
                    userId: userId!,
                    name: food.name,
                    mealType: selectedMealType,
                    calories: food.calories,
                    protein: food.protein,
                    carbs: food.carbs,
                    fat: food.fat,
                    fiber: food.fiber,
                    portionSize: food.portionSize,
                    consumedAt: getLogTimestamp(),
                    source: (food.source ?? "manual") as FoodSource,
                  })
                }
                className="rounded-full border border-border bg-background text-xs font-bold"
              >
                Repeat {food.name}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Meal Sections */}
      <div className="space-y-4">
        {MEAL_TYPES.map((type) => (
          <section key={type} className="space-y-2 rounded-[1.5rem] border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black capitalize text-foreground">{type}</h3>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                {mealGroups[type].reduce((sum: number, f: { calories: number }) => sum + f.calories, 0)} kcal
              </p>
            </div>

            <div className="space-y-2">
              {mealGroups[type].length === 0 ? (
                <button
                  type="button"
                  className="w-full rounded-2xl border border-border bg-background p-4 text-center transition-opacity hover:opacity-90"
                  onClick={() => {
                    setSelectedMealType(type);
                    setIsDialogOpen(true);
                  }}
                >
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Log {type}</span>
                </button>
              ) : (
                mealGroups[type].map((food) => (
                  <motion.div
                    key={food._id}
                    layoutId={food._id}
                    className="group relative flex items-center justify-between rounded-2xl border border-border bg-background p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-black text-foreground">{food.name}</p>
                        <p className="text-xs font-semibold text-muted-foreground">
                          {food.portionSize} · P: {food.protein}g · C: {food.carbs}g · F: {food.fat}g
                        </p>
                        {food.source && (
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Source: {food.source.replace("_", " ")}
                            {food.sourceConfidence !== undefined && ` · ${(food.sourceConfidence * 100).toFixed(0)}%`}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-black text-foreground">
                        {food.calories}
                        <span className="ml-0.5 text-[10px] font-bold uppercase text-muted-foreground">kcal</span>
                      </span>
                      <button
                        onClick={() => removeFood({ id: food._id as Id<"foods"> })}
                        className="rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-all hover:bg-red-500/10 hover:text-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </section>
        ))}
      </div>

      <FoodLogFlow
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onComplete={handleLogFood}
        initialMealType={selectedMealType}
      />
    </div>
  );
}

function MacroProgress({ label, current, goal, unit }: { label: string, current: number, goal: number, unit: string }) {
  const progress = Math.min(100, (current / goal) * 100);
  return (
    <div className="rounded-2xl border border-border bg-background p-3">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        <span>{current}/{goal}{unit}</span>
      </div>
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div 
          className="h-full rounded-full bg-primary" 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export default function FoodPage() {
  return (
    <Suspense fallback={<div className="w-full h-32 animate-pulse bg-secondary rounded-3xl" />}>
      <FoodContent />
    </Suspense>
  );
}
