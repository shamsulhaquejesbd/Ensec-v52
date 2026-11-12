import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Package,
  BatteryCharging,
  DollarSign,
  Users,
  ShieldCheck,
  AlertCircle,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Clock,
  BarChart3,
  Factory,
  Building2,
  Warehouse as WarehouseIcon,
  Search,
  Filter,
  Download,
  Calendar,
  Layers,
  Boxes,
  FileText,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Wallet,
  Landmark,
  Receipt,
  ExternalLink,
  ChevronDown,
  ShoppingBag,
  Ship,
  Sparkles,
  Zap,
  Printer,
  Trash2
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { useCashBank } from '../../context/CashBankContext.tsx';
import { SalesOrder, ProductionOrder, Warehouse, Product, Distributor, Customer } from '../../types/erp.ts';

export interface ExecutiveDashboardProps {
  onNavigate?: (module: string) => void;
}

type DateRangeFilter = 'all' | 'today' | 'month' | 'quarter' | 'ytd';
type ActivityFilter = 'all' | 'sales' | 'production' | 'payment' | 'inventory' | 'warranty';

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ onNavigate }) => {
  const {
    products,
    warehouses,
    fieldForceReps,
    salesOrders,
    requisitions,
    warrantyTickets,
    productionOrders,
    auditLogs,
    distributors,
    customers,
    rawMaterials,
    inventoryBatches,
    stockTransfers,
    importOrders,
    payments,
    installmentPlans,
    installmentSchedules,
    suppliers,
    expenseEntries,
    currentUser,
    formatCurrency,
    clearDashboardSessionData,
  } = useERP();
  const { kpis: cashBankKpis, accounts: cashBankAccounts } = useCashBank();

  // Filter States
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>('all');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedDistributorId, setSelectedDistributorId] = useState<string>('all');
  const [kpiTab, setKpiTab] = useState<'sales' | 'inventory' | 'production' | 'finance' | 'distribution'>('sales');
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [chartTooltip, setChartTooltip] = useState<{ x: number; y: number; title: string; value: string; sub?: string } | null>(null);

  // Quick live refresh simulator
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Helper date parsing (dynamic real date parsing)
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const currentMonthStr = todayStr.slice(0, 7);
  const currentYearStr = todayStr.slice(0, 4);
  const currentMonthName = now.toLocaleString('en-US', { month: 'short' });
  const currentMonthLong = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Categories list
  const productCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filtered Sales Orders according to selected filters
  const filteredSalesOrders = useMemo(() => {
    return salesOrders.filter((order) => {
      // Date filter
      if (dateFilter === 'today' && order.date !== todayStr) return false;
      if (dateFilter === 'month' && !order.date?.startsWith(currentMonthStr)) return false;
      if (dateFilter === 'quarter') {
        const orderDate = new Date(order.date || '');
        if (isNaN(orderDate.getTime())) return false;
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const orderQuarter = Math.floor(orderDate.getMonth() / 3);
        if (orderDate.getFullYear() !== now.getFullYear() || orderQuarter !== currentQuarter) return false;
      }
      if (dateFilter === 'ytd' && !order.date?.startsWith(currentYearStr)) return false;

      // Warehouse filter
      if (selectedWarehouseId !== 'all' && order.warehouseId !== selectedWarehouseId) {
        return false;
      }

      // Distributor filter
      if (selectedDistributorId !== 'all' && order.distributorId !== selectedDistributorId) {
        return false;
      }

      // Category filter (check if order contains items in category)
      if (selectedCategoryId !== 'all' && order.items && order.items.length > 0) {
        const hasCat = order.items.some((item) => {
          const prod = products.find((p) => p.id === item.productId || p.code === item.productId);
          return prod?.category === selectedCategoryId;
        });
        if (!hasCat) return false;
      }

      return true;
    });
  }, [salesOrders, dateFilter, selectedWarehouseId, selectedDistributorId, selectedCategoryId, products]);

  // ============================================================================
  // 1. TOP LEVEL KPI CALCULATIONS (Domain-specific & Real Data Driven)
  // ============================================================================

  // Sales & Revenue
  const salesMetrics = useMemo(() => {
    let totalSales = 0;
    let todaySales = 0;
    let monthSales = 0;
    let ytdSales = 0;
    let totalOutstanding = 0;
    let totalCollection = 0;
    let pendingOrdersCount = 0;

    filteredSalesOrders.forEach((so) => {
      const net = Number(so.netAmountBDT || so.subTotalBDT || 0);
      const paid = Number(so.paidAmountBDT || 0);
      const due = Number(so.dueAmountBDT !== undefined ? so.dueAmountBDT : Math.max(0, net - paid));

      totalSales += net;
      totalCollection += paid;
      totalOutstanding += due;

      if (so.date === todayStr) todaySales += net;
      if (so.date?.startsWith(currentMonthStr)) monthSales += net;
      if (so.date?.startsWith(currentYearStr)) ytdSales += net;

      if (['Booked', 'Submitted', 'Pending Delivery'].includes(so.status)) {
        pendingOrdersCount++;
      }
    });

    // Also factor in global distributor outstanding if not specifically filtered
    const distributorTotalOutstanding = distributors.reduce(
      (acc, d) => acc + (Number(d.currentOutstandingBDT) || 0),
      0
    );

    return {
      totalSales,
      todaySales,
      monthSales,
      ytdSales,
      totalOutstanding: totalOutstanding > 0 ? totalOutstanding : distributorTotalOutstanding,
      totalCollection,
      pendingOrdersCount,
      collectionRate: totalSales > 0 ? Math.round((totalCollection / totalSales) * 100) : 0,
    };
  }, [filteredSalesOrders, distributors]);

  // Inventory & Warehouse
  const inventoryMetrics = useMemo(() => {
    const totalFinishedGoodsStock = warehouses.reduce(
      (acc, w) => acc + (Number(w.currentStockUnits) || Number(w.currentStockPacks) || 0),
      0
    );

    const totalRawMaterialStock = rawMaterials.reduce(
      (acc, rm) => acc + (Number(rm.stockKushtia) || 0),
      0
    );

    const batchesStock = inventoryBatches.reduce(
      (acc, b) => acc + (Number(b.availableQty) || 0),
      0
    );

    // Stock value estimation
    let finishedGoodsValue = 0;
    products.forEach((p) => {
      const unitVal = Number(p.distributorPriceBDT || p.tradePriceBDT || p.mrpBDT || 0);
      const stock = Number(p.stockCID || 0) + Number(p.stockKushtiaPlant || 0) + Number(p.stockDhakaHubs || 0);
      finishedGoodsValue += unitVal * (stock > 0 ? stock : 0);
    });

    let rawMaterialValue = 0;
    inventoryBatches.forEach((b) => {
      rawMaterialValue += Number(b.availableQty || 0) * Number(b.unitPurchaseRate || 0);
    });
    if (rawMaterialValue === 0) {
      rawMaterials.forEach((rm) => {
        rawMaterialValue += Number(rm.stockKushtia || 0) * Number(rm.standardCostBDT || rm.lastPurchaseUnitCostBDT || 0);
      });
    }

    const totalStockValuation = finishedGoodsValue + rawMaterialValue;

    // Low stock items
    const lowStockProducts = products.filter(
      (p) => (Number(p.stockCID || 0) + Number(p.stockKushtiaPlant || 0) + Number(p.stockDhakaHubs || 0)) <= 10
    ).length;

    const lowStockRawMaterials = rawMaterials.filter(
      (rm) => (Number(rm.stockKushtia) || 0) <= (Number(rm.minimumStock) || Number(rm.reorderLevel) || 50)
    ).length;

    const pendingStockTransfers = stockTransfers.filter(
      (st) => st.status === 'Pending' || st.status === 'In Transit'
    ).length;

    return {
      totalFinishedGoodsStock,
      totalRawMaterialStock: totalRawMaterialStock + batchesStock,
      totalStockValuation,
      lowStockCount: lowStockProducts + lowStockRawMaterials,
      pendingStockTransfers,
      activeWarehouseCount: warehouses.filter((w) => w.status === 'Active' || !w.status).length,
    };
  }, [warehouses, rawMaterials, inventoryBatches, products, stockTransfers]);

  // Production & Manufacturing
  const productionMetrics = useMemo(() => {
    let totalPlanned = 0;
    let totalCompleted = 0;
    let todayProduction = 0;
    let monthlyProduction = 0;
    let inProgressCount = 0;
    let pendingCount = 0;

    productionOrders.forEach((po) => {
      const planned = Number(po.plannedQty || 0);
      const completed = Number(po.completedQty || 0);
      totalPlanned += planned;
      totalCompleted += completed;

      const orderDate = po.date || po.manufacturingDate || po.startDate;
      if (orderDate === todayStr) todayProduction += completed;
      if (orderDate?.startsWith(currentMonthStr)) monthlyProduction += completed;

      if (['In Assembly', 'In Production', 'Testing & QC'].includes(po.status || '')) {
        inProgressCount++;
      } else if (po.status === 'Planned' || !po.status) {
        pendingCount++;
      }
    });

    const completionRate = totalPlanned > 0 ? Math.min(100, Math.round((totalCompleted / totalPlanned) * 100)) : 0;

    return {
      totalProduction: totalCompleted,
      todayProduction,
      monthlyProduction,
      pendingCount,
      inProgressCount,
      completionRate,
      activeOrdersCount: productionOrders.length,
    };
  }, [productionOrders]);

  // Financial Overview
  const financialMetrics = useMemo(() => {
    const cashBalance = cashBankKpis?.currentCashBalance ?? 0;
    const bankBalance = cashBankKpis?.currentBankBalance ?? 0;
    const combinedLiquid = cashBalance + bankBalance;

    // Receivables
    const accountsReceivable = salesMetrics.totalOutstanding;

    // Accounts Payable: Suppliers balance + import PO commitments
    let accountsPayable = 0;
    importOrders.forEach((io) => {
      if (io.status !== 'Delivered to Kushtia' && io.status !== 'Completed') {
        accountsPayable += Number(io.totalLandedCostBDT || 0);
      }
    });

    const monthlyIncome = cashBankKpis?.monthIncome || salesMetrics.monthSales || 0;
    const monthlyExpenses = cashBankKpis?.monthExpense || 0;

    return {
      cashBalance,
      bankBalance,
      combinedLiquid,
      accountsReceivable,
      accountsPayable,
      monthlyIncome,
      monthlyExpenses,
      netMonthlyFlow: monthlyIncome - monthlyExpenses,
    };
  }, [cashBankKpis, salesMetrics, importOrders]);

  // Distribution & Field Operations
  const distributionMetrics = useMemo(() => {
    const activeDistributors = distributors.filter((d) => d.status === 'Active' || !d.status).length;
    const totalCustomers = customers.length;
    const activeWarehouses = warehouses.length;

    let pendingDeliveries = 0;
    let dispatchedOrders = 0;
    let pendingChallans = 0;

    salesOrders.forEach((so) => {
      if (['DO Generated', 'DO Accepted', 'Challan Generated', 'Approved'].includes(so.status)) {
        pendingDeliveries++;
      }
      if (['Dispatched', 'Dispatched & Invoiced'].includes(so.status)) {
        dispatchedOrders++;
      }
      if (['DO Accepted', 'Approved'].includes(so.status) && !so.challanNumber) {
        pendingChallans++;
      }
    });

    const activeFieldAgents = fieldForceReps.filter((r) => r.status === 'Active' || !r.status).length;

    return {
      activeDistributors,
      totalCustomers,
      activeWarehouses,
      pendingDeliveries,
      dispatchedOrders,
      pendingChallans,
      activeFieldAgents,
    };
  }, [distributors, customers, warehouses, salesOrders, fieldForceReps]);

  // ============================================================================
  // 2. DATA VISUALIZATION DATA GENERATION
  // ============================================================================

  // A. 12-Month Sales Trend Data (Real-time dynamic aggregation from sales orders)
  const monthlySalesTrend = useMemo(() => {
    const months: { key: string; label: string }[] = [];
    const d = new Date();
    for (let i = 11; i >= 0; i--) {
      const targetDate = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const key = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
      const label = targetDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      months.push({ key, label });
    }

    const monthMap: Record<string, number> = {};
    months.forEach((m) => {
      monthMap[m.key] = 0;
    });

    // Add live sales orders to corresponding month
    salesOrders.forEach((so) => {
      const ym = so.date ? so.date.substring(0, 7) : '';
      if (monthMap[ym] !== undefined) {
        monthMap[ym] += Number(so.netAmountBDT || so.subTotalBDT || 0);
      }
    });

    let previousVal = 0;
    return months.map((m) => {
      const val = monthMap[m.key] || 0;
      const growth = previousVal > 0 ? (((val - previousVal) / previousVal) * 100).toFixed(1) : '0.0';
      previousVal = val;
      return {
        key: m.key,
        label: m.label,
        value: val,
        growth: `${Number(growth) > 0 ? '+' : ''}${growth}%`,
      };
    });
  }, [salesOrders]);

  // Max value for scaling SVG chart
  const maxSalesTrend = useMemo(() => {
    return Math.max(...monthlySalesTrend.map((m) => m.value), 1000000);
  }, [monthlySalesTrend]);

  // B. Sales Performance by Top 10 Distributors
  const topDistributors = useMemo(() => {
    const map = new Map<string, { id: string; name: string; salesBDT: number; ordersCount: number }>();

    // Seed with existing distributors
    distributors.forEach((d) => {
      map.set(d.id, {
        id: d.id,
        name: d.name,
        salesBDT: 0,
        ordersCount: 0,
      });
    });

    salesOrders.forEach((so) => {
      const distId = so.distributorId || 'unassigned';
      const distName = so.distributorName || 'Direct Factory Channel';
      const existing = map.get(distId);
      const amount = Number(so.netAmountBDT || so.subTotalBDT || 0);

      if (existing) {
        existing.salesBDT += amount;
        existing.ordersCount += 1;
      } else {
        map.set(distId, {
          id: distId,
          name: distName,
          salesBDT: amount,
          ordersCount: 1,
        });
      }
    });

    const list = Array.from(map.values()).sort((a, b) => b.salesBDT - a.salesBDT);
    const top10 = list.slice(0, 10);
    const maxVal = top10[0]?.salesBDT || 1;

    return top10.map((d, index) => ({
      ...d,
      rank: index + 1,
      percent: Math.min(100, Math.max(8, Math.round((d.salesBDT / maxVal) * 100))),
    }));
  }, [distributors, salesOrders]);

  // C. Finished Goods Stock Distribution (By Category)
  const categoryStockDistribution = useMemo(() => {
    const map: Record<string, { category: string; units: number; color: string; valBDT: number }> = {
      'Electric Vehicle (EV) Batteries': { category: 'EV Lithium Packs', units: 0, color: '#2563eb', valBDT: 0 },
      'Solar & Inverter Storage': { category: 'Solar & ESS', units: 0, color: '#10b981', valBDT: 0 },
      'Telecom & Industrial ESS': { category: 'Telecom Power', units: 0, color: '#8b5cf6', valBDT: 0 },
      'Custom Lithium Solutions': { category: 'Custom Solutions', units: 0, color: '#f59e0b', valBDT: 0 },
      'Other': { category: 'Spare & Accessories', units: 0, color: '#64748b', valBDT: 0 },
    };

    products.forEach((p) => {
      const catKey = p.category && map[p.category] ? p.category : 'Other';
      const stock = (Number(p.stockCID) || 0) + (Number(p.stockKushtiaPlant) || 0) + (Number(p.stockDhakaHubs) || 0);
      const unitVal = Number(p.distributorPriceBDT || p.mrpBDT || 0);

      map[catKey].units += stock;
      map[catKey].valBDT += stock * unitVal;
    });

    const list = Object.values(map);
    const totalUnits = list.reduce((a, b) => a + b.units, 0) || 1;

    let cumulativeAngle = 0;
    return list.map((item) => {
      const percentage = Math.round((item.units / totalUnits) * 100);
      const angle = (item.units / totalUnits) * 360;
      const startAngle = cumulativeAngle;
      cumulativeAngle += angle;
      return {
        ...item,
        percentage,
        startAngle,
        endAngle: cumulativeAngle,
      };
    });
  }, [products]);

  // D. Monthly Income vs Expenses (Last 6 Months) - Dynamically aggregated from payments & expense entries
  const financialHistory = useMemo(() => {
    const months: { key: string; month: string }[] = [];
    const d = new Date();
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const key = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
      const month = targetDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      months.push({ key, month });
    }

    const incomeMap: Record<string, number> = {};
    const expenseMap: Record<string, number> = {};

    months.forEach((m) => {
      incomeMap[m.key] = 0;
      expenseMap[m.key] = 0;
    });

    payments.forEach((p) => {
      const pDate = p.paymentDate || p.tranDate;
      const ym = pDate ? pDate.substring(0, 7) : '';
      if (incomeMap[ym] !== undefined) {
        incomeMap[ym] += Number(p.amountBDT || p.paymentAmount || 0);
      }
    });

    expenseEntries.forEach((e) => {
      const eDate = e.expenseDate || e.createdAt;
      const ym = eDate ? eDate.substring(0, 7) : '';
      if (expenseMap[ym] !== undefined) {
        expenseMap[ym] += Number(e.amount || 0);
      }
    });

    return months.map((m) => ({
      month: m.month,
      income: incomeMap[m.key] || 0,
      expense: expenseMap[m.key] || 0,
    }));
  }, [payments, expenseEntries]);

  const maxFinancial = useMemo(() => {
    return Math.max(...financialHistory.flatMap((f) => [f.income, f.expense]), 1000000);
  }, [financialHistory]);

  // ============================================================================
  // 3. OPERATIONAL PIPELINE BREAKDOWN (Monitoring Section)
  // ============================================================================

  const pipeline = useMemo(() => {
    // Sales pipeline breakdown
    const newBookedOrders = salesOrders.filter((s) => s.status === 'Booked').length;
    const pendingDO = salesOrders.filter((s) => s.status === 'Submitted' || s.status === 'DO Generated').length;
    const pendingAccounts = salesOrders.filter((s) => s.status === 'DO Accepted').length;
    const pendingChallan = salesOrders.filter((s) => s.status === 'Approved' && !s.challanNumber).length;
    const dispatched = salesOrders.filter((s) => s.status === 'Dispatched' || s.status === 'Dispatched & Invoiced').length;
    const deliveryPending = salesOrders.filter((s) => s.status === 'Dispatched & Invoiced' && !s.deliveryStatus).length;

    // Procurement pipeline
    const pendingImports = importOrders.filter((io) => io.status !== 'Delivered to Kushtia').length;
    const importLandedTotal = importOrders.reduce((acc, io) => acc + (Number(io.totalLandedCostBDT) || 0), 0);
    const pendingRawReceipts = rawMaterials.filter((r) => (Number(r.stockKushtia) || 0) < 100).length;

    // Factory pipeline
    const prodPlanned = productionOrders.filter((po) => po.status === 'Planned' || !po.status).length;
    const prodAssembly = productionOrders.filter((po) => po.status === 'In Assembly' || po.status === 'In Production').length;
    const prodTesting = productionOrders.filter((po) => po.status === 'Testing & QC').length;
    const prodCompleted = productionOrders.filter((po) => po.status === 'Completed').length;

    // Warranty pipeline
    const warrantyTotal = warrantyTickets.length;
    const warrantyReceived = warrantyTickets.filter((w) => w.status === 'Battery Received' || w.status === 'Complaint Registered').length;
    const warrantyRepair = warrantyTickets.filter((w) => w.status === 'In Repair' || w.status === 'Technical Inspection').length;
    const warrantyDelivered = warrantyTickets.filter((w) => w.status === 'Delivered' || w.status === 'Quality Control Passed').length;

    return {
      sales: {
        newBookedOrders,
        pendingDO,
        pendingAccounts,
        pendingChallan,
        dispatched,
        deliveryPending,
      },
      procurement: {
        pendingImports,
        importLandedTotal,
        pendingRawReceipts,
        suppliersCount: suppliers.length,
      },
      factory: {
        prodPlanned,
        prodAssembly,
        prodTesting,
        prodCompleted,
      },
      warranty: {
        warrantyTotal,
        warrantyReceived,
        warrantyRepair,
        warrantyDelivered,
      },
    };
  }, [salesOrders, importOrders, rawMaterials, productionOrders, warrantyTickets]);

  // ============================================================================
  // 4. INSTALLMENT & ACCOUNTS RECEIVABLES BREAKDOWN
  // ============================================================================

  const installmentMetrics = useMemo(() => {
    const totalPlans = installmentPlans.length;
    const activePlans = installmentPlans.filter((p) => p.status === 'Active').length;
    const totalFinancedBDT = installmentPlans.reduce((acc, p) => acc + (Number(p.totalPayableBDT || p.financedAmountBDT) || 0), 0);
    const totalDownPaymentBDT = installmentPlans.reduce((acc, p) => acc + (Number(p.downPaymentBDT) || 0), 0);
    const totalRemainingBDT = installmentPlans.reduce((acc, p) => acc + (Number(p.totalOutstandingBDT) || 0), 0);

    const pendingSchedules = installmentSchedules.filter((s) => s.status === 'Upcoming' || s.status === 'Due Today' || s.status === 'Partial');
    const overdueSchedules = installmentSchedules.filter((s) => s.status === 'Overdue');
    const overdueAmountBDT = overdueSchedules.reduce((acc, s) => acc + (Number(s.dueAmountBDT) || 0), 0);

    const upcomingThisMonth = pendingSchedules.filter((s) => s.dueDate?.startsWith(currentMonthStr));
    const upcomingMonthAmount = upcomingThisMonth.reduce((acc, s) => acc + (Number(s.dueAmountBDT) || 0), 0);

    return {
      totalPlans,
      activePlans,
      totalFinancedBDT,
      totalDownPaymentBDT,
      totalRemainingBDT,
      overdueCount: overdueSchedules.length,
      overdueAmountBDT,
      upcomingCount: upcomingThisMonth.length,
      upcomingMonthAmount,
    };
  }, [installmentPlans, installmentSchedules]);

  // ============================================================================
  // 5. RECENT ACTIVITY & AUDIT FEED COMPILATION
  // ============================================================================

  const combinedRecentActivities = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'sales' | 'production' | 'payment' | 'inventory' | 'warranty';
      title: string;
      description: string;
      time: string;
      status: string;
      statusVariant: 'success' | 'warning' | 'info' | 'danger';
      actionRoute: string;
    }> = [];

    // Sales Orders
    salesOrders.slice(0, 6).forEach((so) => {
      const isOk = so.status === 'Delivered' || so.status === 'Dispatched & Invoiced';
      list.push({
        id: `act-so-${so.id}`,
        type: 'sales',
        title: `Sales Order #${so.orderNumber}`,
        description: `${so.customerName} · ৳${Number(so.netAmountBDT || 0).toLocaleString('en-IN')} via ${so.distributorName || 'Factory'}`,
        time: so.date || 'Today',
        status: so.status,
        statusVariant: isOk ? 'success' : so.status === 'Cancelled' ? 'danger' : 'warning',
        actionRoute: 'sales-orders',
      });
    });

    // Production Orders
    productionOrders.slice(0, 4).forEach((po) => {
      list.push({
        id: `act-po-${po.id}`,
        type: 'production',
        title: `Production #${po.orderNumber}`,
        description: `${po.productName || po.model} · ${po.completedQty || 0}/${po.plannedQty} Units batch`,
        time: po.date || po.manufacturingDate || 'Today',
        status: po.status || 'In Progress',
        statusVariant: po.status === 'Completed' ? 'success' : 'info',
        actionRoute: 'manufacturing',
      });
    });

    // Payments
    payments.slice(0, 4).forEach((pay) => {
      list.push({
        id: `act-pay-${pay.id}`,
        type: 'payment',
        title: `Payment ${pay.tranNo}`,
        description: `Collected ৳${Number(pay.amountBDT || 0).toLocaleString('en-IN')} (${pay.paymentMethod}) for ${pay.distributorName || pay.customerName || 'Receivables'}`,
        time: pay.paymentDate || pay.tranDate || 'Today',
        status: pay.status,
        statusVariant: pay.status === 'Approved' ? 'success' : 'warning',
        actionRoute: 'payment-list',
      });
    });

    // Warranty
    warrantyTickets.slice(0, 3).forEach((wt) => {
      list.push({
        id: `act-wt-${wt.id}`,
        type: 'warranty',
        title: `Warranty RMA #${wt.ticketNumber}`,
        description: `${wt.batteryModel || 'Battery'} (${wt.serialNumber || 'N/A'}) · ${wt.problemCategory || wt.reportedProblem || 'Inspection'}`,
        time: wt.complaintDate || 'Active',
        status: wt.status,
        statusVariant: wt.status === 'Delivered' ? 'success' : 'warning',
        actionRoute: 'warranty',
      });
    });

    // Filter by tab
    if (activityFilter === 'all') return list.slice(0, 8);
    return list.filter((a) => a.type === activityFilter).slice(0, 8);
  }, [salesOrders, productionOrders, payments, warrantyTickets, activityFilter]);

  return (
    <div className="space-y-6 w-full pb-16">
      {/* ==================================================================== */}
      {/* HEADER & EXECUTIVE CONTEXT CONTROL BAR */}
      {/* ==================================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Executive Business Dashboard
                </h1>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <span>Ensec Lithium Batteries BD</span>
                  <span aria-hidden="true">·</span>
                  <span>Head Office Operations Command</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Enterprise Data
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Shortcuts & Refresh */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRefresh}
              title="Refresh Dashboard Data"
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
              <span>Refresh</span>
            </button>

          

            <button
              onClick={() => onNavigate?.('sales-orders')}
              className="px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>New Sales Order</span>
            </button>

            <button
              onClick={() => onNavigate?.('manufacturing')}
              className="px-3 py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Factory className="w-3.5 h-3.5" />
              <span>Factory Work Order</span>
            </button>

            <button
              onClick={() => onNavigate?.('reports')}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Executive Reports</span>
            </button>
          </div>
        </div>

        {/* Filters Strip */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Date Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl">
            {(
              [
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: 'month', label: 'This Month' },
                { id: 'quarter', label: 'This Quarter' },
                { id: 'ytd', label: `YTD ${currentYearStr}` },
              ] as const
            ).map((d) => (
              <button
                key={d.id}
                onClick={() => setDateFilter(d.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  dateFilter === d.id
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Operational Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Warehouse Filter */}
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Warehouses ({warehouses.length})</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>

            {/* Product Category Filter */}
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Product Categories</option>
              {productCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Distributor Filter */}
            <select
              value={selectedDistributorId}
              onChange={(e) => setSelectedDistributorId(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[200px]"
            >
              <option value="all">All Distributors ({distributors.length})</option>
              {distributors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. TOP-LEVEL EXECUTIVE KPI DOMAIN CARDS WITH LOGICAL SECTIONS */}
      {/* ==================================================================== */}
      <div className="space-y-3">
        {/* Domain Navigation Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {(
              [
                { id: 'sales', label: 'Sales & Revenue', icon: DollarSign, badge: `৳${(salesMetrics.totalSales / 1000000).toFixed(1)}M` },
                { id: 'inventory', label: 'Inventory & Stock', icon: Package, badge: `${inventoryMetrics.totalFinishedGoodsStock} Units` },
                { id: 'production', label: 'Factory & Production', icon: Factory, badge: `${productionMetrics.totalProduction} Packs` },
                { id: 'finance', label: 'Cash & Financials', icon: Landmark, badge: `৳${(financialMetrics.combinedLiquid / 1000000).toFixed(1)}M` },
                { id: 'distribution', label: 'Distribution & Field', icon: Users, badge: `${distributionMetrics.activeDistributors} Partners` },
              ] as const
            ).map((tab) => {
              const IconComp = tab.icon;
              const isActive = kpiTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setKpiTab(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>
          <span className="hidden md:block text-[11px] text-slate-400">Click any card to open module</span>
        </div>

        {/* SECTION A: SALES & REVENUE CARDS */}
        {kpiTab === 'sales' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => onNavigate?.('sales-orders')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-blue-500/50 hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Gross Revenue
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  ৳ {salesMetrics.totalSales.toLocaleString('en-IN')}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{filteredSalesOrders.length} active filtered orders</span>
                </div>
              </div>
            </div>

            <div
              onClick={() => onNavigate?.('sales-orders')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-blue-500/50 hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Monthly Revenue ({currentMonthName})
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  ৳ {salesMetrics.monthSales.toLocaleString('en-IN')}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>Today: ৳{salesMetrics.todaySales.toLocaleString('en-IN')}</span>
                  <span>·</span>
                  <span>YTD: ৳{(salesMetrics.ytdSales / 1000000).toFixed(1)}M</span>
                </div>
              </div>
            </div>

            <div
              onClick={() => onNavigate?.('sales-orders')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-blue-500/50 hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Outstanding Receivables
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  ৳ {salesMetrics.totalOutstanding.toLocaleString('en-IN')}
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Collected: ৳{salesMetrics.totalCollection.toLocaleString('en-IN')}</span>
                  <span className="font-semibold text-emerald-600">{salesMetrics.collectionRate}% Rate</span>
                </div>
              </div>
            </div>

            <div
              onClick={() => onNavigate?.('sales-orders')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-blue-500/50 hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Pending Sales Orders
                </span>
                <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {salesMetrics.pendingOrdersCount}{' '}
                  <span className="text-xs font-normal text-slate-500">Orders Awaiting Action</span>
                </div>
                <div className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                  <span>Requires DO generation & commercial credit check</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION B: INVENTORY & WAREHOUSE CARDS */}
        {kpiTab === 'inventory' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => onNavigate?.('stock')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-blue-500/50 hover:shadow-md transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Finished Goods Stock
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {inventoryMetrics.totalFinishedGoodsStock.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-slate-500">Battery Packs</span>
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Across {inventoryMetrics.activeWarehouseCount} factory plants & regional hubs
                </div>
              </div>
            </div>

            <div
              onClick={() => onNavigate?.('raw-material-inventory')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-blue-500/50 hover:shadow-md transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Raw Material Inventory
                </span>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {inventoryMetrics.totalRawMaterialStock.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-slate-500">Units / KG</span>
                </div>
                <div className="mt-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                  Cells, BMS, Casings & Busbars in Kushtia Factory Store
                </div>
              </div>
            </div>

            <div
              onClick={() => onNavigate?.('stock')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-blue-500/50 hover:shadow-md transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Inventory Valuation
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Boxes className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  ৳ {(inventoryMetrics.totalStockValuation / 1000000).toFixed(2)}M
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Combined Finished Goods + Raw Materials Value
                </div>
              </div>
            </div>

            <div
              onClick={() => onNavigate?.('stock')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-blue-500/50 hover:shadow-md transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Low Stock & Transfers
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {inventoryMetrics.lowStockCount}{' '}
                  <span className="text-xs font-normal text-slate-500">Low Stock SKUs</span>
                </div>
                <div className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                  {inventoryMetrics.pendingStockTransfers} Stock Transfers in transit
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION C: FACTORY & PRODUCTION CARDS */}
        {kpiTab === 'production' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => onNavigate?.('manufacturing')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-blue-500/50 hover:shadow-md transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Production Output
                </span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Factory className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {productionMetrics.totalProduction.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-slate-500">Completed Packs</span>
                </div>
                <div className="mt-1 text-xs text-purple-600 dark:text-purple-400 font-semibold">
                  This Month: {productionMetrics.monthlyProduction} Packs Produced
                </div>
              </div>
            </div>

            <div
              onClick={() => onNavigate?.('manufacturing')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-blue-500/50 hover:shadow-md transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Production in Progress
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <BatteryCharging className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {productionMetrics.inProgressCount}{' '}
                  <span className="text-xs font-normal text-slate-500">Active Work Orders</span>
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Under assembly, laser welding, and high-temp aging
                </div>
              </div>
            </div>

            <div
              onClick={() => onNavigate?.('manufacturing')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-blue-500/50 hover:shadow-md transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Pending Work Orders
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {productionMetrics.pendingCount}{' '}
                  <span className="text-xs font-normal text-slate-500">Scheduled Orders</span>
                </div>
                <div className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                  Awaiting raw material issue allocation
                </div>
              </div>
            </div>

            <div
              onClick={() => onNavigate?.('manufacturing')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-blue-500/50 hover:shadow-md transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Completion & QC Rate
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {productionMetrics.completionRate}%
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Target adherence across Kushtia assembly lines
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION D: FINANCIAL OVERVIEW CARDS */}
        {kpiTab === 'finance' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => onNavigate?.('cash-bank')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-blue-500/50 hover:shadow-md transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Liquid Cash & Bank
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Landmark className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  ৳ {(financialMetrics.combinedLiquid / 1000000).toFixed(2)}M
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span>Cash: ৳{(financialMetrics.cashBalance / 100000).toFixed(1)}L</span>
                  <span>·</span>
                  <span>Bank: ৳{(financialMetrics.bankBalance / 1000000).toFixed(1)}M</span>
                </div>
              </div>
            </div>

            <div
              onClick={() => onNavigate?.('sales-orders')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-blue-500/50 hover:shadow-md transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Accounts Receivable
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  ৳ {financialMetrics.accountsReceivable.toLocaleString('en-IN')}
                </div>
                <div className="mt-1 text-xs text-blue-600 dark:text-blue-400 font-semibold">
                  Distributor & customer credit ledger outstanding
                </div>
              </div>
            </div>

            <div
              onClick={() => onNavigate?.('procurement')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-blue-500/50 hover:shadow-md transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Accounts Payable
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  ৳ {financialMetrics.accountsPayable.toLocaleString('en-IN')}
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Active LC commitments & supplier payables
                </div>
              </div>
            </div>

            <div
              onClick={() => onNavigate?.('cash-bank')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-blue-500/50 hover:shadow-md transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Monthly Cash Flow
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  +৳ {(financialMetrics.netMonthlyFlow / 1000000).toFixed(2)}M
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Income: ৳{(financialMetrics.monthlyIncome / 1000000).toFixed(1)}M · Exp: ৳{(financialMetrics.monthlyExpenses / 1000000).toFixed(1)}M
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION E: DISTRIBUTION & OPERATIONS CARDS */}
        {kpiTab === 'distribution' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => onNavigate?.('basic-data-distributors')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-blue-500/50 hover:shadow-md transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Distribution Network
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {distributionMetrics.activeDistributors}{' '}
                  <span className="text-xs font-normal text-slate-500">Active Distributors</span>
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Serving {distributionMetrics.totalCustomers} direct retailers & dealers
                </div>
              </div>
            </div>

            <div
              onClick={() => onNavigate?.('sales-orders')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-blue-500/50 hover:shadow-md transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Pending Deliveries (DO)
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {distributionMetrics.pendingDeliveries}{' '}
                  <span className="text-xs font-normal text-slate-500">Delivery Orders</span>
                </div>
                <div className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                  {distributionMetrics.pendingChallans} Awaiting warehouse challan generation
                </div>
              </div>
            </div>

            <div
              onClick={() => onNavigate?.('sales-orders')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-blue-500/50 hover:shadow-md transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Dispatched Orders
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {distributionMetrics.dispatchedOrders}{' '}
                  <span className="text-xs font-normal text-slate-500">In Transit / Invoiced</span>
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Dispatched from Central Hub with assigned truck/driver
                </div>
              </div>
            </div>

            <div
              onClick={() => onNavigate?.('field-tracker')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-blue-500/50 hover:shadow-md transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Field Force Live
                </span>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {distributionMetrics.activeFieldAgents}{' '}
                  <span className="text-xs font-normal text-slate-500">Sales Representatives</span>
                </div>
                <div className="mt-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                  <span>GPS geo-attendance & market routes active</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 3. ENTERPRISE DATA VISUALIZATIONS SECTION */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART A: 12-Month Sales Trend (SVG Area Chart) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Monthly Sales Growth Trend</h2>
                <span className="text-[10px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-md">
                  12-Month Trajectory
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Gross revenue trajectory in BDT showing quarterly momentum
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">{currentMonthLong}</span>
              <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                ৳{(monthlySalesTrend[monthlySalesTrend.length - 1]?.value / 1000000).toFixed(2)}M
              </div>
            </div>
          </div>

          {/* SVG Area Chart Container */}
          <div className="relative h-64 w-full pt-4">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 550 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {[0, 50, 100, 150].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="550"
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-100 dark:text-slate-800/80"
                  strokeDasharray="4 4"
                />
              ))}

              {/* Area & Line path calculation */}
              {(() => {
                const points = monthlySalesTrend.map((m, i) => {
                  const x = (i / (monthlySalesTrend.length - 1)) * 530 + 10;
                  const y = 180 - (m.value / maxSalesTrend) * 150;
                  return { x, y, ...m };
                });

                const linePath = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
                const areaPath = `${linePath} L ${points[points.length - 1].x} 190 L ${points[0].x} 190 Z`;

                return (
                  <>
                    <path d={areaPath} fill="url(#salesGradient)" />
                    <path d={linePath} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
                    {points.map((p, idx) => (
                      <g key={idx} className="cursor-pointer group">
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="4"
                          className="fill-white dark:fill-slate-900 stroke-blue-600 hover:scale-150 transition"
                          strokeWidth="2.5"
                          onMouseEnter={() =>
                            setChartTooltip({
                              x: p.x,
                              y: p.y,
                              title: p.label,
                              value: `৳${(p.value / 1000000).toFixed(2)}M (${p.growth})`,
                              sub: 'Monthly Gross Invoiced',
                            })
                          }
                          onMouseLeave={() => setChartTooltip(null)}
                        />
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>

            {/* X-Axis Month Labels */}
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-2 px-1">
              {monthlySalesTrend.map((m, idx) => (
                <span key={idx} className={idx % 2 === 0 ? 'block' : 'hidden sm:block'}>
                  {m.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* CHART B: Sales Performance by Distributor (Horizontal Progress Chart) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Top 10 Distributors by Sales</h2>
                  <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md">
                    Channel Share
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Comparative performance and volume by regional distribution partner
                </p>
              </div>
              <button
                onClick={() => onNavigate?.('basic-data-distributors')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({distributors.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3 pt-1">
              {topDistributors.map((d) => (
                <div key={d.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 max-w-[65%]">
                      <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                        #{d.rank}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {d.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 dark:text-white font-mono">
                        ৳{d.salesBDT.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                        ({d.ordersCount} orders)
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${d.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CHART C: Finished Goods Stock Distribution (Donut Chart) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Inventory Stock Distribution</h2>
                <span className="text-[10px] bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold px-2 py-0.5 rounded-md">
                  Category Split
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Physical battery pack allocation across main product lines
              </p>
            </div>
            <button
              onClick={() => onNavigate?.('basic-data-products')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>SKU Matrix</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-6 pt-2">
            {/* Donut SVG */}
            <div className="relative flex items-center justify-center">
              <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle cx="50" cy="50" r="38" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="16" fill="none" />
                {(() => {
                  let accumulatedPercent = 0;
                  return categoryStockDistribution.map((item, idx) => {
                    const strokeDasharray = `${item.percentage} ${100 - item.percentage}`;
                    const strokeDashoffset = -accumulatedPercent;
                    accumulatedPercent += item.percentage;
                    return (
                      <circle
                        key={idx}
                        cx="50"
                        cy="50"
                        r="38"
                        stroke={item.color}
                        strokeWidth="16"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        pathLength="100"
                        fill="none"
                        className="transition-all duration-500 hover:stroke-width-20 cursor-pointer"
                      />
                    );
                  });
                })()}
              </svg>
              {/* Inner Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Stock</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {inventoryMetrics.totalFinishedGoodsStock}
                </span>
                <span className="text-[10px] text-slate-500">Packs Active</span>
              </div>
            </div>

            {/* Legend & Breakdown */}
            <div className="space-y-2.5">
              {categoryStockDistribution.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{item.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 dark:text-white font-mono">{item.units} packs</span>
                    <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CHART D: Financial Income vs Expenses (Bar Chart) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Financial Inflow vs Outflow</h2>
                <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md">
                  P&L Margin
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Monthly revenue collections vs operating disbursements & landed costs
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
                <span className="text-slate-600 dark:text-slate-300">Income</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                <span className="text-slate-600 dark:text-slate-300">Expenses</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full flex items-end justify-between gap-3 pt-6 pb-2 px-2">
            {financialHistory.map((item, idx) => {
              const incomeHeight = (item.income / maxFinancial) * 160;
              const expenseHeight = (item.expense / maxFinancial) * 160;
              const margin = item.income - item.expense;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full flex items-end justify-center gap-1.5 h-44">
                    {/* Income Bar */}
                    <div
                      className="w-1/2 bg-blue-600 rounded-t-md hover:bg-blue-500 transition-all cursor-pointer relative"
                      style={{ height: `${incomeHeight}px` }}
                      title={`Income: ৳${(item.income / 1000000).toFixed(2)}M`}
                    />
                    {/* Expense Bar */}
                    <div
                      className="w-1/2 bg-amber-500 rounded-t-md hover:bg-amber-400 transition-all cursor-pointer relative"
                      style={{ height: `${expenseHeight}px` }}
                      title={`Expense: ৳${(item.expense / 1000000).toFixed(2)}M`}
                    />
                  </div>
                  <div className="text-center">
                    <div className="text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {item.month}
                    </div>
                    <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      +৳{(margin / 1000000).toFixed(1)}M
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. OPERATIONAL MONITORING: BUSINESS OPERATIONS OVERVIEW */}
      {/* ==================================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span>Business Operations Overview</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live status tracking across Sales Order execution, Procurement SCM, Factory assembly, and Warranty SLA
            </p>
          </div>
          <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-lg font-medium self-start sm:self-auto">
            4 Critical Workflows
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Column 1: Sales & Order Pipeline */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-blue-600" />
                <span>Sales & Invoicing</span>
              </span>
              <button
                onClick={() => onNavigate?.('sales-orders')}
                className="text-[10px] text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                Manage
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">New Booked Orders</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">{pipeline.sales.newBookedOrders}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Pending DO Acceptance</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">{pipeline.sales.pendingDO}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Pending Accounts Approval</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">{pipeline.sales.pendingAccounts}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Pending Challans</span>
                <span className="font-bold text-purple-600 dark:text-purple-400 font-mono">{pipeline.sales.pendingChallan}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Dispatched & Invoiced</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{pipeline.sales.dispatched}</span>
              </div>
            </div>
          </div>

          {/* Column 2: Procurement & Supply Chain */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Ship className="w-4 h-4 text-purple-600" />
                <span>Supply Chain (SCM)</span>
              </span>
              <button
                onClick={() => onNavigate?.('procurement')}
                className="text-[10px] text-purple-600 hover:underline font-semibold cursor-pointer"
              >
                Consignments
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Active Import Consignments</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">{pipeline.procurement.pendingImports}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Landed Cost Commitments</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  ৳{(pipeline.procurement.importLandedTotal / 1000000).toFixed(1)}M
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Pending Raw Material GRN</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">{pipeline.procurement.pendingRawReceipts}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Direct Global Suppliers</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">CATL, Daly, Jintao</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Port Custom Clearance</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">Chittagong Active</span>
              </div>
            </div>
          </div>

          {/* Column 3: Factory & Manufacturing */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Factory className="w-4 h-4 text-indigo-600" />
                <span>Kushtia Factory</span>
              </span>
              <button
                onClick={() => onNavigate?.('manufacturing')}
                className="text-[10px] text-indigo-600 hover:underline font-semibold cursor-pointer"
              >
                Production
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Planned Batch Orders</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">{pipeline.factory.prodPlanned}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">In Assembly & Welding</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">{pipeline.factory.prodAssembly}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">In Testing & QC Aging</span>
                <span className="font-bold text-purple-600 dark:text-purple-400 font-mono">{pipeline.factory.prodTesting}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Finished Goods Received</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{pipeline.factory.prodCompleted}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">BOM Standard Compliance</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">FIFO Tracked</span>
              </div>
            </div>
          </div>

          {/* Column 4: Warranty & Service Management */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Warranty & RMA</span>
              </span>
              <button
                onClick={() => onNavigate?.('warranty')}
                className="text-[10px] text-emerald-600 hover:underline font-semibold cursor-pointer"
              >
                Service Hub
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Total RMA Claims</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">{pipeline.warranty.warrantyTotal}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Under Tech Inspection</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">{pipeline.warranty.warrantyReceived}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">In Cell / BMS Repair</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">{pipeline.warranty.warrantyRepair}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">QC Passed & Delivered</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{pipeline.warranty.warrantyDelivered}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Average Turnaround SLA</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">&lt; 48 Hours</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 5. ACCOUNTS & INSTALLMENT RECEIVABLES OVERVIEW */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Distributor Receivables & Credit Limit Health */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Landmark className="w-4 h-4 text-emerald-600" />
                <span>Distributor Credit & Receivables Exposure</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Live monitoring of credit limits, current outstanding, and available credit headroom
              </p>
            </div>
            <button
              onClick={() => onNavigate?.('basic-data-distributors')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Distributor Directory</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                  <th className="py-2.5 font-semibold">Distributor Partner</th>
                  <th className="py-2.5 font-semibold text-right">Credit Limit (BDT)</th>
                  <th className="py-2.5 font-semibold text-right">Outstanding (BDT)</th>
                  <th className="py-2.5 font-semibold text-center">Credit Utilization</th>
                  <th className="py-2.5 font-semibold text-right">Available Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {distributors.slice(0, 5).map((dist) => {
                  const limit = Number(dist.creditLimitBDT || 500000);
                  const out = Number(dist.currentOutstandingBDT || 0);
                  const utilPercent = limit > 0 ? Math.min(100, Math.round((out / limit) * 100)) : 0;
                  const available = Math.max(0, limit - out);

                  return (
                    <tr key={dist.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 font-medium text-slate-900 dark:text-white">
                        <div className="font-semibold">{dist.name}</div>
                        <div className="text-[10px] text-slate-400">{dist.district || 'Dhaka'} · Code: {dist.code}</div>
                      </td>
                      <td className="py-3 text-right font-mono font-medium text-slate-600 dark:text-slate-300">
                        ৳{limit.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                        ৳{out.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="w-24 mx-auto bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              utilPercent > 80 ? 'bg-rose-500' : utilPercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${utilPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono font-medium text-slate-500 mt-0.5 inline-block">
                          {utilPercent}% used
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ৳{available.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Customer Installment Collection (12M/24M/36M Plans) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>Customer Installment Plans</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  12, 24 & 36-Month customer EMI recovery status
                </p>
              </div>
              <button
                onClick={() => onNavigate?.('installment')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
              >
                View Plans
              </button>
            </div>

            <div className="space-y-3 pt-1">
              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 flex items-center justify-between">
                <div>
                  <div className="text-xs text-blue-700 dark:text-blue-300 font-semibold">Total Financed Value</div>
                  <div className="text-lg font-black text-slate-900 dark:text-white font-mono">
                    ৳{installmentMetrics.totalFinancedBDT.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Active Plans</div>
                  <div className="text-sm font-bold text-blue-600 font-mono">{installmentMetrics.activePlans} Plans</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <div className="text-[11px] text-slate-500">Collected Down-Payment</div>
                  <div className="font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                    ৳{installmentMetrics.totalDownPaymentBDT.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <div className="text-[11px] text-slate-500">Remaining Balance</div>
                  <div className="font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                    ৳{installmentMetrics.totalRemainingBDT.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-amber-900 dark:text-amber-200">
                    {installmentMetrics.overdueCount} Overdue Installments
                  </div>
                  <div className="text-[11px] text-amber-700 dark:text-amber-400">
                    ৳{installmentMetrics.overdueAmountBDT.toLocaleString('en-IN')} requiring field collection
                  </div>
                </div>
                <button
                  onClick={() => onNavigate?.('collection')}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition shadow-xs"
                >
                  Follow-Up
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                <span>Due This Month:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {installmentMetrics.upcomingCount} EMIs (৳{installmentMetrics.upcomingMonthAmount.toLocaleString('en-IN')})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 6. RECENT ACTIVITIES & SYSTEM ALERTS TIMELINE */}
      {/* ==================================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Operational Activity Stream & Audit Feed</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Chronological log of transactions, factory production batches, and customer disbursements
            </p>
          </div>

          {/* Activity Category Filters */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs overflow-x-auto no-scrollbar">
            {(
              [
                { id: 'all', label: 'All Activities' },
                { id: 'sales', label: 'Sales' },
                { id: 'production', label: 'Factory' },
                { id: 'payment', label: 'Payments' },
                { id: 'warranty', label: 'Warranty' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setActivityFilter(f.id)}
                className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer whitespace-nowrap ${
                  activityFilter === f.id
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {combinedRecentActivities.map((act) => (
            <div
              key={act.id}
              onClick={() => onNavigate?.(act.actionRoute)}
              className="py-3 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-slate-800/40 px-2 rounded-xl transition cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60 group-hover:text-blue-600 transition">
                  {act.type === 'sales' && <ShoppingBag className="w-4 h-4" />}
                  {act.type === 'production' && <Factory className="w-4 h-4" />}
                  {act.type === 'payment' && <Landmark className="w-4 h-4" />}
                  {act.type === 'warranty' && <ShieldCheck className="w-4 h-4" />}
                  {act.type === 'inventory' && <Package className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{act.title}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        act.statusVariant === 'success'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : act.statusVariant === 'warning'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          : act.statusVariant === 'danger'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                      }`}
                    >
                      {act.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {act.description}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] text-slate-400 font-mono">{act.time}</span>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
