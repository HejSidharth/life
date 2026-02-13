"use client";

import { ReactNode, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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
      setCurrentStepIndex((prevIndex) => prevIndex + 1);
      return;
    }

    setIsSubmitting(true);
    try {
      await onComplete();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setDirection(-1);
      setCurrentStepIndex((prevIndex) => prevIndex - 1);
    }
  };

  const currentStep = steps[currentStepIndex];
  const showSkipAction = Boolean(onSkip && currentStepIndex < steps.length - 1);
  const progressPct = steps.length > 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0;

  const stepVariants = {
    enter: (stepDirection: number) => ({
      x: stepDirection > 0 ? 120 : -120,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (stepDirection: number) => ({
      x: stepDirection < 0 ? 120 : -120,
      opacity: 0,
    }),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flow-theme max-w-lg mx-auto h-[90vh] flex flex-col gap-0 p-0 overflow-hidden bg-background sm:rounded-[2.5rem]",
          className
        )}
        showCloseButton={false}
        closeOnOverlayClick={closeOnOverlayClick}
        closeOnEscape={closeOnEscape}
      >
        <div className="flex h-full flex-col flow-bg">
          <div className="shrink-0 px-5 pt-5 pb-3">
            <div className="mb-3 flex items-center justify-between">
              {currentStepIndex > 0 ? (
                <Button
                  type="button"
                  variant="iconCircle"
                  size="icon"
                  onClick={prevStep}
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              ) : showCloseButton ? (
                <Button
                  type="button"
                  variant="iconCircle"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </Button>
              ) : (
                <div className="h-11 w-11" />
              )}

              {showSkipAction ? (
                <button
                  type="button"
                  onClick={onSkip}
                  className="px-1 text-xs font-semibold tracking-wide flow-muted transition-opacity hover:opacity-80"
                >
                  {skipLabel}
                </button>
              ) : (
                <div className="h-5 w-10" />
              )}
            </div>

            {showProgress && (
              <div className="flow-progress-track h-2.5 w-full overflow-hidden rounded-full">
                <div
                  className="flow-progress h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            )}
          </div>

          <div className="relative flex-1 overflow-hidden">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentStep.id}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 280, damping: 34 },
                  opacity: { duration: 0.18 },
                }}
                className="absolute inset-0 overflow-y-auto px-5 pt-2 pb-4"
              >
                {currentStep.content}
              </motion.div>
            </AnimatePresence>
          </div>

          {!currentStep.hideFooter && (
            <div className="shrink-0 px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="pillPrimary"
                  size="pill"
                  onClick={nextStep}
                  disabled={currentStep.isNextDisabled || isSubmitting}
                  className="font-display w-full max-w-[20rem] gap-2.5 border border-border bg-foreground text-background tracking-tight"
                >
                  {currentStepIndex === steps.length - 1
                    ? isSubmitting
                      ? "Processing..."
                      : completeLabel
                    : currentStep.nextLabel || "Next"}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
