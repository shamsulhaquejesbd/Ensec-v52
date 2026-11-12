import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { 
  Layers, Search, Filter, Barcode, Printer, ArrowDownRight, 
  ArrowUpRight, RefreshCw, Calendar, Warehouse, Building2, 
  TrendingUp, Download, Eye, FileText, CheckCircle2, AlertCircle,
  Package, Boxes, ArrowUpDown, ChevronDown, ChevronUp, Info, X,
  FileSpreadsheet, Check, Lock
} from 'lucide-react';
import { BarcodeDisplay } from './BarcodeDisplay';
import { BatchBarcodeScannerModal } from './BatchBarcodeScannerModal';
import { BulkStockUploadModal } from './BulkStockUploadModal';
import { InventoryBatch, InventoryMovement } from '../../types/erp';
import { 
  canViewRawMaterialStockValue, 
  canViewRawMaterialPurchaseRate, 
  canViewBatchStockValue 
} from '../../types/pagePermissions';

export const RawMaterialInventoryPage: React.FC = () => {
  const { 
    currentUser,
    inventoryBatches, 
    inventoryMovements, 
    rawMaterials, 
    rawMaterialCategories,
    suppliers, 
    warehouses,
    uoms,
    formatCurrency,
    reconcileAllRawMaterialBatches
  } = useERP();

  // Granular Security Permissions
  const canViewRMStockVal = useMemo(() => {
    return canViewRawMaterialStockValue(currentUser);
  }, [currentUser]);

  const canViewRMPurchaseRate = useMemo(() => {
    return canViewRawMaterialPurchaseRate(currentUser);
  }, [currentUser]);

  const canViewBatchStockVal = useMemo(() => {
    return canViewBatchStockValue(currentUser);
  }, [currentUser]);

  const [activeTab, setActiveTab] = useState<'batches' | 'movements' | 'stock'>('batches');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Bulk Excel Upload Modal state
  const [isBulkStockUploadOpen, setIsBulkStockUploadOpen] = useState(false);
  const [isSyncingBatches, setIsSyncingBatches] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);

  // Sorting state for Raw Materials Stock report (defaults to stock if stockValue is restricted)
  const [sortField, setSortField] = useState<'category' | 'code' | 'name' | 'uom' | 'stock' | 'stockCtn' | 'stockValue'>(() => {
    return canViewRawMaterialStockValue(currentUser) ? 'stockValue' : 'stock';
  });
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Custom carton packaging rates (UOM divisor) persisted in localStorage
  const [customCartonRates, setCustomCartonRates] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ensec_rm_carton_rates');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  });

  const handleUpdateCartonRate = (materialCode: string, newRate: number) => {
    const validRate = Math.max(1, Number(newRate) || 1);
    setCustomCartonRates(prev => {
      const updated = { ...prev, [materialCode]: validRate };
      if (typeof window !== 'undefined') {
        localStorage.setItem('ensec_rm_carton_rates', JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Barcode & print modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedBatchForLabel, setSelectedBatchForLabel] = useState<InventoryBatch | null>(null);
  const [inspectedMaterialBatches, setInspectedMaterialBatches] = useState<{ code: string; name: string; batches: InventoryBatch[] } | null>(null);

  // Helper to resolve category for a material
  const resolveCategory = (code: string, name: string): string => {
    const matchedRm = rawMaterials.find(m => m.code === code || m.name === name);
    if (matchedRm?.category && matchedRm.category.trim()) {
      return matchedRm.category.trim();
    }
    if (matchedRm?.categoryId && rawMaterialCategories?.length) {
      const cat = rawMaterialCategories.find(c => String(c.id) === String(matchedRm.categoryId));
      if (cat?.name) return cat.name;
    }
    const lower = (name + ' ' + code).toLowerCase();
    if (lower.includes('bms')) return 'BMS';
    if (lower.includes('gps')) return 'GPS & IoT';
    if (lower.includes('display') || lower.includes('lcd')) return 'Display & Meters';
    if (lower.includes('casing') || lower.includes('case') || lower.includes('enclosure')) return 'Enclosure & Casing';
    if (lower.includes('cell') || code.startsWith('HY-') || lower.includes('catl') || lower.includes('eve')) return 'Lithium Battery Cell';
    if (lower.includes('busbar') || lower.includes('copper')) return 'Wire & Busbar';
    if (lower.includes('cable') || lower.includes('wire')) return 'Wire & Cable';
    if (lower.includes('connector') || lower.includes('terminal')) return 'Connectors';
    if (lower.includes('insulation') || lower.includes('epoxy') || lower.includes('tape')) return 'Insulation & Pack';
    return 'General RM';
  };

  // Helper to get carton packaging rate (UOM divisor)
  const getDefaultCartonRate = (code: string, name: string, category: string, unit: string): number => {
    if (customCartonRates[code]) return customCartonRates[code];

    const matchedRm = rawMaterials.find(m => m.code === code);
    if (matchedRm?.pcsPerCarton && matchedRm.pcsPerCarton > 0) return matchedRm.pcsPerCarton;
    if (matchedRm?.standardPackagingRate && matchedRm.standardPackagingRate > 0) return matchedRm.standardPackagingRate;

    const matchedUom = uoms?.find(u => 
      u.name?.toLowerCase() === unit.toLowerCase() || 
      u.symbol?.toLowerCase() === unit.toLowerCase()
    );
    if (matchedUom?.standardPackagingRate && matchedUom.standardPackagingRate > 0) {
      return matchedUom.standardPackagingRate;
    }

    const lowerName = name.toLowerCase();
    const lowerCat = category.toLowerCase();

    if (lowerCat.includes('cell') || lowerName.includes('cell') || code.startsWith('HY-')) {
      return 16;
    }
    if (lowerCat.includes('bms') || lowerName.includes('bms')) {
      return 10;
    }
    if (lowerCat.includes('gps') || lowerName.includes('gps')) {
      return 20;
    }
    if (lowerCat.includes('display') || lowerName.includes('display')) {
      return 50;
    }
    if (lowerCat.includes('case') || lowerCat.includes('casing') || lowerName.includes('casing')) {
      return 1;
    }
    if (lowerCat.includes('busbar') || lowerCat.includes('wire') || lowerCat.includes('cable')) {
      return 100;
    }
    return 10;
  };

  // Helper for category badge styling
  const getCategoryBadgeStyle = (category: string) => {
    const c = (category || '').toLowerCase();
    if (c.includes('cell')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
    if (c.includes('bms')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800';
    if (c.includes('case') || c.includes('enclosure')) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
    if (c.includes('gps')) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
    if (c.includes('display') || c.includes('lcd')) return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800';
    if (c.includes('wire') || c.includes('busbar') || c.includes('cable')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800';
    if (c.includes('conn') || c.includes('terminal')) return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800';
    return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600';
  };

  // Combine recorded inventoryBatches with auto-reconciled batches for raw materials with stock from bulk uploads
  const allEffectiveBatches = useMemo(() => {
    const existingBatchesMap = new Map<string, number>();
    inventoryBatches.forEach(b => {
      const code = b.materialCode?.trim().toUpperCase();
      if (code) {
        existingBatchesMap.set(code, (existingBatchesMap.get(code) || 0) + (Number(b.availableQty) || 0));
      }
    });

    const synthesizedBatches: InventoryBatch[] = [];

    rawMaterials.forEach(rm => {
      if (!rm.code) return;
      const codeKey = rm.code.trim().toUpperCase();
      const currentBatchStock = existingBatchesMap.get(codeKey) || 0;
      const totalStock = Number(rm.stockKushtia ?? rm.totalAvailableStock ?? 0);

      // If raw material has uploaded stock exceeding recorded batches (or 0 batches recorded)
      if (totalStock > currentBatchStock) {
        const delta = totalStock - currentBatchStock;
        synthesizedBatches.push({
          id: `batch-auto-${rm.code}`,
          batchNumber: `RM-BATCH-INIT-${rm.code}`,
          batchBarcode: rm.barcode || `BC-INIT-${rm.code}`,
          materialId: rm.id,
          materialCode: rm.code,
          materialName: rm.name,
          unit: rm.unit || 'Pieces',
          supplierId: rm.preferredSupplier || '',
          supplierName: rm.preferredSupplier || 'Initial Stock (Bulk Excel Upload)',
          purchaseDate: rm.createdAt ? rm.createdAt.substring(0, 10) : new Date().toISOString().substring(0, 10),
          unitPurchaseRate: Number(rm.lastPurchaseUnitCostBDT || rm.standardCostBDT || 0),
          receivedQty: delta,
          issuedQty: 0,
          availableQty: delta,
          warehouseId: 'WH-KUSHTIA',
          warehouseName: 'Kushtia Warehouse',
          status: 'Active',
          grnRef: 'BULK-UPLOAD-STOCK',
          remarks: 'Auto-reconciled from Bulk Excel upload stock',
          createdAt: rm.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    return [...inventoryBatches, ...synthesizedBatches];
  }, [inventoryBatches, rawMaterials]);

  // Check how many raw materials have uploaded stock waiting for permanent database batch sync
  const missingBatchMaterialsCount = useMemo(() => {
    const existingBatchesMap = new Map<string, number>();
    inventoryBatches.forEach(b => {
      const code = b.materialCode?.trim().toUpperCase();
      if (code) {
        existingBatchesMap.set(code, (existingBatchesMap.get(code) || 0) + (Number(b.availableQty) || 0));
      }
    });

    let count = 0;
    rawMaterials.forEach(rm => {
      if (!rm.code) return;
      const codeKey = rm.code.trim().toUpperCase();
      const currentBatchStock = existingBatchesMap.get(codeKey) || 0;
      const totalStock = Number(rm.stockKushtia ?? rm.totalAvailableStock ?? 0);
      if (totalStock > currentBatchStock) {
        count++;
      }
    });
    return count;
  }, [inventoryBatches, rawMaterials]);

  // Handle permanent batch reconciliation
  const handleCommitAutoBatches = async () => {
    if (!reconcileAllRawMaterialBatches) return;
    setIsSyncingBatches(true);
    try {
      const result = await reconcileAllRawMaterialBatches();
      setSyncSuccessMessage(`Successfully generated and saved ${result.createdCount} inventory batch(es) to database!`);
      setTimeout(() => setSyncSuccessMessage(null), 5000);
    } catch (err: any) {
      console.warn('Batch reconciliation error:', err);
    } finally {
      setIsSyncingBatches(false);
    }
  };

  // Filtered Batches (Using allEffectiveBatches so uploaded stock shows up immediately)
  const filteredBatches = useMemo(() => {
    return allEffectiveBatches.filter(b => {
      // Search
      const searchMatch = !searchTerm || 
        b.materialCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.batchBarcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.supplierName.toLowerCase().includes(searchTerm.toLowerCase());

      // Material
      const materialMatch = selectedMaterial === 'all' || b.materialId === selectedMaterial || b.materialCode === selectedMaterial;

      // Supplier
      const supplierMatch = selectedSupplier === 'all' || b.supplierId === selectedSupplier || b.supplierName === selectedSupplier;

      // Warehouse
      const warehouseMatch = selectedWarehouse === 'all' || b.warehouseId === selectedWarehouse || b.warehouseName === selectedWarehouse;

      // Status
      const statusMatch = selectedStatus === 'all' || b.status === selectedStatus;

      // Date range
      const purchaseDate = new Date(b.purchaseDate).getTime();
      const startMatch = !startDate || purchaseDate >= new Date(startDate).getTime();
      const endMatch = !endDate || purchaseDate <= new Date(endDate + 'T23:59:59').getTime();

      return searchMatch && materialMatch && supplierMatch && warehouseMatch && statusMatch && startMatch && endMatch;
    });
  }, [allEffectiveBatches, searchTerm, selectedMaterial, selectedSupplier, selectedWarehouse, selectedStatus, startDate, endDate]);

  // Filtered Movements
  const filteredMovements = useMemo(() => {
    return inventoryMovements.filter(m => {
      const refNo = m.referenceNo || m.referenceNumber || '';
      const wName = m.warehouseName || m.targetWarehouseName || '';
      const searchMatch = !searchTerm || 
        m.materialCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        refNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.notes && m.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const materialMatch = selectedMaterial === 'all' || m.materialId === selectedMaterial || m.materialCode === selectedMaterial;
      const warehouseMatch = selectedWarehouse === 'all' || m.warehouseId === selectedWarehouse || wName === selectedWarehouse;

      const movementDate = new Date(m.timestamp || m.date).getTime();
      const startMatch = !startDate || movementDate >= new Date(startDate).getTime();
      const endMatch = !endDate || movementDate <= new Date(endDate + 'T23:59:59').getTime();

      return searchMatch && materialMatch && warehouseMatch && startMatch && endMatch;
    });
  }, [inventoryMovements, searchTerm, selectedMaterial, selectedWarehouse, startDate, endDate]);

  // Aggregated Raw Materials Stock (Without Batch Wise)
  const rawMaterialsStock = useMemo(() => {
    const map = new Map<string, {
      code: string;
      name: string;
      category: string;
      unit: string;
      batches: InventoryBatch[];
      stockKushtiaDefault: number;
      defaultCost: number;
    }>();

    // Populate from rawMaterials master
    rawMaterials.forEach(rm => {
      if (!rm.code) return;
      const cat = rm.category || resolveCategory(rm.code, rm.name);
      map.set(rm.code, {
        code: rm.code,
        name: rm.name,
        category: cat,
        unit: rm.unit || 'Pieces',
        batches: [],
        stockKushtiaDefault: Number(rm.stockKushtia || rm.totalAvailableStock || 0),
        defaultCost: Number(rm.lastPurchaseUnitCostBDT || rm.standardCostBDT || 0)
      });
    });

    // Populate from allEffectiveBatches (includes both recorded batches and bulk uploaded stock)
    allEffectiveBatches.forEach(b => {
      const code = b.materialCode || b.materialId;
      if (!code) return;
      let entry = map.get(code);
      if (!entry) {
        // Try match by name
        for (const val of map.values()) {
          if (val.name.toLowerCase() === b.materialName.toLowerCase()) {
            entry = val;
            break;
          }
        }
      }
      if (!entry) {
        entry = {
          code: b.materialCode || b.materialId,
          name: b.materialName,
          category: resolveCategory(b.materialCode, b.materialName),
          unit: b.unit || 'Pieces',
          batches: [],
          stockKushtiaDefault: 0,
          defaultCost: Number(b.unitPurchaseRate) || 0
        };
        map.set(code, entry);
      }
      entry.batches.push(b);
    });

    // Compute consolidated stock without batch breakdown
    const list = Array.from(map.values()).map(item => {
      // Filter batches by warehouse, supplier, date
      const matchingBatches = item.batches.filter(b => {
        const whMatch = selectedWarehouse === 'all' || b.warehouseId === selectedWarehouse || b.warehouseName === selectedWarehouse;
        const suppMatch = selectedSupplier === 'all' || b.supplierId === selectedSupplier || b.supplierName === selectedSupplier;
        const purchaseDate = new Date(b.purchaseDate).getTime();
        const startMatch = !startDate || purchaseDate >= new Date(startDate).getTime();
        const endMatch = !endDate || purchaseDate <= new Date(endDate + 'T23:59:59').getTime();
        return whMatch && suppMatch && startMatch && endMatch;
      });

      let stock = 0;
      let stockValue = 0;

      if (matchingBatches.length > 0) {
        stock = matchingBatches.reduce((acc, b) => acc + (Number(b.availableQty) || 0), 0);
        stockValue = canViewRMStockVal
          ? matchingBatches.reduce((acc, b) => acc + ((Number(b.availableQty) || 0) * (Number(b.unitPurchaseRate) || 0)), 0)
          : 0;
      } else if (item.batches.length === 0 && selectedSupplier === 'all' && !startDate && !endDate) {
        if (selectedWarehouse === 'all' || selectedWarehouse.toLowerCase().includes('kushtia')) {
          stock = item.stockKushtiaDefault;
          stockValue = canViewRMStockVal ? (stock * item.defaultCost) : 0;
        }
      }

      const uomDivisor = getDefaultCartonRate(item.code, item.name, item.category, item.unit);
      const stockCtn = uomDivisor > 0 ? (stock / uomDivisor) : stock;
      const avgRate = (canViewRMStockVal && stock > 0) ? (stockValue / stock) : 0;
      const warehousesFound = Array.from(new Set(matchingBatches.map(b => b.warehouseName).filter(Boolean)));

      return {
        id: item.code,
        category: item.category,
        code: item.code,
        name: item.name,
        unit: item.unit,
        uomDivisor,
        stock,
        stockCtn,
        stockValue,
        avgRate,
        batchCount: matchingBatches.length,
        batches: matchingBatches.map(b => ({
          ...b,
          unitPurchaseRate: canViewRMPurchaseRate ? b.unitPurchaseRate : 0,
        })),
        warehouses: warehousesFound
      };
    });

    return list;
  }, [rawMaterials, allEffectiveBatches, selectedWarehouse, selectedSupplier, startDate, endDate, customCartonRates, rawMaterialCategories, uoms, canViewRMStockVal, canViewRMPurchaseRate]);

  // Filtered & Sorted Raw Materials Stock
  const filteredRawMaterialsStock = useMemo(() => {
    const filtered = rawMaterialsStock.filter(item => {
      // Search
      const searchMatch = !searchTerm || 
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());

      // Material
      const materialMatch = selectedMaterial === 'all' || item.code === selectedMaterial || item.id === selectedMaterial;

      // Category
      const categoryMatch = selectedCategory === 'all' || item.category === selectedCategory;

      // Status
      const statusMatch = selectedStatus === 'all' || 
        (selectedStatus === 'Active' && item.stock > 0) ||
        (selectedStatus === 'Depleted' && item.stock <= 0);

      return searchMatch && materialMatch && categoryMatch && statusMatch;
    });

    // Sort
    return [...filtered].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB as string).toLowerCase();
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return sortAsc ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
    });
  }, [rawMaterialsStock, searchTerm, selectedMaterial, selectedCategory, selectedStatus, sortField, sortAsc]);

  // Grand Totals for Raw Materials Stock
  const stockSummaryTotals = useMemo(() => {
    const totalStock = filteredRawMaterialsStock.reduce((acc, i) => acc + i.stock, 0);
    const totalStockCtn = filteredRawMaterialsStock.reduce((acc, i) => acc + i.stockCtn, 0);
    const totalStockValue = canViewRMStockVal
      ? filteredRawMaterialsStock.reduce((acc, i) => acc + i.stockValue, 0)
      : 0;

    return {
      totalStock,
      totalStockCtn,
      totalStockValue,
      totalItems: filteredRawMaterialsStock.length,
      inStockCount: filteredRawMaterialsStock.filter(i => i.stock > 0).length,
    };
  }, [filteredRawMaterialsStock, canViewRMStockVal]);

  // Sanitized display batches preventing unauthorized retrieval of purchase rates or stock values
  const displayBatches = useMemo(() => {
    return filteredBatches.map(b => ({
      ...b,
      unitPurchaseRate: canViewRMPurchaseRate ? b.unitPurchaseRate : 0,
      stockValue: canViewBatchStockVal ? (b.availableQty * b.unitPurchaseRate) : 0,
    }));
  }, [filteredBatches, canViewRMPurchaseRate, canViewBatchStockVal]);

  // All unique categories for dropdown filter
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    rawMaterialsStock.forEach(item => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set).sort();
  }, [rawMaterialsStock]);

  // Summary Metrics for top cards
  const metrics = useMemo(() => {
    const totalBatches = filteredBatches.length;
    const totalAvailableQty = filteredBatches.reduce((acc, b) => acc + b.availableQty, 0);
    const totalStockValue = canViewBatchStockVal
      ? filteredBatches.reduce((acc, b) => acc + (b.availableQty * b.unitPurchaseRate), 0)
      : 0;
    const lowStockBatches = filteredBatches.filter(b => b.availableQty > 0 && b.availableQty <= 50).length;
    const depletedBatches = filteredBatches.filter(b => b.availableQty <= 0).length;

    return {
      totalBatches,
      totalAvailableQty,
      totalStockValue,
      lowStockBatches,
      depletedBatches
    };
  }, [filteredBatches, canViewBatchStockVal]);

  // Handle Sort Toggle
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default to descending for numbers
    }
  };

  // Export to CSV respecting permissions
  const handleExportCSV = () => {
    if (activeTab === 'stock') {
      const headers = [
        'RM Category',
        'RM Code',
        'RM Name',
        'UOM',
        'Stock',
        'Stock Ctn (stock / UOM)',
        ...(canViewRMStockVal ? ['Stock Value'] : [])
      ];
      const rows = filteredRawMaterialsStock.map(i => [
        `"${i.category}"`,
        `"${i.code}"`,
        `"${i.name}"`,
        `"${i.uomDivisor} ${i.unit}/CTN"`,
        i.stock,
        i.stockCtn.toFixed(2),
        ...(canViewRMStockVal ? [i.stockValue.toFixed(2)] : [])
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `raw_materials_stock_summary_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (activeTab === 'batches') {
      const headers = [
        'Material Code',
        'Material Name',
        'Batch Number',
        'Supplier',
        'Purchase Date',
        ...(canViewRMPurchaseRate ? ['Purchase Rate'] : []),
        'Received Qty',
        'Issued Qty',
        'Available Qty',
        ...(canViewBatchStockVal ? ['Stock Value'] : []),
        'Warehouse',
        'Status'
      ];
      const rows = displayBatches.map(b => [
        `"${b.materialCode}"`,
        `"${b.materialName}"`,
        `"${b.batchNumber}"`,
        `"${b.supplierName}"`,
        `"${b.purchaseDate}"`,
        ...(canViewRMPurchaseRate ? [b.unitPurchaseRate] : []),
        b.receivedQty,
        b.issuedQty,
        b.availableQty,
        ...(canViewBatchStockVal ? [b.stockValue.toFixed(2)] : []),
        `"${b.warehouseName}"`,
        `"${b.status}"`
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `raw_material_batch_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = [
        'Date',
        'Type',
        'Material Code',
        'Material Name',
        'Batch Number',
        'Quantity',
        ...(canViewRMPurchaseRate ? ['Unit Cost'] : []),
        ...(canViewBatchStockVal ? ['Total Cost'] : []),
        'Reference No',
        'Warehouse',
        'Performed By',
        'Balance After'
      ];
      const rows = filteredMovements.map(m => [
        `"${new Date(m.timestamp || m.date).toLocaleString()}"`,
        `"${m.movementType}"`,
        `"${m.materialCode}"`,
        `"${m.materialName}"`,
        `"${m.batchNumber}"`,
        m.quantity,
        ...(canViewRMPurchaseRate ? [m.unitCost || m.unitCostBDT || 0] : []),
        ...(canViewBatchStockVal ? [(m.totalCost || m.totalValueBDT || 0).toFixed(2)] : []),
        `"${m.referenceNo || m.referenceNumber || ''}"`,
        `"${m.warehouseName || m.targetWarehouseName || 'Kushtia Warehouse'}"`,
        `"${m.performedBy}"`,
        m.balanceAfter
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `raw_material_inventory_movements_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePrintTable = () => {
    window.print();
  };

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Raw Material Inventory</h1>
              
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsBulkStockUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-emerald-600/20 cursor-pointer"
            title="Upload Raw Material Stock via Excel (.xlsx, .xls) or CSV"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Bulk Stock Upload (Excel)
          </button>
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            <Barcode className="w-4 h-4" />
            Scan Barcode / Batch
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={handlePrintTable}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      

      {/* Success Banner */}
      {syncSuccessMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncSuccessMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {activeTab === 'stock' ? (
          <>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Raw Materials</span>
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                {stockSummaryTotals.totalItems}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {stockSummaryTotals.inStockCount} materials in stock
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Available Stock Qty</span>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {stockSummaryTotals.totalStock.toLocaleString()}
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Total loose &amp; packaged units
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Stock Cartons (CTN)</span>
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <Boxes className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                {stockSummaryTotals.totalStockCtn.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 })} CTN
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Based on Stock / UOM packaging rate
              </p>
            </div>

            {canViewRMStockVal ? (
              <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Stock Value</span>
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                    <span className="font-bold text-xs">BDT</span>
                  </div>
                </div>
                <div className="mt-3 text-2xl font-bold text-purple-600 dark:text-purple-400 font-mono">
                  {formatCurrency(stockSummaryTotals.totalStockValue)}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Real purchase rate valuation
                </p>
              </div>
            ) : (
              <div className="bg-slate-50/70 dark:bg-slate-800/40 p-5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Stock Valuation</span>
                  <div className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-500 rounded-lg">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span>Restricted Access</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Stock value hidden by security policy
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Batches</span>
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                {metrics.totalBatches}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {metrics.depletedBatches} fully consumed batches
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Available Stock Qty</span>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                {metrics.totalAvailableQty.toLocaleString()}
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready for production issue
              </p>
            </div>

            {canViewBatchStockVal ? (
              <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Valuation</span>
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                    <span className="font-bold text-xs">BDT</span>
                  </div>
                </div>
                <div className="mt-3 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(metrics.totalStockValue)}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Batch actual purchase rates
                </p>
              </div>
            ) : (
              <div className="bg-slate-50/70 dark:bg-slate-800/40 p-5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Batch Valuation</span>
                  <div className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-500 rounded-lg">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span>Restricted Access</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Batch valuation hidden by security policy
                </p>
              </div>
            )}

            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Movement Records</span>
                <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                  <RefreshCw className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                {inventoryMovements.length}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Complete audit trail logged
              </p>
            </div>
          </>
        )}
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('batches')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition cursor-pointer ${
                activeTab === 'batches'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              Batch-wise Stock ({filteredBatches.length})
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition cursor-pointer ${
                activeTab === 'movements'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              Movement History ({filteredMovements.length})
            </button>
            <button
              onClick={() => setActiveTab('stock')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'stock'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-400/30'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              <Package className="w-4 h-4" />
              Raw materials stock ({filteredRawMaterialsStock.length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search code, name, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-1">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Material
            </label>
            <select
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Raw Materials</option>
              {rawMaterialsStock.map((rm, rmIdx) => (
                <option key={`${rm.code}-${rmIdx}`} value={rm.code}>{rm.code} - {rm.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              RM Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {allCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Warehouse
            </label>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Warehouses</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          {activeTab === 'stock' ? (
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Stock Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Stock Status</option>
                <option value="Active">In Stock ({stockSummaryTotals.inStockCount})</option>
                <option value="Depleted">Zero Stock ({stockSummaryTotals.totalItems - stockSummaryTotals.inStockCount})</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Supplier
              </label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Suppliers</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Date Filter
            </label>
            <div className="grid grid-cols-2 gap-1">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="From"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="To"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Table */}
      {activeTab === 'stock' ? (
        /* ================= RAW MATERIALS STOCK (CONSOLIDATED / WITHOUT BATCH WISE) ================= */
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Raw Materials Stock Report (Consolidated)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Consolidated material inventory without batch-wise splitting. Formula: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">Stock Ctn = Stock ÷ UOM</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Showing <strong className="text-slate-900 dark:text-white">{filteredRawMaterialsStock.length}</strong> items
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase text-xs font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th 
                    className="px-4 py-3.5 cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>RM Category</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>

                  <th 
                    className="px-4 py-3.5 cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition"
                    onClick={() => handleSort('code')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>RM Code</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>

                  <th 
                    className="px-4 py-3.5 cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>RM Name</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>

                  <th className="px-4 py-3.5 text-center">
                    <span>UOM</span>
                    <div className="text-[10px] text-slate-400 normal-case font-normal">(Rate / Divisor)</div>
                  </th>

                  <th 
                    className="px-4 py-3.5 text-right cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition"
                    onClick={() => handleSort('stock')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Stock</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>

                  <th 
                    className="px-4 py-3.5 text-right cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition"
                    onClick={() => handleSort('stockCtn')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Stock Ctn (stock / UOM)</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>

                  {canViewRMStockVal && (
                    <th 
                      className="px-4 py-3.5 text-right cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition"
                      onClick={() => handleSort('stockValue')}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Stock Value</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredRawMaterialsStock.length === 0 ? (
                  <tr>
                    <td colSpan={canViewRMStockVal ? 7 : 6} className="px-4 py-12 text-center text-slate-400">
                      <Package className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2 opacity-60" />
                      No raw materials found matching the active filters.
                    </td>
                  </tr>
                ) : (
                  filteredRawMaterialsStock.map(item => {
                    const isZeroStock = item.stock <= 0;
                    const fullCartons = Math.floor(item.stockCtn);
                    const loosePieces = item.stock % item.uomDivisor;

                    return (
                      <tr 
                        key={item.code} 
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-700/50 transition ${
                          isZeroStock ? 'opacity-60 bg-slate-50/30 dark:bg-slate-900/30' : ''
                        }`}
                      >
                        {/* 1. RM Category */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${getCategoryBadgeStyle(item.category)}`}>
                            {item.category}
                          </span>
                        </td>

                        {/* 2. RM Code */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200/50 dark:border-blue-800/50">
                            {item.code}
                          </span>
                        </td>

                        {/* 3. RM Name */}
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {item.name}
                          </div>
                          {item.batchCount > 0 && (
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <button
                                onClick={() => setInspectedMaterialBatches({ code: item.code, name: item.name, batches: item.batches })}
                                className="text-blue-500 hover:text-blue-600 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                                title="View active batches for this material"
                              >
                                <Layers className="w-3 h-3" />
                                {item.batchCount} batch{item.batchCount > 1 ? 'es' : ''}
                              </button>
                              {item.warehouses.length > 0 && (
                                <span className="text-slate-400">• {item.warehouses.join(', ')}</span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* 4. UOM */}
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {item.unit}
                            </span>
                            <span className="text-slate-400 text-xs">|</span>
                            <div className="flex items-center gap-1" title="Units per carton (Stock is divided by this packaging rate)">
                              <span className="text-[10px] text-slate-400 font-mono">UOM:</span>
                              <input
                                type="number"
                                min="1"
                                max="10000"
                                value={item.uomDivisor}
                                onChange={(e) => handleUpdateCartonRate(item.code, Number(e.target.value))}
                                className="w-14 px-1 py-0.5 text-xs font-mono font-bold text-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                title="Click to adjust packaging divisor (e.g. 50, 100, 16)"
                              />
                            </div>
                          </div>
                        </td>

                        {/* 5. Stock */}
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="font-mono font-bold text-sm">
                            <span className={
                              isZeroStock 
                                ? 'text-slate-400' 
                                : item.stock <= 50 
                                  ? 'text-amber-600 dark:text-amber-400' 
                                  : 'text-emerald-600 dark:text-emerald-400'
                            }>
                              {item.stock.toLocaleString()}
                            </span>
                            <span className="text-xs font-normal text-slate-400 ml-1">
                              {item.unit}
                            </span>
                          </div>
                        </td>

                        {/* 6. Stock Ctn (stock / UOM) */}
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                            {item.stockCtn.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} CTN
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {fullCartons.toLocaleString()} CTN {loosePieces > 0 ? `+ ${loosePieces.toLocaleString()} pcs` : 'full'}
                          </div>
                        </td>

                        {/* 7. Stock Value */}
                        {canViewRMStockVal && (
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <div className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">
                              {formatCurrency(item.stockValue)}
                            </div>
                            {item.stock > 0 && (
                              <div className="text-[11px] text-slate-400 font-mono">
                                avg {formatCurrency(item.avgRate)}/{item.unit}
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Grand Total Footer */}
              {filteredRawMaterialsStock.length > 0 && (
                <tfoot className="bg-slate-50 dark:bg-slate-900/90 font-bold border-t-2 border-slate-300 dark:border-slate-600 text-xs text-slate-800 dark:text-slate-200">
                  <tr>
                    <td colSpan={3} className="px-4 py-3.5 uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Grand Total ({filteredRawMaterialsStock.length} Raw Materials)
                    </td>
                    <td className="px-4 py-3.5 text-center text-slate-400 font-normal">
                      -
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                      {stockSummaryTotals.totalStock.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-blue-600 dark:text-blue-400 text-sm">
                      {stockSummaryTotals.totalStockCtn.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} CTN
                    </td>
                    {canViewRMStockVal && (
                      <td className="px-4 py-3.5 text-right font-mono text-indigo-600 dark:text-indigo-400 text-sm">
                        {formatCurrency(stockSummaryTotals.totalStockValue)}
                      </td>
                    )}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      ) : activeTab === 'batches' ? (
        /* ================= BATCH-WISE STOCK TABLE ================= */
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase text-xs font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3.5">Material</th>
                  <th className="px-4 py-3.5">Batch Details</th>
                  <th className="px-4 py-3.5">Supplier &amp; Date</th>
                  {canViewRMPurchaseRate && <th className="px-4 py-3.5 text-right">Purchase Rate</th>}
                  <th className="px-4 py-3.5 text-right">Received</th>
                  <th className="px-4 py-3.5 text-right">Issued</th>
                  <th className="px-4 py-3.5 text-right">Available</th>
                  {canViewBatchStockVal && <th className="px-4 py-3.5 text-right">Stock Value</th>}
                  <th className="px-4 py-3.5">Warehouse</th>
                  <th className="px-4 py-3.5 text-center">Barcode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {displayBatches.length === 0 ? (
                  <tr>
                    <td colSpan={8 + (canViewRMPurchaseRate ? 1 : 0) + (canViewBatchStockVal ? 1 : 0)} className="px-4 py-12 text-center text-slate-400">
                      No raw material inventory batches found matching the filters.
                    </td>
                  </tr>
                ) : (
                  displayBatches.map(batch => {
                    const isDepleted = batch.availableQty <= 0;
                    const stockValue = canViewBatchStockVal ? (batch.availableQty * batch.unitPurchaseRate) : 0;
                    const isAutoReconciled = batch.id.startsWith('batch-auto-') || batch.grnRef === 'BULK-UPLOAD-STOCK';

                    return (
                      <tr 
                        key={batch.id} 
                        className={`hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition ${
                          isDepleted ? 'opacity-60 bg-slate-50/30 dark:bg-slate-900/30' : ''
                        }`}
                      >
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {batch.materialName}
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                            {batch.materialCode}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded inline-block">
                            {batch.batchNumber}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {batch.batchBarcode}
                          </div>
                          {isAutoReconciled && (
                            <span className="mt-1 inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              Excel Bulk Stock
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                            {batch.supplierName}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {batch.purchaseDate}
                          </div>
                        </td>

                        {canViewRMPurchaseRate && (
                          <td className="px-4 py-3.5 text-right font-mono font-medium text-slate-900 dark:text-white">
                            {formatCurrency(batch.unitPurchaseRate)}
                          </td>
                        )}

                        <td className="px-4 py-3.5 text-right font-mono text-slate-600 dark:text-slate-300">
                          {batch.receivedQty.toLocaleString()} {batch.unit}
                        </td>

                        <td className="px-4 py-3.5 text-right font-mono text-amber-600 dark:text-amber-400">
                          {batch.issuedQty.toLocaleString()} {batch.unit}
                        </td>

                        <td className="px-4 py-3.5 text-right font-mono font-bold">
                          <span className={
                            isDepleted 
                              ? 'text-slate-400' 
                              : batch.availableQty <= 50 
                                ? 'text-amber-600 dark:text-amber-400' 
                                : 'text-emerald-600 dark:text-emerald-400'
                          }>
                            {batch.availableQty.toLocaleString()} {batch.unit}
                          </span>
                        </td>

                        {canViewBatchStockVal && (
                          <td className="px-4 py-3.5 text-right font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                            {formatCurrency(stockValue)}
                          </td>
                        )}

                        <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                          <span className="flex items-center gap-1">
                            <Warehouse className="w-3.5 h-3.5 text-slate-400" />
                            {batch.warehouseName}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => setSelectedBatchForLabel(batch)}
                            title="Print Batch Barcode Sticker"
                            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition cursor-pointer"
                          >
                            <Barcode className="w-4 h-4" />
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
      ) : (
        /* ================= MOVEMENT HISTORY TABLE ================= */
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase text-xs font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3.5">Timestamp</th>
                  <th className="px-4 py-3.5">Movement Type</th>
                  <th className="px-4 py-3.5">Material &amp; Batch</th>
                  <th className="px-4 py-3.5 text-right">Quantity</th>
                  {canViewRMPurchaseRate && <th className="px-4 py-3.5 text-right">Unit Cost</th>}
                  {canViewBatchStockVal && <th className="px-4 py-3.5 text-right">Total Cost</th>}
                  <th className="px-4 py-3.5">Reference No</th>
                  <th className="px-4 py-3.5">Warehouse</th>
                  <th className="px-4 py-3.5">Performed By</th>
                  <th className="px-4 py-3.5 text-right">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={8 + (canViewRMPurchaseRate ? 1 : 0) + (canViewBatchStockVal ? 1 : 0)} className="px-4 py-12 text-center text-slate-400">
                      No inventory movements found.
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map(m => {
                    const isInward = m.movementType === 'RECEIPT';
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition">
                        <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {new Date(m.timestamp || m.date).toLocaleString()}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isInward
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : m.movementType === 'ISSUE'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {isInward ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            {m.movementType}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-900 dark:text-white text-xs">
                            {m.materialName} ({m.materialCode})
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            Batch: {m.batchNumber}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-right font-mono font-semibold">
                          <span className={isInward ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                            {isInward ? '+' : '-'}{m.quantity}
                          </span>
                        </td>

                        {canViewRMPurchaseRate && (
                          <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                            {formatCurrency(m.unitCost || m.unitCostBDT || 0)}
                          </td>
                        )}

                        {canViewBatchStockVal && (
                          <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-900 dark:text-white">
                            {formatCurrency(m.totalCost || m.totalValueBDT || 0)}
                          </td>
                        )}

                        <td className="px-4 py-3.5 text-xs font-mono text-blue-600 dark:text-blue-400">
                          {m.referenceNo || m.referenceNumber || ''}
                        </td>

                        <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                          {m.warehouseName || m.targetWarehouseName || 'Kushtia Warehouse'}
                        </td>

                        <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                          {m.performedBy}
                        </td>

                        <td className="px-4 py-3.5 text-right font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                          {m.balanceAfter}
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

      {/* Barcode Scanner Modal */}
      <BatchBarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectBatch={(batch) => {
          setSelectedBatchForLabel(batch);
        }}
      />

      {/* Bulk Stock Excel Upload Modal */}
      <BulkStockUploadModal
        isOpen={isBulkStockUploadOpen}
        onClose={() => setIsBulkStockUploadOpen(false)}
        onSuccess={() => {
          setSyncSuccessMessage('Bulk Excel stock imported successfully! Active batches and barcodes generated.');
          setTimeout(() => setSyncSuccessMessage(null), 5000);
        }}
      />

      {/* Barcode Sticker Print Modal */}
      {selectedBatchForLabel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Barcode className="w-5 h-5 text-indigo-500" />
                Batch Barcode Label
              </h3>
              <button
                onClick={() => setSelectedBatchForLabel(null)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <BarcodeDisplay
              batch={selectedBatchForLabel}
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedBatchForLabel(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Material Active Batches Inspection Modal */}
      {inspectedMaterialBatches && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {inspectedMaterialBatches.name}
                  </h3>
                  <p className="text-xs font-mono text-blue-600 dark:text-blue-400">
                    Code: {inspectedMaterialBatches.code} • {inspectedMaterialBatches.batches.length} Batch(es)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectedMaterialBatches(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-700/60">
              {inspectedMaterialBatches.batches.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">
                  No active batches recorded for this material.
                </div>
              ) : (
                inspectedMaterialBatches.batches.map(b => (
                  <div key={b.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <div className="font-mono font-bold text-slate-900 dark:text-white">
                        {b.batchNumber}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Barcode: {b.batchBarcode} • {b.supplierName}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>Date: {b.purchaseDate}</span>
                        <span>• Wh: {b.warehouseName}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {b.availableQty.toLocaleString()} {b.unit}
                      </div>
                      {canViewRMPurchaseRate && (
                        <div className="text-[11px] text-slate-500 font-mono">
                          @ {formatCurrency(b.unitPurchaseRate)}
                        </div>
                      )}
                      {canViewBatchStockVal && (
                        <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono font-semibold">
                          Val: {formatCurrency(b.availableQty * b.unitPurchaseRate)}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-700 shrink-0">
              <button
                onClick={() => setInspectedMaterialBatches(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition cursor-pointer"
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
