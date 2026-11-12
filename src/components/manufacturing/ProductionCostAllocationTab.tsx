/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ensec ERP - Dedicated Production Cost Allocation Engine
 * Implements Section 3 of the Manufacturing Cost Accounting Specification.
 */

import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { 
  Calculator, PlusCircle, ArrowRight, CheckCircle2, AlertCircle, 
  Trash2, Building, Cpu, Layers, DollarSign, Filter, Search, Loader2, ChevronRight, Eye,
  Database, RefreshCw, Copy, Check
} from 'lucide-react';
import { ExpenseEntry, CostAllocationMethod, CostAllocationRecord } from '../../types/costing';

interface ProductionCostAllocationTabProps {
  initialSelectedExpense?: ExpenseEntry | null;
  preselectedExpenseId?: string;
  onOpenCostSheet?: (batchNo: string) => void;
}

export const ProductionCostAllocationTab: React.FC<ProductionCostAllocationTabProps> = ({
  initialSelectedExpense,
  preselectedExpenseId,
  onOpenCostSheet
}) => {
  const { 
    expenseEntries, 
    costAllocations, 
    allocateExpenseToBatch, 
    deleteCostAllocation, 
    productionOrders, 
    formatCurrency,
    getProductionCostBreakdown,
    refreshProductionCosts,
    refreshExpenseEntries,
    refreshCostAllocations,
    refreshProductionOrders,
    syncPendingExpensesToSupabase,
    syncPendingCostAllocationsToSupabase,
  } = useERP();

  // Helper to filter test or mock costing data
  const isTestOrMockCostAllocation = (a: any): boolean => {
    if (!a) return true;
    const id = String(a.id || '').toLowerCase();
    const expId = String(a.expenseId || '').toLowerCase();
    const vNo = String(a.expenseVoucherNo || '').toUpperCase();
    const notes = String(a.notes || '').toLowerCase();
    if (id === 'alc-2026-714-34' || id === 'alc-2026-888-34') return true;
    if (expId === 'exp-fac-2026-714' || expId === 'exp-fac-2026-888') return true;
    if (vNo === 'EXP-FAC-2026-714' || vNo === 'EXP-FAC-2026-888') return true;
    if (id.startsWith('mock-') || id.startsWith('test-')) return true;
    if (notes.includes('electricity absorption allocated to production batch') || notes.includes('generator fuel absorption allocated to production batch')) return true;
    return false;
  };

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

  // Refresh live costing data and purge test session data on component mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedAllocs = localStorage.getItem('ensec_cost_allocations') || sessionStorage.getItem('ensec_cost_allocations');
        if (storedAllocs) {
          const parsed = JSON.parse(storedAllocs);
          if (Array.isArray(parsed)) {
            const cleaned = parsed.filter((a) => !isTestOrMockCostAllocation(a));
            if (cleaned.length === 0) {
              localStorage.removeItem('ensec_cost_allocations');
              sessionStorage.removeItem('ensec_cost_allocations');
            } else if (cleaned.length !== parsed.length) {
              localStorage.setItem('ensec_cost_allocations', JSON.stringify(cleaned));
            }
          }
        }
        const storedExp = localStorage.getItem('ensec_expense_entries') || sessionStorage.getItem('ensec_expense_entries');
        if (storedExp) {
          const parsed = JSON.parse(storedExp);
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
    if (refreshCostAllocations) refreshCostAllocations();
    if (refreshExpenseEntries) refreshExpenseEntries();
    if (refreshProductionCosts) refreshProductionCosts();
    if (refreshProductionOrders) refreshProductionOrders();
  }, []);

  // Allocation Form State
  const [selectedExpenseId, setSelectedExpenseId] = useState<string>(() => {
    const candidate = preselectedExpenseId || initialSelectedExpense?.id || '';
    return (candidate === 'exp-fac-2026-714' || candidate === 'exp-fac-2026-888') ? '' : candidate;
  });
  const [targetOrderId, setTargetOrderId] = useState<string>(productionOrders[0]?.id || '');
  const [allocationMethod, setAllocationMethod] = useState<CostAllocationMethod>('Production Quantity Based');
  const [allocatedAmount, setAllocatedAmount] = useState<number | ''>('');
  const [basisValue, setBasisValue] = useState<number | ''>('');
  const [totalBasisValue, setTotalBasisValue] = useState<number | ''>('');
  const [allocationNotes, setAllocationNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [allocationToDelete, setAllocationToDelete] = useState<CostAllocationRecord | null>(null);

  // Supabase RLS & Sync State
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<{ text: string; isError?: boolean } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Clean memoized expenses & allocations (no test or mock data)
  const cleanExpenseEntries = useMemo(() => {
    return (expenseEntries || []).filter((e) => !isTestOrMockExpense(e));
  }, [expenseEntries]);

  const cleanCostAllocations = useMemo(() => {
    return (costAllocations || []).filter((a) => !isTestOrMockCostAllocation(a));
  }, [costAllocations]);

  // Ensure target order is pre-selected if available
  React.useEffect(() => {
    if (!targetOrderId && productionOrders && productionOrders.length > 0) {
      setTargetOrderId(productionOrders[0].id);
    }
  }, [productionOrders, targetOrderId]);

  // Selected Expense Object
  const selectedExpense = useMemo(() => {
    return cleanExpenseEntries.find((e) => e.id === selectedExpenseId) || null;
  }, [cleanExpenseEntries, selectedExpenseId]);

  // Target Production Order
  const targetOrder = useMemo(() => {
    return productionOrders.find((po) => po.id === targetOrderId) || null;
  }, [productionOrders, targetOrderId]);

  // Filter factory expenses with remaining unallocated balance
  const allocableFactoryExpenses = useMemo(() => {
    return cleanExpenseEntries.filter(
      (e) => e.mainCategory === 'Factory Expenses' && e.remainingUnallocated > 0
    );
  }, [cleanExpenseEntries]);

  // Batch Summaries with Live Absorbed Production Costs
  const batchSummaries = useMemo(() => {
    return productionOrders.map((po) => {
      const breakdown = getProductionCostBreakdown ? getProductionCostBreakdown(po.id, undefined, cleanCostAllocations) : null;
      const orderAllocations = cleanCostAllocations.filter(
        (a) =>
          a.productionOrderId === po.id ||
          a.productionBatchNumber === po.batchNumber ||
          (po.orderNumber && (a.productionOrderId === po.orderNumber || a.productionBatchNumber === po.orderNumber)) ||
          (po.batchNumber && a.productionBatchNumber.toLowerCase() === po.batchNumber.toLowerCase())
      );
      const allocatedOverhead = orderAllocations.reduce((sum, a) => sum + (Number(a.allocatedAmount) || 0), 0);
      const rawCost = breakdown?.rawMaterialCost || Number(po.rawMaterialCostBDT) || 0;
      const directLabor = breakdown?.directLabourCost || Number(po.optimumLaborCostBDT) || 0;
      const totalCost = breakdown?.totalManufacturingCost || (rawCost + directLabor + allocatedOverhead);
      const goodQty = po.completedQty || po.plannedQty || 1;
      const unitCost = breakdown?.actualUnitProductionCost || (goodQty > 0 ? Math.round(totalCost / goodQty) : 0);

      return {
        ...po,
        allocatedOverhead,
        allocationCount: orderAllocations.length,
        rawCost,
        directLabor,
        totalCost,
        unitCost,
        goodQty,
      };
    });
  }, [productionOrders, costAllocations, getProductionCostBreakdown]);

  // Auto-suggest allocation amount when method or basis changes
  const handleCalculateSuggested = () => {
    if (!selectedExpense) return;
    const remaining = selectedExpense.remainingUnallocated;

    if (allocationMethod === 'Manual Allocation') {
      setAllocatedAmount(remaining);
      return;
    }

    if (basisValue && totalBasisValue && Number(totalBasisValue) > 0) {
      const ratio = Number(basisValue) / Number(totalBasisValue);
      const suggested = Math.min(remaining, Math.round(selectedExpense.amount * ratio));
      setAllocatedAmount(suggested);
    } else if (targetOrder && allocationMethod === 'Production Quantity Based') {
      // Suggest pro-rata based on completed or planned qty
      const totalFactoryPlanned = productionOrders.reduce((s, po) => s + (po.plannedQty || 1), 0);
      const batchQty = targetOrder.plannedQty || 50;
      setBasisValue(batchQty);
      setTotalBasisValue(totalFactoryPlanned);
      const ratio = batchQty / totalFactoryPlanned;
      const suggested = Math.min(remaining, Math.round(selectedExpense.amount * ratio));
      setAllocatedAmount(suggested);
    }
  };

  // Perform Allocation
  const handleExecuteAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedExpense) {
      setErrorMessage('Please select an unallocated factory expense.');
      return;
    }

    if (!targetOrder) {
      setErrorMessage('Please select a target production batch.');
      return;
    }

    if (!allocatedAmount || Number(allocatedAmount) <= 0) {
      setErrorMessage('Please enter an allocated amount greater than zero.');
      return;
    }

    if (Number(allocatedAmount) > selectedExpense.remainingUnallocated) {
      setErrorMessage(
        `Cannot allocate ${formatCurrency(Number(allocatedAmount))}. Only ${formatCurrency(selectedExpense.remainingUnallocated)} remains unallocated for this voucher.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await allocateExpenseToBatch({
        expenseId: selectedExpense.id,
        productionOrderId: targetOrder.id,
        allocationMethod,
        allocatedAmount: Number(allocatedAmount),
        basisValue: basisValue ? Number(basisValue) : undefined,
        totalBasisValue: totalBasisValue ? Number(totalBasisValue) : undefined,
        notes: allocationNotes.trim() || undefined,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to allocate expense.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(
        `Successfully allocated ${formatCurrency(Number(allocatedAmount))} to batch ${targetOrder.batchNumber || targetOrder.orderNumber} and persisted to database!`
      );
      setAllocatedAmount('');
      setAllocationNotes('');
      if (refreshCostAllocations) await refreshCostAllocations();
      if (refreshExpenseEntries) await refreshExpenseEntries();
      if (refreshProductionCosts) await refreshProductionCosts();
      if (refreshProductionOrders) await refreshProductionOrders();
      setTimeout(() => setSuccessMessage(''), 3500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to allocate expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSyncToSupabase = async () => {
    setIsSyncing(true);
    setSyncNotice(null);
    try {
      const resExp = syncPendingExpensesToSupabase ? await syncPendingExpensesToSupabase() : { success: false, syncedCount: 0, message: '' };
      const resAlloc = syncPendingCostAllocationsToSupabase ? await syncPendingCostAllocationsToSupabase() : { success: false, syncedCount: 0, message: '' };

      if (resExp.rlsError || resAlloc.rlsError) {
        setSyncNotice({
          text: 'Supabase RLS is currently restricting writes on "expense_entries" and/or "production_cost_allocations". Click "Supabase SQL Setup" below to copy the 4-line SQL policy to run in Supabase SQL editor.',
          isError: true,
        });
        setShowSqlGuide(true);
      } else if (resExp.success && resAlloc.success) {
        setSyncNotice({
          text: `Synced ${resExp.syncedCount} expense entries and ${resAlloc.syncedCount} cost allocations to Supabase successfully!`,
          isError: false,
        });
        setTimeout(() => setSyncNotice(null), 4000);
      } else {
        setSyncNotice({
          text: resAlloc.message || resExp.message || 'Sync completed.',
          isError: !resExp.success || !resAlloc.success,
        });
      }
    } catch (err: any) {
      setSyncNotice({ text: err?.message || 'Sync failed', isError: true });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopySql = () => {
    const sql = `-- Enable Row Level Security and Public Access Policies for Factory Expenses and Cost Allocations in Supabase
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

  return (
    <div className="space-y-6">
      {/* Allocation Header Overview */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-black text-base text-slate-900 dark:text-white">
              Production Overhead &amp; Expense Allocation Engine
            </h2>
            
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
        
         
          <div className="text-xs font-semibold text-slate-500 pl-2 border-l border-slate-200 dark:border-slate-800">
            Unallocated Factory Expenses: <span className="text-amber-600 font-bold text-sm">{allocableFactoryExpenses.length} Vouchers</span>
          </div>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncNotice && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 ${syncNotice.isError ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300' : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'}`}>
          <div className="flex items-center gap-2">
            {syncNotice.isError ? <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" /> : <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />}
            <span className="font-medium">{syncNotice.text}</span>
          </div>
          {syncNotice.isError && (
            <button
              onClick={() => setShowSqlGuide(true)}
              className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-[11px] hover:bg-amber-700 transition shrink-0"
            >
              View SQL Fix
            </button>
          )}
        </div>
      )}

      {/* Supabase SQL Setup Guide Drawer */}
      {showSqlGuide && (
        <div className="p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              <span className="font-bold text-sm">Supabase Row-Level Security (RLS) Policy for Expense Tables</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySql}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-blue-700 transition"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL Script'}</span>
              </button>
              <button
                onClick={() => setShowSqlGuide(false)}
                className="px-2 py-1 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
          <p className="text-slate-300 text-[11px]">
            If rows in <code className="text-amber-400">expense_entries</code> or <code className="text-amber-400">production_cost_allocations</code> are not writing to your Supabase project, execute this SQL script in your Supabase SQL Editor to grant public read &amp; write permissions:
          </p>
          <pre className="p-3 bg-slate-950 rounded-xl font-mono text-[11px] text-emerald-400 overflow-x-auto border border-slate-800">
{`-- Enable Row Level Security and Public Access Policies for Factory Expenses and Cost Allocations in Supabase
ALTER TABLE public.expense_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access" ON public.expense_entries;
CREATE POLICY "Allow public access" ON public.expense_entries FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.production_cost_allocations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access" ON public.production_cost_allocations;
CREATE POLICY "Allow public access" ON public.production_cost_allocations FOR ALL USING (true) WITH CHECK (true);`}
          </pre>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>After running this in Supabase SQL Editor, click &quot;Sync to Supabase&quot; above to persist all existing entries.</span>
            <button
              onClick={handleSyncToSupabase}
              disabled={isSyncing}
              className="text-blue-400 underline hover:text-blue-300 font-bold"
            >
              Test Sync Now →
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Allocation Wizard Form */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-blue-600" />
              <span>New Cost Allocation Entry</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Strict Absorption Control</span>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-semibold text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleExecuteAllocation} className="space-y-4 text-xs">
            {/* 1. Select Factory Expense */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                1. Select Unallocated Factory Expense Voucher*
              </label>
              <select
                required
                value={selectedExpenseId}
                onChange={(e) => {
                  setSelectedExpenseId(e.target.value);
                  setAllocatedAmount('');
                }}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              >
                <option value="">-- Choose Factory Expense to Allocate --</option>
                {allocableFactoryExpenses.map((exp) => (
                  <option key={exp.id} value={exp.id}>
                    {exp.voucherNumber} • {exp.subcategory} (Unallocated: ৳ {exp.remainingUnallocated.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Expense Detail Card */}
            {selectedExpense && (
              <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 dark:text-blue-200 text-xs">
                    {selectedExpense.subcategory}
                  </span>
                  <span className="font-mono font-black text-blue-700 dark:text-blue-300 text-xs">
                    Total: {formatCurrency(selectedExpense.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                  <span>Already Allocated: <b className="text-emerald-600">{formatCurrency(selectedExpense.allocatedAmount)}</b></span>
                  <span>Available: <b className="text-amber-600 font-bold">{formatCurrency(selectedExpense.remainingUnallocated)}</b></span>
                </div>
                <div className="text-[10px] text-slate-500 truncate" title={selectedExpense.description}>
                  {selectedExpense.description}
                </div>
              </div>
            )}

            {/* 2. Target Production Batch */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                2. Target Production Batch / Work Order*
              </label>
              <select
                required
                value={targetOrderId}
                onChange={(e) => setTargetOrderId(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold font-mono"
              >
                {productionOrders.map((po) => (
                  <option key={po.id} value={po.id}>
                    {po.batchNumber || po.orderNumber} • {po.productName} ({po.plannedQty} Units)
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Allocation Method */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                3. Cost Allocation Absorption Method*
              </label>
              <select
                required
                value={allocationMethod}
                onChange={(e) => setAllocationMethod(e.target.value as any)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              >
                <option value="Production Quantity Based">Production Quantity Based (Pro-rata)</option>
                <option value="Labour Hour Based">Labour Hour Based</option>
                <option value="Machine Hour Based">Machine Hour Based</option>
                <option value="Manual Allocation">Manual Direct Allocation</option>
              </select>
            </div>

            {/* Pro-rata Helper Inputs */}
            {allocationMethod !== 'Manual Allocation' && (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Batch Basis Value ({allocationMethod.includes('Quantity') ? 'Units' : 'Hours'})
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={basisValue}
                    onChange={(e) => setBasisValue(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 100"
                    className="w-full p-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Total Plant Basis Value
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={totalBasisValue}
                    onChange={(e) => setTotalBasisValue(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 250"
                    className="w-full p-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div className="col-span-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleCalculateSuggested}
                    className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline"
                  >
                    Calculate Pro-rata Amount
                  </button>
                </div>
              </div>
            )}

            {/* 4. Allocated Amount */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  4. Allocated Amount to This Batch (BDT)*
                </label>
                {selectedExpense && (
                  <button
                    type="button"
                    onClick={() => setAllocatedAmount(selectedExpense.remainingUnallocated)}
                    className="text-[10px] text-blue-600 hover:underline font-bold"
                  >
                    Allocate Full Remaining ({formatCurrency(selectedExpense.remainingUnallocated)})
                  </button>
                )}
              </div>
              <input
                type="number"
                required
                min={1}
                max={selectedExpense?.remainingUnallocated}
                value={allocatedAmount}
                onChange={(e) => setAllocatedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 20000"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-black text-sm"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cost Allocation Notes &amp; Rationale
              </label>
              <input
                type="text"
                value={allocationNotes}
                onChange={(e) => setAllocationNotes(e.target.value)}
                placeholder="e.g. Monthly rent pro-rata allocation for 100 finished battery units"
                className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={!selectedExpense || selectedExpense.remainingUnallocated === 0 || isSubmitting}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Posting to Database...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Post Cost Allocation to Batch</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Allocation History & Audit Table */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Active Production Batch Allocations ({cleanCostAllocations.length})</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                Double-counting prevented
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 font-semibold">
                  <tr>
                    <th className="p-2.5">Batch No.</th>
                    <th className="p-2.5">Voucher &amp; Expense</th>
                    <th className="p-2.5">Method</th>
                    <th className="p-2.5 text-right">Allocated (BDT)</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {cleanCostAllocations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        No expense allocations recorded yet. Allocate factory expenses using the wizard on the left.
                      </td>
                    </tr>
                  ) : (
                    cleanCostAllocations.map((alloc) => (
                      <tr key={alloc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-2.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {alloc.productionBatchNumber}
                          <span className="block font-sans text-[10px] text-slate-400 font-normal truncate max-w-[120px]">
                            {alloc.productName}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 font-semibold block">
                            {alloc.expenseVoucherNo}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white text-[11px]">
                            {alloc.expenseSubcategory}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400 text-[11px]">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono">
                            {alloc.allocationMethod}
                          </span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">{alloc.allocationDate}</span>
                        </td>
                        <td className="p-2.5 text-right font-mono font-black text-indigo-600 dark:text-indigo-400 text-xs">
                          {formatCurrency(alloc.allocatedAmount)}
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {onOpenCostSheet && (
                              <button
                                type="button"
                                onClick={() => onOpenCostSheet(alloc.productionBatchNumber || alloc.productionOrderId)}
                                className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                                title="View batch official cost sheet"
                              >
                                <Calculator className="w-3 h-3 text-blue-600" />
                                <span>Cost Sheet</span>
                              </button>
                            )}
                            <button
                              onClick={() => setAllocationToDelete(alloc)}
                              className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition cursor-pointer"
                              title="Roll back allocation"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: BATCH-WISE PRODUCTION COST & ABSORPTION REGISTRY */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-2">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-purple-600" />
              <span>Batch-wise Production Cost &amp; Absorption Registry</span>
            </h3>
            
          </div>
          <div className="text-xs text-slate-500 font-semibold">
            Tracked Batches: <span className="text-purple-600 font-bold">{batchSummaries.length} Batches</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 font-semibold">
              <tr>
                <th className="p-3">Batch &amp; Work Order</th>
                <th className="p-3">Product Name &amp; Model</th>
                <th className="p-3 text-right">Output Units</th>
                <th className="p-3 text-right">Raw Material (BDT)</th>
                <th className="p-3 text-right">Direct Labour (BDT)</th>
                <th className="p-3 text-right">Allocated Overhead</th>
                <th className="p-3 text-right">Total Production Cost</th>
                <th className="p-3 text-right">Unit Cost</th>
                <th className="p-3 text-center">Cost Sheet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {batchSummaries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 text-xs">
                    No production batches found. Create a production order and issue raw materials to inspect batch costs.
                  </td>
                </tr>
              ) : (
                batchSummaries.map((b) => (
                  <tr key={b.id || b.batchNumber} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3 font-mono">
                      <div className="font-bold text-blue-600 dark:text-blue-400">{b.batchNumber}</div>
                      <span className="text-[10px] text-slate-400 block">{b.orderNumber}</span>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-white">{b.productName}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{b.model}</span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                      {b.goodQty} Units
                    </td>
                    <td className="p-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      {formatCurrency(b.rawCost)}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      {formatCurrency(b.directLabor)}
                    </td>
                    <td className="p-3 text-right font-mono text-purple-600 dark:text-purple-400">
                      {formatCurrency(b.allocatedOverhead)}
                      {b.allocationCount > 0 && (
                        <span className="block text-[9px] text-purple-500 font-sans">
                          ({b.allocationCount} {b.allocationCount === 1 ? 'voucher' : 'vouchers'})
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono font-black text-slate-900 dark:text-white text-xs">
                      {formatCurrency(b.totalCost)}
                    </td>
                    <td className="p-3 text-right font-mono font-black text-indigo-600 dark:text-indigo-400 text-xs">
                      {formatCurrency(b.unitCost)}
                    </td>
                    <td className="p-3 text-center">
                      {onOpenCostSheet && (
                        <button
                          type="button"
                          onClick={() => onOpenCostSheet(b.batchNumber || b.orderNumber)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-indigo-700 font-bold text-xs flex items-center gap-1 mx-auto transition cursor-pointer shadow-2xs"
                          title="Inspect official 11-row cost breakdown sheet"
                        >
                          <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Cost Sheet</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRM DELETE ALLOCATION MODAL */}
      {allocationToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 rounded-2xl shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Confirm Roll Back Allocation?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Without confirmation this item will not be deleted. Are you sure you want to roll back this cost allocation?
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 space-y-2 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Batch Number:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{allocationToDelete.productionBatchNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Expense Voucher:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{allocationToDelete.expenseVoucherNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Category:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{allocationToDelete.expenseSubcategory}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Allocation Method:</span>
                <span className="text-slate-700 dark:text-slate-300">{allocationToDelete.allocationMethod}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 font-semibold">Allocated Amount:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                  {formatCurrency(allocationToDelete.allocatedAmount)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setAllocationToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-750 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  if (!allocationToDelete) return;
                  setIsDeleting(true);
                  try {
                    await deleteCostAllocation(allocationToDelete.id);
                    if (refreshCostAllocations) await refreshCostAllocations();
                    if (refreshExpenseEntries) await refreshExpenseEntries();
                    if (refreshProductionCosts) await refreshProductionCosts();
                    if (refreshProductionOrders) await refreshProductionOrders();
                  } catch (err) {
                    console.error('Failed to delete allocation:', err);
                  } finally {
                    setIsDeleting(false);
                    setAllocationToDelete(null);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Rolling Back...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Roll Back</span>
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
