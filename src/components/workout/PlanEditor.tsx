"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Dumbbell, 
  Calendar, 
  Target, 
  Clock, 
  ChevronRight, 
  X,
  RotateCcw,
  Settings,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planData: {
    planInstanceId: string;
    planTemplateId: string;
    planName: string;
    goal: string;
    daysPerWeek: number;
    sessionMinutes: number;
    currentWeek: number;
    totalWeeks: number;
    completedDays: number;
    totalDays: number;
    nextWorkoutDay?: string;
    startDate: number;
  } | null;
  onResetPlan: () => void;
  onChangePlan: () => void;
}

const goalLabels: Record<string, string> = {
  strength: "Strength Training",
  hypertrophy: "Muscle Building",
  general_fitness: "General Fitness",
};

export function PlanEditor({
  open,
  onOpenChange,
  planData,
  onResetPlan,
  onChangePlan,
}: PlanEditorProps) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!planData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md rounded-[1.5rem]">
          <div className="py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No active plan found.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const progressPercent = planData.totalDays > 0 
    ? Math.round((planData.completedDays / planData.totalDays) * 100) 
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden rounded-[1.5rem] p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-5 pb-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-black">
                {planData.planName}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {goalLabels[planData.goal] || planData.goal} · {planData.daysPerWeek} days/week
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-8 w-8"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-5 py-2 gap-4">
            <TabsTrigger 
              value="overview" 
              className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="schedule"
              className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Schedule
            </TabsTrigger>
            <TabsTrigger 
              value="settings"
              className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Settings
            </TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[60vh]">
            <AnimatePresence mode="wait">
              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-5 space-y-5"
                >
                  {/* Progress Card */}
                  <div className="rounded-2xl bg-card border border-border p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-sm">Plan Progress</span>
                      <span className="font-black text-primary">{progressPercent}%</span>
                    </div>
                    <Progress value={progressPercent} className="h-2.5 rounded-full mb-3" />
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Week {planData.currentWeek} of {planData.totalWeeks}</span>
                      <span>{planData.completedDays}/{planData.totalDays} days</span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard
                      icon={Target}
                      label="Goal"
                      value={goalLabels[planData.goal] || planData.goal}
                    />
                    <StatCard
                      icon={Clock}
                      label="Session Length"
                      value={`${planData.sessionMinutes} min`}
                    />
                    <StatCard
                      icon={Calendar}
                      label="Days/Week"
                      value={planData.daysPerWeek.toString()}
                    />
                    <StatCard
                      icon={Dumbbell}
                      label="Next Workout"
                      value={planData.nextWorkoutDay || "Completed"}
                    />
                  </div>
                </motion.div>
              </TabsContent>

              {/* Schedule Tab */}
              <TabsContent value="schedule" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-5"
                >
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Schedule editing coming soon.</p>
                    <p className="text-xs mt-1">You&apos;ll be able to swap days and adjust workouts here.</p>
                  </div>
                </motion.div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-5 space-y-3"
                >
                  <button
                    onClick={onResetPlan}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-2xl",
                      "border border-border bg-card",
                      "transition-colors hover:bg-accent",
                      "text-left"
                    )}
                  >
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <RotateCcw className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">Restart Plan</p>
                      <p className="text-xs text-muted-foreground">Reset progress and start from week 1</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>

                  <button
                    onClick={onChangePlan}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-2xl",
                      "border border-border bg-card",
                      "transition-colors hover:bg-accent",
                      "text-left"
                    )}
                  >
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Settings className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">Change Plan</p>
                      <p className="text-xs text-muted-foreground">Switch to a different training program</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

interface StatCardProps {
  icon: typeof Dumbbell;
  label: string;
  value: string;
}

function StatCard({ icon: Icon, label, value }: StatCardProps) {
  return (
    <div className="rounded-xl bg-card border border-border p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="font-semibold text-sm truncate">{value}</p>
    </div>
  );
}
