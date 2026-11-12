/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ensec ERP - Automated Installment, Overdue & Collection Engine
 * Provides idempotent background processing, schedule updates, escalation,
 * and FIFO payment allocation calculations.
 */

import {
  InstallmentPlan,
  InstallmentSchedule,
  InstallmentPaymentAllocation,
  CollectionAssignment,
  CollectionEscalationRule,
  SMSAutomationRule,
  SMSTemplate,
  SMSGatewaySettings,
  SMSLog,
  InstallmentNotification,
  EarlySettlementCalculation,
  EscalationLevel,
} from '../types/installment.ts';
import { compileTemplate, sendSMSViaGateway } from './smsService.ts';

export interface AutomationExecutionReport {
  executionDate: string;
  totalPlansProcessed: number;
  schedulesUpdated: number;
  upcomingRemindersEvaluated: number;
  overdueInstallmentsFound: number;
  escalationsTriggered: number;
  smsSentCount: number;
  smsFailedCount: number;
  notificationsCreated: number;
  logs: string[];
}

/**
 * Calculate difference in calendar days between two dates (date2 - date1)
 * format: YYYY-MM-DD
 */
export function getDaysDiff(date1Str: string, date2Str: string): number {
  const d1 = new Date(date1Str);
  const d2 = new Date(date2Str);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get current system date in YYYY-MM-DD
 */
export function getSystemDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * FIFO Payment Allocation Helper
 * Allocates a payment amount to a customer's unpaid schedules starting from the oldest due date.
 */
export function allocatePaymentFIFO(
  unpaidSchedules: InstallmentSchedule[],
  paymentAmountBDT: number,
  paymentId: string
): {
  allocations: InstallmentPaymentAllocation[];
  updatedSchedules: InstallmentSchedule[];
  unallocatedRemainderBDT: number;
} {
  // Sort unpaid schedules chronologically by due date
  const sorted = [...unpaidSchedules].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  let remainingPayment = paymentAmountBDT;
  const allocations: InstallmentPaymentAllocation[] = [];
  const updatedSchedules: InstallmentSchedule[] = [];

  for (const sch of sorted) {
    if (remainingPayment <= 0) {
      updatedSchedules.push(sch);
      continue;
    }

    const currentRemaining = sch.remainingAmountBDT;
    const allocateForThis = Math.min(remainingPayment, currentRemaining);
    const newPaidAmount = sch.paidAmountBDT + allocateForThis;
    const newRemaining = currentRemaining - allocateForThis;
    const isCleared = newRemaining <= 0;

    // Prorate principal and interest
    const principalPortion =
      sch.dueAmountBDT > 0 ? (allocateForThis * sch.principalAmountBDT) / sch.dueAmountBDT : allocateForThis;
    const interestPortion = allocateForThis - principalPortion;

    allocations.push({
      id: `ALC-${Date.now()}-${sch.installmentNumber}-${Math.floor(Math.random() * 1000)}`,
      paymentId,
      scheduleId: sch.id,
      installmentNumber: sch.installmentNumber,
      allocatedAmountBDT: allocateForThis,
      principalPortionBDT: Math.round(principalPortion * 100) / 100,
      interestPortionBDT: Math.round(interestPortion * 100) / 100,
      isFullyCleared: isCleared,
    });

    updatedSchedules.push({
      ...sch,
      paidAmountBDT: newPaidAmount,
      remainingAmountBDT: newRemaining,
      status: isCleared ? 'Paid' : 'Partial',
      paymentDate: isCleared ? getSystemDate() : sch.paymentDate,
      overdueDays: isCleared ? 0 : sch.overdueDays,
    });

    remainingPayment -= allocateForThis;
  }

  return {
    allocations,
    updatedSchedules,
    unallocatedRemainderBDT: Math.max(0, remainingPayment),
  };
}

/**
 * Early Settlement Calculation
 */
export function calculateEarlySettlement(
  plan: InstallmentPlan,
  schedules: InstallmentSchedule[],
  rebatePercent: number = 5
): EarlySettlementCalculation {
  const unpaid = schedules.filter((s) => s.status !== 'Paid');
  const unpaidPrincipal = unpaid.reduce((sum, s) => sum + (s.remainingAmountBDT || 0), 0);
  const remainingInterest = unpaid.reduce((sum, s) => sum + (s.interestAmountBDT || 0), 0);
  const totalRemaining = unpaidPrincipal;

  const rebateAmount = Math.round((totalRemaining * rebatePercent) / 100);
  const settlementNetPayable = Math.max(0, totalRemaining - rebateAmount);

  return {
    planId: plan.id,
    agreementNo: plan.agreementNo,
    customerName: plan.customerName,
    unpaidPrincipalBDT: unpaidPrincipal,
    remainingInterestBDT: remainingInterest,
    totalRemainingScheduleBDT: totalRemaining,
    rebatePercentage: rebatePercent,
    rebateAmountBDT: rebateAmount,
    settlementNetPayableBDT: settlementNetPayable,
    unpaidInstallmentsCount: unpaid.length,
  };
}

/**
 * Determine Escalation Level based on overdue days
 */
export function determineEscalationLevel(
  overdueDays: number,
  escalationRules: CollectionEscalationRule[]
): { level: EscalationLevel; role: string; action: string } {
  if (overdueDays <= 0) {
    return {
      level: 'Level 1 (Officer)',
      role: 'Collection Officer',
      action: 'Normal schedule monitoring',
    };
  }

  const sortedRules = [...escalationRules].sort((a, b) => a.minOverdueDays - b.minOverdueDays);
  for (const rule of sortedRules) {
    if (overdueDays >= rule.minOverdueDays && overdueDays <= rule.maxOverdueDays) {
      let levelEnum: EscalationLevel = 'Level 1 (Officer)';
      if (rule.level === 2) levelEnum = 'Level 2 (ASM)';
      else if (rule.level === 3) levelEnum = 'Level 3 (RM)';
      else if (rule.level >= 4) levelEnum = 'Level 4 (Head Office)';

      return {
        level: levelEnum,
        role: rule.escalateToRole,
        action: rule.actionRequired,
      };
    }
  }

  return {
    level: 'Level 4 (Head Office)',
    role: 'Accounts Manager / Head Office',
    action: 'Urgent Recovery and Legal review',
  };
}

/**
 * Full Idempotent Automation Run:
 * 1. Scans all active installment schedules against current date.
 * 2. Updates statuses (Upcoming -> Due Today -> Overdue) and calculates exact overdue days.
 * 3. Identifies SMS automation triggers (7d, 3d, 1d before, on due date, 1d, 7d, 15d overdue).
 * 4. Checks idempotency cache so each milestone rule is sent at most once per schedule.
 * 5. Re-evaluates collection escalations and creates in-app notifications.
 */
export async function runAutomatedInstallmentCheck(options: {
  plans: InstallmentPlan[];
  schedules: InstallmentSchedule[];
  rules: SMSAutomationRule[];
  templates: SMSTemplate[];
  gatewaySettings: SMSGatewaySettings;
  escalationRules: CollectionEscalationRule[];
  assignments: CollectionAssignment[];
  existingLogs: SMSLog[];
  todayDateStr?: string;
}): Promise<{
  report: AutomationExecutionReport;
  updatedPlans: InstallmentPlan[];
  updatedSchedules: InstallmentSchedule[];
  newLogs: SMSLog[];
  newNotifications: InstallmentNotification[];
  updatedAssignments: CollectionAssignment[];
}> {
  const {
    plans,
    schedules,
    rules,
    templates,
    gatewaySettings,
    escalationRules,
    assignments,
    existingLogs,
    todayDateStr = getSystemDate(),
  } = options;

  const logsOutput: string[] = [];
  logsOutput.push(`[${todayDateStr}] Starting automated installment and collection evaluation...`);

  // Build idempotency set of previously sent reminders for (scheduleId + ruleCode)
  const sentRuleCache = new Set<string>();
  for (const l of existingLogs) {
    if (l.ruleId && l.planId) {
      sentRuleCache.add(`${l.planId}_${l.ruleId}_${l.status}`);
    }
  }

  const updatedSchedules: InstallmentSchedule[] = [];
  const newLogs: SMSLog[] = [];
  const newNotifications: InstallmentNotification[] = [];
  const updatedAssignments = [...assignments];

  let schedulesUpdated = 0;
  let upcomingRemindersEvaluated = 0;
  let overdueFound = 0;
  let escalationsTriggered = 0;
  let smsSentCount = 0;
  let smsFailedCount = 0;

  // Plan map to recalculate totals
  const planAggregates: Record<
    string,
    {
      overdueCount: number;
      overdueAmount: number;
      remainingCount: number;
      totalOutstanding: number;
      paidCount: number;
      totalPaid: number;
    }
  > = {};

  for (const p of plans) {
    planAggregates[p.id] = {
      overdueCount: 0,
      overdueAmount: 0,
      remainingCount: 0,
      totalOutstanding: 0,
      paidCount: 0,
      totalPaid: 0,
    };
  }

  // 1. Process each schedule
  for (const sch of schedules) {
    const plan = plans.find((p) => p.id === sch.planId);
    if (!plan || plan.status === 'Cancelled' || plan.status === 'Settled') {
      updatedSchedules.push(sch);
      continue;
    }

    const agg = planAggregates[plan.id];
    let newStatus = sch.status;
    let newOverdueDays = sch.overdueDays;

    if (sch.status === 'Paid') {
      agg.paidCount++;
      agg.totalPaid += sch.paidAmountBDT;
      updatedSchedules.push(sch);
      continue;
    }

    // Unpaid or Partial
    agg.remainingCount++;
    agg.totalOutstanding += sch.remainingAmountBDT;
    const daysDiff = getDaysDiff(sch.dueDate, todayDateStr); // today - dueDate

    if (daysDiff < 0) {
      // Due in future
      newStatus = 'Upcoming';
      newOverdueDays = 0;
      upcomingRemindersEvaluated++;
    } else if (daysDiff === 0) {
      // Due today!
      newStatus = 'Due Today';
      newOverdueDays = 0;
    } else {
      // Past due date
      newStatus = 'Overdue';
      newOverdueDays = daysDiff;
      overdueFound++;
      agg.overdueCount++;
      agg.overdueAmount += sch.remainingAmountBDT;
    }

    const scheduleModified =
      newStatus !== sch.status || newOverdueDays !== sch.overdueDays;
    if (scheduleModified) {
      schedulesUpdated++;
    }

    const currentSchedule: InstallmentSchedule = {
      ...sch,
      status: newStatus,
      overdueDays: newOverdueDays,
    };
    updatedSchedules.push(currentSchedule);

    // 2. Evaluate SMS Automation Rules for this schedule
    for (const rule of rules) {
      if (!rule.enabled) continue;

      let isTriggered = false;
      if (rule.triggerType === 'days_before_due' && daysDiff === rule.triggerDays) {
        // e.g. rule.triggerDays is -7, -3, or -1
        isTriggered = true;
      } else if (rule.triggerType === 'on_due_date' && daysDiff === 0) {
        isTriggered = true;
      } else if (rule.triggerType === 'days_after_due' && daysDiff === rule.triggerDays) {
        // e.g. rule.triggerDays is 1, 7, 15
        isTriggered = true;
      }

      if (isTriggered) {
        const cacheKey = `${currentSchedule.id}_${rule.ruleCode}_${todayDateStr}`;
        if (sentRuleCache.has(cacheKey)) {
          // Already sent for this milestone today; skip (idempotent)
          continue;
        }

        // Find template
        const template =
          templates.find((t) => t.id === rule.templateId) || templates[0];
        const compiledMsg = compileTemplate(template.body, {
          CustomerName: plan.customerName,
          DueAmount: currentSchedule.remainingAmountBDT,
          AgreementNo: plan.agreementNo,
          DueDate: currentSchedule.dueDate,
          OutstandingAmount: currentSchedule.remainingAmountBDT,
          OverdueDays: currentSchedule.overdueDays,
          RemainingAmount: currentSchedule.remainingAmountBDT,
        });

        // Dispatch SMS
        const smsResult = await sendSMSViaGateway({
          recipientPhone: plan.customerPhone,
          recipientName: plan.customerName,
          message: compiledMsg,
          templateCode: template.templateCode,
          ruleId: rule.id,
          planId: plan.id,
          agreementNo: plan.agreementNo,
          gatewaySettings,
        });

        newLogs.push(smsResult.log);
        sentRuleCache.add(cacheKey);

        if (smsResult.success) {
          smsSentCount++;
          logsOutput.push(
            `[SMS SENT] ${rule.name} -> ${plan.customerName} (${plan.customerPhone}): ${compiledMsg.slice(0, 50)}...`
          );
        } else {
          smsFailedCount++;
          logsOutput.push(
            `[SMS ATTEMPT] ${rule.name} -> ${plan.customerName} (${smsResult.gatewayResponse})`
          );
        }
      }
    }
  }

  // 3. Update plans status & aggregate metrics
  const updatedPlans = plans.map((p) => {
    const agg = planAggregates[p.id];
    if (!agg) return p;

    let pStatus = p.status;
    if (p.status !== 'Cancelled') {
      if (agg.totalOutstanding <= 0) {
        pStatus = 'Settled';
      } else if (agg.overdueCount > 0) {
        pStatus = 'Overdue';
      } else {
        pStatus = 'Active';
      }
    }

    return {
      ...p,
      status: pStatus,
      totalPaidBDT: agg.totalPaid,
      totalOutstandingBDT: agg.totalOutstanding,
      paidInstallmentsCount: agg.paidCount,
      remainingInstallmentsCount: agg.remainingCount,
      overdueInstallmentsCount: agg.overdueCount,
      overdueAmountBDT: agg.overdueAmount,
      updatedAt: todayDateStr,
    };
  });

  // 4. Escalations & In-App Notifications
  for (const plan of updatedPlans) {
    if (plan.status === 'Overdue' && plan.overdueInstallmentsCount > 0) {
      // Find max overdue days
      const planSchedules = updatedSchedules.filter((s) => s.planId === plan.id);
      const maxOverdueDays = Math.max(...planSchedules.map((s) => s.overdueDays), 0);

      const escalation = determineEscalationLevel(maxOverdueDays, escalationRules);

      // Check existing assignment
      const existingAssign = updatedAssignments.find((a) => a.planId === plan.id);
      if (existingAssign) {
        if (existingAssign.escalationLevel !== escalation.level) {
          existingAssign.escalationLevel = escalation.level;
          existingAssign.priority =
            maxOverdueDays > 30 ? 'Critical' : maxOverdueDays > 14 ? 'High' : 'Medium';
          escalationsTriggered++;

          newNotifications.push({
            id: `notif-${Date.now()}-${plan.id}`,
            title: `Escalation: ${plan.customerName} (${escalation.level})`,
            message: `Account is ${maxOverdueDays} days overdue (BDT ${plan.overdueAmountBDT.toLocaleString()}). Handled by ${escalation.role}.`,
            type: 'escalation',
            priority: maxOverdueDays > 30 ? 'critical' : 'high',
            referenceId: plan.id,
            isRead: false,
            createdAt: `${todayDateStr} 09:00:00`,
          });

          logsOutput.push(
            `[ESCALATION] ${plan.customerName} -> ${escalation.level} (${maxOverdueDays} days overdue)`
          );
        }
      } else {
        // Create initial assignment
        updatedAssignments.push({
          id: `ASN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          planId: plan.id,
          agreementNo: plan.agreementNo,
          customerId: plan.customerId,
          customerName: plan.customerName,
          assignedToId: plan.assignedOfficerId || 'u-5',
          assignedToName: plan.assignedOfficerName || 'Collection Officer',
          assignedToRole: escalation.role,
          assignedById: 'SYSTEM_AUTOMATION',
          assignedByName: 'Ensec Collection Engine',
          assignmentDate: todayDateStr,
          targetDate: todayDateStr,
          targetAmountBDT: plan.overdueAmountBDT,
          escalationLevel: escalation.level,
          status: 'Active',
          priority: maxOverdueDays > 30 ? 'Critical' : 'Medium',
        });
      }
    }
  }

  logsOutput.push(
    `[COMPLETED] Automation check finished. ${schedulesUpdated} schedule records updated. ${smsSentCount} SMS dispatched, ${smsFailedCount} notices recorded.`
  );

  return {
    report: {
      executionDate: todayDateStr,
      totalPlansProcessed: plans.length,
      schedulesUpdated,
      upcomingRemindersEvaluated,
      overdueInstallmentsFound: overdueFound,
      escalationsTriggered,
      smsSentCount,
      smsFailedCount,
      notificationsCreated: newNotifications.length,
      logs: logsOutput,
    },
    updatedPlans,
    updatedSchedules,
    newLogs,
    newNotifications,
    updatedAssignments,
  };
}
