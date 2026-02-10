"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";

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

  // If Clerk is not configured, render without it (for initial setup)
  if (!clerkKey) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      publishableKey={clerkKey}
      appearance={{
        variables: {
          colorPrimary: "hsl(25, 35%, 22%)",
          colorBackground: "hsl(38, 48%, 96%)",
          colorInputBackground: "hsl(38, 48%, 96%)",
          colorInputText: "hsl(28, 22%, 18%)",
        },
      }}
    >
      <ConvexClientProvider>{children}</ConvexClientProvider>
    </ClerkProvider>
  );
}
