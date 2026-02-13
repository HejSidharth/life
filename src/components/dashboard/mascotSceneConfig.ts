import type { MascotVariant } from "@/components/ui/Mascot";

export type SceneKey = "dashboard" | "food" | "hydration" | "exercise" | "settings";
export type SceneStyle = "park" | "cafe" | "waterfront" | "gym" | "studio";

export interface ScenePreset {
  style: SceneStyle;
  mascot: MascotVariant;
  sky: string;
  ground: string;
  accentA: string;
  accentB: string;
  accentC: string;
  cloud: string;
}

export const SCENE_PRESETS: Record<SceneKey, ScenePreset> = {
  dashboard: {
    style: "park",
    mascot: "wave",
    sky: "linear-gradient(180deg, #1b458f 0%, #4f8cf1 58%, #94c9ff 100%)",
    ground: "#8bcf67",
    accentA: "#74bb5f",
    accentB: "#f2d72f",
    accentC: "#9de193",
    cloud: "#f5f2e9",
  },
  food: {
    style: "cafe",
    mascot: "food",
    sky: "linear-gradient(180deg, #233b70 0%, #5079c9 55%, #8fb4f0 100%)",
    ground: "#ffe6a8",
    accentA: "#ffcc71",
    accentB: "#fff3dd",
    accentC: "#f07b4d",
    cloud: "#f7f2e4",
  },
  hydration: {
    style: "waterfront",
    mascot: "hydration",
    sky: "linear-gradient(180deg, #17588e 0%, #3ca7e8 52%, #99e6ff 100%)",
    ground: "#6fd9cf",
    accentA: "#3cb4e5",
    accentB: "#c8f4ff",
    accentC: "#f7e7b0",
    cloud: "#eaf7ff",
  },
  exercise: {
    style: "gym",
    mascot: "workout",
    sky: "linear-gradient(180deg, #223f7f 0%, #547ed6 52%, #9eb7eb 100%)",
    ground: "#8ec07a",
    accentA: "#2f3648",
    accentB: "#55627d",
    accentC: "#e7eefb",
    cloud: "#ece8ff",
  },
  settings: {
    style: "studio",
    mascot: "wave",
    sky: "linear-gradient(180deg, #2d4779 0%, #5f7ca6 52%, #9fb6cb 100%)",
    ground: "#c9d8ad",
    accentA: "#f4efe2",
    accentB: "#ccb98f",
    accentC: "#9e7f5f",
    cloud: "#efe9d7",
  },
};
