/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ensec ERP - Overtime Request Management Tab
 * Implements Section 2: Requisitions linked to existing Employee Master & Production Batches,
 * and Section 8: 4-tier approval workflow (Supervisor -> Prod. Mgr -> HR -> Final).
 */

import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext.tsx';
import {
  Search,
  Filter,
  PlusCircle,
  Clock,
  User,
  Cpu,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Eye,
  Trash2,
  Edit,
  ArrowRight,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { OvertimeRequest, OvertimeStatus } from '../../types/overtime.ts';

interface OvertimeRequestsTabProps {
  onOpenNewRequest: () => void;
  onOpenApprovalModal: (request: OvertimeRequest) => void;
  onOpenBatchSplitModal: (request: OvertimeRequest) => void;
}

export const OvertimeRequestsTab: React.FC<OvertimeRequestsTabProps> = ({
  onOpenNewRequest,
  onOpenApprovalModal,
  onOpenBatchSplitModal,
}) => {
  const {
    overtimeRequests,
    deleteOvertimeRequest,
    currentUser,
    currentUserHasPermission,
    formatCurrency,
  } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [batchFilter, setBatchFilter] = useState<string>('all');

  // Filtered List
  const filteredRequests = useMemo(() => {
    return overtimeRequests.filter((req) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesEmp = req.employeeName.toLowerCase().includes(q) || req.employeeCode.toLowerCase().includes(q);
        const matchesReq = req.requestNumber.toLowerCase().includes(q);
        const matchesBatch = (req.productionBatchNumber || '').toLowerCase().includes(q);
        const matchesPurpose = req.projectPurpose.toLowerCase().includes(q);
        if (!matchesEmp && !matchesReq && !matchesBatch && !matchesPurpose) return false;
      }

      // Status
      if (statusFilter !== 'all' && req.status !== statusFilter) {
        return false;
      }

      // Department
      if (departmentFilter !== 'all' && req.department !== departmentFilter) {
        return false;
      }

      // Batch
      if (batchFilter !== 'all' && req.productionBatchNumber !== batchFilter) {
        return false;
      }

      return true;
    });
  }, [overtimeRequests, searchQuery, statusFilter, departmentFilter, batchFilter]);

  // Unique departments and batches for filter dropdowns
  const departments = useMemo(() => {
    return Array.from(new Set(overtimeRequests.map((r) => r.department))).filter(Boolean);
  }, [overtimeRequests]);

  const batches = useMemo(() => {
    return Array.from(new Set(overtimeRequests.map((r) => r.productionBatchNumber))).filter(Boolean);
  }, [overtimeRequests]);

  const getStatusBadge = (status: OvertimeStatus) => {
    switch (status) {
      case 'Final Approved':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'HR Verified':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800';
      case 'Production Approved':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800';
      case 'Supervisor Approved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      case 'Pending Supervisor':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'Rejected':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300';
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Header & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search request #, employee name, code, batch number, or purpose..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
          >
            <option value="all">All Approval Statuses</option>
            <option value="Pending Supervisor">Pending Supervisor (Step 1)</option>
            <option value="Supervisor Approved">Supervisor Approved (Step 2)</option>
            <option value="Production Approved">Production Approved (Step 3)</option>
            <option value="HR Verified">HR Verified (Step 4)</option>
            <option value="Final Approved">Final Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Batch Filter */}
          <select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
          >
            <option value="all">All Batches</option>
            {batches.map((b) => (
              <option key={b} value={b}>
                Batch: {b}
              </option>
            ))}
          </select>

          <button
            onClick={onOpenNewRequest}
            className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create OT Request</span>
          </button>
        </div>
      </div>

      {/* Requests Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Request # &amp; Date</th>
                <th className="p-3">Employee Details</th>
                <th className="p-3">Production Batch &amp; Purpose</th>
                <th className="p-3 text-center">Expected Time</th>
                <th className="p-3 text-right">Hours &amp; Cost</th>
                <th className="p-3 text-center">Approval Workflow</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No overtime requests match your search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 block">
                        {req.requestNumber}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {req.overtimeDate}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {req.employeeName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {req.employeeCode} • {req.designation}
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        {req.department}
                      </span>
                    </td>

                    <td className="p-3 max-w-[240px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                          {req.productionBatchNumber || 'General Overhead'}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          req.purposeCategory === 'Direct Production'
                            ? 'bg-blue-50 dark:bg-blue-950 text-blue-600'
                            : 'bg-amber-50 dark:bg-amber-950 text-amber-600'
                        }`}>
                          {req.purposeCategory}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-1 font-medium" title={req.projectPurpose}>
                        {req.projectPurpose}
                      </p>
                    </td>

                    <td className="p-3 text-center">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 block">
                        {req.expectedStartTime} – {req.expectedEndTime}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Requested by {req.requestedBy.split(' ')[0]}
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <span className="font-mono font-bold text-slate-900 dark:text-white block">
                        {req.actualOvertimeHours || req.expectedHours} hrs
                      </span>
                      <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-xs">
                        {formatCurrency(req.calculatedOvertimeAmountBDT || 0)}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {req.overtimeMultiplier || 2.0}x Multiplier
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block ${getStatusBadge(req.status)}`}>
                        {req.status}
                      </span>
                      {req.rejectionReason && (
                        <span className="block text-[10px] text-rose-500 mt-0.5" title={req.rejectionReason}>
                          Reason: {req.rejectionReason.slice(0, 24)}...
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {req.status !== 'Final Approved' && req.status !== 'Rejected' && (
                          <button
                            onClick={() => onOpenApprovalModal(req)}
                            title="Review & Advance Approval"
                            className="py-1 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] flex items-center gap-1 transition-colors"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Sign Off</span>
                          </button>
                        )}

                        <button
                          onClick={() => onOpenBatchSplitModal(req)}
                          title="Allocate & Split Hours across Batches"
                          className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 transition-colors"
                        >
                          <Cpu className="w-3.5 h-3.5" />
                        </button>

                        {!req.isPayrollProcessed && (
                          <button
                            onClick={() => deleteOvertimeRequest(req.id)}
                            title="Delete Request"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
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
  );
};
