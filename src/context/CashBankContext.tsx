/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ensec ERP - Cash & Bank Context Engine
 * Comprehensive Double-Entry Ledger, Opening Balances, Contra Transfers,
 * Automatic Sales Posting, Service Income, and Expense Management.
 */

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  CashBankAccount,
  CashBankTransaction,
  CashBankTransactionType,
  PaymentMethod,
  OpeningBalanceConfig,
  ExpenseCategoryDef,
  ServiceIncomeCategoryDef,
  CashBankSummaryKPIs,
} from '../types/cashBank.ts';
import {
  DEFAULT_CASH_BANK_ACCOUNTS,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_SERVICE_INCOME_CATEGORIES,
  DEFAULT_OPENING_BALANCES,
  INITIAL_CASH_BANK_TRANSACTIONS,
} from '../mock/cashBankData.ts';
import { useERP } from './ERPContext.tsx';
import { SalesOrder } from '../types/erp.ts';

interface CashBankContextType {
  accounts: CashBankAccount[];
  transactions: CashBankTransaction[];
  openingBalances: OpeningBalanceConfig[];
  expenseCategories: ExpenseCategoryDef[];
  serviceCategories: ServiceIncomeCategoryDef[];
  kpis: CashBankSummaryKPIs;

  // Transaction Operations
  recordOpeningBalance: (
    config: Omit<OpeningBalanceConfig, 'id' | 'configuredAt' | 'configuredBy'>
  ) => { success: boolean; message: string };

  addServiceIncome: (incomeData: {
    date: string;
    category: string;
    partyName: string;
    serviceRef?: string;
    description: string;
    amount: number;
    paymentMethod: PaymentMethod;
    accountId: string;
    referenceNo: string;
    remarks?: string;
    attachmentUrl?: string;
    attachmentName?: string;
  }) => { success: boolean; message: string; transactionId?: string };

  addExpense: (expenseData: {
    date: string;
    category: string;
    paidTo: string;
    description: string;
    amount: number;
    paymentMethod: PaymentMethod;
    accountId: string;
    referenceNo: string;
    remarks?: string;
    attachmentUrl?: string;
    attachmentName?: string;
    allowNegativeOverride?: boolean;
  }) => { success: boolean; message: string; transactionId?: string; isNegativeWarning?: boolean };

  addCashToBankDeposit: (depositData: {
    date: string;
    fromCashAccountId: string;
    toBankAccountId: string;
    amount: number;
    depositSlipNumber: string;
    description?: string;
    remarks?: string;
    attachmentUrl?: string;
    attachmentName?: string;
    allowNegativeOverride?: boolean;
  }) => { success: boolean; message: string; transactionId?: string };

  addBankToCashWithdrawal: (withdrawalData: {
    date: string;
    fromBankAccountId: string;
    toCashAccountId: string;
    amount: number;
    bankReferenceNumber: string;
    description?: string;
    remarks?: string;
    allowNegativeOverride?: boolean;
  }) => { success: boolean; message: string; transactionId?: string };

  reverseTransaction: (
    transactionId: string,
    reason: string
  ) => { success: boolean; message: string };

  postSalesInvoiceCollection: (
    order: SalesOrder,
    paidAmount: number,
    paymentMethod: 'Cash' | 'Bank',
    targetAccountId: string,
    referenceNo: string,
    remarks?: string
  ) => { success: boolean; message: string; isDuplicate?: boolean };

  syncPendingSalesOrders: () => { syncedCount: number; alreadySyncedCount: number; message: string };

  // Category & Account Management
  addExpenseCategory: (name: string, description?: string) => { success: boolean; category?: ExpenseCategoryDef; message: string };
  addServiceCategory: (name: string, description?: string) => { success: boolean; category?: ServiceIncomeCategoryDef; message: string };
  addNewBankAccount: (
    bankData: Omit<CashBankAccount, 'id' | 'currentBalanceBDT'>
  ) => { success: boolean; id: string; message: string };
  updateAccountDetails: (accountId: string, updates: Partial<CashBankAccount>) => void;

  // Utility
  getAccountById: (id: string) => CashBankAccount | undefined;
  getAccountTransactions: (accountId: string) => CashBankTransaction[];
  isInvoiceAlreadyPosted: (invoiceOrOrderId: string) => boolean;
  resetToDefaultSampleData: () => void;
}

const CashBankContext = createContext<CashBankContextType | undefined>(undefined);

