/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ensec ERP - Centralized Expense Management & Posting System
 * Implements Section 2 of the Manufacturing Cost Accounting Specification.
 */

import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { 
  PlusCircle, Search, Filter, DollarSign, Calendar, Building, 
  Layers, CheckCircle2, AlertCircle, FileText, Upload, Printer,
  Eye, Check, X, Trash2, ArrowUpRight, ArrowRight, ShieldCheck, Tag, Loader2,
  Database, RefreshCw, Copy
} from 'lucide-react';
import { 
  ExpenseEntry, 
  ExpenseMainCategory, 
  FactoryExpenseSubcategory, 
  OtherBusinessExpenseSubcategory, 
  ExpensePaymentMethod 
} from '../../types/costing';
import { 
  FACTORY_EXPENSE_SUBCATEGORIES, 
  OTHER_BUSINESS_EXPENSE_SUBCATEGORIES 
} from '../../mock/costingData';

interface ExpenseManagementTabProps {
  onAllocateExpense?: (expense: ExpenseEntry) => void;
}

export const ExpenseManagementTab: React.FC<ExpenseManagementTabProps> = ({
  onAllocateExpense
}) => {
  const { 
    expenseEntries, 
    addExpenseEntry, 
    approveExpenseEntry, 
    deleteExpenseEntry,
    refreshExpenseEntries,
    syncPendingExpensesToSupabase,
    productionOrders,
    formatCurrency,
    currentUser
  } = useERP();

  // Helper to filter test or mock expense entries
  const isTestOrMockExpense = (e: any): boolean => {
    if (!e) return true;
    const id = String(e.id || '').toLowerCase();
    const vNo = String(e.voucherNumber || '').toUpperCase();
    const desc = String(e.description || '').toLowerCase();
    if (id === 'exp-fac-2026-714' || id === 'exp-fac-2026-888') return true;
    if (vNo === 'EXP-FAC-2026-714' || vNo === 'EXP-FAC-2026-888') return true;
    if (id.startsWith('mock-') || id.startsWith('test-') || vNo.startsWith('TEST-')) return true;
    if (desc.includes('monthly industrial factory electricity grid power') || desc.includes('generator fuel & diesel consumption')) return true;
    return false;
  };

  // Refresh live expense postings and purge stale test data on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('ensec_expense_entries') || sessionStorage.getItem('ensec_expense_entries');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const cleaned = parsed.filter((e) => !isTestOrMockExpense(e));
            if (cleaned.length === 0) {
              localStorage.removeItem('ensec_expense_entries');
              sessionStorage.removeItem('ensec_expense_entries');
            } else if (cleaned.length !== parsed.length) {
              localStorage.setItem('ensec_expense_entries', JSON.stringify(cleaned));
            }
          }
        }
      } catch (err) {}
    }
    if (refreshExpenseEntries) refreshExpenseEntries();
  }, []);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewVoucherModal, setViewVoucherModal] = useState<ExpenseEntry | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseEntry | null>(null);

  // Supabase Sync State
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<{ text: string; isError?: boolean } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleSyncToSupabase = async () => {
    if (!syncPendingExpensesToSupabase) return;
    setIsSyncing(true);
    setSyncNotice(null);
    try {
      const res = await syncPendingExpensesToSupabase();
      if (res.rlsError) {
        setSyncNotice({ text: 'Supabase RLS is currently restricting writes on "expense_entries". Click "Supabase SQL Setup" to copy the SQL policy.', isError: true });
        setShowSqlGuide(true);
      } else if (res.success && res.syncedCount > 0) {
        setSyncNotice({ text: `Synced ${res.syncedCount} expense vouchers into Supabase successfully!` });
        setTimeout(() => setSyncNotice(null), 4000);
      } else if (res.success) {
        setSyncNotice({ text: 'All expense entries are already up to date with Supabase.' });
        setTimeout(() => setSyncNotice(null), 4000);
      } else {
        setSyncNotice({ text: res.message || 'Sync failed', isError: true });
      }
    } catch (err: any) {
      setSyncNotice({ text: err.message || 'Sync failed', isError: true });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopySql = () => {
    const sql = `-- Run this in your Supabase SQL Editor:
ALTER TABLE public.expense_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access" ON public.expense_entries;
CREATE POLICY "Allow public access" ON public.expense_entries FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.production_cost_allocations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access" ON public.production_cost_allocations;
CREATE POLICY "Allow public access" ON public.production_cost_allocations FOR ALL USING (true) WITH CHECK (true);`;
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | ExpenseMainCategory>('All');
  const [allocationFilter, setAllocationFilter] = useState<string>('All');

  // New Expense Form State
  const [formDate, setFormDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [formMainCategory, setFormMainCategory] = useState<ExpenseMainCategory>('Factory Expenses');
  const [formSubcategory, setFormSubcategory] = useState<string>('Factory Rent');
  const [formDepartment, setFormDepartment] = useState('Kushtia Factory Operations');
  const [formCostCenter, setFormCostCenter] = useState('Kushtia Lithium Battery Plant');
  const [formFactoryWarehouse, setFormFactoryWarehouse] = useState('Kushtia Factory Plant');
  const [formBatchRef, setFormBatchRef] = useState('');
  const [formAmount, setFormAmount] = useState<number | ''>('');
  const [formPaymentMethod, setFormPaymentMethod] = useState<ExpensePaymentMethod>('Bank');
  const [formAccountName, setFormAccountName] = useState('Dhaka Bank - Kushtia Corporate A/C');
  const [formDescription, setFormDescription] = useState('');
  const [formAttachmentName, setFormAttachmentName] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle Main Category Change
  const handleMainCategoryChange = (cat: ExpenseMainCategory) => {
    setFormMainCategory(cat);
    if (cat === 'Factory Expenses') {
      setFormSubcategory(FACTORY_EXPENSE_SUBCATEGORIES[0]);
      setFormDepartment('Kushtia Factory Operations');
      setFormCostCenter('Kushtia Lithium Battery Plant');
      setFormFactoryWarehouse('Kushtia Factory Plant');
    } else {
      setFormSubcategory(OTHER_BUSINESS_EXPENSE_SUBCATEGORIES[0]);
      setFormDepartment('General Administration');
      setFormCostCenter('Dhaka Corporate Head Office');
      setFormFactoryWarehouse('Dhaka Central Hub');
    }
  };

  // Submit New Expense
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formAmount || Number(formAmount) <= 0) {
      setFormError('Please enter a valid expense amount greater than zero.');
      return;
    }

    if (!formDescription.trim()) {
      setFormError('Please provide a description for the expense voucher.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addExpenseEntry({
        expenseDate: formDate,
        mainCategory: formMainCategory,
        subcategory: formSubcategory as any,
        department: formDepartment,
        costCenter: formCostCenter,
        factoryWarehouse: formFactoryWarehouse,
        productionBatchRef: formBatchRef.trim() || undefined,
        amount: Number(formAmount),
        paymentMethod: formPaymentMethod,
        accountName: formAccountName,
        description: formDescription.trim(),
        attachmentName: formAttachmentName.trim() || undefined,
        createdBy: currentUser?.name || 'Mustafizur Rahman (Plant Head)',
      });

      if (refreshExpenseEntries) {
        await refreshExpenseEntries();
      }

      setShowCreateModal(false);
      // Reset
      setFormAmount('');
      setFormDescription('');
      setFormBatchRef('');
      setFormAttachmentName('');
    } catch (err: any) {
      setFormError(err?.message || 'Failed to post expense voucher.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clean Expense Entries without test or mock vouchers
  const cleanExpenseEntries = useMemo(() => {
    return (expenseEntries || []).filter((e) => !isTestOrMockExpense(e));
  }, [expenseEntries]);

  // Filtered List
  const filteredExpenses = useMemo(() => {
    return cleanExpenseEntries.filter((e) => {
      if (categoryFilter !== 'All' && e.mainCategory !== categoryFilter) {
        return false;
      }
      if (allocationFilter !== 'All' && e.allocationStatus !== allocationFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchVoucher = e.voucherNumber.toLowerCase().includes(q);
        const matchSubcat = e.subcategory.toLowerCase().includes(q);
        const matchDesc = e.description.toLowerCase().includes(q);
        const matchDept = e.department.toLowerCase().includes(q);
        const matchBatch = e.productionBatchRef ? e.productionBatchRef.toLowerCase().includes(q) : false;
        if (!matchVoucher && !matchSubcat && !matchDesc && !matchDept && !matchBatch) {
          return false;
        }
      }
      return true;
    });
  }, [cleanExpenseEntries, categoryFilter, allocationFilter, searchTerm]);

  // KPI Calculations
  const totalFactoryExpenses = cleanExpenseEntries
    .filter((e) => e.mainCategory === 'Factory Expenses')
    .reduce((s, e) => s + e.amount, 0);

  const totalOtherExpenses = cleanExpenseEntries
    .filter((e) => e.mainCategory === 'Other Business Expenses')
    .reduce((s, e) => s + e.amount, 0);

  const totalAllocatedOverhead = cleanExpenseEntries
    .filter((e) => e.mainCategory === 'Factory Expenses')
    .reduce((s, e) => s + e.allocatedAmount, 0);

  const totalUnallocatedOverhead = cleanExpenseEntries
    .filter((e) => e.mainCategory === 'Factory Expenses')
    .reduce((s, e) => s + e.remainingUnallocated, 0);

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Factory Expenses</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {formatCurrency(totalFactoryExpenses)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Plant rent, power, fuel, labour &amp; maintenance
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Allocated to Production</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {formatCurrency(totalAllocatedOverhead)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Absorbed into active battery batch work-in-progress
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Unallocated Plant Overhead</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
            {formatCurrency(totalUnallocatedOverhead)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Available to allocate across upcoming production orders
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Other Business Expenses</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1 font-mono">
            {formatCurrency(totalOtherExpenses)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            P&amp;L administration, marketing, sales &amp; office rent
          </p>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncNotice && (
        <div className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
          syncNotice.isError 
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
            : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
        }`}>
          <span>{syncNotice.text}</span>
          <button 
            onClick={() => setSyncNotice(null)} 
            className="text-xs font-bold underline ml-3 cursor-pointer hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SQL Setup Drawer */}
      {showSqlGuide && (
        <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 border border-slate-700 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Supabase Row-Level Security (RLS) Policy Setup</h4>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySql}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1 transition"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL Script'}</span>
              </button>
              <button
                onClick={() => setShowSqlGuide(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1"
              >
                Close
              </button>
            </div>
          </div>
          <p className="text-[11px] text-slate-300">
            If Supabase blocks anonymous writes to <code className="text-emerald-400 font-mono">expense_entries</code> or <code className="text-emerald-400 font-mono">production_cost_allocations</code>, run this SQL script in your <a href="https://supabase.com/dashboard/project/ykljdwdkgysnekiqqaby/sql" target="_blank" rel="noreferrer" className="underline text-blue-400 hover:text-blue-300 font-medium">Supabase SQL Editor</a>:
          </p>
          <pre className="p-3 bg-slate-950 rounded-xl text-[11px] font-mono text-emerald-300 overflow-x-auto border border-slate-800 select-all">
{`ALTER TABLE public.expense_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access" ON public.expense_entries;
CREATE POLICY "Allow public access" ON public.expense_entries FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.production_cost_allocations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access" ON public.production_cost_allocations;
CREATE POLICY "Allow public access" ON public.production_cost_allocations FOR ALL USING (true) WITH CHECK (true);`}
          </pre>
        </div>
      )}

      {/* Control Bar: Filters & New Voucher Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search voucher, subcategory, batch..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="py-1.5 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold"
          >
            <option value="All">All Categories</option>
            <option value="Factory Expenses">Factory Expenses (Absorbable)</option>
            <option value="Other Business Expenses">Other Business Expenses (P&amp;L)</option>
          </select>

          {/* Allocation Status Filter */}
          <select
            value={allocationFilter}
            onChange={(e) => setAllocationFilter(e.target.value)}
            className="py-1.5 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold"
          >
            <option value="All">All Allocation Statuses</option>
            <option value="Unallocated">Unallocated</option>
            <option value="Partially Allocated">Partially Allocated</option>
            <option value="Fully Allocated">Fully Allocated</option>
            <option value="Non-Production">Non-Production (P&amp;L)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post New Expense Voucher</span>
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
              <tr>
                <th className="p-3.5">Voucher No.</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Main Category</th>
                <th className="p-3.5">Subcategory &amp; Purpose</th>
                <th className="p-3.5">Cost Center &amp; Dept</th>
                <th className="p-3.5 text-right">Amount (BDT)</th>
                <th className="p-3.5">Allocation Status</th>
                <th className="p-3.5 text-right">Remaining Unallocated</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No expense vouchers found matching the query.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => {
                  const isFactory = expense.mainCategory === 'Factory Expenses';
                  return (
                    <tr key={expense.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {expense.voucherNumber}
                        {expense.productionBatchRef && (
                          <span className="block text-[10px] font-mono text-purple-600 dark:text-purple-400 mt-0.5">
                            Batch: {expense.productionBatchRef}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300">
                        {expense.expenseDate}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isFactory
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                        }`}>
                          {isFactory ? 'Factory Plant' : 'Other P&L'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {expense.subcategory}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs" title={expense.description}>
                          {expense.description}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400 text-[11px]">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{expense.costCenter}</div>
                        <div className="text-[10px] text-slate-400">{expense.department}</div>
                      </td>
                      <td className="p-3.5 text-right font-mono font-black text-slate-900 dark:text-white text-sm">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          expense.allocationStatus === 'Fully Allocated'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : expense.allocationStatus === 'Partially Allocated'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : expense.allocationStatus === 'Unallocated'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {expense.allocationStatus}
                        </span>
                        {isFactory && expense.allocatedAmount > 0 && (
                          <span className="block text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                            ৳ {expense.allocatedAmount.toLocaleString()} allocated
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right font-mono font-semibold">
                        {isFactory ? (
                          <span className={expense.remainingUnallocated > 0 ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-400'}>
                            {formatCurrency(expense.remainingUnallocated)}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">P&amp;L Direct</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setViewVoucherModal(expense)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="View Voucher & Accounting Entries"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {isFactory && expense.remainingUnallocated > 0 && onAllocateExpense && (
                            <button
                              onClick={() => onAllocateExpense(expense)}
                              className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 font-bold text-[10px] flex items-center gap-1 transition"
                              title="Allocate this factory expense to production batches"
                            >
                              <span>Allocate</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}

                          <button
                            onClick={() => setExpenseToDelete(expense)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition cursor-pointer"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* CREATE EXPENSE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 text-xs max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Post New Expense Voucher
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Auto-generates balanced double-entry accounting records and enables factory cost allocation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateExpense} className="space-y-4">
              {/* Category Switcher */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="font-bold text-slate-700 dark:text-slate-200 block text-[11px] uppercase">
                  Select Expense Classification
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleMainCategoryChange('Factory Expenses')}
                    className={`p-2.5 rounded-xl border text-left font-bold transition flex flex-col ${
                      formMainCategory === 'Factory Expenses'
                        ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xs">Factory Expenses (Absorbable)</span>
                    <span className="text-[10px] font-normal text-slate-500 mt-0.5">
                      Rent, power, fuel, welder maintenance, packaging &amp; factory wages
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMainCategoryChange('Other Business Expenses')}
                    className={`p-2.5 rounded-xl border text-left font-bold transition flex flex-col ${
                      formMainCategory === 'Other Business Expenses'
                        ? 'border-purple-600 bg-purple-50/80 dark:bg-purple-950/50 text-purple-900 dark:text-purple-200'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xs">Other Business Expenses (P&amp;L)</span>
                    <span className="text-[10px] font-normal text-slate-500 mt-0.5">
                      Warehouse, administration, marketing, sales &amp; office rent
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Expense Date */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Expense Date*
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Subcategory */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Expense Subcategory*
                  </label>
                  <select
                    required
                    value={formSubcategory}
                    onChange={(e) => setFormSubcategory(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  >
                    {formMainCategory === 'Factory Expenses'
                      ? FACTORY_EXPENSE_SUBCATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))
                      : OTHER_BUSINESS_EXPENSE_SUBCATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department*
                  </label>
                  <input
                    type="text"
                    required
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    placeholder="e.g. Kushtia Factory Operations"
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Cost Center */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cost Center*
                  </label>
                  <input
                    type="text"
                    required
                    value={formCostCenter}
                    onChange={(e) => setFormCostCenter(e.target.value)}
                    placeholder="e.g. Kushtia Lithium Battery Plant"
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Amount (BDT)*
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 50000"
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method*
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as any)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="Bank">Bank Transfer / Cheque</option>
                    <option value="Cash">Cash (Factory Petty Cash)</option>
                    <option value="Payable">Accounts Payable (Supplier Credit)</option>
                    <option value="Online Transfer">Online / MFS Transfer</option>
                  </select>
                </div>

                {/* Account / Credit Source */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Disbursing Account / Source
                  </label>
                  <select
                    value={formAccountName}
                    onChange={(e) => setFormAccountName(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="Dhaka Bank - Kushtia Corporate A/C">Dhaka Bank - Kushtia Corporate A/C</option>
                    <option value="Kushtia Factory Petty Cash">Kushtia Factory Petty Cash</option>
                    <option value="Head Office Operational Cash">Head Office Operational Cash</option>
                    <option value="Accounts Payable - Accrued Liability">Accounts Payable - Accrued Liability</option>
                  </select>
                </div>

                {/* Production Batch Reference (Optional) */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Production Batch Reference (Optional)
                  </label>
                  <select
                    value={formBatchRef}
                    onChange={(e) => setFormBatchRef(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  >
                    <option value="">No Direct Batch (Allocate Later)</option>
                    {productionOrders.map((po) => (
                      <option key={po.id} value={po.batchNumber || po.orderNumber}>
                        {po.batchNumber || po.orderNumber} - {po.productName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Purpose of Expenditure*
                </label>
                <textarea
                  required
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. Monthly plant premises lease for Kushtia assembly facility"
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Supporting Document / Attachment */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Supporting Document / Attachment Name
                </label>
                <input
                  type="text"
                  value={formAttachmentName}
                  onChange={(e) => setFormAttachmentName(e.target.value)}
                  placeholder="e.g. Electric_Bill_Challan_Oct26.pdf"
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to Database...</span>
                    </>
                  ) : (
                    <span>Post Expense Voucher</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW VOUCHER MODAL */}
      {viewVoucherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Official Expense Voucher: {viewVoucherModal.voucherNumber}
                </h3>
              </div>
              <button
                onClick={() => setViewVoucherModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Voucher Date</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{viewVoucherModal.expenseDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Amount</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                    {formatCurrency(viewVoucherModal.amount)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Main Category</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{viewVoucherModal.mainCategory}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Subcategory</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{viewVoucherModal.subcategory}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Cost Center</span>
                  <span className="text-slate-700 dark:text-slate-300">{viewVoucherModal.costCenter}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Disbursing Account</span>
                  <span className="text-slate-700 dark:text-slate-300">{viewVoucherModal.accountName || 'Cash / Bank'}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block uppercase mb-1">Expenditure Narrative:</span>
                <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  {viewVoucherModal.description}
                </p>
              </div>

              {viewVoucherModal.attachmentName && (
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                  <span className="text-blue-800 dark:text-blue-300 font-semibold flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    <span>Attachment: {viewVoucherModal.attachmentName}</span>
                  </span>
                  <span className="text-[10px] text-blue-600 font-bold uppercase">Verified Document</span>
                </div>
              )}

              {/* Accounting Entry Preview */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <span className="font-bold text-[11px] text-slate-700 dark:text-slate-200 block uppercase">
                  Double-Entry Ledger Effect
                </span>
                <div className="grid grid-cols-2 text-[11px] font-mono">
                  <div className="text-emerald-600 dark:text-emerald-400">
                    Dr. {viewVoucherModal.mainCategory === 'Factory Expenses' ? 'Factory Overhead Control (5100)' : 'Operating Expense P&L'}
                  </div>
                  <div className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(viewVoucherModal.amount)}
                  </div>
                  <div className="text-rose-500">
                    Cr. {viewVoucherModal.accountName || 'Cash / Bank (1010)'}
                  </div>
                  <div className="text-right font-bold text-rose-500">
                    {formatCurrency(viewVoucherModal.amount)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setViewVoucherModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE EXPENSE MODAL */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 rounded-2xl shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Confirm Delete Expense?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Without confirmation this item will not be deleted. Are you sure you want to delete this expense record?
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 space-y-2 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Voucher No:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{expenseToDelete.voucherNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Category:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{expenseToDelete.subcategory}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="text-slate-700 dark:text-slate-300">{expenseToDelete.expenseDate}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 font-semibold">Amount:</span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
                  {formatCurrency(expenseToDelete.amount)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-750 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  if (!expenseToDelete) return;
                  setIsDeleting(true);
                  try {
                    await deleteExpenseEntry(expenseToDelete.id);
                    if (refreshExpenseEntries) {
                      await refreshExpenseEntries();
                    }
                  } catch (err) {
                    console.error('Failed to delete expense entry:', err);
                  } finally {
                    setIsDeleting(false);
                    setExpenseToDelete(null);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
