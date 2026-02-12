"use client";

import { useState, useEffect } from "react";
import { FlowWizard, Step } from "@/components/ui/FlowWizard";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExerciseLibraryItem } from "@/types/workout";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, Plus, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { useWizard } from "@/context/WizardContext";

interface RoutineWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercises: ExerciseLibraryItem[];
  onCreate: (data: RoutineData) => Promise<void>;
}

export interface RoutineData {
  name: string;
  days: {
    name: string;
    exercises: {
      exerciseLibraryId: string;
      exerciseName: string;
      targetSets: number;
      targetReps: string;
    }[];
  }[];
}

export function RoutineWizard({ open, onOpenChange, exercises, onCreate }: RoutineWizardProps) {
  const [routineName, setRoutineName] = useState("");
  const [frequency, setFrequency] = useState(3);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [days, setDays] = useState<{ name: string; exercises: ExerciseLibraryItem[] }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);
  const { setWizardOpen } = useWizard();

  // Track wizard open state for dock visibility
  useEffect(() => {
    setWizardOpen(open);
  }, [open, setWizardOpen]);

  useEffect(() => {
    if (open) {
      setRoutineName("");
      setFrequency(3);
      setCurrentDayIndex(0);
      setShowCelebration(false);
    }
  }, [open]);

  useEffect(() => {
    setDays(
      Array.from({ length: frequency }, (_, i) => ({
        name: `Workout ${i + 1}`,
        exercises: [],
      }))
    );
  }, [frequency]);

  const toggleExercise = (exercise: ExerciseLibraryItem) => {
    setDays(prev => {
      const newDays = [...prev];
      const currentDay = { ...newDays[currentDayIndex] };
      const exists = currentDay.exercises.find(ex => ex._id === exercise._id);
      
      if (exists) {
        currentDay.exercises = currentDay.exercises.filter(ex => ex._id !== exercise._id);
      } else {
        currentDay.exercises = [...currentDay.exercises, exercise];
      }
      
      newDays[currentDayIndex] = currentDay;
      return newDays;
    });
  };

  const filteredExercises = exercises.filter(ex => 
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const steps: Step[] = [
    {
      id: "welcome",
      title: "Welcome",
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-black tracking-tight leading-tight">
              Build your perfect <br />
              <span className="text-zinc-500">training routine</span>
            </h1>
            <p className="text-zinc-500 text-lg font-medium max-w-xs mx-auto leading-relaxed">
              Customized workouts that match your goals and schedule.
            </p>
          </div>
        </div>
      ),
      nextLabel: "Let's Go"
    },
    {
      id: "name",
      title: "Routine Name",
      isNextDisabled: !routineName,
      content: (
        <div className="space-y-8 py-10">
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight">Name your routine</h2>
            <p className="text-zinc-500 font-medium italic">What should we call this program?</p>
          </div>
          <Input
            value={routineName}
            onChange={(e) => setRoutineName(e.target.value)}
            placeholder="e.g. Hypertrophy Split"
            className="h-16 text-2xl font-bold bg-zinc-900/50 border-zinc-800 rounded-2xl px-6 focus-visible:ring-white/20"
            autoFocus
          />
        </div>
      )
    },
    {
      id: "frequency",
      title: "Frequency",
      content: (
        <div className="space-y-8 py-10">
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight">Weekly Frequency</h2>
            <p className="text-zinc-500 font-medium">How many unique workouts per routine?</p>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
              <button
                key={num}
                onClick={() => setFrequency(num)}
                className={cn(
                  "h-16 rounded-2xl border text-xl font-bold transition-all active:scale-95",
                  frequency === num
                    ? "bg-white text-black border-white"
                    : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                )}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      )
    },
    // Dynamic steps for workouts
    ...days.map((day, index) => ({
      id: `workout-${index}`,
      title: `Workout ${index + 1}`,
      onEnter: () => setCurrentDayIndex(index),
      isNextDisabled: days[index]?.exercises.length === 0,
      content: (
        <div className="flex-1 flex flex-col gap-6 min-h-0">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                Workout {index + 1} of {frequency}
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300 bg-zinc-900 px-2 py-1 rounded-md">
                {day.exercises.length} Selected
              </span>
            </div>
            <Input
              value={day.name}
              onChange={(e) => {
                const newDays = [...days];
                newDays[index].name = e.target.value;
                setDays(newDays);
              }}
              className="h-12 text-xl font-bold bg-transparent border-0 border-b border-zinc-800 rounded-none px-0 focus-visible:ring-0 focus-visible:border-white/50"
              placeholder="Name this workout (e.g. Push Day)"
            />
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exercises..."
              className="h-12 pl-11 rounded-2xl bg-zinc-900/50 border-zinc-800/50 focus-visible:ring-1 focus-visible:ring-white/20"
            />
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 -mx-4 px-4 space-y-1">
            {filteredExercises.slice(0, 50).map((ex) => {
              const isSelected = day.exercises.some(e => e._id === ex._id);
              return (
                <button
                  key={ex._id}
                  onClick={() => toggleExercise(ex)}
                  className={cn(
                    "w-full text-left px-4 py-4 rounded-2xl transition-all flex items-center justify-between group",
                    isSelected ? "bg-white/[0.05] border-white/10" : "hover:bg-zinc-900/50"
                  )}
                >
                  <div className="min-w-0">
                    <div className={cn("font-bold text-base transition-colors", isSelected ? "text-white" : "text-zinc-400 group-hover:text-zinc-200")}>
                      {ex.name}
                    </div>
                    <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">
                      {ex.muscleGroups[0]}
                    </div>
                  </div>
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                    isSelected ? "bg-white text-black scale-110" : "border border-zinc-800 text-zinc-800"
                  )}>
                    {isSelected ? <Check className="w-3 h-3 stroke-[4]" /> : <Plus className="w-3 h-3" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )
    }))
  ];

  // Handle skip - close wizard immediately
  const handleSkip = () => {
    onOpenChange(false);
  };

  if (showCelebration) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-screen h-[100dvh] max-w-none rounded-none border-0 flex flex-col gap-0 p-0 overflow-hidden bg-black">
          {/* Exit Button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-zinc-900/80 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          
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
                Ready to roll!
              </h1>
              <p className="text-zinc-500 text-lg font-medium max-w-xs mx-auto leading-relaxed">
                Your routine is saved and ready for your first session.
              </p>
            </div>
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full h-16 rounded-[2rem] bg-white text-black hover:bg-zinc-200 text-lg font-bold"
            >
              Go to Dashboard
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
      skipLabel="Skip"
      onComplete={async () => {
        await onCreate({
          name: routineName,
          days: days.map(day => ({
            name: day.name,
            exercises: day.exercises.map(ex => ({
              exerciseLibraryId: ex._id,
              exerciseName: ex.name,
              targetSets: 3,
              targetReps: "8-12",
            }))
          }))
        });
        setShowCelebration(true);
      }}
      completeLabel="Finish Routine"
    />
  );
}
