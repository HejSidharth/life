"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Dumbbell,
  Apple,
  Droplets,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, PanInfo, useAnimation } from "framer-motion";
import { useState, useEffect, type MouseEvent as ReactMouseEvent } from "react";
import { useWizard } from "@/context/WizardContext";

const DOCK_WIDTH = 340;
const NAV_X = 0;
const ACTION_X = -DOCK_WIDTH;
const SWIPE_DISTANCE_THRESHOLD = 48;
const SWIPE_VELOCITY_THRESHOLD = 420;
const DRAG_INTENT_THRESHOLD = 8;

type DockMode = "nav" | "action";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/exercise", icon: Dumbbell, label: "Workouts" },
  { href: "/food", icon: Apple, label: "Food" },
  { href: "/hydration", icon: Droplets, label: "Water" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

function getXForMode(mode: DockMode): number {
  return mode === "nav" ? NAV_X : ACTION_X;
}

function clampX(x: number): number {
  return Math.min(NAV_X, Math.max(ACTION_X, x));
}

function getTargetModeFromDrag(
  offsetX: number,
  velocityX: number,
  currentMode: DockMode
): DockMode {
  if (
    offsetX <= -SWIPE_DISTANCE_THRESHOLD ||
    velocityX <= -SWIPE_VELOCITY_THRESHOLD
  ) {
    return "action";
  }

  if (
    offsetX >= SWIPE_DISTANCE_THRESHOLD ||
    velocityX >= SWIPE_VELOCITY_THRESHOLD
  ) {
    return "nav";
  }

  const projectedX = clampX(getXForMode(currentMode) + offsetX);
  const midpoint = (NAV_X + ACTION_X) / 2;
  return projectedX <= midpoint ? "action" : "nav";
}

export function Dock() {
  const pathname = usePathname();
  const isWorkoutPage = pathname === "/exercise";
  const [mode, setMode] = useState<DockMode>("nav");
  const [suppressTap, setSuppressTap] = useState(false);
  const controls = useAnimation();
  const { isWizardOpen } = useWizard();

  const snapToMode = (targetMode: DockMode) => {
    setMode(targetMode);
    return controls.start({
      x: getXForMode(targetMode),
      transition: { type: "spring", stiffness: 420, damping: 36 },
    });
  };

  // Reset mode when navigating away from workout page
  useEffect(() => {
    if (!isWorkoutPage) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Route transitions must force dock back to nav mode.
      setMode("nav");
      setSuppressTap(false);
      controls.set({ x: NAV_X });
    }
  }, [isWorkoutPage, controls, setSuppressTap]);

  const handleDrag = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (!isWorkoutPage) return;
    if (Math.abs(info.offset.x) > DRAG_INTENT_THRESHOLD) {
      setSuppressTap(true);
    }
  };

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (!isWorkoutPage) return;

    const targetMode = getTargetModeFromDrag(info.offset.x, info.velocity.x, mode);
    void snapToMode(targetMode);
    window.setTimeout(() => setSuppressTap(false), 140);
  };

  const toggleMode = () => {
    if (!isWorkoutPage) return;
    const nextMode = mode === "nav" ? "action" : "nav";
    void snapToMode(nextMode);
  };

  const shouldIgnoreClick = (
    event: ReactMouseEvent<HTMLButtonElement | HTMLAnchorElement>
  ): boolean => {
    if (!suppressTap) return false;
    event.preventDefault();
    event.stopPropagation();
    return true;
  };

  const handleActionClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (shouldIgnoreClick(event)) return;
    // Dispatch custom event to trigger workout start
    window.dispatchEvent(new CustomEvent("trigger-start-workout"));
  };

  return (
    <motion.div 
      className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: isWizardOpen ? 0 : 1,
        y: isWizardOpen ? 20 : 0,
        pointerEvents: isWizardOpen ? "none" : "auto"
      }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <div 
        className={cn(
          "relative overflow-hidden h-16 rounded-[1.75rem] bg-card border border-border",
          isWizardOpen ? "pointer-events-none" : "pointer-events-auto"
        )}
        style={{ width: isWorkoutPage ? `${DOCK_WIDTH}px` : "auto" }}
      >
        <motion.div
          className="flex h-full items-center"
          drag={isWorkoutPage ? "x" : false}
          dragConstraints={{ left: ACTION_X, right: NAV_X }}
          dragElastic={0.1}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          animate={controls}
          initial={{ x: NAV_X }}
          style={{ width: isWorkoutPage ? "200%" : "100%" }}
        >
          {/* Page 1: Navigation */}
          <div
            className="flex h-full items-center gap-3 px-4 shrink-0 justify-center"
            style={{ width: isWorkoutPage ? `${DOCK_WIDTH}px` : "auto" }}
          >
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <DockIcon
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  isActive={isActive}
                  suppressTap={suppressTap}
                />
              );
            })}
            
            {isWorkoutPage && <div className="w-8 shrink-0" aria-hidden />}
          </div>

          {/* Page 2: Action Button (Only for Workout Page) */}
          {isWorkoutPage && (
            <div
              className="flex h-full items-center gap-3 pr-4 pl-2 shrink-0"
              style={{ width: `${DOCK_WIDTH}px` }}
            >
              <div className="w-8 shrink-0" aria-hidden />
              <button
                onClick={handleActionClick}
                className="flex-1 h-11 rounded-2xl border border-border bg-foreground text-background flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-[0.2em] active:scale-95 transition-transform"
                type="button"
              >
                <Plus className="w-4 h-4" strokeWidth={3} />
                Start New Workout
              </button>
            </div>
          )}
        </motion.div>

        {isWorkoutPage && (
          <button
            type="button"
            aria-label={mode === "nav" ? "Show workout action" : "Show navigation"}
            onClick={toggleMode}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl bg-secondary border border-border text-foreground hover:opacity-90 transition-opacity flex items-center justify-center",
              mode === "nav" ? "right-2" : "left-2"
            )}
          >
            {mode === "nav" ? (
              <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
            ) : (
              <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}

function DockIcon({ href, icon: Icon, label, isActive, suppressTap }: {
  href: string; 
  icon: LucideIcon; 
  label: string; 
  isActive: boolean;
  suppressTap: boolean;
}) {
  return (
    <Link
      href={href}
      className="relative group"
      onClick={(event) => {
        if (!suppressTap) return;
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <div
        className={cn(
          "relative flex h-11 w-11 items-center justify-center rounded-2xl transition-colors duration-200",
          isActive 
            ? "bg-foreground text-background" 
            : "bg-secondary text-muted-foreground hover:bg-secondary hover:text-foreground"
        )}
      >
        <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
        
        {/* Simple Static Tooltip on hover (CSS only) */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 rounded-lg bg-muted border border-border text-foreground text-[10px] font-bold uppercase tracking-widest whitespace-nowrap pointer-events-none hidden group-hover:block">
          {label}
        </div>

        {/* Active Dot */}
        {isActive && (
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-foreground rounded-full" />
        )}
      </div>
    </Link>
  );
}
