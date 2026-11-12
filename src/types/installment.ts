/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ensec ERP - Installment, Receivables & Automated Collection Engine
 */

export type InstallmentFrequency = 'Monthly' | 'Quarterly' | 'Bi-weekly';

export type InstallmentPlanStatus =
  | 'Active'
  | 'Settled'
  | 'Overdue'
  | 'Defaulted'
  | 'Cancelled';

export type InstallmentScheduleStatus =
  | 'Paid'
  | 'Partial'
  | 'Upcoming'
  | 'Due Today'
  | 'Overdue';

export type PaymentMethod =
  | 'Cash'
  | 'Bank Transfer'
  | 'Cheque'
  | 'bKash'
  | 'Nagad';

export type PaymentType =
  | 'Full Installment'
  | 'Partial'
  | 'Advance'
  | 'Multiple Installments'
  | 'Early Settlement';

export interface InstallmentPlan {
  id: string; // e.g. "INS-2026-001"
  agreementNo: string; // e.g. "ENS-AGR-1001"
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerDistrict: string;
  distributorId?: string;
  distributorName?: string;
  salesOrderId?: string;
  invoiceReference: string;
  productId: string;
  productName: string;
  productModel: string;
  quantity: number;
  totalProductPriceBDT: number;
  downPaymentBDT: number;
  financedAmountBDT: number;
  durationMonths: number; // 12, 24, 36, 48, 60 or custom
  interestRatePercent: number; // 0% or flat rate
  totalInterestBDT: number;
  totalPayableBDT: number;
  monthlyInstallmentBDT: number;
  startDate: string; // YYYY-MM-DD
  firstDueDate: string; // YYYY-MM-DD
  paymentFrequency: InstallmentFrequency;
  status: InstallmentPlanStatus;
  totalPaidBDT: number;
  totalOutstandingBDT: number;
  paidInstallmentsCount: number;
  remainingInstallmentsCount: number;
  overdueInstallmentsCount: number;
  overdueAmountBDT: number;
  guarantorName?: string;
  guarantorPhone?: string;
  guarantorNID?: string;
  guarantorAddress?: string;
  remarks?: string;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InstallmentSchedule {
  id: string; // e.g. "SCH-1001-01"
  planId: string;
  agreementNo: string;
  installmentNumber: number; // 1 to N
  dueDate: string; // YYYY-MM-DD
  dueAmountBDT: number;
  principalAmountBDT: number;
  interestAmountBDT: number;
  paidAmountBDT: number;
  remainingAmountBDT: number;
  status: InstallmentScheduleStatus;
  paymentDate?: string;
  overdueDays: number;
  lateFeeBDT: number;
  lastReminderSentAt?: string;
  lastReminderRuleId?: string;
}

export interface InstallmentPaymentAllocation {
  id: string;
  paymentId: string;
  scheduleId: string;
  installmentNumber: number;
  allocatedAmountBDT: number;
  principalPortionBDT: number;
  interestPortionBDT: number;
  isFullyCleared: boolean;
}

export interface InstallmentPayment {
  id: string; // e.g. "PAY-INS-001"
  paymentReceiptNo: string; // e.g. "RCP-2026-089"
  planId: string;
  agreementNo: string;
  customerId: string;
  customerName: string;
  amountBDT: number;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  bankAccountId?: string;
  bankAccountName?: string;
  transactionReference: string;
  paymentDate: string;
  receivedById: string;
  receivedByName: string;
  notes?: string;
  allocations: InstallmentPaymentAllocation[];
  createdAt: string;
}

export type CollectionActivityType =
  | 'Phone Call'
  | 'SMS Sent'
  | 'WhatsApp Contact'
  | 'Customer Visit'
  | 'Payment Commitment'
  | 'Payment Received'
  | 'Customer Unreachable'
  | 'Dispute/Complaint';

export type FollowUpStatus =
  | 'Pending'
  | 'Completed'
  | 'Broken Commitment'
  | 'Rescheduled';

export interface CollectionFollowUp {
  id: string;
  planId: string;
  agreementNo: string;
  customerId: string;
  customerName: string;
  contactPerson: string;
  contactPhone: string;
  activityType: CollectionActivityType;
  followUpDate: string; // YYYY-MM-DD
  nextFollowUpDate?: string; // YYYY-MM-DD
  committedAmountBDT?: number;
  committedPaymentDate?: string;
  notes: string;
  performedById: string;
  performedByName: string;
  status: FollowUpStatus;
  createdAt: string;
}

export type EscalationLevel =
  | 'Level 1 (Officer)'
  | 'Level 2 (ASM)'
  | 'Level 3 (RM)'
  | 'Level 4 (Head Office)';

export interface CollectionAssignment {
  id: string;
  planId: string;
  agreementNo: string;
  customerId: string;
  customerName: string;
  assignedToId: string;
  assignedToName: string;
  assignedToRole: string;
  assignedById: string;
  assignedByName: string;
  assignmentDate: string;
  targetDate: string;
  targetAmountBDT: number;
  escalationLevel: EscalationLevel;
  status: 'Active' | 'Completed' | 'Reassigned';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface CollectionEscalationRule {
  id: string;
  level: number;
  name: string;
  minOverdueDays: number;
  maxOverdueDays: number;
  escalateToRole: string;
  actionRequired: string;
  autoNotification: boolean;
}

export interface SMSTemplate {
  id: string;
  templateCode: string;
  name: string;
  category: 'Upcoming Reminder' | 'Due Date' | 'Overdue' | 'Confirmation' | 'Notice';
  body: string;
  availableVariables: string[];
  status: 'Active' | 'Inactive';
  updatedAt: string;
}

export type SMSTriggerType =
  | 'days_before_due'
  | 'on_due_date'
  | 'days_after_due'
  | 'payment_received';

export interface SMSAutomationRule {
  id: string;
  ruleCode: string;
  name: string;
  triggerType: SMSTriggerType;
  triggerDays: number; // e.g. -7, -3, -1, 0, 1, 7, 15
  templateId: string;
  enabled: boolean;
  channel: 'SMS' | 'SMS + WhatsApp';
  description: string;
}

export interface SMSLog {
  id: string;
  recipientPhone: string;
  recipientName: string;
  message: string;
  templateCode?: string;
  ruleId?: string;
  planId?: string;
  agreementNo?: string;
  status: 'Delivered' | 'Sent' | 'Failed' | 'Pending';
  gatewayResponse?: string;
  sentAt: string;
  retryCount: number;
}

export interface SMSGatewaySettings {
  provider: 'greenweb' | 'onnorokom' | 'banglalink' | 'grameenphone' | 'twilio' | 'generic';
  apiUrl: string;
  apiKey: string;
  senderId: string;
  clientId?: string;
  isConfigured: boolean;
  lastTestedAt?: string;
  testStatus?: 'Success' | 'Failed' | 'Untested';
  dailyLimit: number;
  sentToday: number;
}

export interface InstallmentNotification {
  id: string;
  title: string;
  message: string;
  type:
    | 'upcoming_due'
    | 'overdue'
    | 'followup_due'
    | 'commitment_missed'
    | 'payment_received'
    | 'escalation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  referenceId?: string; // planId or agreementNo
  isRead: boolean;
  createdAt: string;
}

export interface EarlySettlementCalculation {
  planId: string;
  agreementNo: string;
  customerName: string;
  unpaidPrincipalBDT: number;
  remainingInterestBDT: number;
  totalRemainingScheduleBDT: number;
  rebatePercentage: number;
  rebateAmountBDT: number;
  settlementNetPayableBDT: number;
  unpaidInstallmentsCount: number;
}
