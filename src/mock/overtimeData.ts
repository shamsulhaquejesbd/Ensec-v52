/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ensec ERP - Overtime Management Dataset
 * Compliant with Bangladesh Labor Act 2006 and factory multi-batch assembly lines.
 * Initial test/session records cleared for production and live usage.
 */

import {
  OvertimePolicyConfig,
  OvertimeRequest,
  OvertimeAttendance,
  OvertimeAuditTrail,
} from '../types/overtime.ts';

// --------------------------------------------------------------------------
// 1. Default Overtime Policies (Bangladesh Labor Act 2006 Compliant)
// --------------------------------------------------------------------------
export const DEFAULT_OVERTIME_POLICY: OvertimePolicyConfig = {
  id: 'pol-bd-labor-2006',
  policyName: 'Standard Factory & Production Overtime Policy (BLA 2006)',
  isDefault: true,
  department: 'All Departments',
  standardWorkingDaysPerMonth: 26,
  standardDailyWorkingHours: 8,
  standardMonthlyWorkingHours: 208, // 26 days * 8 hours
  wageBasis: 'BASIC_ONLY', // As per Bangladesh Labor Act Section 108: Overtime calculated at double basic wage
  overtimeMultiplierRegular: 2.0, // 200% (2x) of basic hourly rate
  overtimeMultiplierWeekend: 2.0, // Weekend shift
  overtimeMultiplierHoliday: 2.5, // National / festival holiday
  overtimeMultiplierNightShift: 2.2, // Night / overnight shift allowance
  minimumOtMinutesThreshold: 30, // Minimum 30 mins required to claim OT
  maxOtHoursPerDay: 4.0, // Maximum 4 hours OT permitted per day
  maxOtHoursPerMonth: 60.0, // Maximum 60 hours OT permitted per month
  allowOvernightOvertime: true,
  requireSupervisorPreApproval: true,
  updatedBy: 'Rezwana Parveen (Finance & HR Lead)',
  updatedAt: '2026-11-01T10:00:00Z',
};

export const INITIAL_OVERTIME_POLICIES: OvertimePolicyConfig[] = [
  DEFAULT_OVERTIME_POLICY,
  {
    id: 'pol-office-support',
    policyName: 'Office & SCM Operational Overtime Policy',
    isDefault: false,
    department: 'Supply Chain & Logistics',
    standardWorkingDaysPerMonth: 24,
    standardDailyWorkingHours: 8,
    standardMonthlyWorkingHours: 192,
    wageBasis: 'BASIC_ONLY',
    overtimeMultiplierRegular: 1.5,
    overtimeMultiplierWeekend: 2.0,
    overtimeMultiplierHoliday: 2.0,
    overtimeMultiplierNightShift: 1.8,
    minimumOtMinutesThreshold: 30,
    maxOtHoursPerDay: 3.0,
    maxOtHoursPerMonth: 40.0,
    allowOvernightOvertime: false,
    requireSupervisorPreApproval: true,
    updatedBy: 'Rezwana Parveen (Finance & HR Lead)',
    updatedAt: '2026-11-01T10:00:00Z',
  },
];

// --------------------------------------------------------------------------
// 2. Initial Overtime Requests (Clean - No test/mock records)
// --------------------------------------------------------------------------
export const INITIAL_OVERTIME_REQUESTS: OvertimeRequest[] = [];

// --------------------------------------------------------------------------
// 3. Initial Overtime Attendance Punch Records (Clean - No test/mock records)
// --------------------------------------------------------------------------
export const INITIAL_OVERTIME_ATTENDANCE: OvertimeAttendance[] = [];

// --------------------------------------------------------------------------
// 4. Initial Overtime Audit Logs (Clean - No test/mock records)
// --------------------------------------------------------------------------
export const INITIAL_OVERTIME_AUDIT_LOGS: OvertimeAuditTrail[] = [];
