import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  Box,
  PlusCircle,
  Search,
  AlertTriangle,
  DollarSign,
  Layers,
  CheckCircle2,
  Package,
  Warehouse,
  Filter,
  Info,
  Check,
  Edit3,
  SlidersHorizontal,
  RotateCw,
  Database,
  X,
  Trash2,
  Copy,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  FolderTree,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  FileUp,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { RawMaterial } from '../../types/erp.ts';
export interface RawMaterialsPageProps {
  onNavigate?: (module: string) => void;
}

export const RawMaterialsPage: React.FC<RawMaterialsPageProps> = ({ onNavigate }) => {
  const {
    rawMaterials,
    addRawMaterial,
    bulkAddRawMaterials,
    updateRawMaterial,
    deleteRawMaterial,
    refreshRawMaterials,
    rawMaterialCategories,
    uoms,
    inventoryBatches,
  } = useERP();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' | 'error' } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-sync with database on mount
  useEffect(() => {
    refreshRawMaterials();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshRawMaterials();
      setToastMessage({ text: 'Raw materials inventory refreshed!', type: 'success' });
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const rawUOMs = useMemo(() => {
    return uoms.filter((u) => u.isActive && (u.applicableTo === 'Raw Material' || u.applicableTo === 'Both'));
  }, [uoms]);

  // Modals & form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [deletingMaterial, setDeletingMaterial] = useState<RawMaterial | null>(null);
  const [stockAdjustmentMaterial, setStockAdjustmentMaterial] = useState<RawMaterial | null>(null);
  const [adjustedStockQty, setAdjustedStockQty] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState('Physical Stock Audit / Kushtia Count');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'ADEQUATE'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'Local' | 'Import'>('ALL');

  // Pagination state (default: 10 records per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Reset to page 1 whenever search query, category, stock, or type filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, stockFilter, typeFilter, pageSize]);

  // Create Material form fields
  const [matCategory, setMatCategory] = useState<RawMaterial['category']>('Cell');
  const [matType, setMatType] = useState<'Local' | 'Import'>('Local');
  const [matCode, setMatCode] = useState('');
  const [matName, setMatName] = useState('');
  const [matDescription, setMatDescription] = useState('');
  const [matUnit, setMatUnit] = useState('Pieces');
  const [matUpc, setMatUpc] = useState('');
  const [matBarcode, setMatBarcode] = useState('');
  const [matStockKushtia, setMatStockKushtia] = useState<number>(0);
  const [matReorderLevel, setMatReorderLevel] = useState<number>(100);
  const [matMinimumStock, setMatMinimumStock] = useState<number>(50);
  const [matMaximumStock, setMatMaximumStock] = useState<number>(1000);
  const [matStatus, setMatStatus] = useState<'Active' | 'Inactive'>('Active');
  const [matLastPurchaseUnitCostBDT, setMatLastPurchaseUnitCostBDT] = useState<number>(3850);
  const [matStandardCostBDT, setMatStandardCostBDT] = useState<number>(3800);

  // Helper to generate next sequential Raw Material Code starting from RM00001
  const generateNextRawMaterialCode = () => {
    let maxNum = 0;
    for (const m of rawMaterials) {
      if (!m?.code) continue;
      const match = m.code.trim().toUpperCase().match(/^RM-?(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
    const nextNum = maxNum + 1;
    return `RM${String(nextNum).padStart(5, '0')}`;
  };

  // Auto-generate code and barcodes on category change or click
  const handleCategoryChange = (cat: RawMaterial['category']) => {
    setMatCategory(cat);
    if (!matCode || !matCode.trim()) {
      const generatedCode = generateNextRawMaterialCode();
      setMatCode(generatedCode);
      setMatBarcode(`BC-${generatedCode}`);
      setMatUpc(`88019${Math.floor(1000000 + Math.random() * 9000000)}`);
    }
  };

  const handleRegenerateCode = () => {
    const generatedCode = generateNextRawMaterialCode();
    setMatCode(generatedCode);
    setMatBarcode(`BC-${generatedCode}`);
    setMatUpc(`88019${Math.floor(1000000 + Math.random() * 9000000)}`);
  };

  const handleOpenCreateModal = () => {
    const initialCode = generateNextRawMaterialCode();
    setMatCategory('Cell');
    setMatType('Local');
    setMatCode(initialCode);
    setMatBarcode(`BC-${initialCode}`);
    setMatUpc(`88019${Math.floor(1000000 + Math.random() * 9000000)}`);
    setMatName('');
    setMatDescription('');
    setMatUnit('Pieces');
    setMatStockKushtia(0);
    setMatReorderLevel(100);
    setMatMinimumStock(50);
    setMatMaximumStock(1000);
    setMatStatus('Active');
    setMatLastPurchaseUnitCostBDT(3850);
    setMatStandardCostBDT(3800);
    setModalError(null);
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matName.trim()) return;

    setIsSubmitting(true);
    setModalError(null);

    const generatedCode = matCode.trim() || generateNextRawMaterialCode();

    try {
      const matchedCat = rawMaterialCategories.find((c) => c.name === matCategory);
      const result = await addRawMaterial({
        code: generatedCode,
        name: matName.trim(),
        category: matCategory,
        categoryId: matchedCat?.id,
        type: matType,
        description: matDescription.trim(),
        unit: matUnit,
        upc: matUpc.trim(),
        barcode: matBarcode.trim() || `BC-${generatedCode}`,
        stockKushtia: Number(matStockKushtia) || 0,
        totalAvailableStock: Number(matStockKushtia) || 0,
        reorderLevel: Number(matReorderLevel) || 100,
        minimumStock: Number(matMinimumStock) || 50,
        maximumStock: Number(matMaximumStock) || 1000,
        status: matStatus,
        lastPurchaseUnitCostBDT: Number(matLastPurchaseUnitCostBDT) || 0,
        standardCostBDT: Number(matStandardCostBDT) || 0,
      });

      if (result.isRemoteSynced) {
        setToastMessage({
          text: `Raw material "${matName.trim()}" (${generatedCode}) created and synced to master!`,
          type: 'success',
        });
        setShowCreateModal(false);
      } else {
        setModalError(result.error || 'Failed to save raw material to database.');
      }
    } catch (err: any) {
      setModalError(err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;

    const matchedCategory = rawMaterialCategories.find(
      (c) => c.name === editingMaterial.category || c.id === editingMaterial.categoryId
    );
    const categoryId = matchedCategory ? matchedCategory.id : editingMaterial.categoryId;

    const res = await updateRawMaterial(editingMaterial.id, {
      name: editingMaterial.name,
      code: editingMaterial.code,
      category: editingMaterial.category,
      categoryId: categoryId,
      type: editingMaterial.type || 'Local',
      description: editingMaterial.description,
      unit: editingMaterial.unit,
      upc: editingMaterial.upc,
      barcode: editingMaterial.barcode,
      stockKushtia: Number(editingMaterial.stockKushtia),
      reorderLevel: Number(editingMaterial.reorderLevel),
      minimumStock: Number(editingMaterial.minimumStock || 50),
      maximumStock: Number(editingMaterial.maximumStock || 1000),
      status: editingMaterial.status || 'Active',
      lastPurchaseUnitCostBDT: Number(editingMaterial.lastPurchaseUnitCostBDT),
      standardCostBDT: Number(editingMaterial.standardCostBDT),
    });

    if (res.success) {
      setToastMessage({ text: `Updated specifications for ${editingMaterial.name}`, type: 'success' });
    } else {
      setToastMessage({ text: `Update error: ${res.error || 'Failed'}`, type: 'error' });
    }

    setEditingMaterial(null);
  };

  const handleSaveStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockAdjustmentMaterial) return;

    const res = await updateRawMaterial(stockAdjustmentMaterial.id, {
      stockKushtia: Math.max(0, Number(adjustedStockQty)),
    });

    if (res.success) {
      setToastMessage({
        text: `Kushtia stock buffer updated to ${adjustedStockQty} ${stockAdjustmentMaterial.unit}`,
        type: 'success',
      });
    }

    setStockAdjustmentMaterial(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingMaterial) return;
    const res = await deleteRawMaterial(deletingMaterial.id);
    if (res.success) {
      setToastMessage({ text: `Deleted raw material ${deletingMaterial.name}`, type: 'success' });
    } else {
      setToastMessage({ text: `Delete failed: ${res.error || 'Unknown error'}`, type: 'error' });
    }
    setDeletingMaterial(null);
  };

  // KPI Calculations
  const totalRawStockUnits = rawMaterials.reduce((sum, m) => sum + (m.stockKushtia || 0), 0);
  const totalValuationBDT = rawMaterials.reduce(
    (sum, m) => sum + (m.stockKushtia || 0) * (m.lastPurchaseUnitCostBDT || 0),
    0
  );
  const lowStockItems = rawMaterials.filter((m) => (m.stockKushtia || 0) <= (m.reorderLevel || 0));

  // Filtered List
  const filteredMaterials = rawMaterials.filter((m) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (m.name || '').toLowerCase().includes(q) ||
      (m.code || '').toLowerCase().includes(q) ||
      (m.category || '').toLowerCase().includes(q) ||
      (m.type || '').toLowerCase().includes(q);

    const matchesCategory = selectedCategory === 'ALL' || m.category === selectedCategory;

    const matchesType = typeFilter === 'ALL' || (m.type || 'Local') === typeFilter;

    let matchesStock = true;
    if (stockFilter === 'LOW') {
      matchesStock = (m.stockKushtia || 0) <= (m.reorderLevel || 0);
    } else if (stockFilter === 'ADEQUATE') {
      matchesStock = (m.stockKushtia || 0) > (m.reorderLevel || 0);
    }

    return matchesSearch && matchesCategory && matchesType && matchesStock;
  });

  // Pagination calculations (10 records per page by default)
  const totalRecords = filteredMaterials.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedMaterials = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredMaterials.slice(startIndex, startIndex + pageSize);
  }, [filteredMaterials, safeCurrentPage, pageSize]);

  const startRecord = totalRecords === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endRecord = Math.min(safeCurrentPage * pageSize, totalRecords);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (safeCurrentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (safeCurrentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(safeCurrentPage - 1);
        pages.push(safeCurrentPage);
        pages.push(safeCurrentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  // Export & Upload State
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTab, setUploadTab] = useState<'file' | 'paste'>('file');
  const [pastedContent, setPastedContent] = useState('');
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedUploadRows, setParsedUploadRows] = useState<
    Array<{
      code: string;
      name: string;
      category: string;
      unit: string;
      stockKushtia: number;
      reorderLevel: number;
      minimumStock: number;
      maximumStock: number;
      lastPurchaseUnitCostBDT: number;
      standardCostBDT: number;
      status: 'Active' | 'Inactive';
      description: string;
      notes: string;
      isValid: boolean;
      issue?: string;
      isExisting: boolean;
    }>
  >([]);

  // Export CSV
  const handleExportCSV = (exportFiltered: boolean = false) => {
    const dataToExport = exportFiltered ? filteredMaterials : rawMaterials;
    if (dataToExport.length === 0) {
      setToastMessage({ text: 'No raw materials available to export', type: 'warning' });
      return;
    }

    const headers = [
      'Code',
      'Name',
      'Category',
      'Unit',
      'Stock Kushtia',
      'Reorder Level',
      'Minimum Stock',
      'Maximum Stock',
      'Last Purchase Cost (BDT)',
      'Standard Cost (BDT)',
      'Status',
      'Description',
      'UPC',
      'Barcode',
      'Notes',
    ];

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = dataToExport.map((m) => [
      escapeCSV(m.code),
      escapeCSV(m.name),
      escapeCSV(m.category),
      escapeCSV(m.unit || 'Pieces'),
      escapeCSV(m.stockKushtia ?? 0),
      escapeCSV(m.reorderLevel ?? 0),
      escapeCSV(m.minimumStock ?? 0),
      escapeCSV(m.maximumStock ?? 0),
      escapeCSV(m.lastPurchaseUnitCostBDT ?? 0),
      escapeCSV(m.standardCostBDT ?? 0),
      escapeCSV(m.status || 'Active'),
      escapeCSV(m.description || ''),
      escapeCSV(m.upc || ''),
      escapeCSV(m.barcode || ''),
      escapeCSV(m.notes || ''),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ensec_raw_materials_${exportFiltered ? 'filtered_' : ''}${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToastMessage({
      text: `Exported ${dataToExport.length} raw materials to CSV successfully!`,
      type: 'success',
    });
  };

  // Export JSON
  const handleExportJSON = (exportFiltered: boolean = false) => {
    const dataToExport = exportFiltered ? filteredMaterials : rawMaterials;
    if (dataToExport.length === 0) {
      setToastMessage({ text: 'No raw materials available to export', type: 'warning' });
      return;
    }

    const jsonStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ensec_raw_materials_${exportFiltered ? 'filtered_' : ''}${dateStamp}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToastMessage({
      text: `Exported ${dataToExport.length} raw materials to JSON successfully!`,
      type: 'success',
    });
  };

  // Download Sample CSV Template
  const handleDownloadSampleTemplate = () => {
    const headers = [
      'Code',
      'Name',
      'Category',
      'Unit',
      'Stock Kushtia',
      'Reorder Level',
      'Minimum Stock',
      'Maximum Stock',
      'Last Purchase Cost (BDT)',
      'Standard Cost (BDT)',
      'Status',
      'Description',
      'Notes',
    ];

    const sampleRows = [
      [
        'RM-CELL-280AH',
        '3.2V 280Ah LiFePO4 Prismatic Cell Grade A',
        'Cell',
        'Pieces',
        '1200',
        '200',
        '100',
        '3000',
        '7850',
        '7700',
        'Active',
        'High capacity prismatic cells for commercial EV battery packs',
        'Grade-A EVE/CATL standard',
      ],
      [
        'RM-BMS-60V-100A',
        '60V 16S 100A Smart Bluetooth BMS with CAN/RS485',
        'BMS',
        'Pieces',
        '250',
        '50',
        '20',
        '600',
        '4200',
        '4150',
        'Active',
        'Automotive grade protection board with UART & active balancing',
        'Integrated temp sensors',
      ],
      [
        'RM-BUS-T2',
        'T2 Pure Copper Flexible Nickel-Plated Busbar 20x2mm',
        'Wire & Busbar',
        'Pieces',
        '3500',
        '500',
        '200',
        '10000',
        '125',
        '120',
        'Active',
        'Low resistance cell interconnect busbars with insulating sleeves',
        'M6 hole distance 72mm',
      ],
      [
        'RM-CASE-60V',
        'Ensec 60V Mild Steel Powder-Coated IP65 Casing',
        'Casing',
        'Pieces',
        '180',
        '30',
        '10',
        '500',
        '2850',
        '2800',
        'Active',
        'Laser-cut precision sheet metal case with carry handles and vents',
        'Custom safety lock bracket',
      ],
    ];

    const csvContent =
      '\uFEFF' +
      [
        headers.join(','),
        ...sampleRows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')),
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ensec_raw_materials_sample_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToastMessage({
      text: 'Sample CSV template downloaded! Fill in your materials and upload.',
      type: 'success',
    });
  };

  // Smart Parser for CSV / TSV / JSON
  const parseCSVOrJSON = (content: string, filename?: string) => {
    setUploadError(null);
    setUploadFileName(filename || (uploadTab === 'paste' ? 'Pasted Text Data' : 'Uploaded File'));

    const trimmed = content.trim();
    if (!trimmed) {
      setUploadError('Input content is empty.');
      setParsedUploadRows([]);
      return;
    }

    // Try parsing as JSON first
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const jsonArr = JSON.parse(trimmed);
        if (Array.isArray(jsonArr) && jsonArr.length > 0) {
          const parsed = jsonArr.map((item: any, idx: number) => {
            const code = String(item.code || item.itemCode || item.materialCode || `RM-${Date.now().toString().slice(-4)}-${idx + 1}`).trim();
            const name = String(item.name || item.materialName || item.itemName || '').trim();
            const category = String(item.category || item.classification || 'Cell').trim();
            const unit = String(item.unit || item.uom || 'Pieces').trim();
            const stockKushtia = Number(item.stockKushtia ?? item.stock ?? item.qty ?? 0);
            const reorderLevel = Number(item.reorderLevel ?? item.reorder ?? 50);
            const minimumStock = Number(item.minimumStock ?? 20);
            const maximumStock = Number(item.maximumStock ?? 1000);
            const lastPurchaseUnitCostBDT = Number(item.lastPurchaseUnitCostBDT ?? item.cost ?? item.unitCost ?? 0);
            const standardCostBDT = Number(item.standardCostBDT ?? lastPurchaseUnitCostBDT ?? 0);
            const status: 'Active' | 'Inactive' = String(item.status).toLowerCase() === 'inactive' ? 'Inactive' : 'Active';
            const description = String(item.description || item.notes || '').trim();
            const notes = String(item.notes || '').trim();

            const isValid = Boolean(name && name.length >= 2);
            const isExisting = rawMaterials.some((m) => m.code.trim().toUpperCase() === code.toUpperCase());

            return {
              code,
              name,
              category,
              unit,
              stockKushtia,
              reorderLevel,
              minimumStock,
              maximumStock,
              lastPurchaseUnitCostBDT,
              standardCostBDT,
              status,
              description,
              notes,
              isValid,
              issue: !name ? 'Missing Material Name' : undefined,
              isExisting,
            };
          });

          setParsedUploadRows(parsed);
          return;
        }
      } catch {
        // Not valid JSON, proceed with CSV parsing
      }
    }

    // Parse CSV or TSV
    const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) {
      setUploadError('No data rows found.');
      setParsedUploadRows([]);
      return;
    }

    const delimiter = lines[0].includes('\t') ? '\t' : ',';

    const parseLine = (line: string): string[] => {
      if (delimiter === '\t') {
        return line.split('\t').map((c) => c.trim().replace(/^"(.*)"$/, '$1'));
      }
      const regex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g;
      const cols: string[] = [];
      let match: RegExpExecArray | null;
      while ((match = regex.exec(line)) !== null) {
        const val = match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2];
        cols.push(val ? val.trim() : '');
      }
      return cols;
    };

    const firstLineCols = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const headerMap: Record<string, number> = {};
    let startIndex = 0;

    const isHeader = firstLineCols.some((c) =>
      ['code', 'name', 'category', 'unit', 'uom', 'stock', 'qty', 'cost', 'price', 'material', 'item'].some((k) =>
        c.includes(k)
      )
    );

    if (isHeader) {
      startIndex = 1;
      firstLineCols.forEach((col, idx) => {
        if (col.includes('code') || col === 'sku') headerMap.code = idx;
        else if (col.includes('name') || col.includes('material') || col.includes('item')) headerMap.name = idx;
        else if (col.includes('category') || col.includes('class')) headerMap.category = idx;
        else if (col.includes('unit') || col.includes('uom')) headerMap.unit = idx;
        else if (col.includes('stock') || col.includes('qty')) headerMap.stock = idx;
        else if (col.includes('reorder')) headerMap.reorder = idx;
        else if (col.includes('min')) headerMap.minimum = idx;
        else if (col.includes('max')) headerMap.maximum = idx;
        else if (col.includes('lastpurchase') || col.includes('purchasecost')) headerMap.lastPurchaseCost = idx;
        else if (col.includes('cost') || col.includes('standard') || col.includes('price')) headerMap.standardCost = idx;
        else if (col.includes('status')) headerMap.status = idx;
        else if (col.includes('desc')) headerMap.description = idx;
        else if (col.includes('note') || col.includes('remark')) headerMap.notes = idx;
      });
    }

    const rows: typeof parsedUploadRows = [];

    for (let i = startIndex; i < lines.length; i++) {
      const cols = parseLine(lines[i]);
      if (cols.length === 0 || cols.every((c) => !c)) continue;

      const code = (
        headerMap.code !== undefined ? cols[headerMap.code] : cols[0]
      )?.trim() || `RM-${Date.now().toString().slice(-4)}-${i}`;

      const name = (
        headerMap.name !== undefined ? cols[headerMap.name] : cols[1]
      )?.trim() || '';

      const category = (
        headerMap.category !== undefined ? cols[headerMap.category] : cols[2]
      )?.trim() || 'Cell';

      const unit = (
        headerMap.unit !== undefined ? cols[headerMap.unit] : cols[3]
      )?.trim() || 'Pieces';

      const stockKushtia = Number(
        headerMap.stock !== undefined ? cols[headerMap.stock] : cols[4]
      ) || 0;

      const reorderLevel = Number(
        headerMap.reorder !== undefined ? cols[headerMap.reorder] : cols[5]
      ) || 50;

      const minimumStock = Number(
        headerMap.minimum !== undefined ? cols[headerMap.minimum] : cols[6]
      ) || 20;

      const maximumStock = Number(
        headerMap.maximum !== undefined ? cols[headerMap.maximum] : cols[7]
      ) || 1000;

      const lastPurchaseUnitCostBDT = Number(
        headerMap.lastPurchaseCost !== undefined ? cols[headerMap.lastPurchaseCost] : cols[8]
      ) || 0;

      const standardCostBDT = Number(
        headerMap.standardCost !== undefined
          ? cols[headerMap.standardCost]
          : cols[9] !== undefined
          ? cols[9]
          : lastPurchaseUnitCostBDT
      ) || lastPurchaseUnitCostBDT || 0;

      const rawStatus = (
        headerMap.status !== undefined ? cols[headerMap.status] : cols[10]
      )?.toLowerCase();
      const status: 'Active' | 'Inactive' = rawStatus === 'inactive' ? 'Inactive' : 'Active';

      const description = (
        headerMap.description !== undefined ? cols[headerMap.description] : cols[11]
      )?.trim() || '';

      const notes = (
        headerMap.notes !== undefined ? cols[headerMap.notes] : cols[12]
      )?.trim() || '';

      const isValid = Boolean(name && name.length >= 2);
      const isExisting = rawMaterials.some((m) => m.code.trim().toUpperCase() === code.toUpperCase());

      rows.push({
        code,
        name,
        category,
        unit,
        stockKushtia,
        reorderLevel,
        minimumStock,
        maximumStock,
        lastPurchaseUnitCostBDT,
        standardCostBDT,
        status,
        description,
        notes,
        isValid,
        issue: !name ? 'Missing Material Name' : undefined,
        isExisting,
      });
    }

    if (rows.length === 0) {
      setUploadError('Could not parse any valid raw material rows from the provided data.');
    }

    setParsedUploadRows(rows);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFileName(file.name);
    setUploadError(null);

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        if (isExcel) {
          const buffer = event.target?.result as ArrayBuffer;
          const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[firstSheetName];
          const csvText = XLSX.utils.sheet_to_csv(sheet);
          parseCSVOrJSON(csvText, file.name);
        } else {
          const content = event.target?.result as string;
          parseCSVOrJSON(content, file.name);
        }
      } catch (err: any) {
        setUploadError(err.message || 'Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.');
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read selected file.');
    };

    if (isExcel) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleExecuteImport = async () => {
    const validRows = parsedUploadRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setUploadError('No valid rows to import.');
      return;
    }

    setIsImporting(true);
    setUploadError(null);

    try {
      if (bulkAddRawMaterials) {
        const res = await bulkAddRawMaterials(validRows, { updateExisting });
        if (res.success) {
          setToastMessage({
            text: `Successfully imported ${res.createdCount + res.updatedCount} raw materials (${res.createdCount} added, ${res.updatedCount} updated)!`,
            type: 'success',
          });
          setShowUploadModal(false);
          setParsedUploadRows([]);
          setPastedContent('');
          setUploadFileName('');
        } else {
          setUploadError(res.error || 'Failed to complete import.');
        }
      } else {
        let created = 0;
        let updated = 0;
        for (const row of validRows) {
          const existing = rawMaterials.find((m) => m.code.trim().toUpperCase() === row.code.toUpperCase());
          if (existing && updateExisting) {
            await updateRawMaterial(existing.id, row);
            updated++;
          } else if (!existing) {
            await addRawMaterial(row);
            created++;
          }
        }
        setToastMessage({
          text: `Successfully imported ${created + updated} raw materials (${created} added, ${updated} updated)!`,
          type: 'success',
        });
        setShowUploadModal(false);
        setParsedUploadRows([]);
        setPastedContent('');
        setUploadFileName('');
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Error occurred during import.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Material Master Data Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            disabled
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-xs cursor-default"
          >
            <Box className="w-4 h-4" />
            <span>Raw Materials</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-blue-700/80 text-white font-extrabold uppercase tracking-wider">Active</span>
          </button>

          <button
            onClick={() => onNavigate?.('basic-data-raw-categories')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
          >
            <FolderTree className="w-4 h-4 text-amber-500" />
            <span>Raw Mate Category</span>
          </button>

          <button
            onClick={() => onNavigate?.('basic-data-raw-classifications')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4 text-indigo-500" />
            <span>Raw Mate Classification</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-medium px-3 hidden md:block">
          Basic Data &bull; Material Master Architecture
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Raw Materials Master & Factory Stock
            </h1>
            
          </div>
          
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0 relative">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all shadow-xs cursor-pointer select-none disabled:opacity-50"
            title="Refresh raw materials inventory"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all shadow-xs cursor-pointer select-none"
              title="Export raw materials catalog to CSV or JSON"
            >
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Export</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>

            {showExportMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute right-0 mt-1.5 w-60 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl z-30 py-1.5 text-xs animate-in fade-in slide-in-from-top-1">
                  <div className="px-3.5 py-1.5 border-b border-slate-100 dark:border-slate-700 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Export Raw Materials ({rawMaterials.length} Items)
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowExportMenu(false);
                      handleExportCSV(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">Export All to CSV</div>
                      <div className="text-[10px] text-slate-400">Complete catalog ({rawMaterials.length} items)</div>
                    </div>
                  </button>
                  {filteredMaterials.length !== rawMaterials.length && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowExportMenu(false);
                        handleExportCSV(true);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      <Filter className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">Export Filtered to CSV</div>
                        <div className="text-[10px] text-slate-400">Active filters ({filteredMaterials.length} items)</div>
                      </div>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowExportMenu(false);
                      handleExportJSON(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 cursor-pointer border-t border-slate-100 dark:border-slate-700/60"
                  >
                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">Export as JSON Backup</div>
                      <div className="text-[10px] text-slate-400">Raw database JSON format</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Upload / Import Button */}
          <button
            type="button"
            onClick={() => {
              setShowUploadModal(true);
              setUploadError(null);
              setParsedUploadRows([]);
              setPastedContent('');
              setUploadFileName('');
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all shadow-xs cursor-pointer select-none"
            title="Upload raw materials from CSV or Excel file"
          >
            <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Upload / Import</span>
          </button>

          {/* Add Raw Material Button */}
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-xs cursor-pointer select-none"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Raw Material</span>
          </button>
        </div>
      </div>

      {/* Global Toast Notification */}
      {toastMessage && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl text-xs font-medium border shadow-xs animate-in fade-in slide-in-from-top-1 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : toastMessage.type === 'warning'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Raw Material SKUs</span>
            <Box className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {rawMaterials.length} Items
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            Active Catalog Items
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Kushtia Stock Units</span>
            <Warehouse className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {totalRawStockUnits.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500">Physical factory buffer</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Inventory Valuation</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            ৳ {totalValuationBDT.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">Standard BDT asset value</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Low Stock Warnings</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono">
            {lowStockItems.length}
          </div>
          <div className="text-[11px] text-rose-600 font-medium">Under reorder threshold</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {/* Table Title & Sync Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
            <span>Raw Materials Master Registry</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              {filteredMaterials.length === rawMaterials.length
                ? `${totalRecords} Total Items`
                : `${totalRecords} of ${rawMaterials.length} Filtered`}
            </span>
            {totalRecords > 0 && (
              <span className="text-xs text-slate-500 font-normal">
                • Page {safeCurrentPage} of {totalPages}
              </span>
            )}
          </h2>
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Master Inventory Registry</span>
          </div>
        </div>

        {/* Search & Category Filter Pills */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search raw materials by code (e.g. RM-CELL) or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
            {[
              'ALL',
              ...Array.from(
                new Set([
                  'Cell',
                  'BMS',
                  'Casing',
                  'Wire & Busbar',
                  'Insulation & Pack',
                  'Connector',
                  'PCB',
                  ...(rawMaterialCategories || []).map((c) => c.name),
                ])
              ),
            ].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap text-[11px] transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat === 'ALL' ? 'All Categories' : cat}
              </button>
            ))}

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'ALL' | 'Local' | 'Import')}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">All Types (Local / Import)</option>
              <option value="Local">Local</option>
              <option value="Import">Import</option>
            </select>

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as 'ALL' | 'LOW' | 'ADEQUATE')}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">All Stock Levels</option>
              <option value="LOW">Low Stock Only</option>
              <option value="ADEQUATE">Adequate Stock Only</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Material Code & Identity</th>
                <th className="p-3">Category</th>
                <th className="p-3">UOM</th>
                <th className="p-3 text-right">Available Stock</th>
                <th className="p-3 text-center">Min / Reorder / Max</th>
                <th className="p-3 text-center">Purchase Batches</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto">
                        <Box className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {searchQuery || selectedCategory !== 'ALL' || stockFilter !== 'ALL' || typeFilter !== 'ALL'
                            ? 'No raw materials match your filter criteria'
                            : 'No raw materials in catalog (0 items)'}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {searchQuery || selectedCategory !== 'ALL' || stockFilter !== 'ALL' || typeFilter !== 'ALL'
                            ? 'Try clearing the search query or category/type filters to view all materials.'
                            : 'No raw materials are currently recorded in the database. You can register your first material using the button below.'}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        {searchQuery || selectedCategory !== 'ALL' || stockFilter !== 'ALL' || typeFilter !== 'ALL' ? (
                          <button
                            onClick={() => {
                              setSearchQuery('');
                              setSelectedCategory('ALL');
                              setStockFilter('ALL');
                              setTypeFilter('ALL');
                            }}
                            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                          >
                            Clear Filters
                          </button>
                        ) : null}

                        <button
                          onClick={handleOpenCreateModal}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span>+ Register First Raw Material</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedMaterials.map((rm, idx) => {
                  const isLow = (rm.stockKushtia || 0) <= (rm.reorderLevel || 0);
                  const itemBatches = (inventoryBatches || []).filter(
                    (b) => b.materialId === rm.id || b.materialCode === rm.code
                  );
                  const batchRates = Array.from(new Set(itemBatches.map((b) => b.unitPurchaseRate)));

                  return (
                    <tr key={`${rm.id}-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                            {rm.code}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              rm.type === 'Import'
                                ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                                : 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            }`}
                          >
                            {rm.type || 'Local'}
                          </span>
                          {rm.barcode && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                              {rm.barcode}
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                          {rm.name}
                        </div>
                        {rm.description && (
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">
                            {rm.description}
                          </div>
                        )}
                      </td>

                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {rm.category}
                        </span>
                      </td>

                      <td className="p-3 text-slate-600 dark:text-slate-300">{rm.unit}</td>

                      <td className="p-3 text-right">
                        <span
                          className={`font-mono font-black text-sm ${
                            isLow ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {(rm.stockKushtia || 0).toLocaleString()}
                        </span>
                      </td>

                      <td className="p-3 text-center font-mono text-[11px] text-slate-500">
                        <span className="text-slate-400" title="Minimum Stock">{rm.minimumStock || 50}</span>
                        <span className="mx-1 text-slate-300">/</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400" title="Reorder Level">{rm.reorderLevel || 100}</span>
                        <span className="mx-1 text-slate-300">/</span>
                        <span className="text-slate-400" title="Maximum Stock">{rm.maximumStock || 1000}</span>
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              itemBatches.length > 0
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                            }`}
                          >
                            {itemBatches.length} {itemBatches.length === 1 ? 'Batch' : 'Batches'}
                          </span>
                          {batchRates.length > 0 && (
                            <span className="text-[10px] font-mono text-slate-500">
                              {batchRates.length === 1
                                ? `৳${batchRates[0].toLocaleString()}`
                                : `৳${Math.min(...batchRates).toLocaleString()} - ৳${Math.max(...batchRates).toLocaleString()}`}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            rm.status === 'Inactive'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : isLow
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {rm.status === 'Inactive' ? 'Inactive' : isLow ? 'Low Stock' : 'Active'}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onNavigate && (
                            <button
                              onClick={() => onNavigate('raw-material-receive')}
                              className="px-2 py-1 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
                              title="Receive this raw material"
                            >
                              Receive
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setStockAdjustmentMaterial(rm);
                              setAdjustedStockQty(rm.stockKushtia);
                            }}
                            className="px-2 py-1 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
                            title="Adjust Factory Stock"
                          >
                            Adjust
                          </button>

                          <button
                            onClick={() => setEditingMaterial(rm)}
                            className="px-2 py-1 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-100 transition-colors cursor-pointer"
                            title="Edit Material Specifications"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => setDeletingMaterial(rm)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Delete Material"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {filteredMaterials.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            {/* Range & Total Records Info */}
            <div className="flex flex-wrap items-center gap-2 text-slate-500 dark:text-slate-400">
              <div>
                Showing{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {startRecord}–{endRecord}
                </span>{' '}
                of{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {totalRecords}
                </span>{' '}
                raw material records
                {filteredMaterials.length !== rawMaterials.length && (
                  <span className="text-slate-400 dark:text-slate-500 ml-1">
                    (filtered from {rawMaterials.length} total)
                  </span>
                )}
              </div>

              {/* Page Size Selector */}
              <div className="flex items-center gap-1.5 ml-0 sm:ml-2 pl-0 sm:pl-2 border-l-0 sm:border-l border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-400">Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1 flex-wrap justify-center">
              {/* First Page */}
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage <= 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                title="First Page"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>

              {/* Prev Page */}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage <= 1}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition font-semibold cursor-pointer text-xs"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              {/* Page Number Buttons */}
              <div className="flex items-center gap-1 mx-1">
                {getPageNumbers().map((pageItem, pIdx) => {
                  if (pageItem === '...') {
                    return (
                      <span
                        key={`ellipsis-${pIdx}`}
                        className="px-1.5 py-1 text-slate-400 select-none font-bold text-xs"
                      >
                        …
                      </span>
                    );
                  }

                  const pageNum = Number(pageItem);
                  const isActive = safeCurrentPage === pageNum;

                  return (
                    <button
                      key={`page-${pageNum}`}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                        isActive
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Next Page */}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage >= totalPages}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition font-semibold cursor-pointer text-xs"
                title="Next Page"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Last Page */}
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                title="Last Page"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE RAW MATERIAL MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Box className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Register New Raw Material
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Material Category *
                  </label>
                  <select
                    value={matCategory}
                    onChange={(e) => handleCategoryChange(e.target.value as RawMaterial['category'])}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  >
                    {(rawMaterialCategories && rawMaterialCategories.length > 0
                      ? rawMaterialCategories
                      : [
                          { id: '1', name: 'Cell', description: 'Prismatic / Cylindrical' },
                          { id: '2', name: 'BMS', description: 'Battery Management System' },
                          { id: '3', name: 'Casing', description: 'Rack Steel / ABS Enclosure' },
                          { id: '4', name: 'Wire & Busbar', description: 'Nickel / Copper' },
                          { id: '5', name: 'Insulation & Pack', description: 'Epoxy / Pad' },
                          { id: '6', name: 'Connector', description: 'Laser Stud / Anderson' },
                          { id: '7', name: 'PCB', description: 'PCB & Monitoring Board' },
                        ]
                    ).map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name} {cat.description ? `- ${cat.description.slice(0, 30)}...` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Type (Local / Import) *
                  </label>
                  <select
                    value={matType}
                    onChange={(e) => setMatType(e.target.value as 'Local' | 'Import')}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="Local">Local</option>
                    <option value="Import">Import</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Raw Material Code (Auto Generated) *
                    </label>
                    <button
                      type="button"
                      onClick={handleRegenerateCode}
                      className="text-[10px] font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
                    >
                      Regenerate
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RM00001"
                    value={matCode}
                    onChange={(e) => setMatCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Material Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LiFePO4 Prismatic Cell 3.2V 280Ah Grade A"
                  value={matName}
                  onChange={(e) => setMatName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Description & Specifications
                </label>
                <textarea
                  rows={2}
                  placeholder="Detailed technical specifications, voltage/capacity rating, dimensions, grade, etc."
                  value={matDescription}
                  onChange={(e) => setMatDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Unit of Measurement (UOM) *
                  </label>
                  <select
                    value={matUnit}
                    onChange={(e) => setMatUnit(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {rawUOMs.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name} ({u.symbol})
                      </option>
                    ))}
                    {!rawUOMs.some((u) => u.name === matUnit) && (
                      <option value={matUnit}>{matUnit}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    UPC (Global Code)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 880192342802"
                    value={matUpc}
                    onChange={(e) => setMatUpc(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Item Barcode
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BC-RM00001"
                    value={matBarcode}
                    onChange={(e) => setMatBarcode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Reorder Level
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={matReorderLevel}
                    onChange={(e) => setMatReorderLevel(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Minimum Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={matMinimumStock}
                    onChange={(e) => setMatMinimumStock(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Maximum Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={matMaximumStock}
                    onChange={(e) => setMatMaximumStock(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Status
                  </label>
                  <select
                    value={matStatus}
                    onChange={(e) => setMatStatus(e.target.value as 'Active' | 'Inactive')}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Multi-Batch Architecture Notice */}
              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Batch-Wise Purchase Rate Architecture:</strong> Raw Material Master stores product identity and specifications, not individual purchase rates. Each purchase arrival will create a distinct <strong>Inventory Batch</strong> with its unique batch barcode and immutable purchase rate during <strong>Raw Material Receive</strong>.
                </div>
              </div>

              {/* Status and Diagnostics */}
              {modalError ? (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-rose-900 dark:text-rose-200">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Error Saving Material</span>
                  </div>
                  <p className="leading-relaxed">{modalError}</p>
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Saving Material...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      <span>Save Raw Material</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT RAW MATERIAL MODAL */}
      {editingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Edit Raw Material Specifications
              </h3>
              <button
                onClick={() => setEditingMaterial(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Category *</label>
                  <select
                    value={editingMaterial.category}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      const matched = rawMaterialCategories.find((c) => c.name === selectedName);
                      setEditingMaterial({
                        ...editingMaterial,
                        category: selectedName,
                        categoryId: matched?.id,
                      });
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  >
                    {(rawMaterialCategories && rawMaterialCategories.length > 0
                      ? rawMaterialCategories
                      : [
                          { id: '1', name: 'Cell' },
                          { id: '2', name: 'BMS' },
                          { id: '3', name: 'Casing' },
                          { id: '4', name: 'Wire & Busbar' },
                          { id: '5', name: 'Insulation & Pack' },
                          { id: '6', name: 'Connector' },
                          { id: '7', name: 'PCB' },
                        ]
                    ).map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Code</label>
                  <input
                    type="text"
                    value={editingMaterial.code}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, code: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Type (Local / Import)</label>
                  <select
                    value={editingMaterial.type || 'Local'}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, type: e.target.value as 'Local' | 'Import' })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="Local">Local</option>
                    <option value="Import">Import</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Material Name *</label>
                <input
                  type="text"
                  required
                  value={editingMaterial.name}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Description & Specifications</label>
                <textarea
                  rows={2}
                  value={editingMaterial.description || ''}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">UPC (Global Code)</label>
                  <input
                    type="text"
                    value={editingMaterial.upc || ''}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, upc: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Item Barcode</label>
                  <input
                    type="text"
                    value={editingMaterial.barcode || ''}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, barcode: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Reorder Alert Level
                  </label>
                  <input
                    type="number"
                    value={editingMaterial.reorderLevel}
                    onChange={(e) =>
                      setEditingMaterial({
                        ...editingMaterial,
                        reorderLevel: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Minimum Stock
                  </label>
                  <input
                    type="number"
                    value={editingMaterial.minimumStock || 50}
                    onChange={(e) =>
                      setEditingMaterial({
                        ...editingMaterial,
                        minimumStock: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Maximum Stock
                  </label>
                  <input
                    type="number"
                    value={editingMaterial.maximumStock || 1000}
                    onChange={(e) =>
                      setEditingMaterial({
                        ...editingMaterial,
                        maximumStock: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Status</label>
                <select
                  value={editingMaterial.status || 'Active'}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, status: e.target.value as 'Active' | 'Inactive' })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingMaterial(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Update Specifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADJUST KUSHTIA STOCK MODAL */}
      {stockAdjustmentMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Adjust Kushtia Factory Stock
              </h3>
              <button
                onClick={() => setStockAdjustmentMaterial(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStockAdjustment} className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <div className="font-mono text-[10px] text-amber-600 font-bold">
                  {stockAdjustmentMaterial.code}
                </div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  {stockAdjustmentMaterial.name}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Current Buffer: <b>{stockAdjustmentMaterial.stockKushtia} {stockAdjustmentMaterial.unit}</b>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  New Physical Stock Count ({stockAdjustmentMaterial.unit}) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={adjustedStockQty}
                  onChange={(e) => setAdjustedStockQty(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Adjustment Reason / Audit Notes
                </label>
                <input
                  type="text"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setStockAdjustmentMaterial(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Confirm Stock Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Delete Raw Material?
                </h4>
                <p className="text-[11px] text-slate-500">
                  This action removes the material from your master catalog and database.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="font-mono text-amber-600 font-bold">{deletingMaterial.code}</div>
              <div className="font-semibold text-slate-900 dark:text-white mt-0.5">{deletingMaterial.name}</div>
              <div className="text-[11px] text-slate-400 mt-1">
                Stock: {deletingMaterial.stockKushtia} {deletingMaterial.unit}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingMaterial(null)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
              >
                Delete Material
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD / IMPORT RAW MATERIALS */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col my-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-blue-50/60 dark:bg-blue-950/20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Import Raw Materials</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      CSV / Excel / JSON
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Batch upload or paste raw materials catalog items into factory master database
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSampleTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
                  title="Download standard CSV template with sample data"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Download Template</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Error Alert */}
              {uploadError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <div>
                    <span className="font-bold">Import Notice: </span>
                    <span>{uploadError}</span>
                  </div>
                </div>
              )}

              {/* Mode Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <button
                  type="button"
                  onClick={() => setUploadTab('file')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    uploadTab === 'file'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Upload File (.csv, .json)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUploadTab('paste')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    uploadTab === 'paste'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Paste Data from Excel / Sheets</span>
                </button>
              </div>

              {/* Tab 1: File Upload */}
              {uploadTab === 'file' && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        const content = evt.target?.result as string;
                        parseCSVOrJSON(content, file.name);
                      };
                      reader.readAsText(file);
                    }
                  }}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-2">
                    <FileUp className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    Drag and drop your spreadsheet here
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Supports <strong>.xlsx</strong>, <strong>.xls</strong>, <strong>.csv</strong>, <strong>.tsv</strong>, and <strong>.json</strong> files
                  </p>

                  <div className="mt-4 flex items-center justify-center gap-3">
                    <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs inline-flex items-center gap-2 transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Browse Files</span>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv,.tsv,.txt,.json,text/csv,text/plain,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleDownloadSampleTemplate}
                      className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Sample Template</span>
                    </button>
                  </div>

                  {uploadFileName && (
                    <div className="mt-3 text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Loaded: {uploadFileName}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Paste Data */}
              {uploadTab === 'paste' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Paste rows copied from Excel, Google Sheets, or CSV
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const sampleText = `RM-CELL-105\t3.2V 105Ah LiFePO4 Cell Grade A\tCell\tPieces\t500\t100\t50\t2000\t4500\t4400\tActive\tPrismatic cell
RM-BMS-48V-60A\t48V 16S 60A Smart BMS with Bluetooth\tBMS\tPieces\t120\t30\t10\t400\t3200\t3100\tActive\tIntegrated NTC temp sensors
RM-CONN-AND120\tAnderson 120A High-Current Connector Plug\tConnector\tSets\t400\t100\t50\t1500\t350\t340\tActive\tSilver-plated copper contacts`;
                        setPastedContent(sampleText);
                        parseCSVOrJSON(sampleText, 'Sample Pasted Text');
                      }}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Paste Sample Demo Data
                    </button>
                  </div>

                  <textarea
                    rows={6}
                    value={pastedContent}
                    onChange={(e) => {
                      setPastedContent(e.target.value);
                      parseCSVOrJSON(e.target.value, 'Pasted Data');
                    }}
                    placeholder={`Paste tabular data here (tab-separated from Excel or comma-separated CSV):
Code	Name	Category	Unit	Stock	Reorder	Min	Max	LastCost	StdCost	Status
RM-CELL-105	3.2V 105Ah LiFePO4 Cell	Cell	Pieces	500	100	50	2000	4500	4400	Active`}
                    className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white leading-relaxed focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Options */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={updateExisting}
                    onChange={(e) => setUpdateExisting(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Update existing raw materials if item code matches
                  </span>
                </label>

                <div className="text-[11px] text-slate-500">
                  Target Table: <code className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">public.raw_materials</code>
                </div>
              </div>

              {/* Parsed Rows Preview */}
              {parsedUploadRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Parsed Items Preview
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        {parsedUploadRows.length} Items Total
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {parsedUploadRows.filter((r) => r.isValid && !r.isExisting).length} New
                      </span>
                      {parsedUploadRows.some((r) => r.isExisting) && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          {parsedUploadRows.filter((r) => r.isExisting).length} To Update
                        </span>
                      )}
                      {parsedUploadRows.some((r) => !r.isValid) && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          {parsedUploadRows.filter((r) => !r.isValid).length} Invalid
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto max-h-56">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold sticky top-0">
                        <tr>
                          <th className="p-2.5">Code</th>
                          <th className="p-2.5">Name</th>
                          <th className="p-2.5">Category</th>
                          <th className="p-2.5">Unit</th>
                          <th className="p-2.5 text-right">Stock</th>
                          <th className="p-2.5 text-right">Last Cost (BDT)</th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                        {parsedUploadRows.map((row, idx) => (
                          <tr
                            key={idx}
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                              !row.isValid
                                ? 'bg-rose-50/60 dark:bg-rose-950/20'
                                : row.isExisting
                                ? 'bg-amber-50/40 dark:bg-amber-950/20'
                                : ''
                            }`}
                          >
                            <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                              {row.code}
                            </td>
                            <td className="p-2.5 font-sans text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                              {row.name || <span className="text-rose-500 font-bold">Missing Name</span>}
                            </td>
                            <td className="p-2.5 font-sans text-slate-600 dark:text-slate-400">
                              {row.category}
                            </td>
                            <td className="p-2.5 font-sans text-slate-600 dark:text-slate-400">
                              {row.unit}
                            </td>
                            <td className="p-2.5 text-right text-slate-900 dark:text-white font-bold">
                              {row.stockKushtia}
                            </td>
                            <td className="p-2.5 text-right text-slate-700 dark:text-slate-300">
                              ৳{row.lastPurchaseUnitCostBDT.toLocaleString()}
                            </td>
                            <td className="p-2.5">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-sans font-bold ${
                                  row.status === 'Active'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {row.status}
                              </span>
                            </td>
                            <td className="p-2.5 font-sans">
                              {!row.isValid ? (
                                <span className="text-rose-600 font-bold text-[10px]">Invalid</span>
                              ) : row.isExisting ? (
                                <span className="text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                                  {updateExisting ? 'Update' : 'Skip'}
                                </span>
                              ) : (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                                  Create
                                </span>
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

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
              <div className="text-xs text-slate-500">
                {parsedUploadRows.length > 0 && (
                  <span>
                    Ready to import:{' '}
                    <strong className="text-slate-900 dark:text-white">
                      {parsedUploadRows.filter((r) => r.isValid).length}
                    </strong>{' '}
                    items
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={isImporting}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 font-semibold cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={isImporting || parsedUploadRows.filter((r) => r.isValid).length === 0}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isImporting ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Importing Raw Materials...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>
                        Import {parsedUploadRows.filter((r) => r.isValid).length > 0 ? `${parsedUploadRows.filter((r) => r.isValid).length} Raw Materials` : 'Materials'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
