import { addDays, getDay, isSameDay, startOfDay } from 'date-fns';
import { NIGERIAN_HOLIDAYS_SEED } from './holidays';

/**
 * Checks if a given date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
  const dow = getDay(date);
  return dow === 0 || dow === 6; // 0 is Sunday, 6 is Saturday
}

/**
 * Checks if a given date is a seeded Nigerian holiday
 * (For client-side/fast checking)
 */
export function checkIsNigerianHoliday(date: Date): boolean {
  const d = startOfDay(date);
  return NIGERIAN_HOLIDAYS_SEED.some((h) => isSameDay(d, startOfDay(new Date(h.date))));
}

/**
 * Calculates the end date by adding a specific number of working weeks,
 * skipping weekends and Nigerian public holidays.
 */
export function calculateEndDate(startDate: Date, weeksCount: number): Date {
  let workingDaysAdded = 0;
  let current = new Date(startDate);
  const totalWorkingDays = weeksCount * 5;

  while (workingDaysAdded < totalWorkingDays - 1) {
    current = addDays(current, 1);
    
    const weekend = isWeekend(current);
    const holiday = checkIsNigerianHoliday(current);
    
    if (!weekend && !holiday) {
      workingDaysAdded++;
    }
  }
  
  return current;
}

/**
 * Gets the week number relative to the start date
 */
export function getWeekNumber(date: Date, startDate: Date): number {
  let workingDays = 0;
  let current = startOfDay(startDate);
  const target = startOfDay(date);
  
  if (target < current) return 1;

  while (current < target) {
    if (!isWeekend(current) && !checkIsNigerianHoliday(current)) {
      workingDays++;
    }
    current = addDays(current, 1);
  }
  
  return Math.floor(workingDays / 5) + 1;
}

/**
 * Gets the total count of working days between two dates
 */
export function countWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0;
  let current = startOfDay(startDate);
  const target = startOfDay(endDate);

  while (current <= target) {
    if (!isWeekend(current) && !checkIsNigerianHoliday(current)) {
      count++;
    }
    current = addDays(current, 1);
  }

  return count;
}
