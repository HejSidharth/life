"use client";

import { useState, useEffect } from "react";
import { FlowWizard, Step } from "@/components/ui/FlowWizard";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useWizard } from "@/context/WizardContext";

interface NewWorkoutFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (name: string) => Promise<void>;
}

export function NewWorkoutFlow({ open, onOpenChange, onComplete }: NewWorkoutFlowProps) {
  const [name, setName] = useState("");
  const { setWizardOpen } = useWizard();

  // Track wizard open state for dock visibility
  useEffect(() => {
    if (!open) return;
    setWizardOpen(true);
    return () => setWizardOpen(false);
  }, [open, setWizardOpen]);

  const presets = [
    "Full Body ⚡️",
    "Upper Body 💪",
    "Lower Body 🦵",
    "Push Day 🔥",
    "Pull Day 🦾",
    "Leg Day 🍗",
  ];

  const steps: Step[] = [
    {
      id: "name",
      title: "Workout Name",
      isNextDisabled: !name,
      content: (
        <div className="space-y-10 py-4">
          <div className="flow-prompt-card space-y-2 text-center">
            <h2 className="text-3xl font-display font-black tracking-tight flow-text">Name your session</h2>
            <p className="flow-muted font-medium italic">Give today&apos;s training an identity.</p>
          </div>
          
          <div className="space-y-6">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Morning Shred"
              className="h-16 rounded-2xl px-6 text-center text-2xl font-bold flow-surface flow-outline flow-text focus-visible:ring-[var(--flow-progress)]/20"
              autoFocus
            />
            
            <div className="flex flex-wrap justify-center gap-2">
              {presets.map((p) => (
                <button
                  key={p}
                  onClick={() => setName(p)}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-bold transition-all border",
                    name === p
                      ? "flow-cta text-white border-transparent"
                      : "flow-surface flow-outline flow-text hover:opacity-90"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    }
  ];

  // Handle skip - close wizard immediately
  const handleSkip = () => {
    onOpenChange(false);
  };

  return (
    <FlowWizard
      open={open}
      onOpenChange={onOpenChange}
      steps={steps}
      className="w-screen h-[100dvh] max-w-lg mx-auto rounded-none"
      showCloseButton={true}
      closeOnOverlayClick={false}
      closeOnEscape={false}
      onSkip={handleSkip}
      skipLabel="Cancel"
      onComplete={async () => {
        await onComplete(name);
      }}
      completeLabel="Start Training"
    />
  );
}
