"use client";

import { motion } from "framer-motion";

interface MainFoxMascotProps {
  className?: string;
}

export function MainFoxMascot({ className }: MainFoxMascotProps) {
  return (
    <motion.div
      className={`mt-4 ${className}`}
      animate={{
        y: [0, -6, 0],
        transition: {
          duration: 2.6,
          repeat: Infinity,
          ease: "easeInOut",
        },
      }}
    >
      <svg
        viewBox="0 0 300 300"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Penguin mascot"
        className="h-auto w-[230px] max-w-full"
      >
        {/* Shadow */}
        <ellipse cx="150" cy="264" rx="70" ry="12" fill="#00000020" />

        {/* Left foot */}
        <ellipse cx="110" cy="245" rx="22" ry="14" fill="#ff9b2f" />
        {/* Right foot */}
        <ellipse cx="190" cy="245" rx="22" ry="14" fill="#ff9b2f" />

        {/* Left wing (arm) */}
        <ellipse cx="60" cy="160" rx="20" ry="40" fill="#1d2430" transform="rotate(-25 60 160)" />
        <ellipse cx="60" cy="160" rx="15" ry="32" fill="#2a3445" transform="rotate(-25 60 160)" />

        {/* Right wing (arm) */}
        <ellipse cx="240" cy="160" rx="20" ry="40" fill="#1d2430" transform="rotate(25 240 160)" />
        <ellipse cx="240" cy="160" rx="15" ry="32" fill="#2a3445" transform="rotate(25 240 160)" />

        {/* Body - chubby round shape */}
        <ellipse cx="150" cy="160" rx="85" ry="95" fill="#141822" />

        {/* White belly */}
        <ellipse cx="150" cy="175" rx="60" ry="70" fill="#fafbfc" />

        {/* Face area highlight */}
        <ellipse cx="150" cy="105" rx="65" ry="55" fill="#1a2330" />

        {/* Left eye - big chibi style */}
        <circle cx="115" cy="110" r="20" fill="#ffffff" />
        <circle cx="115" cy="110" r="15" fill="#2d3446" />
        <circle cx="119" cy="104" r="6" fill="#ffffff" />
        <circle cx="112" cy="116" r="3" fill="#ffffff" opacity="0.5" />

        {/* Right eye - big chibi style */}
        <circle cx="185" cy="110" r="20" fill="#ffffff" />
        <circle cx="185" cy="110" r="15" fill="#2d3446" />
        <circle cx="189" cy="104" r="6" fill="#ffffff" />
        <circle cx="182" cy="116" r="3" fill="#ffffff" opacity="0.5" />

        {/* Beak - cute and small */}
        <ellipse cx="150" cy="138" rx="14" ry="10" fill="#ff9b2f" />
        <ellipse cx="150" cy="135" rx="10" ry="5" fill="#ffb84d" />

        {/* Smiling mouth */}
        <path d="M140 150 Q150 158 160 150" stroke="#2d3446" strokeWidth="3" strokeLinecap="round" fill="none" />

        {/* Belly button detail */}
        <ellipse cx="150" cy="200" rx="6" ry="8" fill="#e5e7eb" opacity="0.5" />
      </svg>
    </motion.div>
  );
}
