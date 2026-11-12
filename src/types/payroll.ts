/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ensec ERP - Employee & Comprehensive Payroll Management Types
 * Bridges Field Force Reps as Central Employee Entities with 
 * Salary Structure, Attendance, Leaves, Advances, Loans, Overtime, Bonuses, and Payroll Runs.
 */

export type EmployeeCategory = 
  | 'Office Employee'
  | 'Field Employee'
  | 'Factory Employee'
  | 'Warehouse Employee'
  | 'Management Employee'
  | 'Other Employee';

export type EmploymentType = 
  | 'Permanent'
  | 'Contractual'
  | 'Probationary'
  | 'Intern'
  | 'Part-time'
  | 'Full Time';

export type EmploymentStatus = 
  | 'Active'
  | 'On Leave'
  | 'Suspended'
  | 'Resigned'
  | 'Terminated';

export type AttendanceStatus = 
  | 'Present'
  | 'Absent'
  | 'Late'
  | 'Early Leave'
  | 'Half Day'
  | 'Half-Day'
  | 'Weekly Off'
  | 'Public Holiday'
  | 'Paid Leave'
  | 'Unpaid Leave'
  | 'Holiday'
  | 'Leave';

export type LeaveType = 
  | 'Annual Leave'
  | 'Casual Leave'
  | 'Sick Leave'
  | 'Maternity Leave'
  | 'Unpaid Leave'
  | 'Other Leave';

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export type AdvanceLoanType = 'Salary Advance' | 'Employee Loan';
export type AdvanceLoanStatus = 'Pending Approval' | 'Approved' | 'Disbursed' | 'In Repayment' | 'Completed' | 'Rejected';

export type BonusType = 'Festival Bonus' | 'Performance Bonus' | 'Special Bonus' | 'Sales Incentive' | 'Other Bonus';
export type BonusCalculationMethod = 'Basic Percentage' | 'Fixed Amount' | 'Custom Amount';

export type PayrollRunStatus = 'Draft' | 'Under Review' | 'Accounts Approved' | 'Finalized' | 'Locked' | 'Disbursed' | 'Paid';
export type SalaryPaymentMethod = 'Cash' | 'Bank Transfer' | 'Mobile Financial Services' | 'Cheque' | 'Other' | 'bKash' | 'Nagad';
export type SalaryPaymentStatus = 'Pending' | 'Partially Paid' | 'Paid' | 'Unpaid';

// --------------------------------------------------------------------------
// 1. Employee Salary Structure
// --------------------------------------------------------------------------
export interface SalaryComponent {
  name: string;
  type: 'EARNING' | 'DEDUCTION';
  amountBDT: number;
  isPercentage: boolean;
  percentageBasis?: 'BASIC' | 'GROSS';
  percentageValue?: number;
  isTaxable?: boolean;
}

export interface EmployeeSalaryStructure {
  id: string;
  fieldForceId?: string; // References FieldForceRep.id
  employeeId?: string;
  employeeCode?: string;
  employeeName: string;
  designation: string;
  department: string;
  employeeCategory?: EmployeeCategory;
  effectiveFrom: string;
  
  // Earnings
  basicSalaryBDT: number;
  houseRentBDT: number;
  medicalAllowanceBDT: number;
  conveyanceAllowanceBDT: number;
  foodAllowanceBDT?: number;
  mobileAllowanceBDT: number;
  specialAllowanceBDT?: number;
  otherAllowancesBDT: number;
  grossSalaryBDT: number;

  // Fixed Deductions
  providentFundBDT?: number;
  taxDeductionBDT?: number;
  otherFixedDeductionBDT?: number;

  // Revision Audit
  revisionReason?: string;
  revisedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  history?: Array<{
    effectiveDate: string;
    grossSalaryBDT: number;
    basicSalaryBDT: number;
    reason: string;
    changedBy: string;
    changedAt: string;
  }>;
}

