/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ensec ERP - Reversal & Adjustment Entry Modal
 * Accounting Rule #8: Enforces audit trail without deleting historical entries.
 */

import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  AlertTriangle,
  FileText,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { CashBankTransaction } from '../../types/cashBank.ts';

interface ReversalModalProps {
  transaction: CashBankTransaction | null;
  onClose: () => void;
  onConfirm: (transactionId: string, reason: string) => void;
}

export const ReversalModal: React.FC<ReversalModalProps> = ({
  transaction,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!transaction) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      setError('Please provide a descriptive reason for reversing this transaction (minimum 5 characters).');
      return;
    }
    setError('');
    onConfirm(transaction.id, reason.trim());
    onClose();
  };

  const isDebit = (transaction.debit || 0) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-amber-50 dark:bg-amber-950/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Reverse Financial Transaction
              </h3>
              <p className="text-[11px] text-slate-500">Double-Entry Reversal & Audit Correction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-900 dark:text-slate-100">
          {/* Compliance Notice */}
          <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs leading-relaxed flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-bold">Accounting Rule Compliance Notice:</p>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                Financial records cannot be permanently erased or tampered with. A balancing counter-entry will be posted to the general ledger with voucher prefix <b>REV-</b>, and this original voucher will be marked as <b>Reversed</b> with your recorded justification.
              </p>
            </div>
          </div>

          {/* Target Transaction Summary Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{transaction.voucherNo}</span>
              <span className="text-[11px] text-slate-500">{transaction.date}</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{transaction.accountName}</p>
                <p className="text-[11px] text-slate-500">{transaction.category} • {transaction.partyName || 'N/A'}</p>
              </div>
              <div className="text-right">
                <span className={`font-mono font-bold text-sm ${isDebit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {isDebit ? '+' : '-'} BDT {transaction.amount.toLocaleString()}
                </span>
                <p className="text-[10px] text-slate-400">{isDebit ? 'Debit (Inflow)' : 'Credit (Outflow)'}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400">
              <span className="font-medium text-slate-700 dark:text-slate-300">Action: </span>
              A counter-adjustment of <b>BDT {transaction.amount.toLocaleString()}</b> will be credited/debited back to <b>{transaction.accountName}</b>.
            </div>
          </div>

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Reason for Reversal / Correction <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Erroneous account selected, duplicate entry, client cancelled service job card #..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
              required
            />
            {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Confirm & Post Reversal Entry</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
