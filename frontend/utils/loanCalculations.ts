/**
 * Dynamic Loan Repayment Calculation System
 *
 * This system handles:
 * - Dynamic loan term adjustments based on repayments
 * - Automatic due date recalculations
 * - Flexible repayment calculations
 * - Term unit conversions (daily, weekly, monthly)
 */

export interface LoanCalculation {
  termUnit: "DAY" | "WEEK" | "MONTH";
  dailyPayment: number;
  weeklyPayment: number;
  monthlyPayment: number;
  totalAmount: number;
  totalDays: number;
  totalWeeks: number;
  totalMonths: number;
}

export interface LoanRepayment {
  id: string;
  loanId: string;
  amount: number;
  paymentDate: Date;
  remainingAmount: number;
  remainingDays: number;
  newDueDate: Date;
  adjustedDailyPayment: number;
}

export interface LoanTermAdjustment {
  originalTerm: number;
  adjustedTerm: number;
  termUnit: "DAY" | "WEEK" | "MONTH";
  adjustmentReason: string;
  newDueDate: Date;
}

/**
 * Calculate initial loan payments based on loan type and amount
 */
export function calculateInitialLoanPayments(
  amount: number,
  maxTerm: number,
  termUnit: "DAY" | "WEEK" | "MONTH"
): LoanCalculation {
  let dailyPayment = 0;
  let weeklyPayment = 0;
  let monthlyPayment = 0;
  let totalDays = 0;
  let totalWeeks = 0;
  let totalMonths = 0;

  switch (termUnit) {
    case "DAY":
      dailyPayment = amount / maxTerm;
      weeklyPayment = dailyPayment * 7;
      monthlyPayment = dailyPayment * 30;
      totalDays = maxTerm;
      totalWeeks = Math.ceil(maxTerm / 7);
      totalMonths = Math.ceil(maxTerm / 30);
      break;
    case "WEEK":
      weeklyPayment = amount / maxTerm;
      dailyPayment = weeklyPayment / 7;
      monthlyPayment = weeklyPayment * 4;
      totalDays = maxTerm * 7;
      totalWeeks = maxTerm;
      totalMonths = Math.ceil(maxTerm / 4);
      break;
    case "MONTH":
      monthlyPayment = amount / maxTerm;
      dailyPayment = monthlyPayment / 30;
      weeklyPayment = monthlyPayment / 4;
      totalDays = maxTerm * 30;
      totalWeeks = maxTerm * 4;
      totalMonths = maxTerm;
      break;
  }

  return {
    termUnit,
    dailyPayment: Math.round(dailyPayment * 100) / 100,
    weeklyPayment: Math.round(weeklyPayment * 100) / 100,
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalAmount: amount,
    totalDays,
    totalWeeks,
    totalMonths,
  };
}

/**
 * Calculate adjusted loan terms after a partial repayment
 */