// --------------------------------------------------------------------------
// 2. Attendance Records
// --------------------------------------------------------------------------
export interface AttendanceRecord {
  id: string;
  fieldForceId?: string;
  employeeId?: string;
  employeeCode?: string;
  employeeName: string;
  employeeCategory?: EmployeeCategory;
  department?: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  inTime?: string;
  outTime?: string;
  checkInTime?: string; // HH:mm
  checkOutTime?: string; // HH:mm
  workHours?: number;
  overtimeHours?: number;
  isLate?: boolean;
  lateMinutes?: number;
  isEarlyLeave?: boolean;
  earlyMinutes?: number;
  remarks?: string;
  recordedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// --------------------------------------------------------------------------
// 3. Leave Applications & Quotas
// --------------------------------------------------------------------------
export interface LeaveRecord {
  id: string;
  leaveApplicationNo?: string;
  fieldForceId?: string;
  employeeId?: string;
  employeeCode?: string;
  employeeName: string;
  department?: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays?: number;
  daysCount?: number;
  reason: string;
  status: LeaveStatus;
  appliedDate?: string;
  appliedAt?: string;
  approvedBy?: string;
  approvalDate?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export interface LeaveBalance {
  annualLeave: number;
  annualUsed: number;
  casualLeave: number;
  casualUsed: number;
  sickLeave: number;
  sickUsed: number;
  maternityLeave: number;
  maternityUsed: number;
  unpaidLeaveUsed: number;
}

// --------------------------------------------------------------------------
// 4. Employee Advances & Loans
// --------------------------------------------------------------------------
export interface LoanInstallmentSchedule {
  installmentNumber: number;
  monthYear: string; // e.g. "2026-11"
  installmentAmountBDT?: number;
  amountBDT?: number;
  paidAmountBDT?: number;
  isDeducted?: boolean;
  deductionDate?: string;
  paidDate?: string;
  payrollRunId?: string;
  deductedInPayrollId?: string;
  status: 'Pending' | 'Deducted' | 'Skipped' | 'Early Settled' | 'Scheduled';
}

export interface AdvanceLoanRecord {
  id: string;
  referenceNo?: string; // e.g. "LN-2026-001"
  fieldForceId?: string;
  employeeId?: string;
  employeeCode?: string;
  employeeName: string;
  department?: string;
  employeeCategory?: EmployeeCategory;
  loanType?: AdvanceLoanType;
  type?: AdvanceLoanType;
  requestedAmountBDT?: number;
  principalAmountBDT?: number;
  approvedAmountBDT?: number;
  requestDate?: string;
  appliedDate?: string;
  status: AdvanceLoanStatus | 'Pending' | 'Active' | 'Closed' | 'Settled';
  disbursementDate?: string;
  approvalDate?: string;
  disbursementAccount?: string;
  repaymentStartMonth?: string; // "YYYY-MM"
  deductionStartMonthYear?: string;
  installmentDurationMonths?: number;
  repaymentTenureMonths?: number;
  monthlyInstallmentBDT?: number;
  monthlyDeductionBDT?: number;
  totalPaidBDT?: number;
  repaidAmountBDT?: number;
  remainingBalanceBDT?: number;
  remainingAmountBDT?: number;
  purpose?: string;
  remarks?: string;
  approvedBy?: string;
  schedule: LoanInstallmentSchedule[];
}

// --------------------------------------------------------------------------
// 5. Overtime Records
// --------------------------------------------------------------------------
export interface OvertimeRecord {
  id: string;
  fieldForceId?: string;
  employeeId?: string;
  employeeCode?: string;
  employeeName: string;
  department?: string;
  overtimeDate?: string;
  date?: string;
  monthYear?: string;
  hours: number;
  hourlyRateBDT?: number;
  ratePerHourBDT?: number;
  totalAmountBDT: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvalDate?: string;
  reason?: string;
}

// --------------------------------------------------------------------------
// 6. Bonus & Incentives
// --------------------------------------------------------------------------
export interface BonusRecord {
  id: string;
  bonusTitle?: string;
  bonusType?: BonusType;
  fieldForceId?: string;
  employeeId?: string;
  employeeCode?: string;
  employeeName: string;
  department?: string;
  type?: BonusType;
  calculationMethod?: BonusCalculationMethod;
  percentageOfBasic?: number;
  amountBDT: number;
  effectiveMonth?: string; // "YYYY-MM"
  monthYear?: string;
  status: 'Pending' | 'Approved' | 'Paid';
  approvedBy?: string;
  remarks?: string;
}

// --------------------------------------------------------------------------
// 7. Monthly Payroll Run & Salary Sheet Item
// --------------------------------------------------------------------------
export interface MonthlySalarySheetItem {
  id: string;
  payrollRunId: string;
  fieldForceId?: string;
  employeeId?: string;
  employeeCode?: string;
  employeeName: string;
  department: string;
  designation: string;
  employeeCategory: EmployeeCategory;
  monthYear?: string; // "YYYY-MM"
  bankAccountNo?: string;
  bankName?: string;
  
  // Working days summary
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  unpaidLeaveDays?: number;
  lateDays?: number;
  holidays?: number;
  overtimeHours: number;

  // Earnings Breakdown
  basicSalaryBDT: number;
  houseRentBDT: number;
  medicalAllowanceBDT: number;
  conveyanceAllowanceBDT: number;
  foodAllowanceBDT?: number;
  mobileAllowanceBDT: number;
  specialAllowanceBDT?: number;
  otherAllowancesBDT: number;
  overtimeAmountBDT: number;
  salesIncentiveBDT: number;
  bonusAmountBDT?: number;
  festivalBonusBDT?: number;
  performanceBonusBDT?: number;
  grossSalaryBDT?: number;
  totalGrossEarningsBDT?: number;

