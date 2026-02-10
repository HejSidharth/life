"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CircularProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showPercentage?: boolean;
  icon?: React.ReactNode;
  color?: string;
}

export function CircularProgress({
  value,
  max,
  size = 64,
  strokeWidth = 6,
  className,
  showPercentage = true,
  icon,
  color = "hsl(0, 0%, 98%)",
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="-rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 20,
          }}
          style={{
            filter: `drop-shadow(0 0 6px ${color}40)`,
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {icon ? (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 20,
              delay: 0.2,
            }}
          >
            {icon}
          </motion.div>
        ) : showPercentage ? (
          <motion.span
            className="text-xs font-bold"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 20,
              delay: 0.2,
            }}
          >
            {Math.round(percentage)}%
          </motion.span>
        ) : null}
      </div>
    </div>
  );
}

interface WidgetCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  progress?: {
    value: number;
    max: number;
  };
  color?: string;
  onClick?: () => void;
  className?: string;
}

export function WidgetCard({
  title,
  value,
  subtitle,
  icon,
  progress,
  color = "hsl(0, 0%, 98%)",
  onClick,
  className,
}: WidgetCardProps) {
  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-3xl bg-card border border-border/50 p-4 cursor-pointer",
        "hover:border-primary/30 transition-colors",
        className
      )}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
      }}
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          background: `radial-gradient(circle at top right, ${color}, transparent 70%)`,
        }}
      />

      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <motion.h3
            className="text-2xl font-bold mt-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              delay: 0.1,
            }}
          >
            {value}
          </motion.h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="ml-3">
          {progress ? (
            <CircularProgress
              value={progress.value}
              max={progress.max}
              size={56}
              strokeWidth={5}
              color={color}
            />
          ) : icon ? (
            <motion.div
              className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center"
              style={{ color }}
              whileHover={{ rotate: 10 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 20,
              }}
            >
              {icon}
            </motion.div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
