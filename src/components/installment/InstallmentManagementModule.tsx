/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ensec ERP - Installment & Receivables Management Module
 * Comprehensive installment agreements, automated scheduling, FIFO payment collection,
 * early settlement calculator, and executive dashboard analytics.
 */

import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Receipt,
  Download,
  Printer,
  ChevronRight,
  User,
  Package,
  Landmark,
  FileText,
  FileCheck,
  RefreshCw,
  X,
  Sparkles,
  Zap,
  Tag,
  Building,
  Check,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import {
  InstallmentPlan,
  InstallmentSchedule,
  InstallmentPayment,
  PaymentMethod,
  PaymentType,
  InstallmentFrequency,
} from '../../types/installment.ts';
import { calculateEarlySettlement } from '../../lib/installmentAutomation.ts';

interface InstallmentManagementModuleProps {
  initialSubTab?: string;
  onNavigate?: (module: string) => void;
}

export const InstallmentManagementModule: React.FC<InstallmentManagementModuleProps> = ({
  initialSubTab = 'installment-dashboard',
  onNavigate,
}) => {
  const {
    installmentPlans,
    installmentSchedules,
    installmentPayments,
    customers,
    distributors,
    products,
    banks,
    currentUser,
    createInstallmentPlan,
    recordInstallmentPayment,
    recordEarlySettlement,
    runAutomationCheckNow,
    deleteInstallmentPlan,
    clearInstallmentData,
  } = useERP();

  const [activeTab, setActiveTab] = useState<string>(initialSubTab);

  // Clear Local Data Confirmation State
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearedNotice, setClearedNotice] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');

  // Automation Run Feedback
  const [isRunningAutomation, setIsRunningAutomation] = useState(false);
  const [automationReport, setAutomationReport] = useState<any | null>(null);

  // Selected Items for Modals
  const [selectedPlanForSchedule, setSelectedPlanForSchedule] = useState<InstallmentPlan | null>(null);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<InstallmentPlan | null>(null);
  const [selectedPlanForSettlement, setSelectedPlanForSettlement] = useState<InstallmentPlan | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<InstallmentPayment | null>(null);

  // -------------------------------------------------------------
  // NEW INSTALLMENT PLAN FORM STATE
  // -------------------------------------------------------------
  const [newPlanCustomer, setNewPlanCustomer] = useState('');
  const [newPlanDistributor, setNewPlanDistributor] = useState('');
  const [newPlanProduct, setNewPlanProduct] = useState('');
  const [newPlanQty, setNewPlanQty] = useState<number>(1);
  const [newPlanTotalPrice, setNewPlanTotalPrice] = useState<number>(0);
  const [newPlanDownPayment, setNewPlanDownPayment] = useState<number>(0);
  const [newPlanDuration, setNewPlanDuration] = useState<number>(12);
  const [newPlanInterestRate, setNewPlanInterestRate] = useState<number>(0);
  const [newPlanStartDate, setNewPlanStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [newPlanFirstDueDate, setNewPlanFirstDueDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [newPlanFrequency, setNewPlanFrequency] = useState<InstallmentFrequency>('Monthly');
  const [newPlanInvoiceRef, setNewPlanInvoiceRef] = useState(`INV-${Date.now().toString().slice(-4)}`);
  const [newPlanGuarantorName, setNewPlanGuarantorName] = useState('');
  const [newPlanGuarantorPhone, setNewPlanGuarantorPhone] = useState('');
  const [newPlanGuarantorNID, setNewPlanGuarantorNID] = useState('');
  const [newPlanRemarks, setNewPlanRemarks] = useState('');
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);
  const [planFormFeedback, setPlanFormFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // -------------------------------------------------------------
  // PAYMENT COLLECTION FORM STATE
  // -------------------------------------------------------------
  const [payPlanId, setPayPlanId] = useState('');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Bank Transfer');
  const [payBankName, setPayBankName] = useState('Eastern Bank PLC (Current A/C)');
  const [payTransactionRef, setPayTransactionRef] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payNotes, setPayNotes] = useState('');
  const [payType, setPayType] = useState<PaymentType>('Full Installment');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentFeedback, setPaymentFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // -------------------------------------------------------------
  // EARLY SETTLEMENT FORM STATE
  // -------------------------------------------------------------
  const [settlementRebatePct, setSettlementRebatePct] = useState<number>(5);
  const [settlementPaymentMethod, setSettlementPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [settlementBankName, setSettlementBankName] = useState('Eastern Bank PLC (Current A/C)');
  const [settlementRef, setSettlementRef] = useState('');
  const [settlementNotes, setSettlementNotes] = useState('');
  const [isSubmittingSettlement, setIsSubmittingSettlement] = useState(false);
  const [settlementFeedback, setSettlementFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auto calculate product price when product or qty changes
  const handleProductSelect = (prodId: string) => {
    setNewPlanProduct(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      const price = prod.customerPriceBDT || prod.retailPriceBDT || prod.dealerPriceBDT || 115000;
      setNewPlanTotalPrice(price * newPlanQty);
      setNewPlanDownPayment(Math.round((price * newPlanQty) * 0.25)); // Default 25% down payment
    }
  };

  const handleQtyChange = (qty: number) => {
    const validQty = Math.max(1, qty);
    setNewPlanQty(validQty);
    const prod = products.find((p) => p.id === newPlanProduct);
    if (prod) {
      const price = prod.customerPriceBDT || prod.retailPriceBDT || prod.dealerPriceBDT || 115000;
      setNewPlanTotalPrice(price * validQty);
    }
  };

  // Financed and Monthly calculations
  const calculatedFinancedAmount = Math.max(0, newPlanTotalPrice - newPlanDownPayment);
  const calculatedInterestBDT = Math.round((calculatedFinancedAmount * newPlanInterestRate) / 100);
  const calculatedTotalPayable = calculatedFinancedAmount + calculatedInterestBDT;
  const calculatedMonthlyAmount =
    newPlanDuration > 0 ? Math.round(calculatedTotalPayable / newPlanDuration) : calculatedTotalPayable;

  // Generated schedule preview for the new plan form
  const schedulePreview = useMemo(() => {
    if (calculatedFinancedAmount <= 0 || newPlanDuration <= 0) return [];
    const preview: { num: number; date: string; amount: number; principal: number; interest: number }[] = [];
    const monthlyPrincipal = Math.round(calculatedFinancedAmount / newPlanDuration);
    const monthlyInterest = calculatedInterestBDT > 0 ? Math.round(calculatedInterestBDT / newPlanDuration) : 0;
    const start = new Date(newPlanFirstDueDate);

    for (let i = 1; i <= newPlanDuration; i++) {
      const d = new Date(start);
      d.setMonth(d.getMonth() + (i - 1));
      preview.push({
        num: i,
        date: d.toISOString().slice(0, 10),
        amount: calculatedMonthlyAmount,
        principal: monthlyPrincipal,
        interest: monthlyInterest,
      });
    }
    return preview;
  }, [calculatedFinancedAmount, newPlanDuration, calculatedMonthlyAmount, newPlanFirstDueDate, calculatedInterestBDT]);

  // Handle Create Plan Submission
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanCustomer) {
      setPlanFormFeedback({ type: 'error', message: 'Please select a Customer.' });
      return;
    }
    if (!newPlanProduct) {
      setPlanFormFeedback({ type: 'error', message: 'Please select a Product.' });
      return;
    }
    if (calculatedFinancedAmount <= 0) {
      setPlanFormFeedback({ type: 'error', message: 'Financed amount must be greater than zero.' });
      return;
    }

    setIsSubmittingPlan(true);
    setPlanFormFeedback(null);

    const custObj = customers.find((c) => c.id === newPlanCustomer);
    const prodObj = products.find((p) => p.id === newPlanProduct);
    const distObj = distributors.find((d) => d.id === newPlanDistributor);

    try {
      const res = await createInstallmentPlan({
        agreementNo: '', // Auto-generated
        customerId: newPlanCustomer,
        customerName: custObj?.name || 'Customer',
        customerPhone: custObj?.phone || '+8801700000000',
        customerDistrict: custObj?.district || 'Dhaka',
        distributorId: distObj?.id,
        distributorName: distObj?.name,
        invoiceReference: newPlanInvoiceRef,
        productId: newPlanProduct,
        productName: prodObj?.name || 'Ensec Battery Pack',
        productModel: prodObj?.model || 'ET-48100',
        quantity: newPlanQty,
        totalProductPriceBDT: newPlanTotalPrice,
        downPaymentBDT: newPlanDownPayment,
        financedAmountBDT: calculatedFinancedAmount,
        durationMonths: newPlanDuration,
        interestRatePercent: newPlanInterestRate,
        totalInterestBDT: calculatedInterestBDT,
        totalPayableBDT: calculatedTotalPayable,
        monthlyInstallmentBDT: calculatedMonthlyAmount,
        startDate: newPlanStartDate,
        firstDueDate: newPlanFirstDueDate,
        paymentFrequency: newPlanFrequency,
        status: 'Active',
        totalPaidBDT: 0,
        totalOutstandingBDT: calculatedFinancedAmount,
        paidInstallmentsCount: 0,
        remainingInstallmentsCount: newPlanDuration,
        overdueInstallmentsCount: 0,
        overdueAmountBDT: 0,
        guarantorName: newPlanGuarantorName,
        guarantorPhone: newPlanGuarantorPhone,
        guarantorNID: newPlanGuarantorNID,
        remarks: newPlanRemarks,
        assignedOfficerId: currentUser.id,
        assignedOfficerName: currentUser.name,
      });

      if (res.success) {
        setPlanFormFeedback({
          type: 'success',
          message: `Installment Agreement created successfully! Financed ৳${calculatedFinancedAmount.toLocaleString()} over ${newPlanDuration} months.`,
        });
        setTimeout(() => {
          setIsSubmittingPlan(false);
          setActiveTab('installment-agreements');
        }, 1200);
      } else {
        setPlanFormFeedback({ type: 'error', message: res.error || 'Failed to create plan.' });
        setIsSubmittingPlan(false);
      }
    } catch (err: any) {
      setPlanFormFeedback({ type: 'error', message: err.message || 'Error creating agreement.' });
      setIsSubmittingPlan(false);
    }
  };

  // Handle Payment Collection Submission
  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payPlanId) {
      setPaymentFeedback({ type: 'error', message: 'Please select an installment agreement.' });
      return;
    }
    if (payAmount <= 0) {
      setPaymentFeedback({ type: 'error', message: 'Payment amount must be greater than zero.' });
      return;
    }
    if (!payTransactionRef.trim()) {
      setPaymentFeedback({ type: 'error', message: 'Please enter transaction reference or instrument number.' });
      return;
    }

    const plan = installmentPlans.find((p) => p.id === payPlanId);
    if (!plan) return;

    setIsSubmittingPayment(true);
    setPaymentFeedback(null);

    try {
      const res = await recordInstallmentPayment({
        planId: plan.id,
        agreementNo: plan.agreementNo,
        customerId: plan.customerId,
        customerName: plan.customerName,
        amountBDT: payAmount,
        paymentType: payType,
        paymentMethod: payMethod,
        bankAccountName: payBankName,
        transactionReference: payTransactionRef.trim(),
        paymentDate: payDate,
        receivedById: currentUser.id,
        receivedByName: currentUser.name,
        notes: payNotes,
      });

      if (res.success) {
        setPaymentFeedback({
          type: 'success',
          message: `Payment of ৳${payAmount.toLocaleString()} collected! Receipt #${res.receiptNo} generated and SMS confirmation dispatched.`,
        });
        const createdP = installmentPayments.find((p) => p.paymentReceiptNo === res.receiptNo);
        if (createdP) {
          setActiveReceipt(createdP);
        }
        setIsSubmittingPayment(false);
        setPayAmount(0);
        setPayTransactionRef('');
        setPayNotes('');
      } else {
        setPaymentFeedback({ type: 'error', message: res.error || 'Payment recording failed.' });
        setIsSubmittingPayment(false);
      }
    } catch (err: any) {
      setPaymentFeedback({ type: 'error', message: err.message || 'Error processing payment.' });
      setIsSubmittingPayment(false);
    }
  };

  // Handle Early Settlement Submission
  const handleEarlySettlementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForSettlement) return;
    if (!settlementRef.trim()) {
      setSettlementFeedback({ type: 'error', message: 'Please enter a settlement transaction reference.' });
      return;
    }

    setIsSubmittingSettlement(true);
    setSettlementFeedback(null);

    try {
      const res = await recordEarlySettlement(selectedPlanForSettlement.id, {
        rebatePercent: settlementRebatePct,
        paymentMethod: settlementPaymentMethod,
        bankAccountName: settlementBankName,
        transactionRef: settlementRef.trim(),
        notes: settlementNotes,
      });

      if (res.success) {
        setSettlementFeedback({
          type: 'success',
          message: `Agreement ${selectedPlanForSettlement.agreementNo} has been marked SETTLED with ${settlementRebatePct}% rebate discount!`,
        });
        setTimeout(() => {
          setIsSubmittingSettlement(false);
          setSelectedPlanForSettlement(null);
          setActiveTab('installment-agreements');
        }, 1300);
      } else {
        setSettlementFeedback({ type: 'error', message: res.error || 'Settlement failed.' });
        setIsSubmittingSettlement(false);
      }
    } catch (err: any) {
      setSettlementFeedback({ type: 'error', message: err.message || 'Error processing settlement.' });
      setIsSubmittingSettlement(false);
    }
  };

  // Run Automation Trigger
  const handleTriggerAutomation = async () => {
    setIsRunningAutomation(true);
    try {
      const report = await runAutomationCheckNow();
      setAutomationReport(report);
    } catch (err: any) {
      alert(`Automation error: ${err.message}`);
    } finally {
      setIsRunningAutomation(false);
    }
  };

  // -------------------------------------------------------------
  // DASHBOARD CALCULATIONS (Section 4)
  // -------------------------------------------------------------
  const totalInstallmentSalesBDT = useMemo(
    () => installmentPlans.reduce((sum, p) => sum + (p.totalProductPriceBDT || 0), 0),
    [installmentPlans]
  );
  const totalReceivablesBDT = useMemo(
    () => installmentPlans.reduce((sum, p) => sum + (p.financedAmountBDT || 0), 0),
    [installmentPlans]
  );
  const totalCollectedBDT = useMemo(
    () => installmentPlans.reduce((sum, p) => sum + (p.totalPaidBDT || 0), 0),
    [installmentPlans]
  );
  const totalOutstandingBDT = useMemo(
    () => installmentPlans.reduce((sum, p) => sum + (p.totalOutstandingBDT || 0), 0),
    [installmentPlans]
  );

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayDueBDT = useMemo(
    () =>
      installmentSchedules
        .filter((s) => s.dueDate === todayStr && s.status !== 'Paid')
        .reduce((sum, s) => sum + s.remainingAmountBDT, 0),
    [installmentSchedules, todayStr]
  );

  const upcomingDueBDT = useMemo(
    () =>
      installmentSchedules
        .filter((s) => s.status === 'Upcoming')
        .reduce((sum, s) => sum + s.remainingAmountBDT, 0),
    [installmentSchedules]
  );

  const overdueAmountBDT = useMemo(
    () =>
      installmentSchedules
        .filter((s) => s.status === 'Overdue')
        .reduce((sum, s) => sum + s.remainingAmountBDT, 0),
    [installmentSchedules]
  );

  const activePlansCount = useMemo(
    () => installmentPlans.filter((p) => p.status === 'Active' || p.status === 'Overdue').length,
    [installmentPlans]
  );

  // Dynamic Monthly Collection vs Due Trend (from actual schedules and payments, no test data)
  const monthlyTrendData = useMemo(() => {
    if (installmentSchedules.length === 0 && installmentPayments.length === 0) {
      return [];
    }

    const monthMap: Record<string, { month: string; due: number; collected: number; sortKey: string }> = {};

    installmentSchedules.forEach((s) => {
      if (!s.dueDate) return;
      const d = new Date(s.dueDate);
      if (isNaN(d.getTime())) return;
      const monthKey = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      const sortKey = s.dueDate.slice(0, 7);
      if (!monthMap[sortKey]) {
        monthMap[sortKey] = { month: monthKey, due: 0, collected: 0, sortKey };
      }
      monthMap[sortKey].due += s.dueAmountBDT || 0;
    });

    installmentPayments.forEach((p) => {
      const dateStr = p.paymentDate || p.createdAt;
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return;
      const monthKey = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      const sortKey = dateStr.slice(0, 7);
      if (!monthMap[sortKey]) {
        monthMap[sortKey] = { month: monthKey, due: 0, collected: 0, sortKey };
      }
      monthMap[sortKey].collected += p.amountBDT || 0;
    });

    return Object.values(monthMap)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .slice(-6);
  }, [installmentSchedules, installmentPayments]);

  // Dynamic Receivables Overdue Aging Matrix (from actual schedules and plans, no test data)
  const dynamicAgingMatrix = useMemo(() => {
    const overdueSchedules = installmentSchedules.filter(
      (s) =>
        (s.status === 'Overdue' || (s.overdueDays && s.overdueDays > 0)) &&
        ((s.remainingAmountBDT ?? (s.dueAmountBDT - (s.paidAmountBDT || 0))) > 0)
    );

    const buckets = [
      {
        bucket: '1–7 Days Overdue (Level 1: Officer)',
        minDays: 1,
        maxDays: 7,
        color: 'bg-amber-500',
        amount: 0,
        count: 0,
        customerNames: new Set<string>(),
      },
      {
        bucket: '8–15 Days Overdue (Level 2: ASM)',
        minDays: 8,
        maxDays: 15,
        color: 'bg-orange-500',
        amount: 0,
        count: 0,
        customerNames: new Set<string>(),
      },
      {
        bucket: '16–30 Days Overdue (Level 3: RM)',
        minDays: 16,
        maxDays: 30,
        color: 'bg-rose-400',
        amount: 0,
        count: 0,
        customerNames: new Set<string>(),
      },
      {
        bucket: '31+ Days Overdue (Level 4: Head Office)',
        minDays: 31,
        maxDays: Infinity,
        color: 'bg-rose-600',
        amount: 0,
        count: 0,
        customerNames: new Set<string>(),
      },
    ];

    overdueSchedules.forEach((s) => {
      const remaining = s.remainingAmountBDT ?? (s.dueAmountBDT - (s.paidAmountBDT || 0));
      const days = s.overdueDays || 0;
      const plan = installmentPlans.find((p) => p.id === s.planId);
      const customerName = plan?.customerName || 'Unknown Customer';

      for (const b of buckets) {
        if (days >= b.minDays && days <= b.maxDays) {
          b.amount += remaining;
          b.count += 1;
          b.customerNames.add(customerName);
          break;
        }
      }
    });

    return buckets.map((b) => ({
      bucket: b.bucket,
      amount: b.amount,
      count: b.count,
      customer: b.customerNames.size > 0 ? Array.from(b.customerNames).slice(0, 2).join(', ') : 'None',
      color: b.color,
    }));
  }, [installmentSchedules, installmentPlans]);

  // Filtered Agreements
  const filteredPlans = useMemo(() => {
    return installmentPlans.filter((p) => {
      const matchesSearch =
        p.agreementNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.customerPhone.includes(searchTerm);

      const matchesStatus =
        statusFilter === 'ALL' ? true : p.status.toUpperCase() === statusFilter.toUpperCase();

      const matchesDistrict =
        districtFilter === 'ALL' ? true : p.customerDistrict?.toLowerCase() === districtFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesDistrict;
    });
  }, [installmentPlans, searchTerm, statusFilter, districtFilter]);

  // Filtered Schedules
  const filteredSchedules = useMemo(() => {
    return installmentSchedules.filter((s) => {
      const plan = installmentPlans.find((p) => p.id === s.planId);
      const matchesSearch =
        s.agreementNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (plan && plan.customerName.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesTab = true;
      if (activeTab === 'installment-due') {
        matchesTab = s.status === 'Due Today' || s.dueDate === todayStr;
      } else if (activeTab === 'installment-overdue') {
        matchesTab = s.status === 'Overdue';
      }

      return matchesSearch && matchesTab;
    });
  }, [installmentSchedules, installmentPlans, searchTerm, activeTab, todayStr]);

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-sm">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Installment & Receivables Management
              </h1>
              
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleTriggerAutomation}
            disabled={isRunningAutomation}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition border border-slate-200 dark:border-slate-700"
            title="Runs daily due check, SMS trigger evaluations, and escalation checks idempotently"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunningAutomation ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isRunningAutomation ? 'Running Automation...' : 'Run Automation Check'}</span>
          </button>

          <button
            onClick={() => setActiveTab('installment-new-plan')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Installment Plan</span>
          </button>

          <button
            onClick={() => setActiveTab('installment-payment-collection')}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <DollarSign className="w-4 h-4" />
            <span>Collect Payment</span>
          </button>

          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 text-slate-600 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800 cursor-pointer"
            title="Reset and clear all test and local session memory data from Installment Management"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Clear Local Data</span>
          </button>
        </div>
      </div>

      

      {/* Cleared Notice Alert */}
      {clearedNotice && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3.5 rounded-2xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-200 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{clearedNotice}</span>
          </div>
          <button
            onClick={() => setClearedNotice(null)}
            className="p-1 text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Clear Local Data Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Clear Installment Local Data?
                </h3>
                <p className="text-[11px] text-slate-500">
                  Reset and purge all test & local session memory data
                </p>
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              This action will reset the Installment Management module to a completely clean state by purging all cached test agreements, schedules, payment vouchers, and local storage memory.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clearInstallmentData();
                  setShowClearConfirm(false);
                  setClearedNotice('All test and local session memory data have been successfully removed.');
                  setTimeout(() => setClearedNotice(null), 5000);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition cursor-pointer"
              >
                Confirm & Wipe Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Automation Report Modal (if run) */}
      {automationReport && (
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-4 rounded-2xl flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Automated Engine Execution Report ({automationReport.executionDate})</span>
            </div>
            <button
              onClick={() => setAutomationReport(null)}
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-700 dark:text-slate-300">
            <div>Plans Evaluated: <b>{automationReport.totalPlansProcessed}</b></div>
            <div>Schedules Refreshed: <b>{automationReport.schedulesUpdated}</b></div>
            <div>Overdue Found: <b>{automationReport.overdueInstallmentsFound}</b></div>
            <div>Escalations Triggered: <b>{automationReport.escalationsTriggered}</b></div>
          </div>
          <div className="mt-1 bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl text-[10px] font-mono text-slate-600 dark:text-slate-400 max-h-24 overflow-y-auto">
            {automationReport.logs.map((l: string, idx: number) => (
              <div key={idx}>{l}</div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. DASHBOARD VIEW (Section 4)                                              */}
      {/* ========================================================================= */}
      {activeTab === 'installment-dashboard' && (
        <div className="space-y-6">
          {/* Clean State Banner if empty */}
          {installmentPlans.length === 0 && (
            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    Clean Slate Active
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                    All test and local session memory data have been cleared. Ready to create live installment agreements.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('installment-new-plan')}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 text-xs shrink-0 transition cursor-pointer"
              >
                + Create Agreement
              </button>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <div className="text-[11px] font-semibold text-slate-400">Total Installment Sales</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                ৳{totalInstallmentSalesBDT.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>{installmentPlans.length} Total Plans</span>
                <span className="text-emerald-600 font-semibold">{activePlansCount} Active</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <div className="text-[11px] font-semibold text-slate-400">Total Receivables Financed</div>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                ৳{totalReceivablesBDT.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Net financed across lithium pack contracts
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <div className="text-[11px] font-semibold text-slate-400">Total Collected to Date</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                ৳{totalCollectedBDT.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {totalReceivablesBDT > 0
                    ? Math.round((totalCollectedBDT / totalReceivablesBDT) * 100)
                    : 0}%
                </span>
                <span>recovery rate</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <div className="text-[11px] font-semibold text-slate-400">Total Outstanding Balance</div>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                ৳{totalOutstandingBDT.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Active principal in installment cycle
              </div>
            </div>
          </div>

          {/* Secondary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Today's Due Amount</span>
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                ৳{todayDueBDT.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Installments maturing today ({todayStr})
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Upcoming Receivables</span>
                <Calendar className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                ৳{upcomingDueBDT.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Scheduled future installment pipeline
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 border-l-4 border-l-rose-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-500">Total Overdue Amount</span>
                <ShieldAlert className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-xl font-black text-rose-600 mt-1">
                ৳{overdueAmountBDT.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Requires follow-up</span>
                <button
                  onClick={() => setActiveTab('installment-overdue')}
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  View Overdue →
                </button>
              </div>
            </div>
          </div>

          {/* Visual Analytics / Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Collection Trend */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Monthly Collection vs Due Trend (BDT)
                  </h3>
                  <p className="text-[11px] text-slate-400">Historical recovery vs committed schedules</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> Scheduled
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Collected
                  </span>
                </div>
              </div>

              {/* Bar Visualization */}
              <div className="space-y-3 pt-2">
                {monthlyTrendData.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                    <TrendingUp className="w-7 h-7 mx-auto text-slate-300 dark:text-slate-600" />
                    <div className="font-semibold text-slate-700 dark:text-slate-300">No Monthly Collection Trend Data</div>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      All test data has been removed. Live schedules and payment collections will automatically plot here.
                    </p>
                  </div>
                ) : (
                  monthlyTrendData.map((item, idx) => {
                    const maxVal = Math.max(...monthlyTrendData.map((m) => Math.max(m.due, m.collected)), 1);
                    const duePct = Math.min(100, Math.round((item.due / maxVal) * 100));
                    const collPct = Math.min(100, Math.round((item.collected / maxVal) * 100));

                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-700 dark:text-slate-300">{item.month}</span>
                          <span className="text-slate-500 text-[11px]">
                            ৳{item.collected.toLocaleString()} / ৳{item.due.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
                          <div
                            style={{ width: `${collPct}%` }}
                            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          />
                          <div
                            style={{ width: `${Math.max(0, duePct - collPct)}%` }}
                            className="h-full bg-blue-400/50 rounded-full transition-all duration-300"
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Overdue Aging & Distribution */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Receivables Overdue Aging Matrix
                  </h3>
                  <p className="text-[11px] text-slate-400">Aging buckets by overdue duration</p>
                </div>
                <span className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
                  ৳{overdueAmountBDT.toLocaleString()} total overdue
                </span>
              </div>

              <div className="space-y-4 pt-2">
                {dynamicAgingMatrix.every((b) => b.count === 0) ? (
                  <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                    <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-500" />
                    <div className="font-semibold text-slate-700 dark:text-slate-300">No Overdue Aging Receivables</div>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      All test records have been removed and there are currently zero overdue accounts.
                    </p>
                  </div>
                ) : (
                  dynamicAgingMatrix.map((row, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${row.color}`} />
                          <span>{row.bucket}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {row.customer} ({row.count} agreement{row.count === 1 ? '' : 's'})
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-slate-900 dark:text-white">
                          ৳{row.amount.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">Overdue balance</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. NEW INSTALLMENT PLAN VIEW (Section 3)                                    */}
      {/* ========================================================================= */}
      {activeTab === 'installment-new-plan' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Create New Installment Agreement
              </h2>
              <p className="text-xs text-slate-500">
                Setup flexible financing contracts with auto-generated amortization schedule.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('installment-agreements')}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1"
            >
              Cancel
            </button>
          </div>

          {planFormFeedback && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold mb-6 flex items-center gap-2 ${
                planFormFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
              }`}
            >
              {planFormFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{planFormFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handleCreatePlan} className="space-y-6">
            {/* Step 1: Parties and Invoicing */}
            <div>
              <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">
                1. Customer & Reference Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Customer / Client *
                  </label>
                  <select
                    value={newPlanCustomer}
                    onChange={(e) => setNewPlanCustomer(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">-- Select Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone || c.district || 'BD'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Distributor Channel (Optional)
                  </label>
                  <select
                    value={newPlanDistributor}
                    onChange={(e) => setNewPlanDistributor(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Direct Sales / None --</option>
                    {distributors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.district})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Invoice Reference
                  </label>
                  <input
                    type="text"
                    value={newPlanInvoiceRef}
                    onChange={(e) => setNewPlanInvoiceRef(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="e.g. INV-2026-081"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Product & Pricing */}
            <div>
              <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">
                2. Product Selection & Commercial Terms
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Product Selection *
                  </label>
                  <select
                    value={newPlanProduct}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  >
                    <option value="">-- Select Ensec Lithium Battery Product --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - ৳{(p.customerPriceBDT || p.retailPriceBDT || 115000).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newPlanQty}
                    onChange={(e) => handleQtyChange(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Total Product Price (BDT)
                  </label>
                  <input
                    type="number"
                    value={newPlanTotalPrice}
                    onChange={(e) => setNewPlanTotalPrice(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Down Payment (BDT)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newPlanDownPayment}
                    onChange={(e) => setNewPlanDownPayment(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Financed Amount (BDT)
                  </label>
                  <div className="text-xs p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black">
                    ৳{calculatedFinancedAmount.toLocaleString()}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Duration (Months)
                  </label>
                  <select
                    value={newPlanDuration}
                    onChange={(e) => setNewPlanDuration(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value={12}>12 Months (1 Year)</option>
                    <option value={24}>24 Months (2 Years)</option>
                    <option value={36}>36 Months (3 Years)</option>
                    <option value={48}>48 Months (4 Years)</option>
                    <option value={60}>60 Months (5 Years)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Interest / Margin % (0 for Flat)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={newPlanInterestRate}
                    onChange={(e) => setNewPlanInterestRate(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Monthly Installment KPI Result */}
              <div className="mt-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                    Calculated Monthly Installment Amount
                  </span>
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
                    ৳{calculatedMonthlyAmount.toLocaleString()} / month
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <div>Duration: <b>{newPlanDuration} months</b></div>
                  <div>Financed Principal: <b>৳{calculatedFinancedAmount.toLocaleString()}</b></div>
                </div>
              </div>
            </div>

            {/* Step 3: Dates & Frequencies */}
            <div>
              <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">
                3. Schedule Timings & Guarantor Info
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Agreement Start Date
                  </label>
                  <input
                    type="date"
                    value={newPlanStartDate}
                    onChange={(e) => setNewPlanStartDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    First Due Date *
                  </label>
                  <input
                    type="date"
                    value={newPlanFirstDueDate}
                    onChange={(e) => setNewPlanFirstDueDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Payment Frequency
                  </label>
                  <select
                    value={newPlanFrequency}
                    onChange={(e) => setNewPlanFrequency(e.target.value as InstallmentFrequency)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Bi-weekly">Bi-weekly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Guarantor Full Name
                  </label>
                  <input
                    type="text"
                    value={newPlanGuarantorName}
                    onChange={(e) => setNewPlanGuarantorName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="e.g. Alhaj Nurul Islam"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Guarantor Mobile Phone
                  </label>
                  <input
                    type="text"
                    value={newPlanGuarantorPhone}
                    onChange={(e) => setNewPlanGuarantorPhone(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="01XXXXXXXXX"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Guarantor National ID
                  </label>
                  <input
                    type="text"
                    value={newPlanGuarantorNID}
                    onChange={(e) => setNewPlanGuarantorNID(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="10 or 17 digit NID"
                  />
                </div>
              </div>
            </div>

            {/* Live Amortization Schedule Preview */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Amortization Schedule Preview ({schedulePreview.length} Installments)
                </h3>
                <span className="text-[11px] text-slate-400">
                  Auto-calculated individual due dates
                </span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800 sticky top-0">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Due Date</th>
                      <th className="p-2.5">Installment Amount</th>
                      <th className="p-2.5">Principal</th>
                      <th className="p-2.5">Interest</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {schedulePreview.map((s) => (
                      <tr key={s.num} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-2.5 font-bold text-slate-400">#{s.num}</td>
                        <td className="p-2.5 font-medium text-slate-900 dark:text-white">{s.date}</td>
                        <td className="p-2.5 font-bold text-blue-600 dark:text-blue-400">
                          ৳{s.amount.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-300">
                          ৳{s.principal.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-slate-400">৳{s.interest.toLocaleString()}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            Upcoming
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('installment-agreements')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingPlan}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-md transition disabled:opacity-50"
              >
                {isSubmittingPlan ? 'Saving Agreement...' : 'Confirm & Activate Installment Plan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. AGREEMENTS LIST VIEW                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'installment-agreements' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Active Installment Agreements Directory
              </h2>
              <p className="text-[11px] text-slate-500">
                All registered customer financing contracts with live status tracking.
              </p>
            </div>

            {/* Search & Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search agreements, customers, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white w-60"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="OVERDUE">Overdue</option>
                <option value="SETTLED">Settled</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Agreement No</th>
                  <th className="p-3">Customer & Channel</th>
                  <th className="p-3">Product / Qty</th>
                  <th className="p-3">Financed (BDT)</th>
                  <th className="p-3">Paid / Remaining</th>
                  <th className="p-3">Installments</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPlans.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center">
                      <div className="max-w-sm mx-auto space-y-2 py-6 text-xs">
                        <CreditCard className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                        <div className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                          No Installment Agreements
                        </div>
                        <p className="text-slate-400 text-xs">
                          {searchTerm || statusFilter !== 'ALL' || districtFilter !== 'ALL'
                            ? 'No agreements matched your search or active filters.'
                            : 'All test and session memory data have been removed. Ready to create your first live agreement.'}
                        </p>
                        {!searchTerm && statusFilter === 'ALL' && districtFilter === 'ALL' && (
                          <div className="pt-2">
                            <button
                              onClick={() => setActiveTab('installment-new-plan')}
                              className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition cursor-pointer"
                            >
                              + Create New Agreement
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPlans.map((plan) => {
                    const progressPct =
                      plan.totalProductPriceBDT > 0
                        ? Math.min(100, Math.round((plan.totalPaidBDT / plan.totalProductPriceBDT) * 100))
                        : 0;

                    return (
                      <tr key={plan.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-3">
                          <span className="font-bold text-slate-900 dark:text-white font-mono">
                            {plan.agreementNo}
                          </span>
                          <div className="text-[10px] text-slate-400">{plan.startDate}</div>
                        </td>

                        <td className="p-3">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {plan.customerName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {plan.customerPhone} • {plan.customerDistrict}
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="text-slate-900 dark:text-white truncate max-w-xs">
                            {plan.productName}
                          </div>
                          <div className="text-[10px] text-slate-400">Qty: {plan.quantity} units</div>
                        </td>

                        <td className="p-3">
                          <span className="font-bold text-slate-900 dark:text-white">
                            ৳{plan.financedAmountBDT.toLocaleString()}
                          </span>
                          <div className="text-[10px] text-slate-400">
                            DP: ৳{plan.downPaymentBDT.toLocaleString()}
                          </div>
                        </td>

                        <td className="p-3 min-w-[130px]">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="text-emerald-600 font-bold">
                              ৳{plan.totalPaidBDT.toLocaleString()}
                            </span>
                            <span className="text-rose-500 font-bold">
                              ৳{plan.totalOutstandingBDT.toLocaleString()}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${progressPct}%` }}
                              className="h-full bg-emerald-500 rounded-full"
                            />
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="font-medium text-slate-700 dark:text-slate-300">
                            {plan.paidInstallmentsCount} of {plan.durationMonths}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            ৳{plan.monthlyInstallmentBDT.toLocaleString()} / mo
                          </div>
                        </td>

                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              plan.status === 'Active'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300'
                                : plan.status === 'Overdue'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300'
                                : plan.status === 'Settled'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {plan.status}
                          </span>
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedPlanForSchedule(plan)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="View Schedule"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                            </button>

                            {plan.status !== 'Settled' && (
                              <button
                                onClick={() => {
                                  setPayPlanId(plan.id);
                                  setPayAmount(plan.monthlyInstallmentBDT);
                                  setActiveTab('installment-payment-collection');
                                }}
                                className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 text-[11px] font-semibold"
                                title="Collect Payment"
                              >
                                Collect
                              </button>
                            )}

                            {plan.status !== 'Settled' && (
                              <button
                                onClick={() => setSelectedPlanForSettlement(plan)}
                                className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 text-[11px] font-semibold"
                                title="Early Settlement"
                              >
                                Settle
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MASTER SCHEDULE VIEW (Section 3 & 4)                                     */}
      {/* ========================================================================= */}
      {(activeTab === 'installment-schedule' ||
        activeTab === 'installment-due' ||
        activeTab === 'installment-overdue') && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {activeTab === 'installment-due'
                  ? "Today's & Upcoming Due Installments"
                  : activeTab === 'installment-overdue'
                  ? 'Overdue Installments & Collection Notices'
                  : 'Master Installment Repayment Schedule'}
              </h2>
              <p className="text-[11px] text-slate-500">
                Detailed schedule ledger with individual installment due dates, overdue counts, and status.
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search schedule records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white w-60"
              />
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Schedule ID</th>
                  <th className="p-3">Agreement No</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Inst. #</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3">Due Amount</th>
                  <th className="p-3">Remaining</th>
                  <th className="p-3">Overdue Days</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      <div className="max-w-sm mx-auto space-y-1.5 py-4">
                        <Calendar className="w-7 h-7 mx-auto text-slate-300 dark:text-slate-600" />
                        <div className="font-semibold text-slate-700 dark:text-slate-300 text-xs">No Scheduled Installments Found</div>
                        <p className="text-[11px] text-slate-400">
                          {searchTerm ? 'No schedules matched your search.' : 'Installment schedules are generated automatically when a new plan is confirmed.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSchedules.map((sch) => {
                    const plan = installmentPlans.find((p) => p.id === sch.planId);
                    return (
                      <tr key={sch.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono text-[11px] text-slate-500">{sch.id}</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white font-mono">
                          {sch.agreementNo}
                        </td>
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                          {plan?.customerName || 'Customer'}
                        </td>
                        <td className="p-3 font-bold text-slate-400">#{sch.installmentNumber}</td>
                        <td className="p-3 font-medium text-slate-900 dark:text-white">{sch.dueDate}</td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">
                          ৳{sch.dueAmountBDT.toLocaleString()}
                        </td>
                        <td className="p-3 font-bold text-blue-600 dark:text-blue-400">
                          ৳{sch.remainingAmountBDT.toLocaleString()}
                        </td>
                        <td className="p-3">
                          {sch.overdueDays > 0 ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300">
                              {sch.overdueDays} days
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">0</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              sch.status === 'Paid'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                                : sch.status === 'Due Today'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300'
                                : sch.status === 'Overdue'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {sch.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {sch.status !== 'Paid' && (
                            <button
                              onClick={() => {
                                setPayPlanId(sch.planId);
                                setPayAmount(sch.remainingAmountBDT);
                                setActiveTab('installment-payment-collection');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-xs"
                            >
                              Pay Now
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. CUSTOMER-WISE INSTALLMENTS VIEW                                          */}
      {/* ========================================================================= */}
      {activeTab === 'installment-customers' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Customer-wise Installment Receivables Ledger
            </h2>
            <p className="text-[11px] text-slate-500">
              Aggregated exposure, agreements count, total paid and current outstanding per customer.
            </p>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">District</th>
                  <th className="p-3">Total Plans</th>
                  <th className="p-3">Financed Amount</th>
                  <th className="p-3">Total Paid</th>
                  <th className="p-3">Total Outstanding</th>
                  <th className="p-3">Overdue Balance</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {customers.map((cust) => {
                  const custPlans = installmentPlans.filter((p) => p.customerId === cust.id);
                  if (custPlans.length === 0) return null;

                  const totalFinanced = custPlans.reduce((s, p) => s + p.financedAmountBDT, 0);
                  const totalPaid = custPlans.reduce((s, p) => s + p.totalPaidBDT, 0);
                  const totalOut = custPlans.reduce((s, p) => s + p.totalOutstandingBDT, 0);
                  const totalOverdue = custPlans.reduce((s, p) => s + p.overdueAmountBDT, 0);

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white">{cust.name}</div>
                        <div className="text-[10px] text-slate-400">{cust.phone}</div>
                      </td>
                      <td className="p-3 text-slate-500">{cust.district || 'Dhaka'}</td>
                      <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                        {custPlans.length} contracts
                      </td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        ৳{totalFinanced.toLocaleString()}
                      </td>
                      <td className="p-3 font-bold text-emerald-600">
                        ৳{totalPaid.toLocaleString()}
                      </td>
                      <td className="p-3 font-bold text-blue-600 dark:text-blue-400">
                        ৳{totalOut.toLocaleString()}
                      </td>
                      <td className="p-3 font-bold text-rose-600">
                        ৳{totalOverdue.toLocaleString()}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setSearchTerm(cust.name);
                            setActiveTab('installment-agreements');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 text-[11px] font-semibold hover:bg-blue-100"
                        >
                          View Contracts
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. PAYMENT COLLECTION VIEW (Section 5)                                     */}
      {/* ========================================================================= */}
      {activeTab === 'installment-payment-collection' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Form */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Record Installment Payment Collection
              </h2>
              <p className="text-xs text-slate-500">
                Accepts Full, Partial, Advance or Multi-installment payments with automated FIFO schedule allocation.
              </p>
            </div>

            {paymentFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  paymentFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                }`}
              >
                {paymentFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{paymentFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleCollectPayment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Select Agreement / Customer *
                  </label>
                  <select
                    value={payPlanId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setPayPlanId(id);
                      const p = installmentPlans.find((plan) => plan.id === id);
                      if (p) {
                        setPayAmount(p.monthlyInstallmentBDT);
                      }
                    }}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    required
                  >
                    <option value="">-- Choose Agreement --</option>
                    {installmentPlans
                      .filter((p) => p.status !== 'Settled')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.agreementNo} - {p.customerName} (Out: ৳{p.totalOutstandingBDT.toLocaleString()} • Monthly: ৳{p.monthlyInstallmentBDT.toLocaleString()})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Payment Type
                  </label>
                  <select
                    value={payType}
                    onChange={(e) => setPayType(e.target.value as PaymentType)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Full Installment">Full Installment</option>
                    <option value="Partial">Partial Payment</option>
                    <option value="Advance">Advance Payment</option>
                    <option value="Multiple Installments">Multiple Installments</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Collection Amount (BDT) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black text-emerald-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Bank Transfer">Bank Transfer (EBL / City Bank)</option>
                    <option value="Cash">Cash in Hand / Depot Cash</option>
                    <option value="Cheque">Bank Cheque</option>
                    <option value="bKash">bKash Merchant</option>
                    <option value="Nagad">Nagad Merchant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Deposit Bank Account / Cash Ledger
                  </label>
                  <select
                    value={payBankName}
                    onChange={(e) => setPayBankName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Eastern Bank PLC (Current A/C)">Eastern Bank PLC (Current A/C)</option>
                    <option value="City Bank PLC">City Bank PLC</option>
                    <option value="Dhaka Factory Petty Cash">Dhaka Factory Petty Cash</option>
                    <option value="bKash Merchant Wallet">bKash Merchant Wallet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Transaction Reference / Cheque No *
                  </label>
                  <input
                    type="text"
                    value={payTransactionRef}
                    onChange={(e) => setPayTransactionRef(e.target.value)}
                    placeholder="e.g. EBL-TRX-10941 or CHQ-7782"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Collection Date
                  </label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Notes / Remarks
                  </label>
                  <input
                    type="text"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="Optional notes regarding this deposit"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>{isSubmittingPayment ? 'Recording Collection...' : 'Confirm Payment & Print Receipt'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* FIFO Allocation & Selected Plan Info */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Selected Agreement Summary
            </h3>

            {(() => {
              const plan = installmentPlans.find((p) => p.id === payPlanId);
              if (!plan) {
                return (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Please select an agreement from the form to view real-time balance and unpaid schedules.
                  </div>
                );
              }

              const planSchedules = installmentSchedules.filter((s) => s.planId === plan.id);
              const unpaid = planSchedules.filter((s) => s.status !== 'Paid');

              return (
                <div className="space-y-4 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Customer:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{plan.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Agreement No:</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {plan.agreementNo}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Outstanding:</span>
                      <span className="font-bold text-rose-500">
                        ৳{plan.totalOutstandingBDT.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Overdue Installments:</span>
                      <span className="font-bold text-amber-600">
                        {plan.overdueInstallmentsCount} (৳{plan.overdueAmountBDT.toLocaleString()})
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Pending Installments to be Cleared (FIFO)
                    </h4>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {unpaid.map((s) => (
                        <div
                          key={s.id}
                          className="p-2 rounded-lg bg-slate-100/60 dark:bg-slate-800/40 flex items-center justify-between text-[11px]"
                        >
                          <div>
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              #{s.installmentNumber} • Due {s.dueDate}
                            </span>
                            <div className="text-[10px] text-slate-400">
                              Remaining: ৳{s.remainingAmountBDT.toLocaleString()}
                            </div>
                          </div>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              s.status === 'Overdue'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {s.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. PAYMENT HISTORY VIEW                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'installment-payment-history' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Installment Payment Collection History & Receipts
              </h2>
              <p className="text-[11px] text-slate-500">
                Official collection receipts with audit details and printable vouchers.
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search receipts, references..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white w-60"
              />
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Receipt No</th>
                  <th className="p-3">Payment Date</th>
                  <th className="p-3">Agreement No</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Amount (BDT)</th>
                  <th className="p-3">Method & Account</th>
                  <th className="p-3">Reference</th>
                  <th className="p-3">Received By</th>
                  <th className="p-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {installmentPayments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      <div className="max-w-sm mx-auto space-y-1.5 py-4">
                        <Receipt className="w-7 h-7 mx-auto text-slate-300 dark:text-slate-600" />
                        <div className="font-semibold text-slate-700 dark:text-slate-300 text-xs">No Payment Vouchers Found</div>
                        <p className="text-[11px] text-slate-400">
                          Payments recorded via Payment Collection will generate official voucher receipts here.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  installmentPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {p.paymentReceiptNo}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{p.paymentDate}</td>
                      <td className="p-3 font-mono text-slate-900 dark:text-white">{p.agreementNo}</td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">
                        {p.customerName}
                      </td>
                      <td className="p-3 font-bold text-emerald-600">
                        ৳{p.amountBDT.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <div className="text-slate-800 dark:text-slate-200">{p.paymentMethod}</div>
                        <div className="text-[10px] text-slate-400">{p.bankAccountName || 'Cash'}</div>
                      </td>
                      <td className="p-3 font-mono text-slate-500">{p.transactionReference}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{p.receivedByName}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setActiveReceipt(p)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 text-[11px] font-semibold hover:bg-blue-100 flex items-center gap-1 ml-auto"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Print</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. EARLY SETTLEMENT VIEW                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'installment-early-settlement' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Early Installment Settlement & Rebate Calculator
            </h2>
            <p className="text-xs text-slate-500">
              Calculate loan payoff discounts, rebate waivers, and issue final clearance certificates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Select Agreement for Early Settlement
              </label>
              <select
                value={selectedPlanForSettlement?.id || ''}
                onChange={(e) => {
                  const p = installmentPlans.find((plan) => plan.id === e.target.value);
                  setSelectedPlanForSettlement(p || null);
                }}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              >
                <option value="">-- Choose Agreement --</option>
                {installmentPlans
                  .filter((p) => p.status !== 'Settled')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.agreementNo} - {p.customerName} (Out: ৳{p.totalOutstandingBDT.toLocaleString()})
                    </option>
                  ))}
              </select>

              {selectedPlanForSettlement && (
                <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Customer:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {selectedPlanForSettlement.customerName}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Total Financed:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      ৳{selectedPlanForSettlement.financedAmountBDT.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Total Paid to Date:</span>
                    <span className="font-bold text-emerald-600">
                      ৳{selectedPlanForSettlement.totalPaidBDT.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Remaining Balance:</span>
                    <span className="font-bold text-rose-500">
                      ৳{selectedPlanForSettlement.totalOutstandingBDT.toLocaleString()}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Settlement Rebate / Waiver %
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={settlementRebatePct}
                      onChange={(e) => setSettlementRebatePct(Number(e.target.value))}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Payoff Calculation Box */}
            <div>
              {selectedPlanForSettlement ? (
                (() => {
                  const planSchedules = installmentSchedules.filter((s) => s.planId === selectedPlanForSettlement.id);
                  const calc = calculateEarlySettlement(selectedPlanForSettlement, planSchedules, settlementRebatePct);

                  return (
                    <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-4">
                      <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs uppercase tracking-wider">
                        <Zap className="w-4 h-4" />
                        <span>Settlement Breakdown</span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-300">Unpaid Schedule Total:</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            ৳{calc.totalRemainingScheduleBDT.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-emerald-600 font-semibold">
                          <span>Rebate Waiver ({calc.rebatePercentage}%):</span>
                          <span>-৳{calc.rebateAmountBDT.toLocaleString()}</span>
                        </div>
                        <div className="pt-2 border-t border-indigo-200 dark:border-indigo-800 flex justify-between text-base font-black text-indigo-700 dark:text-indigo-300">
                          <span>Net Settlement Payable:</span>
                          <span>৳{calc.settlementNetPayableBDT.toLocaleString()}</span>
                        </div>
                      </div>

                      <form onSubmit={handleEarlySettlementSubmit} className="space-y-3 pt-2">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Deposit Method & Account
                          </label>
                          <select
                            value={settlementBankName}
                            onChange={(e) => setSettlementBankName(e.target.value)}
                            className="w-full text-xs p-2 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          >
                            <option value="Eastern Bank PLC (Current A/C)">Eastern Bank PLC (Current A/C)</option>
                            <option value="City Bank PLC">City Bank PLC</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Bank Deposit Reference *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. SETTLE-EBL-99120"
                            value={settlementRef}
                            onChange={(e) => setSettlementRef(e.target.value)}
                            className="w-full text-xs p-2 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmittingSettlement}
                          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                        >
                          {isSubmittingSettlement ? 'Settling...' : 'Execute Early Settlement & Clear Contract'}
                        </button>
                      </form>
                    </div>
                  );
                })()
              ) : (
                <div className="h-full flex items-center justify-center p-8 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl text-slate-400 text-xs text-center">
                  Select an active agreement to calculate payoff rebate and net settlement.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW SPECIFIC PLAN'S AMORTIZATION SCHEDULE                          */}
      {/* ========================================================================= */}
      {selectedPlanForSchedule && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          <div
            onClick={() => setSelectedPlanForSchedule(null)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Schedule Details: {selectedPlanForSchedule.agreementNo}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {selectedPlanForSchedule.customerName} • {selectedPlanForSchedule.productName}
                </p>
              </div>
              <button
                onClick={() => setSelectedPlanForSchedule(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Due Date</th>
                    <th className="p-2.5">Due (BDT)</th>
                    <th className="p-2.5">Paid (BDT)</th>
                    <th className="p-2.5">Remaining</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {installmentSchedules
                    .filter((s) => s.planId === selectedPlanForSchedule.id)
                    .map((s) => (
                      <tr key={s.id}>
                        <td className="p-2.5 font-bold text-slate-400">#{s.installmentNumber}</td>
                        <td className="p-2.5 font-medium text-slate-900 dark:text-white">{s.dueDate}</td>
                        <td className="p-2.5 text-slate-700 dark:text-slate-300">
                          ৳{s.dueAmountBDT.toLocaleString()}
                        </td>
                        <td className="p-2.5 font-semibold text-emerald-600">
                          ৳{s.paidAmountBDT.toLocaleString()}
                        </td>
                        <td className="p-2.5 font-bold text-blue-600 dark:text-blue-400">
                          ৳{s.remainingAmountBDT.toLocaleString()}
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              s.status === 'Paid'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : s.status === 'Overdue'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-end">
              <button
                onClick={() => setSelectedPlanForSchedule(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PRINTABLE OFFICIAL PAYMENT RECEIPT VOUCHER                         */}
      {/* ========================================================================= */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          <div
            onClick={() => setActiveReceipt(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Payment Collection Voucher
                </h3>
              </div>
              <button
                onClick={() => setActiveReceipt(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Content */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
              <div className="text-center pb-2 border-b border-slate-200 dark:border-slate-700">
                <div className="text-base font-black tracking-tight text-blue-600 dark:text-blue-400">
                  ENSEC LITHIUM BATTERIES BANGLADESH
                </div>
                <div className="text-[10px] text-slate-400">
                  Official Installment Money Receipt Voucher
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400">Receipt No:</span>
                  <div className="font-mono font-bold text-slate-900 dark:text-white">
                    {activeReceipt.paymentReceiptNo}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Date:</span>
                  <div className="font-medium text-slate-900 dark:text-white">
                    {activeReceipt.paymentDate}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400">Customer:</span>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {activeReceipt.customerName}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Agreement:</span>
                  <div className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {activeReceipt.agreementNo}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400">Payment Method:</span>
                  <div className="font-medium text-slate-900 dark:text-white">
                    {activeReceipt.paymentMethod}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Reference / Trx:</span>
                  <div className="font-mono text-slate-900 dark:text-white">
                    {activeReceipt.transactionReference}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-center">
                <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">
                  Amount Received
                </span>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  ৳{activeReceipt.amountBDT.toLocaleString()} BDT
                </div>
              </div>

              {activeReceipt.allocations && activeReceipt.allocations.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    FIFO Installment Allocations:
                  </span>
                  <div className="mt-1 space-y-1">
                    {activeReceipt.allocations.map((a, i) => (
                      <div key={i} className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300">
                        <span>Installment #{a.installmentNumber}</span>
                        <span className="font-semibold">
                          ৳{a.allocatedAmountBDT.toLocaleString()} {a.isFullyCleared ? '(Cleared)' : '(Partial)'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 text-[10px] text-slate-400 flex justify-between border-t border-slate-200 dark:border-slate-700">
                <span>Received By: {activeReceipt.receivedByName}</span>
                <span>System Verified: YES</span>
              </div>
            </div>

            {/* Print button */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt Voucher</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
