/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ensec ERP - Overtime Management Module Types
 * Fully integrated types covering Overtime Dashboard KPIs, Overtime Requests,
 * Dedicated OT Attendance (Check-in/Check-out with overnight support and biometric readiness),
 * Production Batch Allocations, Configurable Policy-based Overtime Cost Calculations,
 * Multi-Step Approval Workflows, Payroll Integration, and Production Cost Accounting.
 */

export type OvertimeStatus =
  | 'Draft'
  | 'Pending Supervisor'
  | 'Supervisor Approved'
  | 'Production Approved'
  | 'HR Verified'
  | 'Final Approved'
  | 'Rejected'
  | 'Cancelled';

export type OvertimePurposeCategory =
  | 'Direct Production'
  | 'Rework & QC'
  | 'Factory Maintenance'
  | 'Packaging & Dispatch'
  | 'Urgent Order Fulfillment'
  | 'General Operations';

export type ProductionProcessType =
  | 'Cell Testing & Sorting'
  | 'Spot Welding & Busbar'
  | 'BMS Wiring & Soldering'
  | 'Casing & Insulation'
  | 'Final Pack Aging & Cycle Test'
  | 'Maintenance & Tooling'
  | 'General Factory Overhead';

export interface OvertimeBatchAllocation {
  id: string;
  productionOrderId: string;
  productionOrderNumber: string;
  productionBatchNumber: string;
  productId?: string;
  productName: string;
  processType: ProductionProcessType;
  allocatedHours: number;
  hourlyRateBDT: number;
  allocatedCostBDT: number;
  isOverhead: boolean; // true if maintenance or general overhead, not assigned to direct batch production
  notes?: string;
}

export interface OvertimeRequest {
  id: string;
  requestNumber: string; // e.g. "OTR-2026-001"
  employeeId: string; // linked to FieldForceRep.id (Central Employee Master)
  employeeCode: string;
  employeeName: string;
  department: string;
  designation: string;
  employeeCategory?: string;
  overtimeDate: string; // YYYY-MM-DD
  purposeCategory: OvertimePurposeCategory;
  
  // Production Order and Batch selection (from existing Production modules)
  productionOrderId?: string;
  productionOrderNumber?: string;
  productionBatchNumber?: string;
  productName?: string;
  projectPurpose: string;
  
  // Time expectations
  expectedStartTime: string; // "HH:mm", e.g. "18:00"
  expectedEndTime: string; // "HH:mm", e.g. "22:00"
  expectedHours: number;
  overtimeReason: string;
  requestedBy: string;
  requestedAt: string;
  
  // Multi-step Approval Workflow: Supervisor -> Production Manager -> HR/Accounts -> Final
  status: OvertimeStatus;
  
  // Step 1: Supervisor Review
  supervisorId?: string;
  supervisorName?: string;
  supervisorApprovedAt?: string;
  supervisorRemarks?: string;
  
  // Step 2: Production Manager Review
  productionManagerId?: string;
  productionManagerName?: string;
  productionApprovedAt?: string;
  productionRemarks?: string;
  
  // Step 3: HR / Accounts Verification
  hrVerifierId?: string;
  hrVerifierName?: string;
  hrVerifiedAt?: string;
  hrRemarks?: string;
  
  // Step 4: Final Executive Approval
  finalApproverId?: string;
  finalApproverName?: string;
  finalApprovedAt?: string;
  finalRemarks?: string;

  rejectionReason?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  
  // Attendance & Verification Connection
  attendanceId?: string;
  actualOvertimeHours?: number;
  
  // Cost Calculations
  basicSalaryBDT?: number;
  grossSalaryBDT?: number;
  hourlyRateBDT?: number;
  overtimeMultiplier?: number;
  calculatedOvertimeAmountBDT?: number;
  
  // Batch allocations (multi-batch split support)
  batchAllocations: OvertimeBatchAllocation[];
  
