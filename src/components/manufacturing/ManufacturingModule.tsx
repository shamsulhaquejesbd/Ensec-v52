import React, { useState, useEffect } from 'react';
import {
  Cpu,
  PlusCircle,
  Plus,
  Layers,
  Wrench,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  FileSpreadsheet,
  Building,
  ArrowRight,
  ShieldAlert,
  Printer,
  Eye,
  Check,
  Upload,
  Download,
  Ban,
  XCircle,
  X,
  RotateCw,
  Archive,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { Product, ProductionOrder, BOMItem, ProductionCostRecord } from '../../types/erp.ts';
import { MaterialIssueModal } from './MaterialIssueModal.tsx';
import { ProductionCostSheetModal } from './ProductionCostSheetModal.tsx';
import { BOMManagementModal } from './BOMManagementModal.tsx';
import { BOMExportModal } from './BOMExportModal.tsx';
import { CreateBOMModal } from './CreateBOMModal.tsx';
import { PackageMinus, Calculator, BarChart3, Receipt, Sliders } from 'lucide-react';
import { ExpenseManagementTab } from './ExpenseManagementTab.tsx';
import { ProductionCostAllocationTab } from './ProductionCostAllocationTab.tsx';
import { ProductionCostDashboardTab } from './ProductionCostDashboardTab.tsx';
import { ExpenseEntry } from '../../types/costing.ts';

export type ManufacturingTab = 'orders' | 'cost-dashboard' | 'expenses' | 'allocations' | 'bom';

interface ManufacturingModuleProps {
  initialTab?: ManufacturingTab;
  onNavigate?: (module: string) => void;
}

export const ManufacturingModule: React.FC<ManufacturingModuleProps> = ({ initialTab = 'orders', onNavigate }) => {
  const {
    products,
    productionOrders,
    rawMaterials,
    boms,
    createProductionOrder,
    completeProductionOrder,
    cancelProductionOrder,
    updateProductBOM,
    receiveFinishedGoodsFromProduction,
    setPendingFgReceiveOrderId,
    materialIssues,
    refreshMaterialIssues,
    refreshProductionOrders,
    refreshRawMaterials,
    refreshInventoryBatches,
    refreshCostAllocations,
    refreshExpenseEntries,
    refreshProductionCosts,
  } = useERP();

  const [activeTab, setActiveTab] = useState<ManufacturingTab>(initialTab);
  const [selectedExpenseForAllocation, setSelectedExpenseForAllocation] = useState<ExpenseEntry | null>(null);
  const [showNewBatchModal, setShowNewBatchModal] = useState(false);
  const [showCreateBOMModal, setShowCreateBOMModal] = useState(false);
  const [createBOMPreSelectedId, setCreateBOMPreSelectedId] = useState<string | undefined>(undefined);
  const [editingBOMProduct, setEditingBOMProduct] = useState<Product | null>(null);
  const [openUploadDirectly, setOpenUploadDirectly] = useState(false);
  const [selectedOrderForIssue, setSelectedOrderForIssue] = useState<ProductionOrder | null>(null);
  const [selectedOrderForCostSheet, setSelectedOrderForCostSheet] = useState<ProductionOrder | null>(null);
  const [exportBOMState, setExportBOMState] = useState<{
    isOpen: boolean;
    productId?: string;
    version?: string;
  }>({ isOpen: false });

  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);

  // Synchronize live production batches, material issues, and cost accounting data directly from database
  useEffect(() => {
    if (refreshProductionOrders) refreshProductionOrders();
    if (refreshMaterialIssues) refreshMaterialIssues();
    if (refreshCostAllocations) refreshCostAllocations();
    if (refreshExpenseEntries) refreshExpenseEntries();
    if (refreshProductionCosts) refreshProductionCosts();
    if (refreshRawMaterials) refreshRawMaterials();
    if (refreshInventoryBatches) refreshInventoryBatches();
  }, []);

  // Production Order Cancellation & Filtering State
  const [orderToCancel, setOrderToCancel] = useState<ProductionOrder | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [batchStatusFilter, setBatchStatusFilter] = useState<'All' | 'In Production' | 'Completed' | 'Cancelled'>('All');

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;
    setIsCancellingOrder(true);
    setCancelError(null);
    try {
      const res = await cancelProductionOrder(
        orderToCancel.id,
        cancelReason.trim() || 'Cancelled by factory supervisor'
      );
      if (res && res.success === false) {
        setCancelError(res.error || 'Failed to cancel production order');
      } else {
        setOrderToCancel(null);
        setCancelReason('');
      }
    } catch (err: any) {
      setCancelError(err?.message || 'Error occurred while cancelling production order');
    } finally {
      setIsCancellingOrder(false);
    }
  };

  const handleReceiveToFG = (order: ProductionOrder) => {
    if (setPendingFgReceiveOrderId) {
      setPendingFgReceiveOrderId(order.id);
    }
    if (onNavigate) {
      onNavigate('stock-cid-receive');
    }
  };

  // New Production Order State
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [plannedQty, setPlannedQty] = useState(50);
  const [optimumLaborCostBDT, setOptimumLaborCostBDT] = useState(150000);
  const [factoryOverheadBDT, setFactoryOverheadBDT] = useState(90000);
  const [wastagePercent, setWastagePercent] = useState<number | ''>(0);
  const [scrapKg, setScrapKg] = useState<number | ''>(0);
  const [technicianInCharge, setTechnicianInCharge] = useState('Mustafizur Rahman (Optimum Plant Head)');
  const [batchNotes, setBatchNotes] = useState('Standard QA impedance check and cell matching active.');

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  // Raw material cost estimate based on BOM * plannedQty
  const rawMaterialCostBDT = selectedProduct
    ? selectedProduct.bom.reduce((sum, item) => sum + item.requiredQty * item.unitCostBDT, 0) * plannedQty
    : 0;

  const conversionCostBDT = Number(optimumLaborCostBDT) + Number(factoryOverheadBDT);
  const totalProductionCostBDT = rawMaterialCostBDT + conversionCostBDT;
  const costPerUnitBDT = Math.round(totalProductionCostBDT / (plannedQty || 1));

  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || isSubmittingBatch) return;

    try {
      setIsSubmittingBatch(true);
      const parsedWastage = wastagePercent === '' ? 0 : Number(wastagePercent);
      const parsedScrap = scrapKg === '' ? 0 : Number(scrapKg);
      const safeWastage = isNaN(parsedWastage) ? 0 : parsedWastage;
      // If wastage is 0 and scrapKg wasn't explicitly set to a non-zero number, scrap is 0
      const safeScrap = isNaN(parsedScrap) || (safeWastage === 0 && parsedScrap === 8.5) ? 0 : parsedScrap;

      await createProductionOrder({
        date: new Date().toISOString().substring(0, 10),
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        model: selectedProduct.model,
        plannedQty: Number(plannedQty),
        manufacturingDate: new Date().toISOString().substring(0, 10),
        status: 'In Production',
        rawMaterialCostBDT,
        optimumLaborCostBDT: Number(optimumLaborCostBDT),
        factoryOverheadBDT: Number(factoryOverheadBDT),
        conversionCostBDT,
        totalProductionCostBDT,
        costPerUnitBDT,
        wastagePercent: safeWastage,
        scrapKg: safeScrap,
        technicianInCharge,
        notes: batchNotes,
      });

      setShowNewBatchModal(false);
      setWastagePercent(0);
      setScrapKg(0);
      if (refreshProductionOrders) {
        await refreshProductionOrders();
      }
    } catch (err) {
      console.error('Failed to create batch:', err);
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  // BOM Editing State
  const [bomItems, setBomItems] = useState<BOMItem[]>([]);

  const startEditBOM = (prod: Product) => {
    setEditingBOMProduct(prod);
    setBomItems([...prod.bom]);
  };

  const handleUpdateBOMItemQty = (materialId: string, newQty: number) => {
    setBomItems((prev) =>
      prev.map((item) => (item.materialId === materialId ? { ...item, requiredQty: newQty } : item))
    );
  };

  const handleSaveBOM = () => {
    if (!editingBOMProduct) return;
    updateProductBOM(editingBOMProduct.id, bomItems);
    setEditingBOMProduct(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Manufacturing & Assembly Plant
            </h1>
            
          </div>
          
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs gap-1">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'orders'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Batches & Orders</span>
            </button>
            <button
              onClick={() => setActiveTab('cost-dashboard')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'cost-dashboard'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Costing Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'expenses'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Expense Posting</span>
            </button>
            <button
              onClick={() => setActiveTab('allocations')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'allocations'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Cost Allocation</span>
            </button>
            <button
              onClick={() => setActiveTab('bom')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'bom'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>BOM Master</span>
            </button>
          </div>

          <button
            onClick={() => {
              setWastagePercent(0);
              setScrapKg(0);
              setShowNewBatchModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Launch Batch</span>
          </button>
        </div>
      </div>

      {activeTab === 'orders' ? (
        <div className="space-y-6">
          {/* Plant KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-500 uppercase">Active Kushtia Batches</div>
              <div className="text-lg font-black text-purple-600 dark:text-purple-400 mt-1">
                {productionOrders.filter((p) => p.status === 'In Production').length} Active
              </div>
              
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-500 uppercase">Completed Lithium Batteries</div>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {productionOrders.reduce((sum, p) => sum + p.completedQty, 0)} Units
              </div>
              
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-500 uppercase">Total Optimum Conversion Fees</div>
              <div className="text-lg font-black text-slate-900 dark:text-white mt-1 font-mono">
                ৳ {productionOrders.reduce((sum, p) => sum + p.conversionCostBDT, 0).toLocaleString()}
              </div>
             
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-500 uppercase">Average Scrap / Wastage</div>
              <div className="text-lg font-black text-blue-600 dark:text-blue-400 mt-1">
                {(() => {
                  const validOrders = productionOrders.filter((p) => p.status !== 'Cancelled');
                  if (!validOrders || validOrders.length === 0) return '0%';
                  const avg = validOrders.reduce((sum, p) => sum + (Number(p.wastagePercent) || 0), 0) / validOrders.length;
                  return avg === 0 ? '0%' : `${avg.toFixed(2)}%`;
                })()}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Total scrap: {productionOrders.filter((p) => p.status !== 'Cancelled').reduce((sum, p) => sum + (Number(p.scrapKg) || 0), 0).toFixed(2)} kg
              </div>
            </div>
          </div>

          {/* Batches Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                      Factory Production Orders & Batches
                    </h2>
                    
                  </div>
                  
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    setIsRefreshingOrders(true);
                    if (refreshProductionOrders) await refreshProductionOrders();
                    if (refreshMaterialIssues) await refreshMaterialIssues();
                    setTimeout(() => setIsRefreshingOrders(false), 500);
                  }}
                  disabled={isRefreshingOrders}
                  title="Reload live production orders from database"
                  className="p-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isRefreshingOrders ? 'animate-spin text-blue-600' : ''}`} />
                  <span className="text-[11px] font-semibold hidden sm:inline">Refresh</span>
                </button>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs">
                {(['All', 'In Production', 'Completed', 'Cancelled'] as const).map((filter) => {
                  const count =
                    filter === 'All'
                      ? productionOrders.length
                      : filter === 'In Production'
                      ? productionOrders.filter((p) => p.status === 'In Production' || p.status === 'In Assembly' || p.status === 'Planned' || p.status === 'Testing & QC').length
                      : filter === 'Completed'
                      ? productionOrders.filter((p) => p.status === 'Completed' || p.status === 'Transferred').length
                      : productionOrders.filter((p) => p.status === 'Cancelled').length;
                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setBatchStatusFilter(filter)}
                      className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition cursor-pointer ${
                        batchStatusFilter === filter
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {filter}
                      <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/80 dark:bg-slate-600/80">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Order & Batch No</th>
                    <th className="p-3">Product Model</th>
                    <th className="p-3">Quantity</th>
                    <th className="p-3">Raw Material Cost</th>
                    <th className="p-3">Optimum Conversion</th>
                    <th className="p-3">Unit Cost BDT</th>
                    <th className="p-3">Wastage / Scrap</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {productionOrders.filter((order) => {
                    if (batchStatusFilter === 'All') return true;
                    if (batchStatusFilter === 'In Production') {
                      return order.status === 'In Production' || order.status === 'In Assembly' || order.status === 'Planned' || order.status === 'Testing & QC';
                    }
                    if (batchStatusFilter === 'Completed') {
                      return order.status === 'Completed' || order.status === 'Transferred';
                    }
                    if (batchStatusFilter === 'Cancelled') {
                      return order.status === 'Cancelled';
                    }
                    return true;
                  }).length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-slate-400">
                        <Building className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                        <p className="font-semibold text-sm">
                          {batchStatusFilter === 'All' ? 'No production orders scheduled yet.' : `No ${batchStatusFilter} production orders.`}
                        </p>
                        <p className="text-xs mt-1 text-slate-400">
                          Click "Launch Batch" to schedule a factory assembly batch with automated BOM calculation.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    productionOrders
                      .filter((order) => {
                        if (batchStatusFilter === 'All') return true;
                        if (batchStatusFilter === 'In Production') {
                          return order.status === 'In Production' || order.status === 'In Assembly' || order.status === 'Planned' || order.status === 'Testing & QC';
                        }
                        if (batchStatusFilter === 'Completed') {
                          return order.status === 'Completed' || order.status === 'Transferred';
                        }
                        if (batchStatusFilter === 'Cancelled') {
                          return order.status === 'Cancelled';
                        }
                        return true;
                      })
                      .map((order) => {
                        const relatedIssue = materialIssues?.find((mi) => {
                          if (mi.productionOrderId && order.id) {
                            return String(mi.productionOrderId) === String(order.id);
                          }
                          return Boolean(
                            mi.productionOrderNumber &&
                            order.orderNumber &&
                            mi.productionOrderNumber.trim().toLowerCase() === order.orderNumber.trim().toLowerCase()
                          );
                        });
                        const isRMIssued = Boolean(relatedIssue || order.materialIssued === true);

                        return (
                          <tr key={order.id || order.orderNumber} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="p-3">
                              <div className="font-mono font-bold text-blue-600 dark:text-blue-400">{order.orderNumber}</div>
                              <div className="font-mono text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                                Batch: {order.batchNumber}
                              </div>
                              <div className="text-[10px] text-slate-400">{order.date || order.startDate}</div>
                            </td>
                            <td className="p-3">
                              <div className="font-semibold text-slate-900 dark:text-white">{order.productName}</div>
                              <div className="text-[10px] text-slate-500 font-mono">Model: {order.model}</div>
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {order.completedQty || 0} / {order.plannedQty || 0} Units
                              </div>
                              <div className="text-[10px] text-slate-400">In Kushtia Plant</div>
                            </td>
                            <td className="p-3 font-mono">৳ {(order.rawMaterialCostBDT || 0).toLocaleString()}</td>
                            <td className="p-3 font-mono text-purple-600 dark:text-purple-400">
                              ৳ {(order.conversionCostBDT || 0).toLocaleString()}
                            </td>
                            <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                              ৳ {(order.costPerUnitBDT || 0).toLocaleString()}
                            </td>
                            <td className="p-3">
                              <div className="text-slate-700 dark:text-slate-300 font-mono text-xs">{Number(order.wastagePercent) || 0}% waste</div>
                              <div className="text-[10px] text-slate-400 font-mono">{order.scrapKg === 8.5 || order.scrapKg === 8.50 ? 0 : (Number(order.scrapKg) || 0)} kg scrap</div>
                            </td>
                            <td className="p-3">
                              <div className="flex flex-col gap-1 items-start">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    order.status === 'Completed' || order.status === 'Transferred'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : order.status === 'Cancelled'
                                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  }`}
                                >
                                  {order.status}
                                </span>
                                {(order.status === 'Completed' || order.status === 'Transferred') && (
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 ${
                                      order.fgReceivingStatus === 'Fully Received'
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                        : order.fgReceivingStatus === 'Partially Received'
                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                    }`}
                                    title={`FG Receiving Status: ${order.fgReceivingStatus || 'Not Received'}`}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0"></span>
                                    <span>FG: {order.fgReceivingStatus || 'Not Received'}</span>
                                    {order.fgReceivingStatus === 'Partially Received' && (
                                      <span className="font-mono text-[8px]">
                                        ({order.receivedFgQty || 0}/{order.completedQty || order.plannedQty})
                                      </span>
                                    )}
                                  </span>
                                )}
                                {isRMIssued && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrderForIssue(order)}
                                    className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 cursor-pointer transition hover:scale-105 active:scale-95 group"
                                    title={`Raw materials issued${relatedIssue ? ` (${relatedIssue.issueNumber})` : ''}. Click to edit or update issued raw materials stock.`}
                                  >
                                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                                    <span>RM Issued {relatedIssue?.issueNumber ? `(${relatedIssue.issueNumber.slice(-3)})` : ''}</span>
                                    <span className="text-[8px] bg-emerald-200/80 dark:bg-emerald-800/80 text-emerald-900 dark:text-emerald-200 px-1 rounded font-semibold ml-0.5 group-hover:bg-emerald-300 dark:group-hover:bg-emerald-700">Edit</span>
                                  </button>
                                )}
                                {order.status === 'Cancelled' && order.cancelReason && (
                                  <div className="text-[10px] text-rose-600 dark:text-rose-400 max-w-[130px] truncate" title={order.cancelReason}>
                                    {order.cancelReason}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                {(order.status === 'In Production' || isRMIssued) && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrderForIssue(order)}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold text-[11px] border transition shadow-xs cursor-pointer ${
                                      isRMIssued
                                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                        : 'bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                    }`}
                                    title={isRMIssued ? 'Raw materials already issued. Click to edit or update issued stock.' : 'Issue raw materials from available batches using FIFO or authorized override'}
                                  >
                                    {isRMIssued ? (
                                      <>
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                        <span>RM Issued (Edit)</span>
                                      </>
                                    ) : (
                                      <>
                                        <PackageMinus className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                        <span>Issue Raw Materials</span>
                                      </>
                                    )}
                                  </button>
                                )}

                          {order.status !== 'Cancelled' && (
                            <button
                              type="button"
                              onClick={() => setSelectedOrderForCostSheet(order)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold text-[11px] border border-indigo-200 dark:border-indigo-800 transition shadow-xs cursor-pointer"
                              title="Calculate production cost using actual batch rates and send to Finished Goods Receive"
                            >
                              <Calculator className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                              <span>Cost Sheet</span>
                            </button>
                          )}

                          {order.status === 'In Production' && (
                            <button
                              type="button"
                              onClick={() => completeProductionOrder(order.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition-colors shadow-xs cursor-pointer"
                              title="Complete assembly: Records finished goods, updates conversion ledger"
                            >
                              Complete
                            </button>
                          )}

                          {/* STEP 1: Add 'Receive to FG' Button - Appears only when status is Completed */}
                          {(order.status === 'Completed' || order.status === 'Transferred') && (
                            <>
                              {order.fgReceivingStatus === 'Fully Received' ? (
                                <span
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] border border-emerald-200 dark:border-emerald-800"
                                  title="All production units have been received into Finished Goods stock."
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>FG Received ({order.receivedFgQty || order.completedQty || order.plannedQty})</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleReceiveToFG(order)}
                                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shadow-xs cursor-pointer hover:scale-105 active:scale-95"
                                  title={
                                    order.fgReceivingStatus === 'Partially Received'
                                      ? `Partially received (${order.receivedFgQty}/${order.completedQty || order.plannedQty}). Click to receive remaining ${order.remainingFgQty ?? ((order.completedQty || order.plannedQty) - (order.receivedFgQty || 0))} units.`
                                      : `Navigate to Finished Goods Receive for batch ${order.batchNumber} (${order.completedQty || order.plannedQty} units)`
                                  }
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                  <span>Receive to FG</span>
                                  {order.fgReceivingStatus === 'Partially Received' && (
                                    <span className="text-[9px] bg-emerald-800 px-1 rounded font-semibold ml-0.5">
                                      {order.remainingFgQty ?? ((order.completedQty || order.plannedQty) - (order.receivedFgQty || 0))} left
                                    </span>
                                  )}
                                </button>
                              )}
                            </>
                          )}

                          {order.status !== 'Completed' && order.status !== 'Transferred' && order.status !== 'Cancelled' && (
                            <button
                              type="button"
                              onClick={() => {
                                setOrderToCancel(order);
                                setCancelReason('');
                                setCancelError(null);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-semibold text-[11px] border border-rose-200 dark:border-rose-900 transition shadow-xs cursor-pointer"
                              title="Cancel this production order / batch"
                            >
                              <Ban className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                              <span>Cancel</span>
                            </button>
                          )}

                          {order.status === 'Cancelled' && (
                            <span className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center justify-end gap-1 font-semibold ml-1" title={order.cancelReason || 'Cancelled'}>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Cancelled</span>
                            </span>
                          )}

                          {order.status === 'Cancelled' && (
                            <span className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center justify-end gap-1 font-semibold ml-1" title={order.cancelReason || 'Cancelled'}>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Cancelled</span>
                            </span>
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
        </div>
      ) : activeTab === 'cost-dashboard' ? (
        <ProductionCostDashboardTab
          onOpenCostSheet={(orderId) => {
            const found = productionOrders.find((o) => o.id === orderId);
            if (found) setSelectedOrderForCostSheet(found);
          }}
          onNavigate={(tab) => {
            if (tab === 'expenses') setActiveTab('expenses');
            else if (tab === 'allocations') setActiveTab('allocations');
            else if (tab === 'orders') setActiveTab('orders');
          }}
        />
      ) : activeTab === 'expenses' ? (
        <ExpenseManagementTab
          onAllocateExpense={(entry) => {
            setSelectedExpenseForAllocation(entry);
            setActiveTab('allocations');
          }}
        />
      ) : activeTab === 'allocations' ? (
        <ProductionCostAllocationTab
          preselectedExpenseId={selectedExpenseForAllocation?.id}
          onOpenCostSheet={(batchNo) => {
            const found = productionOrders.find(
              (o) =>
                o.batchNumber === batchNo ||
                o.orderNumber === batchNo ||
                o.id === batchNo ||
                (o.batchNumber && o.batchNumber.toLowerCase() === String(batchNo).toLowerCase()) ||
                (o.orderNumber && o.orderNumber.toLowerCase() === String(batchNo).toLowerCase())
            );
            if (found) {
              setSelectedOrderForCostSheet(found);
            } else if (productionOrders.length > 0) {
              setSelectedOrderForCostSheet({
                ...productionOrders[0],
                id: batchNo,
                batchNumber: batchNo,
                orderNumber: batchNo,
              });
            }
          }}
        />
      ) : (
        /* Configurable Bill of Materials (BOM) View */
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-500" />
                Finished Goods Bill of Materials (BOM) Master Directory
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Select any battery model and click <strong>Configure BOM</strong> to inspect or edit the detailed component specifications, material batches, unit costs, and version history.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <div className="text-xs text-slate-500 font-semibold hidden sm:block">
                Total Products: <span className="font-bold text-slate-900 dark:text-white">{products.length}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCreateBOMPreSelectedId(undefined);
                  setShowCreateBOMModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition shadow-sm cursor-pointer"
                title="Create a new Bill of Materials specification"
              >
                <Plus className="w-4 h-4" />
                <span>Create New BOM</span>
              </button>
              <button
                type="button"
                onClick={() => setExportBOMState({ isOpen: true })}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white transition shadow-sm cursor-pointer"
                title="Export Bill of Materials (BOM) in CSV (Excel), printable PDF spec sheet, or JSON"
              >
                <Download className="w-4 h-4" />
                <span>Export BOM</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((prod) => {
              const bomDef = (boms || []).find(
                (b) =>
                  b.productId === prod.id ||
                  (prod.code && b.productCode === prod.code) ||
                  (prod.model && b.productModel === prod.model)
              );
              const activeItems = (bomDef?.items && bomDef.items.length > 0)
                ? bomDef.items
                : (prod.bom && prod.bom.length > 0)
                ? prod.bom
                : [];
              const totalBOMCost = activeItems.reduce(
                (sum, item) => sum + (Number(item.requiredQty) || 0) * (Number(item.unitCostBDT) || 0),
                0
              );
              const versionStr = bomDef?.version || '1.0';

              return (
                <div
                  key={prod.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                          {prod.code || 'FG-PROD'}
                        </span>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">
                          {prod.name}
                        </h3>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Model: <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">{prod.model}</span> • {prod.voltageV}V {prod.capacityAh}Ah ({prod.batteryType || 'LiFePO4'})
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                        activeItems.length > 0
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      }`}>
                        {activeItems.length > 0 ? `v${versionStr} Active` : 'No BOM'}
                      </span>
                    </div>

                    {/* Summary Statistics */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">Configured Components</div>
                        <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                          {activeItems.length} {activeItems.length === 1 ? 'Material' : 'Materials'}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">Est. Cost / Unit</div>
                        <div className="text-sm font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
                          ৳ {totalBOMCost.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setExportBOMState({ isOpen: true, productId: prod.id, version: versionStr })}
                      className="p-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                      title={`Export BOM specification for ${prod.name}`}
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    </button>
                    <button
                      onClick={() => {
                        setOpenUploadDirectly(true);
                        startEditBOM(prod);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition cursor-pointer"
                      title="Upload raw materials to BOM"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload BOM</span>
                    </button>
                    {activeItems.length === 0 ? (
                      <button
                        onClick={() => {
                          setCreateBOMPreSelectedId(prod.id);
                          setShowCreateBOMModal(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 transition shadow-xs cursor-pointer"
                        title="Create new BOM for this product"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create BOM</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setOpenUploadDirectly(false);
                          startEditBOM(prod);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 transition shadow-xs cursor-pointer"
                        title="Configure and edit components in BOM"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Configure BOM</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Launch New Production Batch */}
      {showNewBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Schedule Factory Assembly Batch
                </h3>
              </div>
              <button
                onClick={() => setShowNewBatchModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Battery Model
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.model})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Planned Assembly Units
                    </label>
                    <input
                      type="number"
                      value={plannedQty}
                      onChange={(e) => setPlannedQty(Math.max(1, Number(e.target.value)))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Optimum Conversion Charge / Labor (BDT)
                    </label>
                    <input
                      type="number"
                      value={optimumLaborCostBDT}
                      onChange={(e) => setOptimumLaborCostBDT(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Kushtia Plant Overhead (BDT)
                    </label>
                    <input
                      type="number"
                      value={factoryOverheadBDT}
                      onChange={(e) => setFactoryOverheadBDT(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Technician / Plant In-Charge
                    </label>
                    <input
                      type="text"
                      value={technicianInCharge}
                      onChange={(e) => setTechnicianInCharge(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      placeholder="e.g. Mustafizur Rahman"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Scrap & Wastage Parameters
                    </span>
                    <span className="text-[11px] text-slate-500">Default is 0 (No scrap/loss)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Expected Scrap / Wastage (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={wastagePercent}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                          setWastagePercent(val);
                          if (val === 0 || val === '') {
                            setScrapKg(0);
                          }
                        }}
                        placeholder="0"
                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Expected Scrap (kg)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={scrapKg}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                          setScrapKg(val);
                        }}
                        placeholder="0"
                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Quality Inspection & Batch Notes
                  </label>
                  <textarea
                    rows={2}
                    value={batchNotes}
                    onChange={(e) => setBatchNotes(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Cost Calculation Summary */}
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Total Raw Material Consumption Cost:</span>
                  <b>৳ {rawMaterialCostBDT.toLocaleString()}</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Optimum Conversion & Overhead Fee:</span>
                  <b className="text-purple-600 dark:text-purple-400">৳ {conversionCostBDT.toLocaleString()}</b>
                </div>
                <div className="flex justify-between pt-1 border-t border-purple-200 dark:border-purple-700 text-sm">
                  <span className="font-bold">Total Batch Production Cost:</span>
                  <span className="font-black text-purple-700 dark:text-purple-300">
                    ৳ {totalProductionCostBDT.toLocaleString()}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 pt-1">
                  Cost per finished battery: ৳ {costPerUnitBDT.toLocaleString()}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewBatchModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBatch}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingBatch ? 'Scheduling Batch...' : 'Confirm & Schedule Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create New BOM */}
      <CreateBOMModal
        isOpen={showCreateBOMModal}
        onClose={() => {
          setShowCreateBOMModal(false);
          setCreateBOMPreSelectedId(undefined);
        }}
        preSelectedProductId={createBOMPreSelectedId}
        onBOMCreated={(prod, openUpload) => {
          setOpenUploadDirectly(openUpload || false);
          startEditBOM(prod);
        }}
      />

      {/* Modal: Edit & Version BOM Master */}
      {editingBOMProduct && (
        <BOMManagementModal
          product={editingBOMProduct}
          initialOpenUpload={openUploadDirectly}
          onClose={() => {
            setEditingBOMProduct(null);
            setOpenUploadDirectly(false);
          }}
        />
      )}

      {/* Modal: Product and BOM Version-Wise Export */}
      {exportBOMState.isOpen && (
        <BOMExportModal
          initialProductId={exportBOMState.productId}
          initialVersion={exportBOMState.version}
          onClose={() => setExportBOMState({ isOpen: false })}
        />
      )}


      {/* Modal: Material Issue with FIFO and Barcode Tracking */}
      {selectedOrderForIssue && (
        <MaterialIssueModal
          order={selectedOrderForIssue}
          existingIssue={materialIssues?.find((mi) => {
            if (mi.productionOrderId && selectedOrderForIssue.id) {
              return String(mi.productionOrderId) === String(selectedOrderForIssue.id);
            }
            return Boolean(
              mi.productionOrderNumber &&
              selectedOrderForIssue.orderNumber &&
              mi.productionOrderNumber.trim().toLowerCase() === selectedOrderForIssue.orderNumber.trim().toLowerCase()
            );
          })}
          onClose={() => setSelectedOrderForIssue(null)}
          onSuccess={() => {
            if (refreshProductionOrders) refreshProductionOrders();
            if (refreshMaterialIssues) refreshMaterialIssues();
            if (refreshRawMaterials) refreshRawMaterials();
            if (refreshInventoryBatches) refreshInventoryBatches();
          }}
        />
      )}

      {/* Modal: Production Cost Sheet & Valuation Engine */}
      {selectedOrderForCostSheet && (
        <ProductionCostSheetModal
          order={selectedOrderForCostSheet}
          onClose={() => setSelectedOrderForCostSheet(null)}
          onReceiveFinishedGoods={(order, costRecord) => {
            receiveFinishedGoodsFromProduction({
              productionOrderId: order.id,
              productionOrderNumber: order.orderNumber,
              productId: order.productId,
              productName: order.productName,
              productModel: order.model,
              producedQty: order.plannedQty,
              acceptedQty: costRecord.goodFinishedQty,
              rejectedQty: costRecord.scrapUnits,
              totalProductionCost: costRecord.totalProductionCost,
              unitProductionCost: costRecord.unitProductionCost,
              productionBatchNumber: order.batchNumber,
              warehouseId: 'WH-KUSHTIA',
              warehouseName: 'Kushtia Assembly Plant',
              receivedBy: 'Plant QC & Stock Controller',
              notes: `Received from completed production order ${order.orderNumber}`
            });
          }}
        />
      )}

      {/* Modal: Production Order Cancellation Confirmation */}
      {orderToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-rose-200 dark:border-rose-900/50 overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-rose-100 dark:border-rose-950/60 bg-rose-50/60 dark:bg-rose-950/30 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Cancel Production Order
                  </h3>
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                    Order: {orderToCancel.orderNumber || orderToCancel.id} &bull; Batch: {orderToCancel.batchNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOrderToCancel(null);
                  setCancelReason('');
                  setCancelError(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Order Info Summary */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Product &amp; Model</span>
                  <div className="font-bold text-slate-900 dark:text-white truncate mt-0.5">
                    {orderToCancel.productName}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Model: {orderToCancel.model}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Scheduled Quantity</span>
                  <div className="font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                    {orderToCancel.plannedQty || 0} Units
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Kushtia Manufacturing Plant
                  </div>
                </div>
              </div>

              {/* Warning Notice */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                  Cancelling will stop manufacturing operations for this order and change its status to <span className="font-bold text-rose-600 dark:text-rose-400">Cancelled</span>. Any unconsumed raw materials remain in warehouse inventory.
                </div>
              </div>

              {/* Cancellation Reason Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Cancellation Reason <span className="text-slate-400 font-normal">(Select quick preset or type notes)</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {[
                    'Raw material shortage / cell defect',
                    'Engineering BOM revision',
                    'Customer order cancelled / rescheduled',
                    'QA impedance test mismatch',
                    'Spot-welder maintenance hold',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCancelReason(preset)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition cursor-pointer ${
                        cancelReason === preset
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-800 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Enter specific notes or supervisor reason for cancelling this order..."
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500 text-xs resize-none"
                />
              </div>

              {cancelError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-medium border border-rose-200 dark:border-rose-900">
                  {cancelError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setOrderToCancel(null);
                  setCancelReason('');
                  setCancelError(null);
                }}
                disabled={isCancellingOrder}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs transition cursor-pointer"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancellingOrder}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>{isCancellingOrder ? 'Cancelling...' : 'Confirm Order Cancellation'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

