import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext.tsx';
import { Product, BOMDefinition, BOMItem } from '../../types/erp.ts';
import {
  X,
  Plus,
  Wrench,
  Layers,
  Copy,
  Upload,
  Calendar,
  Package,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface CreateBOMModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBOMCreated: (product: Product, openUploadDirectly?: boolean) => void;
  preSelectedProductId?: string;
}

export const CreateBOMModal: React.FC<CreateBOMModalProps> = ({
  isOpen,
  onClose,
  onBOMCreated,
  preSelectedProductId,
}) => {
  const { products, boms, updateBOMDefinition } = useERP();

  const [selectedProductId, setSelectedProductId] = useState<string>(
    preSelectedProductId || products[0]?.id || ''
  );
  const [version, setVersion] = useState<string>('1.0');
  const [effectiveDate, setEffectiveDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [changeNotes, setChangeNotes] = useState<string>('Initial manufacturing BOM release');
  const [initMode, setInitMode] = useState<'scratch' | 'clone' | 'upload'>('scratch');
  const [cloneSourceProductId, setCloneSourceProductId] = useState<string>('');
  const [productSearch, setProductSearch] = useState<string>('');
  const [filterNoBOMOnly, setFilterNoBOMOnly] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  // Find BOMs for product helper
  const getProductBOM = (prod: Product): BOMDefinition | undefined => {
    return (boms || []).find(
      (b) =>
        b.productId === prod.id ||
        (prod.code && b.productCode === prod.code) ||
        (prod.model && b.productModel === prod.model)
    );
  };

  const getBOMItemCount = (prod: Product): number => {
    const bomDef = getProductBOM(prod);
    if (bomDef?.items && bomDef.items.length > 0) return bomDef.items.length;
    if (prod.bom && prod.bom.length > 0) return prod.bom.length;
    return 0;
  };

  // Products with active BOMs (for cloning)
  const productsWithBOM = products.filter((p) => getBOMItemCount(p) > 0);

  // Filtered target products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !productSearch ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.code && p.code.toLowerCase().includes(productSearch.toLowerCase())) ||
      (p.model && p.model.toLowerCase().includes(productSearch.toLowerCase()));

    const count = getBOMItemCount(p);
    if (filterNoBOMOnly) {
      return matchesSearch && count === 0;
    }
    return matchesSearch;
  });

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedProductId) {
      setErrorMessage('Please select a Finished Product to associate this Bill of Materials with.');
      return;
    }

    if (!selectedProduct) {
      setErrorMessage('Selected product could not be found.');
      return;
    }

    if (!version.trim()) {
      setErrorMessage('Please specify an initial BOM version (e.g. 1.0).');
      return;
    }

    setIsSubmitting(true);

    try {
      let initialItems: BOMItem[] = [];

      // If cloning from an existing product
      if (initMode === 'clone' && cloneSourceProductId) {
        const sourceProd = products.find((p) => p.id === cloneSourceProductId);
        if (sourceProd) {
          const sourceBOM = getProductBOM(sourceProd);
          if (sourceBOM?.items && sourceBOM.items.length > 0) {
            initialItems = sourceBOM.items.map((item) => ({ ...item }));
          } else if (sourceProd.bom && sourceProd.bom.length > 0) {
            initialItems = sourceProd.bom.map((item) => ({ ...item }));
          }
        }
      }

      // If cloning had items, save the cloned BOM definition directly
      if (initMode === 'clone' && initialItems.length > 0) {
        const newBOM: BOMDefinition = {
          id: `bom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          productId: selectedProduct.id,
          productCode: selectedProduct.code,
          productModel: selectedProduct.model,
          productName: selectedProduct.name,
          version: version.trim(),
          effectiveDate,
          status: 'Active',
          items: initialItems,
          notes: changeNotes.trim(),
          changeNotes: changeNotes.trim(),
        };

        await updateBOMDefinition(newBOM);
      }

      setIsSubmitting(false);
      onClose();

      // Launch the visual editor or upload modal for the selected product
      onBOMCreated(selectedProduct, initMode === 'upload');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initialize Bill of Materials.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-blue-50/50 via-slate-50/30 to-indigo-50/50 dark:from-slate-900 dark:to-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Create New Bill of Materials (BOM)
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  Engineering Spec
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Establish an engineering recipe, component allocations, and unit costing for battery manufacturing.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleCreate} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Choose Target Finished Product */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                1. Select Target Finished Product *
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFilterNoBOMOnly(!filterNoBOMOnly)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition cursor-pointer border ${
                    filterNoBOMOnly
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Filter className="w-3 h-3" />
                  <span>{filterNoBOMOnly ? 'Showing: Products Without BOM' : 'Filter: Unconfigured Only'}</span>
                </button>
              </div>
            </div>

            {/* Product Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search battery model name, code (e.g. FG-EN-48100), voltage..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>

            {/* Product Selection List */}
            <div className="max-h-48 overflow-y-auto space-y-1.5 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              {filteredProducts.length === 0 ? (
                <div className="py-6 text-center text-slate-400">
                  <Package className="w-6 h-6 mx-auto mb-1 opacity-50" />
                  <span>No matching finished products found</span>
                </div>
              ) : (
                filteredProducts.map((prod) => {
                  const isSelected = prod.id === selectedProductId;
                  const count = getBOMItemCount(prod);
                  const bomDef = getProductBOM(prod);

                  return (
                    <div
                      key={prod.id}
                      onClick={() => setSelectedProductId(prod.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 dark:border-blue-500 shadow-xs ring-1 ring-blue-500/30'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white truncate">
                              {prod.name}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {prod.code || 'FG-PROD'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            Model: {prod.model} • {prod.voltageV}V {prod.capacityAh}Ah ({prod.batteryType || 'LiFePO4'})
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        {count > 0 ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                            v{bomDef?.version || '1.0'} ({count} items)
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            + Ready for BOM
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Section 2: BOM Specification Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Initial BOM Version *
              </label>
              <input
                type="text"
                required
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g. 1.0 or 1.0-PROD"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Effective Date *</span>
              </label>
              <input
                type="date"
                required
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Engineering Notes / Release Description
            </label>
            <textarea
              rows={2}
              value={changeNotes}
              onChange={(e) => setChangeNotes(e.target.value)}
              placeholder="e.g. Initial engineering production specification, prismatic cell arrangement, standard smart BMS harness..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Section 3: Component Initialization Method */}
          <div className="space-y-2 pt-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              2. Component Specification Setup Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Option 1: Scratch */}
              <div
                onClick={() => setInitMode('scratch')}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  initMode === 'scratch'
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 shadow-xs ring-1 ring-blue-500/30'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                    <Wrench className="w-3.5 h-3.5" />
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white">Build from Scratch</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Open the interactive component builder to select cells, BMS, wiring, and enclosure.
                  </p>
                </div>
                <div className="pt-2 flex items-center text-[10px] font-bold text-blue-600 dark:text-blue-400">
                  <span>Interactive Editor</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </div>
              </div>

              {/* Option 2: Clone */}
              <div
                onClick={() => setInitMode('clone')}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  initMode === 'clone'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 shadow-xs ring-1 ring-indigo-500/30'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2">
                    <Copy className="w-3.5 h-3.5" />
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white">Clone from Existing</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Duplicate component recipe & wastage from another battery model as a starting template.
                  </p>
                </div>
                <div className="pt-2 flex items-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                  <span>Template Copy</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </div>
              </div>

              {/* Option 3: Upload */}
              <div
                onClick={() => setInitMode('upload')}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  initMode === 'upload'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 shadow-xs ring-1 ring-emerald-500/30'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                    <Upload className="w-3.5 h-3.5" />
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white">Import from CSV / Excel</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Directly upload factory engineer spreadsheet with auto-matching raw materials.
                  </p>
                </div>
                <div className="pt-2 flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  <span>File Import</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </div>
              </div>
            </div>

            {/* If clone selected, show dropdown of source products */}
            {initMode === 'clone' && (
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 space-y-2 animate-in fade-in">
                <label className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 block">
                  Select Source BOM Template to Duplicate:
                </label>
                {productsWithBOM.length === 0 ? (
                  <div className="text-[11px] text-indigo-700 dark:text-indigo-300">
                    No existing products have a configured BOM yet. Please select "Build from Scratch".
                  </div>
                ) : (
                  <select
                    value={cloneSourceProductId}
                    onChange={(e) => setCloneSourceProductId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Choose existing configured product template --</option>
                    {productsWithBOM.map((p) => {
                      const count = getBOMItemCount(p);
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.code || 'FG-PROD'}) • {count} Components configured
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="text-[11px] text-slate-500">
              Selected: <span className="font-bold text-slate-900 dark:text-white">{selectedProduct?.name || 'None'}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedProductId}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold transition shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{isSubmitting ? 'Initializing...' : 'Continue to BOM Builder'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
