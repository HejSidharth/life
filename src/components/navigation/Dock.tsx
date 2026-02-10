"use client";

import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Dumbbell, Apple, Droplets, Settings } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/exercise", icon: Dumbbell, label: "Workouts" },
  { href: "/food", icon: Apple, label: "Food" },
  { href: "/hydration", icon: Droplets, label: "Water" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Dock() {
  const pathname = usePathname();
  const mouseX = useMotionValue(Infinity);

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <motion.div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="mx-auto flex h-16 items-end gap-3 rounded-3xl bg-zinc-900/80 px-4 pb-3 border border-white/5 backdrop-blur-xl pointer-events-auto shadow-2xl"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <DockIcon
              key={item.href}
              mouseX={mouseX}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={isActive}
            />
          );
        })}
      </motion.div>
    </div>
  );
}

function DockIcon({ mouseX, href, icon: Icon, label, isActive }: any) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthTransform = useTransform(distance, [-150, 0, 150], [44, 70, 44]);
  const heightTransform = useTransform(distance, [-150, 0, 150], [44, 70, 44]);

  const width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  return (
    <Link href={href} className="relative">
      <motion.div
        ref={ref}
        style={{ width, height }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "relative flex items-center justify-center rounded-2xl transition-colors duration-300",
          isActive ? "bg-white text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
        )}
        whileTap={{ scale: 0.9 }}
      >
        <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
        
        {/* Tooltip */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: -45, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              className="absolute px-3 py-1 rounded-lg bg-zinc-800 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest whitespace-nowrap pointer-events-none"
            >
              {label}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Dot */}
        {isActive && (
          <motion.div
            layoutId="dock-active-dot"
            className="absolute -bottom-1.5 w-1 h-1 bg-white rounded-full"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </motion.div>
    </Link>
  );
}
