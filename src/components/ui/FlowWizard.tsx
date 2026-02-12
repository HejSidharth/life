"use client";

import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ArrowRight, ArrowLeft, X } from "lucide-react";

export interface Step {
  id: string;
  title: string;
  description?: string;
  content: ReactNode;
  isNextDisabled?: boolean;
  nextLabel?: string;
  hideFooter?: boolean;
  onEnter?: () => void;
}

interface FlowWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  steps: Step[];
  onComplete: () => Promise<void>;
  completeLabel?: string;
  showProgress?: boolean;
  className?: string;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  onSkip?: () => void;
  skipLabel?: string;
}

export function FlowWizard({
  open,
  onOpenChange,
  steps,
  onComplete,
  completeLabel = "Finish",
  showProgress = true,
  className,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  onSkip,
  skipLabel = "Skip",
}: FlowWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setCurrentStepIndex(0);
      setDirection(1);
    }
  }, [open]);

  useEffect(() => {
    if (open && steps[currentStepIndex]?.onEnter) {
      steps[currentStepIndex].onEnter?.();
    }
  }, [currentStepIndex, open, steps]);

  const nextStep = async () => {
    if (currentStepIndex < steps.length - 1) {
      setDirection(1);
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      setIsSubmitting(true);
      try {
        await onComplete();
      } catch (error) {
        console.error(error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setDirection(-1);
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const currentStep = steps[currentStepIndex];

  const stepVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 500 : -500,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 500 : -500,
      opacity: 0,
    }),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("max-w-2xl h-[90vh] flex flex-col gap-0 p-0 overflow-hidden border-zinc-900 bg-black sm:rounded-[2.5rem]", className)}
        showCloseButton={false}
        closeOnOverlayClick={closeOnOverlayClick}
        closeOnEscape={closeOnEscape}
      >
        {/* Exit Button */}
        {showCloseButton && (
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-zinc-900/80 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <div className="flex-1 relative overflow-hidden flex flex-col">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentStep.id}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="absolute inset-0 flex flex-col p-8 pt-12"
            >
              {currentStep.content}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        {!currentStep.hideFooter && (
          <div className="p-8 pt-4 bg-black border-t border-zinc-900 flex flex-col gap-6">
            {/* Dots */}
            {showProgress && (
              <div className="flex justify-center gap-1.5">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      currentStepIndex >= i ? "bg-white w-6" : "bg-zinc-800 w-1.5"
                    )}
                  />
                ))}
              </div>
            )}

            <div className="flex gap-4">
              {currentStepIndex > 0 && (
                <button
                  onClick={prevStep}
                  className="w-16 h-16 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-700 transition-all active:scale-95"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
              )}
              
              {/* Skip Button */}
              {onSkip && currentStepIndex < steps.length - 1 && (
                <button
                  onClick={onSkip}
                  className="h-16 px-6 rounded-[2rem] border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700 transition-all active:scale-95 font-medium"
                >
                  {skipLabel}
                </button>
              )}
              
              <Button
                onClick={nextStep}
                disabled={currentStep.isNextDisabled || isSubmitting}
                className="flex-1 h-16 rounded-[2rem] text-lg font-bold transition-all active:scale-95 flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200"
              >
                {currentStepIndex === steps.length - 1
                  ? isSubmitting
                    ? "Processing..."
                    : completeLabel
                  : currentStep.nextLabel || "Next"}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
