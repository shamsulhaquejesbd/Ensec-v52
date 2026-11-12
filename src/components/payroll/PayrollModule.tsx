/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ensec ERP - Enterprise Corporate Payroll Management System
 * Complete 13-Section Architecture with Double-Entry Accounting Integration
 */

import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  CheckCircle,
  CheckCircle2,
  Clock,
  Users,
  Download,
  Calendar,
  Building,
  Building2,
  FileText,
  Printer,
  TrendingUp,
  CreditCard,
  AlertCircle,
  Check,
  X,
  Edit2,
  Trash2,
  Eye,
  Settings,
  ShieldCheck,
  Layers,
  PieChart,
  BarChart3,
  ChevronRight,
  Filter,
  Briefcase,
  Smartphone,
  Tag,
  Lock,
  RotateCcw,
  Receipt,
  Percent,
  ChevronDown,
  Info,
  Gift,
  HelpCircle,
  UserCheck,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import {
  EmployeeCategory,
  EmploymentType,
  EmploymentStatus,
  AttendanceStatus,
  LeaveType,
  EmployeeSalaryStructure,
  AttendanceRecord,
  LeaveRecord,
  AdvanceLoanRecord,
  OvertimeRecord,
  BonusRecord,
  MonthlySalarySheetItem,
  MonthlyPayrollRun,
  SalaryPaymentRecord,
  PayrollSettings,
} from '../../types/payroll.ts';
import { FieldForceRep } from '../../types/erp.ts';

type PayrollTab =
  | 'dashboard'
  | 'salary_structure'
  | 'attendance'
  | 'leaves'
  | 'loans'
  | 'overtime'
  | 'bonuses'
  | 'processing'
  | 'salary_sheets'
  | 'payments'
  | 'payslips'
  | 'reports'
  | 'settings';

