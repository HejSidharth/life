"use client";

import { motion } from "framer-motion";
import { format, isSameDay, addDays, subDays, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CalendarStripProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

export function CalendarStrip({ selectedDate, onDateChange }: CalendarStripProps) {
  // Show 7 days centered on selected date
  const days = useMemo(() => {
    const arr = [];
    for (let i = -3; i <= 3; i++) {
      arr.push(addDays(selectedDate, i));
    }
    return arr;
  }, [selectedDate]);

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-tight text-zinc-300 capitalize">
            {format(selectedDate, "MMMM yyyy")}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDateChange(subDays(selectedDate, 1))}
            className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white px-2 py-1 transition-colors"
          >
            Prev
          </button>
          
          <FullCalendarDialog selectedDate={selectedDate} onDateChange={onDateChange} />
          
          <button
            onClick={() => onDateChange(addDays(selectedDate, 1))}
            className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white px-2 py-1 transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center gap-2">
        {days.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          
          return (
            <motion.button
              key={day.toISOString()}
              onClick={() => onDateChange(day)}
              className={cn(
                "flex-1 flex flex-col items-center py-3 rounded-2xl transition-all relative",
                isSelected 
                  ? "bg-white text-black shadow-lg" 
                  : "bg-zinc-900/50 text-zinc-500 hover:bg-zinc-800"
              )}
              whileTap={{ scale: 0.95 }}
              transition={springTransition}
            >
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest mb-1",
                isSelected ? "text-black/60" : "text-zinc-600"
              )}>
                {format(day, "eee")}
              </span>
              <span className="text-sm font-black">
                {format(day, "d")}
              </span>
              
              {isToday && !isSelected && (
                <div className="absolute -top-1 w-1 h-1 bg-zinc-500 rounded-full" />
              )}
              {isSelected && (
                <motion.div
                  layoutId="active-day-bg"
                  className="absolute inset-0 bg-white rounded-2xl -z-10"
                  transition={springTransition}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function FullCalendarDialog({ selectedDate, onDateChange }: CalendarStripProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);
  const [isOpen, setIsOpen] = useState(false);

  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const daysArr = [];
    
    // Pad start with empty days for alignment
    const startDay = start.getDay();
    for (let i = 0; i < startDay; i++) {
      daysArr.push(null);
    }
    
    // Fill days
    for (let i = 1; i <= end.getDate(); i++) {
      daysArr.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
    }
    
    return daysArr;
  }, [currentMonth]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white px-2 py-1 transition-colors">
          View All
        </button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl border-border bg-black p-0 overflow-hidden max-w-sm">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight capitalize">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                className="h-8 px-3 rounded-xl bg-zinc-900 text-[10px] font-black uppercase tracking-widest"
                onClick={() => setCurrentMonth(subDays(startOfMonth(currentMonth), 1))}
              >
                Prev
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                className="h-8 px-3 rounded-xl bg-zinc-900 text-[10px] font-black uppercase tracking-widest"
                onClick={() => setCurrentMonth(addDays(endOfMonth(currentMonth), 1))}
              >
                Next
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
              <div key={d} className="text-center text-[10px] font-black text-zinc-600 py-2">
                {d}
              </div>
            ))}
            {monthDays.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />;
              
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => {
                    onDateChange(day);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "aspect-square flex items-center justify-center rounded-xl text-sm font-bold transition-all relative",
                    isSelected 
                      ? "bg-white text-black" 
                      : isToday 
                        ? "bg-zinc-800 text-white" 
                        : "text-zinc-400 hover:bg-zinc-900"
                  )}
                >
                  {day.getDate()}
                  {isToday && !isSelected && (
                    <div className="absolute bottom-1.5 w-1 h-1 bg-white rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
