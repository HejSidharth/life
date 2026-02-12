"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, Plus } from "lucide-react";
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
      <DialogContent className="w-screen h-[100dvh] max-w-none rounded-none border-0 flex flex-col gap-0 p-0 overflow-hidden bg-black">
        {/* Exit Button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-zinc-900/80 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all active:scale-95"
          aria-label="Close"
        >
          <Plus className="w-5 h-5 rotate-45" />
        </button>

        <div className="flex flex-col h-full p-6 pt-16">
          <DialogHeader className="space-y-2 mb-8">
            <DialogTitle className="text-3xl font-black tracking-tight text-white text-center">
              Start a Workout
            </DialogTitle>
            <p className="text-zinc-500 font-medium text-center">
              Choose a template or start fresh
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Start from Scratch Option */}
            <Card
              className="cursor-pointer overflow-hidden bg-zinc-900/50 border-zinc-800 hover:border-white/20 hover:bg-zinc-900 transition-all"
              onClick={() => {
                onOpenChange(false);
                onStartFromScratch();
              }}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white">Start from Scratch</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Create a new custom workout
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Divider */}
            {templates.length > 0 && (
              <div className="flex items-center gap-4 py-2">
                <div className="flex-1 h-px bg-zinc-800" />
                <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest">
                  Your Templates
                </span>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>
            )}

            {/* Template List */}
            <div className="space-y-3">
              {templates.map((template) => (
                <Card
                  key={template._id}
                  className="cursor-pointer overflow-hidden bg-card border-zinc-800 hover:border-white/20 transition-all"
                  onClick={() => {
                    onOpenChange(false);
                    onSelectTemplate(template._id);
                  }}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center">
                      <Dumbbell className="w-6 h-6 text-zinc-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">
                        {template.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {template.exercises.length} exercises
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
