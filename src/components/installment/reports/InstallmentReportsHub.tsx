/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ensec ERP - Installment, Receivables & Collection Reporting Engine
 * Detailed statement generation with Print/PDF formatting and Excel/CSV data exports.
 */

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Search,
  Filter,
  FileSpreadsheet,
  Users,
  ShieldAlert,
  DollarSign,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { useERP } from '../../../context/ERPContext.tsx';

interface InstallmentReportsHubProps {
  initialReportId?: string;
  onNavigate?: (module: string) => void;
}

export const InstallmentReportsHub: React.FC<InstallmentReportsHubProps> = ({
  initialReportId = 'report-installment-receivable',
  onNavigate,
}) => {
  const {
    installmentPlans,
    installmentSchedules,
    installmentPayments,
    collectionAssignments,
    collectionFollowUps,
    smsLogs,
    customers,
  } = useERP();

  const [selectedReport, setSelectedReport] = useState<string>(initialReportId);
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState('ALL');
  const [dateRangeFrom, setDateRangeFrom] = useState('2026-01-01');
  const [dateRangeTo, setDateRangeTo] = useState(new Date().toISOString().slice(0, 10));

  // CSV Export utility
  const exportToCSV = (filename: string, rows: (string | number)[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -------------------------------------------------------------
  // 1. Installment Receivable Report
  // -------------------------------------------------------------
  const receivableReportData = useMemo(() => {
    return installmentPlans
      .filter((p) => (selectedCustomerFilter === 'ALL' ? true : p.customerId === selectedCustomerFilter))
      .map((p) => {
        const nextSchedule = installmentSchedules
          .filter((s) => s.planId === p.id && s.status !== 'Paid')
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

        return {
          agreementNo: p.agreementNo,
          customer: p.customerName,
          phone: p.customerPhone,
          product: p.productName,
          financedBDT: p.financedAmountBDT,
          totalPaidBDT: p.totalPaidBDT,
          outstandingBDT: p.totalOutstandingBDT,
          overdueBDT: p.overdueAmountBDT,
          nextDueDate: nextSchedule?.dueDate || 'Settled',
          nextDueAmount: nextSchedule?.remainingAmountBDT || 0,
          status: p.status,
        };
      });
  }, [installmentPlans, installmentSchedules, selectedCustomerFilter]);

  // -------------------------------------------------------------
  // 2. Monthly Collection Report
  // -------------------------------------------------------------
  const monthlyCollectionData = useMemo(() => {
    const groups: Record<string, { month: string; cash: number; bank: number; mfs: number; cheque: number; total: number }> = {};
    for (const p of installmentPayments) {
      const m = p.paymentDate.slice(0, 7); // YYYY-MM
      if (!groups[m]) {
        groups[m] = { month: m, cash: 0, bank: 0, mfs: 0, cheque: 0, total: 0 };
      }
      const grp = groups[m];
      grp.total += p.amountBDT;
      if (p.paymentMethod === 'Cash') grp.cash += p.amountBDT;
      else if (p.paymentMethod === 'Bank Transfer') grp.bank += p.amountBDT;
      else if (p.paymentMethod === 'bKash' || p.paymentMethod === 'Nagad') grp.mfs += p.amountBDT;
      else grp.cheque += p.amountBDT;
    }
    return Object.values(groups).sort((a, b) => b.month.localeCompare(a.month));
  }, [installmentPayments]);

  // -------------------------------------------------------------
  // 3. Aging Report (0-30, 31-60, 61-90, 90+)
  // -------------------------------------------------------------
  const agingReportData = useMemo(() => {
    return installmentPlans
      .filter((p) => p.status !== 'Settled')
      .map((p) => {
        const unpaid = installmentSchedules.filter((s) => s.planId === p.id && s.status !== 'Paid');
        let current0_30 = 0;
        let aging31_60 = 0;
        let aging61_90 = 0;
        let aging90plus = 0;

        for (const s of unpaid) {
          if (s.overdueDays <= 30) {
            current0_30 += s.remainingAmountBDT;
          } else if (s.overdueDays <= 60) {
            aging31_60 += s.remainingAmountBDT;
          } else if (s.overdueDays <= 90) {
            aging61_90 += s.remainingAmountBDT;
          } else {
            aging90plus += s.remainingAmountBDT;
          }
        }

        return {
          agreementNo: p.agreementNo,
          customer: p.customerName,
          totalOutstanding: p.totalOutstandingBDT,
          current0_30,
          aging31_60,
          aging61_90,
          aging90plus,
          maxOverdueDays: unpaid.reduce((max, s) => Math.max(max, s.overdueDays || 0), 0),
        };
      });
  }, [installmentPlans, installmentSchedules]);

  // -------------------------------------------------------------
  // 4. Officer Performance
  // -------------------------------------------------------------
  const officerPerformanceData = useMemo(() => {
    const officers: Record<
      string,
      { name: string; role: string; accountsCount: number; targetBDT: number; collectedBDT: number }
    > = {};

    for (const a of collectionAssignments) {
      if (!officers[a.assignedToName]) {
        officers[a.assignedToName] = {
          name: a.assignedToName,
          role: a.assignedToRole,
          accountsCount: 0,
          targetBDT: 0,
          collectedBDT: 0,
        };
      }
      officers[a.assignedToName].accountsCount++;
      officers[a.assignedToName].targetBDT += a.targetAmountBDT;
    }

    // Allocate collected amounts
    for (const p of installmentPayments) {
      const matchAssign = collectionAssignments.find((a) => a.planId === p.planId);
      if (matchAssign && officers[matchAssign.assignedToName]) {
        officers[matchAssign.assignedToName].collectedBDT += p.amountBDT;
      }
    }

    return Object.values(officers);
  }, [collectionAssignments, installmentPayments]);

  const handleExportCurrent = () => {
    if (selectedReport === 'report-installment-receivable') {
      const headers = [
        'Agreement No',
        'Customer',
        'Phone',
        'Product',
        'Financed (BDT)',
        'Paid (BDT)',
        'Outstanding (BDT)',
        'Overdue (BDT)',
        'Next Due Date',
        'Status',
      ];
      const rows = receivableReportData.map((r) => [
        r.agreementNo,
        r.customer,
        r.phone,
        r.product,
        r.financedBDT,
        r.totalPaidBDT,
        r.outstandingBDT,
        r.overdueBDT,
        r.nextDueDate,
        r.status,
      ]);
      exportToCSV('Ensec_Installment_Receivables_Report', [headers, ...rows]);
    } else if (selectedReport === 'report-installment-aging') {
      const headers = [
        'Agreement No',
        'Customer',
        'Total Outstanding',
        'Current (0-30d)',
        '31-60d',
        '61-90d',
        '90+ Days',
        'Max Overdue Days',
      ];
      const rows = agingReportData.map((r) => [
        r.agreementNo,
        r.customer,
        r.totalOutstanding,
        r.current0_30,
        r.aging31_60,
        r.aging61_90,
        r.aging90plus,
        r.maxOverdueDays,
      ]);
      exportToCSV('Ensec_Installment_Aging_Report', [headers, ...rows]);
    } else {
      const headers = ['Month', 'Cash Inflow', 'Bank Transfer', 'MFS', 'Cheque', 'Total Collected'];
      const rows = monthlyCollectionData.map((r) => [r.month, r.cash, r.bank, r.mfs, r.cheque, r.total]);
      exportToCSV('Ensec_Monthly_Collection_Report', [headers, ...rows]);
    }
  };

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-sm">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Installment & Receivables Audit Reports
              </h1>
              <p className="text-xs text-slate-500">
                Audited statements, aging buckets, monthly recovery breakdowns, and officer performance logs.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition border border-slate-200 dark:border-slate-700"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleExportCurrent}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV / Excel</span>
          </button>
        </div>
      </div>

      {/* Reports Selection Tabs matching Section 2 */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'report-installment-receivable', label: 'Installment Receivable Report' },
          { id: 'report-monthly-collection', label: 'Monthly Collection Report' },
          { id: 'report-installment-overdue', label: 'Overdue Receivables' },
          { id: 'report-customer-ledger', label: 'Customer Installment Ledger' },
          { id: 'report-installment-aging', label: 'Aging Matrix Report' },
          { id: 'report-officer-performance', label: 'Officer Performance' },
          { id: 'report-sms-delivery', label: 'SMS Delivery Report' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedReport(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedReport === tab.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report Content Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        {/* Report Sub-filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {selectedReport === 'report-installment-receivable' && 'Installment Receivables Statement'}
              {selectedReport === 'report-monthly-collection' && 'Monthly Installment Collection Ledger'}
              {selectedReport === 'report-installment-overdue' && 'Overdue Receivables & Escalation Summary'}
              {selectedReport === 'report-customer-ledger' && 'Customer-Specific Installment Ledger'}
              {selectedReport === 'report-installment-aging' && 'Installment Receivables Aging Matrix (0–90+ Days)'}
              {selectedReport === 'report-officer-performance' && 'Collection Officer Performance & Recovery %'}
              {selectedReport === 'report-sms-delivery' && 'Automated SMS Dispatch & Delivery Audit'}
            </h3>
            <span className="text-[10px] text-slate-400">
              Report Generated for: Ensec Lithium Batteries Bangladesh Ltd.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCustomerFilter}
              onChange={(e) => setSelectedCustomerFilter(e.target.value)}
              className="text-xs p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="ALL">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 1. RECEIVABLE STATEMENT */}
        {selectedReport === 'report-installment-receivable' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Agreement No</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Product</th>
                  <th className="p-3 text-right">Financed (BDT)</th>
                  <th className="p-3 text-right">Paid (BDT)</th>
                  <th className="p-3 text-right">Outstanding (BDT)</th>
                  <th className="p-3">Next Due Date</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {receivableReportData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No installment receivables found.
                    </td>
                  </tr>
                ) : (
                  receivableReportData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                        {row.agreementNo}
                      </td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{row.customer}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{row.product}</td>
                      <td className="p-3 text-right font-semibold">৳{row.financedBDT.toLocaleString()}</td>
                      <td className="p-3 text-right font-bold text-emerald-600">৳{row.totalPaidBDT.toLocaleString()}</td>
                      <td className="p-3 text-right font-black text-rose-600">৳{row.outstandingBDT.toLocaleString()}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{row.nextDueDate}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. MONTHLY COLLECTION */}
        {selectedReport === 'report-monthly-collection' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Month</th>
                  <th className="p-3 text-right">Cash Inflow</th>
                  <th className="p-3 text-right">Bank Transfer (EBL/City)</th>
                  <th className="p-3 text-right">MFS (bKash/Nagad)</th>
                  <th className="p-3 text-right">Bank Cheque</th>
                  <th className="p-3 text-right">Total Collection (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {monthlyCollectionData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No monthly collection history found.
                    </td>
                  </tr>
                ) : (
                  monthlyCollectionData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{row.month}</td>
                      <td className="p-3 text-right text-slate-600 dark:text-slate-300">৳{row.cash.toLocaleString()}</td>
                      <td className="p-3 text-right text-slate-600 dark:text-slate-300">৳{row.bank.toLocaleString()}</td>
                      <td className="p-3 text-right text-slate-600 dark:text-slate-300">৳{row.mfs.toLocaleString()}</td>
                      <td className="p-3 text-right text-slate-600 dark:text-slate-300">৳{row.cheque.toLocaleString()}</td>
                      <td className="p-3 text-right font-black text-emerald-600">৳{row.total.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. AGING MATRIX */}
        {selectedReport === 'report-installment-aging' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Agreement No</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3 text-right">Total Outstanding</th>
                  <th className="p-3 text-right">0–30 Days (Current)</th>
                  <th className="p-3 text-right">31–60 Days Overdue</th>
                  <th className="p-3 text-right">61–90 Days Overdue</th>
                  <th className="p-3 text-right">90+ Days Overdue</th>
                  <th className="p-3">Max Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {agingReportData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No aging receivables found. All accounts are up to date.
                    </td>
                  </tr>
                ) : (
                  agingReportData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                        {row.agreementNo}
                      </td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{row.customer}</td>
                      <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                        ৳{row.totalOutstanding.toLocaleString()}
                      </td>
                      <td className="p-3 text-right text-slate-600 dark:text-slate-300">
                        ৳{row.current0_30.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-semibold text-amber-600">
                        ৳{row.aging31_60.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-bold text-orange-600">
                        ৳{row.aging61_90.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-black text-rose-600">
                        ৳{row.aging90plus.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.maxOverdueDays > 30
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : row.maxOverdueDays > 0
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {row.maxOverdueDays > 0 ? `${row.maxOverdueDays} days` : 'Current'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. OFFICER PERFORMANCE */}
        {selectedReport === 'report-officer-performance' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Officer Name</th>
                  <th className="p-3">Role / Department</th>
                  <th className="p-3">Assigned Accounts</th>
                  <th className="p-3 text-right">Target Recovery (BDT)</th>
                  <th className="p-3 text-right">Actual Recovered (BDT)</th>
                  <th className="p-3 text-right">Recovery Efficiency %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {officerPerformanceData.map((row, idx) => {
                  const eff =
                    row.targetBDT > 0 ? Math.min(100, Math.round((row.collectedBDT / row.targetBDT) * 100)) : 80;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{row.name}</td>
                      <td className="p-3 text-slate-500">{row.role}</td>
                      <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                        {row.accountsCount} accounts
                      </td>
                      <td className="p-3 text-right font-semibold text-slate-900 dark:text-white">
                        ৳{row.targetBDT.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-600">
                        ৳{row.collectedBDT.toLocaleString()}
                      </td>
                      <td className="p-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          {eff}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. SMS DELIVERY REPORT */}
        {selectedReport === 'report-sms-delivery' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Recipient Phone</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Agreement</th>
                  <th className="p-3">Template</th>
                  <th className="p-3">Gateway Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {smsLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 text-slate-500">{log.sentAt}</td>
                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                      {log.recipientPhone}
                    </td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                      {log.recipientName}
                    </td>
                    <td className="p-3 font-mono text-blue-600 dark:text-blue-400">
                      {log.agreementNo || 'Direct'}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">
                      {log.templateCode || 'Standard'}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
