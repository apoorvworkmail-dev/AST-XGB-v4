/**
 * Real Estate Financial Calculation Engine
 * AST-XGB Real Estate Platform (GharDhundo)
 *
 * Implements validated, reproducible, formula-driven financial calculators:
 * 1. Home Loan EMI & Amortization
 * 2. Loan Eligibility (FOIR-based)
 * 3. Down-Payment & Closing Costs
 * 4. Buy-vs-Rent Net Worth Simulation
 * 5. Investment ROI & Rental Yield
 */

export interface EmiCalculationResult {
  monthlyEmi: number;
  principalAmount: number;
  totalInterest: number;
  totalPayment: number;
  totalMonths: number;
  amortizationSchedule: Array<{
    year: number;
    principalPaid: number;
    interestPaid: number;
    endingBalance: number;
  }>;
}

/**
 * Standard Home Loan EMI Amortization Formula
 * Formula: EMI = [P * r * (1 + r)^n] / [(1 + r)^n - 1]
 * Handles r = 0 gracefully (EMI = P / n)
 */
export function calculateHomeLoanEmi(
  principal: number,
  annualInterestRate: number,
  tenureYears: number
): EmiCalculationResult {
  const safePrincipal = Math.max(0, principal || 0);
  const safeTenureYears = Math.max(1, Math.min(40, tenureYears || 20));
  const totalMonths = safeTenureYears * 12;

  // Zero interest rate edge case
  if (!annualInterestRate || annualInterestRate <= 0) {
    const monthlyEmi = safePrincipal / totalMonths;
    return {
      monthlyEmi: Math.round(monthlyEmi),
      principalAmount: safePrincipal,
      totalInterest: 0,
      totalPayment: safePrincipal,
      totalMonths,
      amortizationSchedule: Array.from({ length: safeTenureYears }, (_, i) => ({
        year: i + 1,
        principalPaid: Math.round(safePrincipal / safeTenureYears),
        interestPaid: 0,
        endingBalance: Math.max(0, Math.round(safePrincipal - ((i + 1) * safePrincipal) / safeTenureYears)),
      })),
    };
  }

  const monthlyRate = annualInterestRate / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, totalMonths);
  const monthlyEmi = (safePrincipal * monthlyRate * factor) / (factor - 1);
  const totalPayment = monthlyEmi * totalMonths;
  const totalInterest = totalPayment - safePrincipal;

  // Generate Yearly Amortization Schedule
  let currentBalance = safePrincipal;
  const schedule: Array<{ year: number; principalPaid: number; interestPaid: number; endingBalance: number }> = [];

  for (let y = 1; y <= safeTenureYears; y++) {
    let yearPrincipal = 0;
    let yearInterest = 0;

    for (let m = 1; m <= 12; m++) {
      const monthInterest = currentBalance * monthlyRate;
      const monthPrincipal = monthlyEmi - monthInterest;
      yearInterest += monthInterest;
      yearPrincipal += monthPrincipal;
      currentBalance = Math.max(0, currentBalance - monthPrincipal);
    }

    schedule.push({
      year: y,
      principalPaid: Math.round(yearPrincipal),
      interestPaid: Math.round(yearInterest),
      endingBalance: Math.round(currentBalance),
    });
  }

  return {
    monthlyEmi: Math.round(monthlyEmi),
    principalAmount: safePrincipal,
    totalInterest: Math.round(totalInterest),
    totalPayment: Math.round(totalPayment),
    totalMonths,
    amortizationSchedule: schedule,
  };
}

export interface EligibilityResult {
  maxAllowableEmi: number;
  maxLoanAmount: number;
  indicativeHomeBudget: number; // Assuming 80% LTV
  foirPct: number;
  availableMonthlyIncome: number;
}

/**
 * Bank Loan Eligibility Estimator based on Fixed Obligation to Income Ratio (FOIR)
 * Inverted EMI: P = [EMI * ((1 + r)^n - 1)] / [r * (1 + r)^n]
 */
