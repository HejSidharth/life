"use client";

import { useEffect, useState } from "react";
import { FlowWizard, Step } from "@/components/ui/FlowWizard";
import { cn } from "@/lib/utils";
import { Droplets, Coffee, Coffee as Tea, Beer, Plus, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useWizard } from "@/context/WizardContext";

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
  const { setWizardOpen } = useWizard();

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) {
      setType("water");
      setAmount(250);
      setNotes("");
      setShowCelebration(false);
    }
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!open) return;
    setWizardOpen(true);
    return () => setWizardOpen(false);
  }, [open, setWizardOpen]);

  const types: { id: BeverageType; label: string; icon: LucideIcon }[] = [
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
          <div className="flow-prompt-card space-y-2 text-center">
            <h2 className="text-3xl font-display font-black tracking-tight flow-text">What&apos;s the drink?</h2>
            <p className="flow-muted font-medium italic">Choose your beverage type.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {types.map((t) => (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className={cn(
                  "h-32 rounded-3xl border transition-all active:scale-95 flex flex-col items-center justify-center gap-3",
                  type === t.id
                    ? "flow-cta text-white border-transparent"
                    : "flow-surface flow-outline flow-text hover:opacity-95"
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
          <div className="flow-prompt-card space-y-2 text-center">
            <h2 className="text-3xl font-display font-black tracking-tight flow-text">How much?</h2>
            <p className="flow-muted font-medium italic">Adjust the volume to match your drink.</p>
          </div>
          
          <div className="space-y-8">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setAmount(Math.max(0, amount - 50))}
                  className="w-14 h-14 rounded-full flow-surface border flow-outline flex items-center justify-center text-2xl font-bold flow-text hover:opacity-90 active:scale-90"
                >
                  &minus;
                </button>
                <div className="text-center">
                  <span className="text-6xl font-display font-black tracking-tighter flow-text">{amount}</span>
                  <span className="text-xl font-bold flow-muted ml-2">ml</span>
                </div>
                <button
                  onClick={() => setAmount(amount + 50)}
                  className="w-14 h-14 rounded-full flow-surface border flow-outline flex items-center justify-center text-2xl font-bold flow-text hover:opacity-90 active:scale-90"
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
                      ? "flow-cta text-white border-transparent"
                      : "flow-surface flow-outline flow-text"
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
          <div className="flow-prompt-card space-y-2 text-center">
            <h2 className="text-3xl font-display font-black tracking-tight flow-text">Any notes?</h2>
            <p className="flow-muted font-medium italic">Optional: Add details like &quot;with lemon&quot; or &quot;iced&quot;.</p>
          </div>
          
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a note..."
            className="h-16 rounded-2xl px-6 text-center text-xl font-bold flow-surface flow-outline flow-text focus-visible:ring-[var(--flow-progress)]/20"
            autoFocus
          />
        </div>
      )
    }
  ];

  if (showCelebration) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flow-theme flow-bg max-w-2xl h-[90vh] flex flex-col gap-0 p-0 overflow-hidden bg-background sm:rounded-[2.5rem]">
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12 }}
              className="w-32 h-32 flow-cta rounded-full flex items-center justify-center border border-border"
            >
              <Check className="w-16 h-16 text-white stroke-[4]" />
            </motion.div>
            <div className="flow-prompt-card space-y-4">
              <h1 className="text-4xl font-display font-black tracking-tight leading-tight flow-text">
                Hydrated! 💧
              </h1>
              <p className="flow-muted text-lg font-medium max-w-xs mx-auto leading-relaxed">
                Logged {amount}ml of {type}. Keep it up!
              </p>
            </div>
            <Button
              onClick={() => onOpenChange(false)}
              variant="pillPrimary"
              size="pill"
              className="font-display w-full max-w-[20rem]"
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
      className="w-screen h-[100dvh] max-w-lg mx-auto rounded-none"
      showCloseButton={true}
      closeOnOverlayClick={false}
      closeOnEscape={false}
      onSkip={() => onOpenChange(false)}
      skipLabel="Cancel"
      onComplete={async () => {
        await onComplete({ type, amount, notes: notes || undefined });
        setShowCelebration(true);
      }}
      completeLabel="Save Intake"
    />
  );
}
