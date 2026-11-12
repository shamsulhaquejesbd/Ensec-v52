/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ensec ERP - Production Batch Split Allocation Modal
 * Allows splitting verified overtime hours across one or multiple production orders and batches.
 * Enforces validation that total allocated hours <= verified overtime hours.
 */

import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext.tsx';
import {
  X,
  Cpu,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Save,
  Calculator,
  Layers,
  Percent,
} from 'lucide-react';
import {
  OvertimeRequest,
  OvertimeBatchAllocation,
  ProductionProcessType,
} from '../../types/overtime.ts';

interface OvertimeBatchSplitModalProps {
  request: OvertimeRequest;
  onClose: () => void;
  onSuccess?: () => void;
}

export const OvertimeBatchSplitModal: React.FC<OvertimeBatchSplitModalProps> = ({
  request,
  onClose,
  onSuccess,
}) => {
  const {
    productionOrders,
    saveOvertimeBatchAllocations,
    formatCurrency,
  } = useERP();

  const maxHours = request.actualOvertimeHours || request.expectedHours || 4.0;
  const baseHourlyRate = (request.hourlyRateBDT || 135) * (request.overtimeMultiplier || 2.0);

  // Allocations state
  const [allocations, setAllocations] = useState<OvertimeBatchAllocation[]>(() => {
    if (request.batchAllocations && request.batchAllocations.length > 0) {
      return [...request.batchAllocations];
    }
    // Default initial allocation line
    return [
      {
        id: `alloc-${Date.now()}-1`,
        productionOrderId: request.productionOrderId || productionOrders[0]?.id || 'po-1',
        productionOrderNumber: request.productionOrderNumber || productionOrders[0]?.orderNumber || 'PO-PRD-2026-001',
        productionBatchNumber: request.productionBatchNumber || 'KUS-B2610-01',
        productName: request.productName || 'Ensec 48V 100Ah Lithium Pack',
        processType: 'Spot Welding & Busbar',
        allocatedHours: maxHours,
        hourlyRateBDT: baseHourlyRate,
        allocatedCostBDT: Math.round(maxHours * baseHourlyRate),
        isOverhead: false,
        notes: 'Direct batch production',
      },
    ];
  });

  const totalAllocatedHours = useMemo(() => {
    return Math.round(allocations.reduce((sum, a) => sum + (Number(a.allocatedHours) || 0), 0) * 100) / 100;
  }, [allocations]);

  const totalAllocatedCost = useMemo(() => {
    return allocations.reduce((sum, a) => sum + (Number(a.allocatedCostBDT) || 0), 0);
  }, [allocations]);

  const isOverAllocated = totalAllocatedHours > maxHours;
  const remainingHours = Math.max(0, Math.round((maxHours - totalAllocatedHours) * 100) / 100);

  const handleAddLine = () => {
    const defaultPO = productionOrders[allocations.length % productionOrders.length] || productionOrders[0];
    const newLine: OvertimeBatchAllocation = {
      id: `alloc-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      productionOrderId: defaultPO?.id || 'po-1',
      productionOrderNumber: defaultPO?.orderNumber || 'PO-PRD-2026-001',
      productionBatchNumber: defaultPO?.batchNumber || `KUS-B2610-0${allocations.length + 1}`,
      productName: defaultPO?.productName || 'Ensec Battery Pack',
      processType: 'BMS Wiring & Soldering',
      allocatedHours: remainingHours > 0 ? remainingHours : 1.0,
      hourlyRateBDT: baseHourlyRate,
      allocatedCostBDT: Math.round((remainingHours > 0 ? remainingHours : 1.0) * baseHourlyRate),
      isOverhead: false,
      notes: '',
    };
    setAllocations([...allocations, newLine]);
  };

  const handleRemoveLine = (index: number) => {
    if (allocations.length <= 1) return;
    setAllocations(allocations.filter((_, i) => i !== index));
  };

  const handleUpdateLine = (index: number, field: keyof OvertimeBatchAllocation, value: any) => {
    setAllocations((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };

        // If PO changed, sync batch number and product name
        if (field === 'productionOrderId') {
          const po = productionOrders.find((p) => p.id === value);
          if (po) {
            updated.productionOrderNumber = po.orderNumber || po.id;
            updated.productionBatchNumber = po.batchNumber || updated.productionBatchNumber;
            updated.productName = po.productName || updated.productName;
          }
        }

        // If processType changed to General Factory Overhead
        if (field === 'processType') {
          updated.isOverhead = value === 'General Factory Overhead' || value === 'Maintenance & Tooling';
        }

        // If allocatedHours changed, recalculate allocatedCostBDT
        if (field === 'allocatedHours') {
          const hrs = Number(value) || 0;
          updated.allocatedCostBDT = Math.round(hrs * item.hourlyRateBDT);
        }

        return updated;
      })
    );
  };

  const handleSave = () => {
    if (isOverAllocated) return;
    saveOvertimeBatchAllocations(request.id, allocations);
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in fade-in duration-150">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-700 to-purple-800 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">Production Batch Overtime Allocation</h2>
              <p className="text-xs text-indigo-100">
                Split {request.employeeName}&apos;s verified overtime hours across manufacturing orders &amp; batches
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Summary Banner */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Employee</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {request.employeeName} ({request.employeeCode})
              </span>
              <span className="block text-[11px] text-slate-500 font-mono">
                Date: {request.overtimeDate} • Base Wage: {formatCurrency(request.basicSalaryBDT || 0)}
              </span>
            </div>

            <div className="flex items-center gap-6">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Verified OT Hours</span>
                <span className="font-mono text-base font-black text-blue-600 dark:text-blue-400">
                  {maxHours} Hours
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Allocated</span>
                <span className={`font-mono text-base font-black ${
                  isOverAllocated
                    ? 'text-rose-600'
                    : totalAllocatedHours === maxHours
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600'
                }`}>
                  {totalAllocatedHours} / {maxHours} Hours
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Overtime Cost</span>
                <span className="font-mono text-base font-black text-slate-900 dark:text-white">
                  {formatCurrency(totalAllocatedCost)}
                </span>
              </div>
            </div>
          </div>

          {/* Allocation Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              <span>Allocation Progress:</span>
              <span>
                {Math.min(100, Math.round((totalAllocatedHours / (maxHours || 1)) * 100))}%
                {remainingHours > 0 ? ` (${remainingHours}h unallocated)` : ''}
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                style={{ width: `${Math.min(100, (totalAllocatedHours / (maxHours || 1)) * 100)}%` }}
                className={`h-full transition-all ${
                  isOverAllocated
                    ? 'bg-rose-600'
                    : totalAllocatedHours === maxHours
                    ? 'bg-emerald-500'
                    : 'bg-indigo-600'
                }`}
              />
            </div>
          </div>

          {isOverAllocated && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>Validation Error:</strong> Total allocated hours ({totalAllocatedHours}h) cannot exceed the employee&apos;s verified overtime hours ({maxHours}h). Please adjust the split.
              </span>
            </div>
          )}

          {/* Table of Batch Allocations */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Production Order</th>
                  <th className="p-3">Batch Number</th>
                  <th className="p-3">Manufacturing Process</th>
                  <th className="p-3 w-28 text-right">Allocated Hours</th>
                  <th className="p-3 w-32 text-right">Cost (BDT)</th>
                  <th className="p-3 text-center">Overhead / Direct</th>
                  <th className="p-3 w-12 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {allocations.map((alloc, idx) => (
                  <tr key={alloc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-2.5">
                      <select
                        value={alloc.productionOrderId}
                        onChange={(e) => handleUpdateLine(idx, 'productionOrderId', e.target.value)}
                        className="w-full py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                      >
                        {productionOrders.map((po) => (
                          <option key={po.id} value={po.id}>
                            {po.orderNumber || po.id} • {po.productName}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="p-2.5">
                      <input
                        type="text"
                        value={alloc.productionBatchNumber}
                        onChange={(e) => handleUpdateLine(idx, 'productionBatchNumber', e.target.value)}
                        className="w-full py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                      />
                    </td>

                    <td className="p-2.5">
                      <select
                        value={alloc.processType}
                        onChange={(e) => handleUpdateLine(idx, 'processType', e.target.value as ProductionProcessType)}
                        className="w-full py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                      >
                        <option value="Spot Welding & Busbar">Spot Welding &amp; Busbar</option>
                        <option value="Cell Testing & Sorting">Cell Testing &amp; Sorting</option>
                        <option value="BMS Wiring & Soldering">BMS Wiring &amp; Soldering</option>
                        <option value="Casing & Insulation">Casing &amp; Insulation</option>
                        <option value="Final Pack Aging & Cycle Test">Final Pack Aging &amp; Cycle Test</option>
                        <option value="Maintenance & Tooling">Maintenance &amp; Tooling (Overhead)</option>
                        <option value="General Factory Overhead">General Factory Overhead</option>
                      </select>
                    </td>

                    <td className="p-2.5 text-right">
                      <input
                        type="number"
                        min="0.1"
                        max={maxHours}
                        step="0.25"
                        value={alloc.allocatedHours}
                        onChange={(e) => handleUpdateLine(idx, 'allocatedHours', parseFloat(e.target.value) || 0)}
                        className="w-20 py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-right"
                      />
                    </td>

                    <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(alloc.allocatedCostBDT)}
                    </td>

                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        alloc.isOverhead
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                      }`}>
                        {alloc.isOverhead ? 'Factory Overhead' : 'Direct Batch Cost'}
                      </span>
                    </td>

                    <td className="p-2.5 text-center">
                      <button
                        type="button"
                        disabled={allocations.length <= 1}
                        onClick={() => handleRemoveLine(idx)}
                        className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 disabled:opacity-30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Line Button */}
          <div className="flex justify-between items-center pt-1">
            <button
              type="button"
              onClick={handleAddLine}
              className="py-1.5 px-3 rounded-xl border border-dashed border-indigo-400 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Production Batch Split</span>
            </button>

            <span className="text-[11px] text-slate-400 italic">
              Costing rule: Maintenance OT is absorbed as Factory Overhead; assembly OT is direct batch cost.
            </span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isOverAllocated}
              onClick={handleSave}
              className="py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save &amp; Capitalize Batch Overtime Costs</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