export function calculateAdjustedLoanTerms(
  originalAmount: number,
  remainingAmount: number,
  originalTerm: number,
  termUnit: "DAY" | "WEEK" | "MONTH",
  paymentDate: Date,
  originalDueDate: Date
): LoanTermAdjustment {
  const daysElapsed = Math.floor(
    (paymentDate.getTime() -
      new Date(
        originalDueDate.getTime() -
          originalTerm * getDaysPerTerm(termUnit) * 24 * 60 * 60 * 1000
      ).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const remainingDays = Math.floor(
    (originalDueDate.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate new daily payment based on remaining amount and days
  const newDailyPayment = remainingAmount / remainingDays;

  // Calculate adjusted term based on remaining amount and original term structure
  let adjustedTerm = 0;
  let adjustmentReason = "";

  switch (termUnit) {
    case "DAY":
      adjustedTerm = Math.ceil(
        remainingAmount / (originalAmount / originalTerm)
      );
      adjustmentReason = `Adjusted from ${originalTerm} days to ${adjustedTerm} days based on remaining amount`;
      break;
    case "WEEK":
      const remainingWeeks = Math.ceil(remainingDays / 7);
      adjustedTerm = Math.ceil(
        remainingAmount / (originalAmount / originalTerm)
      );
      adjustmentReason = `Adjusted from ${originalTerm} weeks to ${adjustedTerm} weeks based on remaining amount`;
      break;
    case "MONTH":
      const remainingMonths = Math.ceil(remainingDays / 30);
      adjustedTerm = Math.ceil(
        remainingAmount / (originalAmount / originalTerm)
      );
      adjustmentReason = `Adjusted from ${originalTerm} months to ${adjustedTerm} months based on remaining amount`;
      break;
  }

  // Calculate new due date
  const newDueDate = new Date(paymentDate);
  newDueDate.setDate(newDueDate.getDate() + remainingDays);

  return {
    originalTerm,
    adjustedTerm,
    termUnit,
    adjustmentReason,
    newDueDate,
  };
}

/**
 * Calculate dynamic repayment schedule
 */
export function calculateDynamicRepaymentSchedule(
  loanAmount: number,
  termUnit: "DAY" | "WEEK" | "MONTH",
  maxTerm: number,
  startDate: Date
): Array<{
  paymentNumber: number;
  dueDate: Date;
  amount: number;
  cumulativeAmount: number;
  remainingAmount: number;
}> {
  const schedule = [];
  const daysPerTerm = getDaysPerTerm(termUnit);
  const paymentAmount = loanAmount / maxTerm;

  for (let i = 1; i <= maxTerm; i++) {
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + i * daysPerTerm);

    const cumulativeAmount = paymentAmount * i;
    const remainingAmount = Math.max(0, loanAmount - cumulativeAmount);

    schedule.push({
      paymentNumber: i,
      dueDate,
      amount: Math.round(paymentAmount * 100) / 100,
      cumulativeAmount: Math.round(cumulativeAmount * 100) / 100,
      remainingAmount: Math.round(remainingAmount * 100) / 100,
    });
  }

  return schedule;
}

/**
 * Calculate flexible repayment after partial payment
 */
export function calculateFlexibleRepayment(
  originalAmount: number,
  paidAmount: number,
  remainingAmount: number,
  originalTerm: number,
  termUnit: "DAY" | "WEEK" | "MONTH",
  paymentDate: Date,
  originalDueDate: Date
): {
  newDailyPayment: number;
  newWeeklyPayment: number;
  newMonthlyPayment: number;
  remainingDays: number;
  newDueDate: Date;
  adjustment: LoanTermAdjustment;
} {
  const remainingDays = Math.max(
    1,
    Math.floor(
      (originalDueDate.getTime() - paymentDate.getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  const newDailyPayment = remainingAmount / remainingDays;
  const newWeeklyPayment = newDailyPayment * 7;
  const newMonthlyPayment = newDailyPayment * 30;

  const newDueDate = new Date(paymentDate);
  newDueDate.setDate(newDueDate.getDate() + remainingDays);

  const adjustment = calculateAdjustedLoanTerms(
    originalAmount,
    remainingAmount,
    originalTerm,
    termUnit,
    paymentDate,
    originalDueDate
  );

  return {
    newDailyPayment: Math.round(newDailyPayment * 100) / 100,
    newWeeklyPayment: Math.round(newWeeklyPayment * 100) / 100,
    newMonthlyPayment: Math.round(newMonthlyPayment * 100) / 100,
    remainingDays,
    newDueDate,
    adjustment,
  };
}

/**
 * Get days per term unit
 */
function getDaysPerTerm(termUnit: "DAY" | "WEEK" | "MONTH"): number {
  switch (termUnit) {
    case "DAY":
      return 1;
    case "WEEK":
      return 7;
    case "MONTH":
      return 30;
    default:
      return 1;
  }
}

/**
 * Convert between term units
 */
export function convertTermUnits(
  value: number,
  fromUnit: "DAY" | "WEEK" | "MONTH",
  toUnit: "DAY" | "WEEK" | "MONTH"
): number {
  const fromDays = value * getDaysPerTerm(fromUnit);
  return fromDays / getDaysPerTerm(toUnit);
}

/**
 * Calculate loan extension
 */
export function calculateLoanExtension(
  currentAmount: number,
  extensionAmount: number,
  currentTerm: number,
  termUnit: "DAY" | "WEEK" | "MONTH",
  maxExtensionTerms: number = 3
): {
  newAmount: number;
  newTerm: number;
  extensionTerms: number;
  newDailyPayment: number;
} {
  const newAmount = currentAmount + extensionAmount;
  const extensionTerms = Math.min(
    maxExtensionTerms,
    Math.ceil(extensionAmount / (currentAmount / currentTerm))
  );
  const newTerm = currentTerm + extensionTerms;

  const newDailyPayment = newAmount / (newTerm * getDaysPerTerm(termUnit));

  return {
    newAmount,
    newTerm,
    extensionTerms,
    newDailyPayment: Math.round(newDailyPayment * 100) / 100,
  };
}

/**
 * Validate loan term constraints
 */
export function validateLoanTerms(
  termUnit: "DAY" | "WEEK" | "MONTH",
  minTerm: number,
  maxTerm: number
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (minTerm < 1) {
    errors.push("Minimum term must be at least 1");
  }

  if (maxTerm < minTerm) {
    errors.push("Maximum term must be greater than or equal to minimum term");
  }

  switch (termUnit) {
    case "DAY":
      if (maxTerm > 365) {
        errors.push("Maximum daily term cannot exceed 365 days");
      }
      break;
    case "WEEK":
      if (maxTerm > 52) {
        errors.push("Maximum weekly term cannot exceed 52 weeks");
      }
      break;
    case "MONTH":
      if (maxTerm > 12) {
        errors.push("Maximum monthly term cannot exceed 12 months");
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
