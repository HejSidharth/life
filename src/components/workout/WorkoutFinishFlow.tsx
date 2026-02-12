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

  const steps: Step[] = [
    {
      id: "summary",
      title: "Workout Complete",
      content: (
        <div className="space-y-8 py-4">
          <div className="flex flex-col items-center gap-4">
            <div className="space-y-1 text-center">
              <h2 className="text-3xl font-black tracking-tight text-white">Session Ended!</h2>
              <p className="text-zinc-500 font-medium italic">You crushed it today.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-[2rem] bg-zinc-900/50 border border-zinc-800 text-center space-y-1">
              <p className="text-2xl font-black text-white">{formatDuration(stats.duration)}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Duration</p>
            </div>
            <div className="p-6 rounded-[2rem] bg-zinc-900/50 border border-zinc-800 text-center space-y-1">
              <p className="text-2xl font-black text-white">{stats.sets}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Sets Done</p>
            </div>
            <div className="p-6 rounded-[2rem] bg-zinc-900/50 border border-zinc-800 text-center space-y-1">
              <p className="text-2xl font-black text-white">{stats.volume.toLocaleString()}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Lbs Lifted</p>
            </div>
            <div className="p-6 rounded-[2rem] bg-zinc-900/50 border border-zinc-800 text-center space-y-1">
              <p className="text-2xl font-black text-white">{stats.prs}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">New PRs</p>
            </div>
          </div>

          {onSaveAsTemplate && (
            <button
              onClick={onSaveAsTemplate}
              className="w-full py-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              Save as Template
            </button>
          )}
        </div>
      ),
      nextLabel: "Finish Workout"
    }
  ];

  if (showCelebration) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl h-[90vh] flex flex-col gap-0 p-0 overflow-hidden border-zinc-900 bg-black sm:rounded-[2.5rem]">
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
            <div className="relative">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
                className="w-32 h-32 bg-yellow-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.3)]"
              >
                <Check className="w-16 h-16 text-black stroke-[4]" />
              </motion.div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 -m-4 border-2 border-dashed border-yellow-500/20 rounded-full"
              />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-black tracking-tight leading-tight">
                Workout Saved! 🏆
              </h1>
              <p className="text-zinc-500 text-lg font-medium max-w-xs mx-auto leading-relaxed">
                Consistency is key. See you at the next session!
              </p>
            </div>
            <div className="flex flex-col w-full gap-3">
              <Button
                onClick={() => onOpenChange(false)}
                className="w-full h-16 rounded-[2rem] bg-white text-black hover:bg-zinc-200 text-lg font-bold"
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
      onOpenChange={onOpenChange}
      steps={steps}
      onComplete={async () => {
        await onComplete();
        setShowCelebration(true);
      }}
      completeLabel="Complete Session"
    />
  );
}
