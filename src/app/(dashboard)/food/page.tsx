"use client";

import { motion } from "framer-motion";
import { useState, Suspense } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useActiveDate } from "@/hooks/use-active-date";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { format } from "date-fns";
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

interface BarcodeCandidate {
  _id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  servingSize: number;
  servingUnit: string;
  source: FoodSource;
  barcode?: string;
}

interface BarcodeLookupResult {
  confidence: number;
  candidates: BarcodeCandidate[];
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
  const [barcodeInput, setBarcodeInput] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    mealType: "lunch" as MealType,
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    fiber: "",
    portionSize: "1 serving",
    notes: "",
  });
  const barcodeLookup = useQuery(
    api.foodCatalog.lookupByBarcode,
    barcodeInput.trim().length > 3 ? { barcode: barcodeInput.trim() } : "skip"
  ) as BarcodeLookupResult | undefined;
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

  const mealGroups = {
    breakfast: foods.filter((f: { mealType: string }) => f.mealType === "breakfast"),
    lunch: foods.filter((f: { mealType: string }) => f.mealType === "lunch"),
    dinner: foods.filter((f: { mealType: string }) => f.mealType === "dinner"),
    snack: foods.filter((f: { mealType: string }) => f.mealType === "snack"),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    await addFood({
      userId,
      name: formData.name,
      mealType: formData.mealType,
      calories: parseInt(formData.calories),
      protein: parseInt(formData.protein),
      carbs: parseInt(formData.carbs),
      fat: parseInt(formData.fat),
      fiber: formData.fiber ? parseInt(formData.fiber) : undefined,
      portionSize: formData.portionSize,
      notes: formData.notes || undefined,
      consumedAt: getLogTimestamp(),
      source: "manual" as FoodSource,
      barcode: barcodeInput || undefined,
    });
    setIsDialogOpen(false);
    resetForm();
  };

  const handleAddFromCatalog = async (item: BarcodeCandidate) => {
    if (!userId) return;
    await addFood({
      userId,
      name: item.name,
      mealType: formData.mealType,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      fiber: item.fiber,
      portionSize: `${item.servingSize}${item.servingUnit}`,
      consumedAt: getLogTimestamp(),
      source: item.source,
      foodItemId: item._id as Id<"foodItems">,
      barcode: item.barcode,
      sourceConfidence: barcodeLookup?.confidence ?? 0.8,
    });
  };

  const handleSeedFoods = async () => {
    await seedPackagedFoods({});
  };

  const resetForm = () => {
    setFormData({
      name: "",
      mealType: "lunch",
      calories: "",
      protein: "",
      carbs: "",
      fat: "",
      fiber: "",
      portionSize: "1 serving",
      notes: "",
    });
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isToday ? "Nutrition" : format(selectedDate, "EEEE")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isToday ? "Fuel your performance." : format(selectedDate, "MMMM do, yyyy")}
          </p>
        </div>
      </motion.div>

      {/* Daily Summary Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, ...springTransition }}
      >
        <Card className="border-0 bg-zinc-900/50 shadow-xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Calories Remaining</p>
                <h2 className="text-4xl font-black mt-1">
                  {Math.max(0, goals.calories - totalNutrition.calories)}
                  <span className="text-lg font-bold text-zinc-500 ml-2">kcal</span>
                </h2>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Consumed</p>
                <p className="text-lg font-bold">{totalNutrition.calories}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <MacroProgress label="Protein" current={totalNutrition.protein} goal={goals.protein} unit="g" />
              <MacroProgress label="Carbs" current={totalNutrition.carbs} goal={goals.carbs} unit="g" />
              <MacroProgress label="Fat" current={totalNutrition.fat} goal={goals.fat} unit="g" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Log Food Button */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        transition={springTransition}
      >
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="w-full h-16 rounded-3xl bg-white text-black hover:bg-zinc-200 text-lg font-bold shadow-xl shadow-white/5"
        >
          Add Food Entry
        </Button>
      </motion.div>

      <Card className="border-border/40 bg-zinc-950/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Quick Add: Favorites & Recents</h3>
            <Button variant="ghost" size="sm" onClick={handleSeedFoods}>
              Seed Packaged Foods
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {favoriteFoods.slice(0, 6).map((food) => (
              <Button
                key={food._id}
                variant="outline"
                size="sm"
                onClick={() =>
                  addFood({
                    userId: userId!,
                    name: food.name,
                    mealType: formData.mealType,
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
                className="text-xs"
              >
                {food.name}
              </Button>
            ))}
            {favoriteFoods.length === 0 && (
              <p className="text-xs text-zinc-500">No favorites yet. Entries will appear here automatically.</p>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Recent meals</p>
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
                      mealType: formData.mealType,
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
                  className="text-xs"
                >
                  Repeat {food.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meal Sections */}
      <div className="space-y-4">
        {MEAL_TYPES.map((type) => (
          <div key={type} className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-lg font-semibold capitalize">{type}</h3>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                {mealGroups[type].reduce((sum: number, f: { calories: number }) => sum + f.calories, 0)} kcal
              </p>
            </div>
            
            <div className="space-y-2">
              {mealGroups[type].length === 0 ? (
                <div 
                  className="p-4 bg-zinc-950/30 rounded-2xl border border-zinc-900/50 flex items-center justify-center cursor-pointer hover:bg-zinc-900/50 transition-all"
                  onClick={() => {
                    setFormData({ ...formData, mealType: type });
                    setIsDialogOpen(true);
                  }}
                >
                  <span className="text-xs font-bold text-zinc-700 uppercase tracking-widest">Log {type}</span>
                </div>
              ) : (
                mealGroups[type].map((food) => (
                  <motion.div
                    key={food._id}
                    layoutId={food._id}
                    className="group relative flex items-center justify-between p-4 bg-zinc-950/50 rounded-2xl border border-zinc-900 shadow-sm transition-all hover:border-zinc-800"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-semibold text-zinc-200">{food.name}</p>
                        <p className="text-xs text-zinc-500 font-medium">
                          {food.portionSize} · P: {food.protein}g · C: {food.carbs}g · F: {food.fat}g
                        </p>
                        {food.source && (
                          <p className="text-[10px] text-zinc-600 uppercase tracking-wider mt-1">
                            Source: {food.source.replace("_", " ")}
                            {food.sourceConfidence !== undefined && ` · ${(food.sourceConfidence * 100).toFixed(0)}%`}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-zinc-300">{food.calories}<span className="text-[10px] ml-0.5 text-zinc-500 font-bold uppercase">kcal</span></span>
                      <button 
                        onClick={() => removeFood({ id: food._id as Id<"foods"> })}
                        className="h-8 px-2 rounded-lg flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                      >
                        Delete
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-3xl border-border bg-card shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Log Food</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">
                Barcode
              </Label>
              <Input
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan or enter barcode"
                className="h-12 rounded-xl bg-zinc-900 border-0 focus-visible:ring-1 focus-visible:ring-white/20"
              />
              {barcodeLookup?.candidates?.length ? (
                <div className="space-y-2 pt-2">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                    Barcode matches ({(barcodeLookup.confidence * 100).toFixed(0)}% confidence)
                  </p>
                  {barcodeLookup.candidates.slice(0, 3).map((candidate) => (
                    <button
                      key={candidate._id}
                      type="button"
                      className="w-full text-left rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 hover:border-zinc-600"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          name: candidate.name,
                          calories: String(candidate.calories),
                          protein: String(candidate.protein),
                          carbs: String(candidate.carbs),
                          fat: String(candidate.fat),
                          fiber: candidate.fiber ? String(candidate.fiber) : "",
                          portionSize: `${candidate.servingSize}${candidate.servingUnit}`,
                        }));
                      }}
                    >
                      <p className="text-sm font-semibold text-zinc-100">
                        {candidate.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {candidate.calories} kcal · P {candidate.protein} · C {candidate.carbs} · F {candidate.fat}
                      </p>
                    </button>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleAddFromCatalog(barcodeLookup.candidates[0])}
                  >
                    Quick Add Best Match
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Food Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Chicken, rice, etc."
                className="h-12 rounded-xl bg-zinc-900 border-0 focus-visible:ring-1 focus-visible:ring-white/20"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Meal</Label>
                <Select
                  value={formData.mealType}
                  onChange={(e) => setFormData({ ...formData, mealType: e.target.value as MealType })}
                  className="h-12 rounded-xl bg-zinc-900 border-0"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Portion</Label>
                <Input
                  value={formData.portionSize}
                  onChange={(e) => setFormData({ ...formData, portionSize: e.target.value })}
                  placeholder="1 cup, 100g"
                  className="h-12 rounded-xl bg-zinc-900 border-0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Calories</Label>
                <Input
                  type="number"
                  value={formData.calories}
                  onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                  placeholder="kcal"
                  className="h-12 rounded-xl bg-zinc-900 border-0"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Protein (g)</Label>
                <Input
                  type="number"
                  value={formData.protein}
                  onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                  placeholder="g"
                  className="h-12 rounded-xl bg-zinc-900 border-0"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1 text-zinc-600">Carbs</Label>
                <Input
                  type="number"
                  value={formData.carbs}
                  onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                  className="h-12 rounded-xl bg-zinc-900 border-0"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1 text-zinc-600">Fat</Label>
                <Input
                  type="number"
                  value={formData.fat}
                  onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
                  className="h-12 rounded-xl bg-zinc-900 border-0"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1 text-zinc-600">Fiber</Label>
                <Input
                  type="number"
                  value={formData.fiber}
                  onChange={(e) => setFormData({ ...formData, fiber: e.target.value })}
                  className="h-12 rounded-xl bg-zinc-900 border-0"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-14 rounded-2xl bg-white text-black hover:bg-zinc-200 font-bold text-lg mt-2">
              Save Entry
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MacroProgress({ label, current, goal, unit }: { label: string, current: number, goal: number, unit: string }) {
  const progress = Math.min(100, (current / goal) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
        <span>{label}</span>
        <span>{current}/{goal}{unit}</span>
      </div>
      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-zinc-400" 
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
    <Suspense fallback={<div className="w-full h-32 animate-pulse bg-zinc-900 rounded-3xl" />}>
      <FoodContent />
    </Suspense>
  );
}
