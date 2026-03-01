import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parses a date string into a Date object anchored at noon UTC.
 * Date-only strings like "2026-03-01" are normally parsed as UTC midnight,
 * which lands on the previous calendar day in timezones behind UTC.
 * Using noon UTC keeps the same calendar date in all practical timezones.
 */
export function parseDateOnly(dateStr: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + "T12:00:00.000Z");
  }
  return new Date(dateStr);
}
