/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ensec ERP - Overtime Management Dashboard
 * Implements Section 1: KPI Cards and Visualizations (Monthly Trend, Department-wise Hours, Batch-wise Cost).
 */

import React, { useMemo } from 'react';
import { useERP } from '../../context/ERPContext.tsx';
import {
  Clock,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle2,
  Building,
  BarChart3,
  TrendingUp,
  Cpu,
  PlusCircle,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';

interface OvertimeDashboardTabProps {
  onOpenNewRequest: () => void;
  onOpenAttendanceModal: () => void;
  onNavigateTab: (tabId: string) => void;
}

export const OvertimeDashboardTab: React.FC<OvertimeDashboardTabProps> = ({
  onOpenNewRequest,
  onOpenAttendanceModal,
  onNavigateTab,
}) => {
  const {
    overtimeRequests,
    overtimeAttendances,
    fieldForceReps,
    formatCurrency,
  } = useERP();

  // 1. KPI Calculations
  const kpis = useMemo(() => {
    const totalHours = overtimeRequests.reduce(
      (sum, r) => sum + (r.actualOvertimeHours || r.expectedHours || 0),
      0
    );

    const approvedHours = overtimeRequests
      .filter((r) => r.status === 'Final Approved')
      .reduce((sum, r) => sum + (r.actualOvertimeHours || r.expectedHours || 0), 0);

    const totalCost = overtimeRequests.reduce(
      (sum, r) => sum + (r.calculatedOvertimeAmountBDT || 0),
      0
    );

    const uniqueEmployees = new Set(overtimeRequests.map((r) => r.employeeId)).size;

    const pendingRequests = overtimeRequests.filter(
      (r) =>
        r.status === 'Pending Supervisor' ||
        r.status === 'Supervisor Approved' ||
        r.status === 'Production Approved' ||
        r.status === 'HR Verified'
    ).length;

    // Department Breakdown
    const deptMap: Record<string, { hours: number; cost: number; count: number }> = {};
    overtimeRequests.forEach((r) => {
      const dept = r.department || 'Manufacturing & Assembly';
      if (!deptMap[dept]) {
        deptMap[dept] = { hours: 0, cost: 0, count: 0 };
      }
      deptMap[dept].hours += r.actualOvertimeHours || r.expectedHours || 0;
      deptMap[dept].cost += r.calculatedOvertimeAmountBDT || 0;
      deptMap[dept].count += 1;
    });

    const departmentWise = Object.entries(deptMap)
      .map(([name, data]) => ({
        name,
        hours: Math.round(data.hours * 10) / 10,
        cost: data.cost,
        count: data.count,
      }))
      .sort((a, b) => b.cost - a.cost);

    // Batch Breakdown
    const batchMap: Record<string, { hours: number; cost: number; orderNumber: string }> = {};
    overtimeRequests.forEach((r) => {
      if (Array.isArray(r.batchAllocations) && r.batchAllocations.length > 0) {
        r.batchAllocations.forEach((alloc) => {
          const bNo = alloc.productionBatchNumber || 'General Overhead';
          if (!batchMap[bNo]) {
            batchMap[bNo] = { hours: 0, cost: 0, orderNumber: alloc.productionOrderNumber };
          }
          batchMap[bNo].hours += alloc.allocatedHours || 0;
          batchMap[bNo].cost += alloc.allocatedCostBDT || 0;
        });
      } else if (r.productionBatchNumber) {
        const bNo = r.productionBatchNumber;
        if (!batchMap[bNo]) {
          batchMap[bNo] = { hours: 0, cost: 0, orderNumber: r.productionOrderNumber || 'PO-PRD-001' };
        }
        batchMap[bNo].hours += r.actualOvertimeHours || r.expectedHours || 0;
        batchMap[bNo].cost += r.calculatedOvertimeAmountBDT || 0;
      }
    });

    const batchWise = Object.entries(batchMap)
      .map(([batchNumber, data]) => ({
        batchNumber,
        orderNumber: data.orderNumber,
        hours: Math.round(data.hours * 10) / 10,
        cost: data.cost,
      }))
      .sort((a, b) => b.cost - a.cost);

    // Monthly Trend (dynamic aggregation)
    const monthMap: Record<string, { hours: number; cost: number }> = {};

    overtimeRequests.forEach((r) => {
      if (r.overtimeDate) {
        const d = new Date(r.overtimeDate);
        if (!isNaN(d.getTime())) {
          const mKey = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          if (!monthMap[mKey]) monthMap[mKey] = { hours: 0, cost: 0 };
          monthMap[mKey].hours += r.actualOvertimeHours || r.expectedHours || 0;
          monthMap[mKey].cost += r.calculatedOvertimeAmountBDT || 0;
        }
      }
    });

    const monthlyTrend = Object.entries(monthMap).map(([month, data]) => ({
      month,
      hours: Math.round(data.hours * 10) / 10,
      cost: data.cost,
    }));

    return {
      totalHours: Math.round(totalHours * 10) / 10,
      approvedHours: Math.round(approvedHours * 10) / 10,
      totalCost,
      uniqueEmployees,
      pendingRequests,
      departmentWise,
      batchWise,
      monthlyTrend,
    };
  }, [overtimeRequests]);

  // Max values for chart bar heights
  const maxMonthlyCost = Math.max(...kpis.monthlyTrend.map((m) => m.cost), 1);
  const maxDeptHours = Math.max(...kpis.departmentWise.map((d) => d.hours), 1);
  const maxBatchCost = Math.max(...kpis.batchWise.map((b) => b.cost), 1);

  return (
    <div className="space-y-6">
      {/* Top Action Banner (Light Theme) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-900/50">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Ensec Overtime Management &amp; Batch Costing
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Operational overtime tracking, factory attendance verification, and work order costing
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onOpenNewRequest}
            className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span>New OT Request</span>
          </button>
          <button
            onClick={onOpenAttendanceModal}
            className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold border border-slate-200 dark:border-slate-700 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Record OT Attendance</span>
          </button>
          <button
            onClick={() => onNavigateTab('reports')}
            className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold border border-slate-200 dark:border-slate-700 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Reports</span>
          </button>
        </div>
      </div>

      {/* 6 Key KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* KPI 1: Total Overtime Hours */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase">1. Total OT Hours</span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
            {kpis.totalHours} <span className="text-xs font-normal text-slate-400">hrs</span>
          </div>
          <p className="text-[10px] text-slate-400">Planned &amp; verified total</p>
        </div>

        {/* KPI 2: Total Overtime Cost */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase">2. Total OT Cost</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {formatCurrency(kpis.totalCost)}
          </div>
          <p className="text-[10px] text-slate-400">Labor Act 2.0x multiplier</p>
        </div>

        {/* KPI 3: Employees Working Overtime */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase">3. Active Staff</span>
            <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono">
            {kpis.uniqueEmployees} <span className="text-xs font-normal text-slate-400">staff</span>
          </div>
          <p className="text-[10px] text-slate-400">Assembly &amp; cell testing</p>
        </div>

        {/* KPI 4: Pending Overtime Requests */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase">4. Pending Sign-off</span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {kpis.pendingRequests} <span className="text-xs font-normal text-slate-400">reqs</span>
          </div>
          <p className="text-[10px] text-slate-400">Awaiting multi-level approval</p>
        </div>

        {/* KPI 5: Approved Overtime Hours */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase">5. Approved Hours</span>
            <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-cyan-600 dark:text-cyan-400 font-mono">
            {kpis.approvedHours} <span className="text-xs font-normal text-slate-400">hrs</span>
          </div>
          <p className="text-[10px] text-slate-400">Final approved &amp; verified</p>
        </div>

        {/* KPI 6: Top Department Cost */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase">6. Top Dept Cost</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
              <Building className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-base font-black text-indigo-600 dark:text-indigo-400 font-mono truncate">
            {formatCurrency(kpis.departmentWise[0]?.cost || 0)}
          </div>
          <p className="text-[10px] text-slate-400 truncate">
            {kpis.departmentWise[0]?.name || 'Manufacturing'}
          </p>
        </div>
      </div>

      {/* 3 Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Viz 1: Monthly Overtime Cost Trend */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Monthly Overtime Cost Trend</span>
              </h3>
              <p className="text-[10px] text-slate-500">Historical &amp; active month financial expenditure</p>
            </div>
            <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
              BDT Expense
            </span>
          </div>

          <div className="pt-4 flex items-center justify-between gap-3 h-44">
            {kpis.monthlyTrend.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <span>No monthly trend data recorded yet</span>
                <span className="text-[10px] text-slate-400 mt-1">Add approved overtime to visualize trends</span>
              </div>
            ) : (
              kpis.monthlyTrend.map((item) => {
                const heightPct = Math.round((item.cost / maxMonthlyCost) * 100);
                return (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                      ৳{Math.round(item.cost / 1000)}k
                    </span>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg overflow-hidden flex items-end h-32">
                      <div
                        style={{ height: `${Math.max(12, heightPct)}%` }}
                        className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-lg group-hover:from-blue-500 group-hover:to-cyan-400 transition-all duration-300"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium truncate w-full text-center">
                      {item.month}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Viz 2: Department-wise Overtime Hours */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Department-wise Overtime Hours</span>
              </h3>
              <p className="text-[10px] text-slate-500">Staff overtime distribution by operational branch</p>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
              Hours Distribution
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {kpis.departmentWise.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                No department overtime logged yet
              </div>
            ) : (
              kpis.departmentWise.slice(0, 4).map((dept) => {
                const widthPct = Math.round((dept.hours / maxDeptHours) * 100);
                return (
                  <div key={dept.name} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                        {dept.name}
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {dept.hours} hrs • {formatCurrency(dept.cost)}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.max(10, widthPct)}%` }}
                        className="bg-emerald-500 h-full rounded-full"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Viz 3: Production Batch-wise Overtime Cost */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-indigo-600" />
                <span>Batch-wise Overtime Cost</span>
              </h3>
              <p className="text-[10px] text-slate-500">Capitalized direct overtime absorbed into battery packs</p>
            </div>
            <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
              Cost Absorption
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {kpis.batchWise.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                No manufacturing batch allocations yet
              </div>
            ) : (
              kpis.batchWise.slice(0, 4).map((b) => {
                const widthPct = Math.round((b.cost / maxBatchCost) * 100);
                return (
                  <div key={b.batchNumber} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {b.batchNumber}
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(b.cost)} ({b.hours}h)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.max(10, widthPct)}%` }}
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick Access Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigateTab('requests')}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500 cursor-pointer shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
          <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-2">
            Requisition Approvals
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Process pending supervisor, production manager, and HR wage verification requests.
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('batch_allocation')}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 cursor-pointer shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
              <Cpu className="w-4 h-4" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>
          <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-2">
            Production Batch Allocations
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Split technician overtime hours across active assembly orders and calculate unit costing.
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('payroll_costing_sync')}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500 cursor-pointer shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </div>
          <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-2">
            Payroll &amp; Costing Synchronization
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Audit salary sheet entries against WIP batch absorption to prevent double-counting.
          </p>
        </div>
      </div>
    </div>
  );
};
