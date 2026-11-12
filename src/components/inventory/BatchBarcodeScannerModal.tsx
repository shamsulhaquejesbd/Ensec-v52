import React, { useState, useEffect } from 'react';
import {
  Barcode as BarcodeIcon,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Warehouse,
  Calendar,
  DollarSign,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { InventoryBatch } from '../../types/erp.ts';
import { BarcodeDisplay } from './BarcodeDisplay.tsx';

interface BatchBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBatch?: (batch: InventoryBatch) => void;
}

export const BatchBarcodeScannerModal: React.FC<BatchBarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectBatch,
}) => {
  const { inventoryBatches, findBatchByBarcode } = useERP();
  const [scanQuery, setScanQuery] = useState('');
  const [matchedBatch, setMatchedBatch] = useState<InventoryBatch | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setScanQuery('');
      setMatchedBatch(null);
      setHasSearched(false);
    }
  }, [isOpen]);

  const handleLookup = (query: string) => {
    setScanQuery(query);
    if (!query.trim()) {
      setMatchedBatch(null);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    const result = findBatchByBarcode(query);
    if (result) {
      setMatchedBatch(result);
    } else {
      // Also search by material code or name
      const queryLower = query.toLowerCase().trim();
      const fallback = inventoryBatches.find(
        (b) =>
          b.batchNumber.toLowerCase().includes(queryLower) ||
          b.batchBarcode.toLowerCase().includes(queryLower) ||
          b.materialCode.toLowerCase().includes(queryLower) ||
          b.materialName.toLowerCase().includes(queryLower)
      );
      setMatchedBatch(fallback || null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <BarcodeIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Batch Barcode Scanner & Lookup
              </h3>
              <p className="text-[11px] text-slate-500">
                Scan or enter purchase batch barcode to inspect specifications, cost, and stock
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner Input */}
        <div className="space-y-2">
          <label className="font-semibold text-slate-700 dark:text-slate-300 block">
            Scan Barcode / Enter Batch Number
          </label>
          <div className="relative">
            <BarcodeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 dark:text-blue-400" />
            <input
              type="text"
              autoFocus
              placeholder="Point handheld barcode scanner or type e.g. BC-BATCH-2601-001..."
              value={scanQuery}
              onChange={(e) => handleLookup(e.target.value)}
              className="w-full pl-10 pr-24 py-3 rounded-xl border-2 border-blue-500/50 focus:border-blue-600 dark:border-blue-500/40 dark:focus:border-blue-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm tracking-wider shadow-inner"
            />
            {scanQuery && (
              <button
                onClick={() => handleLookup('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Quick Test Barcode Buttons */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Quick Test Barcode Scans:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {inventoryBatches.slice(0, 4).map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => handleLookup(b.batchBarcode || b.batchNumber)}
                className="px-2.5 py-1 rounded-lg font-mono text-[10px] bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/60 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                {b.batchBarcode} ({b.materialCode})
              </button>
            ))}
          </div>
        </div>

        {/* Scan Result Container */}
        {matchedBatch ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                    Verified Batch Identified
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-xs">
                  {matchedBatch.status}
                </span>
              </div>

              {/* Required Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Material Name</span>
                  <span className="font-bold text-slate-900 dark:text-white line-clamp-1">{matchedBatch.materialName}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Item Code</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{matchedBatch.materialCode}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Batch Number</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{matchedBatch.batchNumber}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Supplier</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{matchedBatch.supplierName}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Purchase Date</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{matchedBatch.purchaseDate}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Purchase Rate</span>
                  <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
                    BDT {matchedBatch.unitPurchaseRate.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-slate-400 block">per {matchedBatch.unit}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Received Quantity</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {matchedBatch.receivedQty.toLocaleString()} {matchedBatch.unit}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Available Stock</span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    {matchedBatch.availableQty.toLocaleString()} {matchedBatch.unit}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Warehouse Location</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{matchedBatch.warehouseName}</span>
                </div>
              </div>
            </div>

            {/* Printable Label View */}
            <BarcodeDisplay batch={matchedBatch} showPrintButton={true} />

            {onSelectBatch && (
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onSelectBatch(matchedBatch);
                    onClose();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Select This Batch for Production Issue</span>
                </button>
              </div>
            )}
          </div>
        ) : hasSearched ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              No Batch Found with Barcode "{scanQuery}"
            </h4>
            <p className="text-xs text-slate-500">
              Please double check the barcode label or enter the batch code manually.
            </p>
          </div>
        ) : (
          <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs space-y-1">
            <BarcodeIcon className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">Ready to Scan</p>
            <p className="text-[11px] text-slate-400">
              Scan barcode on material carton or click one of the quick test badges above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