export const CashBankProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, addAuditLog, salesOrders, cashBook } = useERP();

  // 1. Accounts State
  const [accounts, setAccounts] = useState<CashBankAccount[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ensec_cash_bank_accounts');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const hasSampleBalances = parsed.some((a: CashBankAccount) =>
              a.openingBalanceBDT === 500000 || a.openingBalanceBDT === 6540000 || a.openingBalanceBDT === 3200000
            );
            if (!hasSampleBalances) {
              return parsed;
            } else {
              localStorage.removeItem('ensec_cash_bank_accounts');
            }
          }
        }
      } catch (e) {
        console.warn('Failed to parse stored cash bank accounts', e);
      }
    }
    return DEFAULT_CASH_BANK_ACCOUNTS;
  });

  // 2. Transactions Ledger State
  const [transactions, setTransactions] = useState<CashBankTransaction[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ensec_cash_bank_transactions');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const realTransactions = parsed.filter((t: CashBankTransaction) =>
              !t.id.startsWith('cbt-op-') &&
              !t.id.startsWith('cbt-sal-') &&
              !t.id.startsWith('cbt-srv-') &&
              !t.id.startsWith('cbt-exp-') &&
              !t.id.startsWith('cbt-trans-') &&
              !t.id.startsWith('cbt-with-')
            );
            return realTransactions;
          }
        }
      } catch (e) {
        console.warn('Failed to parse stored cash bank transactions', e);
      }
    }
    return INITIAL_CASH_BANK_TRANSACTIONS;
  });

  // 3. Opening Balances State
  const [openingBalances, setOpeningBalances] = useState<OpeningBalanceConfig[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ensec_opening_balances');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const realOpenings = parsed.filter((o: OpeningBalanceConfig) => !o.id.startsWith('op-cash-') && !o.id.startsWith('op-bank-'));
            return realOpenings;
          }
        }
      } catch (e) {
        console.warn('Failed to parse stored opening balances', e);
      }
    }
    return DEFAULT_OPENING_BALANCES;
  });

  // 4. Expense Categories State
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategoryDef[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ensec_expense_categories');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.warn('Failed to parse stored expense categories', e);
      }
    }
    return DEFAULT_EXPENSE_CATEGORIES;
  });

  // 5. Service Categories State
  const [serviceCategories, setServiceCategories] = useState<ServiceIncomeCategoryDef[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ensec_service_categories');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.warn('Failed to parse stored service categories', e);
      }
    }
    return DEFAULT_SERVICE_INCOME_CATEGORIES;
  });

  // LocalStorage Persistence
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ensec_cash_bank_accounts', JSON.stringify(accounts));
    }
  }, [accounts]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ensec_cash_bank_transactions', JSON.stringify(transactions));
    }
  }, [transactions]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ensec_opening_balances', JSON.stringify(openingBalances));
    }
  }, [openingBalances]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ensec_expense_categories', JSON.stringify(expenseCategories));
    }
  }, [expenseCategories]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ensec_service_categories', JSON.stringify(serviceCategories));
    }
  }, [serviceCategories]);

  // Recalculate account balances dynamically based on opening balances + all non-reversed transactions
  const recalculateAccountBalances = (
    currentAccounts: CashBankAccount[],
    currentTransactions: CashBankTransaction[]
  ): CashBankAccount[] => {
    return currentAccounts.map((acc) => {
      // Find opening balance
      const opening = acc.openingBalanceBDT || 0;

      // Filter transactions for this account that are not reversed
      const accountTxns = currentTransactions.filter(
        (t) => t.accountId === acc.id && t.status !== 'Reversed'
      );

      const netDelta = accountTxns.reduce((sum, t) => {
        // Debit increases Asset balance, Credit decreases Asset balance
        return sum + (Number(t.debit) || 0) - (Number(t.credit) || 0);
      }, 0);

      // Note: If opening balance is recorded as a transaction, we avoid double counting
      const hasOpeningTxn = accountTxns.some((t) => t.type === 'Opening Balance');
      const finalBalance = hasOpeningTxn ? netDelta : opening + netDelta;

      return {
        ...acc,
        currentBalanceBDT: finalBalance,
      };
    });
  };

  // Helper to get account by ID
  const getAccountById = (id: string) => {
    return accounts.find((a) => a.id === id);
  };

  // Helper to check if an invoice is already posted
  const isInvoiceAlreadyPosted = (invoiceOrOrderId: string): boolean => {
    if (!invoiceOrOrderId) return false;
    const clean = invoiceOrOrderId.trim().toLowerCase();
    return transactions.some(
      (t) =>
        t.status !== 'Reversed' &&
        t.type === 'Sales Collection' &&
        (t.invoiceNo?.trim().toLowerCase() === clean ||
          t.salesOrderId?.trim().toLowerCase() === clean ||
          t.referenceNo?.trim().toLowerCase() === clean)
    );
  };

  // 1. Record Opening Balance
  const recordOpeningBalance = (
    config: Omit<OpeningBalanceConfig, 'id' | 'configuredAt' | 'configuredBy'>
  ) => {
    const account = accounts.find((a) => a.id === config.accountId);
    if (!account) {
      return { success: false, message: `Account not found for ID: ${config.accountId}` };
    }

    const now = new Date();
    const configId = `op-${config.accountId}-${Date.now().toString().slice(-4)}`;
    const newConfig: OpeningBalanceConfig = {
      ...config,
      id: configId,
      configuredAt: now.toISOString(),
      configuredBy: currentUser.name || 'Accounts Head',
    };

    // Update Opening Balance list
    const filteredConfigs = openingBalances.filter((o) => o.accountId !== config.accountId);
    const updatedConfigs = [newConfig, ...filteredConfigs];
    setOpeningBalances(updatedConfigs);

    // Update account opening balance
    const updatedAccounts = accounts.map((a) =>
      a.id === config.accountId
        ? {
            ...a,
            openingBalanceBDT: config.initialBalance,
            openingDate: config.openingDate,
            remarks: config.remarks || a.remarks,
          }
        : a
    );

    // Update or insert transaction for this Opening Balance
    const voucherNo = `OPN-${config.openingDate.replace(/-/g, '')}-${config.accountId.slice(-3).toUpperCase()}`;
    const existingOpTxnIndex = transactions.findIndex(
      (t) => t.type === 'Opening Balance' && t.accountId === config.accountId
    );

    const opTransaction: CashBankTransaction = {
      id: `cbt-op-${config.accountId}-${Date.now()}`,
      voucherNo,
      date: config.openingDate,
      type: 'Opening Balance',
      accountType: config.accountType,
      accountId: config.accountId,
      accountName: account.name,
      category: 'Opening Balance',
      partyName: 'Opening Equity / Initial Capital',
      referenceNo: `OPN-BAL-${config.accountId}`,
      description: `Opening balance configured for ${account.name}`,
      debit: config.initialBalance,
      credit: 0,
      amount: config.initialBalance,
      runningBalance: config.initialBalance,
      remarks: config.remarks,
      createdBy: currentUser.name || 'Authorized Accounts Manager',
      status: 'Posted',
      createdAt: now.toISOString(),
    };

    let updatedTxns: CashBankTransaction[];
    if (existingOpTxnIndex >= 0) {
      updatedTxns = [...transactions];
      updatedTxns[existingOpTxnIndex] = {
        ...updatedTxns[existingOpTxnIndex],
        date: config.openingDate,
        debit: config.initialBalance,
        amount: config.initialBalance,
        runningBalance: config.initialBalance,
        remarks: config.remarks,
      };
    } else {
      updatedTxns = [opTransaction, ...transactions];
    }

    const finalAccounts = recalculateAccountBalances(updatedAccounts, updatedTxns);
    setAccounts(finalAccounts);
    setTransactions(updatedTxns);

    addAuditLog(
      'CASH_BANK_OPENING_BALANCE_CONFIGURED',
      'Cash & Bank Module',
      `Configured opening balance for ${account.name} as BDT ${config.initialBalance.toLocaleString()} on ${config.openingDate}`
    );

    return {
      success: true,
      message: `Opening balance for ${account.name} successfully saved (BDT ${config.initialBalance.toLocaleString()})!`,
    };
  };

  // 2. Add Service Income
  const addServiceIncome = (incomeData: {
    date: string;
    category: string;
    partyName: string;
    serviceRef?: string;
    description: string;
    amount: number;
    paymentMethod: PaymentMethod;
    accountId: string;
    referenceNo: string;
    remarks?: string;
    attachmentUrl?: string;
    attachmentName?: string;
  }) => {
    if (!incomeData.amount || incomeData.amount <= 0) {
      return { success: false, message: 'Income amount must be greater than zero.' };
    }

    const account = accounts.find((a) => a.id === incomeData.accountId);
    if (!account) {
      return { success: false, message: 'Please select a valid cash or bank account.' };
    }

    const now = new Date();
    const voucherNo = `SRV-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}-${Date.now().toString().slice(-4)}`;
    const prevBalance = account.currentBalanceBDT || 0;
    const newRunning = prevBalance + incomeData.amount;

    const newTxn: CashBankTransaction = {
      id: `cbt-srv-${Date.now()}`,
      voucherNo,
      date: incomeData.date || now.toISOString().slice(0, 10),
      type: 'Service Income',
      accountType: account.type,
      accountId: account.id,
      accountName: account.name,
      category: incomeData.category,
      partyName: incomeData.partyName,
      serviceRef: incomeData.serviceRef,
      referenceNo: incomeData.referenceNo || voucherNo,
      description: incomeData.description,
      debit: incomeData.amount, // Inflow / Money in
      credit: 0,
      amount: incomeData.amount,
      runningBalance: newRunning,
      remarks: incomeData.remarks,
      attachmentUrl: incomeData.attachmentUrl,
      attachmentName: incomeData.attachmentName,
      createdBy: currentUser.name || 'Accounts Officer',
      status: 'Posted',
      createdAt: now.toISOString(),
    };

    const updatedTxns = [newTxn, ...transactions];
    const updatedAccounts = recalculateAccountBalances(accounts, updatedTxns);

    setTransactions(updatedTxns);
    setAccounts(updatedAccounts);

    addAuditLog(
      'SERVICE_INCOME_POSTED',
      'Cash & Bank Module',
      `Posted Service Income voucher ${voucherNo} of BDT ${incomeData.amount.toLocaleString()} from ${incomeData.partyName} into ${account.name} (${incomeData.category})`
    );

    return {
      success: true,
      message: `Service income of BDT ${incomeData.amount.toLocaleString()} received and posted into ${account.name}!`,
      transactionId: newTxn.id,
    };
  };

  // 3. Add Expense
  const addExpense = (expenseData: {
    date: string;
    category: string;
    paidTo: string;
    description: string;
    amount: number;
    paymentMethod: PaymentMethod;
    accountId: string;
    referenceNo: string;
    remarks?: string;
    attachmentUrl?: string;
    attachmentName?: string;
    allowNegativeOverride?: boolean;
  }) => {
    if (!expenseData.amount || expenseData.amount <= 0) {
      return { success: false, message: 'Expense amount must be greater than zero.' };
    }

    const account = accounts.find((a) => a.id === expenseData.accountId);
    if (!account) {
      return { success: false, message: 'Please select a valid cash or bank account.' };
    }

    // Negative Balance Check
    const currentBal = account.currentBalanceBDT || 0;
    if (currentBal < expenseData.amount && !expenseData.allowNegativeOverride) {
      return {
        success: false,
        isNegativeWarning: true,
        message: `Insufficient funds in ${account.name}. Current balance is BDT ${currentBal.toLocaleString()}, but expense amount is BDT ${expenseData.amount.toLocaleString()}. Please authorize negative balance or choose another account.`,
      };
    }

    const now = new Date();
    const voucherNo = `EXP-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}-${Date.now().toString().slice(-4)}`;
    const newRunning = currentBal - expenseData.amount;

    const newTxn: CashBankTransaction = {
      id: `cbt-exp-${Date.now()}`,
      voucherNo,
      date: expenseData.date || now.toISOString().slice(0, 10),
      type: 'Operational Expense',
      accountType: account.type,
      accountId: account.id,
      accountName: account.name,
      category: expenseData.category,
      partyName: expenseData.paidTo,
      referenceNo: expenseData.referenceNo || voucherNo,
      description: expenseData.description,
      debit: 0,
      credit: expenseData.amount, // Outflow / Money out
      amount: expenseData.amount,
      runningBalance: newRunning,
      remarks: expenseData.remarks,
      attachmentUrl: expenseData.attachmentUrl,
      attachmentName: expenseData.attachmentName,
      createdBy: currentUser.name || 'Accounts Officer',
      status: 'Posted',
      createdAt: now.toISOString(),
    };

    const updatedTxns = [newTxn, ...transactions];
    const updatedAccounts = recalculateAccountBalances(accounts, updatedTxns);

    setTransactions(updatedTxns);
    setAccounts(updatedAccounts);

    addAuditLog(
      'EXPENSE_POSTED',
      'Cash & Bank Module',
      `Posted Expense voucher ${voucherNo} of BDT ${expenseData.amount.toLocaleString()} paid to ${expenseData.paidTo} from ${account.name} (${expenseData.category})`
    );

    return {
      success: true,
      message: `Expense voucher ${voucherNo} of BDT ${expenseData.amount.toLocaleString()} successfully paid from ${account.name}!`,
      transactionId: newTxn.id,
    };
  };

  // 4. Cash to Bank Deposit (Contra)
  const addCashToBankDeposit = (depositData: {
    date: string;
    fromCashAccountId: string;
    toBankAccountId: string;
    amount: number;
    depositSlipNumber: string;
    description?: string;
    remarks?: string;
    attachmentUrl?: string;
    attachmentName?: string;
    allowNegativeOverride?: boolean;
  }) => {
    if (!depositData.amount || depositData.amount <= 0) {
      return { success: false, message: 'Deposit amount must be greater than zero.' };
    }

    const cashAccount = accounts.find((a) => a.id === depositData.fromCashAccountId);
    const bankAccount = accounts.find((a) => a.id === depositData.toBankAccountId);

    if (!cashAccount || cashAccount.type !== 'Cash') {
      return { success: false, message: 'Please select a valid source Cash account.' };
    }
    if (!bankAccount || bankAccount.type !== 'Bank') {
      return { success: false, message: 'Please select a valid destination Bank account.' };
    }

    if (cashAccount.currentBalanceBDT < depositData.amount && !depositData.allowNegativeOverride) {
      return {
        success: false,
        message: `Insufficient cash in ${cashAccount.name}. Available cash is BDT ${cashAccount.currentBalanceBDT.toLocaleString()}, attempted deposit is BDT ${depositData.amount.toLocaleString()}.`,
      };
    }

    const now = new Date();
    const voucherNo = `CONTRA-DEP-${now.getFullYear()}${Date.now().toString().slice(-4)}`;
    const depositSlip = depositData.depositSlipNumber?.trim() || `DEP-${Date.now().toString().slice(-5)}`;
    const desc = depositData.description || `Cash deposited from ${cashAccount.name} into ${bankAccount.name} per Deposit Slip #${depositSlip}`;

    // Double-entry Contra transaction pair:
    // 1) Credit Cash Account (Outflow)
    const cashOutTxn: CashBankTransaction = {
      id: `cbt-contra-out-${Date.now()}`,
      voucherNo,
      date: depositData.date || now.toISOString().slice(0, 10),
      type: 'Cash to Bank Deposit',
      accountType: 'Cash',
      accountId: cashAccount.id,
      accountName: cashAccount.name,
      targetAccountId: bankAccount.id,
      targetAccountName: bankAccount.name,
      category: 'Contra / Bank Deposit',
      partyName: 'Ensec Internal Contra Transfer',
      referenceNo: depositSlip,
      description: desc,
      debit: 0,
      credit: depositData.amount, // Cash decreased
      amount: depositData.amount,
      runningBalance: cashAccount.currentBalanceBDT - depositData.amount,
      remarks: depositData.remarks,
      attachmentUrl: depositData.attachmentUrl,
      attachmentName: depositData.attachmentName,
      createdBy: currentUser.name || 'Accounts Head',
      status: 'Posted',
      isContra: true,
      createdAt: now.toISOString(),
    };

    // 2) Debit Bank Account (Inflow)
    const bankInTxn: CashBankTransaction = {
      id: `cbt-contra-in-${Date.now() + 1}`,
      voucherNo: `${voucherNo}-B`,
      date: depositData.date || now.toISOString().slice(0, 10),
      type: 'Cash to Bank Deposit',
      accountType: 'Bank',
      accountId: bankAccount.id,
      accountName: bankAccount.name,
      targetAccountId: cashAccount.id,
      targetAccountName: cashAccount.name,
      category: 'Contra / Bank Deposit',
      partyName: 'Ensec Internal Contra Transfer',
      referenceNo: depositSlip,
      description: desc,
      debit: depositData.amount, // Bank increased
      credit: 0,
      amount: depositData.amount,
      runningBalance: bankAccount.currentBalanceBDT + depositData.amount,
      remarks: depositData.remarks,
      attachmentUrl: depositData.attachmentUrl,
      attachmentName: depositData.attachmentName,
      createdBy: currentUser.name || 'Accounts Head',
      status: 'Posted',
      isContra: true,
      createdAt: now.toISOString(),
    };

    const updatedTxns = [bankInTxn, cashOutTxn, ...transactions];
    const updatedAccounts = recalculateAccountBalances(accounts, updatedTxns);

    setTransactions(updatedTxns);
    setAccounts(updatedAccounts);

    addAuditLog(
      'CONTRA_CASH_TO_BANK_DEPOSIT',
      'Cash & Bank Module',
      `Transferred BDT ${depositData.amount.toLocaleString()} from ${cashAccount.name} to ${bankAccount.name} (Deposit Slip #${depositSlip}). Not recognized as income/expense.`
    );

    return {
      success: true,
      message: `Deposit of BDT ${depositData.amount.toLocaleString()} into ${bankAccount.name} confirmed (Voucher: ${voucherNo})!`,
      transactionId: voucherNo,
    };
  };

  // 5. Bank to Cash Withdrawal (Contra)
  const addBankToCashWithdrawal = (withdrawalData: {
    date: string;
    fromBankAccountId: string;
    toCashAccountId: string;
    amount: number;
    bankReferenceNumber: string;
    description?: string;
    remarks?: string;
    allowNegativeOverride?: boolean;
  }) => {
    if (!withdrawalData.amount || withdrawalData.amount <= 0) {
      return { success: false, message: 'Withdrawal amount must be greater than zero.' };
    }

    const bankAccount = accounts.find((a) => a.id === withdrawalData.fromBankAccountId);
    const cashAccount = accounts.find((a) => a.id === withdrawalData.toCashAccountId);

    if (!bankAccount || bankAccount.type !== 'Bank') {
      return { success: false, message: 'Please select a valid source Bank account.' };
    }
    if (!cashAccount || cashAccount.type !== 'Cash') {
      return { success: false, message: 'Please select a valid destination Cash account.' };
    }

    if (bankAccount.currentBalanceBDT < withdrawalData.amount && !withdrawalData.allowNegativeOverride) {
      return {
        success: false,
        message: `Insufficient funds in ${bankAccount.name}. Available balance is BDT ${bankAccount.currentBalanceBDT.toLocaleString()}, attempted withdrawal is BDT ${withdrawalData.amount.toLocaleString()}.`,
      };
    }

    const now = new Date();
    const voucherNo = `CONTRA-WDL-${now.getFullYear()}${Date.now().toString().slice(-4)}`;
    const bankRef = withdrawalData.bankReferenceNumber?.trim() || `CHQ-${Date.now().toString().slice(-5)}`;
    const desc = withdrawalData.description || `Cash withdrawn from ${bankAccount.name} to replenish ${cashAccount.name} (Ref/Cheque: ${bankRef})`;

    // Double-entry Contra transaction pair:
    // 1) Credit Bank Account (Outflow)
    const bankOutTxn: CashBankTransaction = {
      id: `cbt-with-out-${Date.now()}`,
      voucherNo,
      date: withdrawalData.date || now.toISOString().slice(0, 10),
      type: 'Bank to Cash Withdrawal',
      accountType: 'Bank',
      accountId: bankAccount.id,
      accountName: bankAccount.name,
      targetAccountId: cashAccount.id,
      targetAccountName: cashAccount.name,
      category: 'Contra / Cash Withdrawal',
      partyName: 'Ensec Internal Contra Transfer',
      referenceNo: bankRef,
      description: desc,
      debit: 0,
      credit: withdrawalData.amount, // Bank decreased
      amount: withdrawalData.amount,
      runningBalance: bankAccount.currentBalanceBDT - withdrawalData.amount,
      remarks: withdrawalData.remarks,
      createdBy: currentUser.name || 'Accounts Head',
      status: 'Posted',
      isContra: true,
      createdAt: now.toISOString(),
    };

    // 2) Debit Cash Account (Inflow)
    const cashInTxn: CashBankTransaction = {
      id: `cbt-with-in-${Date.now() + 1}`,
      voucherNo: `${voucherNo}-C`,
      date: withdrawalData.date || now.toISOString().slice(0, 10),
      type: 'Bank to Cash Withdrawal',
      accountType: 'Cash',
      accountId: cashAccount.id,
      accountName: cashAccount.name,
      targetAccountId: bankAccount.id,
      targetAccountName: bankAccount.name,
      category: 'Contra / Cash Withdrawal',
      partyName: 'Ensec Internal Contra Transfer',
      referenceNo: bankRef,
      description: desc,
      debit: withdrawalData.amount, // Cash increased
      credit: 0,
      amount: withdrawalData.amount,
      runningBalance: cashAccount.currentBalanceBDT + withdrawalData.amount,
      remarks: withdrawalData.remarks,
      createdBy: currentUser.name || 'Accounts Head',
      status: 'Posted',
      isContra: true,
      createdAt: now.toISOString(),
    };

    const updatedTxns = [cashInTxn, bankOutTxn, ...transactions];
    const updatedAccounts = recalculateAccountBalances(accounts, updatedTxns);

    setTransactions(updatedTxns);
    setAccounts(updatedAccounts);

    addAuditLog(
      'CONTRA_BANK_TO_CASH_WITHDRAWAL',
      'Cash & Bank Module',
      `Withdrew BDT ${withdrawalData.amount.toLocaleString()} from ${bankAccount.name} to ${cashAccount.name} (Ref #${bankRef}). Not recognized as income/expense.`
    );

    return {
      success: true,
      message: `Withdrawal of BDT ${withdrawalData.amount.toLocaleString()} successfully credited into ${cashAccount.name} (Voucher: ${voucherNo})!`,
      transactionId: voucherNo,
    };
  };

  // 6. Post Sales Invoice Collection (Automatic & Manual)
  const postSalesInvoiceCollection = (
    order: SalesOrder,
    paidAmount: number,
    paymentMethod: 'Cash' | 'Bank',
    targetAccountId: string,
    referenceNo: string,
    remarks?: string
  ) => {
    if (!paidAmount || paidAmount <= 0) {
      return { success: false, message: 'Collection amount must be greater than zero.' };
    }

    // Duplicate Check
    const cleanOrderNumber = order.orderNumber || order.id;
    const cleanInvoiceNumber = order.invoiceNumber || order.invoiceNo || cleanOrderNumber;

    const existingPosting = transactions.find(
      (t) =>
        t.status !== 'Reversed' &&
        t.type === 'Sales Collection' &&
        (t.salesOrderId === order.id ||
          t.invoiceNo === cleanInvoiceNumber ||
          t.referenceNo === referenceNo) &&
        t.amount === paidAmount
    );

    if (existingPosting) {
      return {
        success: false,
        isDuplicate: true,
        message: `Duplicate prevention: Order/Invoice ${cleanInvoiceNumber} already has a posted collection voucher (${existingPosting.voucherNo}) for BDT ${paidAmount.toLocaleString()}.`,
      };
    }

    const account = accounts.find((a) => a.id === targetAccountId) || accounts[0];
    const now = new Date();
    const voucherNo = `CB-SAL-${now.getFullYear()}${Date.now().toString().slice(-4)}`;

    const newTxn: CashBankTransaction = {
      id: `cbt-sal-${Date.now()}`,
      voucherNo,
      date: order.date || now.toISOString().slice(0, 10),
      type: 'Sales Collection',
      accountType: account.type,
      accountId: account.id,
      accountName: account.name,
      category: 'Finished Goods Sales Collection',
      partyName: order.customerName || order.distributorName || 'Client',
      invoiceNo: cleanInvoiceNumber,
      salesOrderId: order.id,
      referenceNo: referenceNo || cleanInvoiceNumber,
      description: `Sales collection against invoice ${cleanInvoiceNumber} (${order.customerName || 'Customer'})`,
      debit: paidAmount,
      credit: 0,
      amount: paidAmount,
      runningBalance: (account.currentBalanceBDT || 0) + paidAmount,
      remarks: remarks || `Order #${order.orderNumber} | Payment mode: ${paymentMethod}`,
      createdBy: currentUser.name || 'Sales Billing Desk',
      status: 'Posted',
      createdAt: now.toISOString(),
    };

    const updatedTxns = [newTxn, ...transactions];
    const updatedAccounts = recalculateAccountBalances(accounts, updatedTxns);

    setTransactions(updatedTxns);
    setAccounts(updatedAccounts);

    addAuditLog(
      'SALES_INVOICE_POSTED_TO_CASH_BANK',
      'Cash & Bank Module',
      `Posted collection BDT ${paidAmount.toLocaleString()} for Invoice ${cleanInvoiceNumber} into ${account.name} (Voucher ${voucherNo})`
    );

    return {
      success: true,
      message: `Sales collection of BDT ${paidAmount.toLocaleString()} posted to ${account.name}!`,
    };
  };

  // 7. Sync Pending Sales Orders into Cash & Bank
  const syncPendingSalesOrders = () => {
    let synced = 0;
    let alreadySynced = 0;
    const newTxnsToAppend: CashBankTransaction[] = [];

    const defaultCash = accounts.find((a) => a.type === 'Cash') || accounts[0];
    const defaultBank = accounts.find((a) => a.type === 'Bank') || accounts[1] || accounts[0];

    salesOrders.forEach((so) => {
      const paid = Number(so.paidAmountBDT) || 0;
      if (paid > 0) {
        const invNo = so.invoiceNumber || so.invoiceNo || so.orderNumber || so.id;
        const isAlreadyPosted = transactions.some(
          (t) =>
            t.status !== 'Reversed' &&
            t.type === 'Sales Collection' &&
            (t.salesOrderId === so.id || t.invoiceNo === invNo || t.referenceNo === so.orderNumber)
        );

        if (isAlreadyPosted) {
          alreadySynced++;
        } else {
          // Determine account based on so.paymentMethod
          const methodLower = (so.paymentMethod || '').toLowerCase();
          const isBank = methodLower.includes('bank') || methodLower.includes('cheque') || methodLower.includes('ebl') || methodLower.includes('city');
          const targetAcc = isBank ? defaultBank : defaultCash;

          const voucherNo = `CB-SYNC-${so.orderNumber.slice(-4)}-${Date.now().toString().slice(-3)}`;
          const txn: CashBankTransaction = {
            id: `cbt-sync-${so.id}-${Date.now()}`,
            voucherNo,
            date: so.date || new Date().toISOString().slice(0, 10),
            type: 'Sales Collection',
            accountType: targetAcc.type,
            accountId: targetAcc.id,
            accountName: targetAcc.name,
            category: 'Finished Goods Sales Collection',
            partyName: so.customerName || 'Customer',
            invoiceNo: invNo,
            salesOrderId: so.id,
            referenceNo: so.orderNumber,
            description: `Auto-posted invoice collection for order ${so.orderNumber} (${so.customerName})`,
            debit: paid,
            credit: 0,
            amount: paid,
            runningBalance: (targetAcc.currentBalanceBDT || 0) + paid,
            remarks: `Payment Method: ${so.paymentMethod || 'Cash'}`,
            createdBy: 'System Auto-Post Engine',
            status: 'Posted',
            createdAt: new Date().toISOString(),
          };
          newTxnsToAppend.push(txn);
          synced++;
        }
      }
    });

    if (newTxnsToAppend.length > 0) {
      const updatedTxns = [...newTxnsToAppend, ...transactions];
      const updatedAccounts = recalculateAccountBalances(accounts, updatedTxns);
      setTransactions(updatedTxns);
      setAccounts(updatedAccounts);

      addAuditLog(
        'SALES_ORDERS_AUTO_SYNCED_TO_CASH_BANK',
        'Cash & Bank Module',
        `Auto-synced ${synced} sales invoice collections into Cash & Bank ledgers.`
      );
    }

    return {
      syncedCount: synced,
      alreadySyncedCount: alreadySynced,
      message:
        synced > 0
          ? `Successfully synchronized ${synced} sales collections into Cash & Bank! (${alreadySynced} were already up to date).`
          : `All ${alreadySynced} sales orders are already synchronized with Cash & Bank ledgers. No duplicate postings made.`,
    };
  };

  // 8. Reversal Entry (Accounting Rule #8: transactions cannot be directly deleted)
  const reverseTransaction = (transactionId: string, reason: string) => {
    const targetTxn = transactions.find((t) => t.id === transactionId);
    if (!targetTxn) {
      return { success: false, message: 'Transaction not found.' };
    }
    if (targetTxn.status === 'Reversed') {
      return { success: false, message: 'This transaction has already been reversed.' };
    }
    if (!reason || reason.trim().length < 5) {
      return { success: false, message: 'Please provide a clear justification reason for reversing this financial entry (minimum 5 characters).' };
    }

    const now = new Date();
    const reversalVoucherNo = `REV-${targetTxn.voucherNo}`;

    // Create the mirroring opposite entry
    const reversalTxn: CashBankTransaction = {
      id: `cbt-rev-${Date.now()}`,
      voucherNo: reversalVoucherNo,
      date: now.toISOString().slice(0, 10),
      type: 'Reversal / Adjustment',
      accountType: targetTxn.accountType,
      accountId: targetTxn.accountId,
      accountName: targetTxn.accountName,
      category: `Reversal: ${targetTxn.category}`,
      partyName: targetTxn.partyName,
      referenceNo: `REV-FOR-${targetTxn.voucherNo}`,
      description: `Correction / Reversal of voucher ${targetTxn.voucherNo}. Reason: ${reason}`,
      // Mirror debit and credit:
      debit: targetTxn.credit, // If original was credit (outflow), debit it back
      credit: targetTxn.debit, // If original was debit (inflow), credit it back
      amount: targetTxn.amount,
      runningBalance: 0, // Recalculated
      remarks: `Audited Reversal authorized by ${currentUser.name || 'Admin'}. Reason: ${reason}`,
      createdBy: currentUser.name || 'Authorized Auditor',
      status: 'Posted',
      reversalOfId: targetTxn.id,
      reversalReason: reason,
      createdAt: now.toISOString(),
    };

    // Mark original transaction as reversed
    const updatedTxns = transactions.map((t) =>
      t.id === transactionId
        ? {
            ...t,
            status: 'Reversed' as const,
            reversalOfId: reversalTxn.id,
            reversalReason: reason,
          }
        : t
    );

    const finalTxns = [reversalTxn, ...updatedTxns];
    const finalAccounts = recalculateAccountBalances(accounts, finalTxns);

    setTransactions(finalTxns);
    setAccounts(finalAccounts);

    addAuditLog(
      'TRANSACTION_REVERSED',
      'Cash & Bank Module',
      `Reversed financial voucher ${targetTxn.voucherNo} (${targetTxn.accountName}). Reversal Voucher: ${reversalVoucherNo}. Reason: ${reason}`
    );

    return {
      success: true,
      message: `Voucher ${targetTxn.voucherNo} successfully reversed with adjustment entry ${reversalVoucherNo}!`,
    };
  };

  // 9. Add Expense Category
  const addExpenseCategory = (name: string, description?: string) => {
    if (!name.trim()) return { success: false, message: 'Category name is required' };
    const exists = expenseCategories.some((c) => c.name.toLowerCase() === name.trim().toLowerCase());
    if (exists) return { success: false, message: 'Expense category already exists' };

    const newCat: ExpenseCategoryDef = {
      id: `exp-cat-${Date.now()}`,
      code: `EXP-${name.slice(0, 4).toUpperCase()}`,
      name: name.trim(),
      isSystem: false,
      description: description?.trim() || `Configured expense category`,
    };

    setExpenseCategories((prev) => [...prev, newCat]);
    addAuditLog('EXPENSE_CATEGORY_CREATED', 'Cash & Bank Module', `Created custom expense category: ${name}`);
    return { success: true, category: newCat, message: `Category "${name}" added successfully!` };
  };

  // 10. Add Service Income Category
  const addServiceCategory = (name: string, description?: string) => {
    if (!name.trim()) return { success: false, message: 'Category name is required' };
    const exists = serviceCategories.some((c) => c.name.toLowerCase() === name.trim().toLowerCase());
    if (exists) return { success: false, message: 'Service category already exists' };

    const newCat: ServiceIncomeCategoryDef = {
      id: `inc-cat-${Date.now()}`,
      code: `INC-${name.slice(0, 4).toUpperCase()}`,
      name: name.trim(),
      isSystem: false,
      description: description?.trim() || `Configured service category`,
    };

    setServiceCategories((prev) => [...prev, newCat]);
    addAuditLog('SERVICE_CATEGORY_CREATED', 'Cash & Bank Module', `Created custom service income category: ${name}`);
    return { success: true, category: newCat, message: `Category "${name}" added successfully!` };
  };

  // 11. Add New Bank Account
  const addNewBankAccount = (
    bankData: Omit<CashBankAccount, 'id' | 'currentBalanceBDT'>
  ) => {
    const id = `bank-${Date.now().toString().slice(-4)}`;
    const newAcc: CashBankAccount = {
      ...bankData,
      id,
      currentBalanceBDT: bankData.openingBalanceBDT || 0,
      currency: bankData.currency || 'BDT',
      status: 'Active',
    };

    const updatedAccounts = [...accounts, newAcc];
    setAccounts(updatedAccounts);

    // If opening balance > 0, record opening balance config and transaction
    if (newAcc.openingBalanceBDT > 0) {
      recordOpeningBalance({
        accountType: 'Bank',
        accountId: id,
        accountName: newAcc.name,
        openingDate: newAcc.openingDate || new Date().toISOString().slice(0, 10),
        initialBalance: newAcc.openingBalanceBDT,
        remarks: newAcc.remarks || 'Initial bank account creation opening balance',
      });
    }

    addAuditLog(
      'BANK_ACCOUNT_CREATED',
      'Cash & Bank Module',
      `Configured bank account ${newAcc.name} (${newAcc.accountNumber || 'N/A'}) with opening balance BDT ${newAcc.openingBalanceBDT.toLocaleString()}`
    );

    return {
      success: true,
      id,
      message: `Bank Account "${newAcc.name}" successfully created!`,
    };
  };

  // 12. Update Account Details
  const updateAccountDetails = (accountId: string, updates: Partial<CashBankAccount>) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === accountId ? { ...a, ...updates } : a))
    );
  };

  // 13. Get Account Transactions
  const getAccountTransactions = (accountId: string) => {
    return transactions.filter((t) => t.accountId === accountId || t.targetAccountId === accountId);
  };

  // 14. Reset to Default Sample Data
  const resetToDefaultSampleData = () => {
    setAccounts(DEFAULT_CASH_BANK_ACCOUNTS);
    setTransactions(INITIAL_CASH_BANK_TRANSACTIONS);
    setOpeningBalances(DEFAULT_OPENING_BALANCES);
    setExpenseCategories(DEFAULT_EXPENSE_CATEGORIES);
    setServiceCategories(DEFAULT_SERVICE_INCOME_CATEGORIES);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ensec_cash_bank_accounts');
      localStorage.removeItem('ensec_cash_bank_transactions');
      localStorage.removeItem('ensec_opening_balances');
      localStorage.removeItem('ensec_expense_categories');
      localStorage.removeItem('ensec_service_categories');
    }
    addAuditLog('CASH_BANK_RESET', 'Cash & Bank Module', 'Reset Cash & Bank module to clean baseline');
  };

  // 15. Computed Financial Dashboard KPIs
  const kpis: CashBankSummaryKPIs = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const thisMonthStr = todayStr.slice(0, 7);

    let totalOpeningCash = 0;
    let totalOpeningBank = 0;
    let currentCashBalance = 0;
    let currentBankBalance = 0;

    accounts.forEach((a) => {
      if (a.type === 'Cash') {
        totalOpeningCash += a.openingBalanceBDT || 0;
        currentCashBalance += a.currentBalanceBDT || 0;
      } else {
        totalOpeningBank += a.openingBalanceBDT || 0;
        currentBankBalance += a.currentBalanceBDT || 0;
      }
    });

    let totalCashReceived = 0;
    let totalCashPaid = 0;
    let totalBankDeposits = 0;
    let totalBankWithdrawals = 0;

    let todayIncome = 0;
    let todayExpense = 0;
    let monthIncome = 0;
    let monthExpense = 0;

    transactions.forEach((t) => {
      if (t.status === 'Reversed') return;

      const isToday = t.date === todayStr;
      const isThisMonth = t.date?.startsWith(thisMonthStr);

      // Cash activity
      if (t.accountType === 'Cash') {
        if (t.type === 'Sales Collection' || t.type === 'Service Income') {
          totalCashReceived += t.debit || 0;
        } else if (t.type === 'Bank to Cash Withdrawal') {
          totalCashReceived += t.debit || 0;
        }

        if (t.type === 'Operational Expense') {
          totalCashPaid += t.credit || 0;
        } else if (t.type === 'Cash to Bank Deposit') {
          totalCashPaid += t.credit || 0;
        }
      }

      // Bank activity
      if (t.accountType === 'Bank') {
        if (t.type === 'Cash to Bank Deposit') {
          totalBankDeposits += t.debit || 0;
        }
        if (t.type === 'Bank to Cash Withdrawal') {
          totalBankWithdrawals += t.credit || 0;
        }
      }

      // Operational Income (Sales + Service, excluding Contra transfers and Opening Balances)
      const isOperatingIncome = t.type === 'Sales Collection' || t.type === 'Service Income';
      const isOperatingExpense = t.type === 'Operational Expense';

      if (isOperatingIncome) {
        if (isToday) todayIncome += t.debit || 0;
        if (isThisMonth) monthIncome += t.debit || 0;
      }

      if (isOperatingExpense) {
        if (isToday) todayExpense += t.credit || 0;
        if (isThisMonth) monthExpense += t.credit || 0;
      }
    });

    return {
      totalOpeningCash,
      totalOpeningBank,
      totalOpeningCombined: totalOpeningCash + totalOpeningBank,
      totalCashReceived,
      totalCashPaid,
      totalBankDeposits,
      totalBankWithdrawals,
      currentCashBalance,
      currentBankBalance,
      combinedCashBankBalance: currentCashBalance + currentBankBalance,
      todayIncome,
      todayExpense,
      todayNetFlow: todayIncome - todayExpense,
      monthIncome,
      monthExpense,
      monthNetFlow: monthIncome - monthExpense,
    };
  }, [accounts, transactions]);

  return (
    <CashBankContext.Provider
      value={{
        accounts,
        transactions,
        openingBalances,
        expenseCategories,
        serviceCategories,
        kpis,
        recordOpeningBalance,
        addServiceIncome,
        addExpense,
        addCashToBankDeposit,
        addBankToCashWithdrawal,
        reverseTransaction,
        postSalesInvoiceCollection,
        syncPendingSalesOrders,
        addExpenseCategory,
        addServiceCategory,
        addNewBankAccount,
        updateAccountDetails,
        getAccountById,
        getAccountTransactions,
        isInvoiceAlreadyPosted,
        resetToDefaultSampleData,
      }}
    >
      {children}
    </CashBankContext.Provider>
  );
};

export const useCashBank = (): CashBankContextType => {
  const context = useContext(CashBankContext);
  if (!context) {
    throw new Error('useCashBank must be used within a CashBankProvider');
  }
  return context;
};
