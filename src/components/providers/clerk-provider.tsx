"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ReactNode } from "react";

export function ClerkClientProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "hsl(25, 35%, 22%)",
          colorBackground: "hsl(38, 48%, 96%)",
          colorInputBackground: "hsl(38, 48%, 96%)",
          colorInputText: "hsl(28, 22%, 18%)",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
