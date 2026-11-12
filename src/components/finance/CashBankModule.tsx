/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ensec ERP - Complete Cash & Bank Management Module
 * Centralizes Cash Book & Bank Book, Opening Balances, Contra Transfers,
 * Automatic Sales Posting, Service Income, and Expense Management.
 */

import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Landmark,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Receipt,
  Plus,
  Search,
  Filter,
  Calendar,
  Download,
  Printer,
  RotateCcw,
  Eye,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building,
  CreditCard,
  Layers,
  ChevronRight,
  RefreshCw,
  Wallet,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Check,
  PlusCircle,
  HelpCircle,
  FolderTree,
  Tag,
  Upload,
  X,
  Save,
} from 'lucide-react';
import { useCashBank } from '../../context/CashBankContext.tsx';
import { useERP } from '../../context/ERPContext.tsx';
import { CashBankTransaction, CashBankAccount, CashBankTransactionType } from '../../types/cashBank.ts';
import { TransactionEntryModal } from './TransactionEntryModal.tsx';
import { TransactionDetailModal } from './TransactionDetailModal.tsx';
import { ReversalModal } from './ReversalModal.tsx';
import { NewBankAccountModal } from './NewBankAccountModal.tsx';

interface CashBankModuleProps {
  initialTab?: 'dashboard' | 'unified-ledger' | 'cash-book' | 'bank-book' | 'opening-balance' | 'sales-invoices' | 'categories';
  onNavigate?: (module: string) => void;
}

