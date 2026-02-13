"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { MascotImage } from "@/components/ui/Mascot";
import { cn } from "@/lib/utils";
import { SCENE_PRESETS, type SceneKey } from "@/components/dashboard/mascotSceneConfig";

interface MascotSceneHeroProps {
  sceneKey: SceneKey;
  title?: string;
  subtitle?: string;
  dateLabel?: string;
  footer?: ReactNode;
  mascot?: ReactNode;
  showMascot?: boolean;
  sceneMode?: "full" | "sky";
  compact?: boolean;
  skyColor?: string;
  minHeight?: string;
  className?: string;
}

export function MascotSceneHero({
  sceneKey,
  title,
  subtitle,
  dateLabel,
  footer,
  mascot,
  showMascot = true,
  sceneMode = "full",
  compact = false,
  skyColor,
  minHeight,
  className,
}: MascotSceneHeroProps) {
  const preset = SCENE_PRESETS[sceneKey];
  const isPark = preset.style === "park";
  const isCafe = preset.style === "cafe";
  const isWaterfront = preset.style === "waterfront";
  const isGym = preset.style === "gym";
  const isStudio = preset.style === "studio";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn("mascot-scene relative overflow-hidden rounded-[2.5rem] border border-border", className)}
      style={{
        background: sceneMode === "sky" ? skyColor ?? "#2f67c7" : preset.sky,
        minHeight: minHeight ?? (compact ? "12.5rem" : undefined),
      }}
    >
      <div className={cn("relative z-10 px-5 pb-4", title ? "pt-4" : "pt-8")}>
        <div className="flex items-start justify-between">
          <div>
            {title ? <h1 className="text-4xl font-black leading-none text-white">{title}</h1> : null}
            {subtitle ? (
              <p className={cn("text-sm font-black text-white", title ? "mt-2" : "mt-0")}>{subtitle}</p>
            ) : null}
          </div>
          {dateLabel ? (
            <div className="mt-1 rounded-full border border-white/70 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-white">
              {dateLabel}
            </div>
          ) : null}
        </div>

        {showMascot ? (
          <div className="relative mt-3 flex items-end justify-center">
            <div className="absolute bottom-0 h-7 w-52 rounded-full bg-black/15" />
            <div className="translate-y-3 py-3 mascot-scene-character">
              {mascot ?? <MascotImage variant={preset.mascot} size="xl" animate />}
            </div>
          </div>
        ) : null}

        {footer ? <div className="mt-1.5">{footer}</div> : null}
      </div>

      {sceneMode === "full" ? (
        <>
          <div className="absolute inset-x-0 bottom-0 h-[43%]" style={{ backgroundColor: preset.ground }} />

          {isPark ? (
            <>
              <div className="absolute left-[-6%] bottom-[30%] h-[26%] w-[44%] rounded-[999px]" style={{ backgroundColor: preset.accentA }} />
              <div className="absolute right-[-8%] bottom-[31%] h-[24%] w-[46%] rounded-[999px]" style={{ backgroundColor: preset.accentA }} />
              <div className="absolute inset-x-0 bottom-[22%] h-[4%]" style={{ backgroundColor: preset.accentB }} />
              <div className="absolute left-[7%] bottom-[22%] h-[15%] w-[2%]" style={{ backgroundColor: preset.accentC }} />
              <div className="absolute left-[20%] bottom-[22%] h-[15%] w-[2%]" style={{ backgroundColor: preset.accentC }} />
              <div className="absolute right-[20%] bottom-[22%] h-[15%] w-[2%]" style={{ backgroundColor: preset.accentC }} />
              <div className="absolute right-[7%] bottom-[22%] h-[15%] w-[2%]" style={{ backgroundColor: preset.accentC }} />
            </>
          ) : null}

          {isCafe ? (
            <>
              <div className="absolute inset-x-0 bottom-[22%] h-[22%]" style={{ backgroundColor: preset.accentB }} />
              <div className="absolute inset-x-0 bottom-[38%] h-[3.5%]" style={{ backgroundColor: preset.accentC }} />
              <div className="absolute left-[8%] bottom-[22%] h-[12%] w-[20%] rounded-t-xl" style={{ backgroundColor: preset.accentA }} />
              <div className="absolute left-[36%] bottom-[22%] h-[12%] w-[20%] rounded-t-xl" style={{ backgroundColor: preset.accentA }} />
              <div className="absolute right-[8%] bottom-[22%] h-[12%] w-[20%] rounded-t-xl" style={{ backgroundColor: preset.accentA }} />
              <div className="absolute left-[13%] bottom-[30%] h-2 w-2 rounded-full bg-white/80" />
              <div className="absolute left-[41%] bottom-[30%] h-2 w-2 rounded-full bg-white/80" />
              <div className="absolute right-[13%] bottom-[30%] h-2 w-2 rounded-full bg-white/80" />
            </>
          ) : null}

          {isWaterfront ? (
            <>
              <div className="absolute inset-x-0 bottom-[20%] h-[15%]" style={{ backgroundColor: preset.accentA }} />
              <div className="absolute inset-x-0 bottom-[17%] h-[3.5%] bg-white/45" />
              <div className="absolute left-[10%] bottom-[23%] h-3 w-12 rounded-full bg-white/50" />
              <div className="absolute left-[37%] bottom-[26%] h-3 w-10 rounded-full bg-white/50" />
              <div className="absolute right-[15%] bottom-[24%] h-3 w-11 rounded-full bg-white/50" />
              <div className="absolute left-[8%] bottom-[35%] h-10 w-10 rounded-full" style={{ backgroundColor: preset.accentC }} />
              <div className="absolute left-[11.5%] bottom-[38%] h-1.5 w-1.5 rounded-full bg-white/80" />
              <div className="absolute left-[16%] bottom-[34%] h-7 w-1 bg-[#7a8f6c]/70" />
            </>
          ) : null}

          {isGym ? (
            <>
              <div className="absolute inset-x-0 bottom-[21%] h-[22%]" style={{ backgroundColor: preset.accentA }} />
              <div className="absolute inset-x-0 bottom-[21%] h-[1.5%]" style={{ backgroundColor: preset.accentC }} />
              <div className="absolute inset-x-0 bottom-[28%] h-[1.5%]" style={{ backgroundColor: preset.accentC }} />
              <div className="absolute inset-x-0 bottom-[35%] h-[1.5%]" style={{ backgroundColor: preset.accentC }} />
              <div className="absolute left-[8%] bottom-[23%] h-[3%] w-[10%] rounded-full" style={{ backgroundColor: preset.accentB }} />
              <div className="absolute left-[18%] bottom-[24%] h-[1%] w-[12%] rounded-full" style={{ backgroundColor: preset.accentB }} />
              <div className="absolute right-[8%] bottom-[23%] h-[3%] w-[10%] rounded-full" style={{ backgroundColor: preset.accentB }} />
              <div className="absolute right-[18%] bottom-[24%] h-[1%] w-[12%] rounded-full" style={{ backgroundColor: preset.accentB }} />
            </>
          ) : null}

          {isStudio ? (
            <>
              <div className="absolute inset-x-0 bottom-[20%] h-[23%]" style={{ backgroundColor: preset.accentA }} />
              <div className="absolute left-[7%] bottom-[24%] h-[15%] w-[5%] rounded-md" style={{ backgroundColor: preset.accentC }} />
              <div className="absolute left-[13%] bottom-[26%] h-[13%] w-[5%] rounded-md" style={{ backgroundColor: preset.accentB }} />
              <div className="absolute left-[19%] bottom-[25%] h-[14%] w-[5%] rounded-md" style={{ backgroundColor: preset.accentC }} />
              <div className="absolute right-[7%] bottom-[24%] h-[15%] w-[5%] rounded-md" style={{ backgroundColor: preset.accentC }} />
              <div className="absolute right-[13%] bottom-[26%] h-[13%] w-[5%] rounded-md" style={{ backgroundColor: preset.accentB }} />
              <div className="absolute right-[19%] bottom-[25%] h-[14%] w-[5%] rounded-md" style={{ backgroundColor: preset.accentC }} />
              <div className="absolute inset-x-[28%] bottom-[21%] h-[6%] rounded-full" style={{ backgroundColor: preset.accentB }} />
            </>
          ) : null}
        </>
      ) : null}

      <div
        className={cn(
          "absolute h-14 w-24 rounded-full",
          sceneMode === "sky" ? "left-[-2rem] top-4 opacity-40" : "left-8 top-8 opacity-70"
        )}
        style={{ backgroundColor: preset.cloud }}
      />
      <div
        className={cn(
          "absolute right-12 h-10 w-20 rounded-full",
          sceneMode === "sky" ? "top-12 opacity-45" : "top-14 opacity-60"
        )}
        style={{ backgroundColor: preset.cloud }}
      />
    </motion.div>
  );
}
