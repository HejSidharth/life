"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { 
  ChevronRight
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useActiveDate } from "@/hooks/use-active-date";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Suspense } from "react";
import { HydrationFlow } from "@/components/hydration/HydrationFlow";
import type { Id } from "convex/_generated/dataModel";

type BeverageType = "water" | "coffee" | "tea" | "juice" | "other";

const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

const quickAddOptions = [
  { label: "Glass", type: "water" as BeverageType, amount: 250 },
  { label: "Bottle", type: "water" as BeverageType, amount: 500 },
  { label: "Coffee", type: "coffee" as BeverageType, amount: 240 },
  { label: "Other", type: "other" as BeverageType, amount: 300 },
];

function HydrationContent() {
  const { user } = useUser();
  const userId = user?.id;

  const { selectedDate, isToday, getLogTimestamp } = useActiveDate();

  // Convex Queries
  const hydrationEntries = useQuery(
    api.hydration.getByDateRange,
    userId ? { 
      userId, 
      startDate: new Date(selectedDate).setHours(0,0,0,0),
      endDate: new Date(selectedDate).setHours(23,59,59,999)
    } : "skip"
  ) || [];
  
  const dailyGoalQuery = useQuery(
    api.stats.getTodayStats,
    userId ? { userId, date: selectedDate.getTime() } : "skip"
  ) as any;

  const dailyGoal = dailyGoalQuery?.goals?.water || 2500;

  // Convex Mutations
  const addHydration = useMutation(api.hydration.add);
  const removeHydration = useMutation(api.hydration.remove);

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const totalIntake = hydrationEntries.reduce((acc: number, h: { amount: number }) => acc + h.amount, 0);
  const progress = Math.min(100, (totalIntake / dailyGoal) * 100);

  const handleQuickAdd = async (type: BeverageType, amount: number) => {
    if (!userId) return;
    await addHydration({
      userId,
      beverageType: type,
      amount,
      consumedAt: getLogTimestamp(),
    });
  };

  const handleCustomAdd = async (data: { type: BeverageType; amount: number; notes?: string }) => {
    if (!userId) return;
    await addHydration({
      userId,
      beverageType: data.type,
      amount: data.amount,
      notes: data.notes,
      consumedAt: getLogTimestamp(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
      >
        <h1 className="text-3xl font-bold tracking-tight">
          {isToday ? "Hydration" : format(selectedDate, "EEEE")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isToday ? "Stay hydrated, feel better." : format(selectedDate, "MMMM do, yyyy")}
        </p>
      </motion.div>

      {/* Progress Widget */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, ...springTransition }}
      >
        <Card className="border-0 bg-zinc-900/50 overflow-hidden relative">
          <div 
            className="absolute inset-y-0 left-0 bg-primary/5 transition-all duration-1000 ease-out" 
            style={{ width: `${progress}%` }}
          />
          <CardContent className="p-6 relative">
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-zinc-500 uppercase tracking-widest">Today</p>
                <h2 className="text-4xl font-black mt-1">
                  {(totalIntake / 1000).toFixed(1)}
                  <span className="text-lg font-bold text-zinc-500 ml-1">L</span>
                </h2>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Goal</p>
                <p className="text-lg font-bold">{(dailyGoal / 1000).toFixed(1)}L</p>
              </div>
            </div>
            
            <div className="relative h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <motion.div 
                className="absolute inset-y-0 left-0 bg-white"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Add Grid */}
      <div className="grid grid-cols-2 gap-3">
        {quickAddOptions.map((option, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            transition={springTransition}
          >
            <Button
              variant="secondary"
              onClick={() => handleQuickAdd(option.type, option.amount)}
              className="w-full h-20 rounded-3xl bg-zinc-900 border-border/50 flex flex-col justify-center hover:bg-zinc-800 transition-all shadow-sm"
            >
              <div className="text-center">
                <p className="text-sm font-bold text-zinc-200">{option.label}</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{option.amount}ml</p>
              </div>
            </Button>
          </motion.div>
        ))}
      </div>

      {/* Custom Add */}
      <Button 
        variant="outline" 
        className="w-full h-14 rounded-2xl border-dashed border-zinc-800 hover:bg-zinc-900 text-zinc-400 font-semibold"
        onClick={() => setIsDialogOpen(true)}
      >
        Log Custom Amount
      </Button>

      {/* Log History */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold px-1">Today&apos;s Log</h3>
        <div className="space-y-2">
          {hydrationEntries.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-8 bg-zinc-950/50 rounded-3xl border border-zinc-900">
              No entries logged for today yet.
            </p>
          ) : (
            <AnimatePresence initial={false}>
              {hydrationEntries.map((h: { _id: string; beverageType: BeverageType; amount: number; consumedAt: number; notes?: string }) => (
                <motion.div
                  key={h._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="group relative flex items-center justify-between p-4 bg-zinc-950/50 rounded-2xl border border-zinc-900 transition-all hover:border-zinc-800 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-bold text-zinc-200 capitalize">{h.beverageType}</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">
                        {new Date(h.consumedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {h.notes && ` · ${h.notes}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-zinc-300">{h.amount}<span className="text-[10px] ml-0.5 text-zinc-500">ml</span></span>
                    <button 
                      onClick={() => removeHydration({ id: h._id as Id<"hydration"> })}
                      className="h-8 px-2 rounded-lg flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      <HydrationFlow
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onComplete={handleCustomAdd}
      />
    </div>
  );
}

export default function HydrationPage() {
  return (
    <Suspense fallback={<div className="w-full h-32 animate-pulse bg-zinc-900 rounded-3xl" />}>
      <HydrationContent />
    </Suspense>
  );
}

