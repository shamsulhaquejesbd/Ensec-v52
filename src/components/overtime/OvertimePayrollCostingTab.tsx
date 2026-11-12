import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { 
  ArrowRightLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  ShieldCheck, 
  Coins, 
  Factory, 
  Layers, 
  ExternalLink,
  History,
  Lock
} from 'lucide-react';

export const OvertimePayrollCostingTab: React.FC = () => {
  const { 
    overtimeRequests, 
    monthlyPayrollRuns, 
    productionOrders, 
    getProductionCostBreakdown,
    overtimeAuditLogs 
  } = useERP();

  const [selectedMonth, setSelectedMonth] = useState('2026-10');

  // Approved overtime requests
  const approvedRequests = overtimeRequests.filter(r => r.status === 'Final Approved');
  const processedInPayroll = approvedRequests.filter(r => r.isPayrollProcessed);
  const pendingInPayroll = approvedRequests.filter(r => !r.isPayrollProcessed);

  // Totals
  const totalApprovedOTCost = approvedRequests.reduce((sum, r) => sum + (r.calculatedOvertimeAmountBDT || 0), 0);
  const totalProcessedPayrollCost = processedInPayroll.reduce((sum, r) => sum + (r.calculatedOvertimeAmountBDT || 0), 0);
  const totalPendingPayrollCost = pendingInPayroll.reduce((sum, r) => sum + (r.calculatedOvertimeAmountBDT || 0), 0);

  // Costing allocations
  const directWIPOvertime = approvedRequests.reduce((sum, r) => {
    const directAlloc = r.batchAllocations?.filter(a => !a.isOverhead).reduce((s, a) => s + a.allocatedCostBDT, 0) || 0;
    return sum + directAlloc;
  }, 0);

  const overheadOvertime = approvedRequests.reduce((sum, r) => {
    const ovhAlloc = r.batchAllocations?.filter(a => a.isOverhead).reduce((s, a) => s + a.allocatedCostBDT, 0) || 0;
    return sum + ovhAlloc;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Top Reconciliation Summary Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg">
              <ArrowRightLeft className="w-5 h-5" />
            </span>
            <h3 className="font-semibold text-slate-100">Dual-Ledger Reconciliation & Anti-Double-Counting</h3>
          </div>
          <p className="text-xs text-slate-400 max-w-3xl">
            Strict audit controls guarantee that approved overtime is simultaneously recorded in <strong>Monthly Payroll</strong> (as taxable worker gross earnings) and capitalized in <strong>Production Costing</strong> (as Direct WIP Overtime or Factory Overhead) with zero double-counting or orphaned disbursements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Double-Posting Guard Active
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Approved OT Earnings</span>
            <Coins className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">৳{totalApprovedOTCost.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">{approvedRequests.length} verified work requests</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Posted in Payroll Runs</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600">৳{totalProcessedPayrollCost.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">{processedInPayroll.length} records locked into salary runs</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Direct WIP Absorbed</span>
            <Factory className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-700">৳{directWIPOvertime.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">Capitalized into production orders & batches</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Factory Overhead</span>
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700">৳{overheadOvertime.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">Maintenance & facility upkeep</div>
        </div>
      </div>

      {/* Two-Column Sync Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Monthly Payroll Integration */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-blue-600" />
              <h4 className="font-semibold text-slate-900 text-sm">Monthly Payroll Sync Status</h4>
            </div>
            <span className="text-xs text-slate-500">
              {pendingInPayroll.length} pending next run
            </span>
          </div>

          <div className="p-4 flex-1 space-y-3">
            <p className="text-xs text-slate-600">
              When <code>Generate Monthly Salary Run</code> is triggered in the Payroll module, all approved overtime records are locked with their generated <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700">payrollRunId</code> to permanently eliminate duplicate payouts.
            </p>

            <div className="space-y-2">
              {approvedRequests.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                  No approved overtime requests found for payroll sync.
                </div>
              ) : (
                approvedRequests.slice(0, 5).map((req) => (
                <div key={req.id} className="p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="font-semibold text-slate-800 flex items-center gap-2">
                      <span>{req.employeeName}</span>
                      <span className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded text-slate-600">{req.employeeId}</span>
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      {req.overtimeDate} • {(req.actualOvertimeHours || req.expectedHours || 0).toFixed(1)} hrs @ ৳{(req.hourlyRateBDT || 0).toFixed(0)}/h
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-slate-900">৳{(req.calculatedOvertimeAmountBDT || 0).toLocaleString()}</div>
                    {req.isPayrollProcessed ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 mt-0.5">
                        <Lock className="w-2.5 h-2.5" /> Run: {req.payrollRunId?.slice(0, 10)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 mt-0.5">
                        Pending Payroll Cycle
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
            </div>
          </div>
        </div>

        {/* Column 2: Production Costing Absorption Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Factory className="w-4 h-4 text-indigo-600" />
              <h4 className="font-semibold text-slate-900 text-sm">Production Batch Cost Absorption</h4>
            </div>
            <span className="text-xs text-slate-500">Live Costing Matrix</span>
          </div>

          <div className="p-4 flex-1 space-y-3">
            <p className="text-xs text-slate-600">
              Batch Cost Breakdown dynamically absorbs verified Direct Overtime into Finished Goods Unit Costing without modifying historical batch baseline bills.
            </p>

            <div className="space-y-2.5">
              {productionOrders.slice(0, 4).map((order) => {
                const breakdown = getProductionCostBreakdown(order.id);
                return (
                  <div key={order.id} className="p-3 rounded-lg border border-indigo-100 bg-indigo-50/30 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-indigo-950 font-mono flex items-center gap-2">
                        <span>{order.orderNumber}</span>
                        <span className="text-[10px] font-normal text-slate-500 bg-white px-1.5 py-0.5 rounded border border-indigo-200">
                          Batch: {order.batchNumber || 'BAT-01'}
                        </span>
                      </div>
                      <div className="text-slate-600 text-[11px] mt-0.5">
                        Product: {order.productName || 'Battery Pack'} ({order.quantity} Units)
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-500">Direct Overtime Absorbed</div>
                      <div className="font-mono font-bold text-indigo-700 text-sm">
                        ৳{breakdown?.directOvertimeCost?.toLocaleString() || 0}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Total Batch Cost: ৳{breakdown?.totalManufacturingCost?.toLocaleString() || 0}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Audit Trail Log */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h4 className="font-semibold text-slate-900 text-sm">Overtime & Costing Compliance Audit Log</h4>
          </div>
          <span className="text-xs text-slate-400">Read-Only Immutable System Ledger</span>
        </div>

        <div className="space-y-2">
          {overtimeAuditLogs.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs">
              No audit trail logs recorded yet.
            </div>
          ) : (
            overtimeAuditLogs.slice(0, 6).map((log) => (
            <div key={log.id} className="flex items-center justify-between py-2 border-b border-slate-50 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-semibold">
                  {log.action}
                </span>
                <span className="text-slate-700">{log.details}</span>
              </div>
              <div className="text-right text-slate-400 text-[11px] flex items-center gap-3">
                <span className="font-medium text-slate-600">{log.actorName}</span>
                <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))
        )}
        </div>
      </div>
    </div>
  );
};
