"use client";

import { useState } from "react";
import { FlowWizard, Step } from "@/components/ui/FlowWizard";
import { formatDuration } from "@/types/workout";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface WorkoutFinishFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => Promise<void>;
  onSaveAsTemplate?: () => void;
  stats: {
    duration: number;
    sets: number;
    volume: number;
    prs: number;
  };
}

export function WorkoutFinishFlow({ open, onOpenChange, onComplete, onSaveAsTemplate, stats }: WorkoutFinishFlowProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setShowCelebration(false);
    }
    onOpenChange(nextOpen);
  };

  const steps: Step[] = [
    {
      id: "summary",
      title: "Workout Complete",
      content: (
        <div className="space-y-8 py-4">
          <div className="flex flex-col items-center gap-4">
            <div className="flow-prompt-card space-y-1 text-center">
              <h2 className="text-3xl font-display font-black tracking-tight flow-text">Session Ended!</h2>
              <p className="flow-muted font-medium italic">You crushed it today.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-[2rem] flow-surface border flow-outline text-center space-y-1">
              <p className="text-2xl font-display font-black flow-text">{formatDuration(stats.duration)}</p>
              <p className="text-[10px] font-black uppercase tracking-widest flow-muted">Duration</p>
            </div>
            <div className="p-6 rounded-[2rem] flow-surface border flow-outline text-center space-y-1">
              <p className="text-2xl font-display font-black flow-text">{stats.sets}</p>
              <p className="text-[10px] font-black uppercase tracking-widest flow-muted">Sets Done</p>
            </div>
            <div className="p-6 rounded-[2rem] flow-surface border flow-outline text-center space-y-1">
              <p className="text-2xl font-display font-black flow-text">{stats.volume.toLocaleString()}</p>
              <p className="text-[10px] font-black uppercase tracking-widest flow-muted">Lbs Lifted</p>
            </div>
            <div className="p-6 rounded-[2rem] flow-surface border flow-outline text-center space-y-1">
              <p className="text-2xl font-display font-black flow-text">{stats.prs}</p>
              <p className="text-[10px] font-black uppercase tracking-widest flow-muted">New PRs</p>
            </div>
          </div>

          {onSaveAsTemplate && (
            <Button
              onClick={onSaveAsTemplate}
              variant="pillSecondary"
              className="w-full text-xs font-bold uppercase tracking-widest"
            >
              Save as Template
            </Button>
          )}
        </div>
      ),
      nextLabel: "Finish Workout"
    }
  ];

  if (showCelebration) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="flow-theme flow-bg max-w-2xl h-[90vh] flex flex-col gap-0 p-0 overflow-hidden bg-background sm:rounded-[2.5rem]">
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
            <div className="relative">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12 }}
              className="w-32 h-32 flow-cta rounded-full flex items-center justify-center border border-border"
            >
              <Check className="w-16 h-16 text-white stroke-[4]" />
            </motion.div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 -m-4 border-2 border-dashed border-[rgba(31,29,40,0.14)] rounded-full"
              />
            </div>
            <div className="flow-prompt-card space-y-4">
              <h1 className="text-4xl font-display font-black tracking-tight leading-tight flow-text">
                Workout Saved! 🏆
              </h1>
              <p className="flow-muted text-lg font-medium max-w-xs mx-auto leading-relaxed">
                Consistency is key. See you at the next session!
              </p>
            </div>
            <div className="flex flex-col w-full gap-3">
              <Button
                onClick={() => handleOpenChange(false)}
                variant="pillPrimary"
                size="pill"
                className="font-display w-full max-w-[20rem]"
              >
                Great
              </Button>
            </div>
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
      showProgress={false}
      onComplete={async () => {
        await onComplete();
        setShowCelebration(true);
      }}
      completeLabel="Complete Session"
    />
  );
}
