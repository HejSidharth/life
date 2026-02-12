"use client";

import { useState, useEffect } from "react";
import { FlowWizard, Step } from "@/components/ui/FlowWizard";
import { cn } from "@/lib/utils";
import { Utensils, Coffee, Sun, Moon, Search, Plus, Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

interface FoodLogFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (data: FoodData) => Promise<void>;
  initialMealType?: MealType;
}

export interface FoodData {
  name: string;
  mealType: MealType;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  portionSize: string;
  notes?: string;
  barcode?: string;
}

export function FoodLogFlow({ open, onOpenChange, onComplete, initialMealType }: FoodLogFlowProps) {
  const [mealType, setMealType] = useState<MealType>(initialMealType || "lunch");
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [portion, setPortion] = useState("1 serving");
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialMealType) setMealType(initialMealType);
      setName("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
      setPortion("1 serving");
      setShowCelebration(false);
    }
  }, [open, initialMealType]);

  const mealTypes: { id: MealType; label: string; icon: any }[] = [
    { id: "breakfast", label: "Breakfast", icon: Sun },
    { id: "lunch", label: "Lunch", icon: Utensils },
    { id: "dinner", label: "Dinner", icon: Moon },
    { id: "snack", label: "Snack", icon: Coffee },
  ];

  const steps: Step[] = [
    {
      id: "mealType",
      title: "Which meal?",
      content: (
        <div className="space-y-10 py-4">
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-white text-center">What are we eating?</h2>
            <p className="text-zinc-500 font-medium text-center italic">Categorize your entry.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {mealTypes.map((t) => (
              <button
                key={t.id}
                onClick={() => setMealType(t.id)}
                className={cn(
                  "h-32 rounded-3xl border transition-all active:scale-95 flex flex-col items-center justify-center gap-3",
                  mealType === t.id
                    ? "bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                    : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                )}
              >
                <t.icon className="w-8 h-8" />
                <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      )
    },
    {
      id: "identity",
      title: "Food Details",
      isNextDisabled: !name,
      content: (
        <div className="space-y-10 py-4">
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-white text-center">What's the food?</h2>
            <p className="text-zinc-500 font-medium text-center italic">Enter the name and portion size.</p>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Grilled Chicken"
                className="h-16 text-xl font-bold bg-zinc-900/50 border-zinc-800 rounded-2xl px-6 focus-visible:ring-white/20 text-center"
                autoFocus
              />
            </div>
            
            <div className="space-y-2 text-center">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Portion</label>
              <Input
                value={portion}
                onChange={(e) => setPortion(e.target.value)}
                placeholder="e.g. 200g, 1 bowl"
                className="h-14 text-lg font-bold bg-zinc-900/50 border-zinc-800 rounded-2xl px-6 focus-visible:ring-white/20 text-center"
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: "nutrition",
      title: "Nutrition",
      isNextDisabled: !calories || !protein,
      content: (
        <div className="space-y-8 py-4">
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-white text-center">Nutrition Facts</h2>
            <p className="text-zinc-500 font-medium text-center italic">Fuel your body with the right macros.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2 text-center">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Calories</label>
              <Input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="kcal"
                className="h-14 text-2xl font-black bg-zinc-900/50 border-zinc-800 rounded-2xl px-4 text-center"
              />
            </div>
            <div className="space-y-2 text-center">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Protein (g)</label>
              <Input
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="g"
                className="h-14 text-2xl font-black bg-zinc-900/50 border-zinc-800 rounded-2xl px-4 text-center"
              />
            </div>
            <div className="space-y-2 text-center">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Carbs (g)</label>
              <Input
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="g"
                className="h-14 text-2xl font-black bg-zinc-900/50 border-zinc-800 rounded-2xl px-4 text-center"
              />
            </div>
            <div className="space-y-2 text-center">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Fat (g)</label>
              <Input
                type="number"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                placeholder="g"
                className="h-14 text-2xl font-black bg-zinc-900/50 border-zinc-800 rounded-2xl px-4 text-center"
              />
            </div>
          </div>
        </div>
      )
    }
  ];

  if (showCelebration) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl h-[90vh] flex flex-col gap-0 p-0 overflow-hidden border-zinc-900 bg-black sm:rounded-[2.5rem]">
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12 }}
              className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.3)]"
            >
              <Check className="w-16 h-16 text-white stroke-[4]" />
            </motion.div>
            <div className="space-y-4">
              <h1 className="text-4xl font-black tracking-tight leading-tight">
                Logged! 🚀
              </h1>
              <p className="text-zinc-500 text-lg font-medium max-w-xs mx-auto leading-relaxed">
                Registered {calories}kcal of {name}. Fueling the fire!
              </p>
            </div>
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full h-16 rounded-[2rem] bg-white text-black hover:bg-zinc-200 text-lg font-bold"
            >
              Back to Menu
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <FlowWizard
      open={open}
      onOpenChange={onOpenChange}
      steps={steps}
      onComplete={async () => {
        await onComplete({
          name,
          mealType,
          calories: parseInt(calories) || 0,
          protein: parseInt(protein) || 0,
          carbs: parseInt(carbs) || 0,
          fat: parseInt(fat) || 0,
          portionSize: portion,
        });
        setShowCelebration(true);
      }}
      completeLabel="Save Meal"
    />
  );
}
