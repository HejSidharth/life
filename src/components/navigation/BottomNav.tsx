"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Dumbbell, Apple, Droplets, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/exercise", icon: Dumbbell, label: "Workouts" },
  { href: "/food", icon: Apple, label: "Food" },
  { href: "/hydration", icon: Droplets, label: "Water" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

const springTransition = {
  type: "spring" as const,
  stiffness: 500,
  damping: 30,
};

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-header safe-area-bottom">
      <div className="flex items-center justify-around py-2 px-4 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center py-2 px-3"
            >
              <motion.div
                className={cn(
                  "relative flex items-center justify-center w-12 h-8 rounded-2xl transition-colors",
                  isActive ? "bg-primary/20" : ""
                )}
                whileTap={{ scale: 0.85 }}
                transition={springTransition}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary/20 rounded-2xl"
                    initial={false}
                    transition={springTransition}
                  />
                )}

                <Icon
                  className={cn(
                    "w-5 h-5 relative z-10 transition-colors duration-200",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </motion.div>

              <motion.span
                className={cn(
                  "text-[10px] mt-1 font-medium transition-colors duration-200",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                animate={{
                  scale: isActive ? 1.05 : 1,
                }}
                transition={springTransition}
              >
                {item.label}
              </motion.span>

              {/* Active pill indicator */}
              {isActive && (
                <motion.div
                  layoutId="activePill"
                  className="absolute -bottom-0.5 w-1 h-1 bg-primary rounded-full"
                  initial={false}
                  transition={springTransition}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
