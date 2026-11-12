/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ensec ERP - Executive Production Cost Sheet & Accounting Engine
 * Implements Section 5 of the Manufacturing Cost Accounting Specification.
 */

import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { 
  Calculator, Layers, CheckCircle2, X, Printer, Download, 
  TrendingUp, AlertTriangle, ArrowRight, DollarSign, Cpu, FileSpreadsheet,
  Building, Calendar, Clock, PackageCheck, BookOpen, ShieldCheck, Tag
} from 'lucide-react';
import { ProductionOrder, ProductionCostRecord } from '../../types/erp';
import { ProductionCostDetailedRecord } from '../../types/costing';

interface ProductionCostSheetModalProps {
  order: ProductionOrder;
  onClose: () => void;
  onReceiveFinishedGoods?: (order: ProductionOrder, costRecord: ProductionCostRecord) => void;
}

export const ProductionCostSheetModal: React.FC<ProductionCostSheetModalProps> = ({
  order,
  onClose,
  onReceiveFinishedGoods
}) => {
  const { 
    getProductionCostBreakdown,
    calculateProductionCost, 
    saveProductionCost,
    receiveFinishedGoodsFromProduction,
    productionConsumptions, 
    costAllocations,
    formatCurrency 
  } = useERP();

  const [valuationMethod, setValuationMethod] = useState<'FIFO' | 'WEIGHTED_AVERAGE'>('FIFO');
  const [activeSubTab, setActiveSubTab] = useState<'cost-sheet' | 'raw-materials' | 'expense-allocations' | 'journal-entries'>('cost-sheet');
  const [receiveSuccess, setReceiveSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Compute granular production cost breakdown
  const detailedRecord: ProductionCostDetailedRecord = useMemo(() => {
    return getProductionCostBreakdown(order.id, valuationMethod);
  }, [order.id, valuationMethod, productionConsumptions, costAllocations]);

  const handlePrint = () => {
    window.print();
  };

  const handleSaveCostSheet = async () => {
    setIsSaving(true);
    try {
      const costRecord = calculateProductionCost(order.id, valuationMethod, true);
      if (saveProductionCost) {
        await saveProductionCost(costRecord);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Error saving cost sheet:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDirectReceive = async () => {
    const costRecord = calculateProductionCost(order.id, valuationMethod, true);
    if (onReceiveFinishedGoods) {
      onReceiveFinishedGoods(order, costRecord);
    } else {
      await receiveFinishedGoodsFromProduction(order.id, {
        acceptedQty: detailedRecord.goodFinishedQty,
        rejectedQty: detailedRecord.rejectedQty,
        unitProductionCost: detailedRecord.actualUnitProductionCost,
        totalProductionCost: detailedRecord.totalManufacturingCost,
        productionBatchNumber: detailedRecord.batchNumber,
        warehouseId: 'wh-kushtia',
      });
    }
    setReceiveSuccess(true);
    setTimeout(() => {
      setReceiveSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6 text-xs max-h-[94vh] overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-800">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Executive Production Cost Sheet
                </h2>
                <span className="text-[11px] bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 font-mono font-bold px-2.5 py-0.5 rounded-full">
                  Batch: {detailedRecord.batchNumber}
                </span>
                <span className="text-[11px] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-semibold px-2 py-0.5 rounded-md">
                  PO: {detailedRecord.orderNumber}
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                Batch-level granular actual cost calculation engine with FIFO raw materials and allocated factory expenses
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 font-medium"
              title="Print Official Cost Sheet"
            >
              <Printer className="w-4 h-4" />
              <span>Print Cost Sheet</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 1. Production Information Card */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-500" />
              Production & Batch Metadata
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              order.status === 'Completed' || order.status === 'Transferred'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
            }`}>
              {order.status || 'In Production'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Batch ID</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{detailedRecord.batchNumber}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Product Name</span>
              <span className="font-semibold text-slate-900 dark:text-white truncate block" title={detailedRecord.productName}>
                {detailedRecord.productName}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Model / SKU</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">{detailedRecord.productSku}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Production Date</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{detailedRecord.productionDate}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Factory Location</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{detailedRecord.factoryLocation}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Planned Quantity</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{detailedRecord.plannedQty} Units</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Actual Production</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{detailedRecord.actualProductionQty} Units</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Good Finished Qty</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{detailedRecord.goodFinishedQty} Units</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Rejected / Scrap</span>
              <span className="font-mono font-bold text-rose-500">{detailedRecord.rejectedQty} Units</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Costing Valuation</span>
              <div className="flex gap-1 mt-0.5">
                <button
                  type="button"
                  onClick={() => setValuationMethod('FIFO')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    valuationMethod === 'FIFO'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  FIFO
                </button>
                <button
                  type="button"
                  onClick={() => setValuationMethod('WEIGHTED_AVERAGE')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    valuationMethod === 'WEIGHTED_AVERAGE'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  W.Avg
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SubTab Switcher */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveSubTab('cost-sheet')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'cost-sheet'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Production Cost Sheet Table</span>
          </button>
          <button
            onClick={() => setActiveSubTab('raw-materials')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'raw-materials'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Raw Material Batches ({detailedRecord.rawMaterialBatches.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('expense-allocations')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'expense-allocations'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            <span>Factory Expenses Allocated ({detailedRecord.allocations.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('journal-entries')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'journal-entries'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Accounting Journal Entries ({detailedRecord.journalEntries.length})</span>
          </button>
        </div>

        {/* TAB 1: Main Production Cost Sheet Table (11 Core Components) */}
        {activeSubTab === 'cost-sheet' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3">Cost Component</th>
                    <th className="p-3">Cost Accounting Classification</th>
                    <th className="p-3">Basis / Absorption Method</th>
                    <th className="p-3 text-right">Amount (BDT)</th>
                    <th className="p-3 text-right">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {/* 1. Raw Material Cost */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 text-center text-slate-400 font-mono">1</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-blue-500" />
                      Raw Material Cost
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">Direct Material</td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]">FIFO Purchase Batch Rates</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(detailedRecord.rawMaterialCost)}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-500">
                      {detailedRecord.totalManufacturingCost > 0
                        ? `${((detailedRecord.rawMaterialCost / detailedRecord.totalManufacturingCost) * 100).toFixed(1)}%`
                        : '0%'}
                    </td>
                  </tr>

                  {/* 2. Direct Labour & Conversion Charge */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 text-center text-slate-400 font-mono">2</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                      Direct Labour &amp; Conversion Charge
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">Direct Conversion &amp; Labour</td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]">Assembly Wages &amp; Conversion Fees</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(detailedRecord.directLabourCost)}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-500">
                      {detailedRecord.totalManufacturingCost > 0
                        ? `${((detailedRecord.directLabourCost / detailedRecord.totalManufacturingCost) * 100).toFixed(1)}%`
                        : '0%'}
                    </td>
                  </tr>

                  {/* 2b. Direct Overtime Cost */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-indigo-50/30 dark:bg-indigo-950/20">
                    <td className="p-3 text-center text-slate-400 font-mono">2b</td>
                    <td className="p-3 font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      Direct Overtime Cost
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">Direct Overtime Wages</td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]">Approved OT Batch Hours (BLA 2006)</td>
                    <td className="p-3 text-right font-mono font-bold text-indigo-700 dark:text-indigo-300">
                      {formatCurrency(detailedRecord.directOvertimeCost || 0)}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-500">
                      {detailedRecord.totalManufacturingCost > 0
                        ? `${(((detailedRecord.directOvertimeCost || 0) / detailedRecord.totalManufacturingCost) * 100).toFixed(1)}%`
                        : '0%'}
                    </td>
                  </tr>

                  {/* 3. Electricity Allocation */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 text-center text-slate-400 font-mono">3</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                      Electricity Allocation
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">Factory Overhead (Utility)</td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]">Industrial HT Grid Absorption</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(detailedRecord.electricityAllocation)}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-500">
                      {detailedRecord.totalManufacturingCost > 0
                        ? `${((detailedRecord.electricityAllocation / detailedRecord.totalManufacturingCost) * 100).toFixed(1)}%`
                        : '0%'}
                    </td>
                  </tr>

                  {/* 4. Factory Rent Allocation */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 text-center text-slate-400 font-mono">4</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-purple-500" />
                      Factory Rent Allocation
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">Factory Overhead (Fixed Facility)</td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]">Floor Area &amp; Batch Pro-rata</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(detailedRecord.factoryRentAllocation)}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-500">
                      {detailedRecord.totalManufacturingCost > 0
                        ? `${((detailedRecord.factoryRentAllocation / detailedRecord.totalManufacturingCost) * 100).toFixed(1)}%`
                        : '0%'}
                    </td>
                  </tr>

                  {/* 5. Generator Fuel */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 text-center text-slate-400 font-mono">5</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
                      Generator Fuel
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">Factory Overhead (Auxiliary Power)</td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]">Diesel Machine Running Hours</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(detailedRecord.generatorFuel)}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-500">
                      {detailedRecord.totalManufacturingCost > 0
                        ? `${((detailedRecord.generatorFuel / detailedRecord.totalManufacturingCost) * 100).toFixed(1)}%`
                        : '0%'}
                    </td>
                  </tr>

                  {/* 6. Machine Maintenance */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 text-center text-slate-400 font-mono">6</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-cyan-500" />
                      Machine Maintenance
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">Factory Overhead (Equipment Maintenance)</td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]">Welder Electrodes &amp; Servicing</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(detailedRecord.machineMaintenance)}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-500">
                      {detailedRecord.totalManufacturingCost > 0
                        ? `${((detailedRecord.machineMaintenance / detailedRecord.totalManufacturingCost) * 100).toFixed(1)}%`
                        : '0%'}
                    </td>
                  </tr>

                  {/* 7. Packaging Cost */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 text-center text-slate-400 font-mono">7</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <PackageCheck className="w-3.5 h-3.5 text-emerald-500" />
                      Packaging Cost
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">Direct Production Expense</td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]">Battery Cartons &amp; EPE Foam</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(detailedRecord.packagingCost)}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-500">
                      {detailedRecord.totalManufacturingCost > 0
                        ? `${((detailedRecord.packagingCost / detailedRecord.totalManufacturingCost) * 100).toFixed(1)}%`
                        : '0%'}
                    </td>
                  </tr>

                  {/* 8. Other Production Expenses */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 text-center text-slate-400 font-mono">8</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-slate-500" />
                      Other Production Expenses
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">Factory Overhead (QC &amp; Supervision)</td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]">Quality Testing &amp; Consumables</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(detailedRecord.otherProductionExpenses)}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-500">
                      {detailedRecord.totalManufacturingCost > 0
                        ? `${((detailedRecord.otherProductionExpenses / detailedRecord.totalManufacturingCost) * 100).toFixed(1)}%`
                        : '0%'}
                    </td>
                  </tr>

                  {/* 9. Total Manufacturing Cost */}
                  <tr className="bg-blue-50/70 dark:bg-blue-950/40 font-bold border-t-2 border-blue-300 dark:border-blue-700 text-sm">
                    <td className="p-3 text-center text-blue-600 font-mono">9</td>
                    <td className="p-3 font-black text-blue-900 dark:text-blue-200">
                      Total Manufacturing Cost
                    </td>
                    <td className="p-3 text-blue-800 dark:text-blue-300 text-xs font-semibold">Total Absorbed Batch Cost</td>
                    <td className="p-3 text-blue-700 dark:text-blue-300 font-mono text-[11px]">Direct + Overhead Absorbed</td>
                    <td className="p-3 text-right font-mono font-black text-blue-700 dark:text-blue-300 text-base">
                      {formatCurrency(detailedRecord.totalManufacturingCost)}
                    </td>
                    <td className="p-3 text-right font-mono text-blue-700 dark:text-blue-300">100.0%</td>
                  </tr>

                  {/* 10. Good Finished Quantity */}
                  <tr className="bg-emerald-50/60 dark:bg-emerald-950/30 font-semibold border-t border-emerald-200 dark:border-emerald-800">
                    <td className="p-3 text-center text-emerald-600 font-mono">10</td>
                    <td className="p-3 font-bold text-emerald-900 dark:text-emerald-200">
                      Good Finished Quantity
                    </td>
                    <td className="p-3 text-emerald-800 dark:text-emerald-300 text-xs">Passed Final QA Stamping</td>
                    <td className="p-3 text-emerald-700 dark:text-emerald-300 font-mono text-[11px]">Net Accepted Units</td>
                    <td className="p-3 text-right font-mono font-black text-emerald-700 dark:text-emerald-300 text-sm">
                      {detailedRecord.goodFinishedQty} Units
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-600 text-xs">
                      {detailedRecord.plannedQty > 0 ? `${((detailedRecord.goodFinishedQty / detailedRecord.plannedQty) * 100).toFixed(0)}% Yield` : '-'}
                    </td>
                  </tr>

                  {/* 11. Actual Unit Production Cost */}
                  <tr className="bg-indigo-600 text-white font-black text-base border-t-2 border-indigo-700">
                    <td className="p-3.5 text-center text-indigo-200 font-mono">11</td>
                    <td className="p-3.5">
                      Actual Unit Production Cost
                    </td>
                    <td className="p-3.5 text-xs font-normal text-indigo-100">Capitalized Inventory Valuation</td>
                    <td className="p-3.5 font-mono text-xs font-normal text-indigo-200">Total Mfg Cost / Good Qty</td>
                    <td className="p-3.5 text-right font-mono text-lg text-white">
                      {formatCurrency(detailedRecord.actualUnitProductionCost)} / Unit
                    </td>
                    <td className="p-3.5 text-right font-mono text-indigo-200 text-xs">Final FG Rate</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Verification Formula Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800 dark:text-slate-200">Accounting Formula Applied:</span>
                <p className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                  Unit Cost = (Direct Material + Direct Labour + Allocated Factory Overhead + Direct Packaging) / Good Finished Quantity
                </p>
              </div>
              <div className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 text-right shrink-0">
                ৳ {detailedRecord.totalManufacturingCost.toLocaleString()} ÷ {detailedRecord.goodFinishedQty} = ৳ {detailedRecord.actualUnitProductionCost.toLocaleString()}/unit
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Raw Material Batches Consumed */}
        {activeSubTab === 'raw-materials' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                  FIFO Raw Material Batches Consumed in This Batch
                </h3>
                <p className="text-[11px] text-slate-500">
                  Detailed traceable purchase batches, barcodes, and rates issued to this production order
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                Total Material Cost: {formatCurrency(detailedRecord.rawMaterialCost)}
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 font-semibold">
                  <tr>
                    <th className="p-2.5">Material Code &amp; Name</th>
                    <th className="p-2.5">Batch Number</th>
                    <th className="p-2.5">Batch Barcode</th>
                    <th className="p-2.5 text-right">Quantity Consumed</th>
                    <th className="p-2.5 text-right">Unit Purchase Rate</th>
                    <th className="p-2.5 text-right">Total Cost (BDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {detailedRecord.rawMaterialBatches.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        No raw material batches recorded for this production order yet.
                      </td>
                    </tr>
                  ) : (
                    detailedRecord.rawMaterialBatches.map((b, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                          {b.materialName}
                          <span className="block font-mono text-[10px] text-slate-400 font-normal">{b.materialCode}</span>
                        </td>
                        <td className="p-2.5 font-mono text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                          {b.batchNumber}
                        </td>
                        <td className="p-2.5 font-mono text-[10px] text-slate-500">
                          {b.batchBarcode || '-'}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                          {b.quantity.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                          {formatCurrency(b.unitPurchaseRate)}
                        </td>
                        <td className="p-2.5 text-right font-mono font-black text-slate-900 dark:text-white">
                          {formatCurrency(b.totalCostBDT)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 dark:bg-slate-800 font-bold border-t border-slate-200 dark:border-slate-700">
                    <td colSpan={5} className="p-2.5 text-right text-slate-700 dark:text-slate-300">
                      Total Raw Material Cost:
                    </td>
                    <td className="p-2.5 text-right font-mono font-black text-blue-600 dark:text-blue-400 text-sm">
                      {formatCurrency(detailedRecord.rawMaterialCost)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Allocated Factory Expenses */}
        {activeSubTab === 'expense-allocations' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                  Factory Expenses Allocated to Batch {detailedRecord.batchNumber}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Granular factory vouchers allocated to this batch via quantity, machine hours, or direct assignment
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-3 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
                Total Allocated Expenses: {formatCurrency(detailedRecord.totalManufacturingCost - detailedRecord.rawMaterialCost)}
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 font-semibold">
                  <tr>
                    <th className="p-2.5">Voucher Number</th>
                    <th className="p-2.5">Subcategory</th>
                    <th className="p-2.5">Allocation Method</th>
                    <th className="p-2.5 text-right">Base Expense Amount</th>
                    <th className="p-2.5 text-right">Allocated Amount (BDT)</th>
                    <th className="p-2.5">Date &amp; Officer</th>
                    <th className="p-2.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {detailedRecord.allocations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">
                        No specific expense allocations logged for this batch yet. Fallback standard overhead is currently estimated.
                      </td>
                    </tr>
                  ) : (
                    detailedRecord.allocations.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-2.5 font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400">
                          {a.expenseVoucherNo}
                        </td>
                        <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                          {a.expenseSubcategory}
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400 text-[11px]">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
                            {a.allocationMethod}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-500">
                          {formatCurrency(a.totalExpenseAmount)}
                        </td>
                        <td className="p-2.5 text-right font-mono font-black text-amber-600 dark:text-amber-400 text-xs">
                          {formatCurrency(a.allocatedAmount)}
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400 text-[11px]">
                          <div>{a.allocationDate}</div>
                          <span className="text-[10px] text-slate-400">{a.allocatedBy}</span>
                        </td>
                        <td className="p-2.5 text-slate-500 text-[11px] max-w-xs truncate" title={a.notes}>
                          {a.notes || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: Accounting Journal Entries */}
        {activeSubTab === 'journal-entries' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                  Double-Entry Cost Accounting Journal Entries (Automatic Posting)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Balanced debit-credit postings for Raw Materials Issue, Overhead Absorption, WIP Transfers, and Finished Goods Receiving
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800">
                Balanced Dr/Cr Ledger
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 font-semibold">
                  <tr>
                    <th className="p-2.5">Account Code</th>
                    <th className="p-2.5">Account Head Title</th>
                    <th className="p-2.5">Transaction Narrative / Description</th>
                    <th className="p-2.5 text-right">Debit (BDT)</th>
                    <th className="p-2.5 text-right">Credit (BDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {detailedRecord.journalEntries.map((j, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-2.5 text-blue-600 dark:text-blue-400 font-bold">{j.accountCode}</td>
                      <td className="p-2.5 font-sans font-bold text-slate-900 dark:text-white">{j.accountName}</td>
                      <td className="p-2.5 font-sans text-slate-600 dark:text-slate-400 text-[11px]">{j.description}</td>
                      <td className="p-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {j.debit > 0 ? formatCurrency(j.debit) : '-'}
                      </td>
                      <td className="p-2.5 text-right font-bold text-rose-600 dark:text-rose-400">
                        {j.credit > 0 ? formatCurrency(j.credit) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 gap-3">
          <div className="text-xs text-slate-500">
            Calculated at: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{detailedRecord.calculatedAt}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSaveCostSheet}
              disabled={isSaving || saveSuccess}
              className={`px-4 py-2 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                saveSuccess
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  : 'border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{saveSuccess ? 'Saved to Database!' : isSaving ? 'Saving to Database...' : 'Save Cost Sheet to Database'}</span>
            </button>
            <button
              onClick={handleDirectReceive}
              disabled={receiveSuccess}
              className={`px-5 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer ${
                receiveSuccess
                  ? 'bg-emerald-600'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{receiveSuccess ? 'Received into Finished Goods Stock!' : 'Finalize & Receive into FG Inventory'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