  // Deductions Breakdown
  absentDeductionBDT?: number;
  attendanceDeductionBDT?: number;
  lateDeductionBDT?: number;
  advanceDeductionBDT?: number;
  loanInstallmentBDT?: number;
  advanceLoanDeductionBDT?: number;
  providentFundBDT?: number;
  providentFundDeductionBDT?: number;
  taxDeductionBDT: number;
  otherDeductionsBDT: number;
  totalDeductionsBDT: number;

  // Net Output
  netPayableBDT?: number;
  netSalaryBDT?: number;
  paidAmountBDT?: number;
  paymentStatus: SalaryPaymentStatus | 'Unpaid';
  paymentMethod?: SalaryPaymentMethod;
  paymentDate?: string;
  transactionRef?: string;
  bankAccountInfo?: string;
}

export interface MonthlyPayrollRun {
  id: string;
  payrollMonth?: string; // "YYYY-MM"
  monthYear?: string;
  runDate?: string;
  totalEmployees: number;
  officeEmployeesCount?: number;
  fieldEmployeesCount?: number;
  factoryEmployeesCount?: number;
  warehouseEmployeesCount?: number;
  totalGrossSalaryBDT?: number;
  totalGrossBDT?: number;
  totalAllowancesBDT?: number;
  totalOvertimeBDT: number;
  totalBonusesBDT?: number;
  totalBonusBDT?: number;
  totalDeductionsBDT: number;
  totalNetPayableBDT?: number;
  totalNetBDT?: number;
  totalLoanDeductionsBDT?: number;
  totalPFDeductionsBDT?: number;
  totalTaxDeductionsBDT?: number;
  totalPaidBDT?: number;
  status: PayrollRunStatus | 'Paid';
  approvedBy?: string;
  approvalDate?: string;
  finalizedBy?: string;
  finalizedDate?: string;
  processedAt?: string;
  processedBy?: string;
  finalizedAt?: string;
  accountingJournalEntries?: Array<{
    accountCode: string;
    accountName: string;
    debitBDT: number;
    creditBDT: number;
  }>;
  items: MonthlySalarySheetItem[];
}

// --------------------------------------------------------------------------
// 8. Salary Payment Recording
// --------------------------------------------------------------------------
export interface SalaryPaymentRecord {
  id: string;
  payrollRunId: string;
  salarySheetItemId?: string;
  fieldForceId?: string;
  employeeId?: string;
  employeeCode?: string;
  employeeName: string;
  department?: string;
  monthYear: string;
  netPayableBDT?: number;
  paidAmountBDT?: number;
  amountBDT?: number;
  paymentDate: string;
  paymentMethod: SalaryPaymentMethod;
  bankAccountId?: string;
  bankAccountName?: string;
  transactionReference: string;
  paymentStatus?: SalaryPaymentStatus;
  status?: string;
  notes?: string;
  remarks?: string;
  disbursedBy: string;
}

// --------------------------------------------------------------------------
// 9. Configurable Payroll Settings
// --------------------------------------------------------------------------
export interface PayrollSettings {
  workingDaysPerMonth?: number;
  standardWorkHoursPerDay?: number;
  standardWorkingDaysPerMonth?: number;
  standardDailyHours?: number;
  overtimeHourlyMultiplier?: number; // e.g. 1.5x basic hourly
  overtimeConfig?: {
    hourlyRateMultiplier: number;
  };
  lateGracePeriodMinutes?: number;
  lateDaysForOneDayAbsent?: number; // e.g. 3 late days = 1 day absent deduction
  annualLeaveQuota?: number;
  casualLeaveQuota?: number;
  sickLeaveQuota?: number;
  maternityLeaveDays?: number;
  leaveQuotas?: {
    annualLeave: number;
    casualLeave: number;
    sickLeave: number;
    maternityLeave: number;
  };
  deductionRules?: {
    absentDayDeductionMultiplier?: number;
    lateDeductionRules?: string;
    latePenaltyEnabled?: boolean;
    incomeTaxEnabled?: boolean;
    providentFundEnabled?: boolean;
    pfEmployeeContributionPercent?: number;
    pfEmployerContributionPercent?: number;
  };
  salaryComponents?: {
    houseRentPercent?: number;
    medicalAllowancePercent?: number;
  };
  companyName?: string;
  companyAddress?: string;
  defaultBankAccountId?: string;
  autoPostAccountingJournal?: boolean;
}
