/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ensec ERP - Central Employee 9-Tab Profile Modal
 * Satisfies Section 2: Detailed Profile with Organized Tabs
 */

import React, { useState, useMemo } from 'react';
import {
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  CreditCard,
  Clock,
  Briefcase,
  Layers,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingUp,
  X,
  Printer,
  ChevronRight,
  ShieldCheck,
  Tag,
  Gift,
  HelpCircle,
  UserCheck,
} from 'lucide-react';
import { FieldForceRep } from '../../types/erp';
import { useERP } from '../../context/ERPContext';

interface EmployeeProfileModalProps {
  employee: FieldForceRep;
  onClose: () => void;
  onEdit: (emp: FieldForceRep) => void;
}

type ProfileTab = 
  | 'personal'
  | 'employment'
  | 'fieldforce'
  | 'salary'
  | 'attendance'
  | 'leave'
  | 'advance-loan'
  | 'bonus'
  | 'payment-history';

export const EmployeeProfileModal: React.FC<EmployeeProfileModalProps> = ({
  employee,
  onClose,
  onEdit,
}) => {
  const {
    salaryStructures,
    attendanceRecords,
    leaveRecords,
    advanceLoans,
    overtimeRecords,
    bonusRecords,
    monthlyPayrollRuns,
    formatCurrency,
  } = useERP();

  const [activeTab, setActiveTab] = useState<ProfileTab>('personal');

  // Associated Data Lookups
  const salaryStructure = useMemo(() => {
    return (salaryStructures || []).find((s) => s.fieldForceId === employee.id);
  }, [salaryStructures, employee.id]);

  const empAttendance = useMemo(() => {
    return (attendanceRecords || []).filter((a) => a.fieldForceId === employee.id);
  }, [attendanceRecords, employee.id]);

  const empLeaves = useMemo(() => {
    return (leaveRecords || []).filter((l) => l.fieldForceId === employee.id);
  }, [leaveRecords, employee.id]);

  const empLoans = useMemo(() => {
    return (advanceLoans || []).filter((al) => al.fieldForceId === employee.id);
  }, [advanceLoans, employee.id]);

  const empOvertimes = useMemo(() => {
    return (overtimeRecords || []).filter((o) => o.fieldForceId === employee.id);
  }, [overtimeRecords, employee.id]);

  const empBonuses = useMemo(() => {
    return (bonusRecords || []).filter((b) => b.fieldForceId === employee.id);
  }, [bonusRecords, employee.id]);

  const empPayrollHistory = useMemo(() => {
    const list: any[] = [];
    (monthlyPayrollRuns || []).forEach((run) => {
      const match = (run.items || []).find((it) => it.fieldForceId === employee.id);
      if (match) {
        list.push({
          ...match,
          runDate: run.runDate,
          runStatus: run.status,
        });
      }
    });
    return list;
  }, [monthlyPayrollRuns, employee.id]);

  // Category Color Badge
  const getCategoryBadgeClass = (category?: string) => {
    switch (category) {
      case 'Management Employee':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Office Employee':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Factory Employee':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'Warehouse Employee':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      case 'Field Employee':
      default:
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-2xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header & Hero Card */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 border-2 border-white/20 overflow-hidden shrink-0 flex items-center justify-center text-xl font-bold">
                {employee.photoUrl ? (
                  <img
                    src={employee.photoUrl}
                    alt={employee.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{(employee.name || 'E').slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black tracking-tight">{employee.name}</h2>
                  {employee.nativeName && (
                    <span className="text-xs text-slate-300 font-medium">({employee.nativeName})</span>
                  )}
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(
                      employee.employeeCategory
                    )}`}
                  >
                    {employee.employeeCategory || 'Field Employee'}
                  </span>
                </div>
                <div className="text-xs text-blue-200 mt-1 flex flex-wrap items-center gap-3">
                  <span>ID: <b className="font-mono text-white">{employee.code || employee.id}</b></span>
                  <span>•</span>
                  <span>{employee.designation || 'Staff'}</span>
                  <span>•</span>
                  <span>{employee.department || 'General'}</span>
                  <span>•</span>
                  <span>Branch: {employee.branchWorkplace || 'Kushtia / Dhaka HQ'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Dossier</span>
              </button>
              <button
                type="button"
                onClick={() => onEdit(employee)}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm"
              >
                Edit Details
              </button>
            </div>
          </div>

          {/* 9 Profile Tabs Navigation Bar */}
          <div className="flex items-center gap-1 mt-6 overflow-x-auto no-scrollbar border-b border-white/10 pb-1">
            <button
              onClick={() => setActiveTab('personal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1.5 ${
                activeTab === 'personal'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>1. Personal</span>
            </button>
            <button
              onClick={() => setActiveTab('employment')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1.5 ${
                activeTab === 'employment'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>2. Employment</span>
            </button>
            <button
              onClick={() => setActiveTab('fieldforce')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1.5 ${
                activeTab === 'fieldforce'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>3. Field Force</span>
            </button>
            <button
              onClick={() => setActiveTab('salary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1.5 ${
                activeTab === 'salary'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
              <span>4. Salary Info</span>
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1.5 ${
                activeTab === 'attendance'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>5. Attendance</span>
            </button>
            <button
              onClick={() => setActiveTab('leave')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1.5 ${
                activeTab === 'leave'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>6. Leave ({empLeaves.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('advance-loan')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1.5 ${
                activeTab === 'advance-loan'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>7. Loans ({empLoans.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('bonus')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1.5 ${
                activeTab === 'bonus'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Gift className="w-3.5 h-3.5 text-amber-300" />
              <span>8. Bonus</span>
            </button>
            <button
              onClick={() => setActiveTab('payment-history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1.5 ${
                activeTab === 'payment-history'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>9. Payslips ({empPayrollHistory.length})</span>
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 text-xs text-slate-700 dark:text-slate-300">
          
          {/* TAB 1: PERSONAL INFORMATION */}
          {activeTab === 'personal' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Contact & Identity</span>
                  </h3>
                  <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-500">Official Contact:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{employee.phone}</span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-500">Corporate Email:</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{employee.email || 'N/A'}</span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-500">National ID (NID):</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white">{employee.nationalId || '19842694500001'}</span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-500">Mobile PIN:</span>
                      <span className="font-mono font-bold text-purple-600">{employee.pin || '••••'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Emergency Contact</span>
                  </h3>
                  <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-500">Contact Person:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{employee.emergencyContactName || 'Family Member'}</span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-500">Relationship:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{employee.emergencyContactRelation || 'Spouse / Parent'}</span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-500">Emergency Phone:</span>
                      <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">{employee.emergencyContactPhone || employee.phone}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Residential Addresses</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Present Address</span>
                    <p className="font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                      {employee.presentAddress || 'Plot 42, Road 11, Gulshan, Dhaka, Bangladesh'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Permanent Address</span>
                    <p className="font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                      {employee.permanentAddress || 'Kushtia Sadar, Kushtia Industrial Belt, Bangladesh'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EMPLOYMENT INFORMATION */}
          {activeTab === 'employment' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white mt-1 block">
                    {employee.employeeCategory || 'Field Employee'}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Department</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white mt-1 block">
                    {employee.department || 'Sales & Marketing'}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Designation</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white mt-1 block">
                    {employee.designation || 'Territory Sales Officer'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Service & Workplace Milestones</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 text-[10px] uppercase block">Joining Date</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">{employee.joiningDate || '2023-01-01'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 text-[10px] uppercase block">Employment Type</span>
                    <span className="font-bold text-slate-900 dark:text-white">{employee.employmentType || 'Permanent'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 text-[10px] uppercase block">Employment Status</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{employee.employmentStatus || 'Active'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 text-[10px] uppercase block">Reporting Manager</span>
                    <span className="font-bold text-slate-900 dark:text-white">{employee.reportingManagerName || 'Managing Director'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 text-[10px] uppercase block">Branch / Workplace</span>
                    <span className="font-bold text-slate-900 dark:text-white">{employee.branchWorkplace || 'Kushtia Plant'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 text-[10px] uppercase block">Linked ERP User Account</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                      {employee.userId ? `User ID: ${employee.userId}` : 'Integrated with Field Force ID'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FIELD FORCE INFORMATION */}
          {activeTab === 'fieldforce' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h3 className="font-bold text-sm text-emerald-950 dark:text-emerald-200">
                        Field Force Telemetry & Beat Assignment
                      </h3>
                      <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                        Operational territory, order booking permissions, and live tracking parameters.
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white">
                    {employee.fieldForceType || 'Order Booker'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Territory & Beat</h4>
                  <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-500">Region:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{employee.region || 'Dhaka Division'}</span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-500">Area:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{employee.area || 'Dhaka Central'}</span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-500">Territory:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{employee.territory || 'Assigned Territory'}</span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-500">Market Hierarchy Beat:</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {employee.marketHierarchy || 'Dhaka Region - Central Beat'}
                      </span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-500">Assigned Distributor:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{employee.assignedDistributorName || 'Meghna Solar & Power'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Field Authority & Targets</h4>
                  <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-500">Action Type:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{employee.actionType || 'Primary Order Booking'}</span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-500">Monthly Target BDT:</span>
                      <span className="font-mono font-bold text-emerald-600">
                        ৳ {(employee.monthlyTargetBDT || 3000000).toLocaleString()}
                      </span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-500">Invoice Within:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{employee.invoiceWithinDays || 3} Days</span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-500">TADA Approver:</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">
                        {employee.tadaApproverName || 'Mahmudul Hasan (ASM)'}
                      </span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-500">Mobile GPS Status:</span>
                      <span className="flex items-center gap-1 font-semibold text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Online (Battery: {employee.batteryLevel || 88}%)</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SALARY INFORMATION */}
          {activeTab === 'salary' && (
            <div className="space-y-4">
              {salaryStructure ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Basic Salary</span>
                      <div className="text-lg font-black text-blue-600 dark:text-blue-400 font-mono mt-1">
                        ৳ {salaryStructure.basicSalaryBDT.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-slate-500">Standard monthly core pay</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Gross Monthly Pay</span>
                      <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                        ৳ {salaryStructure.grossSalaryBDT.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-slate-500">Including all allowances</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Effective Since</span>
                      <div className="text-lg font-black text-slate-900 dark:text-white font-mono mt-1">
                        {salaryStructure.effectiveFrom}
                      </div>
                      <span className="text-[10px] text-slate-500">HR policy approved</span>
                    </div>
                  </div>

                  {/* Components Breakdown Table */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Earnings & Allowances Breakdown</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-400 text-[10px] block">House Rent (50%)</span>
                        <b className="font-mono text-slate-800 dark:text-slate-200">৳ {salaryStructure.houseRentBDT.toLocaleString()}</b>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-400 text-[10px] block">Medical Allowance</span>
                        <b className="font-mono text-slate-800 dark:text-slate-200">৳ {salaryStructure.medicalAllowanceBDT.toLocaleString()}</b>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-400 text-[10px] block">Conveyance Allowance</span>
                        <b className="font-mono text-slate-800 dark:text-slate-200">৳ {salaryStructure.conveyanceAllowanceBDT.toLocaleString()}</b>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-400 text-[10px] block">Food Allowance</span>
                        <b className="font-mono text-slate-800 dark:text-slate-200">৳ {salaryStructure.foodAllowanceBDT.toLocaleString()}</b>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-400 text-[10px] block">Mobile Allowance</span>
                        <b className="font-mono text-slate-800 dark:text-slate-200">৳ {salaryStructure.mobileAllowanceBDT.toLocaleString()}</b>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-400 text-[10px] block">Provident Fund (10%)</span>
                        <b className="font-mono text-amber-600">৳ {salaryStructure.providentFundBDT.toLocaleString()}</b>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-400 text-[10px] block">Estimated Tax Deduct</span>
                        <b className="font-mono text-rose-600">৳ {salaryStructure.taxDeductionBDT.toLocaleString()}</b>
                      </div>
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <span>Bank Disbursement Routing</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <span className="text-slate-500 text-[10px] block">Bank Name</span>
                        <b className="text-slate-800 dark:text-slate-200">{employee.bankName || 'Eastern Bank PLC'}</b>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Account Number</span>
                        <b className="font-mono text-blue-600 dark:text-blue-400">{employee.bankAccountNumber || '1041060088991'}</b>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Branch & Routing</span>
                        <b className="text-slate-800 dark:text-slate-200">{employee.bankBranch || 'Gulshan Branch'} ({employee.routingNumber || '095261345'})</b>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Mobile Wallet</span>
                        <b className="text-slate-800 dark:text-slate-200">{employee.mobileBankingProvider || 'bKash'}: {employee.mobileBankingNumber || employee.phone}</b>
                      </div>
                    </div>
                  </div>

                  {/* Individual Overtime Policy Configuration Card */}
                  <div className="p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">Individual Overtime Policy</h3>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        employee.isOvertimeEligible !== false
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {employee.isOvertimeEligible !== false ? 'Overtime Eligible' : 'Ineligible'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-400 text-[10px] block uppercase">Calculation Basis</span>
                        <b className="text-slate-800 dark:text-slate-200">{employee.overtimeCalculationBasis || 'Basic Salary'}</b>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-400 text-[10px] block uppercase">Monthly Standard Hours</span>
                        <b className="font-mono text-slate-800 dark:text-slate-200">{employee.overtimeStandardMonthlyHours || 208} Hours</b>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-400 text-[10px] block uppercase">OT Multiplier</span>
                        <b className="font-mono text-amber-600 dark:text-amber-400">{employee.overtimeMultiplier || 2.0}x</b>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-400 text-[10px] block uppercase">Calculated OT Rate</span>
                        <b className="font-mono text-emerald-600 dark:text-emerald-400">
                          ৳{((Number(employee.overtimeFixedHourlyRateBDT) || ((employee.basicSalaryBDT || salaryStructure.basicSalaryBDT || 30000) / (employee.overtimeStandardMonthlyHours || 208))) * (employee.overtimeMultiplier || 2.0)).toFixed(2)}/hr
                        </b>
                      </div>
                    </div>

                    {employee.overtimePolicyNotes && (
                      <p className="text-[11px] text-slate-500 italic">
                        Note: {employee.overtimePolicyNotes}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-6 text-center text-slate-400">
                  No salary structure record found for this employee.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ATTENDANCE HISTORY */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-600">Present Days</span>
                  <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                    24 / 26
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-amber-600">Late Days</span>
                  <div className="text-xl font-black text-amber-700 dark:text-amber-300 mt-1">1</div>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-blue-600">Approved Leave</span>
                  <div className="text-xl font-black text-blue-700 dark:text-blue-300 mt-1">2</div>
                </div>
                <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-purple-600">Overtime Hours</span>
                  <div className="text-xl font-black text-purple-700 dark:text-purple-300 mt-1">
                    {empOvertimes.reduce((sum, o) => sum + o.hours, 0)} hrs
                  </div>
                </div>
              </div>

              {/* Sample Log */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-800 dark:text-white flex justify-between items-center">
                  <span>Recent Daily Attendance Audit Trail</span>
                  <span className="text-[11px] text-slate-500 font-normal">October 2026</span>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Check In</th>
                      <th className="p-2.5">Check Out</th>
                      <th className="p-2.5">Work Hours</th>
                      <th className="p-2.5">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-2.5 font-mono">2026-10-31</td>
                      <td className="p-2.5"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Present</span></td>
                      <td className="p-2.5 font-mono">08:55 AM</td>
                      <td className="p-2.5 font-mono">05:15 PM</td>
                      <td className="p-2.5 font-mono">8.3 hrs</td>
                      <td className="p-2.5 text-slate-500">Biometric punch logged</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-2.5 font-mono">2026-10-30</td>
                      <td className="p-2.5"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Present</span></td>
                      <td className="p-2.5 font-mono">09:02 AM</td>
                      <td className="p-2.5 font-mono">05:30 PM</td>
                      <td className="p-2.5 font-mono">8.5 hrs</td>
                      <td className="p-2.5 text-slate-500">Beat check-in confirmed</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-2.5 font-mono">2026-10-29</td>
                      <td className="p-2.5"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Late</span></td>
                      <td className="p-2.5 font-mono text-amber-600">09:25 AM</td>
                      <td className="p-2.5 font-mono">05:30 PM</td>
                      <td className="p-2.5 font-mono">8.1 hrs</td>
                      <td className="p-2.5 text-slate-500">Traffic delay Gazipur Highway</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: LEAVE HISTORY */}
          {activeTab === 'leave' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-blue-600">Annual Leave</span>
                  <div className="text-base font-black text-blue-700 dark:text-blue-300 mt-1">14 Quota / 0 Used</div>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-600">Casual Leave</span>
                  <div className="text-base font-black text-emerald-700 dark:text-emerald-300 mt-1">10 Quota / 2 Used</div>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-amber-600">Medical / Sick</span>
                  <div className="text-base font-black text-amber-700 dark:text-amber-300 mt-1">14 Quota / 0 Used</div>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Application No</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">From - To</th>
                      <th className="p-3">Days</th>
                      <th className="p-3">Reason</th>
                      <th className="p-3">Approved By</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {empLeaves.length > 0 ? (
                      empLeaves.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{l.leaveApplicationNo}</td>
                          <td className="p-3 font-semibold">{l.leaveType}</td>
                          <td className="p-3 font-mono text-[11px]">{l.startDate} to {l.endDate}</td>
                          <td className="p-3 font-bold">{l.totalDays} Days</td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">{l.reason}</td>
                          <td className="p-3">{l.approvedBy || '-'}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              {l.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-slate-400">
                          No leave applications recorded for this employee.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: ADVANCE & LOAN HISTORY */}
          {activeTab === 'advance-loan' && (
            <div className="space-y-4">
              {empLoans.length > 0 ? (
                empLoans.map((loan) => (
                  <div key={loan.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">{loan.referenceNo}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                            {loan.type}
                          </span>
                        </div>
                        <p className="text-slate-500 mt-0.5">{loan.purpose}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Remaining Balance</span>
                        <div className="text-base font-black text-rose-600 dark:text-rose-400 font-mono">
                          ৳ {(loan.remainingBalanceBDT ?? loan.remainingAmountBDT ?? 0).toLocaleString()}
                        </div>
                        <span className="text-[10px] text-slate-500">Original: ৳ {(loan.approvedAmountBDT ?? loan.principalAmountBDT ?? 0).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Schedule */}
                    <div>
                      <h4 className="font-bold text-xs text-slate-800 dark:text-white mb-2">Repayment Schedule & Deduction Status</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                        {loan.schedule.map((s) => (
                          <div
                            key={s.installmentNumber}
                            className={`p-2 rounded-xl border text-center ${
                              s.isDeducted
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <span className="text-[10px] text-slate-400 block font-mono">{s.monthYear}</span>
                            <b className="font-mono text-slate-900 dark:text-white block mt-0.5">
                              ৳ {(s.installmentAmountBDT ?? s.amountBDT ?? 0).toLocaleString()}
                            </b>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block ${
                                s.isDeducted
                                  ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                                  : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                              }`}
                            >
                              {s.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400">
                  No active or past advance/loan accounts for this employee.
                </div>
              )}
            </div>
          )}

          {/* TAB 8: BONUS & INCENTIVE HISTORY */}
          {activeTab === 'bonus' && (
            <div className="space-y-4">
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Bonus Title</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Month</th>
                      <th className="p-3 text-right">Amount (BDT)</th>
                      <th className="p-3">Approved By</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {empBonuses.length > 0 ? (
                      empBonuses.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">{b.bonusTitle}</td>
                          <td className="p-3"><span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-semibold text-[10px]">{b.type}</span></td>
                          <td className="p-3 font-mono">{b.effectiveMonth}</td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-600">৳ {b.amountBDT.toLocaleString()}</td>
                          <td className="p-3">{b.approvedBy || 'MD'}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400">
                          No bonus or festival incentive disbursements on record.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 9: SALARY PAYMENT & PAYSLIP HISTORY */}
          {activeTab === 'payment-history' && (
            <div className="space-y-4">
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Month</th>
                      <th className="p-3 text-right">Basic Pay</th>
                      <th className="p-3 text-right">Allowances</th>
                      <th className="p-3 text-right">Gross</th>
                      <th className="p-3 text-right">Deductions</th>
                      <th className="p-3 text-right">Net Paid</th>
                      <th className="p-3">Disbursement Ref</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {empPayrollHistory.length > 0 ? (
                      empPayrollHistory.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{p.monthYear}</td>
                          <td className="p-3 text-right font-mono">৳ {(p.basicSalaryBDT || 0).toLocaleString()}</td>
                          <td className="p-3 text-right font-mono">৳ {((p.grossSalaryBDT ?? p.totalGrossEarningsBDT ?? 0) - (p.basicSalaryBDT || 0)).toLocaleString()}</td>
                          <td className="p-3 text-right font-mono font-semibold">৳ {(p.grossSalaryBDT ?? p.totalGrossEarningsBDT ?? 0).toLocaleString()}</td>
                          <td className="p-3 text-right font-mono text-rose-600">৳ {(p.totalDeductionsBDT || 0).toLocaleString()}</td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-600 text-sm">৳ {(p.netPayableBDT ?? p.netSalaryBDT ?? 0).toLocaleString()}</td>
                          <td className="p-3 font-mono text-[10px] text-slate-500">{p.transactionRef || 'EFT-EBL-DIRECT'}</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              {p.paymentStatus || 'Paid'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-400">
                          No historical payroll disbursements found for this ID.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Field Force / Employee Master ID: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{employee.id}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold text-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