  // Integration Flags
  isPayrollProcessed?: boolean;
  payrollRunId?: string;
  payrollMonth?: string; // YYYY-MM
  isCostingAllocated?: boolean;
  costingAllocationBatch?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OvertimeAttendance {
  id: string;
  requestId?: string; // Optional link to pre-approved OvertimeRequest
  requestNumber?: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  designation: string;
  date: string; // YYYY-MM-DD
  
  // Normal Attendance (Logically separate from OT attendance)
  normalCheckInTime: string; // e.g. "09:00"
  normalCheckOutTime: string; // e.g. "18:00"
  
  // Overtime Attendance
  overtimeCheckInTime: string; // e.g. "18:30"
  overtimeCheckOutTime: string; // e.g. "22:30" or overnight "02:00"
  isOvernight: boolean;
  breakDurationMinutes: number; // e.g. 30 minutes
  
  // Calculations
  rawCalculatedHours: number;
  actualOvertimeHours: number;
  
  // Verification
  verifiedBy?: string;
  verificationDate?: string;
  isVerified: boolean;
  verificationRemarks?: string;
  
  // Automated Alert Flags
  isLateCheckOutAlert?: boolean;
  isMissingCheckOutAlert?: boolean;
  isDuplicateEntryAlert?: boolean;
  
  // Biometric machine readiness
  biometricDeviceId?: string;
  rawBiometricPunchId?: string;
  syncSource: 'Manual' | 'Biometric Device' | 'Mobile GPS';
  
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type OvertimeWageBasis = 'BASIC_ONLY' | 'BASIC_PLUS_HOUSING' | 'GROSS_WAGE';

export type OvertimeCalculationBasis = 'Basic Salary' | 'Fixed Hourly Rate';

/**
 * Individual Overtime Policy assigned to a specific Employee in Field Force Master.
 * Replaces global one-size-fits-all overtime policies.
 */
export interface EmployeeOvertimePolicy {
  id: string;
  employeeId: string; // Linked to FieldForceRep.id
  employeeCode?: string;
  employeeName?: string;
  department?: string;
  
  // 1. Overtime Eligibility (Yes/No)
  isEligible: boolean;
  
  // 2. Overtime Calculation Basis (Basic Salary / Fixed Hourly Rate)
  calculationBasis: OvertimeCalculationBasis;
  
  // 3. Monthly Standard Working Hours / Divisor (e.g. 208)
  standardMonthlyWorkingHours: number;
  
  // 4. Overtime Multiplier (e.g. 1.5x, 2.0x, or custom)
  overtimeMultiplier: number;
  
  // 5. Fixed Overtime Hourly Rate (when calculationBasis is 'Fixed Hourly Rate')
  fixedHourlyRateBDT?: number;
  
  // 6. Effective From Date (YYYY-MM-DD)
  effectiveFrom: string;
  
  // Effective To Date (set when superseded by policy amendment)
  effectiveTo?: string;
  
  // 7. Policy Status (Active/Inactive)
  status: 'Active' | 'Inactive';
  
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface OvertimePolicyConfig {
  id: string;
  policyName: string;
  isDefault: boolean;
  department?: string; // 'All Departments' or specific
  standardWorkingDaysPerMonth: number; // Default: 26
  standardDailyWorkingHours: number; // Default: 8
  standardMonthlyWorkingHours: number; // Default: 208 (26 * 8)
  wageBasis: OvertimeWageBasis; // 'BASIC_ONLY', etc.
  overtimeMultiplierRegular: number; // e.g. 2.0 (Bangladesh Labor Act 2006 for factory) or 1.5
  overtimeMultiplierWeekend: number; // e.g. 2.0
  overtimeMultiplierHoliday: number; // e.g. 2.5
  overtimeMultiplierNightShift: number; // e.g. 2.2
  minimumOtMinutesThreshold: number; // e.g. 30 minutes
  maxOtHoursPerDay: number; // e.g. 4 hours
  maxOtHoursPerMonth: number; // e.g. 60 hours
  allowOvernightOvertime: boolean;
  requireSupervisorPreApproval: boolean;
  updatedBy?: string;
  updatedAt?: string;
}

export interface OvertimeAuditTrail {
  id: string;
  recordId: string;
  recordType: 'REQUEST' | 'ATTENDANCE' | 'ALLOCATION' | 'POLICY' | 'PAYROLL_SYNC' | 'COSTING_SYNC';
  action: string;
  actorId?: string;
  actorName: string;
  actorRole: string;
  timestamp: string;
  details: string;
  previousState?: string;
  newState?: string;
}

export interface OvertimeDashboardKPIs {
  totalOvertimeHours: number;
  totalOvertimeCostBDT: number;
  employeesWorkingOvertimeCount: number;
  pendingRequestsCount: number;
  approvedOvertimeHours: number;
  departmentWiseCost: Array<{
    department: string;
    hours: number;
    costBDT: number;
    employeeCount: number;
  }>;
  batchWiseCost: Array<{
    batchNumber: string;
    orderNumber: string;
    productName: string;
    hours: number;
    costBDT: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    hours: number;
    costBDT: number;
  }>;
}

// --------------------------------------------------------------------------
// Calculation Helpers (following Bangladesh Labor Act 2006 standards)
// --------------------------------------------------------------------------

/**
 * Calculates net overtime hours between check-in and check-out, supporting overnight shifts.
 */
export function calculateNetOvertimeHours(
  checkIn: string,
  checkOut: string,
  breakMinutes: number = 0,
  isOvernight?: boolean
): number {
  if (!checkIn || !checkOut) return 0;
  
  const [inH, inM] = checkIn.split(':').map((v) => parseInt(v, 10) || 0);
  const [outH, outM] = checkOut.split(':').map((v) => parseInt(v, 10) || 0);
  
  let inMinutes = inH * 60 + inM;
  let outMinutes = outH * 60 + outM;
  
  // Overnight detection: check-out time is earlier than check-in time or explicit overnight flag
  if (outMinutes < inMinutes || isOvernight) {
    outMinutes += 24 * 60;
  }
  
  const netMinutes = Math.max(0, outMinutes - inMinutes - (breakMinutes || 0));
  return Math.round((netMinutes / 60) * 100) / 100;
}

/**
 * Calculates hourly wage rate according to policy wage basis.
 */
export function calculateHourlyRate(
  basicSalary: number,
  grossSalary: number,
  wageBasis: OvertimeWageBasis,
  standardMonthlyHours: number = 208
): number {
  const hours = standardMonthlyHours > 0 ? standardMonthlyHours : 208;
  let basisAmount = basicSalary;
  
  if (wageBasis === 'GROSS_WAGE') {
    basisAmount = grossSalary;
  } else if (wageBasis === 'BASIC_PLUS_HOUSING') {
    // Basic + 50% house rent standard
    basisAmount = basicSalary + Math.round(basicSalary * 0.5);
  }
  
  return Math.round((basisAmount / hours) * 100) / 100;
}

/**
 * Calculates total overtime amount in BDT.
 */
export function calculateOvertimeTotalBDT(
  hourlyRate: number,
  multiplier: number,
  actualHours: number
): number {
  return Math.round(hourlyRate * multiplier * actualHours);
}

/**
 * Calculates individual employee overtime according to their assigned policy.
 * Formula:
 * If Fixed Hourly Rate: OT Hourly Rate = Fixed Hourly Rate
 * If Basic Salary: OT Hourly Rate = Basic Salary / Monthly Standard Working Hours (Divisor)
 * OT Amount = OT Hourly Rate * OT Multiplier * Approved OT Hours
 */
export function calculateEmployeeIndividualOvertime(
  basicSalary: number,
  policy: Partial<EmployeeOvertimePolicy> | undefined,
  hours: number
): {
  isEligible: boolean;
  hourlyRate: number;
  multiplier: number;
  calculationBasis: OvertimeCalculationBasis;
  totalAmountBDT: number;
  effectiveRateBDT: number;
} {
  const isEligible = policy?.isEligible !== false && policy?.status !== 'Inactive';
  const calculationBasis: OvertimeCalculationBasis = policy?.calculationBasis || 'Basic Salary';
  const divisor = (policy?.standardMonthlyWorkingHours && policy.standardMonthlyWorkingHours > 0)
    ? policy.standardMonthlyWorkingHours
    : 208;
  const multiplier = (policy?.overtimeMultiplier !== undefined && policy.overtimeMultiplier > 0)
    ? policy.overtimeMultiplier
    : 2.0;

  let hourlyRate = 0;
  if (calculationBasis === 'Fixed Hourly Rate') {
    hourlyRate = Number(policy?.fixedHourlyRateBDT) || 0;
  } else {
    const salary = Number(basicSalary) || 0;
    hourlyRate = divisor > 0 ? Math.round((salary / divisor) * 100) / 100 : 0;
  }

  const effectiveRate = Math.round(hourlyRate * multiplier * 100) / 100;
  const totalAmount = isEligible ? Math.round(hourlyRate * multiplier * Math.max(0, hours)) : 0;

  return {
    isEligible,
    hourlyRate,
    multiplier,
    calculationBasis,
    totalAmountBDT: totalAmount,
    effectiveRateBDT: effectiveRate,
  };
}
