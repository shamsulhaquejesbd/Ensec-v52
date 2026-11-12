import React, { useState, useMemo } from 'react';
import {
  PackageCheck,
  PlusCircle,
  Trash2,
  Barcode as BarcodeIcon,
  Printer,
  Search,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  Warehouse as WarehouseIcon,
  Ship,
  Boxes,
  RotateCcw,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  Eye,
  FileSpreadsheet,
  UploadCloud,
  Download,
  Database,
  RefreshCw,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useERP } from '../../context/ERPContext.tsx';
import { RawMaterialReceipt, RawMaterialReceiptItem, InventoryBatch } from '../../types/erp.ts';
import { BarcodeDisplay } from './BarcodeDisplay.tsx';
import { BatchBarcodeScannerModal } from './BatchBarcodeScannerModal.tsx';
import { BulkGRNUploadModal } from './BulkGRNUploadModal.tsx';

interface RawMaterialReceivePageProps {
  onNavigate?: (module: string) => void;
}

interface NewReceiptRow {
  materialId: string;
  orderedQty: number;
  receivedQty: number;
  unitPurchaseRate: number;
  discount: number;
  additionalCosts: number;
  batchNumber: string;
  batchBarcode: string;
  remarks: string;
}

export const RawMaterialReceivePage: React.FC<RawMaterialReceivePageProps> = ({ onNavigate }) => {
  const {
    rawMaterials,
    suppliers,
    warehouses,
    importOrders,
    rawMaterialReceipts,
    inventoryBatches,
    addRawMaterialReceipt,
    currentUser,
    refreshRawMaterials,
    refreshRawMaterialReceipts,
    syncPendingReceiptsToSupabase,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'create' | 'register'>('create');
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSupabaseSync = async () => {
    setIsSyncing(true);
    try {
      if (syncPendingReceiptsToSupabase) {
        const res = await syncPendingReceiptsToSupabase();
        setFeedback({
          type: 'success',
          message: `Supabase Cloud Sync: ${res.message || 'Data verified and updated with Supabase database.'}`,
        });
      } else {
        await refreshRawMaterials?.();
        await refreshRawMaterialReceipts?.();
        setFeedback({
          type: 'success',
          message: 'Supabase Cloud Sync: Refreshed raw materials and receipts from Supabase.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Sync warning: ${err?.message || 'Failed to sync with Supabase'}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Active raw materials from Master Registry
  const activeRawMaterials = useMemo(
    () => rawMaterials.filter((m) => m.status !== 'Inactive'),
    [rawMaterials]
  );

  // Generate and download dynamic Sample Excel Template populated with all active materials from database
  const handleDownloadSampleExcelTemplate = () => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const dateStr = now.toISOString().slice(0, 10);

    const data = activeRawMaterials.map((mat, idx) => {
      const seq = String(idx + 1).padStart(3, '0');
      const rate = Number(mat.lastPurchaseUnitCostBDT || mat.standardCostBDT || 0);
      const stock = Number(mat.stockKushtia ?? mat.totalAvailableStock ?? 0);

      return {
        'Material Code': mat.code || '',
        'Material Name': mat.name || '',
        'Category': mat.category || 'General',
        'Unit of Measure (UOM)': mat.unit || 'Pieces',
        'Current Warehouse Stock': stock,
        'Ordered Quantity': 0,
        'Receive Quantity (ENTER QTY)': 0,
        'Unit Purchase Rate (BDT)': rate,
        'Discount (BDT)': 0,
        'Additional Costs (BDT)': 0,
        'Batch Number': `RM-BATCH-${yearMonth}-${seq}`,
        'Batch Barcode': `BC-BATCH-${yearMonth.slice(2)}-${seq}`,
        'Remarks / Inspection Notes': 'Grade A inspected upon inward gate receipt.',
        'Material ID (System ID)': mat.id,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);

    worksheet['!cols'] = [
      { wch: 16 }, // Material Code
      { wch: 38 }, // Material Name
      { wch: 18 }, // Category
      { wch: 14 }, // UOM
      { wch: 22 }, // Current Stock
      { wch: 18 }, // Ordered Qty
      { wch: 30 }, // Receive Quantity (ENTER QTY)
      { wch: 24 }, // Unit Purchase Rate (BDT)
      { wch: 15 }, // Discount (BDT)
      { wch: 20 }, // Additional Costs (BDT)
      { wch: 24 }, // Batch Number
      { wch: 22 }, // Batch Barcode
      { wch: 36 }, // Remarks
      { wch: 20 }, // Material ID
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Active Raw Materials GRN');
    XLSX.writeFile(workbook, `Ensec_Active_Raw_Materials_GRN_Template_${dateStr}.xlsx`);
  };

  // Handle items applied from Bulk GRN Upload modal
  const handleApplyBulkUploadItems = (newItems: NewReceiptRow[], mode: 'replace' | 'append') => {
    if (mode === 'replace') {
      setItems(newItems);
    } else {
      setItems((prev) => [...prev, ...newItems]);
    }
    setFeedback({
      type: 'success',
      message: `Successfully loaded ${newItems.length} consignment item${newItems.length === 1 ? '' : 's'} from Excel upload into the GRN receipt table. Review details and click Confirm Receipt to post to inventory.`,
    });
  };

  // Form Header States
  const defaultWh = warehouses.find((w) => w.id === 'wh-kushtia' || w.name.includes('Kushtia')) || warehouses[0];
  const [warehouseId, setWarehouseId] = useState(defaultWh?.id || '');
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [poReference, setPoReference] = useState(importOrders[0]?.poNumber || 'PO-IMP-2026-005');
  const [receiveDate, setReceiveDate] = useState(new Date().toISOString().substring(0, 10));
  const [receiveType, setReceiveType] = useState<'Local' | 'Import'>('Local');
  const [invoiceReference, setInvoiceReference] = useState('INV-CATL-2026-8910');
  const [remarks, setRemarks] = useState('Standard incoming QA impedance check and cell matching active.');

  // Auto GRN number generator
  const currentYear = new Date().getFullYear();
  const [grnNumber, setGrnNumber] = useState(`GRN-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`);

  // Initial Item Row
  const initialRow = (): NewReceiptRow => {
    const defaultMat = rawMaterials[0];
    const yearMonth = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const randSeq = Math.floor(100 + Math.random() * 900);
    return {
      materialId: defaultMat?.id || '',
      orderedQty: 500,
      receivedQty: 500,
      unitPurchaseRate: defaultMat?.standardCostBDT || 3850,
      discount: 0,
      additionalCosts: 0,
      batchNumber: `RM-BATCH-${yearMonth}-${randSeq}`,
      batchBarcode: `BC-BATCH-${yearMonth.slice(2)}-${randSeq}`,
      remarks: 'Grade A inspected upon inward gate receipt.',
    };
  };

  const [items, setItems] = useState<NewReceiptRow[]>([initialRow()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Post-Confirm Voucher Modal State
  const [confirmedReceipt, setConfirmedReceipt] = useState<RawMaterialReceipt | null>(null);
  const [createdBatches, setCreatedBatches] = useState<InventoryBatch[]>([]);
  const [selectedReceiptForView, setSelectedReceiptForView] = useState<RawMaterialReceipt | null>(null);

  // Add Item Row
  const handleAddItemRow = () => {
    const yearMonth = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const randSeq = Math.floor(100 + Math.random() * 900);
    const nextMat = rawMaterials[items.length % rawMaterials.length] || rawMaterials[0];
    setItems((prev) => [
      ...prev,
      {
        materialId: nextMat?.id || '',
        orderedQty: 100,
        receivedQty: 100,
        unitPurchaseRate: nextMat?.standardCostBDT || 3500,
        discount: 0,
        additionalCosts: 0,
        batchNumber: `RM-BATCH-${yearMonth}-${randSeq}-${prev.length + 1}`,
        batchBarcode: `BC-BATCH-${yearMonth.slice(2)}-${randSeq}${prev.length + 1}`,
        remarks: '',
      },
    ]);
  };

  // Remove Item Row
  const handleRemoveRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Update Item Row Field
  const handleRowChange = (index: number, field: keyof NewReceiptRow, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      const target = { ...copy[index], [field]: value };

      // If material changed, auto populate unit rate default
      if (field === 'materialId') {
        const mat = rawMaterials.find((m) => m.id === value);
        if (mat) {
          target.unitPurchaseRate = mat.lastPurchaseUnitCostBDT || mat.standardCostBDT || 3850;
        }
      }
      copy[index] = target;
      return copy;
    });
  };

  // Calculation summaries
  const totals = useMemo(() => {
    let orderedQty = 0;
    let receivedQty = 0;
    let grossValue = 0;
    let totalDiscount = 0;
    let totalAdditionalCosts = 0;
    let totalPurchaseValue = 0;

    items.forEach((item) => {
      orderedQty += Number(item.orderedQty) || 0;
      receivedQty += Number(item.receivedQty) || 0;
      const rowGross = (Number(item.receivedQty) || 0) * (Number(item.unitPurchaseRate) || 0);
      const rowDiscount = Number(item.discount) || 0;
      const rowCosts = Number(item.additionalCosts) || 0;
      const rowTotal = rowGross - rowDiscount + rowCosts;

      grossValue += rowGross;
      totalDiscount += rowDiscount;
      totalAdditionalCosts += rowCosts;
      totalPurchaseValue += rowTotal;
    });

    return {
      orderedQty,
      receivedQty,
      grossValue,
      totalDiscount,
      totalAdditionalCosts,
      totalPurchaseValue,
    };
  }, [items]);

  // Submit Receipt (GRN Confirmation)
  const handleConfirmReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    // Check invalid quantities
    for (const item of items) {
      if (item.receivedQty <= 0) {
        setFeedback({ type: 'error', message: 'Received quantity must be greater than zero for all items.' });
        return;
      }
      if (item.unitPurchaseRate <= 0) {
        setFeedback({ type: 'error', message: 'Unit purchase rate must be greater than zero.' });
        return;
      }
    }

    setIsSubmitting(true);
    setFeedback(null);

    const selectedWh = warehouses.find((w) => w.id === warehouseId) || defaultWh;
    const selectedSup = suppliers.find((s) => s.id === supplierId) || suppliers[0];

    try {
      const processedItems: RawMaterialReceiptItem[] = items.map((row, idx) => {
        const mat = rawMaterials.find((m) => m.id === row.materialId) || rawMaterials[0];
        const rowGross = row.receivedQty * row.unitPurchaseRate;
        const rowTotal = rowGross - (row.discount || 0) + (row.additionalCosts || 0);

        return {
          id: `grni-temp-${idx}`,
          materialId: mat.id,
          materialCode: mat.code,
          materialName: mat.name,
          unit: mat.unit,
          orderedQty: Number(row.orderedQty),
          receivedQty: Number(row.receivedQty),
          unitPurchaseRate: Number(row.unitPurchaseRate),
          discount: Number(row.discount) || 0,
          additionalCosts: Number(row.additionalCosts) || 0,
          totalPurchaseValue: rowTotal,
          batchNumber: row.batchNumber,
          batchBarcode: row.batchBarcode,
          warehouseId: selectedWh.id,
          remarks: row.remarks,
        };
      });

      const res = await addRawMaterialReceipt({
        grnNumber: grnNumber.trim(),
        type: receiveType,
        poReference: poReference.trim(),
        supplierId: selectedSup.id,
        supplierName: selectedSup.name,
        warehouseId: selectedWh.id,
        warehouseName: selectedWh.name,
        receiveDate,
        invoiceReference: invoiceReference.trim(),
        remarks: remarks.trim(),
        items: processedItems,
        totalOrderedQty: totals.orderedQty,
        totalReceivedQty: totals.receivedQty,
        totalGrossValue: totals.grossValue,
        totalDiscount: totals.totalDiscount,
        totalAdditionalCosts: totals.totalAdditionalCosts,
        totalPurchaseValue: totals.totalPurchaseValue,
        status: 'Verified & Posted',
        receivedBy: currentUser.name,
      });

      if (res.success) {
        setCreatedBatches(res.batches);
        const receiptObject: RawMaterialReceipt = {
          id: `grn-${Date.now()}`,
          grnNumber: res.grnNumber,
          type: receiveType,
          poReference,
          supplierId: selectedSup.id,
          supplierName: selectedSup.name,
          warehouseId: selectedWh.id,
          warehouseName: selectedWh.name,
          receiveDate,
          invoiceReference,
          remarks,
          items: processedItems,
          totalOrderedQty: totals.orderedQty,
          totalReceivedQty: totals.receivedQty,
          totalGrossValue: totals.grossValue,
          totalDiscount: totals.totalDiscount,
          totalAdditionalCosts: totals.totalAdditionalCosts,
          totalPurchaseValue: totals.totalPurchaseValue,
          status: 'Verified & Posted',
          receivedBy: currentUser.name,
          createdAt: new Date().toISOString(),
        };
        setConfirmedReceipt(receiptObject);
        setFeedback({
          type: 'success',
          message: `GRN ${res.grnNumber} confirmed & synced to Supabase! Increased inventory by ${totals.receivedQty} units in Kushtia warehouse and generated ${res.batches.length} unique purchase batches.`,
        });

        // Reset form for next receipt
        setGrnNumber(`GRN-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`);
        setItems([initialRow()]);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to process receipt' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Register Search & Filter
  const [registerSearch, setRegisterSearch] = useState('');
  const [registerTypeFilter, setRegisterTypeFilter] = useState<'ALL' | 'Local' | 'Import'>('ALL');
  const filteredReceipts = useMemo(() => {
    return rawMaterialReceipts.filter((r) => {
      const receiptType = r.type || (r.poReference?.toLowerCase().includes('imp') ? 'Import' : 'Local');
      if (registerTypeFilter !== 'ALL' && receiptType !== registerTypeFilter) {
        return false;
      }
      if (!registerSearch.trim()) return true;
      const q = registerSearch.toLowerCase();
      return (
        r.grnNumber.toLowerCase().includes(q) ||
        r.supplierName.toLowerCase().includes(q) ||
        (r.poReference && r.poReference.toLowerCase().includes(q)) ||
        (r.invoiceReference && r.invoiceReference.toLowerCase().includes(q)) ||
        r.items.some((item) => item.materialName.toLowerCase().includes(q) || item.materialCode.toLowerCase().includes(q))
      );
    });
  }, [rawMaterialReceipts, registerSearch, registerTypeFilter]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-600 text-white flex items-center justify-center shadow-sm">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                RAW MATERIAL RECEIVE (GRN)
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                <Database className="w-2.5 h-2.5 text-emerald-600" />
                Supabase Connected
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualSupabaseSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold shadow-xs hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            title="Sync receipts and raw material stock with Supabase cloud database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Supabase'}</span>
          </button>

          <button
            onClick={() => setShowScannerModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <BarcodeIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Scan Barcode</span>
          </button>

          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              + Create GRN Inward
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              GRN Inward Register ({rawMaterialReceipts.length})
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total GRNs Verified</span>
          <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
            {rawMaterialReceipts.length}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold">100% Inward Accuracy</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Purchase Batches</span>
          <span className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1 block font-mono">
            {inventoryBatches.filter((b) => b.availableQty > 0).length}
          </span>
          <span className="text-[10px] text-slate-400">Barcode tracked</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Inward Value (BDT)</span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block font-mono">
            ৳ {rawMaterialReceipts.reduce((sum, r) => sum + (r.totalPurchaseValue || 0), 0).toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400">Cumulated valuation</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inward Destination</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white mt-1 block truncate">
            {defaultWh?.name || 'Kushtia Manufacturing Plant'}
          </span>
          <span className="text-[10px] text-slate-400">Factory Store Hub</span>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: CREATE NEW RAW MATERIAL RECEIPT */}
      {activeTab === 'create' && (
        <form onSubmit={handleConfirmReceipt} className="space-y-6">
          {/* GRN Primary Metadata Panel */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Goods Received Note (GRN) Details
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">All fields automatically linked to Batch Barcodes</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  GRN Number (Auto Generated) *
                </label>
                <input
                  type="text"
                  required
                  value={grnNumber}
                  onChange={(e) => setGrnNumber(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-amber-600 dark:text-amber-400"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Type (Local / Import) *
                </label>
                <select
                  value={receiveType}
                  onChange={(e) => setReceiveType(e.target.value as 'Local' | 'Import')}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="Local">Local Purchase</option>
                  <option value="Import">Import Consignment</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Purchase Order Reference *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. PO-IMP-2026-004"
                    value={poReference}
                    onChange={(e) => setPoReference(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Supplier / Vendor *
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name} ({sup.country || 'Global'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Receiving Warehouse *
                </label>
                <select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} ({wh.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Receive Date *
                </label>
                <input
                  type="date"
                  required
                  value={receiveDate}
                  onChange={(e) => setReceiveDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Commercial Invoice Ref
                </label>
                <input
                  type="text"
                  placeholder="e.g. CATL-INV-2026-991"
                  value={invoiceReference}
                  onChange={(e) => setInvoiceReference(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  General Inward Remarks & QA Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Container seal intact, zero physical denting observed, temperature logger passed."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Multi-Item Line Entry Table */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Raw Material Consignment Items & Purchase Batches
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
                  {items.length} {items.length === 1 ? 'Line Item' : 'Line Items'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSampleExcelTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer shadow-2xs"
                  title="Download dynamic Excel template pre-filled with all active raw materials from database"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Download Sample Excel Template</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowBulkUploadModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer shadow-2xs"
                  title="Upload filled Excel / CSV consignment file"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                  <span>Bulk GRN Upload</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddItemRow}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer shadow-2xs"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>+ Add Manual Row</span>
                </button>
              </div>
            </div>

          

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[900px]">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3 w-64">Raw Material Selection *</th>
                    <th className="p-3 w-28 text-right">Ordered Qty</th>
                    <th className="p-3 w-28 text-right">Received Qty *</th>
                    <th className="p-3 w-32 text-right">Unit Rate (BDT) *</th>
                    <th className="p-3 w-28 text-right">Discount</th>
                    <th className="p-3 w-28 text-right">Addl Costs</th>
                    <th className="p-3 w-32 text-right">Total Value (BDT)</th>
                    <th className="p-3 w-40">Generated Batch No</th>
                    <th className="p-3 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((row, idx) => {
                    const rowGross = (Number(row.receivedQty) || 0) * (Number(row.unitPurchaseRate) || 0);
                    const rowTotal = rowGross - (Number(row.discount) || 0) + (Number(row.additionalCosts) || 0);
                    const selectedMat = rawMaterials.find((m) => m.id === row.materialId);

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-2.5">
                          <select
                            value={row.materialId}
                            onChange={(e) => handleRowChange(idx, 'materialId', e.target.value)}
                            className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs"
                          >
                            {rawMaterials.map((mat) => (
                              <option key={mat.id} value={mat.id}>
                                {mat.code} • {mat.name} ({mat.unit})
                              </option>
                            ))}
                          </select>
                          {selectedMat && (
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                              <span>Category: <b>{selectedMat.category}</b></span>
                              <span>•</span>
                              <span>UOM: <b>{selectedMat.unit}</b></span>
                            </div>
                          )}
                        </td>

                        <td className="p-2.5">
                          <input
                            type="number"
                            min="0"
                            value={row.orderedQty}
                            onChange={(e) => handleRowChange(idx, 'orderedQty', Number(e.target.value))}
                            className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-right font-mono"
                          />
                        </td>

                        <td className="p-2.5">
                          <input
                            type="number"
                            min="1"
                            required
                            value={row.receivedQty}
                            onChange={(e) => handleRowChange(idx, 'receivedQty', Number(e.target.value))}
                            className="w-full p-2 rounded-xl border-2 border-emerald-500/60 dark:border-emerald-500/50 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-right font-mono font-bold text-emerald-600 dark:text-emerald-400"
                          />
                        </td>

                        <td className="p-2.5">
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            required
                            value={row.unitPurchaseRate}
                            onChange={(e) => handleRowChange(idx, 'unitPurchaseRate', Number(e.target.value))}
                            className="w-full p-2 rounded-xl border-2 border-blue-500/60 dark:border-blue-500/50 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-right font-mono font-bold text-blue-600 dark:text-blue-400"
                          />
                        </td>

                        <td className="p-2.5">
                          <input
                            type="number"
                            min="0"
                            value={row.discount}
                            onChange={(e) => handleRowChange(idx, 'discount', Number(e.target.value))}
                            className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-right font-mono text-slate-500"
                          />
                        </td>

                        <td className="p-2.5">
                          <input
                            type="number"
                            min="0"
                            value={row.additionalCosts}
                            onChange={(e) => handleRowChange(idx, 'additionalCosts', Number(e.target.value))}
                            className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-right font-mono text-slate-500"
                          />
                        </td>

                        <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white text-xs">
                          ৳ {rowTotal.toLocaleString()}
                        </td>

                        <td className="p-2.5">
                          <div className="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400">
                            {row.batchNumber}
                          </div>
                          <div className="text-[9px] font-mono text-slate-400">
                            {row.batchBarcode}
                          </div>
                        </td>

                        <td className="p-2.5 text-center">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(idx)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Inward Valuation Summary Bar */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total Ordered</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {totals.orderedQty.toLocaleString()} units
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total Received</span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    {totals.receivedQty.toLocaleString()} units
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Gross Value</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    ৳ {totals.grossValue.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Discount & Costs</span>
                  <span className="font-mono text-slate-500">
                    -৳ {totals.totalDiscount.toLocaleString()} +৳ {totals.totalAdditionalCosts.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                  Net Inward Purchase Valuation
                </span>
                <span className="font-mono font-black text-base text-emerald-600 dark:text-emerald-400">
                  BDT {totals.totalPurchaseValue.toLocaleString()}
                </span>
              </div>
            </div>

        

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setItems([initialRow()])}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
              >
                Reset Form
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Processing Inward Receipt...</span>
                  </>
                ) : (
                  <>
                    <PackageCheck className="w-4 h-4" />
                    <span>Confirm Receipt & Generate Batches</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: GRN INWARD REGISTER */}
      {activeTab === 'register' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by GRN Number, PO, Supplier, Invoice, or Material..."
                  value={registerSearch}
                  onChange={(e) => setRegisterSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />
              </div>

              {/* Type Dropdown Filter (Local, Import) */}
              <select
                value={registerTypeFilter}
                onChange={(e) => setRegisterTypeFilter(e.target.value as 'ALL' | 'Local' | 'Import')}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
              >
                <option value="ALL">All GRN Types (Local / Import)</option>
                <option value="Local">Local Purchase Only</option>
                <option value="Import">Import Consignment Only</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleManualSupabaseSync}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer disabled:opacity-50"
                title="Sync and refresh receipts from Supabase"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Supabase'}</span>
              </button>
              <div className="text-xs text-slate-500 font-medium">
                Showing <b>{filteredReceipts.length}</b> verified GRN records
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">GRN No & Date</th>
                    <th className="p-3">PO & Invoice Ref</th>
                    <th className="p-3">Supplier Name</th>
                    <th className="p-3">Receiving Warehouse</th>
                    <th className="p-3 text-right">Items / Qty</th>
                    <th className="p-3 text-right">Total Purchase Value</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredReceipts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No goods received notes found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredReceipts.map((grn) => {
                      const resolvedType = grn.type || (grn.poReference?.toLowerCase().includes('imp') ? 'Import' : 'Local');
                      return (
                        <tr key={grn.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                                {grn.grnNumber}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                  resolvedType === 'Import'
                                    ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                                    : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                }`}
                              >
                                {resolvedType}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">{grn.receiveDate}</span>
                          </td>

                        <td className="p-3 font-mono">
                          <span className="text-slate-800 dark:text-slate-200 block">{grn.poReference || 'N/A'}</span>
                          <span className="text-[10px] text-slate-400">{grn.invoiceReference || 'N/A'}</span>
                        </td>

                        <td className="p-3">
                          <span className="font-semibold text-slate-900 dark:text-white block">{grn.supplierName}</span>
                          <span className="text-[10px] text-slate-400">Rcvd by: {grn.receivedBy}</span>
                        </td>

                        <td className="p-3 text-slate-700 dark:text-slate-300">
                          {grn.warehouseName}
                        </td>

                        <td className="p-3 text-right">
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200 block">
                            {grn.items.length} {grn.items.length === 1 ? 'material' : 'materials'}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-mono font-semibold">
                            {grn.totalReceivedQty.toLocaleString()} units
                          </span>
                        </td>

                        <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          ৳ {grn.totalPurchaseValue.toLocaleString()}
                        </td>

                        <td className="p-3 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            {grn.status}
                          </span>
                        </td>

                        <td className="p-3 text-right">
                          <button
                            onClick={() => setSelectedReceiptForView(grn)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Voucher</span>
                          </button>
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
      )}

      {/* CONFIRMATION / PRINT VOUCHER MODAL */}
      {(confirmedReceipt || selectedReceiptForView) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 text-xs max-h-[90vh] overflow-y-auto">
            {/* Header */}
            {(() => {
              const activeReceipt = confirmedReceipt || selectedReceiptForView!;
              const activeBatches = inventoryBatches.filter((b) => b.grnRef === activeReceipt.grnNumber);

              return (
                <>
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                        <PackageCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">
                          Goods Received Note (GRN) Voucher
                        </h3>
                        <span className="text-[11px] font-mono text-amber-600 font-bold">
                          {activeReceipt.grnNumber}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setConfirmedReceipt(null);
                        setSelectedReceiptForView(null);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Summary Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Consignment Type</span>
                      <span className={`font-bold inline-block px-1.5 py-0.5 rounded text-[10px] mt-0.5 ${
                        (activeReceipt.type || (activeReceipt.poReference?.toLowerCase().includes('imp') ? 'Import' : 'Local')) === 'Import'
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {activeReceipt.type || (activeReceipt.poReference?.toLowerCase().includes('imp') ? 'Import' : 'Local')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Supplier</span>
                      <span className="font-bold text-slate-900 dark:text-white">{activeReceipt.supplierName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Warehouse</span>
                      <span className="font-bold text-slate-900 dark:text-white">{activeReceipt.warehouseName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">PO Reference</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{activeReceipt.poReference}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Receive Date</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{activeReceipt.receiveDate}</span>
                    </div>
                  </div>

                  {/* Itemized Batches Table */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      Received Material Items & Created Purchase Batches
                    </h4>
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="p-2.5">Material</th>
                            <th className="p-2.5">Batch No & Barcode</th>
                            <th className="p-2.5 text-right">Received Qty</th>
                            <th className="p-2.5 text-right">Purchase Rate</th>
                            <th className="p-2.5 text-right">Total Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {activeReceipt.items.map((it) => (
                            <tr key={it.id}>
                              <td className="p-2.5">
                                <div className="font-bold text-slate-900 dark:text-white">{it.materialName}</div>
                                <div className="font-mono text-[10px] text-amber-600">{it.materialCode}</div>
                              </td>
                              <td className="p-2.5 font-mono">
                                <span className="font-bold text-blue-600 dark:text-blue-400 block">{it.batchNumber}</span>
                                <span className="text-[10px] text-slate-400">{it.batchBarcode}</span>
                              </td>
                              <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                                {it.receivedQty} {it.unit}
                              </td>
                              <td className="p-2.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                                ৳ {it.unitPurchaseRate.toLocaleString()}
                              </td>
                              <td className="p-2.5 text-right font-mono font-black text-slate-900 dark:text-white">
                                ৳ {it.totalPurchaseValue.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50 dark:bg-slate-800/60 font-bold border-t border-slate-200 dark:border-slate-800">
                          <tr>
                            <td colSpan={2} className="p-2.5">Total Valuation</td>
                            <td className="p-2.5 text-right font-mono text-emerald-600">
                              {activeReceipt.totalReceivedQty} units
                            </td>
                            <td className="p-2.5"></td>
                            <td className="p-2.5 text-right font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
                              ৳ {activeReceipt.totalPurchaseValue.toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Print Barcodes Section */}
                  {activeBatches.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                        <BarcodeIcon className="w-4 h-4 text-blue-600" />
                        <span>Printable Batch Barcode Stickers ({activeBatches.length})</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeBatches.map((b) => (
                          <BarcodeDisplay key={b.id} batch={b} showPrintButton={true} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        window.print();
                      }}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-100 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print GRN Voucher</span>
                    </button>

                    <button
                      onClick={() => {
                        setConfirmedReceipt(null);
                        setSelectedReceiptForView(null);
                      }}
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <BatchBarcodeScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
      />

      {/* Bulk GRN Excel Consignment Upload Modal */}
      <BulkGRNUploadModal
        isOpen={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        rawMaterials={rawMaterials}
        onApplyItems={handleApplyBulkUploadItems}
      />
    </div>
  );
};
