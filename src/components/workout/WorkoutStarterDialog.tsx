"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Dumbbell, Plus, X } from "lucide-react";
import { useWizard } from "@/context/WizardContext";

interface Template {
  _id: string;
  name: string;
  exercises: unknown[];
}

interface WorkoutStarterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: Template[];
  onSelectTemplate: (templateId: string) => void;
  onStartFromScratch: () => void;
}

export function WorkoutStarterDialog({
  open,
  onOpenChange,
  templates,
  onSelectTemplate,
  onStartFromScratch,
}: WorkoutStarterDialogProps) {
  const { setWizardOpen } = useWizard();

  // Track wizard open state for dock visibility
  useEffect(() => {
    setWizardOpen(open);
  }, [open, setWizardOpen]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flow-theme flow-bg w-screen h-[100dvh] max-w-lg mx-auto rounded-none bg-background flex flex-col gap-0 p-0 overflow-hidden">
        {/* Exit Button */}
        <div className="absolute top-4 right-4 z-50">
          <Button
            type="button"
            variant="iconCircle"
            size="icon"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex flex-col h-full p-6 pt-16">
          <div className="flow-prompt-card mb-8 space-y-2 text-center">
            <h2 className="text-3xl font-display font-black tracking-tight flow-text">
              Start a Workout
            </h2>
            <p className="flow-muted font-medium">
              Choose a template or start fresh
            </p>
          </div>

          <div className="mb-6 flex justify-center">
            <Button
              type="button"
              variant="pillPrimary"
              size="pill"
              onClick={() => {
                onOpenChange(false);
                onStartFromScratch();
              }}
              className="font-display w-full max-w-[20rem] gap-2.5"
            >
              Start from Scratch
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4">
            {templates.length > 0 && (
              <div className="flex items-center gap-4 py-2">
                <div className="flex-1 h-px bg-[rgba(31,29,40,0.12)]" />
                <span className="text-xs font-bold flow-muted uppercase tracking-widest">
                  Your Templates
                </span>
                <div className="flex-1 h-px bg-[rgba(31,29,40,0.12)]" />
              </div>
            )}

            <div className="space-y-3">
              {templates.map((template) => (
                <button
                  key={template._id}
                  type="button"
                  className="w-full rounded-2xl flow-surface px-4 py-4 text-left transition-all hover:opacity-95"
                  onClick={() => {
                    onOpenChange(false);
                    onSelectTemplate(template._id);
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[rgba(31,29,40,0.04)] flex items-center justify-center">
                      <Dumbbell className="w-6 h-6 flow-muted" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold flow-text">
                        {template.name}
                      </h3>
                      <p className="mt-0.5 text-xs flow-muted">
                        {template.exercises.length} exercises
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
