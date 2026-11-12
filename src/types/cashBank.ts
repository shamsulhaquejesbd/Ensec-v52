/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ensec ERP - Cash & Bank Module Types
 * Double-entry accounting data models for Cash Book, Bank Book,
 * Opening Balances, Contra Transfers, Service Income, and Expenses.
 */

export type CashBankAccountType = 'Cash' | 'Bank';

export type CashBankTransactionType =
  | 'Opening Balance'
  | 'Sales Collection'
  | 'Service Income'
  | 'Operational Expense'
  | 'Cash to Bank Deposit'
  | 'Bank to Cash Withdrawal'
  | 'Reversal / Adjustment';

export type PaymentMethod = 'Cash' | 'Bank' | 'Cheque' | 'Online Transfer' | 'MFS (bKash/Nagad)';

export interface CashBankAccount {
  id: string;
  type: CashBankAccountType;
  name: string;
  accountNumber?: string;
  bankName?: string;
  branchName?: string;
  routingNumber?: string;
  currency: string;
  currentBalanceBDT: number;
  openingBalanceBDT: number;
  openingDate: string;
  status: 'Active' | 'Inactive';
  isDefault?: boolean;
  remarks?: string;
}

export interface CashBankTransaction {
  id: string;
  voucherNo: string;
  date: string;
  type: CashBankTransactionType;
  accountType: CashBankAccountType;
  accountId: string;
  accountName: string;
  targetAccountId?: string;
  targetAccountName?: string;
  category: string;
  partyName?: string; // Customer, Client, Vendor, Employee, Service Recipient
  serviceRef?: string;
  invoiceNo?: string;
  salesOrderId?: string;
  referenceNo: string; // Slip No, Cheque No, Transaction ID
  description: string;
  debit: number; // Money In / Inflow
  credit: number; // Money Out / Outflow
  amount: number;
  runningBalance: number;
  attachmentUrl?: string;
  attachmentName?: string;
  remarks?: string;
  createdBy: string;
  status: 'Posted' | 'Reversed';
  isContra?: boolean;
  reversalOfId?: string;
  reversalReason?: string;
  createdAt: string;
}

export interface OpeningBalanceConfig {
  id: string;
  accountType: CashBankAccountType;
  accountId: string;
  accountName: string;
  openingDate: string;
  initialBalance: number;
  remarks: string;
  configuredBy: string;
  configuredAt: string;
}

export interface ExpenseCategoryDef {
  id: string;
  name: string;
  code: string;
  isSystem: boolean;
  description?: string;
}

export interface ServiceIncomeCategoryDef {
  id: string;
  name: string;
  code: string;
  isSystem: boolean;
  description?: string;
}

export interface CashBankSummaryKPIs {
  totalOpeningCash: number;
  totalOpeningBank: number;
  totalOpeningCombined: number;
  totalCashReceived: number;
  totalCashPaid: number;
  totalBankDeposits: number;
  totalBankWithdrawals: number;
  currentCashBalance: number;
  currentBankBalance: number;
  combinedCashBankBalance: number;
  todayIncome: number;
  todayExpense: number;
  todayNetFlow: number;
  monthIncome: number;
  monthExpense: number;
  monthNetFlow: number;
}
