/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ensec ERP - Automatic Collection Follow-up & Recovery System
 * Multi-tier escalation management, officer assignments, customer follow-up logger,
 * commitment tracking, and collection efficiency analytics.
 */

import React, { useState, useMemo } from 'react';
import {
  Users2,
  PhoneCall,
  MessageSquare,
  MapPin,
  Calendar,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  ArrowRight,
  UserCheck,
  Building,
  FileText,
  X,
  Send,
  Sparkles,
  History,
  CheckSquare,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import {
  CollectionAssignment,
  CollectionFollowUp,
  CollectionActivityType,
  FollowUpStatus,
  EscalationLevel,
} from '../../types/installment.ts';
import { generateWhatsAppLink } from '../../lib/smsService.ts';

interface CollectionManagementModuleProps {
  initialSubTab?: string;
  onNavigate?: (module: string) => void;
}

export const CollectionManagementModule: React.FC<CollectionManagementModuleProps> = ({
  initialSubTab = 'collection-dashboard',
  onNavigate,
}) => {
  const {
    installmentPlans,
    installmentSchedules,
    installmentPayments,
    collectionAssignments,
    collectionFollowUps,
    collectionEscalationRules,
    users,
    currentUser,
    addCollectionFollowUp,
    updateCollectionAssignment,
    createCollectionAssignment,
  } = useERP();

  const [activeTab, setActiveTab] = useState<string>(initialSubTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Selected customer for full collection history modal
  const [selectedPlanForHistory, setSelectedPlanForHistory] = useState<any | null>(null);

  // New Follow-up modal state
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpPlanId, setFollowUpPlanId] = useState('');
  const [followUpContactPerson, setFollowUpContactPerson] = useState('');
  const [followUpContactPhone, setFollowUpContactPhone] = useState('');
  const [followUpActivityType, setFollowUpActivityType] = useState<CollectionActivityType>('Phone Call');
  const [followUpDate, setFollowUpDate] = useState(new Date().toISOString().slice(0, 10));
  const [nextFollowUpDate, setNextFollowUpDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  });
  const [committedAmount, setCommittedAmount] = useState<number>(0);
  const [committedDate, setCommittedDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [followUpStatus, setFollowUpStatus] = useState<FollowUpStatus>('Pending');
  const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);

  // New Assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignPlanId, setAssignPlanId] = useState('');
  const [assignOfficerId, setAssignOfficerId] = useState('');
  const [assignTargetDate, setAssignTargetDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [assignPriority, setAssignPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [assignEscalation, setAssignEscalation] = useState<EscalationLevel>('Level 1 (Officer)');

  // -------------------------------------------------------------
  // COLLECTION DASHBOARD KPI CALCULATIONS (Section 8)
  // -------------------------------------------------------------
  const todayStr = new Date().toISOString().slice(0, 10);

  // Today's Collection Target = dues maturing today + overdue targets
  const todaysTargetBDT = useMemo(() => {
    const duesToday = installmentSchedules
      .filter((s) => s.dueDate === todayStr && s.status !== 'Paid')
      .reduce((sum, s) => sum + s.remainingAmountBDT, 0);

    const activeAssignmentsTarget = collectionAssignments
      .filter((a) => a.status === 'Active')
      .reduce((sum, a) => sum + a.targetAmountBDT, 0);

    return duesToday + activeAssignmentsTarget;
  }, [installmentSchedules, collectionAssignments, todayStr]);

  // Today's Actual Collection
  const todaysActualBDT = useMemo(() => {
    return installmentPayments
      .filter((p) => p.paymentDate === todayStr)
      .reduce((sum, p) => sum + p.amountBDT, 0);
  }, [installmentPayments, todayStr]);

  // Total Due & Total Overdue
  const totalDueAmountBDT = useMemo(() => {
    return installmentSchedules
      .filter((s) => s.status !== 'Paid')
      .reduce((sum, s) => sum + s.remainingAmountBDT, 0);
  }, [installmentSchedules]);

  const totalOverdueAmountBDT = useMemo(() => {
    return installmentSchedules
      .filter((s) => s.status === 'Overdue')
      .reduce((sum, s) => sum + s.remainingAmountBDT, 0);
  }, [installmentSchedules]);

  // Customers Requiring Follow-up
  const customersRequiringFollowUp = useMemo(() => {
    return installmentPlans.filter((p) => p.status === 'Overdue' || p.overdueInstallmentsCount > 0);
  }, [installmentPlans]);

  const pendingFollowupsCount = useMemo(() => {
    return collectionFollowUps.filter((f) => f.status === 'Pending').length;
  }, [collectionFollowUps]);

  const completedFollowupsCount = useMemo(() => {
    return collectionFollowUps.filter((f) => f.status === 'Completed').length;
  }, [collectionFollowUps]);

  // Collection Efficiency %
  const collectionEfficiencyPct = useMemo(() => {
    if (todaysTargetBDT <= 0) return 85;
    return Math.min(100, Math.round((todaysActualBDT / todaysTargetBDT) * 100));
  }, [todaysActualBDT, todaysTargetBDT]);

  // Handle Log Follow-up Submission
  const handleSaveFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpPlanId) {
      alert('Please select an agreement');
      return;
    }
    if (!followUpNotes.trim()) {
      alert('Please enter follow-up activity notes');
      return;
    }

    const plan = installmentPlans.find((p) => p.id === followUpPlanId);
    if (!plan) return;

    setIsSubmittingFollowUp(true);

    try {
      await addCollectionFollowUp({
        planId: plan.id,
        agreementNo: plan.agreementNo,
        customerId: plan.customerId,
        customerName: plan.customerName,
        contactPerson: followUpContactPerson || plan.guarantorName || plan.customerName,
        contactPhone: followUpContactPhone || plan.customerPhone,
        activityType: followUpActivityType,
        followUpDate,
        nextFollowUpDate,
        committedAmountBDT: committedAmount > 0 ? committedAmount : undefined,
        committedPaymentDate: committedDate || undefined,
        notes: followUpNotes,
        performedById: currentUser.id,
        performedByName: currentUser.name,
        status: followUpStatus,
      });

      setIsSubmittingFollowUp(false);
      setShowFollowUpModal(false);
      setFollowUpNotes('');
      setCommittedAmount(0);
      setCommittedDate('');
    } catch (err: any) {
      alert(`Error saving follow-up: ${err.message}`);
      setIsSubmittingFollowUp(false);
    }
  };

  // Handle Save Assignment
  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignPlanId || !assignOfficerId) {
      alert('Please select agreement and officer');
      return;
    }

    const plan = installmentPlans.find((p) => p.id === assignPlanId);
    const officer = users.find((u) => u.id === assignOfficerId);
    if (!plan || !officer) return;

    createCollectionAssignment({
      planId: plan.id,
      agreementNo: plan.agreementNo,
      customerId: plan.customerId,
      customerName: plan.customerName,
      assignedToId: officer.id,
      assignedToName: officer.name,
      assignedToRole: officer.role,
      assignedById: currentUser.id,
      assignedByName: currentUser.name,
      assignmentDate: todayStr,
      targetDate: assignTargetDate,
      targetAmountBDT: plan.overdueAmountBDT || plan.monthlyInstallmentBDT,
      escalationLevel: assignEscalation,
      status: 'Active',
      priority: assignPriority,
    });

    setShowAssignModal(false);
  };

  // Open Log Modal with Pre-filled Plan
  const openFollowUpForPlan = (plan: any) => {
    setFollowUpPlanId(plan.id);
    setFollowUpContactPerson(plan.customerName);
    setFollowUpContactPhone(plan.customerPhone);
    setCommittedAmount(plan.overdueAmountBDT || plan.monthlyInstallmentBDT);
    setShowFollowUpModal(true);
  };

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 via-orange-600 to-amber-500 text-white flex items-center justify-center shadow-sm">
              <Users2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Collection & Recovery Management
              </h1>
              <p className="text-xs text-slate-500">
                Automated overdue detection, multi-tier officer escalation, field follow-up logs, and target recovery.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowFollowUpModal(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Log Follow-up Activity</span>
          </button>

          <button
            onClick={() => setShowAssignModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition border border-slate-200 dark:border-slate-700"
          >
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span>Assign Accounts</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs matching Sidebar Section 2 */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'collection-dashboard', label: 'Collection Dashboard' },
          { id: 'collection-target', label: "Today's Target" },
          { id: 'collection-upcoming', label: 'Upcoming Collections' },
          { id: 'collection-overdue', label: `Overdue Collections (${customersRequiringFollowUp.length})` },
          { id: 'collection-followup', label: 'Follow-up Activities' },
          { id: 'collection-assignments', label: `Assignments (${collectionAssignments.length})` },
          { id: 'collection-history', label: `History & Notes (${collectionFollowUps.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === tab.id
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 1. COLLECTION DASHBOARD (Section 8)                                        */}
      {/* ========================================================================= */}
      {activeTab === 'collection-dashboard' && (
        <div className="space-y-6">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <div className="text-[11px] font-semibold text-slate-400">Today's Collection Target</div>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                ৳{todaysTargetBDT.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Scheduled for {todayStr}</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <div className="text-[11px] font-semibold text-slate-400">Today's Actual Collection</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                ৳{todaysActualBDT.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {collectionEfficiencyPct}%
                </span>
                <span>daily target efficiency</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 border-l-4 border-l-rose-500">
              <div className="text-[11px] font-semibold text-rose-500">Total Overdue Receivables</div>
              <div className="text-2xl font-black text-rose-600 mt-1">
                ৳{totalOverdueAmountBDT.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {customersRequiringFollowUp.length} accounts in escalation
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <div className="text-[11px] font-semibold text-slate-400">Follow-up Activity Queue</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {pendingFollowupsCount} Pending
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {completedFollowupsCount} completed this cycle
              </div>
            </div>
          </div>

          {/* Section 8 Priority-based Customer Overdue Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Priority Escalation & Overdue Follow-up Directory</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                    Live Status
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Click on any customer to inspect full collection audit trail, contact person, and committed dates.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search priority accounts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white w-52"
                  />
                </div>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Customer / Distributor</th>
                    <th className="p-3 text-right">Outstanding (BDT)</th>
                    <th className="p-3">Overdue Days</th>
                    <th className="p-3">Assigned To</th>
                    <th className="p-3">Next Follow-up</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {/* Render priority items */}
                  {collectionAssignments.map((assign) => {
                    const plan = installmentPlans.find((p) => p.id === assign.planId);
                    const overdueDays = plan ? (plan.overdueAmountBDT > 0 ? (plan.overdueInstallmentsCount * 30) : 0) : 0;
                    const latestFollowUp = collectionFollowUps.find((f) => f.planId === assign.planId);

                    return (
                      <tr
                        key={assign.id}
                        onClick={() => setSelectedPlanForHistory(plan || assign)}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 cursor-pointer transition"
                      >
                        <td className="p-3">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{assign.customerName}</span>
                            <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400">
                              ({assign.agreementNo})
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {plan?.productName || 'LiFePO4 Battery'}
                          </div>
                        </td>

                        <td className="p-3 text-right font-black text-rose-600">
                          ৳{assign.targetAmountBDT.toLocaleString()}
                        </td>

                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                            {overdueDays} days
                          </span>
                        </td>

                        <td className="p-3">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {assign.assignedToName}
                          </div>
                          <div className="text-[10px] text-slate-400">{assign.escalationLevel}</div>
                        </td>

                        <td className="p-3 font-semibold text-amber-600 dark:text-amber-400">
                          {latestFollowUp?.nextFollowUpDate || 'Today'}
                        </td>

                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              assign.priority === 'Critical'
                                ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                                : assign.priority === 'High'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            }`}
                          >
                            {assign.priority}
                          </span>
                        </td>

                        <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openFollowUpForPlan(plan || assign)}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-[11px] font-semibold"
                            >
                              Log Call
                            </button>

                            {plan && (
                              <a
                                href={generateWhatsAppLink(
                                  plan.customerPhone,
                                  `Dear ${plan.customerName}, this is a reminder from Ensec regarding your installment of BDT ${assign.targetAmountBDT.toLocaleString()} for agreement ${plan.agreementNo}. Kindly clear your outstanding amount.`
                                )}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                                title="Open WhatsApp Direct"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </a>
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
      {/* 2. COLLECTION FOLLOW-UP LOGS & RECORDING (Section 7)                       */}
      {/* ========================================================================= */}
      {(activeTab === 'collection-followup' || activeTab === 'collection-history') && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Collection Follow-up Activity Ledger & History
              </h2>
              <p className="text-[11px] text-slate-500">
                Audited record of Phone Calls, Visits, WhatsApp interactions, and committed payment deadlines.
              </p>
            </div>

            <button
              onClick={() => setShowFollowUpModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Activity</span>
            </button>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Customer & Agreement</th>
                  <th className="p-3">Contact Person</th>
                  <th className="p-3">Activity Type</th>
                  <th className="p-3">Notes & Outcome</th>
                  <th className="p-3">Committed Date</th>
                  <th className="p-3">Next Follow-up</th>
                  <th className="p-3">Officer</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {collectionFollowUps.map((flp) => (
                  <tr key={flp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 text-slate-500">{flp.followUpDate}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-white">{flp.customerName}</div>
                      <div className="font-mono text-[10px] text-blue-600 dark:text-blue-400">
                        {flp.agreementNo}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-slate-800 dark:text-slate-200">{flp.contactPerson}</div>
                      <div className="text-[10px] text-slate-400">{flp.contactPhone}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {flp.activityType}
                      </span>
                    </td>
                    <td className="p-3 max-w-xs text-slate-600 dark:text-slate-300">
                      {flp.notes}
                      {flp.committedAmountBDT && (
                        <div className="text-[10px] font-bold text-emerald-600 mt-0.5">
                          Committed: ৳{flp.committedAmountBDT.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-emerald-600 font-semibold">
                      {flp.committedPaymentDate || '—'}
                    </td>
                    <td className="p-3 font-medium text-slate-900 dark:text-white">
                      {flp.nextFollowUpDate || '—'}
                    </td>
                    <td className="p-3 text-slate-500">{flp.performedByName}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          flp.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : flp.status === 'Pending'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {flp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. COLLECTION ASSIGNMENTS VIEW                                             */}
      {/* ========================================================================= */}
      {activeTab === 'collection-assignments' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Officer Account Assignments & Escalation Routing
              </h2>
              <p className="text-[11px] text-slate-500">
                Accounts Managers can assign overdue accounts to Officers, ASMs, RMs or Legal Recovery.
              </p>
            </div>

            <button
              onClick={() => setShowAssignModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Assignment</span>
            </button>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Agreement</th>
                  <th className="p-3">Assigned Officer</th>
                  <th className="p-3">Role & Escalation</th>
                  <th className="p-3">Target Date</th>
                  <th className="p-3">Target Amount</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {collectionAssignments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{a.customerName}</td>
                    <td className="p-3 font-mono text-blue-600 dark:text-blue-400">{a.agreementNo}</td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                      {a.assignedToName}
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {a.assignedToRole}
                      </span>
                      <div className="text-[10px] text-slate-400">{a.escalationLevel}</div>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{a.targetDate}</td>
                    <td className="p-3 font-bold text-rose-600">
                      ৳{a.targetAmountBDT.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          a.priority === 'Critical'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : a.priority === 'High'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {a.priority}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LOG COLLECTION FOLLOW-UP ACTIVITY                                   */}
      {/* ========================================================================= */}
      {showFollowUpModal && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          <div
            onClick={() => setShowFollowUpModal(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Log Collection Follow-up Activity
              </h3>
              <button
                onClick={() => setShowFollowUpModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFollowUp} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Customer Installment Plan *
                </label>
                <select
                  value={followUpPlanId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setFollowUpPlanId(id);
                    const p = installmentPlans.find((plan) => plan.id === id);
                    if (p) {
                      setFollowUpContactPerson(p.customerName);
                      setFollowUpContactPhone(p.customerPhone);
                      setCommittedAmount(p.overdueAmountBDT || p.monthlyInstallmentBDT);
                    }
                  }}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                >
                  <option value="">-- Select Overdue Agreement --</option>
                  {installmentPlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.agreementNo} - {p.customerName} (৳{p.totalOutstandingBDT.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    value={followUpContactPerson}
                    onChange={(e) => setFollowUpContactPerson(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={followUpContactPhone}
                    onChange={(e) => setFollowUpContactPhone(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Activity Type
                  </label>
                  <select
                    value={followUpActivityType}
                    onChange={(e) => setFollowUpActivityType(e.target.value as CollectionActivityType)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Phone Call">Phone Call</option>
                    <option value="SMS Sent">SMS Sent</option>
                    <option value="WhatsApp Contact">WhatsApp Contact</option>
                    <option value="Customer Visit">Customer Visit</option>
                    <option value="Payment Commitment">Payment Commitment</option>
                    <option value="Payment Received">Payment Received</option>
                    <option value="Customer Unreachable">Customer Unreachable</option>
                    <option value="Dispute/Complaint">Dispute / Complaint</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Follow-up Status
                  </label>
                  <select
                    value={followUpStatus}
                    onChange={(e) => setFollowUpStatus(e.target.value as FollowUpStatus)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Rescheduled">Rescheduled</option>
                    <option value="Broken Commitment">Broken Commitment</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Committed Amount (BDT)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={committedAmount}
                    onChange={(e) => setCommittedAmount(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Committed Payment Date
                  </label>
                  <input
                    type="date"
                    value={committedDate}
                    onChange={(e) => setCommittedDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Next Follow-up Date
                </label>
                <input
                  type="date"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Follow-up Notes & Discussion Summary *
                </label>
                <textarea
                  rows={3}
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  placeholder="Record customer comments, payment date promise, reason for delay..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFollowUpModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFollowUp}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs"
                >
                  {isSubmittingFollowUp ? 'Saving...' : 'Save Follow-up Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NEW COLLECTION ASSIGNMENT                                           */}
      {/* ========================================================================= */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          <div
            onClick={() => setShowAssignModal(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Assign Overdue Account to Officer
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Select Agreement *
                </label>
                <select
                  value={assignPlanId}
                  onChange={(e) => setAssignPlanId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                >
                  <option value="">-- Choose Account --</option>
                  {installmentPlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.agreementNo} - {p.customerName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Assign To Employee *
                </label>
                <select
                  value={assignOfficerId}
                  onChange={(e) => setAssignOfficerId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                >
                  <option value="">-- Choose Employee / Officer --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Escalation Level
                  </label>
                  <select
                    value={assignEscalation}
                    onChange={(e) => setAssignEscalation(e.target.value as EscalationLevel)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Level 1 (Officer)">Level 1 (Officer)</option>
                    <option value="Level 2 (ASM)">Level 2 (ASM)</option>
                    <option value="Level 3 (RM)">Level 3 (RM)</option>
                    <option value="Level 4 (Head Office)">Level 4 (Head Office)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={assignPriority}
                    onChange={(e) => setAssignPriority(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Target Recovery Date
                </label>
                <input
                  type="date"
                  value={assignTargetDate}
                  onChange={(e) => setAssignTargetDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
                >
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CUSTOMER COMPLETE COLLECTION AUDIT HISTORY                         */}
      {/* ========================================================================= */}
      {selectedPlanForHistory && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          <div
            onClick={() => setSelectedPlanForHistory(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col max-h-[85vh] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Collection Dossier: {selectedPlanForHistory.customerName}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Agreement {selectedPlanForHistory.agreementNo}
                </p>
              </div>
              <button
                onClick={() => setSelectedPlanForHistory(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 text-xs">
              {/* Financial Snapshot */}
              <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <span className="text-slate-400">Total Financed:</span>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                    ৳{(selectedPlanForHistory.financedAmountBDT || selectedPlanForHistory.targetAmountBDT || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Overdue Amount:</span>
                  <div className="font-bold text-rose-600 mt-0.5">
                    ৳{(selectedPlanForHistory.overdueAmountBDT || selectedPlanForHistory.targetAmountBDT || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Contact:</span>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedPlanForHistory.customerPhone || '+8801711223344'}
                  </div>
                </div>
              </div>

              {/* Past follow-ups */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2">
                  Follow-up Timeline & Recorded Commitments
                </h4>
                <div className="space-y-2">
                  {collectionFollowUps
                    .filter((f) => f.agreementNo === selectedPlanForHistory.agreementNo)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {item.activityType} on {item.followUpDate}
                          </span>
                          <span className="text-slate-400">by {item.performedByName}</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          {item.notes}
                        </p>
                        {item.committedAmountBDT && (
                          <div className="text-[11px] font-semibold text-emerald-600">
                            Commitment: ৳{item.committedAmountBDT.toLocaleString()} on {item.committedPaymentDate}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <button
                onClick={() => {
                  setSelectedPlanForHistory(null);
                  openFollowUpForPlan(selectedPlanForHistory);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white font-semibold text-xs flex items-center gap-1.5"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Log New Call</span>
              </button>
              <button
                onClick={() => setSelectedPlanForHistory(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
