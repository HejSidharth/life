"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date) => void;
  className?: string;
}

export function DatePicker({ value, onChange, className }: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [viewDate, setViewDate] = React.useState(value || new Date());
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedDate = value || new Date();

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const handleDayClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onChange?.(newDate);
    setIsOpen(false);
  };

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const isSelected = (day: number) => {
    return selectedDate.getDate() === day &&
      selectedDate.getMonth() === viewDate.getMonth() &&
      selectedDate.getFullYear() === viewDate.getFullYear();
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day &&
      today.getMonth() === viewDate.getMonth() &&
      today.getFullYear() === viewDate.getFullYear();
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-start text-left font-normal"
      >
        {selectedDate.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 rounded-md border border-border bg-card p-3 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Button type="button" variant="ghost" size="icon" onClick={prevMonth} className="h-7 w-7">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <Button type="button" variant="ghost" size="icon" onClick={nextMonth} className="h-7 w-7">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="text-muted-foreground p-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => (
              <div key={i} className="aspect-square">
                {day && (
                  <button
                    type="button"
                    onClick={() => handleDayClick(day)}
                    className={cn(
                      "w-full h-full text-sm rounded-md hover:bg-accent transition-colors",
                      isSelected(day) && "bg-primary text-primary-foreground hover:bg-primary",
                      isToday(day) && !isSelected(day) && "border border-primary"
                    )}
                  >
                    {day}
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                const today = new Date();
                setViewDate(today);
                onChange?.(today);
                setIsOpen(false);
              }}
            >
              Today
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
