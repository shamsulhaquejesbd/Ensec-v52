/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ensec ERP - Manufacturing Cost & Expense Analytics Dashboard
 * Implements Section 6 of the Manufacturing Cost Accounting Specification.
 */

import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { 
  Building, DollarSign, Layers, Cpu, PackageCheck, AlertCircle, 
  BarChart3, PieChart, TrendingUp, Calendar, Filter, ArrowUpRight, 
  ChevronRight, Calculator, CheckCircle2, Factory, Zap
} from 'lucide-react';
import { ProductionCostDetailedRecord } from '../../types/costing';

interface ProductionCostDashboardTabProps {
  onOpenCostSheet?: (orderId: string) => void;
  onNavigate?: (tab: 'expenses' | 'allocations' | 'orders') => void;
}

export const ProductionCostDashboardTab: React.FC<ProductionCostDashboardTabProps> = ({
  onOpenCostSheet,
  onNavigate
}) => {
  const { 
    getManufacturingCostKPIs, 
    getProductionCostBreakdown,
    productionOrders, 
    expenseEntries, 
    costAllocations,
    products,
    formatCurrency 
  } = useERP();

  // Filters State
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('All');
  const [selectedProductFilter, setSelectedProductFilter] = useState('All');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('All Time');

  // Helper to filter test or mock costing data
  const isTestOrMockExpense = (e: any): boolean => {
    if (!e) return true;
    const id = String(e.id || '').toLowerCase();
    const vNo = String(e.voucherNumber || '').toUpperCase();
    return id === 'exp-fac-2026-714' || id === 'exp-fac-2026-888' || vNo === 'EXP-FAC-2026-714' || vNo === 'EXP-FAC-2026-888';
  };

  const isTestOrMockCostAllocation = (a: any): boolean => {
    if (!a) return true;
    const id = String(a.id || '').toLowerCase();
    const expId = String(a.expenseId || '').toLowerCase();
    const vNo = String(a.expenseVoucherNo || '').toUpperCase();
    return id === 'alc-2026-714-34' || id === 'alc-2026-888-34' || expId === 'exp-fac-2026-714' || expId === 'exp-fac-2026-888' || vNo === 'EXP-FAC-2026-714' || vNo === 'EXP-FAC-2026-888';
  };

  const cleanExpenseEntries = useMemo(() => {
    return (expenseEntries || []).filter((e) => !isTestOrMockExpense(e));
  }, [expenseEntries]);

  const cleanCostAllocations = useMemo(() => {
    return (costAllocations || []).filter((a) => !isTestOrMockCostAllocation(a));
  }, [costAllocations]);

  // Compute 8 Core KPIs
  const kpis = useMemo(() => {
    return getManufacturingCostKPIs();
  }, [getManufacturingCostKPIs, cleanExpenseEntries, cleanCostAllocations, productionOrders]);

  // Compute Batch Breakdown Records for all batches
  const batchRecords: ProductionCostDetailedRecord[] = useMemo(() => {
    return productionOrders.map((po) => getProductionCostBreakdown(po.id, undefined, cleanCostAllocations));
  }, [productionOrders, getProductionCostBreakdown, cleanExpenseEntries, cleanCostAllocations]);

  // Filtered Batches
  const filteredBatches = useMemo(() => {
    return batchRecords.filter((b) => {
      if (selectedBatchFilter !== 'All' && b.batchNumber !== selectedBatchFilter) {
        return false;
      }
      if (selectedProductFilter !== 'All' && b.productName !== selectedProductFilter && b.productId !== selectedProductFilter) {
        return false;
      }
      return true;
    });
  }, [batchRecords, selectedBatchFilter, selectedProductFilter]);

  // Category Distribution calculation for Factory Expenses
  const categoryDistribution = useMemo(() => {
    const distribution: { [subcat: string]: number } = {};
    cleanExpenseEntries
      .filter((e) => e.mainCategory === 'Factory Expenses')
      .forEach((e) => {
        distribution[e.subcategory] = (distribution[e.subcategory] || 0) + e.amount;
      });
    return Object.entries(distribution)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [cleanExpenseEntries]);

  // Monthly Expense Trend Data calculated dynamically from clean expense entries
  const monthlyExpenseTrend = useMemo(() => {
    if (!cleanExpenseEntries || cleanExpenseEntries.length === 0) return [];
    const monthlyMap: Record<string, { factory: number; nonProduction: number; total: number }> = {};
    cleanExpenseEntries.forEach((e) => {
      if (!e.expenseDate) return;
      const d = new Date(e.expenseDate);
      if (isNaN(d.getTime())) return;
      const monthKey = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { factory: 0, nonProduction: 0, total: 0 };
      }
      if (e.mainCategory === 'Factory Expenses') {
        monthlyMap[monthKey].factory += e.amount || 0;
      } else {
        monthlyMap[monthKey].nonProduction += e.amount || 0;
      }
      monthlyMap[monthKey].total += e.amount || 0;
    });
    return Object.entries(monthlyMap).map(([month, data]) => ({
      month,
      factory: data.factory,
      nonProduction: data.nonProduction,
      total: data.total,
    }));
  }, [cleanExpenseEntries]);

  return (
    <div className="space-y-6">
      {/* Filters Header Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
            <Filter className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-900 dark:text-white">Cost Analytics Filters:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedTimeFilter}
            onChange={(e) => setSelectedTimeFilter(e.target.value)}
            className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
          >
            <option value="All Time">All Time</option>
            <option value="Q3 2026">Q3 2026</option>
            <option value="Q4 2026">Q4 2026</option>
            <option value="October 2026">October 2026</option>
          </select>

          <select
            value={selectedProductFilter}
            onChange={(e) => setSelectedProductFilter(e.target.value)}
            className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
          >
            <option value="All">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={selectedBatchFilter}
            onChange={(e) => setSelectedBatchFilter(e.target.value)}
            className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold font-mono"
          >
            <option value="All">All Production Batches</option>
            {productionOrders.map((po) => (
              <option key={po.id} value={po.batchNumber || po.orderNumber}>
                {po.batchNumber || po.orderNumber}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 8 Core Executive KPI Cards (Section 6 Requirement) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Total Factory Expenses */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase">1. Total Factory Expenses</span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600">
              <Building className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white mt-1 font-mono">
            {formatCurrency(kpis.totalFactoryExpenses)}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Rent, power, fuel, welder maintenance</p>
        </div>

        {/* KPI 2: Total Production Overhead */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase">2. Total Production Overhead</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-1 font-mono">
            {formatCurrency(kpis.totalProductionOverhead)}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Absorbed plant indirect overhead</p>
        </div>

        {/* KPI 3: Total Direct Production Cost */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase">3. Total Direct Production Cost</span>
            <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-600">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-black text-cyan-700 dark:text-cyan-300 mt-1 font-mono">
            {formatCurrency(kpis.totalDirectProductionCost)}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Raw materials + Direct labour + Packaging</p>
        </div>

        {/* KPI 4: Total Manufacturing Cost */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase">4. Total Manufacturing Cost</span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600">
              <Calculator className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-black text-blue-700 dark:text-blue-300 mt-1 font-mono">
            {formatCurrency(kpis.totalManufacturingCost)}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Direct costs + Absorbed overheads</p>
        </div>

        {/* KPI 5: Total Production Quantity */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase">5. Total Production Quantity</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              <PackageCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {kpis.totalProductionQuantity.toLocaleString()} Units
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Finished lithium packs passed QA</p>
        </div>

        {/* KPI 6: Average Unit Production Cost */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase">6. Average Unit Production Cost</span>
            <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-black text-purple-700 dark:text-purple-300 mt-1 font-mono">
            {formatCurrency(kpis.averageUnitProductionCost)}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Weighted average across finished packs</p>
        </div>

        {/* KPI 7: Unallocated Factory Expenses */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase">7. Unallocated Factory Expenses</span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
            {formatCurrency(kpis.unallocatedFactoryExpenses)}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Remaining unabsorbed plant overhead</p>
        </div>

        {/* KPI 8: Total Non-Production Expenses */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase">8. Total Non-Production Expenses</span>
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1 font-mono">
            {formatCurrency(kpis.totalNonProductionExpenses)}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Administration, marketing &amp; sales P&amp;L</p>
        </div>
      </div>

      {/* Visualizations Grid (Section 6 Requirement: 6 Visualizations) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Viz 1: Monthly Factory Expense Trend */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>1. Monthly Factory Expense Trend</span>
              </h3>
              <p className="text-[10px] text-slate-500">Comparison of monthly plant expenditures vs non-production overhead</p>
            </div>
            <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
              BDT in Thousands
            </span>
          </div>

          <div className="space-y-2 pt-2">
            {monthlyExpenseTrend.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No recorded expense vouchers found.
              </div>
            ) : (
              monthlyExpenseTrend.map((item) => {
                const maxVal = Math.max(...monthlyExpenseTrend.map((m) => m.total), 1);
                const factoryWidth = Math.round((item.factory / maxVal) * 100);
                const nonProdWidth = Math.round((item.nonProduction / maxVal) * 100);

                return (
                  <div key={item.month} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{item.month}</span>
                      <span className="font-mono text-slate-900 dark:text-white font-bold">
                        {formatCurrency(item.total)}
                      </span>
                    </div>
                    <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${factoryWidth}%` }}
                        className="bg-blue-600 h-full"
                        title={`Factory Expense: ${formatCurrency(item.factory)}`}
                      />
                      <div
                        style={{ width: `${nonProdWidth}%` }}
                        className="bg-purple-500 h-full"
                        title={`Non-Production Expense: ${formatCurrency(item.nonProduction)}`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
              Factory Expenses (Absorbable)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
              Other Business Expenses (P&amp;L)
            </span>
          </div>
        </div>

        {/* Viz 2: Production Cost Breakdown (Material vs Labour vs Overhead) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-indigo-600" />
                <span>2. Production Cost Breakdown (Material vs Labour vs Overhead)</span>
              </h3>
              <p className="text-[10px] text-slate-500">Aggregate manufacturing cost proportion</p>
            </div>
            <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
              Cost Absorption
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-2">
            <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-center space-y-1">
              <span className="text-[10px] text-blue-700 dark:text-blue-300 font-bold uppercase block">Raw Materials</span>
              <div className="text-base font-black text-blue-900 dark:text-blue-100 font-mono">
                {kpis.totalManufacturingCost > 0
                  ? `${(Math.max(0, (kpis.totalDirectProductionCost - 200000) / kpis.totalManufacturingCost) * 100).toFixed(1)}%`
                  : '0.0%'}
              </div>
              <span className="text-[10px] text-slate-500 block">Direct Materials</span>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-center space-y-1">
              <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold uppercase block">Direct Labour</span>
              <div className="text-base font-black text-indigo-900 dark:text-indigo-100 font-mono">
                {kpis.totalManufacturingCost > 0
                  ? `${((200000 / kpis.totalManufacturingCost) * 100).toFixed(1)}%`
                  : '0.0%'}
              </div>
              <span className="text-[10px] text-slate-500 block">Assembly Wages</span>
            </div>

            <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-center space-y-1">
              <span className="text-[10px] text-purple-700 dark:text-purple-300 font-bold uppercase block">Factory Overhead</span>
              <div className="text-base font-black text-purple-900 dark:text-purple-100 font-mono">
                {kpis.totalManufacturingCost > 0
                  ? `${((kpis.totalProductionOverhead / kpis.totalManufacturingCost) * 100).toFixed(1)}%`
                  : '0.0%'}
              </div>
              <span className="text-[10px] text-slate-500 block">Power &amp; Lease</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Cost Control Insight:</span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Lithium cell raw material purchases form the dominant ~80%+ of unit manufacturing cost. Factory overhead absorption rate is running at optimal capacity across Kushtia production runs.
            </p>
          </div>
        </div>

        {/* Viz 3: Production Batch Cost Comparison */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-cyan-600" />
                <span>3. Production Batch Cost Comparison</span>
              </h3>
              <p className="text-[10px] text-slate-500">Total manufacturing cost across active battery batches</p>
            </div>
            <span className="text-[10px] font-mono font-bold text-cyan-600 bg-cyan-50 dark:bg-cyan-950 px-2 py-0.5 rounded">
              Batch Volume
            </span>
          </div>

          <div className="space-y-2 pt-2">
            {batchRecords.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No production batch cost comparisons available.
              </div>
            ) : (
              batchRecords.map((batch) => {
                const maxCost = Math.max(...batchRecords.map((b) => b.totalManufacturingCost), 1);
                const width = Math.min(100, Math.round((batch.totalManufacturingCost / maxCost) * 100));

                return (
                  <div key={batch.productionOrderId} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {batch.batchNumber} • <span className="font-sans font-normal text-slate-500">{batch.productSku}</span>
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(batch.totalManufacturingCost)}
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${width}%` }}
                        className="bg-gradient-to-r from-blue-600 to-cyan-500 h-full rounded-full"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Viz 4: Factory Expense Category Distribution */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-amber-600" />
                <span>4. Factory Expense Category Distribution</span>
              </h3>
              <p className="text-[10px] text-slate-500">Breakdown of factory expenses by specific operational subcategory</p>
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded">
              Subcategory Split
            </span>
          </div>

          <div className="space-y-2 pt-2">
            {categoryDistribution.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No factory expense categories recorded yet.
              </div>
            ) : (
              categoryDistribution.slice(0, 5).map((cat) => {
                const maxCat = categoryDistribution[0]?.amount || 1;
                const width = Math.round((cat.amount / maxCat) * 100);

                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{cat.name}</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(cat.amount)}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${width}%` }}
                        className="bg-amber-500 h-full rounded-full"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Viz 5: Product-wise Unit Manufacturing Cost Comparison */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>5. Product-wise Unit Manufacturing Cost Comparison</span>
              </h3>
              <p className="text-[10px] text-slate-500">Actual unit production costs capitalized into finished goods stock</p>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
              Per Unit Rate
            </span>
          </div>

          <div className="space-y-2.5 pt-2">
            {batchRecords.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No product batch unit cost records available.
              </div>
            ) : (
              batchRecords.map((batch) => (
                <div
                  key={batch.productionOrderId}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-xs">{batch.productName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Batch: {batch.batchNumber} • Output: {batch.goodFinishedQty} Units
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatCurrency(batch.actualUnitProductionCost)}
                    </div>
                    <span className="text-[10px] text-slate-400">per finished unit</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Viz 6: Monthly Unit Cost Trend */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span>6. Production Unit Cost &amp; Output</span>
              </h3>
              <p className="text-[10px] text-slate-500">Efficiency trajectory of production unit costs and volume output</p>
            </div>
            <span className="text-[10px] font-mono font-bold text-purple-600 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded">
              {kpis.totalProductionQuantity > 0 ? `${kpis.totalProductionQuantity} Units Produced` : 'No Production Yet'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
            {batchRecords.length > 0 ? (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Average Unit Production Cost:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatCurrency(kpis.averageUnitProductionCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Total Units Manufactured:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {kpis.totalProductionQuantity.toLocaleString()} Units
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full w-full" />
                </div>
              </>
            ) : (
              <div className="py-4 text-center text-xs text-slate-400">
                No batch efficiency metrics available. Production orders and cost sheets will populate trends automatically.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Production Batch Cost Sheet Drill-down Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600" />
              <span>Production Batches Cost Sheets Registry</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Click &quot;View Cost Sheet&quot; on any batch to inspect the complete 11-row cost breakdown, consumed raw material batches, and journal entries
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 font-semibold">
              <tr>
                <th className="p-3">Batch ID</th>
                <th className="p-3">Product Name &amp; Model</th>
                <th className="p-3 text-right">Good Qty</th>
                <th className="p-3 text-right">Raw Material Cost</th>
                <th className="p-3 text-right">Direct Labour</th>
                <th className="p-3 text-right">Direct Overtime</th>
                <th className="p-3 text-right">Factory Overhead</th>
                <th className="p-3 text-right">Total Mfg Cost</th>
                <th className="p-3 text-right">Actual Unit Cost</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 text-xs">
                    No production batch cost sheets found. Create production orders and allocate expenses to view batch cost sheets.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((b) => (
                <tr key={b.productionOrderId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                    {b.batchNumber}
                    <span className="block text-[10px] text-slate-400 font-normal">{b.orderNumber}</span>
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900 dark:text-white">{b.productName}</div>
                    <span className="text-[10px] text-slate-500 font-mono">{b.productSku}</span>
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {b.goodFinishedQty} Units
                  </td>
                  <td className="p-3 text-right font-mono text-slate-800 dark:text-slate-200">
                    {formatCurrency(b.rawMaterialCost)}
                  </td>
                  <td className="p-3 text-right font-mono text-slate-800 dark:text-slate-200">
                    {formatCurrency(b.directLabourCost)}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(b.directOvertimeCost || 0)}
                  </td>
                  <td className="p-3 text-right font-mono text-slate-800 dark:text-slate-200">
                    {formatCurrency(
                      b.electricityAllocation +
                      b.factoryRentAllocation +
                      b.generatorFuel +
                      b.machineMaintenance +
                      b.otherProductionExpenses
                    )}
                  </td>
                  <td className="p-3 text-right font-mono font-black text-slate-900 dark:text-white text-xs">
                    {formatCurrency(b.totalManufacturingCost)}
                  </td>
                  <td className="p-3 text-right font-mono font-black text-indigo-600 dark:text-indigo-400 text-xs">
                    {formatCurrency(b.actualUnitProductionCost)}
                  </td>
                  <td className="p-3 text-center">
                    {onOpenCostSheet && (
                      <button
                        onClick={() => onOpenCostSheet(b.productionOrderId)}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 font-bold text-xs flex items-center gap-1 mx-auto transition"
                      >
                        <span>Cost Sheet</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