export const PayrollModule: React.FC = () => {
  const {
    currentUser,
    fieldForceReps,
    salaryStructures,
    attendanceRecords,
    leaveRecords,
    advanceLoans,
    overtimeRecords,
    bonusRecords,
    monthlyPayrollRuns,
    salaryPaymentRecords,
    payrollSettings,
    addSalaryStructure,
    updateSalaryStructure,
    markAttendance,
    bulkMarkAttendance,
    getEmployeeAttendanceSummary,
    applyLeave,
    approveLeave,
    rejectLeave,
    getEmployeeLeaveBalance,
    applyAdvanceLoan,
    approveAdvanceLoan,
    earlySettleAdvanceLoan,
    addOvertimeRecord,
    approveOvertimeRecord,
    rejectOvertimeRecord,
    addBonusRecord,
    approveBonusRecord,
    generateMonthlySalaryRun,
    finalizeMonthlyPayrollRun,
    deleteMonthlyPayrollRun,
    recordSalaryPayment,
    updatePayrollSettings,
  } = useERP();

  // Active top-level Tab
  const [activeTab, setActiveTab] = useState<PayrollTab>('dashboard');

  // Month-Year selection across the module
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>('2026-10');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('All');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [showStructureModal, setShowStructureModal] = useState<boolean>(false);
  const [editingStructure, setEditingStructure] = useState<EmployeeSalaryStructure | null>(null);
  const [selectedEmployeeForStructure, setSelectedEmployeeForStructure] = useState<FieldForceRep | null>(null);

  const [showAttendanceModal, setShowAttendanceModal] = useState<boolean>(false);
  const [showBulkAttendanceModal, setShowBulkAttendanceModal] = useState<boolean>(false);
  const [selectedDateForAtt, setSelectedDateForAtt] = useState<string>(new Date().toISOString().slice(0, 10));

  const [showLeaveModal, setShowLeaveModal] = useState<boolean>(false);
  const [showLoanModal, setShowLoanModal] = useState<boolean>(false);
  const [viewingLoanSchedule, setViewingLoanSchedule] = useState<AdvanceLoanRecord | null>(null);
  const [settlingLoan, setSettlingLoan] = useState<AdvanceLoanRecord | null>(null);

  const [showOvertimeModal, setShowOvertimeModal] = useState<boolean>(false);
  const [showBonusModal, setShowBonusModal] = useState<boolean>(false);

  const [showDisburseModal, setShowDisburseModal] = useState<boolean>(false);
  const [selectedRunItemForPayment, setSelectedRunItemForPayment] = useState<{ runId: string; item: MonthlySalarySheetItem } | null>(null);

  const [viewingPayslip, setViewingPayslip] = useState<{ run: MonthlyPayrollRun; item: MonthlySalarySheetItem } | null>(null);

  // Selected Report in Reports Tab
  const [selectedReportId, setSelectedReportId] = useState<string>('rep-register');

  // Form states for adding Salary Structure
  const [strBasic, setStrBasic] = useState<number>(30000);
  const [strHouseRent, setStrHouseRent] = useState<number>(15000);
  const [strMedical, setStrMedical] = useState<number>(3000);
  const [strConveyance, setStrConveyance] = useState<number>(4000);
  const [strMobile, setStrMobile] = useState<number>(2000);
  const [strSpecial, setStrSpecial] = useState<number>(0);
  const [strOther, setStrOther] = useState<number>(0);
  const [strEffectiveFrom, setStrEffectiveFrom] = useState<string>('2026-01-01');

  // Form state for Leave Application
  const [leaveEmployeeId, setLeaveEmployeeId] = useState<string>('');
  const [leaveType, setLeaveType] = useState<LeaveType>('Casual Leave');
  const [leaveStartDate, setLeaveStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [leaveEndDate, setLeaveEndDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [leaveReason, setLeaveReason] = useState<string>('');

  // Form state for Advance / Loan
  const [loanEmployeeId, setLoanEmployeeId] = useState<string>('');
  const [loanType, setLoanType] = useState<'Salary Advance' | 'Employee Loan'>('Employee Loan');
  const [loanAmount, setLoanAmount] = useState<number>(60000);
  const [loanTenure, setLoanTenure] = useState<number>(6);
  const [loanStartMonth, setLoanStartMonth] = useState<string>('2026-11');
  const [loanReason, setLoanReason] = useState<string>('Family Emergency / Medical Expense');

  // Form state for Overtime
  const [otEmployeeId, setOtEmployeeId] = useState<string>('');
  const [otDate, setOtDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [otHours, setOtHours] = useState<number>(4);
  const [otReason, setOtReason] = useState<string>('Production Batch Rush Order Dispatch');

  // Form state for Bonus
  const [bnsEmployeeId, setBnsEmployeeId] = useState<string>('');
  const [bnsType, setBnsType] = useState<'Festival Bonus' | 'Performance Bonus' | 'Sales Incentive'>('Festival Bonus');
  const [bnsAmount, setBnsAmount] = useState<number>(20000);
  const [bnsMonthYear, setBnsMonthYear] = useState<string>('2026-10');
  const [bnsRemarks, setBnsRemarks] = useState<string>('Annual Festival Ex-Gratia Allowance');

  // Form state for Disburse Payment
  const [payMethod, setPayMethod] = useState<'Bank Transfer' | 'Cash' | 'bKash' | 'Nagad'>('Bank Transfer');
  const [payBankName, setPayBankName] = useState<string>('City Bank PLC');
  const [payRef, setPayRef] = useState<string>('');
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // Current Active Run for selectedMonthYear
  const currentMonthRun = useMemo(() => {
    return (
      monthlyPayrollRuns.find((r) => (r.monthYear || r.payrollMonth) === selectedMonthYear) ||
      monthlyPayrollRuns[0]
    );
  }, [monthlyPayrollRuns, selectedMonthYear]);

  // Unique departments
  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    fieldForceReps.forEach((r) => {
      if (r.department) set.add(r.department);
    });
    return ['All', ...Array.from(set)];
  }, [fieldForceReps]);

  // Unique employee categories
  const categoryOptions: string[] = [
    'All',
    'Office Employee',
    'Field Employee',
    'Factory Employee',
    'Warehouse Employee',
    'Management Employee',
  ];

  // ==========================================
  // SECTION 1: DASHBOARD METRICS & CALCULATIONS
  // ==========================================
  const dashboardMetrics = useMemo(() => {
    const totalStaff = fieldForceReps.filter((r) => r.isActive !== false).length;
    const run = currentMonthRun;

    const totalCost = Number(run?.totalGrossBDT ?? run?.totalGrossSalaryBDT ?? 0);
    const totalNetPayable = Number(run?.totalNetBDT ?? run?.totalNetPayableBDT ?? 0);
    const totalDeductions = Number(run?.totalDeductionsBDT ?? 0);
    const totalOvertime = Number(run?.totalOvertimeBDT ?? 0);
    const totalBonuses = Number(run?.totalBonusBDT ?? run?.totalBonusesBDT ?? 0);
    const totalLoanDeductions = Number(run?.totalLoanDeductionsBDT ?? 0);
    const totalPF = Number(run?.totalPFDeductionsBDT ?? 0);
    const totalTax = Number(run?.totalTaxDeductionsBDT ?? 0);

    let totalBasic = 0;
    let totalAllowances = 0;
    let paidAmount = 0;
    let unpaidAmount = 0;

    if (run && run.items) {
      run.items.forEach((it) => {
        totalBasic += Number(it.basicSalaryBDT || 0);
        totalAllowances +=
          Number(it.houseRentBDT || 0) +
          Number(it.medicalAllowanceBDT || 0) +
          Number(it.conveyanceAllowanceBDT || 0) +
          Number(it.mobileAllowanceBDT || 0) +
          Number(it.specialAllowanceBDT || 0) +
          Number(it.foodAllowanceBDT || 0) +
          Number(it.otherAllowancesBDT || 0);

        const net = Number(it.netSalaryBDT ?? it.netPayableBDT ?? 0);
        if (it.paymentStatus === 'Paid') {
          paidAmount += net;
        } else {
          unpaidAmount += net;
        }
      });
    }

    const activeLoansTotal = advanceLoans
      .filter((l) => l.status === 'Approved' || l.status === 'Active')
      .reduce((s, l) => s + Number(l.remainingAmountBDT ?? l.remainingBalanceBDT ?? 0), 0);

    return {
      totalStaff,
      totalCost,
      totalNetPayable,
      totalDeductions,
      totalBasic,
      totalAllowances,
      totalOvertime,
      totalBonuses,
      totalLoanDeductions,
      totalPF,
      totalTax,
      paidAmount,
      unpaidAmount,
      activeLoansTotal,
      isFinalized: run?.status === 'Finalized' || run?.status === 'Paid',
    };
  }, [fieldForceReps, currentMonthRun, advanceLoans]);

  // Visual Breakdown: Department-wise Payroll Cost
  const deptCostBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    if (currentMonthRun && currentMonthRun.items) {
      currentMonthRun.items.forEach((it) => {
        const d = it.department || 'Operations';
        const cost = Number(it.totalGrossEarningsBDT ?? it.grossSalaryBDT ?? 0);
        map.set(d, (map.get(d) || 0) + cost);
      });
    }
    return Array.from(map.entries()).map(([dept, cost]) => ({ dept, cost }));
  }, [currentMonthRun]);

  // Visual Breakdown: Employee Category Breakdown
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; cost: number }>();
    if (currentMonthRun && currentMonthRun.items) {
      currentMonthRun.items.forEach((it) => {
        const cat = it.employeeCategory || 'Office Employee';
        const cur = map.get(cat) || { count: 0, cost: 0 };
        const cost = Number(it.totalGrossEarningsBDT ?? it.grossSalaryBDT ?? 0);
        map.set(cat, { count: cur.count + 1, cost: cur.cost + cost });
      });
    }
    return Array.from(map.entries()).map(([category, val]) => ({ category, ...val }));
  }, [currentMonthRun]);

  // Convert Number to BDT in Words for Payslip
  const numberToWordsBDT = (amount: number): string => {
    if (amount <= 0) return 'Zero Taka Only';
    const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teen = [
      'Ten',
      'Eleven',
      'Twelve',
      'Thirteen',
      'Fourteen',
      'Fifteen',
      'Sixteen',
      'Seventeen',
      'Eighteen',
      'Nineteen',
    ];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const formatHundreds = (n: number): string => {
      let str = '';
      if (n > 99) {
        str += single[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n > 19) {
        str += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      }
      if (n > 9) {
        str += teen[n - 10] + ' ';
        n = 0;
      }
      if (n > 0) {
        str += single[n] + ' ';
      }
      return str.trim();
    };

    let words = '';
    const crore = Math.floor(amount / 10000000);
    amount %= 10000000;
    const lakh = Math.floor(amount / 100000);
    amount %= 100000;
    const thousand = Math.floor(amount / 1000);
    amount %= 1000;
    const rem = amount;

    if (crore > 0) words += `${formatHundreds(crore)} Crore `;
    if (lakh > 0) words += `${formatHundreds(lakh)} Lakh `;
    if (thousand > 0) words += `${formatHundreds(thousand)} Thousand `;
    if (rem > 0) words += `${formatHundreds(rem)} `;

    return `Taka ${words.trim()} Only`;
  };

  return (
    <div className="space-y-6 w-full pb-16">
      {/* ========================================== */}
      {/* HEADER & MODULE NAVIGATION BAR */}
      {/* ========================================== */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Corporate Payroll & Compensation Engine
                </h1>
              
              </div>
            
            </div>
          </div>

          {/* Month-Year Selector & Quick Action */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <select
                value={selectedMonthYear}
                onChange={(e) => setSelectedMonthYear(e.target.value)}
                className="bg-transparent border-none text-slate-800 dark:text-slate-200 font-bold focus:outline-none cursor-pointer"
              >
                <option value="2026-11">November 2026</option>
                <option value="2026-10">October 2026 (Finalized)</option>
                <option value="2026-09">September 2026</option>
                <option value="2026-08">August 2026</option>
              </select>
            </div>

            <button
              onClick={() => {
                const runId = generateMonthlySalaryRun(selectedMonthYear);
                setActiveTab('processing');
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Process {selectedMonthYear} Payroll</span>
            </button>
          </div>
        </div>

        {/* 13 Section Tabs Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-100 dark:border-slate-800 pt-3 scrollbar-none">
          {[
            { id: 'dashboard', label: '1. Dashboard', icon: BarChart3 },
            { id: 'salary_structure', label: '2. Salary Structure', icon: Layers },
            { id: 'attendance', label: '3. Attendance', icon: Clock },
            { id: 'leaves', label: '4. Leaves', icon: Calendar },
            { id: 'loans', label: '5. Advances & Loans', icon: Receipt },
            { id: 'overtime', label: '6. Overtime', icon: Clock },
            { id: 'bonuses', label: '7. Bonuses & Incentives', icon: Gift },
            { id: 'processing', label: '8. Monthly Run', icon: RotateCcw },
            { id: 'salary_sheets', label: '9. Salary Sheets', icon: FileText },
            { id: 'payments', label: '10. Disbursements', icon: CreditCard },
            { id: 'payslips', label: '11. Payslips', icon: Printer },
            { id: 'reports', label: '12. Reports (13)', icon: PieChart },
            { id: 'settings', label: '13. Settings', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as PayrollTab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: PAYROLL DASHBOARD                                              */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* 12 Key Performance Indicator Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {/* 1. Total Cost */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Gross Payroll Cost
              </span>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                ৳ {(dashboardMetrics.totalCost || 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-blue-600 font-semibold block mt-1">
                Month: {selectedMonthYear}
              </span>
            </div>

            {/* 2. Basic Salary */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Basic Salaries
              </span>
              <div className="text-xl font-black text-slate-800 dark:text-slate-200 mt-1">
                ৳ {(dashboardMetrics.totalBasic || 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">Core Base Pay</span>
            </div>

            {/* 3. Allowances */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Allowances Total
              </span>
              <div className="text-xl font-black text-slate-800 dark:text-slate-200 mt-1">
                ৳ {(dashboardMetrics.totalAllowances || 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">House, Medical, Conveyance</span>
            </div>

            {/* 4. Overtime Cost */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Overtime Cost
              </span>
              <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                ৳ {(dashboardMetrics.totalOvertime || 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">Factory & Plant Extended</span>
            </div>

            {/* 5. Bonuses & Incentives */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Bonuses & Incentives
              </span>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                ৳ {(dashboardMetrics.totalBonuses || 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-600 block mt-1">Festival + Sales Commission</span>
            </div>

            {/* 6. Total Deductions */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Deductions
              </span>
              <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
                ৳ {(dashboardMetrics.totalDeductions || 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">Attendance, Loans, PF, Tax</span>
            </div>

            {/* 7. Net Salary Payable */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-2xs">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                Net Salary Payable
              </span>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                ৳ {(dashboardMetrics.totalNetPayable || 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold block mt-1">
                After All Deductions
              </span>
            </div>

            {/* 8. Disbursed / Paid */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Paid Salaries
              </span>
              <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
                ৳ {(dashboardMetrics.paidAmount || 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">Bank Transfer & Cash</span>
            </div>

            {/* 9. Unpaid / Pending */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Pending Disbursement
              </span>
              <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                ৳ {(dashboardMetrics.unpaidAmount || 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-amber-600 block mt-1">Ready for Bank EFT</span>
            </div>

            {/* 10. Processed Staff */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Active Employees
              </span>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {dashboardMetrics.totalStaff || 0}{' '}
                <span className="text-xs font-normal text-slate-500">Personnel</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">100% on Active Payroll</span>
            </div>

            {/* 11. Active Loans Outstanding */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Active Staff Loans
              </span>
              <div className="text-xl font-black text-slate-800 dark:text-slate-200 mt-1">
                ৳ {(dashboardMetrics.activeLoansTotal || 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                Deducted in Month: ৳{(dashboardMetrics.totalLoanDeductions || 0).toLocaleString()}
              </span>
            </div>

            {/* 12. PF Accrued */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Provident Fund & Tax
              </span>
              <div className="text-xl font-black text-slate-800 dark:text-slate-200 mt-1">
                ৳ {((dashboardMetrics.totalPF || 0) + (dashboardMetrics.totalTax || 0)).toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                PF: ৳{(dashboardMetrics.totalPF || 0).toLocaleString()} | Tax: ৳{(dashboardMetrics.totalTax || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* 5 Meaningful Visual Breakdown Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Visual 1: Department-wise Payroll Cost */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Department-wise Payroll Cost
                </h3>
                <Building className="w-4 h-4 text-blue-600" />
              </div>
              <div className="space-y-2.5 pt-1">
                {deptCostBreakdown.map((item) => {
                  const pct = Math.round((item.cost / (dashboardMetrics.totalCost || 1)) * 100);
                  return (
                    <div key={item.dept} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {item.dept}
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          ৳ {(item.cost || 0).toLocaleString()}{' '}
                          <span className="text-[10px] text-slate-400">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Visual 2: Category Breakdown */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Employee Category Distribution
                </h3>
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="space-y-2.5 pt-1">
                {categoryBreakdown.map((cat) => {
                  const pct = Math.round((cat.cost / (dashboardMetrics.totalCost || 1)) * 100);
                  return (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {cat.category}{' '}
                          <span className="text-[10px] text-slate-400">({cat.count} staff)</span>
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          ৳ {(cat.cost || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Visual 3: Earnings vs Deductions Breakdown */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Earnings vs Deductions Breakdown
                </h3>
                <Percent className="w-4 h-4 text-rose-600" />
              </div>
              <div className="space-y-2 pt-1 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Basic Pay</span>
                  <span className="font-bold">৳ {(dashboardMetrics.totalBasic || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Total Allowances</span>
                  <span className="font-bold">৳ {(dashboardMetrics.totalAllowances || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Overtime & Bonuses</span>
                  <span className="font-bold text-emerald-600">
                    ৳ {((dashboardMetrics.totalOvertime || 0) + (dashboardMetrics.totalBonuses || 0)).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 font-semibold border border-rose-100 dark:border-rose-900/40">
                  <span>Withholding Deductions</span>
                  <span>- ৳ {(dashboardMetrics.totalDeductions || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 font-black border border-emerald-200 dark:border-emerald-800">
                  <span>Net Disbursable</span>
                  <span>৳ {(dashboardMetrics.totalNetPayable || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Payroll & Loan Activities */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Recent Payroll & Double-Entry Accounting Events</span>
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {salaryPaymentRecords.slice(0, 5).map((pay) => (
                <div key={pay.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                      PAID
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {pay.employeeName} ({pay.employeeCode})
                      </span>
                      <span className="text-slate-400 text-[11px] block">
                        Method: {pay.paymentMethod} • Ref: {pay.transactionReference} • {pay.paymentDate}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                      ৳ {(pay.amountBDT || 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-emerald-600 block font-semibold">Disbursed</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: SALARY STRUCTURE MANAGEMENT                                    */}
      {/* ========================================================================= */}
      {activeTab === 'salary_structure' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Employee Salary Structure Master
              </h2>
              <p className="text-xs text-slate-500">
                Configure basic pay, house rent, medical, conveyance, mobile and allowances for each central employee.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                Configured: <b>{salaryStructures.length}</b> of {fieldForceReps.length}
              </span>
            </div>
          </div>

          {/* Salary Structure Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[11px] font-semibold uppercase">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Category / Dept</th>
                    <th className="py-3 px-4 text-right">Basic Pay</th>
                    <th className="py-3 px-4 text-right">House Rent (50%)</th>
                    <th className="py-3 px-4 text-right">Medical (10%)</th>
                    <th className="py-3 px-4 text-right">Conveyance</th>
                    <th className="py-3 px-4 text-right">Mobile</th>
                    <th className="py-3 px-4 text-right font-black">Gross Base</th>
                    <th className="py-3 px-4 text-center">Revisions</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {fieldForceReps.map((emp) => {
                    const str = salaryStructures.find((s) => s.employeeId === emp.id);
                    const basic = str?.basicSalaryBDT ?? emp.basicSalaryBDT ?? 30000;
                    const house = str?.houseRentBDT ?? Math.round(basic * 0.5);
                    const med = str?.medicalAllowanceBDT ?? Math.round(basic * 0.1);
                    const conv = str?.conveyanceAllowanceBDT ?? emp.conveyanceBDT ?? 0;
                    const mob = str?.mobileAllowanceBDT ?? emp.mobileAllowanceBDT ?? 0;
                    const gross = basic + house + med + conv + mob;

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{emp.name}</div>
                          <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                            {emp.code}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-700 dark:text-slate-300 block">
                            {emp.designation}
                          </span>
                          <span className="text-[10px] text-slate-400">{emp.department || 'Operations'}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold">
                          ৳ {basic.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                          ৳ {house.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                          ৳ {med.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                          ৳ {conv.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                          ৳ {mob.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-slate-900 dark:text-white">
                          ৳ {gross.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {str?.history?.length || 1} records
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedEmployeeForStructure(emp);
                              if (str) {
                                setEditingStructure(str);
                                setStrBasic(str.basicSalaryBDT);
                                setStrHouseRent(str.houseRentBDT);
                                setStrMedical(str.medicalAllowanceBDT);
                                setStrConveyance(str.conveyanceAllowanceBDT);
                                setStrMobile(str.mobileAllowanceBDT);
                                setStrSpecial(str.specialAllowanceBDT);
                                setStrOther(str.otherAllowancesBDT);
                                setStrEffectiveFrom(str.effectiveFrom);
                              } else {
                                setEditingStructure(null);
                                setStrBasic(emp.basicSalaryBDT || 30000);
                                setStrHouseRent((emp.basicSalaryBDT || 30000) * 0.5);
                                setStrMedical((emp.basicSalaryBDT || 30000) * 0.1);
                                setStrConveyance(emp.conveyanceBDT || 3000);
                                setStrMobile(emp.mobileAllowanceBDT || 1500);
                                setStrSpecial(0);
                                setStrOther(0);
                                setStrEffectiveFrom('2026-01-01');
                              }
                              setShowStructureModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 text-[11px] font-bold"
                          >
                            Edit Structure
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: ATTENDANCE MANAGEMENT                                          */}
      {/* ========================================================================= */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Daily Attendance & Biometric Grid
              </h2>
              <p className="text-xs text-slate-500">
                Track Present, Absent, Late, Leave, and Overtime hours for automated monthly payroll deduction.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDateForAtt}
                onChange={(e) => setSelectedDateForAtt(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
              />
              <button
                onClick={() => {
                  // Prepopulate bulk attendance with present for all staff
                  const bulk = fieldForceReps.map((emp) => ({
                    employeeId: emp.id,
                    employeeCode: emp.code,
                    employeeName: emp.name,
                    date: selectedDateForAtt,
                    status: 'Present' as AttendanceStatus,
                    inTime: '09:00',
                    outTime: '18:00',
                    overtimeHours: 0,
                  }));
                  bulkMarkAttendance(bulk);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark All Present Today</span>
              </button>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[11px] font-semibold uppercase">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Department / Branch</th>
                    <th className="py-3 px-4">Status on {selectedDateForAtt}</th>
                    <th className="py-3 px-4">Check In</th>
                    <th className="py-3 px-4">Check Out</th>
                    <th className="py-3 px-4">Overtime</th>
                    <th className="py-3 px-4 text-center">Monthly Summary ({selectedMonthYear})</th>
                    <th className="py-3 px-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {fieldForceReps.map((emp) => {
                    const todayRec = attendanceRecords.find(
                      (a) => a.employeeId === emp.id && a.date === selectedDateForAtt
                    );
                    const summary = getEmployeeAttendanceSummary(emp.id, selectedMonthYear);
                    const status = todayRec ? todayRec.status : 'Present';

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{emp.name}</div>
                          <span className="font-mono text-[10px] text-blue-600">{emp.code}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          <div>{emp.department || 'Operations'}</div>
                          <span className="text-[10px] text-slate-400">{emp.branchWorkplace || 'Head Office'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              status === 'Present'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : status === 'Absent'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : status === 'Late'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono">{todayRec?.inTime || '09:00 AM'}</td>
                        <td className="py-3 px-4 font-mono">{todayRec?.outTime || '06:00 PM'}</td>
                        <td className="py-3 px-4 font-mono font-bold text-blue-600">
                          {todayRec?.overtimeHours ? `${todayRec.overtimeHours} hrs` : '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="text-[11px] font-semibold">
                            <span className="text-emerald-600 font-bold">{summary.presentDays}P</span> /{' '}
                            <span className="text-rose-600 font-bold">{summary.absentDays}A</span> /{' '}
                            <span className="text-amber-600">{summary.lateDays}L</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex gap-1">
                            {(['Present', 'Late', 'Absent'] as AttendanceStatus[]).map((st) => (
                              <button
                                key={st}
                                onClick={() => {
                                  markAttendance({
                                    employeeId: emp.id,
                                    employeeCode: emp.code,
                                    employeeName: emp.name,
                                    date: selectedDateForAtt,
                                    status: st,
                                    inTime: st === 'Late' ? '10:15' : '09:00',
                                    outTime: '18:00',
                                    overtimeHours: 0,
                                  });
                                }}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                  status === st
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: LEAVE MANAGEMENT                                               */}
      {/* ========================================================================= */}
      {activeTab === 'leaves' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Employee Leave Applications & Balances
              </h2>
              <p className="text-xs text-slate-500">
                Annual, Casual, Sick, Maternity, and Unpaid Leave with approval authority.
              </p>
            </div>
            <button
              onClick={() => {
                setLeaveEmployeeId(fieldForceReps[0]?.id || '');
                setShowLeaveModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Apply Leave</span>
            </button>
          </div>

          {/* Quota Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
              <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300 block">
                Annual Leave Quota
              </span>
              <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                {payrollSettings?.leaveQuotas?.annualLeave ?? 14} Days
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 block">
                Casual Leave Quota
              </span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {payrollSettings?.leaveQuotas?.casualLeave ?? 10} Days
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
              <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300 block">
                Sick Leave Quota
              </span>
              <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                {payrollSettings?.leaveQuotas?.sickLeave ?? 14} Days
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
              <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300 block">
                Maternity Leave
              </span>
              <span className="text-xl font-black text-purple-600 dark:text-purple-400">
                {payrollSettings?.leaveQuotas?.maternityLeave ?? 112} Days
              </span>
            </div>
          </div>

          {/* Leaves Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[11px] font-semibold uppercase">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Days</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Approved By</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {leaveRecords.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{l.employeeName}</div>
                        <span className="font-mono text-[10px] text-blue-600">{l.employeeCode}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        {l.leaveType}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {l.startDate} to {l.endDate}
                      </td>
                      <td className="py-3 px-4 font-bold">{l.daysCount} Days</td>
                      <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">{l.reason}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            l.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : l.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {l.approvedBy || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {l.status === 'Pending' && (
                          <div className="inline-flex gap-1">
                            <button
                              onClick={() => approveLeave(l.id, currentUser?.name || 'Managing Director')}
                              className="px-2 py-1 rounded bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => rejectLeave(l.id, 'Management operational constraint')}
                              className="px-2 py-1 rounded bg-rose-600 text-white font-bold text-[10px] hover:bg-rose-700"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: EMPLOYEE ADVANCE & LOAN MANAGEMENT                             */}
      {/* ========================================================================= */}
      {activeTab === 'loans' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Employee Advance & Loan Management
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  Benchmark: ৳60,000 / 6 Months @ ৳10,000/mo
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated monthly salary deduction, installment schedules, early settlement, and ledger tracking.
              </p>
            </div>
            <button
              onClick={() => {
                setLoanEmployeeId(fieldForceReps[0]?.id || '');
                setShowLoanModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Apply Loan / Advance</span>
            </button>
          </div>

          {/* Loans Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[11px] font-semibold uppercase">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Principal</th>
                    <th className="py-3 px-4 text-right">Monthly Installment</th>
                    <th className="py-3 px-4 text-right">Repaid</th>
                    <th className="py-3 px-4 text-right">Remaining Balance</th>
                    <th className="py-3 px-4 text-center">Tenure Progress</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {advanceLoans.map((loan) => {
                    const principal = loan.principalAmountBDT ?? loan.approvedAmountBDT ?? loan.requestedAmountBDT ?? 0;
                    const monthly = loan.monthlyDeductionBDT ?? loan.monthlyInstallmentBDT ?? 0;
                    const repaid = loan.repaidAmountBDT ?? loan.totalPaidBDT ?? 0;
                    const remaining = loan.remainingAmountBDT ?? loan.remainingBalanceBDT ?? Math.max(0, principal - repaid);
                    const tenure = loan.repaymentTenureMonths ?? loan.installmentDurationMonths ?? (loan.schedule?.length || 1);
                    const paidCount = (loan.schedule || []).filter((s) => s.status === 'Deducted').length;
                    const pct = Math.round((repaid / (principal || 1)) * 100);
                    const currentLoanType = loan.loanType || loan.type || 'Salary Advance';

                    return (
                      <tr key={loan.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{loan.employeeName}</div>
                          <span className="font-mono text-[10px] text-blue-600">{loan.employeeCode || loan.referenceNo}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              currentLoanType === 'Salary Advance'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            }`}
                          >
                            {currentLoanType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          ৳ {principal.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-blue-600">
                          ৳ {monthly.toLocaleString()}/mo
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-600 font-semibold">
                          ৳ {repaid.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-rose-600">
                          ৳ {remaining.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="text-[11px] font-bold">
                            {paidCount} of {tenure} months ({pct}%)
                          </div>
                          <div className="w-20 mx-auto bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              loan.status === 'Closed' || loan.status === 'Settled'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : loan.status === 'Approved' || loan.status === 'Active'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {loan.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex gap-1.5 items-center">
                            <button
                              onClick={() => setViewingLoanSchedule(loan)}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-[11px] font-bold"
                            >
                              Schedule
                            </button>
                            {loan.remainingAmountBDT > 0 && (
                              <button
                                onClick={() => setSettlingLoan(loan)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs"
                              >
                                Settle Now
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 6: OVERTIME MANAGEMENT                                            */}
      {/* ========================================================================= */}
      {activeTab === 'overtime' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Overtime Hour Tracking & Approvals
              </h2>
              <p className="text-xs text-slate-500">
                Hourly rate formula: `(Basic / 208 hrs) * Multiplier ({payrollSettings?.overtimeConfig?.hourlyRateMultiplier ?? 1.5}x)`.
              </p>
            </div>
            <button
              onClick={() => {
                setOtEmployeeId(fieldForceReps[0]?.id || '');
                setShowOvertimeModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Log Overtime</span>
            </button>
          </div>

          {/* Overtime Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[11px] font-semibold uppercase">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Month</th>
                    <th className="py-3 px-4 text-right">Hours</th>
                    <th className="py-3 px-4 text-right">Rate / Hr</th>
                    <th className="py-3 px-4 text-right font-black">Total Overtime Pay</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {overtimeRecords.map((ot) => (
                    <tr key={ot.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{ot.employeeName}</div>
                        <span className="font-mono text-[10px] text-blue-600">{ot.employeeCode}</span>
                      </td>
                      <td className="py-3 px-4 font-mono">{ot.date}</td>
                      <td className="py-3 px-4">{ot.monthYear}</td>
                      <td className="py-3 px-4 text-right font-bold">{ot.hours} hrs</td>
                      <td className="py-3 px-4 text-right font-mono">৳ {ot.ratePerHourBDT}</td>
                      <td className="py-3 px-4 text-right font-mono font-black text-blue-600">
                        ৳ {(ot.totalAmountBDT || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">{ot.reason}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ot.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : ot.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {ot.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {ot.status === 'Pending' && (
                          <div className="inline-flex gap-1">
                            <button
                              onClick={() => approveOvertimeRecord(ot.id, currentUser?.name || 'Factory Head')}
                              className="px-2 py-1 rounded bg-emerald-600 text-white font-bold text-[10px]"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => rejectOvertimeRecord(ot.id, 'Hours not authorized')}
                              className="px-2 py-1 rounded bg-rose-600 text-white font-bold text-[10px]"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 7: BONUSES & INCENTIVES                                           */}
      {/* ========================================================================= */}
      {activeTab === 'bonuses' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Bonuses & Sales Commission Incentives
              </h2>
              <p className="text-xs text-slate-500">
                Festival Bonus, Performance Bonus, and Field Force target achievement bonuses.
              </p>
            </div>
            <button
              onClick={() => {
                setBnsEmployeeId(fieldForceReps[0]?.id || '');
                setShowBonusModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Bonus / Incentive</span>
            </button>
          </div>

          {/* Bonuses Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[11px] font-semibold uppercase">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Bonus Type</th>
                    <th className="py-3 px-4">Payroll Month</th>
                    <th className="py-3 px-4 text-right font-black">Bonus Amount</th>
                    <th className="py-3 px-4">Remarks</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Approved By</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {bonusRecords.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{b.employeeName}</div>
                        <span className="font-mono text-[10px] text-blue-600">{b.employeeCode}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {b.bonusType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">{b.monthYear}</td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-600">
                        ৳ {(b.amountBDT || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">{b.remarks}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {b.approvedBy || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {b.status === 'Pending' && (
                          <button
                            onClick={() => approveBonusRecord(b.id, currentUser?.name || 'Managing Director')}
                            className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold text-[10px]"
                          >
                            Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 8: MONTHLY PAYROLL PROCESSING                                     */}
      {/* ========================================================================= */}
      {activeTab === 'processing' && (
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Monthly Payroll Processing Wizard
                </h2>
                {currentMonthRun && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      currentMonthRun.status === 'Finalized' || currentMonthRun.status === 'Paid'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    Status: {currentMonthRun.status}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Aggregates: Salary Structure + Attendance Deductions + Approved Overtime + Active Loan Schedules + Tax & PF.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => generateMonthlySalaryRun(selectedMonthYear)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-Calculate Run</span>
              </button>

              {currentMonthRun && currentMonthRun.status === 'Draft' && (
                <button
                  onClick={() =>
                    finalizeMonthlyPayrollRun(
                      currentMonthRun.id,
                      currentUser?.name || 'Finance Director'
                    )
                  }
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Finalize & Lock Payroll</span>
                </button>
              )}
            </div>
          </div>

          {/* Processing Summary Cards */}
          {currentMonthRun && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Eligible Staff</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                  {currentMonthRun.totalEmployees}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Gross Outlay</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                  ৳ {(currentMonthRun.totalGrossBDT || 0).toLocaleString()}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-rose-500">Total Deductions</span>
                <div className="text-2xl font-black text-rose-600 mt-0.5">
                  - ৳ {(currentMonthRun.totalDeductionsBDT || 0).toLocaleString()}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">
                  Net Disbursable
                </span>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  ৳ {(currentMonthRun.totalNetBDT || 0).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Detailed Calculation Items Preview Table */}
          {currentMonthRun && currentMonthRun.items && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
              <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Calculation Sheet Preview ({currentMonthRun.items.length} Employees)
                </h3>
                <span className="text-xs text-slate-500">
                  Processed on {new Date(currentMonthRun.processedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[11px] font-semibold uppercase">
                      <th className="py-3 px-3">Employee</th>
                      <th className="py-3 px-3">Designation / Cat</th>
                      <th className="py-3 px-3 text-right">Basic Pay</th>
                      <th className="py-3 px-3 text-right">Allowances</th>
                      <th className="py-3 px-3 text-right">Overtime</th>
                      <th className="py-3 px-3 text-right">Bonus / Inc</th>
                      <th className="py-3 px-3 text-right font-black">Gross Pay</th>
                      <th className="py-3 px-3 text-right text-rose-500">Loan Ded</th>
                      <th className="py-3 px-3 text-right text-rose-500">Tax & PF</th>
                      <th className="py-3 px-3 text-right font-black text-emerald-600">Net Salary</th>
                      <th className="py-3 px-3 text-center">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {currentMonthRun.items.map((it) => (
                      <tr key={it.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 dark:text-white">{it.employeeName}</div>
                          <span className="font-mono text-[10px] text-blue-600">{it.employeeCode}</span>
                        </td>
                        <td className="py-3 px-3">
                          <div>{it.designation}</div>
                          <span className="text-[10px] text-slate-400">{it.employeeCategory}</span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono">
                          ৳ {(it.basicSalaryBDT || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono">
                          ৳{' '}
                          {(
                            (it.houseRentBDT || 0) +
                            (it.medicalAllowanceBDT || 0) +
                            (it.conveyanceAllowanceBDT || 0) +
                            (it.mobileAllowanceBDT || 0) +
                            (it.specialAllowanceBDT || 0) +
                            (it.foodAllowanceBDT || 0) +
                            (it.otherAllowancesBDT || 0)
                          ).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-blue-600">
                          {it.overtimeAmountBDT ? `৳${it.overtimeAmountBDT.toLocaleString()}` : '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-600">
                          {(it.festivalBonusBDT || 0) + (it.performanceBonusBDT || 0) + (it.salesIncentiveBDT || 0) + (it.bonusAmountBDT || 0) > 0
                            ? `৳${(
                                (it.festivalBonusBDT || 0) +
                                (it.performanceBonusBDT || 0) +
                                (it.salesIncentiveBDT || 0) +
                                (it.bonusAmountBDT || 0)
                              ).toLocaleString()}`
                            : '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          ৳ {(it.totalGrossEarningsBDT ?? it.grossSalaryBDT ?? 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-rose-600">
                          {(it.advanceLoanDeductionBDT ?? ((it.advanceDeductionBDT || 0) + (it.loanInstallmentBDT || 0))) ? `- ৳${(it.advanceLoanDeductionBDT ?? ((it.advanceDeductionBDT || 0) + (it.loanInstallmentBDT || 0))).toLocaleString()}` : '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500">
                          ৳ {((it.taxDeductionBDT || 0) + (it.providentFundDeductionBDT ?? it.providentFundBDT ?? 0)).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-emerald-600">
                          ৳ {(it.netSalaryBDT ?? it.netPayableBDT ?? 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              it.paymentStatus === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {it.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 9: MONTHLY SALARY SHEETS                                          */}
      {/* ========================================================================= */}
      {activeTab === 'salary_sheets' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Monthly Salary Sheets & Corporate Advice
              </h2>
              <p className="text-xs text-slate-500">
                Full itemized sheet ready for bank transfers, audit records, and Excel export.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Salary Sheet</span>
              </button>
            </div>
          </div>

          {/* Salary Sheet View */}
          {currentMonthRun && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase">
                      <th className="py-2.5 px-3">SL</th>
                      <th className="py-2.5 px-3">Employee Info</th>
                      <th className="py-2.5 px-3">Department</th>
                      <th className="py-2.5 px-3 text-right">Basic Pay</th>
                      <th className="py-2.5 px-3 text-right">House Rent</th>
                      <th className="py-2.5 px-3 text-right">Medical</th>
                      <th className="py-2.5 px-3 text-right">Conveyance</th>
                      <th className="py-2.5 px-3 text-right">Mobile</th>
                      <th className="py-2.5 px-3 text-right">Overtime</th>
                      <th className="py-2.5 px-3 text-right">Bonus</th>
                      <th className="py-2.5 px-3 text-right font-black">Gross</th>
                      <th className="py-2.5 px-3 text-right text-rose-500">Loan Ded</th>
                      <th className="py-2.5 px-3 text-right text-rose-500">PF Ded</th>
                      <th className="py-2.5 px-3 text-right text-rose-500">Tax</th>
                      <th className="py-2.5 px-3 text-right font-black text-emerald-600">Net Pay</th>
                      <th className="py-2.5 px-3">Bank Details</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {currentMonthRun.items.map((it, idx) => (
                      <tr key={it.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900 dark:text-white">{it.employeeName}</div>
                          <span className="font-mono text-[10px] text-blue-600">{it.employeeCode}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                          {it.department}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">৳{(it.basicSalaryBDT || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono">৳{(it.houseRentBDT || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono">৳{(it.medicalAllowanceBDT || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono">৳{(it.conveyanceAllowanceBDT || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono">৳{(it.mobileAllowanceBDT || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono">৳{(it.overtimeAmountBDT || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-600">
                          ৳{((it.festivalBonusBDT || 0) + (it.performanceBonusBDT || 0) + (it.salesIncentiveBDT || 0) + (it.bonusAmountBDT || 0)).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          ৳{(it.totalGrossEarningsBDT ?? it.grossSalaryBDT ?? 0).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-600">
                          {(it.advanceLoanDeductionBDT ?? ((it.advanceDeductionBDT || 0) + (it.loanInstallmentBDT || 0))) ? `৳${(it.advanceLoanDeductionBDT ?? ((it.advanceDeductionBDT || 0) + (it.loanInstallmentBDT || 0))).toLocaleString()}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                          ৳{(it.providentFundDeductionBDT ?? it.providentFundBDT ?? 0).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                          ৳{(it.taxDeductionBDT || 0).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-600">
                          ৳{(it.netSalaryBDT ?? it.netPayableBDT ?? 0).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[10px]">
                          <div>{it.bankName || 'City Bank PLC'}</div>
                          <span className="text-slate-400">{it.bankAccountNo || '110293847291'}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              it.paymentStatus === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {it.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 10: SALARY PAYMENT DISBURSEMENT                                   */}
      {/* ========================================================================= */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Salary Payment & Disbursement Processing
              </h2>
              <p className="text-xs text-slate-500">
                Disburse salaries via Bank EFT (City Bank, Eastern Bank), Cash in Hand, or MFS (bKash/Nagad).
              </p>
            </div>
            {currentMonthRun && currentMonthRun.items.some((i) => i.paymentStatus !== 'Paid') && (
              <button
                onClick={() => {
                  currentMonthRun.items
                    .filter((i) => i.paymentStatus !== 'Paid')
                    .forEach((item) => {
                      recordSalaryPayment(currentMonthRun.id, item.employeeId, {
                        paymentDate: new Date().toISOString().slice(0, 10),
                        paymentMethod: 'Bank Transfer',
                        bankAccountName: 'City Bank PLC',
                        transactionReference: `EFT-${currentMonthRun.monthYear || currentMonthRun.payrollMonth}-${item.employeeCode || item.employeeId}`,
                        amountBDT: item.netSalaryBDT ?? item.netPayableBDT ?? 0,
                        disbursedBy: currentUser?.name || 'Accounts Head',
                      });
                    });
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Disburse All Unpaid via Bank EFT</span>
              </button>
            )}
          </div>

          {/* Payments Pending & Paid Table */}
          {currentMonthRun && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[11px] font-semibold uppercase">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Designation</th>
                      <th className="py-3 px-4">Bank / Account</th>
                      <th className="py-3 px-4 text-right font-black">Net Salary</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Disbursement Method</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {currentMonthRun.items.map((it) => (
                      <tr key={it.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{it.employeeName}</div>
                          <span className="font-mono text-[10px] text-blue-600">{it.employeeCode}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{it.designation}</td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          <div>{it.bankName || 'City Bank PLC'}</div>
                          <span className="text-slate-400">{it.bankAccountNo || '110293847291'}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-emerald-600 text-sm">
                          ৳ {(it.netSalaryBDT ?? it.netPayableBDT ?? 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              it.paymentStatus === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {it.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {it.paymentMethod || 'City Bank EFT'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {it.paymentStatus !== 'Paid' ? (
                            <button
                              onClick={() => {
                                setSelectedRunItemForPayment({ runId: currentMonthRun.id, item: it });
                                setPayRef(`EFT-${currentMonthRun.monthYear || currentMonthRun.payrollMonth}-${it.employeeCode || it.employeeId}`);
                                setShowDisburseModal(true);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs"
                            >
                              Disburse
                            </button>
                          ) : (
                            <button
                              onClick={() => setViewingPayslip({ run: currentMonthRun, item: it })}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-blue-600 font-bold text-[11px]"
                            >
                              Payslip
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 11: PAYSLIP GENERATION & PRINT                                    */}
      {/* ========================================================================= */}
      {activeTab === 'payslips' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Individual Payslip Generation & Printing
              </h2>
              <p className="text-xs text-slate-500">
                Official corporate pay vouchers with detailed salary component breakdowns and signature seals.
              </p>
            </div>
          </div>

          {/* Payslip employee cards */}
          {currentMonthRun && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentMonthRun.items.map((it) => (
                <div
                  key={it.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 hover:border-blue-400 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {it.employeeName}
                      </h4>
                      <span className="font-mono text-xs text-blue-600 font-semibold">{it.employeeCode}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        it.paymentStatus === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {it.paymentStatus}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Designation</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{it.designation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Gross Earnings</span>
                      <span className="font-mono font-bold">৳ {(it.totalGrossEarningsBDT ?? it.grossSalaryBDT ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Deductions</span>
                      <span className="font-mono text-rose-500">- ৳ {(it.totalDeductionsBDT || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Net Take Home</span>
                      <span className="font-mono font-black text-emerald-600">
                        ৳ {(it.netSalaryBDT ?? it.netPayableBDT ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setViewingPayslip({ run: currentMonthRun, item: it })}
                    className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>View & Print Payslip</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 12: PAYROLL REPORTS (13 REPORTS)                                  */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Comprehensive Payroll Reports (13 Standard Formats)
              </h2>
              <p className="text-xs text-slate-500">
                Audited statements, tax withholding reports, bank transfer advice, and loan schedules.
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Report</span>
            </button>
          </div>

          {/* Report Selector Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {[
              { id: 'rep-register', title: '1. Monthly Salary Register', desc: 'Itemized register for all employees' },
              { id: 'rep-dept', title: '2. Department Cost Summary', desc: 'Departmental salary breakdown' },
              { id: 'rep-bank', title: '3. Bank Transfer Advice', desc: 'Advice list for City & Eastern Bank' },
              { id: 'rep-loan', title: '4. Staff Loan Statement', desc: 'Outstanding balances & deductions' },
              { id: 'rep-ot', title: '5. Overtime Register', desc: 'Hours & amounts by plant department' },
              { id: 'rep-tax', title: '6. Tax Withholding Register', desc: 'Govt NBR tax deduction sheet' },
              { id: 'rep-pf', title: '7. Provident Fund Statement', desc: 'Employer & Employee contributions' },
              { id: 'rep-cash', title: '8. Cash Disbursement Sheet', desc: 'Physical cash voucher list' },
              { id: 'rep-mfs', title: '9. MFS (bKash/Nagad) List', desc: 'Mobile wallet salary transfers' },
              { id: 'rep-att', title: '10. Attendance & Leaves', desc: 'Working days, leaves, and absences' },
              { id: 'rep-bonus', title: '11. Festival & Bonus Sheet', desc: 'Festival and incentive list' },
              { id: 'rep-ytd', title: '12. Year-to-Date Cost', desc: 'Cumulative YTD payroll expenses' },
              { id: 'rep-comp', title: '13. Component Analysis', desc: 'Basic vs Allowance proportion' },
            ].map((rep) => (
              <button
                key={rep.id}
                onClick={() => setSelectedReportId(rep.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedReportId === rep.id
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-xs text-slate-900 dark:text-white">{rep.title}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{rep.desc}</div>
              </button>
            ))}
          </div>

          {/* Selected Report Output View */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                  OFFICIAL AUDIT REPORT
                </span>
                <h3 className="font-black text-slate-900 dark:text-white text-sm">
                  {selectedReportId === 'rep-bank'
                    ? 'Bank Transfer Advice Statement — City Bank PLC'
                    : selectedReportId === 'rep-loan'
                    ? 'Employee Advance & Loan Outstanding Ledger'
                    : selectedReportId === 'rep-tax'
                    ? 'Income Tax & PF Withholding Deduction Schedule'
                    : 'Monthly Corporate Salary & Compensation Register'}
                </h3>
                <span className="text-xs text-slate-500">
                  Period: {selectedMonthYear} • Ensec Lithium Batteries BD
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Report Generated:</span>
                <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                  {new Date().toLocaleDateString('en-GB')}
                </span>
              </div>
            </div>

            {/* Render table based on report */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[11px] font-semibold uppercase">
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Employee Name</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3 text-right">Gross Pay</th>
                    <th className="py-2.5 px-3 text-right">Total Deductions</th>
                    <th className="py-2.5 px-3 text-right font-black text-emerald-600">Net Payable</th>
                    <th className="py-2.5 px-3">Bank Account</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {currentMonthRun?.items.map((it) => (
                    <tr key={it.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{it.employeeCode}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{it.employeeName}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{it.department}</td>
                      <td className="py-2.5 px-3 text-right font-mono">৳{(it.totalGrossEarningsBDT ?? it.grossSalaryBDT ?? 0).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-600">
                        ৳{(it.totalDeductionsBDT || 0).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-600">
                        ৳{(it.netSalaryBDT ?? it.netPayableBDT ?? 0).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        {it.bankName || 'City Bank'} - {it.bankAccountNo || '110293847291'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {it.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 13: PAYROLL SETTINGS                                              */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="space-y-5 max-w-4xl">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              <span>Corporate Payroll Configuration & Statutory Rules</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Standard Working Days Per Month
                </label>
                <input
                  type="number"
                  value={payrollSettings?.standardWorkingDaysPerMonth ?? 26}
                  onChange={(e) =>
                    updatePayrollSettings({
                      standardWorkingDaysPerMonth: Number(e.target.value) || 26,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Standard Daily Working Hours
                </label>
                <input
                  type="number"
                  value={payrollSettings?.standardDailyHours ?? 8}
                  onChange={(e) =>
                    updatePayrollSettings({
                      standardDailyHours: Number(e.target.value) || 8,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Overtime Multiplier Rate
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={payrollSettings?.overtimeConfig?.hourlyRateMultiplier ?? 2.0}
                  onChange={(e) =>
                    updatePayrollSettings({
                      overtimeConfig: {
                        ...(payrollSettings?.overtimeConfig || {}),
                        hourlyRateMultiplier: Number(e.target.value) || 2.0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>

              {/* Overtime Hub Deep Link */}
              <div className="sm:col-span-2 p-4 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl text-white flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    Dedicated Overtime Management & Batch Allocation Hub
                  </h4>
                  <p className="text-xs text-blue-200 mt-0.5">
                    For multi-batch work splits, overnight punches, supervisor approvals, and production costing absorption, use the full Overtime module.
                  </p>
                </div>
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('ensec-navigate', { detail: 'overtime-management' }));
                  }}
                  className="px-3.5 py-1.5 bg-white text-blue-900 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors"
                >
                  Open Overtime Hub →
                </button>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Provident Fund Employee Contribution (%)
                </label>
                <input
                  type="number"
                  value={payrollSettings?.deductionRules?.pfEmployeeContributionPercent ?? 10}
                  onChange={(e) =>
                    updatePayrollSettings({
                      deductionRules: {
                        ...(payrollSettings?.deductionRules || {}),
                        pfEmployeeContributionPercent: Number(e.target.value) || 10,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
              <button
                onClick={() => alert('Payroll settings saved successfully!')}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
              >
                Save Payroll Rules
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PAYSLIP PREVIEW & OFFICIAL PRINT                                   */}
      {/* ========================================================================= */}
      {viewingPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4 text-slate-900 print:m-0 print:p-0 print:border-none print:shadow-none">
            {/* Payslip Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                  ES
                </div>
                <div>
                  <h3 className="font-black text-base tracking-tight text-slate-900">
                    ENSEC LITHIUM BATTERIES BD
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Head Office: Gulshan Avenue, Dhaka • Kushtia Battery Plant
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  PAY VOUCHER / SLIP
                </span>
                <span className="font-mono font-bold text-sm text-blue-600">
                  {viewingPayslip.run.monthYear}
                </span>
              </div>
            </div>

            {/* Employee Information Strip */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl text-xs border border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">EMPLOYEE</span>
                <span className="font-bold text-slate-900">{viewingPayslip.item.employeeName}</span>
                <span className="font-mono text-slate-500 block">ID: {viewingPayslip.item.employeeCode}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">DESIGNATION / DEPT</span>
                <span className="font-bold text-slate-900">{viewingPayslip.item.designation}</span>
                <span className="text-slate-500 block">{viewingPayslip.item.department}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">BANK / ACCOUNT</span>
                <span className="font-mono text-slate-800">
                  {viewingPayslip.item.bankName || 'City Bank PLC'} ({viewingPayslip.item.bankAccountNo || '110293847291'})
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">DAYS WORKED</span>
                <span className="font-bold text-slate-800">
                  {viewingPayslip.item.presentDays} of {viewingPayslip.item.totalWorkingDays} Days
                </span>
              </div>
            </div>

            {/* Earnings & Deductions Breakdown Columns */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              {/* Earnings */}
              <div className="border border-slate-200 rounded-xl p-3 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block pb-1 border-b">
                  EARNINGS (BDT)
                </span>
                <div className="flex justify-between">
                  <span>Basic Pay</span>
                  <span className="font-mono font-bold">৳ {(viewingPayslip.item.basicSalaryBDT || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>House Rent (50%)</span>
                  <span className="font-mono">৳ {(viewingPayslip.item.houseRentBDT || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Medical Allowance</span>
                  <span className="font-mono">৳ {(viewingPayslip.item.medicalAllowanceBDT || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Conveyance</span>
                  <span className="font-mono">৳ {(viewingPayslip.item.conveyanceAllowanceBDT || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mobile Allowance</span>
                  <span className="font-mono">৳ {(viewingPayslip.item.mobileAllowanceBDT || 0).toLocaleString()}</span>
                </div>
                {(viewingPayslip.item.overtimeAmountBDT || 0) > 0 && (
                  <div className="flex justify-between text-blue-600 font-semibold">
                    <span>Overtime Pay ({viewingPayslip.item.overtimeHours || 0} hrs)</span>
                    <span className="font-mono">৳ {(viewingPayslip.item.overtimeAmountBDT || 0).toLocaleString()}</span>
                  </div>
                )}
                {((viewingPayslip.item.festivalBonusBDT || 0) + (viewingPayslip.item.performanceBonusBDT || 0)) > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Bonuses & Incentives</span>
                    <span className="font-mono">
                      ৳{' '}
                      {(
                        (viewingPayslip.item.festivalBonusBDT || 0) + (viewingPayslip.item.performanceBonusBDT || 0)
                      ).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t font-black">
                  <span>Gross Earnings</span>
                  <span className="font-mono">৳ {(viewingPayslip.item.totalGrossEarningsBDT ?? viewingPayslip.item.grossSalaryBDT ?? 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Deductions */}
              <div className="border border-slate-200 rounded-xl p-3 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-rose-700 block pb-1 border-b">
                  DEDUCTIONS (BDT)
                </span>
                <div className="flex justify-between">
                  <span>Attendance / Absence</span>
                  <span className="font-mono">
                    {viewingPayslip.item.attendanceDeductionBDT
                      ? `৳ ${(viewingPayslip.item.attendanceDeductionBDT || 0).toLocaleString()}`
                      : '৳ 0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Staff Loan Recovery</span>
                  <span className="font-mono text-rose-600 font-semibold">
                    {viewingPayslip.item.advanceLoanDeductionBDT
                      ? `৳ ${(viewingPayslip.item.advanceLoanDeductionBDT || 0).toLocaleString()}`
                      : '৳ 0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Provident Fund (10%)</span>
                  <span className="font-mono">৳ {(viewingPayslip.item.providentFundDeductionBDT ?? viewingPayslip.item.providentFundBDT ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Income Tax Withholding</span>
                  <span className="font-mono">৳ {(viewingPayslip.item.taxDeductionBDT || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t font-black text-rose-600">
                  <span>Total Deductions</span>
                  <span className="font-mono">- ৳ {(viewingPayslip.item.totalDeductionsBDT || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Net Salary Payable */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                  NET TAKE-HOME SALARY
                </span>
                <span className="text-xs text-slate-600 italic">
                  {numberToWordsBDT(viewingPayslip.item.netSalaryBDT ?? viewingPayslip.item.netPayableBDT ?? 0)}
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-700 font-mono">
                ৳ {(viewingPayslip.item.netSalaryBDT ?? viewingPayslip.item.netPayableBDT ?? 0).toLocaleString()}
              </div>
            </div>

            {/* Signature Seals */}
            <div className="grid grid-cols-4 gap-4 pt-8 text-[11px] text-center text-slate-500">
              <div className="border-t border-slate-300 pt-1">Prepared By</div>
              <div className="border-t border-slate-300 pt-1">Checked By (HR)</div>
              <div className="border-t border-slate-300 pt-1">Approved By (Director)</div>
              <div className="border-t border-slate-300 pt-1">Employee Signature</div>
            </div>

            {/* Modal Controls */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t print:hidden">
              <button
                onClick={() => setViewingPayslip(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-xs"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Payslip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LOAN REPAYMENT SCHEDULE                                            */}
      {/* ========================================================================= */}
      {viewingLoanSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Loan Repayment Schedule: {viewingLoanSchedule.employeeName}
                </h3>
                <span className="text-xs text-slate-500">
                  Principal: ৳{(viewingLoanSchedule.principalAmountBDT ?? viewingLoanSchedule.approvedAmountBDT ?? viewingLoanSchedule.requestedAmountBDT ?? 0).toLocaleString()} • Tenure: {viewingLoanSchedule.repaymentTenureMonths ?? viewingLoanSchedule.installmentDurationMonths ?? (viewingLoanSchedule.schedule?.length || 0)} Months
                </span>
              </div>
              <button onClick={() => setViewingLoanSchedule(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {(viewingLoanSchedule.schedule || []).map((item) => (
                <div
                  key={item.installmentNumber}
                  className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px]">
                      {item.installmentNumber}
                    </span>
                    <div>
                      <span className="font-bold">{item.monthYear}</span>
                      <span className="text-[10px] text-slate-400 block">
                        {item.status === 'Deducted' ? `Paid on ${item.paidDate || item.deductionDate || 'Schedule'}` : 'Scheduled'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold block">৳ {(item.amountBDT ?? item.installmentAmountBDT ?? item.paidAmountBDT ?? 0).toLocaleString()}</span>
                    <span
                      className={`px-2 py-0.2 rounded-full text-[9px] font-bold ${
                        item.status === 'Deducted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingLoanSchedule(null)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
              >
                Close Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: APPLY LOAN / ADVANCE                                               */}
      {/* ========================================================================= */}
      {showLoanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                New Employee Advance & Loan Application
              </h3>
              <button onClick={() => setShowLoanModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select Employee*</label>
                <select
                  value={loanEmployeeId}
                  onChange={(e) => setLoanEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {fieldForceReps.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.code} • {emp.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Loan Type*</label>
                <select
                  value={loanType}
                  onChange={(e) => setLoanType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="Employee Loan">Employee Loan (Multi-month tenure)</option>
                  <option value="Salary Advance">Salary Advance (Short term deduction)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Principal Amount (BDT)*</label>
                  <input
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tenure (Months)*</label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={loanTenure}
                    onChange={(e) => setLoanTenure(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-800 dark:text-blue-200">
                <span className="font-bold">Calculated Monthly Installment:</span>
                <span className="font-mono text-sm font-black block">
                  ৳ {loanTenure > 0 ? Math.round(loanAmount / loanTenure).toLocaleString() : 0} / month
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Start Month*</label>
                <input
                  type="text"
                  placeholder="2026-11"
                  value={loanStartMonth}
                  onChange={(e) => setLoanStartMonth(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Purpose / Reason</label>
                <textarea
                  rows={2}
                  value={loanReason}
                  onChange={(e) => setLoanReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setShowLoanModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const emp = fieldForceReps.find((r) => r.id === loanEmployeeId) || fieldForceReps[0];
                  applyAdvanceLoan({
                    employeeId: emp.id,
                    employeeCode: emp.code,
                    employeeName: emp.name,
                    loanType,
                    principalAmountBDT: loanAmount,
                    repaymentTenureMonths: loanTenure,
                    monthlyDeductionBDT: Math.round(loanAmount / loanTenure),
                    deductionStartMonthYear: loanStartMonth,
                    purpose: loanReason,
                  });
                  setShowLoanModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                Submit Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EARLY LOAN SETTLEMENT                                              */}
      {/* ========================================================================= */}
      {settlingLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Early Loan Settlement: {settlingLoan.employeeName}
              </h3>
              <button onClick={() => setSettlingLoan(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 text-xs">
              <span className="font-bold block text-amber-800 dark:text-amber-200">Remaining Balance to Clear:</span>
              <span className="text-xl font-black font-mono text-amber-700 dark:text-amber-300">
                ৳ {(settlingLoan.remainingAmountBDT ?? settlingLoan.remainingBalanceBDT ?? 0).toLocaleString()}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Receipt Account / Method</label>
                <select
                  value={payBankName}
                  onChange={(e) => setPayBankName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700"
                >
                  <option value="City Bank PLC">City Bank PLC</option>
                  <option value="Eastern Bank PLC">Eastern Bank PLC</option>
                  <option value="Cash in Hand">Cash in Hand</option>
                  <option value="bKash Merchant">bKash Merchant</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setSettlingLoan(null)}
                className="px-4 py-2 rounded-xl border text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  earlySettleAdvanceLoan(settlingLoan.id, payBankName, 'Direct Employee Clearance');
                  setSettlingLoan(null);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                Confirm Full Settlement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DISBURSE SALARY                                                    */}
      {/* ========================================================================= */}
      {showDisburseModal && selectedRunItemForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Disburse Salary: {selectedRunItemForPayment.item.employeeName}
              </h3>
              <button onClick={() => setShowDisburseModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
              <span className="font-bold text-emerald-800">Net Payable:</span>
              <span className="font-mono text-lg font-black text-emerald-700">
                ৳ {(selectedRunItemForPayment.item.netSalaryBDT ?? selectedRunItemForPayment.item.netPayableBDT ?? 0).toLocaleString()}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Disbursement Method*</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700"
                >
                  <option value="Bank Transfer">Bank Transfer (EFT / BEFTN)</option>
                  <option value="Cash">Cash in Hand</option>
                  <option value="bKash">bKash MFS</option>
                  <option value="Nagad">Nagad MFS</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Bank / Account</label>
                <input
                  type="text"
                  value={payBankName}
                  onChange={(e) => setPayBankName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Transaction Ref No</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setShowDisburseModal(false)}
                className="px-4 py-2 rounded-xl border text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  recordSalaryPayment(
                    selectedRunItemForPayment.runId,
                    selectedRunItemForPayment.item.employeeId,
                    {
                      paymentDate: payDate,
                      paymentMethod: payMethod,
                      bankAccountName: payBankName,
                      transactionReference: payRef,
                      amountBDT: selectedRunItemForPayment.item.netSalaryBDT ?? selectedRunItemForPayment.item.netPayableBDT ?? 0,
                      disbursedBy: currentUser?.name || 'Accounts Officer',
                    }
                  );
                  setShowDisburseModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                Post Disbursement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
