"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { Dock } from "@/components/navigation/Dock";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-white selection:bg-white/10 selection:text-white">
      {/* Main Content */}
      <motion.main
        className="pt-10 pb-32 px-4 max-w-lg mx-auto md:max-w-6xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
      >
        {children}
      </motion.main>

      {/* Modern iOS Dock */}
      <Dock />
    </div>
  );
}
