"use client";

import { useState, useEffect } from "react";
import { FlowWizard, Step } from "@/components/ui/FlowWizard";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useWizard } from "@/context/WizardContext";

interface PlanSetupFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (data: PlanSetupData) => Promise<void>;
}

export interface PlanSetupData {
  goal: "strength" | "hypertrophy" | "general_fitness";
  experienceLevel: "beginner" | "intermediate" | "advanced";
  daysPerWeek: number;
}

export function PlanSetupFlow({ open, onOpenChange, onComplete }: PlanSetupFlowProps) {
  const [goal, setGoal] = useState<PlanSetupData["goal"]>("hypertrophy");
  const [level, setLevel] = useState<PlanSetupData["experienceLevel"]>("intermediate");
  const [days, setDays] = useState(4);
  const [showCelebration, setShowCelebration] = useState(false);
  const { setWizardOpen } = useWizard();

  // Track wizard open state for dock visibility
  useEffect(() => {
    setWizardOpen(open);
  }, [open, setWizardOpen]);

  const goals: { id: PlanSetupData["goal"]; label: string; desc: string }[] = [
    { id: "strength", label: "Strength", desc: "Focus on heavy lifts and raw power" },
    { id: "hypertrophy", label: "Muscle Growth", desc: "Optimize for size and aesthetics" },
    { id: "general_fitness", label: "Fitness", desc: "Overall health and athletic ability" },
  ];

  const levels: { id: PlanSetupData["experienceLevel"]; label: string; desc: string }[] = [
    { id: "beginner", label: "Beginner", desc: "Just starting out (0-1 years)" },
    { id: "intermediate", label: "Intermediate", desc: "Consistent training (1-3 years)" },
    { id: "advanced", label: "Advanced", desc: "Serious lifter (3+ years)" },
  ];
  const selectedGoalLabel = goals.find((entry) => entry.id === goal)?.label ?? "Fitness";

  const steps: Step[] = [
    {
      id: "goal",
      title: "Training Goal",
      content: (
        <div className="space-y-8">
          <div className="flow-prompt-card space-y-2 text-center">
            <h2 className="text-3xl font-display font-black tracking-tight flow-text">What&apos;s your goal?</h2>
            <p className="flow-muted font-medium italic">We&apos;ll tailor your plan based on this.</p>
          </div>
          <div className="space-y-3">
            {goals.map((g) => (
              <button
                key={g.id}
                onClick={() => setGoal(g.id)}
                className={cn(
                  "w-full p-6 rounded-3xl border text-left transition-all active:scale-[0.98] flex flex-col gap-1 group",
                  goal === g.id
                    ? "flow-cta text-white border-transparent"
                    : "flow-surface flow-outline flow-text hover:opacity-95"
                )}
              >
                <div className="font-bold text-lg leading-tight">{g.label}</div>
                <div className={cn("text-xs mt-0.5", goal === g.id ? "text-white/70" : "flow-muted")}>{g.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )
    },
    {
      id: "level",
      title: "Experience Level",
      content: (
        <div className="space-y-8">
          <div className="flow-prompt-card space-y-2 text-center">
            <h2 className="text-3xl font-display font-black tracking-tight flow-text">Your experience?</h2>
            <p className="flow-muted font-medium italic">Choose the tier that matches your history.</p>
          </div>
          <div className="space-y-3">
            {levels.map((l) => (
              <button
                key={l.id}
                onClick={() => setLevel(l.id)}
                className={cn(
                  "w-full p-6 rounded-3xl border text-left transition-all active:scale-[0.98] group",
                  level === l.id
                    ? "flow-cta text-white border-transparent"
                    : "flow-surface flow-outline flow-text hover:opacity-95"
                )}
              >
                <div className="font-bold text-xl leading-tight">{l.label}</div>
                <div className={cn("text-xs mt-1", level === l.id ? "text-white/70" : "flow-muted")}>{l.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )
    },
    {
      id: "schedule",
      title: "Weekly Schedule",
      content: (
        <div className="space-y-10">
          <div className="flow-prompt-card space-y-2 text-center">
            <h2 className="text-3xl font-display font-black tracking-tight flow-text">How many days?</h2>
            <p className="flow-muted font-medium italic">Select your preferred training frequency.</p>
          </div>

          <div className="mx-auto flex w-full max-w-[15rem] flex-col gap-2">
            {[2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                onClick={() => setDays(num)}
                className={cn(
                  "h-14 rounded-2xl border text-2xl font-display font-black transition-all active:scale-95",
                  days === num
                    ? "flow-cta text-white border-transparent"
                    : "flow-surface flow-outline flow-text"
                )}
              >
                {num}
              </button>
            ))}
            <p className="pt-2 text-center text-sm flow-muted">{days} days per week selected</p>
          </div>
        </div>
      )
    }
  ];

  // Handle skip - close wizard immediately
  const handleSkip = () => {
    handleOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setShowCelebration(false);
    }
    onOpenChange(nextOpen);
  };

  if (showCelebration) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="flow-theme flow-bg w-screen h-[100dvh] max-w-none rounded-none bg-background flex flex-col gap-0 p-0 overflow-hidden"
          showCloseButton={false}
          closeOnOverlayClick={false}
          closeOnEscape={false}
        >
          {/* Exit Button */}
          <button
            onClick={() => handleOpenChange(false)}
            className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full flow-surface border flow-outline flex items-center justify-center flow-muted hover:opacity-90 transition-all active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
            <div className="flow-prompt-card space-y-4">
              <h1 className="text-4xl font-display font-black tracking-tight leading-tight flow-text">
                Plan Generated!
              </h1>
                <p className="flow-muted text-lg font-medium max-w-xs mx-auto leading-relaxed">
                Your personalized {days}-day {selectedGoalLabel} plan is ready for you.
                </p>
            </div>
            <Button
              onClick={() => handleOpenChange(false)}
              variant="pillPrimary"
              size="pill"
              className="font-display w-full max-w-[20rem]"
            >
              Let&apos;s Crush It
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <FlowWizard
      open={open}
      onOpenChange={handleOpenChange}
      steps={steps}
      className="w-screen h-[100dvh] max-w-lg mx-auto rounded-none"
      showCloseButton={true}
      closeOnOverlayClick={false}
      closeOnEscape={false}
      onSkip={handleSkip}
      skipLabel="Skip Setup"
      onComplete={async () => {
        await onComplete({ goal, experienceLevel: level, daysPerWeek: days });
        setShowCelebration(true);
      }}
      completeLabel="Generate Plan"
    />
  );
}
