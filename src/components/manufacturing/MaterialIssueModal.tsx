import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { 
  PackageMinus, Barcode, AlertTriangle, CheckCircle2, 
  Clock, ShieldCheck, X, Plus, Trash2, Search, Filter,
  Loader2, Check, Edit3, RefreshCw, ArrowRight, Save, Layers
} from 'lucide-react';
import { BatchBarcodeScannerModal } from '../inventory/BatchBarcodeScannerModal';
import { ProductionOrder, InventoryBatch, RawMaterial, MaterialIssue } from '../../types/erp';

interface MaterialIssueModalProps {
  order: ProductionOrder;
  existingIssue?: MaterialIssue | null;
  onClose: () => void;
  onSuccess?: () => void;
}

interface IssueRow {
  id: string;
  materialId: string;
  batchId: string;
  quantity: number;
  previouslyIssuedQty?: number;
  unitCost: number;
  isOverride: boolean;
  overrideReason: string;
  maxAvailable: number;
  suggestedFifoBatchId?: string;
}

export const MaterialIssueModal: React.FC<MaterialIssueModalProps> = ({
  order,
  existingIssue,
  onClose,
  onSuccess
}) => {
  const { 
    rawMaterials, 
    inventoryBatches, 
    products, 
    materialIssues,
    issueMaterialsForProduction, 
    updateIssuedMaterialsForProduction,
    formatCurrency 
  } = useERP();

  // Find existing issue if not explicitly passed
  const currentIssue =
    existingIssue ||
    materialIssues?.find(
      (mi) =>
        (mi.productionOrderId && String(mi.productionOrderId) === String(order.id)) ||
        (mi.productionOrderNumber &&
          order.orderNumber &&
          mi.productionOrderNumber.trim().toLowerCase() === order.orderNumber.trim().toLowerCase())
    );

  const isEditMode = Boolean(currentIssue && currentIssue.items && currentIssue.items.length > 0);

  const [issueRows, setIssueRows] = useState<IssueRow[]>([]);
  const [issuedBy, setIssuedBy] = useState('Production Supervisor');
  const [notes, setNotes] = useState(`Material issue for PO ${order.orderNumber || order.id}`);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [scannerRowId, setScannerRowId] = useState<string | null>(null);
  const [rowToDeleteId, setRowToDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [allowInsufficientStock, setAllowInsufficientStock] = useState<boolean>(false);

  // Derive the Production Order's official batch number (e.g. KUS-B2610-25 or PR-KUS-2026-325)
  const poBatchNumber = order.batchNumber?.trim() || `KUS-B2610-${order.orderNumber?.replace(/\D/g, '').slice(-2) || '25'}`;

  // Helper to reliably find a raw material across id, code, or name matching
  const findRawMaterial = (materialId: string | undefined): RawMaterial | undefined => {
    if (!materialId) return undefined;
    const target = String(materialId).trim().toLowerCase();
    const targetClean = target.replace(/[^a-z0-9]/gi, '');
    return rawMaterials.find(m => {
      if (!m) return false;
      if (String(m.id).trim().toLowerCase() === target) return true;
      if (m.code && m.code.trim().toLowerCase() === target) return true;
      if (m.code && m.code.replace(/[^a-z0-9]/gi, '').toLowerCase() === targetClean) return true;
      if (m.name && m.name.trim().toLowerCase() === target) return true;
      return false;
    });
  };

  // Helper to extract true available warehouse stock from a material record
  const getMaterialStock = (rm: RawMaterial | undefined): number => {
    if (!rm) return 0;
    const candidates = [
      rm.stockKushtia,
      rm.stock_kushtia,
      rm.totalAvailableStock,
      rm.total_available_stock,
      rm.stock,
      rm.stock_qty,
      rm.current_stock,
      rm.available_qty,
      rm.qty,
      rm.quantity
    ];
    for (const c of candidates) {
      if (c !== undefined && c !== null && !isNaN(Number(c))) {
        const val = Number(c);
        if (val >= 0) return val;
      }
    }
    return 0;
  };

  // Helper to retrieve all eligible batches for a raw material, with the PO batch as the primary default
  const getBatchOptionsForMaterial = (materialId: string, requiredQty: number = 0) => {
    const rm = findRawMaterial(materialId);
    const existingBatches = inventoryBatches.filter(b => {
      if (!b) return false;
      const bMatId = String(b.materialId || '').trim().toLowerCase();
      const bMatCode = String(b.materialCode || '').trim().toLowerCase();
      const targetId = String(materialId).trim().toLowerCase();
      const targetClean = targetId.replace(/[^a-z0-9]/gi, '');
      const rmCode = rm?.code?.trim().toLowerCase() || '';
      const rmCodeClean = rmCode.replace(/[^a-z0-9]/gi, '');
      const rmId = String(rm?.id || '').trim().toLowerCase();
      return (
        bMatId === targetId ||
        bMatCode === targetId ||
        (bMatCode && bMatCode.replace(/[^a-z0-9]/gi, '') === targetClean) ||
        (rmCode && bMatCode === rmCode) ||
        (rmCodeClean && bMatCode.replace(/[^a-z0-9]/gi, '') === rmCodeClean) ||
        (rmId && bMatId === rmId)
      ) && (Number(b.availableQty) > 0 || b.status === 'Active');
    });

    const poBatchId = `batch-${order.orderNumber || 'PO'}-${materialId}`;
    const realFactoryStock = getMaterialStock(rm);
    const totalBatchesStock = existingBatches.reduce((acc, b) => acc + (Number(b.availableQty) || 0), 0);

    // Accurate available stock: reflects true warehouse inventory or active batch stock
    const actualAvailable = realFactoryStock > 0 ? realFactoryStock : totalBatchesStock;
    const poUnitRate = rm?.lastPurchaseUnitCostBDT || rm?.standardCostBDT || 0;

    const poBatch: InventoryBatch = {
      id: poBatchId,
      batchNumber: poBatchNumber,
      batchBarcode: `BC-${order.orderNumber?.replace(/\D/g, '') || '2026'}-${materialId}`,
      materialId: String(rm?.id || materialId),
      materialCode: rm?.code || 'RM',
      materialName: rm?.name || 'Raw Material',
      unit: rm?.unit || 'PCS',
      supplierId: 'SUP-KUSHTIA',
      supplierName: 'Kushtia Factory Store',
      purchaseDate: order.date || order.manufacturingDate || new Date().toISOString().substring(0, 10),
      unitPurchaseRate: poUnitRate,
      receivedQty: actualAvailable,
      issuedQty: 0,
      availableQty: actualAvailable,
      warehouseId: 'WH-KUSHTIA',
      warehouseName: 'Kushtia Assembly Plant',
      status: actualAvailable > 0 ? 'Active' : 'Depleted',
    };

    // PO batch is the primary default option according to Production Orders number
    const allBatches: InventoryBatch[] = [poBatch];
    existingBatches.forEach(b => {
      if (b.batchNumber !== poBatchNumber && b.id !== poBatchId) {
        allBatches.push(b);
      }
    });

    return {
      allBatches,
      defaultBatch: poBatch,
      actualAvailable,
      rm
    };
  };

  // Initialize issue rows: If editing an already-issued order, populate with previous issue rows and quantities!
  useEffect(() => {
    if (isEditMode && currentIssue && currentIssue.items && currentIssue.items.length > 0) {
      const editRows: IssueRow[] = currentIssue.items.map((item, idx) => {
        const prevQty = Number(item.issuedQty) || 0;
        const { allBatches, defaultBatch, actualAvailable, rm } = getBatchOptionsForMaterial(item.materialId, prevQty);
        
        // Match batch by batchNumber, barcode, or id
        const matchedBatch = allBatches.find(
          b => b.id === item.batchNumber || b.batchNumber === item.batchNumber || b.batchBarcode === item.batchBarcode
        ) || defaultBatch;

        // Since prevQty was already deducted during the original issue, effective available is current warehouse stock + previously issued
        const effectiveAvailable = actualAvailable + prevQty;

        return {
          id: `edit-row-${idx}-${item.materialId}-${Date.now()}`,
          materialId: item.materialId,
          batchId: matchedBatch.id,
          quantity: prevQty,
          previouslyIssuedQty: prevQty,
          unitCost: Number(item.unitCostBDT) || rm?.lastPurchaseUnitCostBDT || rm?.standardCostBDT || matchedBatch.unitPurchaseRate || 0,
          isOverride: Boolean(item.isFifoOverride),
          overrideReason: item.overrideReason || '',
          maxAvailable: effectiveAvailable,
          suggestedFifoBatchId: defaultBatch.id
        };
      });

      setIssueRows(editRows);
      if (currentIssue.issuedBy) setIssuedBy(currentIssue.issuedBy);
      if (currentIssue.notes) setNotes(currentIssue.notes);
      return;
    }

    // Fresh issue mode: initialize from product BOM
    const product = products.find(p => String(p.id) === String(order.productId) || p.model === order.model);
    const initialRows: IssueRow[] = [];

    if (product && product.bom && product.bom.length > 0) {
      product.bom.forEach((bomItem, idx) => {
        const requiredQty = bomItem.requiredQty * (order.plannedQty || 1);
        const { defaultBatch, actualAvailable, rm } = getBatchOptionsForMaterial(bomItem.materialId, requiredQty);
        const unitCost = bomItem.unitCostBDT || rm?.lastPurchaseUnitCostBDT || rm?.standardCostBDT || defaultBatch.unitPurchaseRate;

        initialRows.push({
          id: `row-${idx}-${Date.now()}`,
          materialId: bomItem.materialId,
          batchId: defaultBatch.id,
          quantity: requiredQty,
          previouslyIssuedQty: 0,
          unitCost,
          isOverride: false,
          overrideReason: '',
          maxAvailable: actualAvailable,
          suggestedFifoBatchId: defaultBatch.id
        });
      });
    }

    if (initialRows.length === 0) {
      // Provide an empty row
      const firstMat = rawMaterials[0];
      const { defaultBatch, actualAvailable } = getBatchOptionsForMaterial(firstMat ? String(firstMat.id) : '', 1);
      initialRows.push({
        id: `row-0-${Date.now()}`,
        materialId: firstMat ? String(firstMat.id) : '',
        batchId: defaultBatch.id,
        quantity: 1,
        previouslyIssuedQty: 0,
        unitCost: firstMat?.lastPurchaseUnitCostBDT || firstMat?.standardCostBDT || 0,
        isOverride: false,
        overrideReason: '',
        maxAvailable: actualAvailable,
        suggestedFifoBatchId: defaultBatch.id
      });
    }

    setIssueRows(initialRows);
  }, [order?.id, currentIssue?.id, isEditMode]);

  // Handle Material change in a row
  const handleMaterialChange = (rowId: string, newMaterialId: string) => {
    const currentRow = issueRows.find(r => r.id === rowId);
    const qty = currentRow?.quantity || 1;
    const { defaultBatch, actualAvailable, rm } = getBatchOptionsForMaterial(newMaterialId, qty);

    setIssueRows(prev => prev.map(row => {
      if (row.id !== rowId) return row;
      return {
        ...row,
        materialId: newMaterialId,
        batchId: defaultBatch.id,
        previouslyIssuedQty: 0, // Reset previous issued qty since material changed
        unitCost: rm?.lastPurchaseUnitCostBDT || rm?.standardCostBDT || defaultBatch.unitPurchaseRate,
        maxAvailable: actualAvailable,
        suggestedFifoBatchId: defaultBatch.id,
        isOverride: false,
        overrideReason: ''
      };
    }));
  };

  // Handle Batch change in a row
  const handleBatchChange = (rowId: string, newBatchId: string) => {
    const currentRow = issueRows.find(r => r.id === rowId);
    if (!currentRow) return;
    const { allBatches, defaultBatch, actualAvailable } = getBatchOptionsForMaterial(currentRow.materialId, currentRow.quantity);
    const selectedBatch = allBatches.find(b => b.id === newBatchId) || inventoryBatches.find(b => b.id === newBatchId);
    const isOverride = newBatchId !== defaultBatch.id;

    setIssueRows(prev => prev.map(row => {
      if (row.id !== rowId) return row;
      const baseAvail = selectedBatch ? Number(selectedBatch.availableQty) : actualAvailable;
      const effectiveAvail = baseAvail + (row.previouslyIssuedQty || 0);
      return {
        ...row,
        batchId: newBatchId,
        unitCost: selectedBatch ? selectedBatch.unitPurchaseRate : row.unitCost,
        maxAvailable: effectiveAvail,
        isOverride,
        overrideReason: isOverride ? row.overrideReason : ''
      };
    }));
  };

  // Add extra row
  const handleAddRow = () => {
    const firstMat = rawMaterials[0];
    const { defaultBatch, actualAvailable } = getBatchOptionsForMaterial(firstMat ? String(firstMat.id) : '', 1);

    setIssueRows(prev => [
      ...prev,
      {
        id: `row-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        materialId: firstMat ? String(firstMat.id) : '',
        batchId: defaultBatch.id,
        quantity: 1,
        previouslyIssuedQty: 0,
        unitCost: firstMat?.lastPurchaseUnitCostBDT || firstMat?.standardCostBDT || 0,
        isOverride: false,
        overrideReason: '',
        maxAvailable: actualAvailable,
        suggestedFifoBatchId: defaultBatch.id
      }
    ]);
  };

  // Remove row
  const handleRemoveRow = (rowId: string) => {
    if (issueRows.length <= 1) return;
    setIssueRows(prev => prev.filter(r => r.id !== rowId));
  };

  // Apply scanned barcode batch
  const handleSelectScannedBatch = (batch: InventoryBatch) => {
    if (!scannerRowId) return;

    setIssueRows(prev => prev.map(row => {
      if (row.id !== scannerRowId) return row;
      const isOverride = row.suggestedFifoBatchId ? batch.id !== row.suggestedFifoBatchId : false;

      return {
        ...row,
        materialId: batch.materialId,
        batchId: batch.id,
        unitCost: batch.unitPurchaseRate,
        maxAvailable: batch.availableQty + (row.previouslyIssuedQty || 0),
        isOverride: isOverride,
        overrideReason: isOverride ? (row.overrideReason || 'Scanned physical batch barcode from floor') : ''
      };
    }));

    setScannerRowId(null);
  };

  // Calculate totals and stock revision deltas
  const totalIssueCost = issueRows.reduce((acc, row) => acc + (row.quantity * row.unitCost), 0);
  const totalQuantity = issueRows.reduce((acc, row) => acc + (Number(row.quantity) || 0), 0);
  const originalIssuedQty = currentIssue?.totalIssuedQty || 0;
  const originalTotalCost = currentIssue?.totalMaterialCostBDT || currentIssue?.totalMaterialCost || 0;
  const netQtyDelta = totalQuantity - originalIssuedQty;
  const netCostDelta = totalIssueCost - originalTotalCost;

  // Submit issue or update
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg(null);

    // Validate
    for (let i = 0; i < issueRows.length; i++) {
      const row = issueRows[i];
      if (!row.materialId) {
        setErrorMsg(`Row ${i + 1}: Select a raw material.`);
        return;
      }
      if (!row.batchId) {
        setErrorMsg(`Row ${i + 1}: Select a batch.`);
        return;
      }
      const qty = Number(row.quantity);
      if (isNaN(qty) || qty < 0) {
        setErrorMsg(`Row ${i + 1}: Quantity must be 0 or greater.`);
        return;
      }
      if (row.isOverride && !row.overrideReason.trim()) {
        setErrorMsg(`Row ${i + 1}: Manual batch override requires an audit reason.`);
        return;
      }
    }

    const shortfallItems = issueRows.filter(r => Number(r.quantity) > Number(r.maxAvailable));
    const hasShortfall = shortfallItems.length > 0;

    if (hasShortfall && !allowInsufficientStock) {
      const summaryNames = shortfallItems
        .map(r => {
          const mat = findRawMaterial(r.materialId);
          return `${mat?.name || r.materialId} (Req: ${r.quantity}, Max Available: ${r.maxAvailable})`;
        })
        .slice(0, 3)
        .join(', ');
      const extraCount = shortfallItems.length > 3 ? ` and ${shortfallItems.length - 3} more items` : '';
      setErrorMsg(
        `Raw Material Shortage Detected: Warehouse stock is insufficient for ${summaryNames}${extraCount}. You must check "Authorize Factory Issue with Shortfall" before confirming.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const issuePayload = {
        issueId: currentIssue?.id,
        productionOrderId: order.id,
        productionOrderNumber: order.orderNumber || order.id,
        warehouseId: 'WH-KUSHTIA',
        warehouseName: 'Kushtia Assembly Plant',
        issuedBy: issuedBy.trim() || 'Production Supervisor',
        notes: `${notes || ''}${hasShortfall ? ' [Physical issue authorized with pending GRN reconciliation]' : ''}`.trim(),
        items: issueRows.map(r => {
          const mat = findRawMaterial(r.materialId);
          const { allBatches, defaultBatch } = getBatchOptionsForMaterial(r.materialId, r.quantity);
          const batch = allBatches.find(b => b.id === r.batchId) || inventoryBatches.find(b => b.id === r.batchId) || defaultBatch;
          return {
            materialId: String(mat?.id || r.materialId),
            materialCode: mat?.code || batch?.materialCode || '',
            materialName: mat?.name || batch?.materialName || '',
            unit: mat?.unit || batch?.unit || 'PCS',
            unitCostBDT: Number(r.unitCost) || batch?.unitPurchaseRate || mat?.lastPurchaseUnitCostBDT || mat?.standardCostBDT || 0,
            batchId: r.batchId,
            batchNumber: batch?.batchNumber || poBatchNumber,
            batchBarcode: batch?.batchBarcode || `BC-${mat?.code || r.materialId}`,
            quantity: Number(r.quantity),
            isFifoOverride: r.isOverride,
            overrideReason: r.overrideReason,
          };
        })
      };

      const res = isEditMode
        ? await updateIssuedMaterialsForProduction(issuePayload)
        : await issueMaterialsForProduction(issuePayload);

      if (res && res.success === false) {
        setErrorMsg(res.error || 'Failed to update materials issue.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg(
        isEditMode
          ? `Raw materials issue ${res?.issueNumber || currentIssue?.issueNumber || ''} updated successfully! Factory stock adjusted.`
          : `Material issue ${res?.issueNumber || ''} created successfully! Database updated.`
      );
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process materials issue.');
      setIsSubmitting(false);
    }
  };

  const availableCategories = ['All', ...Array.from(new Set(
    issueRows.map(r => {
      const rm = findRawMaterial(r.materialId);
      return rm?.category || 'General';
    })
  )).filter(Boolean)];

  const filteredRows = issueRows.filter(row => {
    const rm = findRawMaterial(row.materialId);
    const rowCategory = rm?.category || 'General';
    if (categoryFilter !== 'All' && rowCategory !== categoryFilter) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const name = rm?.name?.toLowerCase() || '';
    const code = rm?.code?.toLowerCase() || '';
    const cat = rowCategory.toLowerCase();
    const id = String(row.materialId).toLowerCase();
    return name.includes(q) || code.includes(q) || cat.includes(q) || id.includes(q);
  });

  const rowToDelete = rowToDeleteId ? issueRows.find(r => r.id === rowToDeleteId) : null;
  const rowToDeleteMaterial = rowToDelete ? findRawMaterial(rowToDelete.materialId) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[1400px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 text-xs max-h-[94vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`p-2.5 rounded-xl ${
              isEditMode 
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
                : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
            }`}>
              {isEditMode ? <Edit3 className="w-5 h-5" /> : <PackageMinus className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isEditMode ? 'Edit & Update Raw Materials Issue Stock' : 'Issue Raw Materials to Production'}
                </h2>
                {isEditMode && currentIssue && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Update Mode • Issue #{currentIssue.issueNumber}</span>
                  </span>
                )}
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                PO: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{order.orderNumber}</span> • 
                Batch: <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{poBatchNumber}</span> • 
                Product: <span className="font-semibold text-slate-800 dark:text-slate-200">{order.productName}</span> • 
                Planned Qty: <span className="font-bold text-emerald-600 dark:text-emerald-400">{order.plannedQty} Units</span>
                {isEditMode && (
                  <span className="ml-1 text-slate-400">
                    • Modifying quantities will automatically adjust factory stock by the difference.
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Edit Mode Notice Banner */}
        {isEditMode && currentIssue && (
          <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/60 rounded-lg text-emerald-700 dark:text-emerald-300 shrink-0">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-emerald-900 dark:text-emerald-200">
                  Editing Issued Materials for Order #{order.orderNumber}
                </span>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  Previously issued: <b className="font-mono">{originalIssuedQty} units</b> (BDT {originalTotalCost.toLocaleString()}) on {currentIssue.issueDate}. Adjusting quantities below reconciles warehouse stock directly.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-slate-800 dark:text-slate-200 shadow-2xs">
                Updated Total: <b>{totalQuantity} units</b>
              </span>
              <span className={`px-2 py-1 rounded-md border font-bold shadow-2xs ${
                netQtyDelta > 0 
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                  : netQtyDelta < 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                Stock Net Change: {netQtyDelta > 0 ? `+${netQtyDelta} (Deduct)` : netQtyDelta < 0 ? `${netQtyDelta} (Return)` : '0 (No Change)'}
              </span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Table of Items */}
        <div className="space-y-2.5 flex-1 min-h-0 flex flex-col">
          {/* Header & Filter Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                {isEditMode ? 'Raw Materials Issue Stock' : 'Raw Materials to Issue'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-[11px]">
                {filteredRows.length} of {issueRows.length} items
              </span>
              <span className="text-[11px] text-slate-400">
                (Scrollable list)
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Quick Search */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search raw material name / code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-0.5 cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Filter */}
              {availableCategories.length > 2 && (
                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === 'All' ? 'All Categories' : cat}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Extra</span>
              </button>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto overflow-y-auto shadow-xs flex-1 min-h-[260px] max-h-[50vh]">
            <table className="w-full text-left text-xs min-w-[1150px]">
              <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-bold sticky top-0 z-20 shadow-xs">
                <tr>
                  <th className="p-3 text-center w-12 min-w-[45px]">#</th>
                  <th className="p-3 w-[28%] min-w-[260px]">Raw Material</th>
                  <th className="p-3 w-[24%] min-w-[220px]">Batch / FIFO Suggestion</th>
                  <th className="p-3 text-right w-24 min-w-[85px]">Plant Stock</th>
                  {isEditMode && (
                    <th className="p-3 text-right w-28 min-w-[95px]">Previously Issued</th>
                  )}
                  <th className="p-3 text-right w-28 min-w-[100px]">Issue Qty</th>
                  {isEditMode && (
                    <th className="p-3 text-center w-32 min-w-[110px]">Stock Impact</th>
                  )}
                  <th className="p-3 text-right w-28 min-w-[95px]">Batch Rate</th>
                  <th className="p-3 text-right w-32 min-w-[105px]">Total Cost</th>
                  <th className="p-3 text-center w-16 min-w-[60px]">Scan</th>
                  <th className="p-3 text-center w-12 min-w-[50px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={isEditMode ? 11 : 9} className="p-10 text-center text-slate-400">
                      <p className="font-semibold text-sm">No raw materials match your search.</p>
                      <button
                        type="button"
                        onClick={() => { setSearchQuery(''); setCategoryFilter('All'); }}
                        className="mt-2 text-xs text-blue-600 dark:text-blue-400 underline font-medium cursor-pointer"
                      >
                        Reset filters to view all {issueRows.length} materials
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => {
                    const originalIdx = issueRows.findIndex(r => r.id === row.id) + 1;
                    const { allBatches, defaultBatch, actualAvailable } = getBatchOptionsForMaterial(row.materialId, row.quantity);
                    const rm = findRawMaterial(row.materialId);
                    const isDefaultBatch = !row.batchId || row.batchId === defaultBatch.id;

                    const previouslyIssued = row.previouslyIssuedQty ?? 0;
                    const delta = (Number(row.quantity) || 0) - previouslyIssued;

                    return (
                      <React.Fragment key={row.id}>
                        <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          {/* Row Number */}
                          <td className="p-3 text-center font-mono text-[11px] font-bold text-slate-400">
                            #{originalIdx}
                          </td>

                          {/* Material Selector with full name visibility */}
                          <td className="p-3">
                            <div className="space-y-1">
                              <select
                                value={row.materialId}
                                onChange={(e) => handleMaterialChange(row.id, e.target.value)}
                                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 shadow-xs"
                                title={rm ? `${rm.name} (${rm.code})` : ''}
                              >
                                {rawMaterials.map((m, rmIdx) => (
                                  <option key={`${m.id}-${rmIdx}`} value={m.id}>
                                    {m.name} ({m.code}) {m.category ? `• ${m.category}` : ''}
                                  </option>
                                ))}
                                {!rawMaterials.some(m => String(m.id) === String(row.materialId)) && (
                                  <option value={row.materialId}>
                                    {rm?.name || row.materialId} (Code: {rm?.code || row.materialId})
                                  </option>
                                )}
                              </select>
                              {rm && (
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 pl-0.5">
                                  <span className="font-mono font-medium text-slate-600 dark:text-slate-300">Code: {rm.code}</span>
                                  {rm.unit && <span>• Unit: {rm.unit}</span>}
                                  {rm.category && <span>• {rm.category}</span>}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Batch Selector with PO Batch preselected by default */}
                          <td className="p-3">
                            <div className="space-y-1">
                              <select
                                value={row.batchId || defaultBatch.id}
                                onChange={(e) => handleBatchChange(row.id, e.target.value)}
                                className={`w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-blue-500 shadow-xs ${
                                  row.isOverride 
                                    ? 'border-amber-500 text-amber-700 dark:text-amber-300' 
                                    : 'border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100'
                                }`}
                              >
                                {allBatches.map(b => (
                                  <option key={b.id} value={b.id}>
                                    {b.batchNumber} {b.batchNumber === poBatchNumber 
                                      ? `(PO Default • Stock: ${b.availableQty.toLocaleString()} ${rm?.unit || ''})` 
                                      : `(Lot: ${b.batchNumber} • Avail: ${b.availableQty.toLocaleString()} | Rate: ${formatCurrency(b.unitPurchaseRate)})`}
                                  </option>
                                ))}
                              </select>

                              <div className="flex items-center gap-1.5 text-[10px]">
                                {isDefaultBatch && (
                                  <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                                    <CheckCircle2 className="w-3 h-3 text-blue-500" /> Default Batch (PO: {order.orderNumber})
                                  </span>
                                )}
                                {row.isOverride && (
                                  <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                                    <AlertTriangle className="w-3 h-3 text-amber-500" /> Manual Batch Override
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Plant Stock */}
                          <td className="p-3 text-right font-mono">
                            <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                              {actualAvailable.toLocaleString()}
                            </div>
                            <div className="text-[10px] font-normal text-slate-400">{rm?.unit || 'Units'}</div>
                          </td>

                          {/* Previously Issued (in Edit Mode) */}
                          {isEditMode && (
                            <td className="p-3 text-right font-mono">
                              <div className="font-bold text-sm text-slate-700 dark:text-slate-300">
                                {previouslyIssued.toLocaleString()}
                              </div>
                              <div className="text-[10px] text-slate-400 font-normal">{rm?.unit || 'Units'}</div>
                            </td>
                          )}

                          {/* Quantity Input */}
                          <td className="p-3 text-right">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={row.quantity}
                              onChange={(e) => {
                                const val = Math.max(0, Number(e.target.value));
                                setIssueRows(prev => prev.map(r => r.id === row.id ? { ...r, quantity: val } : r));
                              }}
                              className={`w-24 p-2 text-right rounded-lg border font-mono font-bold text-xs shadow-xs ${
                                row.quantity > row.maxAvailable
                                  ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300'
                                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                              }`}
                            />
                            {row.quantity > row.maxAvailable && (
                              <div className="text-[9px] text-amber-600 font-bold mt-0.5">
                                Exceeds stock
                              </div>
                            )}
                          </td>

                          {/* Stock Impact (in Edit Mode) */}
                          {isEditMode && (
                            <td className="p-3 text-center font-mono">
                              {row.previouslyIssuedQty === undefined ? (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                  +{row.quantity} (New)
                                </span>
                              ) : delta > 0 ? (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800" title={`Will deduct additional ${delta} from plant stock`}>
                                  +{delta} (Deduct)
                                </span>
                              ) : delta < 0 ? (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" title={`Will return ${Math.abs(delta)} back to plant stock`}>
                                  {delta} (Return)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-medium text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                                  Unchanged
                                </span>
                              )}
                            </td>
                          )}

                          {/* Unit Cost */}
                          <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-300">
                            {formatCurrency(row.unitCost)}
                          </td>

                          {/* Total Line Cost */}
                          <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatCurrency(row.quantity * row.unitCost)}
                          </td>

                          {/* Barcode Scanner Trigger */}
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => setScannerRowId(row.id)}
                              className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition cursor-pointer"
                              title="Scan Barcode for this Row"
                            >
                              <Barcode className="w-4 h-4" />
                            </button>
                          </td>

                          {/* Remove */}
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => setRowToDeleteId(row.id)}
                              disabled={issueRows.length <= 1}
                              className="p-1.5 rounded text-slate-400 hover:text-red-500 disabled:opacity-30 transition cursor-pointer"
                              title="Remove Material Row"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>

                        {/* Override Reason input if overridden */}
                        {row.isOverride && (
                          <tr className="bg-amber-50/50 dark:bg-amber-950/20">
                            <td colSpan={isEditMode ? 11 : 9} className="p-2.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="text-amber-800 dark:text-amber-300 font-semibold text-[11px] whitespace-nowrap">
                                  Override Audit Reason:
                                </span>
                                <input
                                  type="text"
                                  placeholder="e.g., Specific lot requested by QA head, inspection required"
                                  value={row.overrideReason}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setIssueRows(prev => prev.map(r => r.id === row.id ? { ...r, overrideReason: val } : r));
                                  }}
                                  className="flex-1 p-1.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-xs"
                                  required
                                />
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-semibold text-slate-600 dark:text-slate-400 text-xs border-t border-slate-200 dark:border-slate-800 sticky bottom-0 z-10">
                <tr>
                  <td colSpan={isEditMode ? 5 : 4} className="p-2.5 px-3 text-left">
                    Total {issueRows.length} Bill of Materials items ({filteredRows.length} displayed)
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                    {totalQuantity.toLocaleString()}
                  </td>
                  {isEditMode && (
                    <td className="p-2.5 text-center font-mono font-bold">
                      <span className={netQtyDelta > 0 ? 'text-amber-600' : netQtyDelta < 0 ? 'text-emerald-600' : 'text-slate-400'}>
                        {netQtyDelta > 0 ? `+${netQtyDelta}` : netQtyDelta < 0 ? `${netQtyDelta}` : '0'}
                      </span>
                    </td>
                  )}
                  <td className="p-2.5 text-right text-slate-500 text-[10px]">
                    Total Value:
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(totalIssueCost)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Issue Details & Total Cost */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 shrink-0 border-t border-slate-100 dark:border-slate-800">
          <div className="space-y-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                Issued By (Authorized Personnel)
              </label>
              <input
                type="text"
                value={issuedBy}
                onChange={(e) => setIssuedBy(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                Issue Remarks & Batch Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Material Issue Value
                </span>
                {isEditMode && netCostDelta !== 0 && (
                  <span className={`text-[11px] font-mono font-bold ${
                    netCostDelta > 0 ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    Cost Delta: {netCostDelta > 0 ? `+BDT ${netCostDelta.toLocaleString()}` : `-BDT ${Math.abs(netCostDelta).toLocaleString()}`}
                  </span>
                )}
              </div>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 font-mono">
                {formatCurrency(totalIssueCost)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Calculated according to batch purchase acquisition costs.
              </p>
            </div>

            {issueRows.some(r => Number(r.quantity) > Number(r.maxAvailable)) && (
              <div className="pt-2">
                <label className={`flex items-start gap-2.5 cursor-pointer select-none text-[11px] p-2.5 rounded-lg border transition ${
                  allowInsufficientStock 
                    ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800' 
                    : 'text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 shadow-xs'
                }`}>
                  <input
                    type="checkbox"
                    checked={allowInsufficientStock}
                    onChange={(e) => {
                      setAllowInsufficientStock(e.target.checked);
                      if (e.target.checked) setErrorMsg(null);
                    }}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer h-4 w-4 shrink-0"
                  />
                  <div>
                    <span className="font-bold">Authorize Factory Issue with Shortfall:</span>{' '}
                    <span>
                      Recorded warehouse stock is insufficient for {issueRows.filter(r => Number(r.quantity) > Number(r.maxAvailable)).length} component(s). Check this box to authorize physical issue to assembly line with pending stock reconciliation.
                    </span>
                    {!allowInsufficientStock && (
                      <p className="mt-1 font-semibold text-amber-700 dark:text-amber-400 text-[10px] flex items-center gap-1">
                        ⚠️ Authorization required: Without checking this option, material issue cannot be confirmed.
                      </p>
                    )}
                  </div>
                </label>
              </div>
            )}

            {errorMsg && (
              <div className="p-2.5 bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 flex items-center gap-2 text-xs mt-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 flex items-center gap-2 text-xs mt-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="font-semibold">{successMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting || !!successMsg}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isSubmitting || !!successMsg}
                className={`px-5 py-2.5 text-white rounded-xl font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-70 ${
                  isEditMode 
                    ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-600/20' 
                    : 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 shadow-amber-600/20'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isEditMode ? 'Updating Issued Stock...' : 'Saving & Issuing to Database...'}</span>
                  </>
                ) : successMsg ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>{isEditMode ? 'Updated Successfully!' : 'Issued Successfully!'}</span>
                  </>
                ) : isEditMode ? (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Update RM Issued Stock &amp; Reconcile Inventory</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Material Issue</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BatchBarcodeScannerModal
        isOpen={scannerRowId !== null}
        onClose={() => setScannerRowId(null)}
        onSelectBatch={handleSelectScannedBatch}
      />

      {/* CONFIRM REMOVE MATERIAL ROW MODAL */}
      {rowToDeleteId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 rounded-2xl shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Remove Material from Issue?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Are you sure you want to remove <b className="text-slate-800 dark:text-slate-200">{rowToDeleteMaterial?.name || 'this item'}</b> from the issue list?
                </p>
                {isEditMode && rowToDelete && (Number(rowToDelete.previouslyIssuedQty) || 0) > 0 && (
                  <div className="mt-2.5 p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 text-[11px]">
                    <span className="font-bold">Stock Return Notice:</span> This item has <b className="font-mono">{rowToDelete.previouslyIssuedQty} units</b> previously issued. Removing it will return all {rowToDelete.previouslyIssuedQty} units back to Kushtia plant inventory upon saving.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRowToDeleteId(null)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleRemoveRow(rowToDeleteId);
                  setRowToDeleteId(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
