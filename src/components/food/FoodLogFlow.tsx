"use client";

import { useState, useEffect } from "react";
import { FlowWizard, Step } from "@/components/ui/FlowWizard";
import { cn } from "@/lib/utils";
import { Utensils, Coffee, Sun, Moon, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useWizard } from "@/context/WizardContext";

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
  const { setWizardOpen } = useWizard();

  /* eslint-disable react-hooks/set-state-in-effect */
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
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!open) return;
    setWizardOpen(true);
    return () => setWizardOpen(false);
  }, [open, setWizardOpen]);

  const mealTypes: { id: MealType; label: string; icon: LucideIcon }[] = [
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
          <div className="flow-prompt-card space-y-2 text-center">
            <h2 className="text-3xl font-display font-black tracking-tight flow-text">What are we eating?</h2>
            <p className="flow-muted font-medium italic">Categorize your entry.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {mealTypes.map((t) => (
              <button
                key={t.id}
                onClick={() => setMealType(t.id)}
                className={cn(
                  "h-32 rounded-3xl border transition-all active:scale-95 flex flex-col items-center justify-center gap-3",
                  mealType === t.id
                    ? "flow-cta text-white border-transparent"
                    : "flow-surface flow-outline flow-text hover:opacity-95"
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
          <div className="flow-prompt-card space-y-2 text-center">
            <h2 className="text-3xl font-display font-black tracking-tight flow-text">What&apos;s the food?</h2>
            <p className="flow-muted font-medium italic">Enter the name and portion size.</p>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] flow-muted">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Grilled Chicken"
                className="h-16 rounded-2xl px-6 text-center text-xl font-bold flow-surface flow-outline flow-text focus-visible:ring-[var(--flow-progress)]/20"
                autoFocus
              />
            </div>
            
            <div className="space-y-2 text-center">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] flow-muted">Portion</label>
              <Input
                value={portion}
                onChange={(e) => setPortion(e.target.value)}
                placeholder="e.g. 200g, 1 bowl"
                className="h-14 rounded-2xl px-6 text-center text-lg font-bold flow-surface flow-outline flow-text focus-visible:ring-[var(--flow-progress)]/20"
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
          <div className="flow-prompt-card space-y-2 text-center">
            <h2 className="text-3xl font-display font-black tracking-tight flow-text">Nutrition Facts</h2>
            <p className="flow-muted font-medium italic">Fuel your body with the right macros.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2 text-center">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] flow-muted">Calories</label>
              <Input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="kcal"
                className="h-14 rounded-2xl px-4 text-center text-2xl font-display font-black flow-surface flow-outline flow-text"
              />
            </div>
            <div className="space-y-2 text-center">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] flow-muted">Protein (g)</label>
              <Input
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="g"
                className="h-14 rounded-2xl px-4 text-center text-2xl font-display font-black flow-surface flow-outline flow-text"
              />
            </div>
            <div className="space-y-2 text-center">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] flow-muted">Carbs (g)</label>
              <Input
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="g"
                className="h-14 rounded-2xl px-4 text-center text-2xl font-display font-black flow-surface flow-outline flow-text"
              />
            </div>
            <div className="space-y-2 text-center">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] flow-muted">Fat (g)</label>
              <Input
                type="number"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                placeholder="g"
                className="h-14 rounded-2xl px-4 text-center text-2xl font-display font-black flow-surface flow-outline flow-text"
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
        <DialogContent className="flow-theme flow-bg max-w-2xl h-[90vh] flex flex-col gap-0 p-0 overflow-hidden bg-background sm:rounded-[2.5rem]">
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12 }}
              className="w-32 h-32 flow-cta rounded-full flex items-center justify-center border border-border"
            >
              <Check className="w-16 h-16 text-white stroke-[4]" />
            </motion.div>
            <div className="flow-prompt-card space-y-4">
              <h1 className="text-4xl font-display font-black tracking-tight leading-tight flow-text">
                Logged! 🚀
              </h1>
              <p className="flow-muted text-lg font-medium max-w-xs mx-auto leading-relaxed">
                Registered {calories}kcal of {name}. Fueling the fire!
              </p>
            </div>
            <Button
              onClick={() => onOpenChange(false)}
              variant="pillPrimary"
              size="pill"
              className="font-display w-full max-w-[20rem]"
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
      className="w-screen h-[100dvh] max-w-lg mx-auto rounded-none"
      showCloseButton={true}
      closeOnOverlayClick={false}
      closeOnEscape={false}
      onSkip={() => onOpenChange(false)}
      skipLabel="Cancel"
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
