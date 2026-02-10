"use client";

import { useUser as useClerkUser } from "@clerk/nextjs";

// Safe hook that works even when Clerk isn't configured
export function useUser() {
  try {
    // Check if we're in a browser and Clerk is configured
    if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      return { user: null, isLoaded: true, isSignedIn: false };
    }
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useClerkUser();
  } catch {
    return { user: null, isLoaded: true, isSignedIn: false };
  }
}
