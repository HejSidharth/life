"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

export default function HomePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && user) {
      router.push("/dashboard");
    }
  }, [user, isLoaded, router]);

  if (isLoaded && user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/10 selection:text-white">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-header">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <span className="text-2xl font-black tracking-tighter gradient-text">Life</span>
          </motion.div>
          
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost" className="text-sm font-medium hover:bg-white/5">
                Sign in
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="bg-white text-black hover:bg-zinc-200 font-bold rounded-full px-5">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6 max-w-6xl mx-auto">
        <div className="text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, ...springTransition }}
          >
            <span className="px-4 py-1.5 rounded-full border border-white/10 bg-zinc-900/50 text-xs font-bold uppercase tracking-widest text-zinc-400">
              The Ultimate Health Portal
            </span>
          </motion.div>

          <motion.h1 
            className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, ...springTransition }}
          >
            Precision <br />
            <span className="text-zinc-500">Self Tracking.</span>
          </motion.h1>

          <motion.p 
            className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto font-medium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, ...springTransition }}
          >
            A high-fidelity health companion designed for peak performance. 
            Track nutrition, workouts, and hydration with unparalleled elegance.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, ...springTransition }}
          >
            <Link href="/sign-up">
              <Button size="lg" className="h-16 px-10 bg-white text-black hover:bg-zinc-200 text-lg font-bold rounded-2xl group shadow-2xl shadow-white/5">
                Start Tracking
              </Button>
            </Link>
            <Button variant="ghost" size="lg" className="h-16 px-10 text-zinc-400 hover:text-white hover:bg-white/5 text-lg font-bold rounded-2xl">
              Learn More
            </Button>
          </motion.div>
        </div>

        {/* Feature Grid */}
        <div className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard 
            title="Nutrition"
            description="Log meals with detailed macros. Precision tracking for calories, protein, and more."
            delay={0.5}
          />
          <FeatureCard 
            title="Training"
            description="Advanced workout logging. Sets, reps, RPE, and automatic PR detection."
            delay={0.6}
          />
          <FeatureCard 
            title="Hydration"
            description="Intelligent fluid tracking. Stay optimized with visual hydration rings."
            delay={0.7}
          />
        </div>

        {/* Secondary Info */}
        <motion.div 
          className="mt-32 p-12 rounded-[2.5rem] bg-zinc-900/30 border border-white/5 text-center space-y-6 overflow-hidden relative"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={springTransition}
        >
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white/5 blur-[100px] rounded-full" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-white/5 blur-[100px] rounded-full" />
          
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter">Designed for the modern athlete.</h2>
          <p className="text-zinc-500 max-w-xl mx-auto font-medium">
            No fluff. No ads. Just pure, intentional data visualization for your life.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 pt-6">
            <div className="flex items-center gap-2 text-zinc-400 font-bold uppercase tracking-widest text-[10px]">
              Private
            </div>
            <div className="flex items-center gap-2 text-zinc-400 font-bold uppercase tracking-widest text-[10px]">
              Fast
            </div>
            <div className="flex items-center gap-2 text-zinc-400 font-bold uppercase tracking-widest text-[10px]">
              Native Feel
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="py-12 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="text-xl font-black tracking-tighter gradient-text">Life</span>
          <p className="text-zinc-600 text-sm font-medium">Built for excellence by Hejamadi.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-zinc-600 hover:text-white transition-colors text-sm font-medium">Terms</a>
            <a href="#" className="text-zinc-600 hover:text-white transition-colors text-sm font-medium">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, description, delay }: { title: string, description: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, ...springTransition }}
      whileHover={{ y: -5 }}
      className="p-8 rounded-[2rem] bg-zinc-900/50 border border-white/5 hover:border-white/10 transition-all group shadow-sm"
    >
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-zinc-500 font-medium text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}
