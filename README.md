# Life - Personal Health Tracker

A personal health tracking portal built with Next.js, Convex, and Clerk. Track your nutrition, exercise, and hydration with a clean, elegant interface inspired by warm parchment aesthetics.

## Features

- **Food Tracking**: Log meals with detailed nutrition (calories, protein, carbs, fat, fiber)
- **Exercise Tracking**: Record workouts with sets, reps, weights, and muscle groups
- **Hydration Tracking**: Monitor water and beverage intake with quick-add buttons
- **Goals**: Set daily targets and track progress
- **Favorites**: Save frequently used foods and exercises for quick access
- **OpenClaw API**: Access your data via API for AI assistant integration

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS 4
- **Backend**: Convex (real-time database)
- **Auth**: Clerk
- **Styling**: shadcn/ui-style components with strummm theme

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Clerk

1. Create an account at [clerk.com](https://clerk.com)
2. Create a new application
3. Copy your API keys

### 3. Set up Convex

1. Run `npx convex dev` and follow the prompts to create a project
2. This will create a `.env.local` file with your Convex URL

### 4. Configure environment variables

Create a `.env.local` file:

```bash
# Convex (auto-populated by npx convex dev)
NEXT_PUBLIC_CONVEX_URL=your_convex_url

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### 5. Run development server

```bash
npm run dev
```

This runs both Next.js and Convex dev servers in parallel.

## API for OpenClaw

Create an API key in Settings, then access your data:

```
GET /api/v1/data?key=YOUR_KEY&format=json
GET /api/v1/data?key=YOUR_KEY&format=markdown&days=7
```

The markdown format is perfect for feeding to AI assistants like OpenClaw.

## Deployment

### Vercel + Convex

1. Deploy Convex: `npx convex deploy`
2. Push to GitHub
3. Import to Vercel
4. Add environment variables in Vercel dashboard
5. Configure custom domain: `life.hejamadi.com`

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Sign-in, sign-up pages
│   ├── (dashboard)/      # Main app pages
│   │   ├── dashboard/    # Overview page
│   │   ├── food/         # Food tracking
│   │   ├── exercise/     # Exercise tracking
│   │   ├── hydration/    # Hydration tracking
│   │   └── settings/     # Goals & API keys
│   └── api/v1/           # OpenClaw API
├── components/
│   ├── providers/        # Clerk + Convex providers
│   └── ui/               # shadcn-style components
└── lib/
    └── utils.ts          # Utility functions

convex/
├── schema.ts             # Database schema
├── foods.ts              # Food queries/mutations
├── exercises.ts          # Exercise queries/mutations
├── hydration.ts          # Hydration queries/mutations
├── goals.ts              # Goals queries/mutations
├── favorites.ts          # Favorites queries/mutations
└── apiKeys.ts            # API key management
```
