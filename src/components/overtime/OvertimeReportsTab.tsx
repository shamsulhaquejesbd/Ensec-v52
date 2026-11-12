import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  Filter, 
  FileText, 
  TrendingUp, 
  Users, 
  Building2, 
  Layers, 
  Coins, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';

export const OvertimeReportsTab: React.FC = () => {
  const { overtimeRequests, fieldForceReps, productionOrders } = useERP();

  const [activeReport, setActiveReport] = useState<number>(1);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState(() => new Date().toISOString().slice(0, 7));
  const [employeeFilter, setEmployeeFilter] = useState('all');

  // List of 7 reports requested
  const reportsList = [
    { id: 1, name: 'Employee-wise Monthly Overtime Report', icon: Users, desc: 'Aggregated monthly overtime hours, wage rates, and earnings per worker' },
    { id: 2, name: 'Department-wise Overtime Report', icon: Building2, desc: 'Hours and cost breakdown across Production Assembly, QC, Maintenance, etc.' },
    { id: 3, name: 'Production Batch-wise Overtime Cost Report', icon: Layers, desc: 'Direct OT cost absorbed per manufactured battery batch' },
    { id: 4, name: 'Production Order-wise Overtime Cost Report', icon: FileText, desc: 'Overtime expense absorbed per Production Work Order' },
    { id: 5, name: 'Monthly Overtime Payroll Reconciliation Report', icon: Coins, desc: 'Payable overtime amounts audited against salary sheets' },
    { id: 6, name: 'Pending Overtime Approval Workflow Report', icon: Clock, desc: 'Bottlenecks and requests awaiting Supervisor, Production Mgr, or HR sign-off' },
    { id: 7, name: 'Overtime Hours vs Production Output Report', icon: TrendingUp, desc: 'Efficiency ratio of overtime input hours to finished goods units produced' },
  ];

  // Helper to export any dataset to Excel
  const exportToExcel = (data: any[], fileName: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${fileName}_${monthFilter}.xlsx`);
  };

  // Generate Report 1: Employee-wise
  const generateEmployeeReport = () => {
    const grouped: { [empId: string]: { name: string; dept: string; hours: number; amount: number; count: number } } = {};
    overtimeRequests.forEach(r => {
      if (departmentFilter !== 'all' && r.department !== departmentFilter) return;
      if (employeeFilter !== 'all' && r.employeeId !== employeeFilter) return;
      if (!grouped[r.employeeId]) {
        grouped[r.employeeId] = {
          name: r.employeeName,
          dept: r.department,
          hours: 0,
          amount: 0,
          count: 0
        };
      }
      grouped[r.employeeId].hours += r.actualOvertimeHours || r.expectedHours || 0;
      grouped[r.employeeId].amount += r.calculatedOvertimeAmountBDT || 0;
      grouped[r.employeeId].count += 1;
    });

    return Object.entries(grouped).map(([id, val]) => ({
      'Employee ID': id,
      'Employee Name': val.name,
      'Department': val.dept,
      'OT Duty Days': val.count,
      'Total OT Hours': Number(val.hours.toFixed(2)),
      'Average Rate (BDT)': Math.round(val.amount / (val.hours || 1)),
      'Total Overtime Amount (BDT)': Math.round(val.amount),
    }));
  };

  // Generate Report 2: Department-wise
  const generateDepartmentReport = () => {
    const grouped: { [dept: string]: { hours: number; amount: number; employees: Set<string> } } = {};
    overtimeRequests.forEach(r => {
      if (!grouped[r.department]) {
        grouped[r.department] = { hours: 0, amount: 0, employees: new Set() };
      }
      grouped[r.department].hours += r.actualOvertimeHours || r.expectedHours || 0;
      grouped[r.department].amount += r.calculatedOvertimeAmountBDT || 0;
      grouped[r.department].employees.add(r.employeeId);
    });

    return Object.entries(grouped).map(([dept, val]) => ({
      'Department': dept,
      'Active OT Workers': val.employees.size,
      'Total OT Hours': Number(val.hours.toFixed(2)),
      'Total OT Cost (BDT)': Math.round(val.amount),
      'Average Cost Per Hour (BDT)': Math.round(val.amount / (val.hours || 1)),
    }));
  };

  // Generate Report 3: Batch-wise
  const generateBatchReport = () => {
    const batchMap: { [batch: string]: { orderNo: string; hours: number; cost: number; process: string } } = {};
    overtimeRequests.forEach(r => {
      r.batchAllocations?.forEach(b => {
        const key = b.isOverhead ? 'FACTORY_OVERHEAD' : b.productionBatchNumber;
        if (!batchMap[key]) {
          batchMap[key] = {
            orderNo: b.isOverhead ? 'N/A (Overhead)' : b.productionOrderNumber,
            hours: 0,
            cost: 0,
            process: b.processType
          };
        }
        batchMap[key].hours += b.allocatedHours;
        batchMap[key].cost += b.allocatedCostBDT;
      });
    });

    return Object.entries(batchMap).map(([batch, val]) => ({
      'Batch Number': batch,
      'Production Order': val.orderNo,
      'Allocated OT Hours': Number(val.hours.toFixed(2)),
      'Direct Overtime Cost (BDT)': Math.round(val.cost),
      'Allocation Type': batch === 'FACTORY_OVERHEAD' ? 'Factory Indirect Overhead' : 'Direct WIP Labor',
    }));
  };

  // Generate Report 4: Order-wise
  const generateOrderReport = () => {
    return productionOrders.map(order => {
      const orderOvertimeReqs = overtimeRequests.filter(r => 
        r.batchAllocations?.some(b => b.productionOrderNumber === order.orderNumber)
      );
      const totalCost = orderOvertimeReqs.reduce((sum, r) => {
        const alloc = r.batchAllocations?.find(b => b.productionOrderNumber === order.orderNumber);
        return sum + (alloc?.allocatedCostBDT || 0);
      }, 0);
      const totalHours = orderOvertimeReqs.reduce((sum, r) => {
        const alloc = r.batchAllocations?.find(b => b.productionOrderNumber === order.orderNumber);
        return sum + (alloc?.allocatedHours || 0);
      }, 0);

      return {
        'Order Number': order.orderNumber,
        'Batch Number': order.batchNumber || 'N/A',
        'Product Name': order.productName || 'Battery Unit',
        'Batch Quantity': order.quantity,
        'Overtime Hours Absorbed': Number(totalHours.toFixed(2)),
        'Overtime Cost Absorbed (BDT)': Math.round(totalCost),
        'Per Unit OT Cost (BDT)': Number((totalCost / (order.quantity || 1)).toFixed(2)),
      };
    });
  };

  // Generate Report 5: Payroll Sync
  const generatePayrollReport = () => {
    return overtimeRequests.map(r => ({
      'Request #': r.requestNumber,
      'Date': r.overtimeDate,
      'Employee ID': r.employeeId,
      'Employee Name': r.employeeName,
      'Department': r.department,
      'Hours': r.actualOvertimeHours || r.expectedHours,
      'Rate (BDT)': r.hourlyRateBDT || 0,
      'Total OT (BDT)': r.calculatedOvertimeAmountBDT || 0,
      'Payroll Processed': r.isPayrollProcessed ? 'YES' : 'PENDING',
      'Payroll Run ID': r.payrollRunId || 'Unposted',
      'Approval Status': r.status.toUpperCase(),
    }));
  };

  // Generate Report 6: Pending Approvals
  const generatePendingReport = () => {
    return overtimeRequests.filter(r => r.status !== 'Final Approved' && r.status !== 'Rejected').map(r => ({
      'Request #': r.requestNumber,
      'Date': r.overtimeDate,
      'Employee Name': r.employeeName,
      'Department': r.department,
      'Current Workflow Step': r.status,
      'Expected Hours': r.expectedHours,
      'Actual Hours': r.actualOvertimeHours || r.expectedHours,
      'Estimated Cost (BDT)': r.calculatedOvertimeAmountBDT || 0,
      'Requested By': r.requestedBy,
    }));
  };

  // Generate Report 7: Hours vs Output
  const generateEfficiencyReport = () => {
    return productionOrders.map(order => {
      const orderOvertimeReqs = overtimeRequests.filter(r => 
        r.batchAllocations?.some(b => b.productionOrderNumber === order.orderNumber)
      );
      const totalHours = orderOvertimeReqs.reduce((sum, r) => {
        const alloc = r.batchAllocations?.find(b => b.productionOrderNumber === order.orderNumber);
        return sum + (alloc?.allocatedHours || 0);
      }, 0);

      return {
        'Production Order': order.orderNumber,
        'Batch': order.batchNumber,
        'Finished Units Produced': order.quantity,
        'Total OT Hours Expended': Number(totalHours.toFixed(2)),
        'Overtime Hours Per Unit': Number((totalHours / (order.quantity || 1)).toFixed(3)),
        'Production Status': order.status,
      };
    });
  };

  // Current active report data
  const currentData = 
    activeReport === 1 ? generateEmployeeReport() :
    activeReport === 2 ? generateDepartmentReport() :
    activeReport === 3 ? generateBatchReport() :
    activeReport === 4 ? generateOrderReport() :
    activeReport === 5 ? generatePayrollReport() :
    activeReport === 6 ? generatePendingReport() :
    generateEfficiencyReport();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <h3 className="font-semibold text-slate-100">Statutory & Operational Overtime Reporting Engine</h3>
          </div>
          
        </div>

        <button
          onClick={() => exportToExcel(currentData, reportsList[activeReport - 1].name.replace(/\s+/g, '_'))}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          Export to Excel (.xlsx)
        </button>
      </div>

      {/* Reports Grid Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {reportsList.map((rep) => {
          const Icon = rep.icon;
          const isActive = activeReport === rep.id;
          return (
            <button
              key={rep.id}
              onClick={() => setActiveReport(rep.id)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                isActive
                  ? 'bg-blue-50/80 border-blue-400 shadow-sm ring-1 ring-blue-500'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`p-1.5 rounded-lg ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className={`text-xs font-bold line-clamp-1 ${isActive ? 'text-blue-900' : 'text-slate-800'}`}>
                  {rep.name}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                {rep.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-700">Filters:</span>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-700 bg-white"
          >
            <option value="all">All Departments</option>
            <option value="Production Assembly">Production Assembly</option>
            <option value="Cell Formation & Testing">Cell Formation & Testing</option>
            <option value="Quality Control">Quality Control</option>
            <option value="Plant Maintenance">Plant Maintenance</option>
          </select>

          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-700 bg-white max-w-[200px]"
          >
            <option value="all">All Employees</option>
            {fieldForceReps.map(r => (
              <option key={r.id} value={r.id}>{r.name} ({r.id})</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-slate-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>Active Period:</span>
          <input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="px-2 py-1 border border-slate-200 rounded text-slate-700 bg-white"
          />
        </div>
      </div>

      {/* Report Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900">{reportsList[activeReport - 1].name}</span>
            <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono">
              {currentData.length} Records
            </span>
          </div>
          <span className="text-xs text-slate-400">Bangladesh Labor Standards Audit Compliant</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                {currentData.length > 0 && Object.keys(currentData[0]).map((col) => (
                  <th key={col} className="py-3 px-4 whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No data found for the selected filter combination.
                  </td>
                </tr>
              ) : (
                currentData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    {Object.entries(row).map(([key, val], cellIdx) => (
                      <td key={cellIdx} className="py-3 px-4 whitespace-nowrap font-medium text-slate-700">
                        {typeof val === 'number' && key.includes('BDT') ? (
                          <span className="font-mono font-bold text-slate-900">৳{val.toLocaleString()}</span>
                        ) : typeof val === 'number' && key.includes('Hours') ? (
                          <span className="font-mono text-blue-700 font-semibold">{val} hrs</span>
                        ) : (
                          String(val)
                        )}
                      </td>
                    ))}
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
