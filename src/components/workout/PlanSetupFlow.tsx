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

  const steps: Step[] = [
    {
      id: "goal",
      title: "Training Goal",
      content: (
        <div className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-white text-center">What&apos;s your goal?</h2>
            <p className="text-zinc-500 font-medium text-center italic">We&apos;ll tailor your plan based on this.</p>
          </div>
          <div className="space-y-3">
            {goals.map((g) => (
              <button
                key={g.id}
                onClick={() => setGoal(g.id)}
                className={cn(
                  "w-full p-6 rounded-3xl border text-left transition-all active:scale-[0.98] flex flex-col gap-1 group",
                  goal === g.id
                    ? "bg-white text-black border-white"
                    : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                )}
              >
                <div className="font-bold text-lg leading-tight">{g.label}</div>
                <div className={cn("text-xs mt-0.5", goal === g.id ? "text-black/60" : "text-zinc-600")}>{g.desc}</div>
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
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-white text-center">Your experience?</h2>
            <p className="text-zinc-500 font-medium text-center italic">Choose the tier that matches your history.</p>
          </div>
          <div className="space-y-3">
            {levels.map((l) => (
              <button
                key={l.id}
                onClick={() => setLevel(l.id)}
                className={cn(
                  "w-full p-6 rounded-3xl border text-left transition-all active:scale-[0.98] group",
                  level === l.id
                    ? "bg-white text-black border-white"
                    : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                )}
              >
                <div className="font-bold text-xl leading-tight">{l.label}</div>
                <div className={cn("text-xs mt-1", level === l.id ? "text-black/60" : "text-zinc-600")}>{l.desc}</div>
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
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-white text-center">How many days?</h2>
            <p className="text-zinc-500 font-medium text-center italic">Select your preferred training frequency.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                onClick={() => setDays(num)}
                className={cn(
                  "h-24 rounded-3xl border text-2xl font-black transition-all active:scale-95 flex flex-col items-center justify-center gap-1",
                  days === num
                    ? "bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                    : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                )}
              >
                <span>{num}</span>
                <span className="text-[10px] uppercase tracking-widest opacity-60">Days / Week</span>
              </button>
            ))}
          </div>
        </div>
      )
    }
  ];

  // Handle skip - close wizard immediately
  const handleSkip = () => {
    onOpenChange(false);
  };

  if (showCelebration) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="w-screen h-[100dvh] max-w-none rounded-none border-0 flex flex-col gap-0 p-0 overflow-hidden bg-black"
          showCloseButton={false}
          closeOnOverlayClick={false}
          closeOnEscape={false}
        >
          {/* Exit Button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-zinc-900/80 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-black tracking-tight leading-tight">
                Plan Generated!
              </h1>
                <p className="text-zinc-500 text-lg font-medium max-w-xs mx-auto leading-relaxed">
                Your personalized {days}-day {goal} plan is ready for you.
                </p>
            </div>
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full h-16 rounded-[2rem] bg-white text-black hover:bg-zinc-200 text-lg font-bold"
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
      onOpenChange={onOpenChange}
      steps={steps}
      className="w-screen h-[100dvh] max-w-none rounded-none border-0"
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
