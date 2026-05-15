import { differenceInDays, differenceInMonths, differenceInYears, addYears, isAfter, startOfDay } from "date-fns";

/**
 * Calculates UAE Gratuity based on latest labor law.
 * Formula:
 * - < 1 year: 0
 * - 1-5 years: 21 days basic salary per year
 * - > 5 years: 30 days per year for period above 5 years + (21 days for first 5 years)
 */
export function calculateGratuity(hireDate: string, basicSalaryPerMonth: number, terminationDate: string = new Date().toISOString()): number {
  const start = new Date(hireDate);
  const end = new Date(terminationDate);

  const totalDays = differenceInDays(end, start);
  const totalYears = totalDays / 365.25;

  if (totalYears < 1) return 0;

  const dayRate = basicSalaryPerMonth / 30; // Assuming 30 days month for simplicity in HR systems
  let gratuity = 0;

  if (totalYears <= 5) {
    gratuity = totalYears * 21 * dayRate;
  } else {
    // First 5 years at 21 days
    gratuity = 5 * 21 * dayRate;
    // Remaining years at 30 days
    const remainingYears = totalYears - 5;
    gratuity += remainingYears * 30 * dayRate;
  }

  return Math.round(gratuity * 100) / 100;
}

/**
 * Calculates current leave balance based on hire date and used days.
 * 30 days per year accrual starting after 1 year.
 */
export function calculateLeaveBalance(hireDate: string, usedDays: number): number {
  const start = new Date(hireDate);
  const now = new Date();
  
  const yearsWorked = differenceInYears(now, start);
  
  if (yearsWorked < 1) return 0;
  
  // Accrual starts after 1 year
  // Let's assume they get 30 days for each COMPLETED year after the first year?
  // Or pro-rated? Prompt: "annual leave accrual (30 days/year after 1 year)"
  // I'll assume they start earning 30 days/year AFTER completing the first year.
  
  const accrualYears = yearsWorked; // If we count from day 1 but only visible after 1 year?
  // Usually it accrues from day 1 but you can only take it after 6 months (pro-rata) or 1 year.
  // I'll implement: 30 days * total years worked (if >= 1 year).
  
  const totalAccrued = yearsWorked * 30;
  return totalAccrued - usedDays;
}

export function checkNearExpiry(expiryDate: string, thresholds?: { critical: number, warning: number, info: number }): { daysLeft: number, status: 'expired' | 'critical' | 'warning' | 'info' | 'ok' } {
  const expiry = new Date(expiryDate);
  const now = startOfDay(new Date());
  
  const daysLeft = differenceInDays(expiry, now);
  
  const limits = thresholds || { critical: 30, warning: 60, info: 90 };
  
  if (daysLeft < 0) return { daysLeft, status: 'expired' };
  if (daysLeft <= limits.critical) return { daysLeft, status: 'critical' };
  if (daysLeft <= limits.warning) return { daysLeft, status: 'warning' };
  if (daysLeft <= limits.info) return { daysLeft, status: 'info' };
  
  return { daysLeft, status: 'ok' };
}
