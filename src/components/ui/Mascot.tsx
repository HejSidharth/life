"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface MascotProps {
  mood?: "happy" | "excited" | "celebrating" | "sleepy";
  size?: "sm" | "md" | "lg";
}

export type MascotVariant = "wave" | "food" | "hydration" | "workout";

interface MascotImageProps {
  variant: MascotVariant;
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  className?: string;
}

const mascotImageSources: Record<MascotVariant, string> = {
  wave: "/mascots/fox-wave.png",
  food: "/mascots/fox-food.png",
  hydration: "/mascots/fox-hydration.png",
  workout: "/mascots/fox-workout.png",
};

const mascotImageSizes = {
  sm: 88,
  md: 120,
  lg: 170,
  xl: 240,
};

export function MascotImage({
  variant,
  size = "lg",
  animate = true,
  className,
}: MascotImageProps) {
  const dimension = mascotImageSizes[size];

  return (
    <motion.div
      className={className}
      animate={
        animate
          ? {
              y: [0, -6, 0],
              transition: {
                duration: 2.4,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }
          : undefined
      }
    >
      <Image
        src={mascotImageSources[variant]}
        alt={`${variant} fox mascot`}
        width={dimension}
        height={dimension}
        className="h-auto w-auto max-w-full"
        priority={size === "xl"}
      />
    </motion.div>
  );
}

export function Mascot({ mood = "happy", size = "md" }: MascotProps) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const animations = {
    happy: {
      y: [0, -5, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut" as const,
      },
    },
    excited: {
      y: [0, -10, 0],
      rotate: [-5, 5, -5, 5, 0],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        ease: "easeInOut" as const,
      },
    },
    celebrating: {
      y: [0, -15, 0],
      rotate: [-10, 10, -10, 10, 0],
      scale: [1, 1.1, 1],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut" as const,
      },
    },
    sleepy: {
      y: [0, -2, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut" as const,
      },
    },
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} relative`}
      animate={animations[mood]}
    >
      {/* Character Body */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Main Body */}
        <circle cx="50" cy="50" r="40" fill="var(--color-coral)" />
        
        {/* Highlight */}
        <ellipse cx="35" cy="35" rx="12" ry="8" fill="var(--color-coral-light)" opacity="0.6" />
        
        {/* Eyes */}
        <circle cx="38" cy="45" r="5" fill="var(--color-charcoal)" />
        <circle cx="62" cy="45" r="5" fill="var(--color-charcoal)" />
        
        {/* Eye highlights */}
        <circle cx="40" cy="43" r="2" fill="hsl(var(--background))" />
        <circle cx="64" cy="43" r="2" fill="hsl(var(--background))" />
        
        {/* Cheeks */}
        <circle cx="30" cy="55" r="6" fill="var(--color-blush)" opacity="0.8" />
        <circle cx="70" cy="55" r="6" fill="var(--color-blush)" opacity="0.8" />
        
        {/* Smile */}
        <path
          d="M 38 58 Q 50 65 62 58"
          stroke="var(--color-charcoal)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Arms */}
        <ellipse
          cx="15"
          cy="50"
          rx="8"
          ry="12"
          fill="var(--color-coral)"
          transform="rotate(-20 15 50)"
        />
        <ellipse
          cx="85"
          cy="50"
          rx="8"
          ry="12"
          fill="var(--color-coral)"
          transform="rotate(20 85 50)"
        />
        
        {/* Legs */}
        <ellipse cx="38" cy="88" rx="8" ry="12" fill="var(--color-coral)" />
        <ellipse cx="62" cy="88" rx="8" ry="12" fill="var(--color-coral)" />
        
        {/* Sparkles for excited/celebrating */}
        {(mood === "excited" || mood === "celebrating") && (
          <>
            <path d="M 10 20 L 12 25 L 17 25 L 13 29 L 14 34 L 10 31 L 6 34 L 7 29 L 3 25 L 8 25 Z" fill="var(--color-sun)" />
            <path d="M 90 15 L 92 20 L 97 20 L 93 24 L 94 29 L 90 26 L 86 29 L 87 24 L 83 20 L 88 20 Z" fill="var(--color-mint)" />
            <path d="M 95 80 L 97 85 L 102 85 L 98 89 L 99 94 L 95 91 L 91 94 L 92 89 L 88 85 L 93 85 Z" fill="var(--color-sun)" />
          </>
        )}
      </svg>
    </motion.div>
  );
}

// Animated mascot that reacts to scroll
export function AnimatedMascot() {
  return (
    <motion.div
      className="fixed bottom-24 right-4 z-40"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.5,
      }}
    >
      <Mascot mood="happy" size="md" />
    </motion.div>
  );
}

// Greeting mascot with text bubble
export function GreetingMascot({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3">
      <Mascot mood="excited" size="sm" />
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card px-4 py-2 rounded-2xl rounded-bl-none shadow-lg border border-border"
      >
        <p className="text-sm font-semibold text-foreground">{message}</p>
      </motion.div>
    </div>
  );
}
