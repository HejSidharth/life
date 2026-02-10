"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useMemo, useCallback } from "react";
import { parseDateFromUrl, formatDateForUrl, getDayBounds, transposeTimeToDate } from "@/lib/date-utils";
import { isToday as isTodayDate } from "date-fns";

export function useActiveDate() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const selectedDate = useMemo(() => {
    const dateParam = searchParams.get("date");
    return parseDateFromUrl(dateParam);
  }, [searchParams]);

  const isToday = useMemo(() => isTodayDate(selectedDate), [selectedDate]);

  const setDate = useCallback((date: Date) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", formatDateForUrl(date));
    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams]);

  const getBounds = useCallback(() => {
    return getDayBounds(selectedDate);
  }, [selectedDate]);

  const getLogTimestamp = useCallback(() => {
    if (isToday) return Date.now();
    return transposeTimeToDate(selectedDate);
  }, [isToday, selectedDate]);

  return {
    selectedDate,
    isToday,
    setDate,
    getBounds,
    getLogTimestamp,
  };
}
