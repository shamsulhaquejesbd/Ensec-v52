import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext.tsx';
import {
  EmployeeOvertimePolicy,
  OvertimeCalculationBasis,
  calculateEmployeeIndividualOvertime,
} from '../../types/overtime.ts';
import { FieldForceRep } from '../../types/erp.ts';
import {
  Users,
  Search,
  Filter,
  Clock,
  Calculator,
  ShieldCheck,
  ShieldAlert,
  Edit2,
  History,
  CheckCircle2,
  X,
  Save,
  Building,
  DollarSign,
  AlertCircle,
  FileText,
  Sliders,
  ArrowRight,
} from 'lucide-react';

export const OvertimePolicySettingsTab: React.FC = () => {
  const {
    fieldForceReps,
    salaryStructures,
    getEmployeeEffectiveOvertimePolicy,
    updateEmployeeOvertimePolicy,
    formatCurrency,
    currentUser,
  } = useERP();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [eligibilityFilter, setEligibilityFilter] = useState<'ALL' | 'ELIGIBLE' | 'INELIGIBLE'>('ALL');
  const [basisFilter, setBasisFilter] = useState<'ALL' | 'Basic Salary' | 'Fixed Hourly Rate'>('ALL');

  // Modal states for Quick Policy Editing and Policy History
  const [editingEmployee, setEditingEmployee] = useState<FieldForceRep | null>(null);
  const [viewingHistoryEmployee, setViewingHistoryEmployee] = useState<FieldForceRep | null>(null);

  // Edit Policy Form State
  const [editIsEligible, setEditIsEligible] = useState<boolean>(true);
  const [editBasis, setEditBasis] = useState<OvertimeCalculationBasis>('Basic Salary');
  const [editStandardHours, setEditStandardHours] = useState<number>(208);
  const [editMultiplier, setEditMultiplier] = useState<number>(2.0);
  const [editFixedRate, setEditFixedRate] = useState<number>(0);
  const [editEffectiveFrom, setEditEffectiveFrom] = useState<string>(new Date().toISOString().substring(0, 10));
  const [editStatus, setEditStatus] = useState<'Active' | 'Inactive'>('Active');
  const [editNotes, setEditNotes] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Extract unique departments for filter
  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    fieldForceReps.forEach((r) => {
      if (r.department) set.add(r.department);
    });
    return Array.from(set);
  }, [fieldForceReps]);

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return fieldForceReps.filter((emp) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (emp.name || '').toLowerCase().includes(q) ||
        (emp.code || '').toLowerCase().includes(q) ||
        (emp.designation || '').toLowerCase().includes(q);

      const matchDept = departmentFilter === 'ALL' || emp.department === departmentFilter;

      const isEligible = emp.isOvertimeEligible !== false;
      const matchEligibility =
        eligibilityFilter === 'ALL' ||
        (eligibilityFilter === 'ELIGIBLE' && isEligible) ||
        (eligibilityFilter === 'INELIGIBLE' && !isEligible);

      const basis = emp.overtimeCalculationBasis || 'Basic Salary';
      const matchBasis = basisFilter === 'ALL' || basis === basisFilter;

      return matchSearch && matchDept && matchEligibility && matchBasis;
    });
  }, [fieldForceReps, searchQuery, departmentFilter, eligibilityFilter, basisFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = fieldForceReps.length;
    const eligibleCount = fieldForceReps.filter((r) => r.isOvertimeEligible !== false).length;
    const fixedRateCount = fieldForceReps.filter((r) => r.overtimeCalculationBasis === 'Fixed Hourly Rate').length;
    const basicSalaryCount = total - fixedRateCount;
    return { total, eligibleCount, fixedRateCount, basicSalaryCount };
  }, [fieldForceReps]);

  // Open Edit Policy Modal
  const handleOpenEdit = (emp: FieldForceRep) => {
    const policy = getEmployeeEffectiveOvertimePolicy(emp.id);
    setEditingEmployee(emp);
    setEditIsEligible(policy.isEligible);
    setEditBasis(policy.calculationBasis);
    setEditStandardHours(policy.standardMonthlyWorkingHours || 208);
    setEditMultiplier(policy.overtimeMultiplier || 2.0);
    setEditFixedRate(policy.fixedHourlyRateBDT || 0);
    setEditEffectiveFrom(policy.effectiveFrom || new Date().toISOString().substring(0, 10));
    setEditStatus(policy.status || 'Active');
    setEditNotes(policy.notes || '');
    setSaveSuccessMsg('');
  };

  // Save Policy Changes
  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    updateEmployeeOvertimePolicy(
      editingEmployee.id,
      {
        isEligible: editIsEligible,
        calculationBasis: editBasis,
        standardMonthlyWorkingHours: Number(editStandardHours) || 208,
        overtimeMultiplier: Number(editMultiplier) || 2.0,
        fixedHourlyRateBDT: Number(editFixedRate) || 0,
        effectiveFrom: editEffectiveFrom,
        status: editStatus,
        notes: editNotes.trim() || undefined,
      },
      editNotes.trim() || 'Policy amended via Overtime Policy Directory'
    );

    setSaveSuccessMsg(`Overtime Policy updated for ${editingEmployee.name} successfully!`);
    setTimeout(() => {
      setEditingEmployee(null);
      setSaveSuccessMsg('');
    }, 900);
  };

  // Live calculation preview in edit modal
  const editPreview = useMemo(() => {
    if (!editingEmployee) return { hourly: 0, netRate: 0 };
    const str = salaryStructures.find((s) => s.employeeId === editingEmployee.id);
    const basic = str ? str.basicSalaryBDT : (editingEmployee.basicSalaryBDT || 30000);
    const calc = calculateEmployeeIndividualOvertime(
      basic,
      {
        isEligible: editIsEligible,
        calculationBasis: editBasis,
        standardMonthlyWorkingHours: editStandardHours,
        overtimeMultiplier: editMultiplier,
        fixedHourlyRateBDT: editFixedRate,
        status: editStatus,
      },
      2
    );
    return {
      hourly: calc.hourlyRate,
      netRate: calc.effectiveRateBDT,
      sampleAmount: calc.totalAmountBDT,
      basic,
    };
  }, [editingEmployee, salaryStructures, editIsEligible, editBasis, editStandardHours, editMultiplier, editFixedRate, editStatus]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner explaining Individual Architecture */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Employee-Specific Overtime Policy Directory</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                Individual Terms Active
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Single global overtime policy has been removed. Overtime eligibility, divisors (e.g. 208h), calculation basis, and multipliers are configured individually per employee via Field Force Employee Master.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 text-[11px]">
            Integrated with <strong className="text-slate-700 dark:text-slate-200">Field Force Master</strong>
          </span>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Total Staff Master</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {stats.total}
          </div>
          <span className="text-[10px] text-slate-400">Ensec Central Staff Directory</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>OT Eligible Staff</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {stats.eligibleCount}
          </div>
          <span className="text-[10px] text-emerald-600/80 font-medium">
            {stats.total > 0 ? `${((stats.eligibleCount / stats.total) * 100).toFixed(0)}% eligible` : '0%'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Basic Salary Basis</span>
            <DollarSign className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 font-mono">
            {stats.basicSalaryCount}
          </div>
          <span className="text-[10px] text-slate-400">Basic ÷ Standard Hours divisor</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Fixed Hourly Rate</span>
            <Calculator className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
            {stats.fixedRateCount}
          </div>
          <span className="text-[10px] text-slate-400">Flat hourly contract agreements</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee by name, code, designation..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
          >
            <option value="ALL">All Departments</option>
            {departmentsList.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Eligibility Filter */}
          <select
            value={eligibilityFilter}
            onChange={(e) => setEligibilityFilter(e.target.value as any)}
            className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
          >
            <option value="ALL">All Eligibility</option>
            <option value="ELIGIBLE">Eligible Only</option>
            <option value="INELIGIBLE">Ineligible Only</option>
          </select>

          {/* Basis Filter */}
          <select
            value={basisFilter}
            onChange={(e) => setBasisFilter(e.target.value as any)}
            className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
          >
            <option value="ALL">All Calculation Bases</option>
            <option value="Basic Salary">Basic Salary</option>
            <option value="Fixed Hourly Rate">Fixed Hourly Rate</option>
          </select>
        </div>
      </div>

      {/* Main Employee Overtime Policy Master Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department / Role</th>
                <th className="py-3 px-4 text-center">Eligibility</th>
                <th className="py-3 px-4">Calculation Basis</th>
                <th className="py-3 px-4 text-right">Standard Divisor</th>
                <th className="py-3 px-4 text-right">Multiplier</th>
                <th className="py-3 px-4 text-right">Base Rate</th>
                <th className="py-3 px-4 text-right">Effective OT Rate</th>
                <th className="py-3 px-4">Effective Since</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => {
                  const policy = getEmployeeEffectiveOvertimePolicy(emp.id);
                  const str = salaryStructures.find((s) => s.employeeId === emp.id);
                  const basic = str ? str.basicSalaryBDT : (emp.basicSalaryBDT || 30000);
                  const calc = calculateEmployeeIndividualOvertime(basic, policy, 1);
                  const historyCount = Array.isArray(emp.overtimePolicyHistory) ? emp.overtimePolicyHistory.length : 0;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs shrink-0">
                            {(emp.name || 'E').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {emp.name}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {emp.code || 'EMP-000'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        <span className="font-semibold block">{emp.department || 'Operations'}</span>
                        <span className="text-[10px] text-slate-400">{emp.designation || 'Staff'}</span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block ${
                          policy.isEligible && policy.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                        }`}>
                          {policy.isEligible && policy.status === 'Active' ? 'Eligible' : 'Ineligible'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {policy.calculationBasis}
                        </span>
                        {policy.calculationBasis === 'Basic Salary' ? (
                          <span className="text-[10px] text-slate-400 font-mono">
                            Basic ৳{basic.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                            Fixed ৳{policy.fixedHourlyRateBDT || 0}/hr
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                        {policy.calculationBasis === 'Fixed Hourly Rate' ? (
                          <span className="text-slate-400">N/A</span>
                        ) : (
                          <span>{policy.standardMonthlyWorkingHours} hrs</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                        {policy.overtimeMultiplier}x
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                        {formatCurrency(calc.hourlyRate)}/hr
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        {policy.isEligible ? `${formatCurrency(calc.effectiveRateBDT)}/hr` : '৳ 0'}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        <span>{policy.effectiveFrom}</span>
                        {policy.status !== 'Active' && (
                          <span className="block text-[10px] text-rose-500 font-sans font-bold">Suspended</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            className="py-1 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold text-[10px] flex items-center gap-1 transition-colors"
                            title="Edit Individual Overtime Terms"
                          >
                            <Edit2 className="w-3 h-3 text-blue-600" />
                            <span>Edit Policy</span>
                          </button>

                          {historyCount > 0 && (
                            <button
                              onClick={() => setViewingHistoryEmployee(emp)}
                              className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                              title={`View ${historyCount} historical policy versions`}
                            >
                              <History className="w-3.5 h-3.5 text-slate-500" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400">
                    No employees matched the selected search or filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: EDIT EMPLOYEE OVERTIME POLICY DIRECTLY */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in duration-150">
            {/* Header */}
            <div className="p-4 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base leading-tight">Configure Employee Overtime Policy</h2>
                  <p className="text-xs text-indigo-300 font-mono">
                    {editingEmployee.name} ({editingEmployee.code}) • {editingEmployee.department || 'Operations'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingEmployee(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePolicy} className="p-6 space-y-4 text-xs">
              {saveSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {/* 1. Overtime Eligibility */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  1. Overtime Eligibility *
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditIsEligible(true)}
                    className={`flex-1 py-2 px-3 rounded-xl border font-bold transition-all ${
                      editIsEligible
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Yes (Eligible for Overtime)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditIsEligible(false)}
                    className={`flex-1 py-2 px-3 rounded-xl border font-bold transition-all ${
                      !editIsEligible
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    No (Ineligible)
                  </button>
                </div>
              </div>

              {/* 2 & 3. Basis & Divisor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    2. Calculation Basis *
                  </label>
                  <select
                    value={editBasis}
                    onChange={(e) => setEditBasis(e.target.value as any)}
                    disabled={!editIsEligible}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="Basic Salary">Basic Salary (Basic ÷ Working Hours)</option>
                    <option value="Fixed Hourly Rate">Fixed Hourly Rate (Flat BDT per hour)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    3. Monthly Standard Hours / Divisor *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="400"
                    value={editStandardHours}
                    onChange={(e) => setEditStandardHours(Math.max(1, Number(e.target.value) || 208))}
                    disabled={!editIsEligible || editBasis === 'Fixed Hourly Rate'}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-medium disabled:opacity-50"
                  />
                  <span className="text-[10px] text-slate-400">e.g. 208 hrs (26 days × 8h)</span>
                </div>
              </div>

              {/* 4 & 5. Multiplier & Fixed Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    4. Overtime Multiplier *
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="5.0"
                      value={editMultiplier}
                      onChange={(e) => setEditMultiplier(Number(e.target.value) || 2.0)}
                      disabled={!editIsEligible}
                      className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                    />
                    <div className="flex gap-1">
                      {[1.5, 2.0].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setEditMultiplier(m)}
                          disabled={!editIsEligible}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                            editMultiplier === m
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {m}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    5. Fixed Hourly Rate (BDT) {editBasis === 'Fixed Hourly Rate' ? '*' : '(Optional)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editFixedRate}
                    onChange={(e) => setEditFixedRate(Math.max(0, Number(e.target.value) || 0))}
                    disabled={!editIsEligible || editBasis !== 'Fixed Hourly Rate'}
                    className={`w-full py-2 px-3 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold ${
                      editBasis === 'Fixed Hourly Rate'
                        ? 'border-indigo-400 ring-2 ring-indigo-400/20'
                        : 'border-slate-200 dark:border-slate-700 opacity-50'
                    }`}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* 6 & 7. Effective Date & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    6. Effective From Date *
                  </label>
                  <input
                    type="date"
                    value={editEffectiveFrom}
                    onChange={(e) => setEditEffectiveFrom(e.target.value)}
                    required
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    7. Policy Status *
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="Active">Active (Policy in effect)</option>
                    <option value="Inactive">Inactive (Suspended)</option>
                  </select>
                </div>
              </div>

              {/* Amendment Notes */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Policy Amendment Notes
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="e.g. Rate revision per annual staff agreement"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              {/* Live Preview Box */}
              <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-blue-300">
                    <Calculator className="w-3.5 h-3.5 text-blue-400" />
                    <span>Calculation Preview for {editingEmployee.name}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {editBasis === 'Fixed Hourly Rate'
                      ? `Flat ৳${editFixedRate}/hr × ${editMultiplier}x`
                      : `Basic ৳${editPreview.basic.toLocaleString()} ÷ ${editStandardHours}h × ${editMultiplier}x`}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Base Hourly Rate:</span>
                    <span className="font-mono font-bold text-white text-xs">
                      {formatCurrency(editPreview.hourly)}/hr
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Effective OT Rate:</span>
                    <span className="font-mono font-bold text-emerald-400 text-xs">
                      {formatCurrency(editPreview.netRate)}/hr
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Sample 2-Hour OT:</span>
                    <span className="font-mono font-black text-amber-400 text-xs">
                      {formatCurrency(editPreview.sampleAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Policy &amp; Archive Snapshot</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW POLICY VERSION & AMENDMENT HISTORY */}
      {viewingHistoryEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in duration-150">
            <div className="p-4 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base leading-tight">Overtime Policy History &amp; Changelog</h2>
                  <p className="text-xs text-indigo-300 font-mono">
                    {viewingHistoryEmployee.name} ({viewingHistoryEmployee.code})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingHistoryEmployee(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-500 text-[11px]">
                Historical overtime records calculate using the applicable policy based on the overtime date. When policies change, previous terms are preserved below:
              </p>

              {viewingHistoryEmployee.overtimePolicyHistory && viewingHistoryEmployee.overtimePolicyHistory.length > 0 ? (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 text-[10px] uppercase">
                        <th className="py-2.5 px-3">Effective Period</th>
                        <th className="py-2.5 px-3">Eligibility</th>
                        <th className="py-2.5 px-3">Basis</th>
                        <th className="py-2.5 px-3 text-right">Divisor</th>
                        <th className="py-2.5 px-3 text-right">Multiplier</th>
                        <th className="py-2.5 px-3 text-right">Fixed Rate</th>
                        <th className="py-2.5 px-3">Notes &amp; Archived By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {viewingHistoryEmployee.overtimePolicyHistory.map((hist, idx) => (
                        <tr key={hist.id || idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                            {hist.effectiveFrom} → {hist.effectiveTo || 'Superseded'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              hist.isEligible ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {hist.isEligible ? 'Eligible' : 'Ineligible'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-medium">{hist.calculationBasis}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{hist.standardMonthlyWorkingHours}h</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-600">{hist.overtimeMultiplier}x</td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {hist.fixedHourlyRateBDT ? `৳${hist.fixedHourlyRateBDT}` : 'N/A'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                            {hist.notes || 'Routine revision'} {hist.updatedBy ? `(${hist.updatedBy})` : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl">
                  No previous policy revisions recorded. Active policy is currently the primary version.
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setViewingHistoryEmployee(null)}
                  className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold transition-colors"
                >
                  Close History
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
