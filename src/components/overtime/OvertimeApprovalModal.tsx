/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ensec ERP - Overtime Multi-Step Approval Modal
 * Workflow Engine: Supervisor → Production Manager → HR/Accounts → Final Approval.
 */

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext.tsx';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  UserCheck,
  ShieldCheck,
  FileCheck,
  Building,
  DollarSign,
  ArrowRight,
  Info,
} from 'lucide-react';
import { OvertimeRequest } from '../../types/overtime.ts';

interface OvertimeApprovalModalProps {
  request: OvertimeRequest;
  onClose: () => void;
  onSuccess?: () => void;
}

export const OvertimeApprovalModal: React.FC<OvertimeApprovalModalProps> = ({
  request,
  onClose,
  onSuccess,
}) => {
  const {
    advanceOvertimeWorkflow,
    rejectOvertimeRequest,
    currentUser,
    formatCurrency,
  } = useERP();

  const [mode, setMode] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [remarks, setRemarks] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // Determine current active step in workflow
  let currentStep: 'SUPERVISOR' | 'PRODUCTION' | 'HR' | 'FINAL' = 'SUPERVISOR';
  let stepTitle = 'Step 1: Supervisor Review & Approval';
  let nextStatus = 'Supervisor Approved';

  if (request.status === 'Pending Supervisor') {
    currentStep = 'SUPERVISOR';
    stepTitle = 'Step 1: Supervisor Review & Approval';
    nextStatus = 'Supervisor Approved';
  } else if (request.status === 'Supervisor Approved') {
    currentStep = 'PRODUCTION';
    stepTitle = 'Step 2: Production Manager Approval';
    nextStatus = 'Production Approved';
  } else if (request.status === 'Production Approved') {
    currentStep = 'HR';
    stepTitle = 'Step 3: HR & Accounts Wage Verification';
    nextStatus = 'HR Verified';
  } else if (request.status === 'HR Verified') {
    currentStep = 'FINAL';
    stepTitle = 'Step 4: Final Executive Approval';
    nextStatus = 'Final Approved';
  }

  const handleApprove = () => {
    advanceOvertimeWorkflow(request.id, currentStep, remarks.trim() || undefined);
    if (onSuccess) onSuccess();
    onClose();
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) return;
    rejectOvertimeRequest(request.id, rejectionReason.trim());
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in duration-150">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">Overtime Approval Review</h2>
              <p className="text-xs text-indigo-300 font-mono">{request.requestNumber} • {stepTitle}</p>
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
          {/* Stepper Progress Bar */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
              <div className={`p-2 rounded-lg font-bold ${
                request.status !== 'Pending Supervisor'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-blue-600 text-white'
              }`}>
                1. Supervisor
              </div>
              <div className={`p-2 rounded-lg font-bold ${
                request.status === 'Production Approved' || request.status === 'HR Verified' || request.status === 'Final Approved'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : request.status === 'Supervisor Approved'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
              }`}>
                2. Prod. Mgr
              </div>
              <div className={`p-2 rounded-lg font-bold ${
                request.status === 'HR Verified' || request.status === 'Final Approved'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : request.status === 'Production Approved'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
              }`}>
                3. HR / Accts
              </div>
              <div className={`p-2 rounded-lg font-bold ${
                request.status === 'Final Approved'
                  ? 'bg-emerald-600 text-white'
                  : request.status === 'HR Verified'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
              }`}>
                4. Final
              </div>
            </div>
          </div>

          {/* Details Card */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {request.employeeName}
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                {request.employeeCode} • {request.department}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">Overtime Date:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{request.overtimeDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Time Range:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {request.expectedStartTime} – {request.expectedEndTime}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Planned Hours:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {request.expectedHours} Hours
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Production Order:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{request.productionOrderNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Production Batch:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{request.productionBatchNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Estimated Cost:</span>
                <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                  {formatCurrency(request.calculatedOvertimeAmountBDT || 0)}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-[11px] space-y-1">
              <div>
                <strong>Purpose:</strong> {request.projectPurpose}
              </div>
              <div>
                <strong>Reason:</strong> {request.overtimeReason}
              </div>
            </div>
          </div>

          {/* Action Choice Tabs */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('APPROVE')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${
                mode === 'APPROVE'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-500 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Approve ({stepTitle.split(':')[0]})</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('REJECT')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${
                mode === 'REJECT'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-500 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              <XCircle className="w-4 h-4 text-rose-500" />
              <span>Reject Request</span>
            </button>
          </div>

          {mode === 'APPROVE' ? (
            <div className="space-y-2">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Approval Remarks / Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Enter remarks for the next stage or audit trail..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              />
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-[11px] flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-blue-500" />
                <span>
                  Clicking Approve will advance this request to <strong>{nextStatus}</strong> by {currentUser.name}.
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="font-bold text-rose-700 dark:text-rose-400">
                Reason for Rejection *
              </label>
              <textarea
                rows={2}
                required
                placeholder="Specify reason for rejecting this overtime request..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20 text-slate-900 dark:text-white font-medium"
              />
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            {mode === 'APPROVE' ? (
              <button
                type="button"
                onClick={handleApprove}
                className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm &amp; Sign Off</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={!rejectionReason.trim()}
                onClick={handleReject}
                className="py-2 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold flex items-center gap-2 shadow-xs transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>Confirm Rejection</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
