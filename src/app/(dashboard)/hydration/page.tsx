"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useActiveDate } from "@/hooks/use-active-date";
import { getDayPhase } from "@/lib/dayPhase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Suspense } from "react";
import { HydrationFlow } from "@/components/hydration/HydrationFlow";
import { MascotSceneHero } from "@/components/dashboard/MascotSceneHero";
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
  { label: "Tea", type: "tea" as BeverageType, amount: 300 },
];

interface HydrationEntry {
  _id: string;
  beverageType: BeverageType;
  amount: number;
  consumedAt: number;
  notes?: string;
}

interface DailyGoalQuery {
  goals?: {
    water?: number;
  };
}

function HydrationContent() {
  const { user } = useUser();
  const userId = user?.id;

  const { selectedDate, isToday, getLogTimestamp } = useActiveDate();
  const dayPhase = getDayPhase();

  // Convex Queries
  const hydrationEntries = (useQuery(
    api.hydration.getByDateRange,
    userId ? { 
      userId, 
      startDate: new Date(selectedDate).setHours(0,0,0,0),
      endDate: new Date(selectedDate).setHours(23,59,59,999)
    } : "skip"
  ) || []) as HydrationEntry[];
  
  const dailyGoalQuery = useQuery(
    api.stats.getTodayStats,
    userId ? { userId, date: selectedDate.getTime() } : "skip"
  ) as DailyGoalQuery | undefined;

  const dailyGoal = dailyGoalQuery?.goals?.water || 2500;

  // Convex Mutations
  const addHydration = useMutation(api.hydration.add);
  const removeHydration = useMutation(api.hydration.remove);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [customType, setCustomType] = useState<BeverageType>("water");
  const [customAmount, setCustomAmount] = useState("350");

  const totalIntake = hydrationEntries.reduce((acc: number, h: HydrationEntry) => acc + h.amount, 0);
  const progress = Math.min(100, (totalIntake / dailyGoal) * 100);
  const dropSlots = 5;
  const activeDrops = Math.min(dropSlots, Math.floor((totalIntake / Math.max(dailyGoal, 1)) * dropSlots));
  const parsedCustomAmount = Number(customAmount);
  const isCustomAmountValid = Number.isFinite(parsedCustomAmount) && parsedCustomAmount > 0;

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

  const handleInlineCustomAdd = async () => {
    if (!userId || !isCustomAmountValid) return;
    await handleQuickAdd(customType, parsedCustomAmount);
    setCustomAmount("");
  };

  return (
    <div className="space-y-6 pb-10">
      <MascotSceneHero
        sceneKey="hydration"
        title={isToday ? "Hydration" : format(selectedDate, "EEEE")}
        subtitle={isToday ? `${dayPhase} · Stay hydrated, feel better.` : format(selectedDate, "MMMM do, yyyy")}
        dateLabel={format(selectedDate, "yyyy")}
        showMascot={false}
        sceneMode="sky"
        compact
        skyColor="#2f74d4"
        minHeight="10.375rem"
        className="pt-3"
        footer={(
          <div className="mt-1 flex items-center justify-start gap-1.5">
            {Array.from({ length: dropSlots }).map((_, index) => (
              <span
                key={`drop-${index}`}
                className={`text-lg leading-none ${index < activeDrops ? "opacity-100" : "opacity-35"}`}
                aria-hidden
              >
                💧
              </span>
            ))}
            <span className="ml-1 text-sm font-black text-white">
              {activeDrops}/{dropSlots}
            </span>
          </div>
        )}
      />

      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, ...springTransition }}
        className="rounded-[2rem] border border-border bg-card p-5"
      >
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold tracking-wide text-muted-foreground">Today</p>
            <h2 className="mt-2 text-6xl font-black leading-none text-foreground">
              {(totalIntake / 1000).toFixed(1)}
              <span className="ml-2 text-4xl text-muted-foreground">L</span>
            </h2>
            <p className="mt-2 text-sm font-bold text-muted-foreground">
              Goal {(dailyGoal / 1000).toFixed(1)}L
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-background px-4 py-3 text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Progress</p>
            <p className="mt-1 text-2xl font-black text-foreground">{Math.round(progress)}%</p>
          </div>
        </div>
        <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </motion.section>

      <section className="rounded-[1.75rem] border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-foreground">Quick Add</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tap to log</p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {quickAddOptions.map((option) => (
            <motion.div
              key={`${option.type}-${option.amount}`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              transition={springTransition}
            >
              <button
                type="button"
                onClick={() => handleQuickAdd(option.type, option.amount)}
                className="w-full rounded-2xl border border-border bg-background px-4 py-4 text-left transition-opacity hover:opacity-90"
              >
                <p className="text-base font-black text-foreground">{option.label}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">{option.amount}ml</p>
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-border bg-card p-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-foreground">Custom Size</h3>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {(["water", "coffee", "tea", "juice", "other"] as BeverageType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setCustomType(type)}
              className={`rounded-full border px-2 py-2 text-[10px] font-black uppercase tracking-wider transition-opacity ${
                customType === type
                  ? "border-transparent bg-foreground text-background"
                  : "border-border bg-background text-foreground hover:opacity-90"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Input
            type="number"
            min={1}
            inputMode="numeric"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="Amount in ml"
            className="h-12 rounded-xl border-border bg-background text-base font-bold"
          />
          <Button
            type="button"
            onClick={handleInlineCustomAdd}
            disabled={!isCustomAmountValid}
            variant="pillPrimary"
            className="h-12 min-w-24 rounded-xl bg-foreground px-4 text-sm text-background"
          >
            Add
          </Button>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setIsDialogOpen(true)}
          className="mt-3 w-full rounded-xl border-border bg-background font-bold"
        >
          Open Detailed Logger
        </Button>
      </section>

      {/* Log History */}
      <div className="space-y-3">
        <h3 className="px-1 text-lg font-black text-foreground">Today&apos;s Log</h3>
        <div className="space-y-2">
          {hydrationEntries.length === 0 ? (
            <p className="rounded-3xl border border-border bg-card py-8 text-center text-sm font-semibold text-muted-foreground">
              No entries logged for today yet.
            </p>
          ) : (
            <AnimatePresence initial={false}>
              {hydrationEntries.map((h) => (
                <motion.div
                  key={h._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="group relative flex items-center justify-between rounded-2xl border border-border bg-card p-4"
                >
                  <div>
                    <p className="font-black capitalize text-foreground">{h.beverageType}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      {new Date(h.consumedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {h.notes && ` · ${h.notes}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-foreground">
                      {h.amount}
                      <span className="ml-0.5 text-[10px] font-bold uppercase text-muted-foreground">ml</span>
                    </span>
                    <button 
                      onClick={() => removeHydration({ id: h._id as Id<"hydration"> })}
                      className="rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-all hover:bg-red-500/10 hover:text-red-500"
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
    <Suspense fallback={<div className="w-full h-32 animate-pulse bg-secondary rounded-3xl" />}>
      <HydrationContent />
    </Suspense>
  );
}
