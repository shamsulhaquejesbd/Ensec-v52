/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ensec ERP - Transaction Detail & Printable Voucher Modal
 */

import React from 'react';
import {
  X,
  Printer,
  FileText,
  Calendar,
  Landmark,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Building,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { CashBankTransaction } from '../../types/cashBank.ts';

interface TransactionDetailModalProps {
  transaction: CashBankTransaction | null;
  onClose: () => void;
  onReverse?: (transactionId: string) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
  onReverse,
}) => {
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const isDebit = (transaction.debit || 0) > 0;
  const isContra = transaction.isContra || transaction.type.includes('Deposit') || transaction.type.includes('Withdrawal');
  const isReversed = transaction.status === 'Reversed';

  // Amount in words simulation
  const formatAmountBDT = (num: number) => {
    return `BDT ${Number(num || 0).toLocaleString('en-BD')}/-`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden print:border-none print:shadow-none print:w-full print:max-w-none">
        {/* Header - Screen Only */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isReversed
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                : isContra
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400'
                : isDebit
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
            }`}>
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Voucher Details</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {transaction.voucherNo}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">Official Double-Entry Accounting Voucher</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Document */}
        <div className="p-6 space-y-6 text-slate-900 dark:text-slate-100 print:p-8">
          {/* Company Official Letterhead */}
          <div className="flex items-start justify-between border-b-2 border-slate-800 dark:border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-blue-600 text-white font-extrabold flex items-center justify-center text-xs">
                  ES
                </div>
                <h1 className="text-lg font-black tracking-tight text-blue-600 dark:text-blue-400 uppercase">
                  Ensec Lithium BD
                </h1>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Aman Energy Storage Systems & Lithium Battery Manufacturing Division
              </p>
              <p className="text-[10px] text-slate-400">
                Head Office: Navana Tower, Dilkusha C/A, Dhaka-1000 | Plant: Kushtia Industrial Zone
              </p>
            </div>
            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                isReversed
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : isContra
                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                  : isDebit
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}>
                {transaction.type} Voucher
              </span>
              <p className="text-xs font-mono font-bold mt-1.5 text-slate-700 dark:text-slate-300">
                #{transaction.voucherNo}
              </p>
              <p className="text-[11px] text-slate-500 flex items-center justify-end gap-1 mt-0.5">
                <Calendar className="w-3 h-3" />
                <span>Date: {transaction.date}</span>
              </p>
            </div>
          </div>

          {/* Reversal Alert if Reversed */}
          {isReversed && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold">This transaction entry has been REVERSED & ADJUSTED</p>
                {transaction.reversalReason && (
                  <p className="text-[11px] mt-0.5 opacity-90">Reason: {transaction.reversalReason}</p>
                )}
              </div>
            </div>
          )}

          {/* Key Particulars Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Account</span>
              <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1 mt-0.5">
                <Landmark className="w-3 h-3 text-blue-500" />
                {transaction.accountName}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Account Type</span>
              <span className="font-semibold text-slate-900 dark:text-white block mt-0.5">
                {transaction.accountType} Book
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Category</span>
              <span className="font-semibold text-slate-900 dark:text-white block mt-0.5">
                {transaction.category}
              </span>
            </div>
            {transaction.partyName && (
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Party / Entity</span>
                <span className="font-semibold text-slate-900 dark:text-white block mt-0.5">
                  {transaction.partyName}
                </span>
              </div>
            )}
            {transaction.referenceNo && (
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Ref / Cheque / Slip #</span>
                <span className="font-semibold font-mono text-slate-900 dark:text-white block mt-0.5">
                  {transaction.referenceNo}
                </span>
              </div>
            )}
            {transaction.invoiceNo && (
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Linked Invoice</span>
                <span className="font-semibold font-mono text-blue-600 dark:text-blue-400 block mt-0.5">
                  {transaction.invoiceNo}
                </span>
              </div>
            )}
            {transaction.serviceRef && (
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Service Job Card</span>
                <span className="font-semibold font-mono text-teal-600 dark:text-teal-400 block mt-0.5">
                  {transaction.serviceRef}
                </span>
              </div>
            )}
            {transaction.targetAccountName && (
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Contra Target Account</span>
                <span className="font-semibold text-slate-900 dark:text-white block mt-0.5">
                  {transaction.targetAccountName}
                </span>
              </div>
            )}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Created By</span>
              <span className="font-semibold text-slate-900 dark:text-white block mt-0.5">
                {transaction.createdBy}
              </span>
            </div>
          </div>

          {/* Description & Particulars */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Description / Particulars</span>
            <p className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              {transaction.description || 'No particulars recorded.'}
            </p>
          </div>

          {/* Remarks */}
          {transaction.remarks && (
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Remarks & Verification Notes</span>
              <p className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/20 text-xs text-slate-600 dark:text-slate-400 italic">
                "{transaction.remarks}"
              </p>
            </div>
          )}

          {/* Double Entry Accounting Breakdown Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 flex justify-between">
              <span>Accounting Ledger Breakdown</span>
              <span>Double-Entry Verification</span>
            </div>
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/40 text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2 px-4 text-left font-semibold">Ledger Account</th>
                  <th className="py-2 px-4 text-left font-semibold">Classification</th>
                  <th className="py-2 px-4 text-right font-semibold">Debit (BDT)</th>
                  <th className="py-2 px-4 text-right font-semibold">Credit (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isDebit ? (
                  <>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {transaction.accountName}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">Asset (Cash & Bank)</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {transaction.debit.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-400 font-mono">-</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        {transaction.isContra
                          ? transaction.targetAccountName || 'Counter Cash/Bank Account'
                          : transaction.category}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {transaction.isContra ? 'Asset (Contra Transfer)' : 'Revenue / Accounts Receivable'}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-400 font-mono">-</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                        {transaction.debit.toLocaleString()}
                      </td>
                    </tr>
                  </>
                ) : (
                  <>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        {transaction.isContra
                          ? transaction.targetAccountName || 'Counter Cash/Bank Account'
                          : transaction.category}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {transaction.isContra ? 'Asset (Contra Transfer)' : 'Operating Expense / Liability'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                        {transaction.credit.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-400 font-mono">-</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {transaction.accountName}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">Asset (Cash & Bank)</td>
                      <td className="py-2.5 px-4 text-right text-slate-400 font-mono">-</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                        {transaction.credit.toLocaleString()}
                      </td>
                    </tr>
                  </>
                )}
                <tr className="bg-slate-50 dark:bg-slate-900/60 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                  <td colSpan={2} className="py-2.5 px-4 text-slate-900 dark:text-white uppercase text-[11px]">
                    Total Balanced Amount
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-900 dark:text-white">
                    {formatAmountBDT(transaction.amount)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-900 dark:text-white">
                    {formatAmountBDT(transaction.amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Amount In Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
            <div>
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider block">
                Total Transaction Value
              </span>
              <span className="text-xl font-black font-mono text-blue-900 dark:text-blue-200">
                {formatAmountBDT(transaction.amount)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Account Running Balance</span>
              <span className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
                BDT {Number(transaction.runningBalance || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Signatures for Official Physical Printout */}
          <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs">
            <div className="border-t border-slate-400 dark:border-slate-600 pt-2">
              <p className="font-semibold text-slate-800 dark:text-slate-200">{transaction.createdBy}</p>
              <p className="text-[10px] text-slate-400">Prepared By</p>
            </div>
            <div className="border-t border-slate-400 dark:border-slate-600 pt-2">
              <p className="font-semibold text-slate-800 dark:text-slate-200">Tanvir Hossain</p>
              <p className="text-[10px] text-slate-400">Verified By (Accounts)</p>
            </div>
            <div className="border-t border-slate-400 dark:border-slate-600 pt-2">
              <p className="font-semibold text-slate-800 dark:text-slate-200">Authorized Signature</p>
              <p className="text-[10px] text-slate-400">Auditor / CFO Approval</p>
            </div>
          </div>
        </div>

        {/* Modal Footer (Screen only) */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 print:hidden">
          <div>
            {!isReversed && onReverse && transaction.type !== 'Opening Balance' && (
              <button
                onClick={() => {
                  onClose();
                  onReverse(transaction.id);
                }}
                className="px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reverse / Adjust Entry</span>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-xs font-semibold shadow-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
