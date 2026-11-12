import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { 
  Cpu, Layers, Plus, Trash2, History, CheckCircle2, 
  X, AlertCircle, Calendar, ShieldCheck, FileText,
  Upload, Download, FileSpreadsheet, Sparkles, Check, Info, FileUp, AlertTriangle,
  Loader2, Database
} from 'lucide-react';
import { Product, BOMDefinition, BOMItem, BOMRevision } from '../../types/erp';
import { BOMExportModal } from './BOMExportModal';

interface BOMManagementModalProps {
  product: Product;
  onClose: () => void;
  initialOpenUpload?: boolean;
}

interface UploadDraftRow {
  id: string;
  code: string;
  name: string;
  matchedMaterialId: string;
  requiredQty: number | string;
  unit: string;
  expectedWastagePercent: number | string;
  notes: string;
  isMatched: boolean;
}

interface DraftBOMItem {
  materialId: string;
  requiredQty: number | string;
  unit: string;
  expectedWastagePercent: number | string;
  notes?: string;
}

const extractItemWastage = (it: any): number => {
  if (!it) return 0;
  const candidates = [
    it.expectedWastagePercent,
    it.expected_wastage_percent,
    it.wastagePercent,
    it.wastage_percent,
    it.wastage,
    it.scrapPercent,
    it.scrap_percent
  ];
  for (const c of candidates) {
    if (c !== undefined && c !== null && c !== '') {
      const n = Number(c);
      if (!isNaN(n)) return n;
    }
  }
  return 0;
};

