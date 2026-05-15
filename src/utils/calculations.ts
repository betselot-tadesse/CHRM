import { differenceInDays, differenceInYears, startOfDay } from "date-fns";

export function calculateGratuity(hireDate: string, basicSalaryPerMonth: number, terminationDate: string = new Date().toISOString()): number {
  const start = new Date(hireDate);
  const end = new Date(terminationDate);

  const totalDays = differenceInDays(end, start);
  const totalYears = totalDays / 365.25;

  if (totalYears < 1) return 0;

  const dayRate = basicSalaryPerMonth / 30;
  let gratuity = 0;

  if (totalYears <= 5) {
    gratuity = totalYears * 21 * dayRate;
  } else {
    gratuity = 5 * 21 * dayRate;
    const remainingYears = totalYears - 5;
    gratuity += remainingYears * 30 * dayRate;
  }

  return Math.round(gratuity * 100) / 100;
}

export function calculateLeaveBalance(hireDate: string, usedDays: number): number {
  const start = new Date(hireDate);
  const now = new Date();
  const yearsWorked = differenceInYears(now, start);
  
  if (yearsWorked < 1) return 0;
  
  const totalAccrued = yearsWorked * 30;
  return totalAccrued - usedDays;
}

export function checkNearExpiry(expiryDate: string, thresholds?: { critical: number, warning: number, info: number }): { daysLeft: number, status: 'expired' | 'critical' | 'warning' | 'info' | 'ok' } {
  const expiry = new Date(expiryDate);
  const now = startOfDay(new Date());
  
  const daysLeft = differenceInDays(expiry, now);
  
  const thresh = thresholds || { critical: 30, warning: 60, info: 90 };

  if (daysLeft < 0) return { daysLeft, status: 'expired' };
  if (daysLeft <= thresh.critical) return { daysLeft, status: 'critical' };
  if (daysLeft <= thresh.warning) return { daysLeft, status: 'warning' };
  if (daysLeft <= thresh.info) return { daysLeft, status: 'info' };
  
  return { daysLeft, status: 'ok' };
}