export function calculateLoanEligibility(
  netMonthlyIncome: number,
  existingMonthlyEmis: number,
  tenureYears: number,
  annualInterestRate: number,
  foirPct = 50
): EligibilityResult {
  const safeIncome = Math.max(0, netMonthlyIncome || 0);
  const safeExistingEmis = Math.max(0, existingMonthlyEmis || 0);
  const safeTenureYears = Math.max(1, Math.min(40, tenureYears || 20));
  const totalMonths = safeTenureYears * 12;

  const totalMaxObligation = (safeIncome * foirPct) / 100;
  const maxAllowableEmi = Math.max(0, totalMaxObligation - safeExistingEmis);

  let maxLoanAmount = 0;
  if (annualInterestRate > 0) {
    const monthlyRate = annualInterestRate / 12 / 100;
    const factor = Math.pow(1 + monthlyRate, totalMonths);
    maxLoanAmount = (maxAllowableEmi * (factor - 1)) / (monthlyRate * factor);
  } else {
    maxLoanAmount = maxAllowableEmi * totalMonths;
  }

  // Assuming 80% LTV (20% Down-Payment)
  const indicativeHomeBudget = maxLoanAmount / 0.8;

  return {
    maxAllowableEmi: Math.round(maxAllowableEmi),
    maxLoanAmount: Math.round(maxLoanAmount),
    indicativeHomeBudget: Math.round(indicativeHomeBudget),
    foirPct,
    availableMonthlyIncome: safeIncome - safeExistingEmis,
  };
}

export interface DownPaymentResult {
  downPaymentAmount: number;
  stampDutyAmount: number;
  registrationAmount: number;
  legalProcessingAmount: number;
  renovationContingency: number;
  totalUpfrontCashRequired: number;
  loanAmountRequired: number;
  downPaymentPct: number;
  stampDutyPct: number;
}

/**
 * Down-Payment and Upfront Closing Costs Calculator
 */
export function calculateDownPayment(
  propertyPrice: number,
  downPaymentPct = 20,
  stampDutyPct = 5.6,
  registrationPct = 1.0,
  legalFees = 45000,
  renovationBufferPct = 3.0
): DownPaymentResult {
  const safePrice = Math.max(0, propertyPrice || 0);
  const dpAmount = (safePrice * downPaymentPct) / 100;
  const stampDutyAmount = (safePrice * stampDutyPct) / 100;
  const regAmount = (safePrice * registrationPct) / 100;
  const renoAmount = (safePrice * renovationBufferPct) / 100;

  const totalUpfront = dpAmount + stampDutyAmount + regAmount + legalFees + renoAmount;
  const loanRequired = Math.max(0, safePrice - dpAmount);

  return {
    downPaymentAmount: Math.round(dpAmount),
    stampDutyAmount: Math.round(stampDutyAmount),
    registrationAmount: Math.round(regAmount),
    legalProcessingAmount: Math.round(legalFees),
    renovationContingency: Math.round(renoAmount),
    totalUpfrontCashRequired: Math.round(totalUpfront),
    loanAmountRequired: Math.round(loanRequired),
    downPaymentPct,
    stampDutyPct,
  };
}

export interface BuyVsRentSimulationYear {
  year: number;
  buyingCumulativeCost: number;
  rentingCumulativeCost: number;
  buyingNetWorth: number;
  rentingNetWorth: number;
  propertyValue: number;
  remainingLoan: number;
  rentAnnual: number;
}

export interface BuyVsRentResult {
  breakEvenYear: number | null;
  buyingNetWorthFinal: number;
  rentingNetWorthFinal: number;
  netAdvantageAmount: number;
  winningScenario: 'Buying' | 'Renting';
  yearlyBreakdown: BuyVsRentSimulationYear[];
  holdingPeriodYears: number;
}

/**
 * Buy Versus Rent Cumulative Net Worth Simulation
 */
