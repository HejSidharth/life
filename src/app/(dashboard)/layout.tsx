"use client";

import { motion } from "framer-motion";
import { Dock } from "@/components/navigation/Dock";
import { WizardProvider } from "@/context/WizardContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <WizardProvider>
      <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-foreground">
        {/* Main Content */}
        <motion.main
          className="pt-10 pb-32 px-4 max-w-lg mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
        >
          {children}
        </motion.main>

        {/* Modern iOS Dock */}
        <Dock />
      </div>
    </WizardProvider>
  );
}
