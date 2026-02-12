"use client";

import { useState } from "react";
import { FlowWizard, Step } from "@/components/ui/FlowWizard";
import { cn } from "@/lib/utils";
import { Droplets, Coffee, Coffee as Tea, Beer, Plus, Sparkles, Check } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

type BeverageType = "water" | "coffee" | "tea" | "juice" | "other";

interface HydrationFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (data: { type: BeverageType; amount: number; notes?: string }) => Promise<void>;
}

export function HydrationFlow({ open, onOpenChange, onComplete }: HydrationFlowProps) {
  const [type, setType] = useState<BeverageType>("water");
  const [amount, setAmount] = useState(250);
  const [notes, setNotes] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);

  const types: { id: BeverageType; label: string; icon: any }[] = [
    { id: "water", label: "Water", icon: Droplets },
    { id: "coffee", label: "Coffee", icon: Coffee },
    { id: "tea", label: "Tea", icon: Tea },
    { id: "juice", label: "Juice", icon: Beer },
    { id: "other", label: "Other", icon: Plus },
  ];

  const presets = [100, 250, 330, 500, 750, 1000];

  const steps: Step[] = [
    {
      id: "type",
      title: "What are we drinking?",
      content: (
        <div className="space-y-10 py-4">
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-white text-center">What's the drink?</h2>
            <p className="text-zinc-500 font-medium text-center italic">Choose your beverage type.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {types.map((t) => (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className={cn(
                  "h-32 rounded-3xl border transition-all active:scale-95 flex flex-col items-center justify-center gap-3",
                  type === t.id
                    ? "bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                    : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700"
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
      id: "amount",
      title: "How much?",
      content: (
        <div className="space-y-10 py-4">
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-white text-center">How much?</h2>
            <p className="text-zinc-500 font-medium text-center italic">Adjust the volume to match your drink.</p>
          </div>
          
          <div className="space-y-8">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setAmount(Math.max(0, amount - 50))}
                  className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl font-bold hover:bg-zinc-800 active:scale-90"
                >
                  &minus;
                </button>
                <div className="text-center">
                  <span className="text-6xl font-black tracking-tighter text-white">{amount}</span>
                  <span className="text-xl font-bold text-zinc-600 ml-2">ml</span>
                </div>
                <button
                  onClick={() => setAmount(amount + 50)}
                  className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl font-bold hover:bg-zinc-800 active:scale-90"
                >
                  +
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {presets.map((p) => (
                <button
                  key={p}
                  onClick={() => setAmount(p)}
                  className={cn(
                    "h-12 rounded-2xl border text-xs font-bold transition-all",
                    amount === p
                      ? "bg-white text-black border-white"
                      : "bg-zinc-900/50 border-zinc-800 text-zinc-500"
                  )}
                >
                  {p}ml
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      id: "notes",
      title: "Any notes?",
      content: (
        <div className="space-y-10 py-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-white">Any notes?</h2>
            <p className="text-zinc-500 font-medium italic">Optional: Add details like "with lemon" or "iced".</p>
          </div>
          
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a note..."
            className="h-16 text-xl font-bold bg-zinc-900/50 border-zinc-800 rounded-2xl px-6 focus-visible:ring-white/20 text-center"
            autoFocus
          />
        </div>
      )
    }
  ];

  if (showCelebration) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl h-[90vh] flex flex-col gap-0 p-0 overflow-hidden border-zinc-900 bg-black sm:rounded-[2.5rem]">
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12 }}
              className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.3)]"
            >
              <Check className="w-16 h-16 text-white stroke-[4]" />
            </motion.div>
            <div className="space-y-4">
              <h1 className="text-4xl font-black tracking-tight leading-tight">
                Hydrated! 💧
              </h1>
              <p className="text-zinc-500 text-lg font-medium max-w-xs mx-auto leading-relaxed">
                Logged {amount}ml of {type}. Keep it up!
              </p>
            </div>
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full h-16 rounded-[2rem] bg-white text-black hover:bg-zinc-200 text-lg font-bold"
            >
              Close
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
      onComplete={async () => {
        await onComplete({ type, amount, notes: notes || undefined });
        setShowCelebration(true);
      }}
      completeLabel="Save Intake"
    />
  );
}
