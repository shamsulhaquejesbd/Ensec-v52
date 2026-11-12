import React from 'react';
import { Printer, QrCode, Barcode as BarcodeIcon } from 'lucide-react';
import { InventoryBatch } from '../../types/erp.ts';

interface BarcodeDisplayProps {
  batch?: InventoryBatch;
  value?: string;
  itemCode?: string;
  materialName?: string;
  batchNumber?: string;
  supplierName?: string;
  purchaseDate?: string;
  purchaseRate?: number;
  receivedQty?: number;
  warehouse?: string;
  showPrintButton?: boolean;
}

export const BarcodeDisplay: React.FC<BarcodeDisplayProps> = ({ 
  batch: propBatch, 
  value, 
  itemCode, 
  materialName, 
  batchNumber, 
  supplierName, 
  purchaseDate, 
  purchaseRate, 
  receivedQty, 
  warehouse, 
  showPrintButton = true 
}) => {
  const batch: InventoryBatch = propBatch || {
    id: `batch-${Date.now()}`,
    batchNumber: batchNumber || 'RM-BATCH-001',
    batchBarcode: value || 'RM-BC-001',
    materialId: 'rm-1',
    materialCode: itemCode || 'RM-0001',
    materialName: materialName || 'Raw Material',
    unit: 'PCS',
    supplierId: 'sup-1',
    supplierName: supplierName || 'Supplier',
    purchaseDate: purchaseDate || new Date().toISOString().substring(0, 10),
    unitPurchaseRate: purchaseRate || 0,
    receivedQty: receivedQty || 0,
    issuedQty: 0,
    availableQty: receivedQty || 0,
    warehouseId: 'wh-kushtia',
    warehouseName: warehouse || 'Kushtia Warehouse',
    status: 'Active',
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <BarcodeIcon className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-white">Batch Barcode Label</h4>
            <span className="text-[10px] text-slate-500 font-mono">{batch.batchNumber}</span>
          </div>
        </div>

        {showPrintButton && (
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Sticker</span>
          </button>
        )}
      </div>

      {/* Visual Barcode Display */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center space-y-2">
        <svg width="240" height="48" viewBox="0 0 240 48" className="overflow-visible">
          {generateCode128SvgBars(batch.batchBarcode || batch.batchNumber, 240, 42)}
        </svg>
        <span className="font-mono font-bold text-xs tracking-widest text-slate-800 dark:text-slate-200">
          {batch.batchBarcode || batch.batchNumber}
        </span>
      </div>

      {/* Item Specs Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Material Identity</span>
          <span className="font-bold text-slate-900 dark:text-white line-clamp-1">{batch.materialName}</span>
          <span className="text-[10px] font-mono text-amber-600 font-semibold">{batch.materialCode}</span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Immutable Batch Cost</span>
          <span className="font-mono font-bold text-slate-900 dark:text-white">
            BDT {batch.unitPurchaseRate.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 block">per {batch.unit}</span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Quantity Status</span>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {batch.availableQty} {batch.unit}
          </span>
          <span className="text-[10px] text-slate-400 block">of {batch.receivedQty} received</span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Supplier & Date</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{batch.supplierName}</span>
          <span className="text-[10px] text-slate-500 font-mono block">{batch.purchaseDate}</span>
        </div>
      </div>
    </div>
  );
};

// Generates scalable SVG bars simulating Code 128 barcode pattern
function generateCode128SvgBars(text: string, width: number, height: number): React.ReactNode[] {
  const bars: React.ReactNode[] = [];
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  // Draw start pattern
  bars.push(<rect key="start-1" x={4} y={0} width={2.5} height={height} fill="currentColor" />);
  bars.push(<rect key="start-2" x={9} y={0} width={1.5} height={height} fill="currentColor" />);

  const patternCount = 42;
  const step = (width - 24) / patternCount;

  for (let i = 0; i < patternCount; i++) {
    const bit = Math.abs(Math.sin((hash + i * 37) * 0.1));
    if (bit > 0.35) {
      const barWidth = bit > 0.75 ? 3 : bit > 0.55 ? 2 : 1.2;
      bars.push(
        <rect
          key={`bar-${i}`}
          x={14 + i * step}
          y={0}
          width={barWidth}
          height={height}
          fill="currentColor"
        />
      );
    }
  }

  // Draw stop pattern
  bars.push(<rect key="stop-1" x={width - 10} y={0} width={2.5} height={height} fill="currentColor" />);
  bars.push(<rect key="stop-2" x={width - 5} y={0} width={1.5} height={height} fill="currentColor" />);

  return bars;
}
