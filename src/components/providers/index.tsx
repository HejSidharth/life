"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";
import { Toaster } from "sonner";

function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  const convex = useMemo(() => {
    if (!convexUrl) return null;
    return new ConvexReactClient(convexUrl);
  }, [convexUrl]);

  if (!convex) {
    // Convex not configured - render children without Convex provider
    return <>{children}</>;
  }

  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const toaster = (
    <Toaster
      position="top-center"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "rounded-2xl border border-[#d5c6ad] bg-[#fff9ef] text-[#5b4634] shadow-sm",
          title: "font-semibold text-sm",
          description: "text-xs text-[#7a6047]",
          closeButton:
            "border border-[#d5c6ad] bg-[#fff3de] text-[#7a6047] hover:bg-[#fbe9cc]",
        },
      }}
    />
  );

  // If Clerk is not configured, render without it (for initial setup)
  if (!clerkKey) {
    return (
      <>
        {children}
        {toaster}
      </>
    );
  }

  return (
    <ClerkProvider
      publishableKey={clerkKey}
      appearance={{
        variables: {
          colorPrimary: "hsl(var(--primary))",
          colorBackground: "hsl(var(--background))",
          colorInputBackground: "hsl(var(--secondary))",
          colorInputText: "hsl(var(--foreground))",
        },
      }}
    >
      <ConvexClientProvider>
        {children}
        {toaster}
      </ConvexClientProvider>
    </ClerkProvider>
  );
}