export const CashBankModule: React.FC<CashBankModuleProps> = ({
  initialTab = 'dashboard',
  onNavigate,
}) => {
  const {
    accounts,
    transactions,
    openingBalances,
    expenseCategories,
    serviceCategories,
    kpis,
    recordOpeningBalance,
    reverseTransaction,
    syncPendingSalesOrders,
    addNewBankAccount,
    addExpenseCategory,
    addServiceCategory,
    isInvoiceAlreadyPosted,
  } = useCashBank();

  const { salesOrders } = useERP();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'unified-ledger' | 'cash-book' | 'bank-book' | 'opening-balance' | 'sales-invoices' | 'categories'>(initialTab);

  // Modals state
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [entryModalType, setEntryModalType] = useState<CashBankTransactionType>('Service Income');
  const [entryModalAccountId, setEntryModalAccountId] = useState<string | undefined>(undefined);
  const [entryModalInvoiceId, setEntryModalInvoiceId] = useState<string | undefined>(undefined);

  const [selectedTxnForDetail, setSelectedTxnForDetail] = useState<CashBankTransaction | null>(null);
  const [selectedTxnForReversal, setSelectedTxnForReversal] = useState<CashBankTransaction | null>(null);
  const [showNewBankModal, setShowNewBankModal] = useState(false);

  // Notification Banner
  const [bannerFeedback, setBannerFeedback] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  // Filters for Unified Ledger
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterAccount, setFilterAccount] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected Bank for Bank Book View
  const [selectedBankId, setSelectedBankId] = useState<string>('All');

  // New Opening Balance Form state
  const [opAccountId, setOpAccountId] = useState(accounts[0]?.id || '');
  const [opInitialBalance, setOpInitialBalance] = useState<number | ''>('');
  const [opOpeningDate, setOpOpeningDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [opRemarks, setOpRemarks] = useState('');

  // Quick Open Modal Helper
  const handleOpenEntry = (type: CashBankTransactionType, accountId?: string, invoiceId?: string) => {
    setEntryModalType(type);
    setEntryModalAccountId(accountId);
    setEntryModalInvoiceId(invoiceId);
    setShowEntryModal(true);
  };

  // Sync Invoices Action
  const handleSyncInvoices = () => {
    const res = syncPendingSalesOrders();
    setBannerFeedback({
      type: res.syncedCount > 0 ? 'success' : 'info',
      message: res.message,
    });
    setTimeout(() => setBannerFeedback(null), 6000);
  };

  // Save Opening Balance Form
  const handleSaveOpeningBalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!opAccountId) return;
    const numeric = Number(opInitialBalance) || 0;
    const target = accounts.find((a) => a.id === opAccountId);
    if (!target) return;

    const res = recordOpeningBalance({
      accountType: target.type,
      accountId: target.id,
      accountName: target.name,
      openingDate: opOpeningDate,
      initialBalance: numeric,
      remarks: opRemarks.trim() || `Configured opening balance on ${opOpeningDate}`,
    });

    if (res.success) {
      setBannerFeedback({ type: 'success', message: res.message });
      setOpInitialBalance('');
      setOpRemarks('');
      setTimeout(() => setBannerFeedback(null), 5000);
    }
  };

  // Filtered Transactions for Unified Ledger
  const filteredUnifiedTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Search term (voucher #, party, description, ref #, account)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesSearch =
          t.voucherNo?.toLowerCase().includes(q) ||
          t.partyName?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.referenceNo?.toLowerCase().includes(q) ||
          t.accountName?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q) ||
          t.invoiceNo?.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // Type filter
      if (filterType !== 'All' && t.type !== filterType) {
        return false;
      }

      // Account filter
      if (filterAccount !== 'All' && t.accountId !== filterAccount && t.targetAccountId !== filterAccount) {
        return false;
      }

      // Category filter
      if (filterCategory !== 'All' && t.category !== filterCategory) {
        return false;
      }

      // Date Range filter
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;

      return true;
    });
  }, [transactions, searchTerm, filterType, filterAccount, filterCategory, startDate, endDate]);

  // Cash Book Transactions
  const cashBookTransactions = useMemo(() => {
    const cashAccIds = accounts.filter((a) => a.type === 'Cash').map((a) => a.id);
    return transactions.filter((t) => cashAccIds.includes(t.accountId));
  }, [transactions, accounts]);

  // Bank Book Transactions
  const bankBookTransactions = useMemo(() => {
    const bankAccIds = accounts.filter((a) => a.type === 'Bank').map((a) => a.id);
    if (selectedBankId === 'All') {
      return transactions.filter((t) => bankAccIds.includes(t.accountId));
    }
    return transactions.filter((t) => t.accountId === selectedBankId);
  }, [transactions, accounts, selectedBankId]);

  // CSV Export for Ledger
  const handleExportCSV = (txnsToExport: CashBankTransaction[], filename: string) => {
    const headers = [
      'Date',
      'Voucher No',
      'Transaction Type',
      'Account Name',
      'Category',
      'Party / Customer',
      'Reference / Cheque #',
      'Invoice #',
      'Particulars',
      'Debit (BDT)',
      'Credit (BDT)',
      'Running Balance (BDT)',
      'Status',
      'Created By',
    ];

    const rows = txnsToExport.map((t) => [
      `"${t.date}"`,
      `"${t.voucherNo}"`,
      `"${t.type}"`,
      `"${t.accountName}"`,
      `"${t.category}"`,
      `"${t.partyName || ''}"`,
      `"${t.referenceNo || ''}"`,
      `"${t.invoiceNo || ''}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      t.debit || 0,
      t.credit || 0,
      t.runningBalance || 0,
      `"${t.status}"`,
      `"${t.createdBy}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Top Banner Feedback */}
      {bannerFeedback && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between shadow-xs transition ${
          bannerFeedback.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
            : bannerFeedback.type === 'error'
            ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            : 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
        }`}>
          <div className="flex items-center gap-2">
            {bannerFeedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            {bannerFeedback.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600" />}
            {bannerFeedback.type === 'info' && <RefreshCw className="w-4 h-4 text-blue-600" />}
            <span className="font-semibold">{bannerFeedback.message}</span>
          </div>
          <button onClick={() => setBannerFeedback(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <span>Cash & Bank Management</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                  Double-Entry ERP
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralized Cash Book, Multi-Bank Registers, Sales Collections, Service Income, Expenses & Contra Transfers
              </p>
            </div>
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => handleOpenEntry('Service Income')}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>+ Service Income</span>
          </button>
          <button
            onClick={() => handleOpenEntry('Operational Expense')}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>+ Expense</span>
          </button>
          <button
            onClick={() => handleOpenEntry('Cash to Bank Deposit')}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Cash to Bank</span>
          </button>
          <button
            onClick={() => handleOpenEntry('Bank to Cash Withdrawal')}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Bank to Cash</span>
          </button>
          <button
            onClick={handleSyncInvoices}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Auto-post pending paid sales invoices to Cash & Bank ledgers"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sync Invoices</span>
          </button>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar pb-1 text-xs font-semibold">
        {[
          { id: 'dashboard' as const, label: 'Financial Dashboard', icon: Wallet },
          { id: 'unified-ledger' as const, label: 'Unified Ledger', icon: Layers },
          { id: 'cash-book' as const, label: 'Cash Book', icon: DollarSign },
          { id: 'bank-book' as const, label: 'Bank Book', icon: Landmark },
          { id: 'opening-balance' as const, label: 'Opening Balances', icon: ShieldCheck },
          { id: 'sales-invoices' as const, label: 'Sales Invoices & Collections', icon: Receipt },
          { id: 'categories' as const, label: 'Categories Hub', icon: Tag },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. FINANCIAL DASHBOARD TAB */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Top Key Financial KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Combined Cash & Bank Liquidity */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Liquidity</span>
                <span className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
                  <Wallet className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2">
                <div className="text-xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                  ৳ {kpis.combinedCashBankBalance.toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Cash (৳{kpis.currentCashBalance.toLocaleString()}) + Bank (৳{kpis.currentBankBalance.toLocaleString()})
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Opening Balance</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                  ৳ {kpis.totalOpeningCombined.toLocaleString()}
                </span>
              </div>
            </div>

            {/* 2. Total Cash Vault Balance */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cash Vaults</span>
                <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2">
                <div className="text-xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                  ৳ {kpis.currentCashBalance.toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  In: ৳{kpis.totalCashReceived.toLocaleString()} | Out: ৳{kpis.totalCashPaid.toLocaleString()}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Opening Cash</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                  ৳ {kpis.totalOpeningCash.toLocaleString()}
                </span>
              </div>
            </div>

            {/* 3. Total Commercial Bank Balance */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Bank Accounts</span>
                <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <Landmark className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2">
                <div className="text-xl font-black font-mono tracking-tight text-blue-600 dark:text-blue-400">
                  ৳ {kpis.currentBankBalance.toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Deposits: ৳{kpis.totalBankDeposits.toLocaleString()} | W/D: ৳{kpis.totalBankWithdrawals.toLocaleString()}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Active Accounts</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {accounts.filter((a) => a.type === 'Bank').length} Commercial Banks
                </span>
              </div>
            </div>

            {/* 4. Monthly Operating Net Flow */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Monthly Net Flow</span>
                <span className={`p-1.5 rounded-lg ${kpis.monthNetFlow >= 0 ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600' : 'bg-rose-50 dark:bg-rose-950 text-rose-600'}`}>
                  {kpis.monthNetFlow >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                </span>
              </div>
              <div className="mt-2">
                <div className={`text-xl font-black font-mono tracking-tight ${kpis.monthNetFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {kpis.monthNetFlow >= 0 ? '+' : ''}৳ {kpis.monthNetFlow.toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Income: ৳{kpis.monthIncome.toLocaleString()} | Exp: ৳{kpis.monthExpense.toLocaleString()}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Today's Flow</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                  ৳ {kpis.todayNetFlow >= 0 ? `+${kpis.todayNetFlow.toLocaleString()}` : kpis.todayNetFlow.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Bank Accounts Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-blue-500" />
                  <span>Commercial Bank Accounts & Operating Cash Drawers</span>
                </h3>
                <p className="text-xs text-slate-500">Live individual balances, deposit slip tracking, and cash transfer gateways</p>
              </div>
              <button
                onClick={() => setShowNewBankModal(true)}
                className="px-3 py-1.5 rounded-xl border border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Bank Account</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((acc) => {
                const isBank = acc.type === 'Bank';
                return (
                  <div
                    key={acc.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                          isBank
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                        }`}>
                          {isBank ? <Landmark className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                            {acc.name}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            {isBank ? acc.branchName || 'Commercial Branch' : 'Physical Cash Vault'}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                        {acc.type}
                      </span>
                    </div>

                    {isBank && acc.accountNumber && (
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-[11px] font-mono flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span>A/C: {acc.accountNumber}</span>
                        {acc.routingNumber && <span className="text-[10px] text-slate-400">RN: {acc.routingNumber}</span>}
                      </div>
                    )}

                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-[11px] text-slate-400">Current Balance:</span>
                      <span className="text-lg font-black font-mono text-slate-900 dark:text-white">
                        ৳ {acc.currentBalanceBDT.toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      {isBank ? (
                        <>
                          <button
                            onClick={() => {
                              handleOpenEntry('Cash to Bank Deposit', acc.id);
                            }}
                            className="py-1.5 px-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-[11px] font-semibold text-center transition cursor-pointer"
                          >
                            Deposit Cash
                          </button>
                          <button
                            onClick={() => {
                              handleOpenEntry('Bank to Cash Withdrawal', acc.id);
                            }}
                            className="py-1.5 px-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 text-[11px] font-semibold text-center transition cursor-pointer"
                          >
                            Withdraw
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleOpenEntry('Operational Expense', acc.id)}
                            className="py-1.5 px-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 text-[11px] font-semibold text-center transition cursor-pointer"
                          >
                            Spend Cash
                          </button>
                          <button
                            onClick={() => handleOpenEntry('Cash to Bank Deposit', acc.id)}
                            className="py-1.5 px-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-[11px] font-semibold text-center transition cursor-pointer"
                          >
                            Deposit to Bank
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Financial Activity Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Recent Financial Transactions
                </h3>
                <p className="text-xs text-slate-500">Latest operating income, expenses, and inter-account contra transfers</p>
              </div>
              <button
                onClick={() => setActiveTab('unified-ledger')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Ledger</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Date / Voucher</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Account</th>
                    <th className="py-3 px-4">Particulars</th>
                    <th className="py-3 px-4 text-right">Debit (In)</th>
                    <th className="py-3 px-4 text-right">Credit (Out)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {transactions.slice(0, 6).map((t) => {
                    const isDebit = (t.debit || 0) > 0;
                    return (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-850 transition">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 dark:text-white block">{t.date}</span>
                          <span className="font-mono text-[10px] text-slate-400">{t.voucherNo}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.isContra
                              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                              : isDebit
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{t.accountName}</span>
                          <span className="text-[10px] text-slate-400 block">{t.category}</span>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-600 dark:text-slate-300">
                          {t.description}
                          {t.partyName && <span className="block text-[10px] text-slate-400">Party: {t.partyName}</span>}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {t.debit > 0 ? `৳ ${t.debit.toLocaleString()}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                          {t.credit > 0 ? `৳ ${t.credit.toLocaleString()}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === 'Reversed'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setSelectedTxnForDetail(t)}
                            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                            title="View Voucher & Print"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. UNIFIED TRANSACTION LEDGER TAB */}
      {/* ========================================================================= */}
      {activeTab === 'unified-ledger' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search voucher, party, ref..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Transaction Type Filter */}
              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All Transaction Types</option>
                  <option value="Service Income">Service Income</option>
                  <option value="Operational Expense">Operational Expense</option>
                  <option value="Cash to Bank Deposit">Cash to Bank Deposit (Contra)</option>
                  <option value="Bank to Cash Withdrawal">Bank to Cash Withdrawal (Contra)</option>
                  <option value="Sales Collection">Sales Collection</option>
                  <option value="Opening Balance">Opening Balance</option>
                  <option value="Reversal / Adjustment">Reversal / Adjustment</option>
                </select>
              </div>

              {/* Account Filter */}
              <div>
                <select
                  value={filterAccount}
                  onChange={(e) => setFilterAccount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All Accounts (Cash + Banks)</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500"
                  placeholder="From Date"
                />
              </div>

              {/* End Date */}
              <div>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500"
                  placeholder="To Date"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 font-medium">
                Showing <b>{filteredUnifiedTransactions.length}</b> ledger records
              </span>
              <div className="flex items-center gap-2">
                {(searchTerm || filterType !== 'All' || filterAccount !== 'All' || startDate || endDate) && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterType('All');
                      setFilterAccount('All');
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="text-xs text-rose-500 hover:underline cursor-pointer"
                  >
                    Clear Filters
                  </button>
                )}
                <button
                  onClick={() => handleExportCSV(filteredUnifiedTransactions, 'Unified-Cash-Bank-Ledger')}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* Unified Ledger Data Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-3 px-3.5">Date / Voucher</th>
                    <th className="py-3 px-3.5">Type</th>
                    <th className="py-3 px-3.5">Account</th>
                    <th className="py-3 px-3.5">Description & Reference</th>
                    <th className="py-3 px-3.5">Party</th>
                    <th className="py-3 px-3.5 text-right">Debit (In)</th>
                    <th className="py-3 px-3.5 text-right">Credit (Out)</th>
                    <th className="py-3 px-3.5 text-right">Running Bal</th>
                    <th className="py-3 px-3.5 text-center">Status</th>
                    <th className="py-3 px-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredUnifiedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                        <p className="font-semibold text-slate-600 dark:text-slate-400">No transactions match your filter criteria.</p>
                        <p className="text-[11px] text-slate-400 mt-1">Try resetting filters or record a new cash/bank transaction.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUnifiedTransactions.map((t) => {
                      const isDebit = (t.debit || 0) > 0;
                      return (
                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-850 transition">
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className="font-semibold text-slate-900 dark:text-white block">{t.date}</span>
                            <span className="font-mono text-[10px] text-slate-400">{t.voucherNo}</span>
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.isContra
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                                : t.type === 'Service Income' || t.type === 'Sales Collection' || isDebit
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            }`}>
                              {t.type}
                            </span>
                          </td>
                          <td className="py-3 px-3.5">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-[130px]">
                              {t.accountName}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">{t.category}</span>
                          </td>
                          <td className="py-3 px-3.5 max-w-xs">
                            <p className="text-slate-700 dark:text-slate-300 leading-tight">{t.description}</p>
                            <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-400">
                              {t.referenceNo && <span>Ref: {t.referenceNo}</span>}
                              {t.invoiceNo && <span className="text-blue-600 dark:text-blue-400 font-semibold">Inv: {t.invoiceNo}</span>}
                              {t.serviceRef && <span className="text-teal-600 dark:text-teal-400 font-semibold">JobCard: {t.serviceRef}</span>}
                            </div>
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                            {t.partyName || '-'}
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            {t.debit > 0 ? `৳ ${t.debit.toLocaleString()}` : '-'}
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                            {t.credit > 0 ? `৳ ${t.credit.toLocaleString()}` : '-'}
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            ৳ {Number(t.runningBalance || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-3.5 text-center whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              t.status === 'Reversed'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setSelectedTxnForDetail(t)}
                                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                                title="View & Print Voucher"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {t.status !== 'Reversed' && t.type !== 'Opening Balance' && (
                                <button
                                  onClick={() => setSelectedTxnForReversal(t)}
                                  className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                                  title="Reverse / Adjust Entry"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CASH BOOK LEDGER TAB */}
      {/* ========================================================================= */}
      {activeTab === 'cash-book' && (
        <div className="space-y-4">
          {/* Cash Summary Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Cash Book Register (Physical Cash Vaults)
                </h3>
                <p className="text-xs text-slate-500">
                  Head Office Cash Safe + Kushtia Factory Plant Petty Imprest Drawer
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Cash Balance</span>
                <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  ৳ {kpis.currentCashBalance.toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => handleExportCSV(cashBookTransactions, 'Ensec-Cash-Book-Ledger')}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Cash Book</span>
              </button>
            </div>
          </div>

          {/* Cash Transactions Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-3 px-3.5">Date / Voucher</th>
                    <th className="py-3 px-3.5">Cash Account</th>
                    <th className="py-3 px-3.5">Category</th>
                    <th className="py-3 px-3.5">Particulars / Source Ref</th>
                    <th className="py-3 px-3.5">Party</th>
                    <th className="py-3 px-3.5 text-right">Cash In (Dr)</th>
                    <th className="py-3 px-3.5 text-right">Cash Out (Cr)</th>
                    <th className="py-3 px-3.5 text-right">Running Balance</th>
                    <th className="py-3 px-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {cashBookTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-slate-400">
                        No cash transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    cashBookTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-850 transition">
                        <td className="py-3 px-3.5">
                          <span className="font-semibold text-slate-900 dark:text-white block">{t.date}</span>
                          <span className="font-mono text-[10px] text-slate-400">{t.voucherNo}</span>
                        </td>
                        <td className="py-3 px-3.5 font-semibold text-slate-800 dark:text-slate-200">
                          {t.accountName}
                        </td>
                        <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400">
                          {t.category}
                        </td>
                        <td className="py-3 px-3.5 max-w-xs text-slate-700 dark:text-slate-300">
                          {t.description}
                          {t.referenceNo && <span className="block text-[10px] text-slate-400">Ref: {t.referenceNo}</span>}
                        </td>
                        <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300">
                          {t.partyName || '-'}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {t.debit > 0 ? `৳ ${t.debit.toLocaleString()}` : '-'}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                          {t.credit > 0 ? `৳ ${t.credit.toLocaleString()}` : '-'}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                          ৳ {t.runningBalance.toLocaleString()}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <button
                            onClick={() => setSelectedTxnForDetail(t)}
                            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. BANK BOOK LEDGER TAB */}
      {/* ========================================================================= */}
      {activeTab === 'bank-book' && (
        <div className="space-y-4">
          {/* Bank Selector Bar */}
          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Bank Book Register (Commercial Bank Statements)
                </h3>
                <p className="text-xs text-slate-500">
                  Switch between accounts to audit deposits, clearing cheques, and bank reconciliations
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Bank Accounts (Combined)</option>
                {accounts.filter((a) => a.type === 'Bank').map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} (৳{b.currentBalanceBDT.toLocaleString()})
                  </option>
                ))}
              </select>

              <button
                onClick={() => handleExportCSV(bankBookTransactions, 'Ensec-Bank-Book-Ledger')}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Bank Book</span>
              </button>
            </div>
          </div>

          {/* Bank Transactions Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-3 px-3.5">Date / Voucher</th>
                    <th className="py-3 px-3.5">Bank Account</th>
                    <th className="py-3 px-3.5">Particulars / Cheque / Slip #</th>
                    <th className="py-3 px-3.5">Party / Entity</th>
                    <th className="py-3 px-3.5 text-right">Bank Deposit (Dr)</th>
                    <th className="py-3 px-3.5 text-right">Bank Withdrawal (Cr)</th>
                    <th className="py-3 px-3.5 text-right">Running Balance</th>
                    <th className="py-3 px-3.5 text-center">Status</th>
                    <th className="py-3 px-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {bankBookTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-slate-400">
                        No transactions recorded for the selected bank account.
                      </td>
                    </tr>
                  ) : (
                    bankBookTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-850 transition">
                        <td className="py-3 px-3.5">
                          <span className="font-semibold text-slate-900 dark:text-white block">{t.date}</span>
                          <span className="font-mono text-[10px] text-slate-400">{t.voucherNo}</span>
                        </td>
                        <td className="py-3 px-3.5 font-semibold text-slate-800 dark:text-slate-200">
                          {t.accountName}
                        </td>
                        <td className="py-3 px-3.5 max-w-xs text-slate-700 dark:text-slate-300">
                          {t.description}
                          <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-400">
                            {t.referenceNo && <span>Slip/Cheque: {t.referenceNo}</span>}
                            {t.invoiceNo && <span className="text-blue-500">Inv: {t.invoiceNo}</span>}
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300">
                          {t.partyName || '-'}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {t.debit > 0 ? `৳ ${t.debit.toLocaleString()}` : '-'}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                          {t.credit > 0 ? `৳ ${t.credit.toLocaleString()}` : '-'}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                          ৳ {t.runningBalance.toLocaleString()}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === 'Reversed'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <button
                            onClick={() => setSelectedTxnForDetail(t)}
                            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. OPENING BALANCE MANAGEMENT TAB */}
      {/* ========================================================================= */}
      {activeTab === 'opening-balance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Configure Opening Balance</span>
              </h3>
              <p className="text-xs text-slate-500">Authorized opening balances reflect across all ledgers</p>
            </div>

            <form onSubmit={handleSaveOpeningBalance} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Account Name <span className="text-rose-500">*</span>
                </label>
                <select
                  value={opAccountId}
                  onChange={(e) => setOpAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-purple-500"
                  required
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type}) • Current Bal: BDT {a.currentBalanceBDT.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Opening Initial Balance (BDT) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">৳</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={opInitialBalance}
                    onChange={(e) => setOpInitialBalance(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono font-bold focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Opening Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={opOpeningDate}
                  onChange={(e) => setOpOpeningDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Remarks / Audit Justification
                </label>
                <textarea
                  rows={2}
                  value={opRemarks}
                  onChange={(e) => setOpRemarks(e.target.value)}
                  placeholder="e.g. Audited opening ledger balance verified by CA firm"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save & Post Opening Balance</span>
              </button>
            </form>
          </div>

          {/* Configured Opening Balances List */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Configured Opening Balances & Audit Trail
              </h3>
              <p className="text-xs text-slate-500">Double-entry equity credit offset against opening cash & bank balances</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Account Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Opening Date</th>
                    <th className="py-3 px-4 text-right">Initial Balance</th>
                    <th className="py-3 px-4">Configured By</th>
                    <th className="py-3 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {accounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {acc.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {acc.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {acc.openingDate || '2026-09-01'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-purple-600 dark:text-purple-400">
                        ৳ {(acc.openingBalanceBDT || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {openingBalances.find((o) => o.accountId === acc.id)?.configuredBy || 'Accounts Head'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                        {acc.remarks || 'Standard opening entry'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. AUTOMATIC SALES INVOICES & COLLECTIONS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'sales-invoices' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-600" />
                <span>Finished Goods Sales Invoices & Cash/Bank Posting Hub</span>
              </h3>
              <p className="text-xs text-slate-500">
                Prevent duplicate postings, route Cash/Bank automatically, and post credit sales to Accounts Receivable
              </p>
            </div>
            <button
              onClick={handleSyncInvoices}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync All Pending Invoices</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Invoice / Order #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4 text-right">Net Amount</th>
                    <th className="py-3 px-4 text-right">Paid Amount</th>
                    <th className="py-3 px-4 text-right">Due (Receivable)</th>
                    <th className="py-3 px-4 text-center">Cash/Bank Posting Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {salesOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No sales orders or invoices found.
                      </td>
                    </tr>
                  ) : (
                    salesOrders.map((so) => {
                      const isPosted = isInvoiceAlreadyPosted(so.id) || isInvoiceAlreadyPosted(so.orderNumber) || isInvoiceAlreadyPosted(so.invoiceNumber || '');
                      const isCreditSale = (so.paidAmountBDT || 0) === 0;

                      return (
                        <tr key={so.id} className="hover:bg-slate-50 dark:hover:bg-slate-850 transition">
                          <td className="py-3 px-4">
                            <span className="font-bold font-mono text-slate-900 dark:text-white block">
                              {so.invoiceNumber || so.invoiceNo || so.orderNumber}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">Order: {so.orderNumber}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            {so.date}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                            {so.customerName}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 font-medium">
                              {so.paymentMethod || 'Credit'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                            ৳ {so.netAmountBDT.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            ৳ {(so.paidAmountBDT || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                            ৳ {(so.dueAmountBDT ?? (so.netAmountBDT - (so.paidAmountBDT || 0))).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isPosted ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Posted to Ledger</span>
                              </span>
                            ) : isCreditSale ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                                <span>Credit Sale (A/R)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                <span>Unposted Payment</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {!isPosted && (so.paidAmountBDT || 0) > 0 ? (
                              <button
                                onClick={() => handleOpenEntry('Sales Collection', undefined, so.id)}
                                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold transition cursor-pointer"
                              >
                                Post to Ledger
                              </button>
                            ) : isCreditSale ? (
                              <button
                                onClick={() => handleOpenEntry('Sales Collection', undefined, so.id)}
                                className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition cursor-pointer"
                              >
                                Collect Due
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-semibold">Synced</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. CATEGORIES MANAGEMENT TAB */}
      {/* ========================================================================= */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Expense Categories */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Operational Expense Categories
                </h3>
                <p className="text-xs text-slate-500">Configurable heads for organizational expenditure</p>
              </div>
              <button
                onClick={() => {
                  setEntryModalType('Operational Expense');
                  setShowEntryModal(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 cursor-pointer"
              >
                + Add Expense
              </button>
            </div>
            <div className="p-4 space-y-2">
              {expenseCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{cat.name}</span>
                    <span className="text-[11px] text-slate-500">{cat.description}</span>
                  </div>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {cat.code}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Service Income Categories */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Service Income Categories
                </h3>
                <p className="text-xs text-slate-500">Commercial revenue for battery rectification, repairing, & AMC</p>
              </div>
              <button
                onClick={() => {
                  setEntryModalType('Service Income');
                  setShowEntryModal(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-100 cursor-pointer"
              >
                + Add Income
              </button>
            </div>
            <div className="p-4 space-y-2">
              {serviceCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{cat.name}</span>
                    <span className="text-[11px] text-slate-500">{cat.description}</span>
                  </div>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {cat.code}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* 1. Dynamic Centralized Transaction Entry Modal */}
      <TransactionEntryModal
        isOpen={showEntryModal}
        onClose={() => setShowEntryModal(false)}
        defaultType={entryModalType}
        defaultAccountId={entryModalAccountId}
        defaultInvoiceId={entryModalInvoiceId}
      />

      {/* 2. Transaction Detail & Printable Receipt Modal */}
      <TransactionDetailModal
        transaction={selectedTxnForDetail}
        onClose={() => setSelectedTxnForDetail(null)}
        onReverse={(id) => {
          const t = transactions.find((txn) => txn.id === id);
          if (t) setSelectedTxnForReversal(t);
        }}
      />

      {/* 3. Reversal / Adjustment Modal */}
      <ReversalModal
        transaction={selectedTxnForReversal}
        onClose={() => setSelectedTxnForReversal(null)}
        onConfirm={(id, reason) => {
          const res = reverseTransaction(id, reason);
          if (res.success) {
            setBannerFeedback({ type: 'success', message: res.message });
            setTimeout(() => setBannerFeedback(null), 5000);
          }
        }}
      />

      {/* 4. New Bank Account Modal */}
      <NewBankAccountModal
        isOpen={showNewBankModal}
        onClose={() => setShowNewBankModal(false)}
        onSave={(data) => {
          const res = addNewBankAccount(data);
          if (res.success) {
            setBannerFeedback({ type: 'success', message: res.message });
            setTimeout(() => setBannerFeedback(null), 5000);
          }
        }}
      />
    </div>
  );
};