export function calculateBuyVsRent(params: {
  monthlyRent: number;
  annualRentGrowthPct: number;
  purchasePrice: number;
  downPaymentPct: number;
  homeLoanInterestRate: number;
  loanTenureYears: number;
  monthlyMaintenance: number;
  transactionCostPct: number;
  propertyAppreciationPct: number;
  investmentReturnPct: number;
  holdingPeriodYears: number;
}): BuyVsRentResult {
  const {
    monthlyRent,
    annualRentGrowthPct,
    purchasePrice,
    downPaymentPct,
    homeLoanInterestRate,
    loanTenureYears,
    monthlyMaintenance,
    transactionCostPct,
    propertyAppreciationPct,
    investmentReturnPct,
    holdingPeriodYears,
  } = params;

  // Upfront Buying Costs
  const downPayment = (purchasePrice * downPaymentPct) / 100;
  const transactionCosts = (purchasePrice * transactionCostPct) / 100;
  const initialBuyingOutflow = downPayment + transactionCosts;
  const loanPrincipal = purchasePrice - downPayment;

  // EMI
  const emiCalc = calculateHomeLoanEmi(loanPrincipal, homeLoanInterestRate, loanTenureYears);
  const annualEmi = emiCalc.monthlyEmi * 12;

  // Renting Initial Portfolio (Invest the down payment + transaction costs)
  let renterPortfolio = initialBuyingOutflow;

  let buyerCumulativeCost = initialBuyingOutflow;
  let renterCumulativeCost = 0;
  let currentRentMonthly = monthlyRent;
  let currentMaintenanceMonthly = monthlyMaintenance;
  let remainingLoanBalance = loanPrincipal;

  const monthlyRate = homeLoanInterestRate / 12 / 100;
  const yearlyBreakdown: BuyVsRentSimulationYear[] = [];
  let breakEvenYear: number | null = null;

  for (let y = 1; y <= holdingPeriodYears; y++) {
    // 1. Renting for year y
    const annualRent = currentRentMonthly * 12;
    renterCumulativeCost += annualRent;

    // 2. Buying costs for year y
    const annualMaintenance = currentMaintenanceMonthly * 12;
    const annualBuyingPayment = annualEmi + annualMaintenance;
    buyerCumulativeCost += annualBuyingPayment;

    // 3. Property Appreciation
    const propertyValue = purchasePrice * Math.pow(1 + propertyAppreciationPct / 100, y);

    // 4. Update Remaining Loan Balance
    for (let m = 1; m <= 12; m++) {
      if (remainingLoanBalance > 0) {
        const intPayment = remainingLoanBalance * monthlyRate;
        const princPayment = emiCalc.monthlyEmi - intPayment;
        remainingLoanBalance = Math.max(0, remainingLoanBalance - princPayment);
      }
    }

    // 5. Buyer Net Worth = Property Value - Remaining Loan
    const buyerNetWorth = propertyValue - remainingLoanBalance;

    // 6. Renter Cashflow Difference & Portfolio Growth
    // If buying cost > renting cost, renter invests the difference!
    const annualCashflowDifference = annualBuyingPayment - annualRent;
    renterPortfolio = renterPortfolio * (1 + investmentReturnPct / 100) + annualCashflowDifference;
    const renterNetWorth = Math.max(0, renterPortfolio);

    // Check break-even
    if (breakEvenYear === null && buyerNetWorth >= renterNetWorth) {
      breakEvenYear = y;
    }

    yearlyBreakdown.push({
      year: y,
      buyingCumulativeCost: Math.round(buyerCumulativeCost),
      rentingCumulativeCost: Math.round(renterCumulativeCost),
      buyingNetWorth: Math.round(buyerNetWorth),
      rentingNetWorth: Math.round(renterNetWorth),
      propertyValue: Math.round(propertyValue),
      remainingLoan: Math.round(remainingLoanBalance),
      rentAnnual: Math.round(annualRent),
    });

    // Escalate rent and maintenance for next year
    currentRentMonthly *= 1 + annualRentGrowthPct / 100;
    currentMaintenanceMonthly *= 1.05; // 5% inflation
  }

  const lastYear = yearlyBreakdown[yearlyBreakdown.length - 1];
  const netAdvantageAmount = Math.abs(lastYear.buyingNetWorth - lastYear.rentingNetWorth);
  const winningScenario = lastYear.buyingNetWorth >= lastYear.rentingNetWorth ? 'Buying' : 'Renting';

  return {
    breakEvenYear,
    buyingNetWorthFinal: lastYear.buyingNetWorth,
    rentingNetWorthFinal: lastYear.rentingNetWorth,
    netAdvantageAmount,
    winningScenario,
    yearlyBreakdown,
    holdingPeriodYears,
  };
}

