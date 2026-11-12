/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ensec ERP - New Overtime Request Modal
 * Allows supervisors to schedule and submit overtime requisitions linked
 * to existing Employee Master and Production Orders & Batches.
 */

import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext.tsx';
import {
  X,
  Clock,
  User,
  Cpu,
  Layers,
  Calendar,
  AlertCircle,
  Calculator,
  Save,
  CheckCircle2,
  ShieldAlert,
  Info,
} from 'lucide-react';
import {
  OvertimePurposeCategory,
  calculateNetOvertimeHours,
  calculateHourlyRate,
  calculateOvertimeTotalBDT,
  calculateEmployeeIndividualOvertime,
  EmployeeOvertimePolicy,
} from '../../types/overtime.ts';

interface NewOvertimeRequestModalProps {
  onClose: () => void;
  onSuccess?: (requestId: string) => void;
  initialEmployeeId?: string;
}

export const NewOvertimeRequestModal: React.FC<NewOvertimeRequestModalProps> = ({
  onClose,
  onSuccess,
  initialEmployeeId,
}) => {
  const {
    fieldForceReps,
    productionOrders,
    salaryStructures,
    getEmployeeEffectiveOvertimePolicy,
    createOvertimeRequest,
    currentUser,
    formatCurrency,
  } = useERP();

  // Selected Employee
  const [employeeId, setEmployeeId] = useState<string>(
    initialEmployeeId || (fieldForceReps[0]?.id || '')
  );

  const selectedEmployee = useMemo(() => {
    return fieldForceReps.find((r) => r.id === employeeId) || fieldForceReps[0] || null;
  }, [fieldForceReps, employeeId]);

  // Selected Production Order & Batch
  const [productionOrderId, setProductionOrderId] = useState<string>(
    productionOrders[0]?.id || ''
  );

  const selectedOrder = useMemo(() => {
    return productionOrders.find((p) => p.id === productionOrderId) || null;
  }, [productionOrders, productionOrderId]);

  // Form Fields
  const [overtimeDate, setOvertimeDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [purposeCategory, setPurposeCategory] = useState<OvertimePurposeCategory>('Direct Production');
  const [customBatchNumber, setCustomBatchNumber] = useState<string>('');
  const [projectPurpose, setProjectPurpose] = useState<string>('');
  const [expectedStartTime, setExpectedStartTime] = useState<string>('18:30');
  const [expectedEndTime, setExpectedEndTime] = useState<string>('22:00');
  const [isOvernight, setIsOvernight] = useState<boolean>(false);
  const [breakDurationMinutes, setBreakDurationMinutes] = useState<number>(15);
  const [overtimeReason, setOvertimeReason] = useState<string>('');

  // Retrieve employee's assigned individual overtime policy based on overtime date
  const employeePolicy: EmployeeOvertimePolicy | null = useMemo(() => {
    if (!selectedEmployee) return null;
    return getEmployeeEffectiveOvertimePolicy(selectedEmployee.id, overtimeDate);
  }, [selectedEmployee, overtimeDate, getEmployeeEffectiveOvertimePolicy]);

  const liveCalculations = useMemo(() => {
    if (!selectedEmployee || !employeePolicy) {
      return {
        hours: 0,
        hourlyRate: 0,
        multiplier: 2.0,
        totalAmount: 0,
        basicSalary: 0,
        isEligible: true,
        calculationBasis: 'Basic Salary' as const,
        effectiveRate: 0,
      };
    }
    const str = salaryStructures.find((s) => s.employeeId === selectedEmployee.id);
    const basic = str ? str.basicSalaryBDT : (selectedEmployee.basicSalaryBDT || 25000);

    const hours = calculateNetOvertimeHours(
      expectedStartTime,
      expectedEndTime,
      breakDurationMinutes,
      isOvernight
    );

    const calc = calculateEmployeeIndividualOvertime(basic, employeePolicy, hours);

    return {
      hours,
      hourlyRate: calc.hourlyRate,
      multiplier: calc.multiplier,
      totalAmount: calc.totalAmountBDT,
      basicSalary: basic,
      isEligible: calc.isEligible,
      calculationBasis: calc.calculationBasis,
      effectiveRate: calc.effectiveRateBDT,
    };
  }, [
    selectedEmployee,
    salaryStructures,
    employeePolicy,
    expectedStartTime,
    expectedEndTime,
    breakDurationMinutes,
    isOvernight,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    const batchNo = customBatchNumber.trim() || selectedOrder?.batchNumber || 'KUS-B2610-01';
    const orderNo = selectedOrder?.orderNumber || selectedOrder?.id || 'PO-PRD-2026-001';
    const prodName = selectedOrder?.productName || 'Ensec 48V 100Ah Lithium Pack';

    const newReq = createOvertimeRequest({
      employeeId: selectedEmployee.id,
      employeeCode: selectedEmployee.code || 'EMP-000',
      employeeName: selectedEmployee.name || 'Staff Member',
      department: selectedEmployee.department || 'Manufacturing & Assembly',
      designation: selectedEmployee.designation || 'Technician',
      employeeCategory: selectedEmployee.employeeCategory || 'Factory Employee',
      overtimeDate,
      purposeCategory,
      productionOrderId: selectedOrder?.id,
      productionOrderNumber: orderNo,
      productionBatchNumber: batchNo,
      productName: prodName,
      projectPurpose: projectPurpose.trim() || `Production shift on batch ${batchNo}`,
      expectedStartTime,
      expectedEndTime,
      expectedHours: liveCalculations.hours,
      overtimeReason: overtimeReason.trim() || 'Urgent assembly line quota',
      requestedBy: currentUser.name,
      // Default single batch allocation initialized
      batchAllocations: purposeCategory === 'Direct Production' ? [
        {
          id: `alloc-${Date.now()}`,
          productionOrderId: selectedOrder?.id || 'po-1',
          productionOrderNumber: orderNo,
          productionBatchNumber: batchNo,
          productName: prodName,
          processType: 'Spot Welding & Busbar',
          allocatedHours: liveCalculations.hours,
          hourlyRateBDT: liveCalculations.hourlyRate * liveCalculations.multiplier,
          allocatedCostBDT: liveCalculations.totalAmount,
          isOverhead: false,
          notes: 'Initial production batch assignment',
        }
      ] : [
        {
          id: `alloc-${Date.now()}`,
          productionOrderId: 'overhead',
          productionOrderNumber: 'OVERHEAD-PLANT',
          productionBatchNumber: 'PLANT-MAINTENANCE',
          productName: 'Factory Facility',
          processType: 'General Factory Overhead',
          allocatedHours: liveCalculations.hours,
          hourlyRateBDT: liveCalculations.hourlyRate * liveCalculations.multiplier,
          allocatedCostBDT: liveCalculations.totalAmount,
          isOverhead: true,
          notes: 'Maintenance overhead - absorbed into factory utility expense',
        }
      ],
    });

    if (onSuccess) onSuccess(newReq.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in duration-150">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">Create Overtime Request</h2>
              <p className="text-xs text-blue-100">Step 1 of Multi-Step Overtime Requisition Workflow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {/* Employee Selection */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Select Employee (Existing Employee Master) *</span>
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
              className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
            >
              {fieldForceReps.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.name} ({rep.code || 'EMP'}) — {rep.designation || 'Staff'} • {rep.department || 'Operations'}
                </option>
              ))}
            </select>
            {selectedEmployee && employeePolicy && (
              <div className="space-y-2">
                {/* Employee Overtime Policy Details Card */}
                <div className={`p-3 rounded-xl border text-[11px] space-y-2 ${
                  employeePolicy.isEligible && employeePolicy.status === 'Active'
                    ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50 text-slate-800 dark:text-slate-200'
                    : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-blue-200/50 dark:border-blue-900/40 pb-1.5">
                    <span className="font-bold flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Assigned Overtime Policy: {selectedEmployee.name} ({selectedEmployee.code})</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${
                      employeePolicy.isEligible && employeePolicy.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200'
                    }`}>
                      {employeePolicy.isEligible && employeePolicy.status === 'Active'
                        ? 'Eligible (Active Policy)'
                        : employeePolicy.status === 'Inactive'
                        ? 'Policy Inactive'
                        : 'Overtime Ineligible'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Calculation Basis:</span>
                      <strong className="text-slate-900 dark:text-white">
                        {employeePolicy.calculationBasis}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
                        {employeePolicy.calculationBasis === 'Fixed Hourly Rate' ? 'Fixed Base Rate:' : 'Standard Divisor:'}
                      </span>
                      <strong className="font-mono text-slate-900 dark:text-white">
                        {employeePolicy.calculationBasis === 'Fixed Hourly Rate'
                          ? `৳${employeePolicy.fixedHourlyRateBDT || 0}/hr`
                          : `${employeePolicy.standardMonthlyWorkingHours} Hours`}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px]">OT Multiplier:</span>
                      <strong className="font-mono text-amber-600 dark:text-amber-400">
                        {employeePolicy.overtimeMultiplier}x
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Computed Base Rate:</span>
                      <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(liveCalculations.hourlyRate)}/hr
                      </strong>
                    </div>
                  </div>

                  {!employeePolicy.isEligible && (
                    <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold pt-1">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      <span>Note: This employee is marked ineligible for overtime in Field Force Employee Master. Total amount will be recorded as 0 unless policy is updated.</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Date & Purpose Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Overtime Date *</span>
              </label>
              <input
                type="date"
                value={overtimeDate}
                onChange={(e) => setOvertimeDate(e.target.value)}
                required
                className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Purpose Category *
              </label>
              <select
                value={purposeCategory}
                onChange={(e) => setPurposeCategory(e.target.value as OvertimePurposeCategory)}
                required
                className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              >
                <option value="Direct Production">Direct Production (Allocated to Batch)</option>
                <option value="Rework & QC">Rework &amp; QC Inspection (Allocated to Batch)</option>
                <option value="Urgent Order Fulfillment">Urgent Order Fulfillment (Allocated to Batch)</option>
                <option value="Factory Maintenance">Factory Maintenance (Overhead Expense)</option>
                <option value="Packaging & Dispatch">Packaging &amp; Dispatch</option>
                <option value="General Operations">General Factory Operations</option>
              </select>
            </div>
          </div>

          {/* Production Order & Batch Selection */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                <span>Production Order &amp; Batch Assignment</span>
              </span>
              <span className="text-[10px] text-slate-500">From Existing Production Modules</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-600 dark:text-slate-400 font-medium text-[11px]">
                  Production Order
                </label>
                <select
                  value={productionOrderId}
                  onChange={(e) => setProductionOrderId(e.target.value)}
                  className="w-full py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  {productionOrders.length > 0 ? (
                    productionOrders.map((po) => (
                      <option key={po.id} value={po.id}>
                        {po.orderNumber || po.id} • {po.productName || 'Battery Pack'} ({po.plannedQty || 100} units)
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="po-prd-2026-001">PO-PRD-2026-001 • 48V 100Ah Lithium Pack</option>
                      <option value="po-prd-2026-002">PO-PRD-2026-002 • 60V 50Ah EV Lithium Pack</option>
                      <option value="po-prd-2026-034">PO-PRD-2026-034 • 12V 200Ah Telecom Battery</option>
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 dark:text-slate-400 font-medium text-[11px]">
                  Batch Number
                </label>
                <input
                  type="text"
                  placeholder={selectedOrder?.batchNumber || 'e.g. KUS-B2610-01'}
                  value={customBatchNumber}
                  onChange={(e) => setCustomBatchNumber(e.target.value)}
                  className="w-full py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-600 dark:text-slate-400 font-medium text-[11px]">
                Project / Specific Work Purpose *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Nickel strip welding on 16S packs & BMS harness attachment"
                value={projectPurpose}
                onChange={(e) => setProjectPurpose(e.target.value)}
                className="w-full py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              />
            </div>
          </div>

          {/* Time & Hours Configuration */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Start Time *</label>
              <input
                type="time"
                value={expectedStartTime}
                onChange={(e) => setExpectedStartTime(e.target.value)}
                required
                className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">End Time *</label>
              <input
                type="time"
                value={expectedEndTime}
                onChange={(e) => setExpectedEndTime(e.target.value)}
                required
                className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Break (Mins)</label>
              <input
                type="number"
                min="0"
                max="120"
                step="5"
                value={breakDurationMinutes}
                onChange={(e) => setBreakDurationMinutes(parseInt(e.target.value, 10) || 0)}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Overnight Shift</label>
              <button
                type="button"
                onClick={() => setIsOvernight(!isOvernight)}
                className={`w-full py-2 px-3 rounded-xl border font-bold text-center transition-colors ${
                  isOvernight
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                {isOvernight ? '🌙 Overnight' : 'Standard'}
              </button>
            </div>
          </div>

          {/* Overtime Reason */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Reason for Overtime Requisition *
            </label>
            <textarea
              rows={2}
              required
              placeholder="State production bottleneck, urgent dispatch requirements, or scheduled machine maintenance..."
              value={overtimeReason}
              onChange={(e) => setOvertimeReason(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            />
          </div>

          {/* Live Automatic Calculation Banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white space-y-2 border border-indigo-900/50 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs flex items-center gap-1.5 text-indigo-300">
                <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                <span>Automatic Cost Calculation (Policy-Based)</span>
              </span>
              <span className="text-[10px] text-indigo-200 font-mono">
                Formula: Hourly Rate × {liveCalculations.multiplier}x Multiplier × Net Hours
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1 border-t border-indigo-900/60">
              <div>
                <span className="text-slate-400 block text-[10px]">Net OT Hours:</span>
                <span className="font-mono font-bold text-emerald-400 text-xs">
                  {liveCalculations.hours} Hours
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Base Hourly Rate:</span>
                <span className="font-mono font-bold text-white text-xs">
                  {formatCurrency(liveCalculations.hourlyRate)}/hr
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Policy Multiplier:</span>
                <span className="font-mono font-bold text-amber-400 text-xs">
                  {liveCalculations.multiplier}x (BLA 2006)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Total Overtime Cost:</span>
                <span className="font-mono font-black text-amber-300 text-sm">
                  {formatCurrency(liveCalculations.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Submit for Supervisor Approval</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
