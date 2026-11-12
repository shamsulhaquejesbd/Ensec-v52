import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  X, UploadCloud, Download, FileSpreadsheet, CheckCircle2, 
  AlertCircle, Layers, Check, RefreshCw 
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';

interface BulkStockUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ParsedStockRow {
  code: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  rate: number;
  warehouse: string;
  supplier: string;
  isValid: boolean;
  errorMessage?: string;
}

export const BulkStockUploadModal: React.FC<BulkStockUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { rawMaterials, bulkAddRawMaterials, formatCurrency } = useERP();

  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedStockRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Generate dynamic sample Excel template
  const handleDownloadExcelTemplate = () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);

    const data = (rawMaterials.length > 0 ? rawMaterials : [
      { code: 'RM00001', name: 'Smart BMS 48V 16S 100A', category: 'BMS', unit: 'Pieces', stockKushtia: 1000, lastPurchaseUnitCostBDT: 3850 },
      { code: 'RM00002', name: 'GPS & IoT Tracker 4G Cat-1', category: 'GPS & Tracking', unit: 'Pieces', stockKushtia: 1000, lastPurchaseUnitCostBDT: 5000 },
      { code: 'RM00003', name: 'LCD Smart Display Unit', category: 'Display & Meters', unit: 'Pieces', stockKushtia: 1000, lastPurchaseUnitCostBDT: 2000 },
    ]).map((mat) => ({
      'Material Code': mat.code,
      'Material Name': mat.name,
      'Category': mat.category || 'Cell',
      'UOM / Unit': mat.unit || 'Pieces',
      'Stock Quantity': Number(mat.stockKushtia || 1000),
      'Unit Purchase Rate (BDT)': Number(mat.lastPurchaseUnitCostBDT || mat.standardCostBDT || 3850),
      'Warehouse': 'Kushtia Warehouse',
      'Supplier': 'Contemporary Amperex Tech (CATL) Co. Ltd.',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [
      { wch: 16 }, // Code
      { wch: 38 }, // Name
      { wch: 18 }, // Category
      { wch: 14 }, // UOM
      { wch: 18 }, // Stock
      { wch: 24 }, // Rate
      { wch: 20 }, // Warehouse
      { wch: 36 }, // Supplier
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Raw Materials Stock');
    XLSX.writeFile(workbook, `Ensec_Raw_Material_Stock_Upload_Template_${dateStr}.xlsx`);
  };

  // Download CSV template
  const handleDownloadCSVTemplate = () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);

    const headers = [
      'Material Code',
      'Material Name',
      'Category',
      'UOM',
      'Stock Quantity',
      'Purchase Rate (BDT)',
      'Warehouse',
      'Supplier',
    ];

    const sampleRows = [
      ['RM00001', 'Smart BMS 48V 16S 100A', 'BMS', 'Pieces', '1000', '3850', 'Kushtia Warehouse', 'CATL Co. Ltd.'],
      ['RM00002', 'GPS & IoT Tracker 4G Cat-1', 'GPS', 'Pieces', '1000', '5000', 'Kushtia Warehouse', 'CATL Co. Ltd.'],
      ['RM00005', 'HY-37180 LiFePO4 Cell 3.2V', 'Cell', 'Pieces', '1000', '5558', 'Kushtia Warehouse', 'CATL Co. Ltd.'],
    ];

    const csvContent = '\uFEFF' + [headers.join(','), ...sampleRows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ensec_Raw_Material_Stock_Template_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Process File
  const handleProcessFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsParsing(true);
    setParseError(null);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawJson: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      if (!rawJson || rawJson.length === 0) {
        throw new Error('The uploaded spreadsheet contains no data rows.');
      }

      const rows: ParsedStockRow[] = rawJson.map((row, idx) => {
        // Normalize keys
        const getVal = (...keys: string[]): any => {
          for (const key of keys) {
            for (const [k, v] of Object.entries(row)) {
              const clean = k.toLowerCase().replace(/[^a-z0-9]/g, '');
              if (clean === key.toLowerCase().replace(/[^a-z0-9]/g, '')) {
                return v;
              }
            }
          }
          return undefined;
        };

        const code = String(getVal('Material Code', 'RM Code', 'Code', 'Item Code', 'SKU') || `RM${String(idx + 1).padStart(5, '0')}`).trim();
        const name = String(getVal('Material Name', 'RM Name', 'Name', 'Item Name', 'Description') || `Raw Material ${code}`).trim();
        const category = String(getVal('Category', 'RM Category', 'Classification') || 'Cell').trim();
        const unit = String(getVal('UOM / Unit', 'UOM', 'Unit', 'Unit of Measure') || 'Pieces').trim();
        const stock = Number(getVal('Stock Quantity', 'Stock', 'Quantity', 'Qty', 'Received Qty', 'Current Stock')) || 0;
        const rate = Number(getVal('Unit Purchase Rate (BDT)', 'Purchase Rate (BDT)', 'Purchase Rate', 'Unit Purchase Rate', 'Rate', 'Cost', 'Unit Cost')) || 0;
        const warehouse = String(getVal('Warehouse', 'Location', 'Warehouse Name') || 'Kushtia Warehouse').trim();
        const supplier = String(getVal('Supplier', 'Supplier Name', 'Vendor') || 'Contemporary Amperex Tech (CATL) Co. Ltd.').trim();

        const isValid = Boolean(code && stock >= 0);

        return {
          code,
          name,
          category,
          unit,
          stock,
          rate,
          warehouse,
          supplier,
          isValid,
        };
      });

      setParsedRows(rows);
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse Excel file. Ensure valid .xlsx, .xls, or .csv format.');
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

  const filteredPreviewRows = parsedRows.filter(r => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q);
  });

  const totalStockUnits = parsedRows.reduce((sum, r) => sum + r.stock, 0);
  const totalStockValuation = parsedRows.reduce((sum, r) => sum + (r.stock * r.rate), 0);

  // Submit and create batches
  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;
    setIsSubmitting(true);
    setParseError(null);

    try {
      if (bulkAddRawMaterials) {
        const payload = parsedRows.map(r => ({
          code: r.code,
          name: r.name,
          category: r.category,
          unit: r.unit,
          stockKushtia: r.stock,
          totalAvailableStock: r.stock,
          lastPurchaseUnitCostBDT: r.rate,
          standardCostBDT: r.rate,
          warehouseName: r.warehouse,
          supplierName: r.supplier,
          status: 'Active' as const,
        }));

        const result = await bulkAddRawMaterials(payload, { updateExisting: true });
        if (result.success) {
          if (onSuccess) onSuccess();
          onClose();
        } else {
          setParseError(result.error || 'Failed to import stock.');
        }
      }
    } catch (err: any) {
      setParseError(err.message || 'Error occurred while saving imported stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-5 text-xs max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Bulk Raw Material Stock Upload (Excel / CSV)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Auto-generates Batches & Barcodes
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Upload raw material stock from Excel spreadsheets. All items immediately appear in both <b>Batch-wise stock</b> and <b>Raw materials stock</b>.
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

        {/* Step 1: Download Sample Template */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 dark:from-blue-950/40 dark:via-slate-900 dark:to-emerald-950/40 border border-blue-200 dark:border-blue-800/60 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-xs">
                  Step 1: Download Standard Excel Template
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                  Ready to Fill
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Template pre-configured with Material Code, Name, Category, UOM, Stock Quantity, Purchase Rate, and Warehouse columns.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownloadExcelTemplate}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs cursor-pointer text-xs"
              >
                <Download className="w-4 h-4" />
                <span>Download Template (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadCSVTemplate}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 font-semibold transition cursor-pointer text-xs"
                title="Download CSV format"
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
            className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40'
                : file
                ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-950/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 bg-slate-50/50 dark:bg-slate-800/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center space-y-1.5">
              <div className="p-2.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {file ? file.name : 'Click to select or drag and drop completed Excel (.xlsx, .xls) or CSV file'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Supports all Excel formats (.xlsx, .xls) and CSV
              </p>
            </div>
          </div>
        </div>

        {/* Error message */}
        {parseError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 flex items-center gap-2 text-xs shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{parseError}</span>
          </div>
        )}

        {/* Step 3: Parsed Content Preview Table */}
        {parsedRows.length > 0 && (
          <div className="flex-1 flex flex-col min-h-0 space-y-2">
            <div className="flex items-center justify-between pb-1 shrink-0">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-900 dark:text-white text-xs">
                  Stock Preview ({parsedRows.length} Items)
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  Total Units: {totalStockUnits.toLocaleString()}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  Valuation: {formatCurrency(totalStockValuation)}
                </span>
              </div>

              <input
                type="text"
                placeholder="Search preview..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              />
            </div>

            <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 border-b border-slate-200 dark:border-slate-700 font-bold uppercase text-[10px] text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Code</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2 text-right">Stock Qty</th>
                    <th className="px-3 py-2 text-right">Purchase Rate</th>
                    <th className="px-3 py-2 text-right">Stock Value</th>
                    <th className="px-3 py-2">Warehouse</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPreviewRows.map((r, idx) => (
                    <tr key={`${r.code}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-3 py-2 font-mono font-bold text-blue-600 dark:text-blue-400">{r.code}</td>
                      <td className="px-3 py-2 font-semibold text-slate-900 dark:text-white">{r.name}</td>
                      <td className="px-3 py-2">{r.category}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {r.stock.toLocaleString()} {r.unit}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{formatCurrency(r.rate)}</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(r.stock * r.rate)}
                      </td>
                      <td className="px-3 py-2 text-slate-500">{r.warehouse}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition cursor-pointer text-xs"
          >
            Cancel
          </button>

          {parsedRows.length > 0 && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirmImport}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-md shadow-blue-500/20 cursor-pointer text-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Posting Stock & Generating Batches...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirm &amp; Import {parsedRows.length} Materials into Inventory</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
