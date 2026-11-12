/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ensec ERP - Installment, Collection, SMS & Gateway Configuration & Clean Initial States
 */

import {
  InstallmentPlan,
  InstallmentSchedule,
  InstallmentPayment,
  CollectionAssignment,
  CollectionFollowUp,
  CollectionEscalationRule,
  SMSTemplate,
  SMSAutomationRule,
  SMSLog,
  SMSGatewaySettings,
  InstallmentNotification,
} from '../types/installment.ts';

export const INITIAL_SMS_TEMPLATES: SMSTemplate[] = [
  {
    id: 'tmpl-1',
    templateCode: 'UPCOMING_REMINDER',
    name: 'Upcoming Installment Reminder (7d/3d/1d)',
    category: 'Upcoming Reminder',
    body: 'Dear {CustomerName}, your installment payment of BDT {DueAmount} for Agreement {AgreementNo} is due on {DueDate}. Please make your payment on time. Thank you, Ensec Lithium Batteries.',
    availableVariables: ['{CustomerName}', '{DueAmount}', '{AgreementNo}', '{DueDate}', '{RemainingAmount}'],
    status: 'Active',
    updatedAt: '2026-10-25',
  },
  {
    id: 'tmpl-2',
    templateCode: 'DUE_DATE_REMINDER',
    name: 'Payment Due Today Notification',
    category: 'Due Date',
    body: 'Dear {CustomerName}, this is a reminder that your installment of BDT {DueAmount} for Agreement {AgreementNo} is due today ({DueDate}). Please complete your payment. Ensec.',
    availableVariables: ['{CustomerName}', '{DueAmount}', '{AgreementNo}', '{DueDate}'],
    status: 'Active',
    updatedAt: '2026-10-25',
  },
  {
    id: 'tmpl-3',
    templateCode: 'OVERDUE_REMINDER',
    name: 'Overdue Installment Notice (1d/7d)',
    category: 'Overdue',
    body: 'Dear {CustomerName}, your installment payment of BDT {OutstandingAmount} was due on {DueDate} and is currently overdue by {OverdueDays} days. Kindly clear your outstanding amount. Ensec.',
    availableVariables: ['{CustomerName}', '{OutstandingAmount}', '{DueDate}', '{OverdueDays}', '{AgreementNo}'],
    status: 'Active',
    updatedAt: '2026-10-26',
  },
  {
    id: 'tmpl-4',
    templateCode: 'URGENT_OVERDUE_NOTICE',
    name: 'Urgent Overdue Escalation (15d+)',
    category: 'Notice',
    body: 'URGENT: Dear {CustomerName}, your account {AgreementNo} is {OverdueDays} days overdue with outstanding BDT {OutstandingAmount}. Please contact your assigned officer immediately to avoid supply hold. Ensec.',
    availableVariables: ['{CustomerName}', '{OutstandingAmount}', '{OverdueDays}', '{AgreementNo}'],
    status: 'Active',
    updatedAt: '2026-10-26',
  },
  {
    id: 'tmpl-5',
    templateCode: 'PAYMENT_CONFIRMATION',
    name: 'Payment Receipt Confirmation',
    category: 'Confirmation',
    body: 'Dear {CustomerName}, we have successfully received BDT {PaidAmount} against your installment agreement {AgreementNo}. Your remaining outstanding balance is BDT {OutstandingAmount}. Thank you, Ensec.',
    availableVariables: ['{CustomerName}', '{PaidAmount}', '{AgreementNo}', '{OutstandingAmount}', '{ReceiptNo}'],
    status: 'Active',
    updatedAt: '2026-10-25',
  },
];

