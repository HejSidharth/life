"use client";

import { useState, useEffect } from "react";
import { FlowWizard, Step } from "@/components/ui/FlowWizard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useWizard } from "@/context/WizardContext";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import {
  Target,
  Dumbbell,
  Apple,
  Droplets,
  ArrowRight,
  Check,
  User,
  Calendar,
  Settings,
} from "lucide-react";

interface OnboardingFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  clerkId: string;
}

export function OnboardingFlow({ open, onOpenChange, onComplete, clerkId }: OnboardingFlowProps) {
  const { setWizardOpen } = useWizard();
  const calculateCalories = useMutation(api.users.calculateCalories);
  const completeOnboarding = useMutation(api.users.completeOnboarding);

  // Step 1: Units
  const [weightUnit, setWeightUnit] = useState<"lbs" | "kg">("lbs");
  const [heightUnit, setHeightUnit] = useState<"ft" | "cm">("ft");

  // Step 2: Body metrics
  const [age, setAge] = useState<number>(25);
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [heightFt, setHeightFt] = useState<number>(5);
  const [heightIn, setHeightIn] = useState<number>(9);
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weight, setWeight] = useState<number>(170);

  // Step 3: Activity level
  const [activityLevel, setActivityLevel] = useState<
    "sedentary" | "light" | "moderate" | "active" | "very_active"
  >("moderate");

  // Step 4: Fitness goal
  const [fitnessGoal, setFitnessGoal] = useState<
    "lose_weight" | "maintain" | "gain_muscle" | "strength" | "general"
  >("general");

  // Step 5: Weekly workout goal
  const [weeklyWorkoutGoal, setWeeklyWorkoutGoal] = useState<number>(4);

  // Step 6: Preferred days
  const [preferredDays, setPreferredDays] = useState<number[]>([1, 3, 5, 6]); // Mon, Wed, Fri, Sat

  // Step 7: Experience level
  const [experienceLevel, setExperienceLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");

  // Step 8: Calculated targets
  const [calculatedTargets, setCalculatedTargets] = useState<{
    targetCalories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
  } | null>(null);

  // Track wizard open state for dock visibility
  useEffect(() => {
    setWizardOpen(open);
  }, [open, setWizardOpen]);

  // Calculate targets when reaching step 8
  useEffect(() => {
    if (open && !calculatedTargets) {
      const weightKg = weightUnit === "lbs" ? weight * 0.453592 : weight;
      const heightCmValue = heightUnit === "ft" ? (heightFt * 30.48) + (heightIn * 2.54) : heightCm;

      calculateCalories({
        clerkId,
        weightKg,
        heightCm: heightCmValue,
        age,
        gender,
        activityLevel,
        fitnessGoal,
      }).then(setCalculatedTargets);
    }
  }, [open, calculatedTargets, calculateCalories, clerkId, weight, weightUnit, heightUnit, heightFt, heightIn, heightCm, age, gender, activityLevel, fitnessGoal]);

  const activityLevels = [
    { id: "sedentary", label: "Sedentary", desc: "Little to no exercise" },
    { id: "light", label: "Light", desc: "1-3 days per week" },
    { id: "moderate", label: "Moderate", desc: "3-5 days per week" },
    { id: "active", label: "Active", desc: "6-7 days per week" },
    { id: "very_active", label: "Very Active", desc: "Physical job or 2x training" },
  ];

  const fitnessGoals = [
    { id: "lose_weight", label: "Lose Weight", desc: "Calorie deficit, fat loss" },
    { id: "maintain", label: "Maintain", desc: "Keep current weight" },
    { id: "gain_muscle", label: "Gain Muscle", desc: "Calorie surplus, hypertrophy" },
    { id: "strength", label: "Strength", desc: "Powerlifting, max strength" },
    { id: "general", label: "General Fitness", desc: "Overall health and wellness" },
  ];

  const experienceLevels = [
    { id: "beginner", label: "Beginner", desc: "New to fitness or returning" },
    { id: "intermediate", label: "Intermediate", desc: "6+ months consistent training" },
    { id: "advanced", label: "Advanced", desc: "2+ years serious training" },
  ];

  const weekDays = [
    { id: 0, label: "Sun", full: "Sunday" },
    { id: 1, label: "Mon", full: "Monday" },
    { id: 2, label: "Tue", full: "Tuesday" },
    { id: 3, label: "Wed", full: "Wednesday" },
    { id: 4, label: "Thu", full: "Thursday" },
    { id: 5, label: "Fri", full: "Friday" },
    { id: 6, label: "Sat", full: "Saturday" },
  ];

  const toggleDay = (dayId: number) => {
    setPreferredDays((prev) => {
      if (prev.includes(dayId)) {
        return prev.filter((d) => d !== dayId);
      }
      return [...prev, dayId].sort();
    });
  };

  const steps: Step[] = [
    {
      id: "welcome",
      title: "Welcome",
      hideFooter: true,
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-8 px-4">
          <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center">
            <Dumbbell className="w-12 h-12 text-white" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black tracking-tight text-white">
              Welcome to Life
            </h1>
            <p className="text-zinc-500 text-lg max-w-sm mx-auto">
              Let&apos;s personalize your fitness journey. We&apos;ll set up your profile and goals in just a few steps.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "units",
      title: "Units",
      content: (
        <div className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-white text-center">Choose Your Units</h2>
            <p className="text-zinc-500 text-center">Select your preferred measurement system</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Weight</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "lbs", label: "Pounds (lbs)" },
                  { id: "kg", label: "Kilograms (kg)" },
                ].map((unit) => (
                  <button
                    key={unit.id}
                    onClick={() => setWeightUnit(unit.id as "lbs" | "kg")}
                    className={cn(
                      "p-4 rounded-2xl border text-left transition-all",
                      weightUnit === unit.id
                        ? "bg-white text-black border-white"
                        : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    )}
                  >
                    <div className="font-bold">{unit.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Height</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "ft", label: "Feet & Inches" },
                  { id: "cm", label: "Centimeters" },
                ].map((unit) => (
                  <button
                    key={unit.id}
                    onClick={() => setHeightUnit(unit.id as "ft" | "cm")}
                    className={cn(
                      "p-4 rounded-2xl border text-left transition-all",
                      heightUnit === unit.id
                        ? "bg-white text-black border-white"
                        : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    )}
                  >
                    <div className="font-bold">{unit.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "body-metrics",
      title: "Body Metrics",
      content: (
        <div className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-white text-center">Your Body Metrics</h2>
            <p className="text-zinc-500 text-center">Used to calculate your daily targets</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Age</label>
              <Input
                type="number"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value) || 25)}
                className="h-14 text-xl font-bold bg-zinc-900/50 border-zinc-800 rounded-2xl px-4"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Gender</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "male", label: "Male" },
                  { id: "female", label: "Female" },
                  { id: "other", label: "Other" },
                ].map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGender(g.id as "male" | "female" | "other")}
                    className={cn(
                      "p-4 rounded-2xl border text-center transition-all",
                      gender === g.id
                        ? "bg-white text-black border-white"
                        : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    )}
                  >
                    <div className="font-bold">{g.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Height</label>
              {heightUnit === "ft" ? (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      type="number"
                      value={heightFt}
                      onChange={(e) => setHeightFt(parseInt(e.target.value) || 5)}
                      placeholder="5"
                      className="h-14 text-xl font-bold bg-zinc-900/50 border-zinc-800 rounded-2xl px-4 text-center"
                    />
                    <div className="text-xs text-zinc-600 text-center mt-1">ft</div>
                  </div>
                  <div className="flex-1">
                    <Input
                      type="number"
                      value={heightIn}
                      onChange={(e) => setHeightIn(parseInt(e.target.value) || 9)}
                      placeholder="9"
                      className="h-14 text-xl font-bold bg-zinc-900/50 border-zinc-800 rounded-2xl px-4 text-center"
                    />
                    <div className="text-xs text-zinc-600 text-center mt-1">in</div>
                  </div>
                </div>
              ) : (
                <Input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(parseInt(e.target.value) || 175)}
                  placeholder="175"
                  className="h-14 text-xl font-bold bg-zinc-900/50 border-zinc-800 rounded-2xl px-4"
                />
              )}
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Current Weight ({weightUnit})</label>
              <Input
                type="number"
                value={weight}
                onChange={(e) => setWeight(parseInt(e.target.value) || 170)}
                className="h-14 text-xl font-bold bg-zinc-900/50 border-zinc-800 rounded-2xl px-4"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "activity-level",
      title: "Activity Level",
      content: (
        <div className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-white text-center">Activity Level</h2>
            <p className="text-zinc-500 text-center">How active are you outside of workouts?</p>
          </div>

          <div className="space-y-3">
            {activityLevels.map((level) => (
              <button
                key={level.id}
                onClick={() => setActivityLevel(level.id as typeof activityLevel)}
                className={cn(
                  "w-full p-5 rounded-2xl border text-left transition-all",
                  activityLevel === level.id
                    ? "bg-white text-black border-white"
                    : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                )}
              >
                <div className="font-bold text-lg">{level.label}</div>
                <div className={cn("text-sm mt-1", activityLevel === level.id ? "text-black/60" : "text-zinc-600")}>
                  {level.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "fitness-goal",
      title: "Fitness Goal",
      content: (
        <div className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-white text-center">What&apos;s Your Goal?</h2>
            <p className="text-zinc-500 text-center">This helps us calculate your daily targets</p>
          </div>

          <div className="space-y-3">
            {fitnessGoals.map((goal) => (
              <button
                key={goal.id}
                onClick={() => setFitnessGoal(goal.id as typeof fitnessGoal)}
                className={cn(
                  "w-full p-5 rounded-2xl border text-left transition-all",
                  fitnessGoal === goal.id
                    ? "bg-white text-black border-white"
                    : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                )}
              >
                <div className="font-bold text-lg">{goal.label}</div>
                <div className={cn("text-sm mt-1", fitnessGoal === goal.id ? "text-black/60" : "text-zinc-600")}>
                  {goal.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "weekly-goal",
      title: "Weekly Workouts",
      content: (
        <div className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-white text-center">Weekly Workout Goal</h2>
            <p className="text-zinc-500 text-center">How many days per week do you want to train?</p>
          </div>

          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="text-6xl font-black text-white">{weeklyWorkoutGoal}</div>
            </div>

            <input
              type="range"
              min={2}
              max={7}
              value={weeklyWorkoutGoal}
              onChange={(e) => setWeeklyWorkoutGoal(parseInt(e.target.value))}
              className="w-full h-3 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
            />

            <div className="flex justify-between text-xs text-zinc-600 font-bold uppercase tracking-wider">
              <span>2 days</span>
              <span>7 days</span>
            </div>

            <p className="text-center text-zinc-500 text-sm">
              {weeklyWorkoutGoal} days per week = {Math.round((weeklyWorkoutGoal / 7) * 100)}% consistency
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "preferred-days",
      title: "Preferred Days",
      isNextDisabled: preferredDays.length !== weeklyWorkoutGoal,
      content: (
        <div className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-white text-center">Preferred Training Days</h2>
            <p className="text-zinc-500 text-center">
              Select {weeklyWorkoutGoal} days that work best for you
            </p>
            {preferredDays.length !== weeklyWorkoutGoal && (
              <p className="text-center text-amber-500 text-sm">
                Selected {preferredDays.length} of {weeklyWorkoutGoal} required days
              </p>
            )}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const isSelected = preferredDays.includes(day.id);
              return (
                <button
                  key={day.id}
                  onClick={() => toggleDay(day.id)}
                  disabled={!isSelected && preferredDays.length >= weeklyWorkoutGoal}
                  className={cn(
                    "aspect-square rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all",
                    isSelected
                      ? "bg-white text-black border-white"
                      : preferredDays.length >= weeklyWorkoutGoal
                      ? "bg-zinc-900/30 border-zinc-800 text-zinc-600 cursor-not-allowed"
                      : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  )}
                >
                  <span className="text-xs font-bold">{day.label}</span>
                </button>
              );
            })}
          </div>

          <div className="text-center text-sm text-zinc-500">
            {preferredDays.length === weeklyWorkoutGoal ? (
              <span className="text-green-500">✓ Perfect! {preferredDays.length} days selected</span>
            ) : preferredDays.length < weeklyWorkoutGoal ? (
              <span>Select {weeklyWorkoutGoal - preferredDays.length} more day{weeklyWorkoutGoal - preferredDays.length > 1 ? "s" : ""}</span>
            ) : (
              <span className="text-red-500">Too many days selected</span>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "experience",
      title: "Experience",
      content: (
        <div className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-white text-center">Experience Level</h2>
            <p className="text-zinc-500 text-center">How would you describe your fitness experience?</p>
          </div>

          <div className="space-y-3">
            {experienceLevels.map((level) => (
              <button
                key={level.id}
                onClick={() => setExperienceLevel(level.id as typeof experienceLevel)}
                className={cn(
                  "w-full p-5 rounded-2xl border text-left transition-all",
                  experienceLevel === level.id
                    ? "bg-white text-black border-white"
                    : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                )}
              >
                <div className="font-bold text-lg">{level.label}</div>
                <div className={cn("text-sm mt-1", experienceLevel === level.id ? "text-black/60" : "text-zinc-600")}>
                  {level.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "targets",
      title: "Your Targets",
      content: (
        <div className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-white text-center">Daily Targets</h2>
            <p className="text-zinc-500 text-center">Auto-calculated based on your profile</p>
          </div>

          {calculatedTargets ? (
            <div className="space-y-4">
              <div className="bg-zinc-900/50 rounded-2xl p-5 border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-zinc-400" />
                    <span className="font-bold text-white">Calories</span>
                  </div>
                  <span className="text-2xl font-black text-white">{calculatedTargets.targetCalories}</span>
                </div>
                <div className="text-xs text-zinc-500">kcal per day</div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Protein</div>
                  <div className="text-xl font-black text-white">{calculatedTargets.proteinGrams}g</div>
                </div>

                <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Carbs</div>
                  <div className="text-xl font-black text-white">{calculatedTargets.carbsGrams}g</div>
                </div>

                <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Fat</div>
                  <div className="text-xl font-black text-white">{calculatedTargets.fatGrams}g</div>
                </div>
              </div>

              <div className="bg-zinc-900/50 rounded-2xl p-5 border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-blue-400" />
                    <span className="font-bold text-white">Water</span>
                  </div>
                  <span className="text-2xl font-black text-white">8</span>
                </div>
                <div className="text-xs text-zinc-500">glasses per day</div>
              </div>

              <p className="text-xs text-zinc-600 text-center">
                You can edit these targets anytime in Settings
              </p>
            </div>
          ) : (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>
      ),
    },
  ];

  const handleComplete = async () => {
    if (!calculatedTargets) return;

    const weightKg = weightUnit === "lbs" ? weight * 0.453592 : weight;
    const heightCmValue = heightUnit === "ft" ? (heightFt * 30.48) + (heightIn * 2.54) : heightCm;

    await completeOnboarding({
      clerkId,
      weightUnit,
      distanceUnit: "miles",
      age,
      gender,
      heightCm: heightCmValue,
      weightKg,
      activityLevel,
      fitnessGoal,
      weeklyWorkoutGoal,
      preferredWorkoutDays: preferredDays,
      experienceLevel,
      dailyCalorieTarget: calculatedTargets.targetCalories,
      dailyProteinTarget: calculatedTargets.proteinGrams,
      dailyCarbsTarget: calculatedTargets.carbsGrams,
      dailyFatTarget: calculatedTargets.fatGrams,
      dailyWaterTarget: 8,
    });

    onComplete();
  };

  return (
    <FlowWizard
      open={open}
      onOpenChange={onOpenChange}
      steps={steps}
      className="w-screen h-[100dvh] max-w-none rounded-none border-0"
      showCloseButton={false}
      closeOnOverlayClick={false}
      closeOnEscape={false}
      onComplete={handleComplete}
      completeLabel="Start Your Journey"
    />
  );
}