export const BOMManagementModal: React.FC<BOMManagementModalProps> = ({
  product,
  onClose,
  initialOpenUpload = false,
}) => {
  if (!product) {
    return null;
  }

  const { 
    rawMaterials, 
    boms, 
    updateBOMDefinition, 
    addRawMaterial,
    formatCurrency 
  } = useERP();

  // Find existing BOM for this product or initialize
  const existingBOM = boms.find(
    b =>
      b.productId === product.id ||
      (product.code && b.productCode === product.code) ||
      (product.model && b.productModel === product.model)
  );

  const [version, setVersion] = useState(existingBOM?.version || '1.1');
  const [effectiveDate, setEffectiveDate] = useState(
    existingBOM?.effectiveDate || new Date().toISOString().substring(0, 10)
  );
  const [changeNotes, setChangeNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Items in active editor (pre-filled from existing BOM or product.bom)
  const initialItemsList = (existingBOM?.items && existingBOM.items.length > 0)
    ? existingBOM.items
    : (product.bom && product.bom.length > 0)
    ? product.bom
    : null;

  const [items, setItems] = useState<DraftBOMItem[]>(() => {
    if (initialItemsList && initialItemsList.length > 0) {
      return initialItemsList.map((it: any) => ({
        materialId: it.materialId || (rawMaterials[0]?.id || ''),
        requiredQty: it.requiredQty !== undefined && it.requiredQty !== null ? it.requiredQty : 1,
        unit: it.unit || 'PCS',
        expectedWastagePercent: extractItemWastage(it),
        notes: it.notes || ''
      }));
    }
    return [
      {
        materialId: rawMaterials[0]?.id || '',
        requiredQty: 4,
        unit: 'PCS',
        expectedWastagePercent: 0,
        notes: 'Primary cells'
      }
    ];
  });

  const [bulkWastageInput, setBulkWastageInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [itemToDeleteIndex, setItemToDeleteIndex] = useState<number | null>(null);

  // Raw Material Upload State
  const [showUploadModal, setShowUploadModal] = useState(initialOpenUpload);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState<'replace' | 'append'>('replace');
  const [draftRows, setDraftRows] = useState<UploadDraftRow[]>([]);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [showPastedText, setShowPastedText] = useState(false);
  const [pastedCSVText, setPastedCSVText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportTargetVersion, setExportTargetVersion] = useState<string>('active');

  const handleApplyBulkWastage = () => {
    if (bulkWastageInput.trim() === '') return;
    const num = parseFloat(bulkWastageInput.trim());
    if (isNaN(num) || num < 0 || num > 100) {
      setValidationError('Bulk wastage percentage must be a number between 0% and 100%.');
      return;
    }
    const cleanVal = Math.round(num * 100) / 100;
    setItems(prev => prev.map(it => ({ ...it, expectedWastagePercent: cleanVal })));
    setSuccessToast(`Applied ${cleanVal}% wastage to all ${items.length} components.`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleDownloadTemplate = () => {
    const headers = ['Material Code', 'Material Name', 'Required Qty', 'UOM', 'Wastage %', 'Notes'];
    const sampleRows = [
      ['RM-CELL-001', 'LiFePO4 3.2V 105Ah Prismatic Cell', '16', 'PCS', '0.5', 'Grade-A cell matched'],
      ['RM-BMS-001', 'Smart 16S 100A CAN/RS485 BMS Board', '1', 'PCS', '0.0', 'Pre-tested bench unit'],
      ['RM-BUS-001', 'Nickel-Plated Copper Busbars', '15', 'PCS', '0.2', 'Laser-cut standard busbar'],
      ['RM-CAS-001', '3U Rackmount Server Enclosure Sheet Metal', '1', 'PCS', '0.0', 'Custom powder coated'],
      ['RM-CAB-001', 'Silicone 8AWG Flexible High-Temp Wire Cable', '3.5', 'MTR', '1.0', 'Flame retardant 200C'],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BOM_Template_${product.model.replace(/\s+/g, '_')}_v${version}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSVContent = (text: string, filename?: string) => {
    setUploadFileName(filename || 'Uploaded File');
    setUploadError(null);

    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) {
      setUploadError('The file content is empty.');
      return;
    }

    let startIndex = 0;
    const firstLine = lines[0].toLowerCase();
    if (
      firstLine.includes('code') ||
      firstLine.includes('name') ||
      firstLine.includes('material') ||
      firstLine.includes('qty') ||
      firstLine.includes('item')
    ) {
      startIndex = 1;
    }

    const parsed: UploadDraftRow[] = [];

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      const regex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g;
      const cols: string[] = [];
      let match: RegExpExecArray | null;
      while ((match = regex.exec(line)) !== null) {
        let val = match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2];
        cols.push(val ? val.trim() : '');
      }

      if (cols.length < 2) continue;

      const col0 = cols[0] || '';
      const col1 = cols[1] || '';
      const col2 = cols[2] || '';
      const col3 = cols[3] || '';
      const col4 = cols[4] || '';
      const col5 = cols[5] || '';

      let code = '';
      let name = '';
      let qty = 1;
      let unit = 'PCS';
      let wastage = 0.5;
      let notes = '';

      if (!isNaN(parseFloat(col1)) && isFinite(Number(col1))) {
        name = col0;
        qty = parseFloat(col1) || 1;
        unit = col2 || 'PCS';
        wastage = !isNaN(parseFloat(col3)) ? parseFloat(col3) : 0.5;
        notes = col4 || col5 || '';
      } else {
        code = col0;
        name = col1;
        qty = !isNaN(parseFloat(col2)) ? parseFloat(col2) : 1;
        unit = col3 || 'PCS';
        wastage = !isNaN(parseFloat(col4)) ? parseFloat(col4) : 0.5;
        notes = col5 || '';
      }

      const cleanCode = code.toLowerCase().trim();
      const cleanName = name.toLowerCase().trim();

      const matched = (rawMaterials || []).find((rm) => {
        const rmCode = rm.code.toLowerCase().trim();
        const rmName = rm.name.toLowerCase().trim();
        return (
          (cleanCode && rmCode === cleanCode) ||
          (cleanName && rmName === cleanName) ||
          (cleanCode && rmName.includes(cleanCode)) ||
          (cleanName && rmName.includes(cleanName)) ||
          (cleanCode && rmCode.includes(cleanCode))
        );
      });

      parsed.push({
        id: `draft-${i}-${Date.now()}-${Math.random()}`,
        code: matched ? matched.code : (code || `RM-${(i + 1).toString().padStart(3, '0')}`),
        name: matched ? matched.name : (name || code || `Raw Material Item ${i + 1}`),
        matchedMaterialId: matched ? matched.id : (rawMaterials && rawMaterials[0] ? rawMaterials[0].id : ''),
        requiredQty: qty > 0 ? qty : 1,
        unit: matched ? matched.unit : (unit || 'PCS'),
        expectedWastagePercent: wastage >= 0 ? wastage : 0.5,
        notes: notes,
        isMatched: Boolean(matched),
      });
    }

    if (parsed.length === 0) {
      setUploadError('Could not find valid rows in the CSV. Please check the template format.');
    } else {
      setDraftRows(parsed);
    }
  };

  const handleLoadSampleCSV = () => {
    const sampleCSVText = `Material Code,Material Name,Required Qty,UOM,Wastage %,Notes
RM-CELL-001,LiFePO4 3.2V 105Ah Prismatic Cell,16,PCS,0.5,Grade-A cell matched
RM-BMS-001,Smart 16S 100A CAN/RS485 BMS Board,1,PCS,0.0,Pre-tested bench unit
RM-BUS-001,Nickel-Plated Copper Busbars,15,PCS,0.2,Laser-cut standard busbar
RM-CAS-001,3U Rackmount Server Enclosure Sheet Metal,1,PCS,0.0,Custom powder coated
RM-CAB-001,Silicone 8AWG Flexible High-Temp Wire Cable,3.5,MTR,1.0,Flame retardant 200C`;
    parseCSVContent(sampleCSVText, 'sample_bom_raw_materials.csv');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        parseCSVContent(text, file.name);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        parseCSVContent(text, file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleApplyUploadedMaterials = async () => {
    if (draftRows.length === 0) return;
    setIsProcessingUpload(true);

    try {
      const resolvedItems: {
        materialId: string;
        requiredQty: number;
        unit: string;
        expectedWastagePercent: number;
        notes?: string;
      }[] = [];

      for (const row of draftRows) {
        let finalMatId = row.matchedMaterialId;

        if (!finalMatId) {
          const found = (rawMaterials || []).find(
            (rm) => rm.code.toLowerCase() === row.code.toLowerCase() || rm.name.toLowerCase() === row.name.toLowerCase()
          );
          if (found) {
            finalMatId = found.id;
          } else if (addRawMaterial) {
            const res = await addRawMaterial({
              code: row.code,
              name: row.name,
              category: 'Lithium Battery Assembly Parts',
              unit: row.unit || 'PCS',
              reorderLevel: 10,
              minimumStock: 5,
              maximumStock: 500,
              status: 'Active',
              notes: 'Auto-created from BOM Master CSV upload',
            });
            if (res && res.id) {
              finalMatId = res.id;
            }
          }
        }

        if (!finalMatId && rawMaterials && rawMaterials.length > 0) {
          finalMatId = rawMaterials[0].id;
        }

        if (finalMatId) {
          resolvedItems.push({
            materialId: finalMatId,
            requiredQty: Number(row.requiredQty) || 1,
            unit: row.unit || 'PCS',
            expectedWastagePercent: Number(row.expectedWastagePercent) || 0,
            notes: row.notes || '',
          });
        }
      }

      if (uploadMode === 'replace') {
        setItems(resolvedItems);
      } else {
        setItems((prev) => [...prev, ...resolvedItems]);
      }

      setShowUploadModal(false);
      setDraftRows([]);
      setUploadFileName('');
      setSuccessToast(`Successfully loaded ${resolvedItems.length} raw material components into BOM Master!`);
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      setUploadError(err.message || 'Error processing uploaded materials.');
    } finally {
      setIsProcessingUpload(false);
    }
  };

  const handleAddItem = () => {
    const firstRM = rawMaterials[0];
    setItems(prev => [
      ...prev,
      {
        materialId: firstRM?.id || '',
        requiredQty: 1,
        unit: firstRM?.unit || 'PCS',
        expectedWastagePercent: 0,
        notes: ''
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleMaterialChange = (index: number, matId: string) => {
    const rm = rawMaterials.find(m => m.id === matId);
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      return {
        ...item,
        materialId: matId,
        unit: rm ? rm.unit : item.unit
      };
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (items.length === 0) {
      setValidationError('BOM must contain at least one raw material component.');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].materialId) {
        setValidationError(`Row ${i + 1}: Select a raw material.`);
        return;
      }
      const rawQty = items[i].requiredQty;
      const numQty = typeof rawQty === 'number' ? rawQty : parseFloat(String(rawQty));
      if (isNaN(numQty) || numQty <= 0) {
        setValidationError(`Row ${i + 1}: Required quantity must be greater than 0.`);
        return;
      }
      const rawWastage = items[i].expectedWastagePercent;
      const numWastage = typeof rawWastage === 'number' ? rawWastage : parseFloat(String(rawWastage));
      if (isNaN(numWastage) || numWastage < 0 || numWastage > 100) {
        setValidationError(`Row ${i + 1}: Wastage percentage must be between 0% and 100%.`);
        return;
      }
    }

    const bomItems: BOMItem[] = items.map(it => {
      const rm = rawMaterials.find(m => m.id === it.materialId || m.code === it.materialId);
      const rawWastage = it.expectedWastagePercent;
      const numWastage = typeof rawWastage === 'number' ? rawWastage : parseFloat(String(rawWastage));
      const validWastage = isNaN(numWastage) ? 0 : Math.max(0, Math.min(100, Math.round(numWastage * 100) / 100));

      const rawQty = it.requiredQty;
      const numQty = typeof rawQty === 'number' ? rawQty : parseFloat(String(rawQty));
      const validQty = isNaN(numQty) || numQty <= 0 ? 1 : Math.round(numQty * 10000) / 10000;

      return {
        materialId: it.materialId,
        materialCode: rm?.code || it.materialId,
        materialName: rm?.name || 'Raw Material',
        requiredQty: validQty,
        unit: it.unit,
        unitCostBDT: rm?.lastPurchaseUnitCostBDT || rm?.standardCostBDT || 0,
        expectedWastagePercent: validWastage,
        expected_wastage_percent: validWastage,
        wastagePercent: validWastage,
        notes: it.notes || ''
      };
    });

    setIsSaving(true);
    try {
      const res = await updateBOMDefinition({
        id: existingBOM?.id || `BOM-${product.model || product.code || product.id}`,
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        productModel: product.model,
        version,
        effectiveDate,
        status: 'Active',
        items: bomItems,
        changeNotes: changeNotes.trim() || `Updated BOM specification to ${version}`
      });

      if (res && res.success === false) {
        setValidationError(res.error || 'Failed to save BOM to Supabase database.');
        setIsSaving(false);
        return;
      }

      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setValidationError(err?.message || 'Error occurred while saving BOM to database.');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 text-xs max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Configure BOM Master & Versioning
                <span className="text-xs font-mono bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded">
                  v{version}
                </span>
                <span className="text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                  <Database className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  Supabase Synced
                </span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                Product: <span className="font-semibold">{product.name}</span> • Model: <span className="font-mono">{product.model}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setExportTargetVersion(version || 'active');
                setShowExportModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-750 transition shadow-2xs cursor-pointer text-xs"
              title="Export this product's BOM specification and revisions"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Export BOM</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {validationError && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'editor'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            BOM Specification
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Revision History ({existingBOM?.revisions?.length || 0})
          </button>
        </div>

        {activeTab === 'editor' ? (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Versioning and Effective Date */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  BOM Version
                </label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="e.g. 1.2"
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  Effective Date
                </label>
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  Revision Notes
                </label>
                <input
                  type="text"
                  value={changeNotes}
                  onChange={(e) => setChangeNotes(e.target.value)}
                  placeholder="e.g. Added BMS cable tolerance"
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* BOM Components Table */}
            <div className="space-y-2">
              {successToast && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 flex items-center justify-between text-xs animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">{successToast}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSuccessToast(null)}
                    className="text-emerald-600 hover:text-emerald-800 text-xs font-bold p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Required Raw Materials per 1 Unit of {product.model}
                  </span>
                  <span className="hidden sm:inline-block text-[11px] text-slate-400 ml-2">
                    ({items.length} {items.length === 1 ? 'component' : 'components'} defined)
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Quick Bulk Wastage Setter */}
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Set All Wastage %:</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={bulkWastageInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val)) setBulkWastageInput(val);
                      }}
                      placeholder="0"
                      className="w-12 p-1 text-right bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleApplyBulkWastage}
                      className="px-2 py-1 text-[11px] font-bold rounded-lg bg-blue-50 hover:bg-blue-600 hover:text-white dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition cursor-pointer"
                      title="Apply this wastage percentage to all component rows in BOM"
                    >
                      Apply to All
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 transition cursor-pointer shadow-xs"
                    title="Upload raw material components from CSV or Excel file"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Raw Materials</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Component</span>
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                    <tr>
                      <th className="p-2.5">Raw Material Component</th>
                      <th className="p-2.5 text-right w-28">Required Qty</th>
                      <th className="p-2.5 w-20">UOM</th>
                      <th className="p-2.5 text-right w-28">Wastage (%)</th>
                      <th className="p-2.5">Component Notes</th>
                      <th className="p-2.5 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {items.map((item, idx) => (
                      <tr key={`bom-item-${item.materialId || 'item'}-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-2.5">
                          <select
                            value={item.materialId}
                            onChange={(e) => handleMaterialChange(idx, e.target.value)}
                            className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                          >
                            {rawMaterials.map((rm, rmIdx) => (
                              <option key={`rm-opt-${rm.id || rmIdx}-${rmIdx}`} value={rm.id}>
                                {rm.name} ({rm.code})
                              </option>
                            ))}
                            {!rawMaterials.some(m => String(m.id) === String(item.materialId)) && item.materialId && (
                              <option key={`rm-fallback-${item.materialId}`} value={item.materialId}>
                                {item.materialId}
                              </option>
                            )}
                          </select>
                        </td>

                        <td className="p-2.5 text-right">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.requiredQty === undefined ? '' : String(item.requiredQty)}
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                                setItems(prev => prev.map((it, i) => i === idx ? { ...it, requiredQty: raw } : it));
                              }
                            }}
                            onBlur={(e) => {
                              const raw = String(e.target.value).trim();
                              if (raw === '' || raw === '.') {
                                setItems(prev => prev.map((it, i) => i === idx ? { ...it, requiredQty: 1 } : it));
                              } else {
                                const num = parseFloat(raw);
                                const cleanQty = isNaN(num) || num <= 0 ? 1 : Math.round(num * 10000) / 10000;
                                setItems(prev => prev.map((it, i) => i === idx ? { ...it, requiredQty: cleanQty } : it));
                              }
                            }}
                            placeholder="1"
                            className="w-full p-1.5 text-right rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </td>

                        <td className="p-2.5 text-slate-600 dark:text-slate-300 font-semibold font-mono">
                          {item.unit}
                        </td>

                        <td className="p-2.5 text-right">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.expectedWastagePercent === undefined ? '' : String(item.expectedWastagePercent)}
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                                setItems(prev => prev.map((it, i) => i === idx ? { ...it, expectedWastagePercent: raw } : it));
                              }
                            }}
                            onBlur={(e) => {
                              const raw = String(e.target.value).trim();
                              if (raw === '' || raw === '.') {
                                setItems(prev => prev.map((it, i) => i === idx ? { ...it, expectedWastagePercent: 0 } : it));
                              } else {
                                const num = parseFloat(raw);
                                const cleanVal = isNaN(num) ? 0 : Math.max(0, Math.min(100, Math.round(num * 100) / 100));
                                setItems(prev => prev.map((it, i) => i === idx ? { ...it, expectedWastagePercent: cleanVal } : it));
                              }
                            }}
                            placeholder="0"
                            className="w-full p-1.5 text-right rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </td>

                        <td className="p-2.5">
                          <input
                            type="text"
                            placeholder="Optional tolerance / specs"
                            value={item.notes}
                            onChange={(e) => {
                              const val = e.target.value;
                              setItems(prev => prev.map((it, i) => i === idx ? { ...it, notes: val } : it));
                            }}
                            className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                          />
                        </td>

                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => setItemToDeleteIndex(idx)}
                            disabled={items.length <= 1}
                            className="p-1 rounded text-slate-400 hover:text-red-500 disabled:opacity-30 transition cursor-pointer"
                            title="Remove Component from BOM"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white rounded-xl font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving to Database...</span>
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Saved to Database!</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save &amp; Create BOM Revision</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Revision History View */
          <div className="space-y-3">
            <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
              <History className="w-4 h-4 text-slate-500" />
              BOM Revision Audit Log
            </h3>

            {(!existingBOM?.revisions || existingBOM.revisions.length === 0) ? (
              <div className="p-8 text-center text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl">
                No past revisions logged yet.
              </div>
            ) : (
              <div className="space-y-2">
                {existingBOM.revisions.map((rev, revIdx) => (
                  <div 
                    key={rev.id || `bom-rev-${rev.version || 'v'}-${rev.revisionDate || rev.effectiveDate || revIdx}-${revIdx}`}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded">
                          v{rev.version}
                        </span>
                        <span className="text-slate-800 dark:text-slate-200 font-semibold text-xs">
                          {rev.changeNotes || rev.changeSummary}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-[11px] flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {rev.effectiveDate || rev.revisionDate} {rev.createdBy ? `(Saved by ${rev.createdBy})` : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setExportTargetVersion(rev.version);
                            setShowExportModal(true);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold transition cursor-pointer"
                          title={`Export revision v${rev.version}`}
                        >
                          <Download className="w-3 h-3" />
                          <span>Export v{rev.version}</span>
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500">
                      Components: {(rev.items || rev.itemsSnapshot || []).map(it => `${it.materialName}: ${it.requiredQty} ${it.unit}`).join(', ') || 'No components logged'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CONFIRM REMOVE BOM ITEM MODAL */}
        {itemToDeleteIndex !== null && items[itemToDeleteIndex] && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 rounded-2xl shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Remove BOM Component?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Without confirmation this item will not be deleted. Are you sure you want to remove this raw material component from the Bill of Materials?
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 space-y-2 border border-slate-200 dark:border-slate-700 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Component:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {rawMaterials.find(m => m.id === items[itemToDeleteIndex].materialId)?.name || 'Selected Component'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Required Quantity:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {items[itemToDeleteIndex].requiredQty} {items[itemToDeleteIndex].unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Product:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {product.name} ({product.model})
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setItemToDeleteIndex(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-750 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleRemoveItem(itemToDeleteIndex);
                    setItemToDeleteIndex(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirm Remove</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RAW MATERIAL UPLOAD MODAL */}
        {showUploadModal && (
          <div className="fixed inset-0 z-65 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
            <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs max-h-[92vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Upload Raw Materials — Configure BOM Master & Versioning
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Product: <strong className="text-slate-700 dark:text-slate-300">{product.name} ({product.model})</strong> • BOM Version: <span className="font-mono font-semibold">v{version}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setDraftRows([]);
                    setUploadError(null);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Template & Quick Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>Download CSV Template</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadSampleCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-semibold hover:bg-purple-100 transition cursor-pointer shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Load Sample Data</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPastedText(!showPastedText)}
                  className="flex items-center gap-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs font-medium cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{showPastedText ? 'Hide Text Area' : 'Paste CSV Text Directly'}</span>
                </button>
              </div>

              {/* Direct Paste Area */}
              {showPastedText && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold text-xs">
                    Paste CSV / TSV Raw Content:
                  </label>
                  <textarea
                    rows={4}
                    value={pastedCSVText}
                    onChange={(e) => setPastedCSVText(e.target.value)}
                    placeholder="Material Code,Material Name,Required Qty,UOM,Wastage %,Notes&#10;RM-CELL-001,LiFePO4 3.2V 105Ah Cell,16,PCS,0.5,Primary cells&#10;RM-BMS-001,Smart 16S 100A BMS,1,PCS,0.0,Standard"
                    className="w-full p-2.5 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (pastedCSVText.trim()) {
                          parseCSVContent(pastedCSVText, 'pasted_bom_items.csv');
                        }
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition cursor-pointer"
                    >
                      Parse Pasted Content
                    </button>
                  </div>
                </div>
              )}

              {/* File Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                    : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-slate-50/50 dark:bg-slate-800/20'
                }`}
              >
                <input
                  type="file"
                  id="bom-raw-csv-file"
                  accept=".csv,.txt,.tsv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="bom-raw-csv-file" className="cursor-pointer block space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                    <FileUp className="w-6 h-6" />
                  </div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                    {uploadFileName ? (
                      <span className="text-emerald-600 dark:text-emerald-400">File Loaded: {uploadFileName}</span>
                    ) : (
                      <span>Click to upload or drag &amp; drop BOM file</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Supports .CSV, .TSV, or text files exported from Excel, ERP, or CAD BOM sheets
                  </p>
                </label>
              </div>

              {/* Error Message */}
              {uploadError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Preview & Verification Section */}
              {draftRows.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                        {draftRows.length} Components Parsed
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        Review items before applying to Master BOM
                      </span>
                    </div>

                    {/* Mode Choice: Replace vs Append */}
                    <div className="flex items-center gap-3 text-xs bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      <label className="flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition">
                        <input
                          type="radio"
                          name="uploadMode"
                          checked={uploadMode === 'replace'}
                          onChange={() => setUploadMode('replace')}
                          className="text-blue-600"
                        />
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          Replace Current ({items.length})
                        </span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition">
                        <input
                          type="radio"
                          name="uploadMode"
                          checked={uploadMode === 'append'}
                          onChange={() => setUploadMode('append')}
                          className="text-blue-600"
                        />
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          Append to Current
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Verification Preview Table */}
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-x-auto max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 font-semibold sticky top-0 z-10">
                        <tr>
                          <th className="p-2">Material Match</th>
                          <th className="p-2 w-24 text-right">Required Qty</th>
                          <th className="p-2 w-16">UOM</th>
                          <th className="p-2 w-20 text-right">Wastage %</th>
                          <th className="p-2">Notes</th>
                          <th className="p-2 text-center w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {draftRows.map((row, idx) => (
                          <tr key={row.id || `draft-row-${row.code || idx}-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="p-2">
                              {row.isMatched ? (
                                <div>
                                  <span className="font-semibold text-slate-900 dark:text-white block">
                                    {row.name}
                                  </span>
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Matched ({row.code})
                                  </span>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1">
                                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                                      {row.name}
                                    </span>
                                    <span className="text-[10px] text-slate-400">({row.code})</span>
                                  </div>
                                  <select
                                    value={row.matchedMaterialId}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const rm = rawMaterials.find(m => m.id === val);
                                      setDraftRows(prev => prev.map((r, i) => i === idx ? {
                                        ...r,
                                        matchedMaterialId: val,
                                        isMatched: true,
                                        name: rm ? rm.name : r.name,
                                        code: rm ? rm.code : r.code,
                                        unit: rm ? rm.unit : r.unit,
                                      } : r));
                                    }}
                                    className="w-full p-1 bg-amber-50/50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded text-[11px]"
                                  >
                                    <option value="">-- Match with Existing Material --</option>
                                    {rawMaterials.map((rm, rmIdx) => (
                                      <option key={`draft-rm-${rm.id || rmIdx}-${rmIdx}`} value={rm.id}>
                                        {rm.name} ({rm.code})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </td>

                            <td className="p-2 text-right">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={row.requiredQty === undefined ? '' : String(row.requiredQty)}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                                    setDraftRows(prev => prev.map((r, i) => i === idx ? { ...r, requiredQty: raw } : r));
                                  }
                                }}
                                onBlur={(e) => {
                                  const raw = String(e.target.value).trim();
                                  const num = parseFloat(raw);
                                  const cleanQty = isNaN(num) || num <= 0 ? 1 : Math.round(num * 10000) / 10000;
                                  setDraftRows(prev => prev.map((r, i) => i === idx ? { ...r, requiredQty: cleanQty } : r));
                                }}
                                className="w-full p-1 text-right rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                              />
                            </td>

                            <td className="p-2 font-mono text-slate-600 dark:text-slate-400">
                              {row.unit}
                            </td>

                            <td className="p-2 text-right">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={row.expectedWastagePercent === undefined ? '' : String(row.expectedWastagePercent)}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                                    setDraftRows(prev => prev.map((r, i) => i === idx ? { ...r, expectedWastagePercent: raw } : r));
                                  }
                                }}
                                onBlur={(e) => {
                                  const raw = String(e.target.value).trim();
                                  const num = parseFloat(raw);
                                  const cleanVal = isNaN(num) ? 0 : Math.max(0, Math.min(100, Math.round(num * 100) / 100));
                                  setDraftRows(prev => prev.map((r, i) => i === idx ? { ...r, expectedWastagePercent: cleanVal } : r));
                                }}
                                className="w-full p-1 text-right rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                              />
                            </td>

                            <td className="p-2">
                              <input
                                type="text"
                                value={row.notes}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setDraftRows(prev => prev.map((r, i) => i === idx ? { ...r, notes: val } : r));
                                }}
                                placeholder="Specs / notes"
                                className="w-full p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                              />
                            </td>

                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => setDraftRows(prev => prev.filter((_, i) => i !== idx))}
                                className="p-1 rounded text-slate-400 hover:text-red-500 cursor-pointer"
                                title="Remove from draft"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Upload Modal Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="text-slate-500 text-[11px]">
                  {draftRows.length > 0 ? (
                    <span>Ready to import <strong className="text-slate-800 dark:text-slate-200">{draftRows.length}</strong> components into BOM Master v{version}</span>
                  ) : (
                    <span>Download template or select a file to preview components</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false);
                      setDraftRows([]);
                      setUploadError(null);
                    }}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyUploadedMaterials}
                    disabled={draftRows.length === 0 || isProcessingUpload}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Apply Uploaded Materials ({draftRows.length})</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BOM Version Wise Export Modal */}
        {showExportModal && (
          <BOMExportModal
            initialProductId={product.id}
            initialVersion={exportTargetVersion}
            onClose={() => setShowExportModal(false)}
          />
        )}
      </div>
    </div>
  );
};
