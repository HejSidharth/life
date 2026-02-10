import { NextRequest, NextResponse } from "next/server";

// Helper to get date range
function getDateRange(days: number) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  return { startDate: start.getTime(), endDate: end.getTime() };
}

// Format data as markdown for OpenClaw
function formatAsMarkdown(data: {
  foods: unknown[];
  exercises: unknown[];
  hydration: unknown[];
  days: number;
}): string {
  const { foods, exercises, hydration, days } = data;
  
  let md = `# Health Data (Last ${days} Days)\n\n`;
  md += `Generated: ${new Date().toISOString()}\n\n`;

  // Nutrition summary
  md += `## Nutrition\n\n`;
  if ((foods as Array<{ calories: number; protein: number; carbs: number; fat: number }>).length === 0) {
    md += `No food entries recorded.\n\n`;
  } else {
    const totals = (foods as Array<{ calories: number; protein: number; carbs: number; fat: number }>).reduce(
      (acc, f) => ({
        calories: acc.calories + f.calories,
        protein: acc.protein + f.protein,
        carbs: acc.carbs + f.carbs,
        fat: acc.fat + f.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    md += `- Total Calories: ${totals.calories} kcal\n`;
    md += `- Total Protein: ${totals.protein}g\n`;
    md += `- Total Carbs: ${totals.carbs}g\n`;
    md += `- Total Fat: ${totals.fat}g\n`;
    md += `- Meals Logged: ${foods.length}\n\n`;
  }

  // Exercise summary
  md += `## Exercise\n\n`;
  if ((exercises as unknown[]).length === 0) {
    md += `No exercise entries recorded.\n\n`;
  } else {
    const totalMinutes = (exercises as Array<{ duration?: number }>).reduce((acc, e) => acc + (e.duration || 0), 0);
    md += `- Total Duration: ${totalMinutes} minutes\n`;
    md += `- Workouts Logged: ${exercises.length}\n\n`;
  }

  // Hydration summary
  md += `## Hydration\n\n`;
  if ((hydration as unknown[]).length === 0) {
    md += `No hydration entries recorded.\n\n`;
  } else {
    const totalMl = (hydration as Array<{ amount: number }>).reduce((acc, h) => acc + h.amount, 0);
    md += `- Total Intake: ${(totalMl / 1000).toFixed(1)}L\n`;
    md += `- Entries Logged: ${hydration.length}\n\n`;
  }

  return md;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  const format = searchParams.get("format") || "json";
  const days = parseInt(searchParams.get("days") || "7");

  // Check if Convex is configured
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return NextResponse.json(
      { 
        error: "Convex not configured",
        setup: "Run 'npx convex dev' to initialize Convex, then add NEXT_PUBLIC_CONVEX_URL to your .env.local"
      },
      { status: 503 }
    );
  }

  if (!key) {
    return NextResponse.json(
      { error: "Missing API key. Provide ?key=your_api_key" },
      { status: 401 }
    );
  }

  // For now, return a placeholder response until Convex is fully connected
  // In production, this would validate the API key and fetch real data
  const { startDate, endDate } = getDateRange(days);

  const foods: unknown[] = [];
  const exercises: unknown[] = [];
  const hydration: unknown[] = [];

  const data = { foods, exercises, hydration, days };

  if (format === "markdown") {
    const markdown = formatAsMarkdown(data);
    return new NextResponse(markdown, {
      headers: { "Content-Type": "text/markdown" },
    });
  }

  return NextResponse.json({
    message: "API is ready. Create an API key in Settings to access your data.",
    period: { startDate, endDate, days },
    foods,
    exercises,
    hydration,
    summary: {
      nutrition: {
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        mealsLogged: 0,
      },
      exercise: {
        totalMinutes: 0,
        workoutsLogged: 0,
      },
      hydration: {
        totalMl: 0,
        entriesLogged: 0,
      },
    },
  });
}
