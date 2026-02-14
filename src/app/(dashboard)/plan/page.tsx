"use client";

import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { ArrowRight, ChevronLeft, Check, Plus, Trash2, GripVertical, Zap, X, Search, Loader2 } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Id } from "convex/_generated/dataModel";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Prescription {
  _id: string;
  exerciseName: string;
}

interface PlanDay {
  _id: string | null;
  dayOfWeek: number;
  weekdayName: string;
  name: string;
  focus: string;
  isRest: boolean;
  estimatedMinutes: number;
  status: string;
  prescriptions: Prescription[];
  exists: boolean;
}

interface WeekSchedule {
  planInstanceId: string;
  planTemplateId: string;
  planName: string;
  currentWeek: number;
  totalWeeks: number;
  currentWeekId: string;
  days: PlanDay[];
}

type DayType = "Rest" | "Push" | "Pull" | "Legs" | "Upper" | "Lower" | "Full Body";

const dayTypes: DayType[] = ["Rest", "Push", "Pull", "Legs", "Upper", "Lower", "Full Body"];

// Sortable Exercise Item Component
function SortableExerciseItem({
  prescription,
  onRemove,
  isRemoving,
}: {
  prescription: Prescription;
  onRemove: () => void;
  isRemoving: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: prescription._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl bg-card border border-border",
        isDragging && "shadow-lg ring-2 ring-primary"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex-1 font-medium text-sm truncate">{prescription.exerciseName}</span>
      <button
        onClick={onRemove}
        disabled={isRemoving}
        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
      >
        {isRemoving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

interface ExerciseLibraryItem {
  _id: string;
  name: string;
  category: string;
}

interface DayActionState {
  adding: boolean;
  removingId: string | null;
  quickAdding: boolean;
}

const DEFAULT_DAY_ACTION_STATE: DayActionState = {
  adding: false,
  removingId: null,
  quickAdding: false,
};

// Virtual Exercise Picker Component
interface VirtualExercisePickerProps {
  exercises: ExerciseLibraryItem[];
  onSelect: (exercise: ExerciseLibraryItem) => void;
  isAdding: boolean;
}

function VirtualExercisePicker({ exercises, onSelect, isAdding }: VirtualExercisePickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const parentRef = useRef<HTMLDivElement>(null);

  // Filter exercises based on search
  const filteredExercises = useMemo(() => {
    if (!searchQuery) return exercises;
    const query = searchQuery.toLowerCase();
    return exercises.filter((ex) => ex.name.toLowerCase().includes(query));
  }, [exercises, searchQuery]);

  // Setup virtualizer
  const virtualizer = useVirtualizer({
    count: filteredExercises.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64, // Height of each card
    overscan: 5, // Render 5 items above/below viewport
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div className="border-t border-border p-4 bg-muted/30">
      {/* Search Bar */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search exercises..."
          className="w-full h-10 pl-10 pr-10 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      {/* Results Count */}
      <p className="text-xs text-muted-foreground mb-2">
        {filteredExercises.length} exercise{filteredExercises.length !== 1 ? "s" : ""} found
      </p>

      {/* Virtual List */}
      <div
        ref={parentRef}
        className="h-[300px] overflow-y-auto -mx-4 px-4"
        style={{ contain: "strict" }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualItems.map((virtualItem) => {
            const exercise = filteredExercises[virtualItem.index];
            return (
              <div
                key={exercise._id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <button
                  onClick={() => onSelect(exercise)}
                  disabled={isAdding}
                  className="w-full h-[56px] mb-2 rounded-[1.75rem] bg-card border border-border text-left px-4 hover:bg-accent transition-colors disabled:opacity-50"
                >
                  <span className="font-medium text-sm">{exercise.name}</span>
                </button>
              </div>
            );
          })}
        </div>

        {filteredExercises.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No exercises found</p>
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs mt-2 underline"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {isAdding && (
        <div className="mt-2 text-center text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
          Adding exercise...
        </div>
      )}
    </div>
  );
}

export default function PlanPage() {
  const router = useRouter();
  const { user } = useUser();
  const userId = user?.id;

  const scheduleData = useQuery(
    api.plans.getCurrentWeekSchedule,
    userId ? { userId } : "skip"
  );

  const exerciseLibrary = useQuery(api.exerciseLibrary.getExercises, {});
  
  const createOrUpdateWeekDay = useMutation(api.plans.createOrUpdateWeekDay);
  const addExerciseToPlanDay = useMutation(api.plans.addExerciseToPlanDay);
  const removePlanPrescription = useMutation(api.plans.removePlanPrescription);
  const reorderPlanPrescriptions = useMutation(api.plans.reorderPlanPrescriptions);
  const quickAddStandardExercises = useMutation(api.plans.quickAddStandardExercises);

  const [view, setView] = useState<"schedule" | "details">("schedule");
  const [pendingChanges, setPendingChanges] = useState<{
    [key: number]: { focus: string; existingId: string | null };
  }>({});
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number | null>(null);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [dayActionStates, setDayActionStates] = useState<Record<number, DayActionState>>({});

  const schedule = scheduleData as WeekSchedule | null | undefined;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDayTypeChange = (
    dayOfWeek: number,
    newFocus: string,
    existingId: string | null
  ) => {
    setPendingChanges((prev: { [key: number]: { focus: string; existingId: string | null } }) => ({
      ...prev,
      [dayOfWeek]: { focus: newFocus, existingId },
    }));
  };

  const handleSave = async () => {
    if (!schedule) return;

    const changes = Object.entries(pendingChanges) as [string, { focus: string; existingId: string | null }][];

    for (const [dayOfWeekStr, change] of changes) {
      const dayOfWeek = parseInt(dayOfWeekStr);
      const result = await createOrUpdateWeekDay({
        weekId: schedule.currentWeekId as Id<"planWeeks">,
        planTemplateId: schedule.planTemplateId as Id<"planTemplates">,
        dayOfWeek,
        focus: change.focus,
        existingPlanDayId: change.existingId
          ? (change.existingId as Id<"planDays">)
          : undefined,
      });
      
      // If day was created and has a workout type (not Rest), auto-add exercises
      if (result.created && change.focus !== "Rest" && result.planDayId) {
        await quickAddStandardExercises({
          planDayId: result.planDayId as Id<"planDays">,
          dayType: change.focus,
        });
      }
    }

    router.push("/exercise");
  };

  const getDisplayFocus = (day: PlanDay) => {
    return pendingChanges[day.dayOfWeek]?.focus ?? day.focus;
  };

  const getDisplayIsRest = (day: PlanDay) => {
    const focus = getDisplayFocus(day);
    return focus === "Rest" || focus.toLowerCase().includes("rest");
  };

  const selectedDay = useMemo(() => {
    if (!schedule || selectedDayOfWeek === null) return null;
    return schedule.days.find((day) => day.dayOfWeek === selectedDayOfWeek) ?? null;
  }, [schedule, selectedDayOfWeek]);

  const setDayActionState = (
    dayOfWeek: number,
    updates: Partial<DayActionState>
  ) => {
    setDayActionStates((prev) => ({
      ...prev,
      [dayOfWeek]: {
        ...(prev[dayOfWeek] ?? DEFAULT_DAY_ACTION_STATE),
        ...updates,
      },
    }));
  };

  const getDayActionState = (dayOfWeek: number): DayActionState => {
    return dayActionStates[dayOfWeek] ?? DEFAULT_DAY_ACTION_STATE;
  };

  const ensurePlanDayId = async (dayOfWeek: number): Promise<Id<"planDays">> => {
    if (!schedule) {
      throw new Error("No schedule available");
    }

    const latestDay = schedule.days.find((day) => day.dayOfWeek === dayOfWeek);
    if (!latestDay) {
      throw new Error("Day not found");
    }

    if (latestDay._id) {
      return latestDay._id as Id<"planDays">;
    }

    const focus = getDisplayFocus(latestDay);
    const result = await createOrUpdateWeekDay({
      weekId: schedule.currentWeekId as Id<"planWeeks">,
      planTemplateId: schedule.planTemplateId as Id<"planTemplates">,
      dayOfWeek,
      focus,
    });

    if (!result.planDayId) {
      throw new Error("Failed to create day");
    }

    return result.planDayId as Id<"planDays">;
  };

  const handleAddExercise = async (dayOfWeek: number, exerciseId: string, exerciseName: string) => {
    setDayActionState(dayOfWeek, { adding: true });
    try {
      const planDayId = await ensurePlanDayId(dayOfWeek);
      await addExerciseToPlanDay({
        planDayId,
        exerciseLibraryId: exerciseId as Id<"exerciseLibrary">,
      });
      toast.success(`Added ${exerciseName}`, {
        description: "Exercise added to your day.",
      });
    } catch (error) {
      console.error("[Plan] Failed to add exercise:", error);
      toast.error("Could not add exercise", {
        description: "Please try again.",
      });
    } finally {
      setDayActionState(dayOfWeek, { adding: false });
    }
  };

  const handleRemoveExercise = async (dayOfWeek: number, prescriptionId: string) => {
    setDayActionState(dayOfWeek, { removingId: prescriptionId });
    try {
      await removePlanPrescription({
        prescriptionId: prescriptionId as Id<"planPrescriptions">,
      });
      toast.success("Removed exercise", {
        description: "Workout day updated.",
      });
    } catch (error) {
      console.error("[Plan] Failed to remove exercise:", error);
      toast.error("Could not remove exercise", {
        description: "Please try again.",
      });
    } finally {
      setDayActionState(dayOfWeek, { removingId: null });
    }
  };

  const handleDragEnd = async (event: DragEndEvent, day: PlanDay) => {
    const { active, over } = event;

    if (over && active.id !== over.id && day._id) {
      const prescriptions = day.prescriptions;
      const oldIndex = prescriptions.findIndex((p) => p._id === active.id);
      const newIndex = prescriptions.findIndex((p) => p._id === over.id);

      const newOrder = arrayMove(prescriptions, oldIndex, newIndex);

      // Update in backend
      const updates = newOrder.map((p, index) => ({
        prescriptionId: p._id as Id<"planPrescriptions">,
        newOrder: index + 1,
      }));

      try {
        await reorderPlanPrescriptions({
          planDayId: day._id as Id<"planDays">,
          prescriptionOrders: updates,
        });
      } catch (error) {
        console.error("[Plan] Failed to reorder:", error);
      }
    }
  };

  const handleQuickAdd = async (day: PlanDay) => {
    if (!schedule) return;

    const focus = getDisplayFocus(day);
    if (focus === "Rest") {
      return;
    }

    setDayActionState(day.dayOfWeek, { quickAdding: true });
    try {
      const planDayId = await ensurePlanDayId(day.dayOfWeek);
      const result = await quickAddStandardExercises({
        planDayId,
        dayType: focus,
      });
      toast.success(`Added ${result.added} exercises`, {
        description: `${focus} day is ready.`,
      });
    } catch (error) {
      console.error("[Plan] Quick add failed:", error);
      toast.error("Could not quick add exercises", {
        description: "Please try again.",
      });
    } finally {
      setDayActionState(day.dayOfWeek, { quickAdding: false });
    }
  };

  if (!schedule) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() =>
              view === "details" ? setView("schedule") : router.push("/exercise")
            }
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {view === "schedule" ? "Back" : "Schedule"}
          </button>
          <span className="text-sm font-semibold text-muted-foreground">
            Week {schedule.currentWeek} of {schedule.totalWeeks}
          </span>
        </div>
        <h1 className="text-2xl font-black text-foreground">
          {view === "schedule" ? schedule.planName : "Workout Details"}
        </h1>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {view === "schedule" ? (
          <ScheduleView
            key="schedule"
            days={schedule.days}
            getDisplayFocus={getDisplayFocus}
            getDisplayIsRest={getDisplayIsRest}
            onDayTypeChange={handleDayTypeChange}
            onQuickAdd={handleQuickAdd}
            onManageExercises={(day: PlanDay) => {
              setSelectedDayOfWeek(day.dayOfWeek);
              setShowExercisePicker(false);
            }}
            onNext={() => setView("details")}
          />
        ) : (
          <DetailsView
            key="details"
            days={schedule.days}
            getDisplayFocus={getDisplayFocus}
            getDisplayIsRest={getDisplayIsRest}
            onSave={handleSave}
            hasChanges={Object.keys(pendingChanges).length > 0}
          />
        )}
      </AnimatePresence>

      {/* Exercise Management Modal */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="h-full flex flex-col max-w-lg mx-auto">
            {/* Modal Header */}
            <div className="px-4 pt-6 pb-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black">{selectedDay.weekdayName} Exercises</h2>
                  <p className="text-sm text-muted-foreground">
                    {getDisplayFocus(selectedDay)} Day
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedDayOfWeek(null);
                    setShowExercisePicker(false);
                  }}
                  className="p-2 rounded-full hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Exercise List with Drag & Drop */}
            <div className="flex-1 overflow-y-auto p-4">
              {!getDisplayIsRest(selectedDay) ? (
                <>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(e) => handleDragEnd(e, selectedDay)}
                  >
                    <SortableContext
                      items={selectedDay.prescriptions.map((p) => p._id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {selectedDay.prescriptions.map((prescription) => (
                          <SortableExerciseItem
                            key={prescription._id}
                            prescription={prescription}
                            isRemoving={
                              getDayActionState(selectedDay.dayOfWeek).removingId ===
                              prescription._id
                            }
                            onRemove={() =>
                              handleRemoveExercise(selectedDay.dayOfWeek, prescription._id)
                            }
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>

                  {selectedDay.prescriptions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No exercises yet</p>
                      <p className="text-sm mt-1">Add exercises or use Quick Add</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Rest Day</p>
                  <p className="text-sm mt-1">No exercises needed</p>
                </div>
              )}
            </div>

            {/* Exercise Picker with Virtual Scrolling */}
            {showExercisePicker && exerciseLibrary && (
              <VirtualExercisePicker
                exercises={exerciseLibrary}
                onSelect={(exercise) =>
                  handleAddExercise(selectedDay.dayOfWeek, exercise._id, exercise.name)
                }
                isAdding={getDayActionState(selectedDay.dayOfWeek).adding}
              />
            )}

            {/* Bottom Actions */}
            {!getDisplayIsRest(selectedDay) && (
              <div className="p-4 border-t border-border space-y-2">
                <Button
                  onClick={() => setShowExercisePicker(!showExercisePicker)}
                  variant="outline"
                  disabled={getDayActionState(selectedDay.dayOfWeek).adding}
                  className="w-full rounded-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Exercise
                </Button>
                <Button
                  onClick={() => handleQuickAdd(selectedDay)}
                  disabled={getDayActionState(selectedDay.dayOfWeek).quickAdding}
                  className="w-full rounded-full"
                >
                  {getDayActionState(selectedDay.dayOfWeek).quickAdding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Quick Add Standard Set
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Schedule View Component
function ScheduleView({
  days,
  getDisplayFocus,
  getDisplayIsRest,
  onDayTypeChange,
  onQuickAdd,
  onManageExercises,
  onNext,
}: {
  days: PlanDay[];
  getDisplayFocus: (day: PlanDay) => string;
  getDisplayIsRest: (day: PlanDay) => boolean;
  onDayTypeChange: (dayOfWeek: number, newFocus: string, existingId: string | null) => void;
  onQuickAdd: (day: PlanDay) => void;
  onManageExercises: (day: PlanDay) => void;
  onNext: () => void;
}) {
  const [editingDay, setEditingDay] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="px-4 space-y-3"
    >
      <p className="text-sm text-muted-foreground mb-4">
        Tap any day to change its workout type or manage exercises
      </p>

      {days.map((day) => {
        const focus = getDisplayFocus(day);
        const isRest = getDisplayIsRest(day);
        const isEditing = editingDay === day.dayOfWeek;

        return (
          <div key={day.dayOfWeek} className="relative">
            <div
              className={`w-full rounded-[1.5rem] overflow-hidden ${
                isRest
                  ? "bg-slate-50 border-2 border-slate-200"
                  : "bg-gradient-to-br from-[#4a7fc9] to-[#2f63bf] text-white"
              }`}
            >
              <button
                onClick={() => setEditingDay(isEditing ? null : day.dayOfWeek)}
                className="w-full p-5 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                        isRest
                          ? "bg-slate-200 text-slate-600"
                          : "bg-white/20 text-white"
                      }`}
                    >
                      {day.weekdayName}
                    </div>
                    <div>
                      <h3
                        className={`text-xl font-black ${
                          isRest ? "text-slate-700" : "text-white"
                        }`}
                      >
                        {isRest ? "Rest Day" : focus}
                      </h3>
                      {!isRest && (
                        <p className="text-sm text-white/80 mt-0.5">
                          {day.prescriptions.length} exercises
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isRest && day.prescriptions.length === 0 && (
                      <span className="text-xs text-white/70">No exercises</span>
                    )}
                    <div
                      className={`px-3 py-1.5 rounded-full text-xs font-black tracking-wider ${
                        isRest
                          ? "bg-slate-200 text-slate-600"
                          : "bg-white/20 text-white"
                      }`}
                    >
                      {isRest ? "REST" : focus.split(" ")[0].toUpperCase()}
                    </div>
                  </div>
                </div>
              </button>

              {/* Actions */}
              {!isRest && (
                <div className="px-5 pb-5 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onManageExercises(day);
                    }}
                    className="flex-1 rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    Manage Exercises
                  </Button>
                  {day.prescriptions.length === 0 && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickAdd(day);
                      }}
                      className="rounded-full bg-white text-[#2f63bf] hover:bg-white/90"
                    >
                      <Zap className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Day Type Picker */}
            {isEditing && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-0 right-0 mt-2 z-10 bg-card border border-border rounded-2xl p-3 shadow-lg"
              >
                <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">
                  Select workout type
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {dayTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        onDayTypeChange(day.dayOfWeek, type, day._id);
                        setEditingDay(null);
                      }}
                      className={`p-2 rounded-xl text-xs font-semibold transition-colors ${
                        focus === type ||
                        (type === "Rest" &&
                          (focus === "Rest" ||
                            focus.toLowerCase().includes("rest")))
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary hover:bg-secondary/80"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        );
      })}

      <div className="pt-6">
        <Button
          onClick={onNext}
          className="w-full rounded-full h-12 font-black uppercase tracking-wider bg-primary text-primary-foreground"
        >
          Review Workouts
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// Details View Component
function DetailsView({
  days,
  getDisplayFocus,
  getDisplayIsRest,
  onSave,
  hasChanges,
}: {
  days: PlanDay[];
  getDisplayFocus: (day: PlanDay) => string;
  getDisplayIsRest: (day: PlanDay) => boolean;
  onSave: () => void;
  hasChanges: boolean;
}) {
  const workoutDays = days.filter((day) => !getDisplayIsRest(day));

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="px-4 space-y-4"
    >
      <p className="text-sm text-muted-foreground mb-4">
        {workoutDays.length} workout days this week
      </p>

      {workoutDays.map((day) => {
        const focus = getDisplayFocus(day);

        return (
          <div
            key={day.dayOfWeek}
            className="rounded-[1.5rem] bg-card border border-border overflow-hidden"
          >
            <div className="p-4 bg-gradient-to-r from-[#4a7fc9]/10 to-transparent border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#4a7fc9]/20 flex items-center justify-center font-bold text-[#4a7fc9]">
                  {day.weekdayName}
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">{day.name}</p>
                  <p className="text-lg font-black text-foreground">{focus}</p>
                </div>
                <span className="ml-auto text-sm text-muted-foreground">
                  {day.prescriptions.length} exercises
                </span>
              </div>
            </div>
            
            <div className="p-4">
              {day.prescriptions.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No exercises configured. Use &quot;Manage Exercises&quot; to add some.
                </p>
              ) : (
                <ul className="space-y-2">
                  {day.prescriptions.map((prescription, index) => (
                    <li
                      key={prescription._id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className="w-5 h-5 rounded-full bg-muted text-[10px] font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span>{prescription.exerciseName}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
      })}

      {workoutDays.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>All days are set to REST</p>
          <p className="text-sm mt-1">Go back to add workout days</p>
        </div>
      )}

      <div className="pt-6 space-y-3">
        <Button
          onClick={onSave}
          className="w-full rounded-full h-12 font-black uppercase tracking-wider bg-primary text-primary-foreground"
        >
          {hasChanges ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Save Changes
            </>
          ) : (
            "Done"
          )}
        </Button>
        {hasChanges && (
          <p className="text-xs text-center text-muted-foreground">
            Changes apply to all weeks
          </p>
        )}
      </div>
    </motion.div>
  );
}
