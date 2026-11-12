/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ensec ERP - Centralized Dynamic Transaction Entry Modal
 * Single centralized entry system with a dynamic form that changes
 * according to the selected transaction type.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Landmark,
  Plus,
  Save,
  AlertCircle,
  FileText,
  Upload,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Building,
  User,
  Tag,
  ShieldCheck,
  Receipt,
} from 'lucide-react';
import { useCashBank } from '../../context/CashBankContext.tsx';
import { useERP } from '../../context/ERPContext.tsx';
import { CashBankTransactionType, PaymentMethod } from '../../types/cashBank.ts';

interface TransactionEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: CashBankTransactionType;
  defaultAccountId?: string;
  defaultInvoiceId?: string;
}

export const TransactionEntryModal: React.FC<TransactionEntryModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'Service Income',
  defaultAccountId,
  defaultInvoiceId,
}) => {
  const {
    accounts,
    expenseCategories,
    serviceCategories,
    addServiceIncome,
    addExpense,
    addCashToBankDeposit,
    addBankToCashWithdrawal,
    recordOpeningBalance,
    postSalesInvoiceCollection,
    addExpenseCategory,
    addServiceCategory,
  } = useCashBank();

  const { customers, distributors, salesOrders } = useERP();

  // Active Transaction Type in Form
  const [activeType, setActiveType] = useState<CashBankTransactionType>(defaultType);

  // Common Fields
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank');
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Service Income Specific
  const [serviceCategory, setServiceCategory] = useState('');
  const [servicePartyName, setServicePartyName] = useState('');
  const [serviceRefNumber, setServiceRefNumber] = useState('');

  // Expense Specific
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expensePaidTo, setExpensePaidTo] = useState('');
  const [allowNegativeOverride, setAllowNegativeOverride] = useState(false);

  // Cash to Bank Deposit Specific
  const [fromCashAccountId, setFromCashAccountId] = useState('');
  const [toBankAccountId, setToBankAccountId] = useState('');
  const [depositSlipNumber, setDepositSlipNumber] = useState('');

  // Bank to Cash Withdrawal Specific
  const [fromBankAccountId, setFromBankAccountId] = useState('');
  const [toCashAccountId, setToCashAccountId] = useState('');
  const [bankWithdrawalRef, setBankWithdrawalRef] = useState('');

  // Sales Collection Specific
  const [selectedSalesOrderId, setSelectedSalesOrderId] = useState('');
  const [customerName, setCustomerName] = useState('');

  // Opening Balance Specific
  const [openingAccountId, setOpeningAccountId] = useState('');
  const [openingDate, setOpeningDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Attachment Simulation
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentSize, setAttachmentSize] = useState('');

  // Custom Category Add State
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');

  // Feedback & Validation
  const [errorMessage, setErrorMessage] = useState('');
  const [warningMessage, setWarningMessage] = useState('');

  // Sync default values when modal opens or type changes
  useEffect(() => {
    if (isOpen) {
      setActiveType(defaultType);
      setErrorMessage('');
      setWarningMessage('');
      setAmount('');
      setDescription('');
      setReferenceNo('');
      setRemarks('');
      setAttachmentName('');
      setAttachmentSize('');
      setAllowNegativeOverride(false);

      // Default Cash and Bank accounts
      const cashAcc = accounts.find((a) => a.type === 'Cash') || accounts[0];
      const bankAcc = accounts.find((a) => a.type === 'Bank') || accounts[1] || accounts[0];

      if (defaultAccountId) {
        setSelectedAccountId(defaultAccountId);
      } else {
        setSelectedAccountId(defaultType === 'Cash to Bank Deposit' ? cashAcc?.id : bankAcc?.id);
      }

      setFromCashAccountId(cashAcc?.id || '');
      setToBankAccountId(bankAcc?.id || '');
      setFromBankAccountId(bankAcc?.id || '');
      setToCashAccountId(cashAcc?.id || '');
      setOpeningAccountId(accounts[0]?.id || '');

      setServiceCategory(serviceCategories[0]?.name || 'Battery Rectification');
      setExpenseCategory(expenseCategories[0]?.name || 'Office Rent');

      if (defaultInvoiceId) {
        setSelectedSalesOrderId(defaultInvoiceId);
        const matched = salesOrders.find((s) => s.id === defaultInvoiceId || s.orderNumber === defaultInvoiceId);
        if (matched) {
          setCustomerName(matched.customerName);
          setAmount(matched.dueAmountBDT || matched.netAmountBDT);
          setReferenceNo(matched.orderNumber);
          setDescription(`Sales collection against invoice ${matched.invoiceNumber || matched.orderNumber}`);
        }
      }
    }
  }, [isOpen, defaultType, defaultAccountId, defaultInvoiceId, accounts, serviceCategories, expenseCategories]);

  // Handle Account Selection logic when payment method changes
  useEffect(() => {
    if (activeType === 'Service Income' || activeType === 'Operational Expense' || activeType === 'Sales Collection') {
      if (paymentMethod === 'Cash') {
        const cashAcc = accounts.find((a) => a.type === 'Cash');
        if (cashAcc) setSelectedAccountId(cashAcc.id);
      } else {
        const bankAcc = accounts.find((a) => a.type === 'Bank');
        if (bankAcc) setSelectedAccountId(bankAcc.id);
      }
    }
  }, [paymentMethod, activeType, accounts]);

  if (!isOpen) return null;

  // Selected account helpers
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const selectedCashAccount = accounts.find((a) => a.id === fromCashAccountId);
  const selectedBankSourceAccount = accounts.find((a) => a.id === fromBankAccountId);

  // File Upload Handler Simulation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
      setAttachmentSize(`${(file.size / 1024).toFixed(1)} KB`);
    }
  };

  // Add custom category
  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;
    if (activeType === 'Operational Expense') {
      const res = addExpenseCategory(newCategoryName.trim(), newCategoryDesc.trim());
      if (res.success && res.category) {
        setExpenseCategory(res.category.name);
      }
    } else if (activeType === 'Service Income') {
      const res = addServiceCategory(newCategoryName.trim(), newCategoryDesc.trim());
      if (res.success && res.category) {
        setServiceCategory(res.category.name);
      }
    }
    setShowAddCategoryModal(false);
    setNewCategoryName('');
    setNewCategoryDesc('');
  };

  // Main Form Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setWarningMessage('');

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setErrorMessage('Please enter a valid transaction amount greater than zero.');
      return;
    }

    // 1. Service Income
    if (activeType === 'Service Income') {
      if (!servicePartyName.trim()) {
        setErrorMessage('Company / Customer Name is required for Service Income.');
        return;
      }
      const res = addServiceIncome({
        date,
        category: serviceCategory,
        partyName: servicePartyName.trim(),
        serviceRef: serviceRefNumber.trim() || undefined,
        description: description.trim() || `Service charges received for ${serviceCategory} from ${servicePartyName}`,
        amount: numericAmount,
        paymentMethod,
        accountId: selectedAccountId,
        referenceNo: referenceNo.trim() || `SRV-${Date.now().toString().slice(-4)}`,
        remarks: remarks.trim() || undefined,
        attachmentName: attachmentName || undefined,
      });

      if (!res.success) {
        setErrorMessage(res.message);
        return;
      }
      onClose();
      return;
    }

    // 2. Operational Expense
    if (activeType === 'Operational Expense') {
      if (!expensePaidTo.trim()) {
        setErrorMessage('Paid To (Vendor, Payee, Authority) is required.');
        return;
      }

      const res = addExpense({
        date,
        category: expenseCategory,
        paidTo: expensePaidTo.trim(),
        description: description.trim() || `Paid for ${expenseCategory} to ${expensePaidTo}`,
        amount: numericAmount,
        paymentMethod,
        accountId: selectedAccountId,
        referenceNo: referenceNo.trim() || `EXP-${Date.now().toString().slice(-4)}`,
        remarks: remarks.trim() || undefined,
        attachmentName: attachmentName || undefined,
        allowNegativeOverride,
      });

      if (!res.success) {
        if (res.isNegativeWarning) {
          setWarningMessage(res.message);
        } else {
          setErrorMessage(res.message);
        }
        return;
      }
      onClose();
      return;
    }

    // 3. Cash to Bank Deposit (Contra)
    if (activeType === 'Cash to Bank Deposit') {
      if (!fromCashAccountId || !toBankAccountId) {
        setErrorMessage('Please specify both Cash Account and Bank Account.');
        return;
      }
      if (!depositSlipNumber.trim()) {
        setErrorMessage('Bank Deposit Slip Number is required.');
        return;
      }

      const res = addCashToBankDeposit({
        date,
        fromCashAccountId,
        toBankAccountId,
        amount: numericAmount,
        depositSlipNumber: depositSlipNumber.trim(),
        description: description.trim() || undefined,
        remarks: remarks.trim() || undefined,
        attachmentName: attachmentName || undefined,
        allowNegativeOverride,
      });

      if (!res.success) {
        setErrorMessage(res.message);
        return;
      }
      onClose();
      return;
    }

    // 4. Bank to Cash Withdrawal (Contra)
    if (activeType === 'Bank to Cash Withdrawal') {
      if (!fromBankAccountId || !toCashAccountId) {
        setErrorMessage('Please specify both source Bank Account and destination Cash Account.');
        return;
      }
      if (!bankWithdrawalRef.trim()) {
        setErrorMessage('Bank Reference / Cheque / Slip Number is required.');
        return;
      }

      const res = addBankToCashWithdrawal({
        date,
        fromBankAccountId,
        toCashAccountId,
        amount: numericAmount,
        bankReferenceNumber: bankWithdrawalRef.trim(),
        description: description.trim() || undefined,
        remarks: remarks.trim() || undefined,
        allowNegativeOverride,
      });

      if (!res.success) {
        setErrorMessage(res.message);
        return;
      }
      onClose();
      return;
    }

    // 5. Sales Collection
    if (activeType === 'Sales Collection') {
      const targetOrder = salesOrders.find(
        (so) => so.id === selectedSalesOrderId || so.orderNumber === selectedSalesOrderId
      );

      const orderPayload: any = targetOrder || {
        id: `so-manual-${Date.now()}`,
        orderNumber: referenceNo || `SO-MANUAL-${Date.now().toString().slice(-4)}`,
        invoiceNumber: referenceNo || `INV-MANUAL-${Date.now().toString().slice(-4)}`,
        customerName: customerName.trim() || 'Direct Customer',
        date,
      };

      const res = postSalesInvoiceCollection(
        orderPayload,
        numericAmount,
        paymentMethod === 'Cash' ? 'Cash' : 'Bank',
        selectedAccountId,
        referenceNo.trim() || orderPayload.invoiceNumber || `RCT-${Date.now().toString().slice(-4)}`,
        remarks.trim() || `Direct collection voucher`
      );

      if (!res.success) {
        setErrorMessage(res.message);
        return;
      }
      onClose();
      return;
    }

    // 6. Opening Balance
    if (activeType === 'Opening Balance') {
      const acc = accounts.find((a) => a.id === openingAccountId);
      if (!acc) {
        setErrorMessage('Please select a valid account.');
        return;
      }

      const res = recordOpeningBalance({
        accountType: acc.type,
        accountId: acc.id,
        accountName: acc.name,
        openingDate,
        initialBalance: numericAmount,
        remarks: remarks.trim() || 'Opening balance configured via transaction portal',
      });

      if (!res.success) {
        setErrorMessage(res.message);
        return;
      }
      onClose();
      return;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                New Cash & Bank Transaction
              </h3>
              <p className="text-[11px] text-slate-500">
                Single centralized entry system with double-entry integrity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Type Selector Tabs */}
        <div className="px-6 pt-3.5 pb-2 bg-slate-100/70 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 min-w-max">
            {[
              { type: 'Service Income' as const, label: 'Service Income', icon: ArrowDownLeft, color: 'text-emerald-600 dark:text-emerald-400' },
              { type: 'Operational Expense' as const, label: 'Expense', icon: ArrowUpRight, color: 'text-rose-600 dark:text-rose-400' },
              { type: 'Cash to Bank Deposit' as const, label: 'Cash to Bank', icon: ArrowLeftRight, color: 'text-indigo-600 dark:text-indigo-400' },
              { type: 'Bank to Cash Withdrawal' as const, label: 'Bank to Cash', icon: ArrowLeftRight, color: 'text-amber-600 dark:text-amber-400' },
              { type: 'Sales Collection' as const, label: 'Sales Collection', icon: Receipt, color: 'text-blue-600 dark:text-blue-400' },
              { type: 'Opening Balance' as const, label: 'Opening Balance', icon: Landmark, color: 'text-purple-600 dark:text-purple-400' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeType === tab.type;
              return (
                <button
                  key={tab.type}
                  type="button"
                  onClick={() => {
                    setActiveType(tab.type);
                    setErrorMessage('');
                    setWarningMessage('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${tab.color}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-900 dark:text-slate-100 max-h-[75vh] overflow-y-auto">
          {/* Error & Warning Banners */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {warningMessage && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>{warningMessage}</p>
              </div>
              <label className="flex items-center gap-2 font-bold cursor-pointer text-amber-800 dark:text-amber-300 pt-1">
                <input
                  type="checkbox"
                  checked={allowNegativeOverride}
                  onChange={(e) => setAllowNegativeOverride(e.target.checked)}
                  className="rounded text-amber-600"
                />
                <span>Authorize & Proceed with Negative Balance Override (Accounts Head Clearance)</span>
              </label>
            </div>
          )}

          {/* Type Badge & Accounting Classification Helper */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Transaction Mode:</span>
              <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                {activeType}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              {activeType === 'Cash to Bank Deposit' && 'Contra Entry • Cash is Credited, Bank is Debited'}
              {activeType === 'Bank to Cash Withdrawal' && 'Contra Entry • Bank is Credited, Cash is Debited'}
              {activeType === 'Service Income' && 'Income Entry • Debits Cash/Bank, Credits Service Revenue'}
              {activeType === 'Operational Expense' && 'Expense Entry • Debits Expense Account, Credits Cash/Bank'}
              {activeType === 'Sales Collection' && 'Asset Collection • Debits Cash/Bank, Clears Trade Receivable'}
              {activeType === 'Opening Balance' && 'Equity Inward • Debits Asset, Credits Initial Capital'}
            </div>
          </div>

          {/* DYNAMIC FIELD SETS ACCORDING TO TRANSACTION TYPE */}

          {/* 1. SERVICE INCOME FORM */}
          {activeType === 'Service Income' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Income Category <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddCategoryModal(true)}
                      className="text-[10px] text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> New
                    </button>
                  </div>
                  <select
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500"
                    required
                  >
                    {serviceCategories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Company / Customer Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={servicePartyName}
                    onChange={(e) => setServicePartyName(e.target.value)}
                    placeholder="e.g. Grameen Telecom / Rahim Power Ltd."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Service Reference Number (Job Card)
                  </label>
                  <input
                    type="text"
                    value={serviceRefNumber}
                    onChange={(e) => setServiceRefNumber(e.target.value)}
                    placeholder="e.g. SRV-RECT-2026-081"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Reference / Cheque / Txn ID
                  </label>
                  <input
                    type="text"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder="e.g. BEFTN-991204 / Cash Receipt #04"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Bank">Bank Deposit / Transfer</option>
                    <option value="Cash">Cash at Counter</option>
                    <option value="Cheque">Cheque</option>
                    <option value="MFS (bKash/Nagad)">MFS (bKash/Nagad)</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Destination Account <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500"
                    required
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.type}) • Bal: BDT {a.currentBalanceBDT.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 2. OPERATIONAL EXPENSE FORM */}
          {activeType === 'Operational Expense' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Expense Category <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddCategoryModal(true)}
                      className="text-[10px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> New
                    </button>
                  </div>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500"
                    required
                  >
                    {expenseCategories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Paid To (Payee / Vendor) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={expensePaidTo}
                    onChange={(e) => setExpensePaidTo(e.target.value)}
                    placeholder="e.g. DESCO / Landlord / Transport Agency"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Bank">Bank Cheque / Transfer</option>
                    <option value="Cash">Cash (Petty Imprest)</option>
                    <option value="MFS (bKash/Nagad)">MFS (bKash/Nagad)</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Source Account <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500"
                    required
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.type}) • Available: BDT {a.currentBalanceBDT.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bill / Voucher / Cheque Reference #
                </label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="e.g. CHQ-CITY-44129 / BILL-OCT-2026"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          )}

          {/* 3. CASH TO BANK DEPOSIT (CONTRA) FORM */}
          {activeType === 'Cash to Bank Deposit' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900">
                <div>
                  <label className="block font-bold text-indigo-900 dark:text-indigo-200 mb-1">
                    From Account (Cash Vault) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={fromCashAccountId}
                    onChange={(e) => setFromCashAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-indigo-300 dark:border-indigo-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    {accounts.filter((a) => a.type === 'Cash').map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} • Available: BDT {a.currentBalanceBDT.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-indigo-900 dark:text-indigo-200 mb-1">
                    To Account (Bank Account) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={toBankAccountId}
                    onChange={(e) => setToBankAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-indigo-300 dark:border-indigo-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    {accounts.filter((a) => a.type === 'Bank').map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} • Balance: BDT {a.currentBalanceBDT.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bank Deposit Slip Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={depositSlipNumber}
                  onChange={(e) => setDepositSlipNumber(e.target.value)}
                  placeholder="e.g. SLIP-EBL-991204 / Deposit Stamped Receipt #"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
          )}

          {/* 4. BANK TO CASH WITHDRAWAL (CONTRA) FORM */}
          {activeType === 'Bank to Cash Withdrawal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                <div>
                  <label className="block font-bold text-amber-900 dark:text-amber-200 mb-1">
                    From Account (Bank Source) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={fromBankAccountId}
                    onChange={(e) => setFromBankAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                    required
                  >
                    {accounts.filter((a) => a.type === 'Bank').map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} • Balance: BDT {a.currentBalanceBDT.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-amber-900 dark:text-amber-200 mb-1">
                    To Account (Destination Cash Vault) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={toCashAccountId}
                    onChange={(e) => setToCashAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                    required
                  >
                    {accounts.filter((a) => a.type === 'Cash').map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} • Available: BDT {a.currentBalanceBDT.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bank Reference / Self Cheque Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={bankWithdrawalRef}
                  onChange={(e) => setBankWithdrawalRef(e.target.value)}
                  placeholder="e.g. SELF-CHQ-CITY-00192 / ATM Withdrawal Slip #"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            </div>
          )}

          {/* 5. SALES INVOICE COLLECTION FORM */}
          {activeType === 'Sales Collection' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Sales Order / Invoice
                  </label>
                  <select
                    value={selectedSalesOrderId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedSalesOrderId(id);
                      const target = salesOrders.find((s) => s.id === id || s.orderNumber === id);
                      if (target) {
                        setCustomerName(target.customerName);
                        setAmount(target.dueAmountBDT > 0 ? target.dueAmountBDT : target.netAmountBDT);
                        setReferenceNo(target.orderNumber);
                        setDescription(`Collection against invoice ${target.invoiceNumber || target.orderNumber}`);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Choose Existing Order / Invoice --</option>
                    {salesOrders.map((so) => (
                      <option key={so.id} value={so.id}>
                        {so.orderNumber} • {so.customerName} (Net: BDT {so.netAmountBDT.toLocaleString()} | Due: BDT {(so.dueAmountBDT ?? 0).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Customer / Distributor Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Grameen Telecom / Pal Brothers"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Bank">Bank Deposit / Clearing</option>
                    <option value="Cash">Cash Handover</option>
                    <option value="Cheque">Cheque</option>
                    <option value="MFS (bKash/Nagad)">MFS</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Deposit Into Account <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.type}) • Bal: BDT {a.currentBalanceBDT.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Invoice # / Money Receipt Ref
                </label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="e.g. INV-2026-0094 / RCT-EBL-881"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* 6. OPENING BALANCE FORM */}
          {activeType === 'Opening Balance' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-3">
                <div>
                  <label className="block font-bold text-purple-900 dark:text-purple-200 mb-1">
                    Select Account to Configure <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={openingAccountId}
                    onChange={(e) => setOpeningAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.type}) • Current Opening: BDT {(a.openingBalanceBDT || 0).toLocaleString()} (Date: {a.openingDate || 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-purple-900 dark:text-purple-200 mb-1">
                    Opening Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={openingDate}
                    onChange={(e) => setOpeningDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* COMMON CORE INPUTS: AMOUNT & DATE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200 dark:border-slate-800">
            <div>
              <label className="block font-bold text-slate-900 dark:text-white mb-1">
                {activeType === 'Opening Balance' ? 'Opening Initial Balance (BDT)' : 'Transaction Amount (BDT)'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold">
                  ৳
                </div>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-mono font-bold focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Transaction Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Description & Particulars */}
          {activeType !== 'Opening Balance' && (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description / Particulars
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of transaction particulars"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Remarks & Attachment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Remarks / Audit Note
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional audit comment or memo"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Attachment (Bank Slip / Receipt / Bill)
              </label>
              <div className="flex items-center gap-2">
                <label className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1.5 text-xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Document</span>
                  <input type="file" className="hidden" onChange={handleFileUpload} />
                </label>
                {attachmentName && (
                  <span className="text-[11px] text-teal-600 dark:text-teal-400 font-mono truncate">
                    {attachmentName} ({attachmentSize})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Live Double Entry Balanced Preview */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1.5">
            <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Double-Entry Balanced Preview:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Balanced (Debit = Credit)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono">
              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 text-[10px] uppercase block font-sans">Debit (Inflow / Asset / Exp)</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {activeType === 'Service Income' && `${selectedAccount?.name || 'Cash/Bank'}`}
                  {activeType === 'Operational Expense' && `${expenseCategory || 'Expense Account'}`}
                  {activeType === 'Cash to Bank Deposit' && `${accounts.find((a) => a.id === toBankAccountId)?.name || 'Bank Account'}`}
                  {activeType === 'Bank to Cash Withdrawal' && `${accounts.find((a) => a.id === toCashAccountId)?.name || 'Cash Vault'}`}
                  {activeType === 'Sales Collection' && `${selectedAccount?.name || 'Cash/Bank'}`}
                  {activeType === 'Opening Balance' && `${accounts.find((a) => a.id === openingAccountId)?.name || 'Account'}`}
                  {' : '}
                  BDT {Number(amount || 0).toLocaleString()}
                </span>
              </div>
              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 text-[10px] uppercase block font-sans">Credit (Outflow / Rev / Capital)</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  {activeType === 'Service Income' && `${serviceCategory || 'Service Income'}`}
                  {activeType === 'Operational Expense' && `${selectedAccount?.name || 'Cash/Bank'}`}
                  {activeType === 'Cash to Bank Deposit' && `${accounts.find((a) => a.id === fromCashAccountId)?.name || 'Cash Vault'}`}
                  {activeType === 'Bank to Cash Withdrawal' && `${accounts.find((a) => a.id === fromBankAccountId)?.name || 'Bank Account'}`}
                  {activeType === 'Sales Collection' && 'Accounts Receivable / Sales'}
                  {activeType === 'Opening Balance' && 'Opening Capital / Shareholder Equity'}
                  {' : '}
                  BDT {Number(amount || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Confirm & Post Transaction</span>
            </button>
          </div>
        </form>

        {/* Quick Add Custom Category Modal */}
        {showAddCategoryModal && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Add New {activeType === 'Operational Expense' ? 'Expense' : 'Service'} Category
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Factory Boiler Maintenance / Audit Fees"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  placeholder="Optional category description"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                >
                  Save Category
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
