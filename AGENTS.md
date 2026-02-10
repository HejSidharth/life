# Agent Guidelines for life.hejamadi.com

## Project Overview
- **Stack**: Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4
- **Backend**: Convex (real-time database)
- **Auth**: Clerk
- **Build Tool**: Turbopack
- **Path Alias**: `@/*` maps to `./src/*`

## Build Commands

```bash
# Development (runs Next.js + Convex concurrently)
npm run dev

# Dev servers separately
npm run dev:next     # Next.js with Turbopack
npm run dev:convex   # Convex dev server

# Production build
npm run build

# Linting
npm run lint                    # Check all files
npx eslint src/path/to/file.tsx # Lint single file

# No test runner configured yet
```

## Code Style Guidelines

### TypeScript
- **Strict mode enabled** - no implicit any
- Use explicit types for function parameters and returns
- Prefer `interface` over `type` for object shapes
- Use `type` for unions and simple aliases

```typescript
// Good
interface User {
  id: string;
  name: string;
}

function formatUser(user: User): string {
  return user.name;
}

// Avoid
function formatUser(user) { ... }  // Missing types
```

### React Components
- Use functional components with explicit props interface
- Add `"use client"` directive for client components
- Use PascalCase for component names and files

```typescript
"use client";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ children, onClick }: ButtonProps) {
  return <button onClick={onClick}>{children}</button>;
}
```

### Styling (Tailwind CSS)
- Use the `cn()` utility from `@/lib/utils` for conditional classes
- Prefer composition over complex class strings
- Follow the warm cream theme (parchment colors)

```typescript
import { cn } from "@/lib/utils";

<button className={cn(
  "px-4 py-2 rounded-md",
  isActive && "bg-primary text-primary-foreground"
)}>
```

### Imports
- Group imports: React → Third-party → Internal (components, types, utils)
- Use `@/` alias for all internal imports

```typescript
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Workout } from "@/types/workout";
```

### Naming Conventions
- **Components**: PascalCase (e.g., `WorkoutCard.tsx`)
- **Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE for true constants
- **Files**: camelCase for utilities, PascalCase for components
- **Props interfaces**: ComponentName + "Props" (e.g., `ButtonProps`)

### Error Handling
- Use early returns for guard clauses
- Prefer explicit error throwing over silent failures
- Use TypeScript's strict null checks

```typescript
// Good
function getUser(id: string): User {
  const user = users.find(u => u.id === id);
  if (!user) {
    throw new Error(`User not found: ${id}`);
  }
  return user;
}
```

### Convex Backend
- All Convex functions go in `/convex/` directory
- Use `.ts` extension for Convex files
- Follow Convex patterns: `query`, `mutation`, `action`
- Use Convex's validator (`v`) for type safety

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getUser = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
```

### State Management
- Prefer React hooks (useState, useReducer) for local state
- Use Convex for server state
- Keep components focused; extract complex logic to hooks

## File Organization
```
/src
  /app           # Next.js App Router pages
  /components    # React components
    /ui          # shadcn/ui-style base components
    /workout     # Domain-specific components
  /lib           # Utilities (cn, formatters)
  /types         # Shared TypeScript types
/convex          # Backend functions
```

## Environment Setup
Copy `.env.example` to `.env.local` and add your keys:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CONVEX_DEPLOYMENT`

Run `npx convex dev` to initialize Convex types.

## Design Principles
- **No gradients** - flat, warm cream/parchment aesthetic
- **Minimal icons** - text-first UI
- **Clean and elegant** - lots of whitespace
- **Dark mode support** - test both themes
