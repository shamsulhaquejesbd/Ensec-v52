import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  X,
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  Info,
  Layers,
  ChevronDown,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { RawMaterial } from '../../types/erp.ts';

export interface BulkReceiptItem {
  materialId: string;
  materialCode: string;
  materialName: string;
  category?: string;
  unit?: string;
  orderedQty: number;
  receivedQty: number;
  unitPurchaseRate: number;
  discount: number;
  additionalCosts: number;
  batchNumber: string;
  batchBarcode: string;
  remarks: string;
  isValid: boolean;
  validationIssue?: string;
}

interface BulkGRNUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawMaterials: RawMaterial[];
  onApplyItems: (items: any[], mode: 'replace' | 'append') => void;
}

export const BulkGRNUploadModal: React.FC<BulkGRNUploadModalProps> = ({
  isOpen,
  onClose,
  rawMaterials,
  onApplyItems,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedRows, setParsedRows] = useState<BulkReceiptItem[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [filterNonZeroOnly, setFilterNonZeroOnly] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Active raw materials from registry
  const activeMaterials = rawMaterials.filter((m) => m.status !== 'Inactive');

  // Generate and download dynamic Excel template with latest database data
  const handleDownloadExcelTemplate = () => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const dateStr = now.toISOString().slice(0, 10);

    const data = activeMaterials.map((mat, idx) => {
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

    // Set column widths
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

  // Generate and download CSV template option
  const handleDownloadCSVTemplate = () => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const dateStr = now.toISOString().slice(0, 10);

    const headers = [
      'Material Code',
      'Material Name',
      'Category',
      'Unit of Measure (UOM)',
      'Current Warehouse Stock',
      'Ordered Quantity',
      'Receive Quantity (ENTER QTY)',
      'Unit Purchase Rate (BDT)',
      'Discount (BDT)',
      'Additional Costs (BDT)',
      'Batch Number',
      'Batch Barcode',
      'Remarks / Inspection Notes',
      'Material ID (System ID)',
    ];

    const escapeCsv = (val: any) => {
      const s = String(val ?? '');
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const csvLines = [headers.join(',')];
    activeMaterials.forEach((mat, idx) => {
      const seq = String(idx + 1).padStart(3, '0');
      const rate = Number(mat.lastPurchaseUnitCostBDT || mat.standardCostBDT || 0);
      const stock = Number(mat.stockKushtia ?? mat.totalAvailableStock ?? 0);

      const row = [
        escapeCsv(mat.code),
        escapeCsv(mat.name),
        escapeCsv(mat.category || 'General'),
        escapeCsv(mat.unit || 'Pieces'),
        escapeCsv(stock),
        escapeCsv(0),
        escapeCsv(0),
        escapeCsv(rate),
        escapeCsv(0),
        escapeCsv(0),
        escapeCsv(`RM-BATCH-${yearMonth}-${seq}`),
        escapeCsv(`BC-BATCH-${yearMonth.slice(2)}-${seq}`),
        escapeCsv('Grade A inspected upon inward gate receipt.'),
        escapeCsv(mat.id),
      ];
      csvLines.push(row.join(','));
    });

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Ensec_Active_Raw_Materials_GRN_Template_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper to reliably match raw materials
  const findMaterial = (row: any): RawMaterial | undefined => {
    // 1. By Material ID
    const rawId = row['Material ID (System ID)'] || row['Material ID'] || row['materialId'] || row['id'] || row['ID'];
    if (rawId) {
      const targetId = String(rawId).trim();
      const match = rawMaterials.find((m) => String(m.id).trim() === targetId);
      if (match) return match;
    }

    // 2. By Material Code
    const rawCode = row['Material Code'] || row['code'] || row['Code'] || row['materialCode'] || row['Item Code'];
    if (rawCode) {
      const sCode = String(rawCode).trim().toLowerCase();
      const sCodeClean = sCode.replace(/[^a-z0-9]/gi, '');
      const match = rawMaterials.find((m) => {
        if (!m?.code) return false;
        const mc = m.code.trim().toLowerCase();
        return mc === sCode || mc.replace(/[^a-z0-9]/gi, '') === sCodeClean;
      });
      if (match) return match;
    }

    // 3. By Material Name
    const rawName = row['Material Name'] || row['name'] || row['Name'] || row['materialName'] || row['Item Name'];
    if (rawName) {
      const sName = String(rawName).trim().toLowerCase();
      const match = rawMaterials.find((m) => m.name && m.name.trim().toLowerCase() === sName);
      if (match) return match;
    }

    return undefined;
  };

  // Parse uploaded file
  const handleProcessFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsParsing(true);
    setParseError(null);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error('No sheets found in the uploaded file.');
      }
      const sheet = workbook.Sheets[sheetName];
      const json: any[] = XLSX.utils.sheet_to_json(sheet);

      if (!json || json.length === 0) {
        throw new Error('The spreadsheet contains no data rows.');
      }

      const yearMonth = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;

      const processed: BulkReceiptItem[] = json.map((row, idx) => {
        const mat = findMaterial(row);

        // Extract received qty
        const rawRecQty =
          row['Receive Quantity (ENTER QTY)'] ??
          row['Receive Quantity'] ??
          row['Received Qty'] ??
          row['receivedQty'] ??
          row['Receive Qty'] ??
          row['Qty'] ??
          row['Quantity'] ??
          0;
        const receivedQty = Math.max(0, Number(rawRecQty) || 0);

        // Extract ordered qty
        const rawOrdQty =
          row['Ordered Quantity'] ?? row['Ordered Qty'] ?? row['orderedQty'] ?? 0;
        const orderedQty = Math.max(0, Number(rawOrdQty) || (receivedQty > 0 ? receivedQty : 0));

        // Extract unit rate
        const rawRate =
          row['Unit Purchase Rate (BDT)'] ??
          row['Unit Purchase Rate'] ??
          row['Unit Rate'] ??
          row['unitPurchaseRate'] ??
          row['Rate'] ??
          row['Unit Cost'];
        const unitPurchaseRate =
          rawRate !== undefined && rawRate !== null && !isNaN(Number(rawRate)) && Number(rawRate) > 0
            ? Number(rawRate)
            : Number(mat?.lastPurchaseUnitCostBDT || mat?.standardCostBDT || 0);

        const discount = Math.max(0, Number(row['Discount (BDT)'] ?? row['Discount'] ?? row['discount'] ?? 0) || 0);
        const additionalCosts = Math.max(0, Number(row['Additional Costs (BDT)'] ?? row['Additional Costs'] ?? row['additionalCosts'] ?? 0) || 0);

        const seq = String(idx + 1).padStart(3, '0');
        const batchNumber =
          String(row['Batch Number'] ?? row['batchNumber'] ?? row['Batch'] ?? '').trim() ||
          `RM-BATCH-${yearMonth}-${seq}`;
        const batchBarcode =
          String(row['Batch Barcode'] ?? row['batchBarcode'] ?? row['Barcode'] ?? '').trim() ||
          `BC-BATCH-${yearMonth.slice(2)}-${seq}`;
        const remarks =
          String(row['Remarks / Inspection Notes'] ?? row['Remarks'] ?? row['remarks'] ?? row['Notes'] ?? '').trim() ||
          'Inward consignment inspected via Bulk GRN import.';

        const isValid = Boolean(mat);
        let validationIssue: string | undefined;
        if (!mat) {
          validationIssue = 'Material Code/Name not recognized in Master Registry';
        }

        return {
          materialId: mat ? mat.id : `unknown-${idx}`,
          materialCode: mat ? mat.code : String(row['Material Code'] || row['code'] || 'UNKNOWN'),
          materialName: mat ? mat.name : String(row['Material Name'] || row['name'] || 'Unknown Material'),
          category: mat?.category,
          unit: mat?.unit || 'Pieces',
          orderedQty,
          receivedQty,
          unitPurchaseRate,
          discount,
          additionalCosts,
          batchNumber,
          batchBarcode,
          remarks,
          isValid,
          validationIssue,
        };
      });

      setParsedRows(processed);
    } catch (err: any) {
      setParseError(err.message || 'Failed to read spreadsheet. Ensure valid Excel (.xlsx, .xls) or CSV format.');
      setParsedRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  // Filter rows based on non-zero quantity toggle and search query
  const eligibleRows = parsedRows.filter((r) => {
    if (filterNonZeroOnly && r.receivedQty <= 0) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      r.materialCode.toLowerCase().includes(q) ||
      r.materialName.toLowerCase().includes(q) ||
      (r.category && r.category.toLowerCase().includes(q)) ||
      r.batchNumber.toLowerCase().includes(q)
    );
  });

  const totalItemsWithQty = parsedRows.filter((r) => r.receivedQty > 0).length;
  const totalReceivedUnits = parsedRows.reduce((sum, r) => sum + (r.receivedQty || 0), 0);
  const totalValuationBDT = parsedRows.reduce((sum, r) => {
    const gross = (r.receivedQty || 0) * (r.unitPurchaseRate || 0);
    return sum + gross - (r.discount || 0) + (r.additionalCosts || 0);
  }, 0);

  // Apply to GRN table
  const handleApply = () => {
    // If filterNonZeroOnly is active, import non-zero items; otherwise import all valid items
    const toImport = parsedRows.filter((r) => r.isValid && (filterNonZeroOnly ? r.receivedQty > 0 : true));

    if (toImport.length === 0) {
      setParseError('No materials with Received Quantity > 0 found to import. Please check your Excel file or uncheck "Only import items with Receive Quantity > 0".');
      return;
    }

    const converted = toImport.map((row) => ({
      materialId: row.materialId,
      orderedQty: row.orderedQty,
      receivedQty: row.receivedQty,
      unitPurchaseRate: row.unitPurchaseRate,
      discount: row.discount,
      additionalCosts: row.additionalCosts,
      batchNumber: row.batchNumber,
      batchBarcode: row.batchBarcode,
      remarks: row.remarks,
    }));

    onApplyItems(converted, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-5 text-xs max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Bulk Raw Material GRN Upload
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Excel & CSV Compatible
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Generate an always-updated Excel template with all active raw materials, enter received quantities, and import consignment rows in one step.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Download Dynamic Template Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-blue-950/40 border border-emerald-200 dark:border-emerald-800/60 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-xs">
                  Step 1: Download Sample Excel Template
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                  {activeMaterials.length} Active Materials
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Populated dynamically with all currently active raw materials from the master database. Simply open the Excel file, fill in the <b>Receive Quantity</b> column for materials received, and upload.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownloadExcelTemplate}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs cursor-pointer text-xs"
              >
                <Download className="w-4 h-4" />
                <span>Download Sample Excel Template (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadCSVTemplate}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 font-semibold transition cursor-pointer text-xs"
                title="Download plain CSV format"
              >
                <span>CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Step 2: Upload Dropzone */}
        <div className="shrink-0">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40'
                : file
                ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-950/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-emerald-400 bg-slate-50/50 dark:bg-slate-800/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {file ? file.name : 'Click to browse or drag and drop completed Excel / CSV file here'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Parsing Error */}
        {parseError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 flex items-center gap-2 text-xs shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{parseError}</span>
          </div>
        )}

        {/* Step 3: Parsed Content Preview Table */}
        {parsedRows.length > 0 && (
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            {/* Toolbar & Filter */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-1 shrink-0">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-900 dark:text-white text-xs">
                  Consignment Items Preview
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {parsedRows.length} Total Rows in File
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  {totalItemsWithQty} Items with Received Qty &gt; 0
                </span>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs select-none">
                  <input
                    type="checkbox"
                    checked={filterNonZeroOnly}
                    onChange={(e) => setFilterNonZeroOnly(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    Show only items with Received Qty &gt; 0 (Consignment Items)
                  </span>
                </label>

                <div className="relative w-48">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search material..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Scrollable Table */}
            <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl min-h-[160px] max-h-[320px]">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-2.5 w-10 text-center">#</th>
                    <th className="p-2.5 w-32">Code</th>
                    <th className="p-2.5 min-w-[200px]">Material Name</th>
                    <th className="p-2.5 w-24">UOM</th>
                    <th className="p-2.5 w-28 text-right bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300">
                      Receive Qty *
                    </th>
                    <th className="p-2.5 w-28 text-right">Unit Rate (BDT)</th>
                    <th className="p-2.5 w-32 text-right">Line Valuation</th>
                    <th className="p-2.5 w-36">Batch Number</th>
                    <th className="p-2.5 w-24 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {eligibleRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        {filterNonZeroOnly ? (
                          <div className="space-y-1">
                            <p className="font-semibold text-slate-600 dark:text-slate-300">
                              No items with Receive Quantity &gt; 0 found.
                            </p>
                            <p className="text-[11px]">
                              Enter quantities in the Excel file or uncheck "Show only items with Received Qty &gt; 0" to view all active materials.
                            </p>
                          </div>
                        ) : (
                          <p>No materials match your search.</p>
                        )}
                      </td>
                    </tr>
                  ) : (
                    eligibleRows.map((row, idx) => {
                      const lineGross = row.receivedQty * row.unitPurchaseRate;
                      const lineTotal = lineGross - row.discount + row.additionalCosts;

                      return (
                        <tr
                          key={`${row.materialCode}-${idx}`}
                          className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/40 ${
                            !row.isValid ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''
                          }`}
                        >
                          <td className="p-2.5 text-center font-mono text-[11px] text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="p-2.5 font-mono font-bold text-slate-700 dark:text-slate-300">
                            {row.materialCode}
                          </td>
                          <td className="p-2.5">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {row.materialName}
                            </div>
                            {row.category && (
                              <span className="text-[10px] text-slate-400">
                                {row.category}
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-slate-500">
                            {row.unit}
                          </td>
                          <td className="p-2.5 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/10">
                            {row.receivedQty.toLocaleString()}
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-700 dark:text-slate-300">
                            ৳ {row.unitPurchaseRate.toLocaleString()}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                            ৳ {lineTotal.toLocaleString()}
                          </td>
                          <td className="p-2.5 font-mono text-[11px] text-amber-600 dark:text-amber-400">
                            {row.batchNumber}
                          </td>
                          <td className="p-2.5 text-center">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-3 h-3" /> Ready
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400" title={row.validationIssue}>
                                <AlertTriangle className="w-3 h-3" /> Unmatched
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary Banner */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4 shrink-0 text-xs">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Consignment Items</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {totalItemsWithQty} materials
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Inward Units</span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    {totalReceivedUnits.toLocaleString()} units
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Purchase Valuation</span>
                  <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
                    ৳ {totalValuationBDT.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-500 font-semibold">Table Mode:</span>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Replace table rows</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Append to table</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 shrink-0">
          <div className="text-[11px] text-slate-500">
            {parsedRows.length > 0
              ? `${totalItemsWithQty} consignment items ready to import into the Raw Material Receive table.`
              : 'Download the template, fill in Receive Quantity, and upload.'}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>

            {parsedRows.length > 0 && (
              <button
                type="button"
                onClick={handleApply}
                disabled={totalItemsWithQty === 0}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Apply to Consignment Items Table ({totalItemsWithQty} Items)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