export const INITIAL_SMS_AUTOMATION_RULES: SMSAutomationRule[] = [
  {
    id: 'rule-1',
    ruleCode: 'RULE_PRE_7D',
    name: '7 Days Before Due Date',
    triggerType: 'days_before_due',
    triggerDays: -7,
    templateId: 'tmpl-1',
    enabled: true,
    channel: 'SMS',
    description: 'Advance reminder sent 7 days prior to installment due date.',
  },
  {
    id: 'rule-2',
    ruleCode: 'RULE_PRE_3D',
    name: '3 Days Before Due Date',
    triggerType: 'days_before_due',
    triggerDays: -3,
    templateId: 'tmpl-1',
    enabled: true,
    channel: 'SMS',
    description: 'Follow-up reminder sent 3 days before payment deadline.',
  },
  {
    id: 'rule-3',
    ruleCode: 'RULE_PRE_1D',
    name: '1 Day Before Due Date',
    triggerType: 'days_before_due',
    triggerDays: -1,
    templateId: 'tmpl-1',
    enabled: true,
    channel: 'SMS',
    description: 'Final advance alert sent the day before due date.',
  },
  {
    id: 'rule-4',
    ruleCode: 'RULE_ON_DUE',
    name: 'On Due Date Alert',
    triggerType: 'on_due_date',
    triggerDays: 0,
    templateId: 'tmpl-2',
    enabled: true,
    channel: 'SMS + WhatsApp',
    description: 'Notification dispatched in morning on the actual due date.',
  },
  {
    id: 'rule-5',
    ruleCode: 'RULE_POST_1D',
    name: '1 Day Overdue Notification',
    triggerType: 'days_after_due',
    triggerDays: 1,
    templateId: 'tmpl-3',
    enabled: true,
    channel: 'SMS',
    description: 'First grace period notice for unpaid installment.',
  },
  {
    id: 'rule-6',
    ruleCode: 'RULE_POST_7D',
    name: '7 Days Overdue Notice',
    triggerType: 'days_after_due',
    triggerDays: 7,
    templateId: 'tmpl-3',
    enabled: true,
    channel: 'SMS + WhatsApp',
    description: 'Second overdue reminder & prompt to call regional manager.',
  },
  {
    id: 'rule-7',
    ruleCode: 'RULE_POST_15D',
    name: '15 Days Overdue Urgent Notice',
    triggerType: 'days_after_due',
    triggerDays: 15,
    templateId: 'tmpl-4',
    enabled: true,
    channel: 'SMS + WhatsApp',
    description: 'Escalated alert regarding default status & credit freeze.',
  },
  {
    id: 'rule-8',
    ruleCode: 'RULE_PAYMENT_CONFIRM',
    name: 'Payment Confirmation Receipt',
    triggerType: 'payment_received',
    triggerDays: 0,
    templateId: 'tmpl-5',
    enabled: true,
    channel: 'SMS',
    description: 'Instant SMS dispatched right after a payment voucher is recorded.',
  },
];

export const INITIAL_ESCALATION_RULES: CollectionEscalationRule[] = [
  {
    id: 'esc-1',
    level: 1,
    name: 'Level 1: Routine Follow-up',
    minOverdueDays: 1,
    maxOverdueDays: 7,
    escalateToRole: 'Collection Officer',
    actionRequired: 'Automated SMS, phone check-in and friendly reminder call.',
    autoNotification: true,
  },
  {
    id: 'esc-2',
    level: 2,
    name: 'Level 2: Field Intervention',
    minOverdueDays: 8,
    maxOverdueDays: 15,
    escalateToRole: 'Area Sales Manager',
    actionRequired: 'Field inspection visit, in-person meeting, and formal payment commitment.',
    autoNotification: true,
  },
  {
    id: 'esc-3',
    level: 3,
    name: 'Level 3: Executive Escalation',
    minOverdueDays: 16,
    maxOverdueDays: 30,
    escalateToRole: 'Regional Manager',
    actionRequired: 'Hold new credit sales, issue formal demand letter, and arrange regional review.',
    autoNotification: true,
  },
  {
    id: 'esc-4',
    level: 4,
    name: 'Level 4: Legal & Head Office Recovery',
    minOverdueDays: 31,
    maxOverdueDays: 999,
    escalateToRole: 'Accounts Manager / Head Office',
    actionRequired: 'Guarantor notice, security cheque deposit, legal counsel referral & battery repossession notice.',
    autoNotification: true,
  },
];

export const INITIAL_GATEWAY_SETTINGS: SMSGatewaySettings = {
  provider: 'greenweb',
  apiUrl: 'https://api.greenweb.com.bd/api.php',
  apiKey: '',
  senderId: 'ENSEC_BD',
  clientId: 'ENSEC-CORP',
  isConfigured: false,
  testStatus: 'Untested',
  dailyLimit: 1000,
  sentToday: 0,
};

// Clean initial installment & collection states (No dummy or test seed data)
export const INITIAL_INSTALLMENT_PLANS: InstallmentPlan[] = [];
export const INITIAL_INSTALLMENT_SCHEDULES: InstallmentSchedule[] = [];
export const INITIAL_INSTALLMENT_PAYMENTS: InstallmentPayment[] = [];
export const INITIAL_COLLECTION_ASSIGNMENTS: CollectionAssignment[] = [];
export const INITIAL_COLLECTION_FOLLOWUPS: CollectionFollowUp[] = [];
export const INITIAL_SMS_LOGS: SMSLog[] = [];
export const INITIAL_INSTALLMENT_NOTIFICATIONS: InstallmentNotification[] = [];