export interface RentalYieldResult {
  grossAnnualRent: number;
  grossRentalYieldPct: number;
  effectiveGrossIncome: number;
  totalAnnualExpenses: number;
  netOperatingIncome: number;
  netRentalYieldPct: number;
  annualCashFlow: number;
  totalInvestmentCost: number;
  cashOnCashReturnPct: number;
}

/**
 * Property Investment ROI & Rental Yield Calculator
 * Strictly separates Gross Yield vs Net Yield (NOI / Total Cost)
 */
export function calculateRentalYield(params: {
  purchasePrice: number;
  stampDutyAndRegistration: number;
  renovationInteriorCost: number;
  monthlyAskingRent: number;
  vacancyAllowancePct: number;
  annualPropertyTax: number;
  annualMaintenanceCost: number;
  annualInsurance: number;
  annualLoanEmiTotal: number;
  initialCashInvested: number;
}): RentalYieldResult {
  const {
    purchasePrice,
    stampDutyAndRegistration,
    renovationInteriorCost,
    monthlyAskingRent,
    vacancyAllowancePct,
    annualPropertyTax,
    annualMaintenanceCost,
    annualInsurance,
    annualLoanEmiTotal,
    initialCashInvested,
  } = params;

  const totalInvestmentCost = purchasePrice + stampDutyAndRegistration + renovationInteriorCost;
  const grossAnnualRent = monthlyAskingRent * 12;

  // Gross Yield
  const grossYield = totalInvestmentCost > 0 ? (grossAnnualRent / totalInvestmentCost) * 100 : 0;

  // Vacancy deduction
  const vacancyDeduction = (grossAnnualRent * Math.max(0, vacancyAllowancePct)) / 100;
  const effectiveGrossIncome = grossAnnualRent - vacancyDeduction;

  // Operating Expenses
  const totalAnnualExpenses = annualPropertyTax + annualMaintenanceCost + annualInsurance;
  const netOperatingIncome = effectiveGrossIncome - totalAnnualExpenses;

  // Net Yield (Cap Rate)
  const netYield = totalInvestmentCost > 0 ? (netOperatingIncome / totalInvestmentCost) * 100 : 0;

  // Cash Flow & Cash on Cash
  const annualCashFlow = netOperatingIncome - annualLoanEmiTotal;
  const safeCashInvested = initialCashInvested > 0 ? initialCashInvested : totalInvestmentCost;
  const cashOnCash = (annualCashFlow / safeCashInvested) * 100;

  return {
    grossAnnualRent: Math.round(grossAnnualRent),
    grossRentalYieldPct: Number(grossYield.toFixed(2)),
    effectiveGrossIncome: Math.round(effectiveGrossIncome),
    totalAnnualExpenses: Math.round(totalAnnualExpenses),
    netOperatingIncome: Math.round(netOperatingIncome),
    netRentalYieldPct: Number(netYield.toFixed(2)),
    annualCashFlow: Math.round(annualCashFlow),
    totalInvestmentCost: Math.round(totalInvestmentCost),
    cashOnCashReturnPct: Number(cashOnCash.toFixed(2)),
  };
}
