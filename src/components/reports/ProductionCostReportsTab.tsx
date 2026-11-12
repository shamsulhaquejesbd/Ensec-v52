import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { 
  Calculator, Download, Printer, Filter, Calendar, 
  Warehouse, Building2, Layers, TrendingUp, AlertTriangle, 
  FileSpreadsheet, Search, CheckCircle2, DollarSign
} from 'lucide-react';

export type ProductionReportType = 
  | 'rm-purchase-rate-history'
  | 'batch-stock-valuation'
  | 'rm-consumption-report'
  | 'material-issue-history'
  | 'bom-cost-analysis'
  | 'production-order-cost-sheet'
  | 'finished-goods-production-cost'
  | 'product-wise-manufacturing-cost'
  | 'wastage-production-loss';

export const ProductionCostReportsTab: React.FC = () => {
  const {
    rawMaterials,
    inventoryBatches,
    inventoryMovements,
    rawMaterialReceipts,
    materialIssues,
    productionOrders,
    productionConsumptions,
    boms,
    products,
    suppliers,
    warehouses,
    formatCurrency,
    getProductionCostBreakdown,
  } = useERP();

  const [selectedReport, setSelectedReport] = useState<ProductionReportType>('rm-purchase-rate-history');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Report definitions for nav
  const reportDefinitions: { id: ProductionReportType; title: string; desc: string }[] = [
    { id: 'rm-purchase-rate-history', title: 'RM Purchase Rate History', desc: 'Track raw material purchase rate trends across batches and suppliers' },
    { id: 'batch-stock-valuation', title: 'Batch-wise Stock Valuation', desc: 'Detailed valuation by batch with available quantities and holding values' },
    { id: 'rm-consumption-report', title: 'Raw Material Consumption', desc: 'Quantity and cost of raw materials consumed by production orders' },
    { id: 'material-issue-history', title: 'Material Issue History', desc: 'Audit log of materials issued to production floor with FIFO validation' },
    { id: 'bom-cost-analysis', title: 'BOM Cost Analysis', desc: 'Standard BOM component cost analysis and expected wastage breakdown' },
    { id: 'production-order-cost-sheet', title: 'Production Order Cost Sheet', desc: 'Material, conversion, overhead, and unit cost per production batch' },
    { id: 'finished-goods-production-cost', title: 'Finished Goods Production Cost', desc: 'Valuation of finished batteries transferred to warehouse stock' },
    { id: 'product-wise-manufacturing-cost', title: 'Product-wise Manufacturing Cost', desc: 'Comparative manufacturing and conversion costs across battery models' },
    { id: 'wastage-production-loss', title: 'Wastage & Production Loss Report', desc: 'Analysis of scrap, rejected units, and cost absorbed by good output' },
  ];

  // Export CSV Helper
  const exportToCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // 1. RM Purchase Rate History
  const purchaseRateHistoryData = useMemo(() => {
    const list: any[] = [];
    rawMaterialReceipts.forEach(rcpt => {
      rcpt.items.forEach(it => {
        const d = new Date(rcpt.receiveDate).getTime();
        const startOk = !startDate || d >= new Date(startDate).getTime();
        const endOk = !endDate || d <= new Date(endDate + 'T23:59:59').getTime();
        const matOk = selectedMaterial === 'all' || it.materialId === selectedMaterial;
        const suppOk = selectedSupplier === 'all' || rcpt.supplierId === selectedSupplier;
        const whOk = selectedWarehouse === 'all' || rcpt.warehouseId === selectedWarehouse;
        const searchOk = !searchTerm || it.materialName.toLowerCase().includes(searchTerm.toLowerCase()) || it.materialCode.toLowerCase().includes(searchTerm.toLowerCase()) || it.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());

        if (startOk && endOk && matOk && suppOk && whOk && searchOk) {
          list.push({
            id: it.id,
            grnNumber: rcpt.grnNumber,
            date: rcpt.receiveDate,
            materialCode: it.materialCode,
            materialName: it.materialName,
            batchNumber: it.batchNumber,
            supplierName: rcpt.supplierName,
            orderedQty: it.orderedQty,
            receivedQty: it.receivedQty,
            unitPurchaseRate: it.unitPurchaseRate,
            discountAmount: it.discountAmount,
            additionalCost: it.additionalCost,
            totalCost: it.totalCost,
            warehouseName: rcpt.warehouseName
          });
        }
      });
    });
    return list;
  }, [rawMaterialReceipts, startDate, endDate, selectedMaterial, selectedSupplier, selectedWarehouse, searchTerm]);

  // 2. Batch-wise Stock Valuation
  const batchValuationData = useMemo(() => {
    return inventoryBatches.filter(b => {
      const d = new Date(b.purchaseDate).getTime();
      const startOk = !startDate || d >= new Date(startDate).getTime();
      const endOk = !endDate || d <= new Date(endDate + 'T23:59:59').getTime();
      const matOk = selectedMaterial === 'all' || b.materialId === selectedMaterial;
      const suppOk = selectedSupplier === 'all' || b.supplierId === selectedSupplier;
      const whOk = selectedWarehouse === 'all' || b.warehouseId === selectedWarehouse;
      const searchOk = !searchTerm || b.materialName.toLowerCase().includes(searchTerm.toLowerCase()) || b.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());
      return startOk && endOk && matOk && suppOk && whOk && searchOk;
    });
  }, [inventoryBatches, startDate, endDate, selectedMaterial, selectedSupplier, selectedWarehouse, searchTerm]);

  // 3. Raw Material Consumption Report
  const consumptionData = useMemo(() => {
    return productionConsumptions.filter(c => {
      const d = new Date(c.issueDate).getTime();
      const startOk = !startDate || d >= new Date(startDate).getTime();
      const endOk = !endDate || d <= new Date(endDate + 'T23:59:59').getTime();
      const matOk = selectedMaterial === 'all' || c.materialId === selectedMaterial;
      const whOk = selectedWarehouse === 'all' || c.warehouseId === selectedWarehouse;
      const searchOk = !searchTerm || c.materialName.toLowerCase().includes(searchTerm.toLowerCase()) || c.productionOrderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || c.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());
      return startOk && endOk && matOk && whOk && searchOk;
    });
  }, [productionConsumptions, startDate, endDate, selectedMaterial, selectedWarehouse, searchTerm]);

  // 4. Material Issue History
  const issueHistoryData = useMemo(() => {
    return materialIssues.filter(iss => {
      const d = new Date(iss.issueDate).getTime();
      const startOk = !startDate || d >= new Date(startDate).getTime();
      const endOk = !endDate || d <= new Date(endDate + 'T23:59:59').getTime();
      const whOk = selectedWarehouse === 'all' || iss.warehouseId === selectedWarehouse;
      const searchOk = !searchTerm || iss.issueNumber.toLowerCase().includes(searchTerm.toLowerCase()) || iss.productionOrderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || iss.issuedBy.toLowerCase().includes(searchTerm.toLowerCase());
      return startOk && endOk && whOk && searchOk;
    });
  }, [materialIssues, startDate, endDate, selectedWarehouse, searchTerm]);

  // 5. BOM Cost Analysis
  const bomCostData = useMemo(() => {
    return products.map(prod => {
      const bomDef = boms.find(b => b.productId === prod.id);
      const items = bomDef ? bomDef.items : prod.bom;
      const totalComponentCost = items.reduce((sum, it) => sum + (it.requiredQty * it.unitCostBDT), 0);
      const avgWastage = items.reduce((sum, it) => sum + (it.expectedWastagePercent || 0.5), 0) / (items.length || 1);
      return {
        productId: prod.id,
        productName: prod.name,
        model: prod.model,
        version: bomDef ? bomDef.version : '1.0',
        effectiveDate: bomDef ? bomDef.effectiveDate : '2026-01-01',
        componentCount: items.length,
        totalBOMCost: totalComponentCost,
        expectedWastagePercent: avgWastage,
        distributorPrice: prod.distributorPriceBDT || 0,
        marginPercent: prod.distributorPriceBDT ? Math.round(((prod.distributorPriceBDT - totalComponentCost) / prod.distributorPriceBDT) * 100) : 0
      };
    }).filter(b => {
      const prodOk = selectedProduct === 'all' || b.productId === selectedProduct;
      const searchOk = !searchTerm || b.productName.toLowerCase().includes(searchTerm.toLowerCase()) || b.model.toLowerCase().includes(searchTerm.toLowerCase());
      return prodOk && searchOk;
    });
  }, [products, boms, selectedProduct, searchTerm]);

  // 6. Production Order Cost Sheet
  const productionCostSheetData = useMemo(() => {
    return productionOrders.map(po => {
      const breakdown = getProductionCostBreakdown ? getProductionCostBreakdown(po.id) : null;
      const actualMaterialCost = breakdown ? breakdown.rawMaterialCost : (po.rawMaterialCostBDT || 0);
      const directLabor = breakdown ? breakdown.directLabourCost : (po.optimumLaborCostBDT || 150000);
      const factoryOverhead = breakdown
        ? (breakdown.electricityAllocation + breakdown.factoryRentAllocation + breakdown.generatorFuel + breakdown.machineMaintenance + breakdown.otherProductionExpenses)
        : (po.factoryOverheadBDT || 90000);
      const totalCost = breakdown ? breakdown.totalManufacturingCost : (po.totalProductionCostBDT || (actualMaterialCost + directLabor + factoryOverhead));
      const goodQty = breakdown ? breakdown.goodFinishedQty : (po.completedQty || po.plannedQty || 1);
      const unitCost = breakdown ? breakdown.actualUnitProductionCost : (goodQty > 0 ? Math.round(totalCost / goodQty) : (po.costPerUnitBDT || 0));

      return {
        id: po.id,
        orderNumber: po.orderNumber,
        batchNumber: po.batchNumber,
        date: po.date || breakdown?.productionDate || '',
        productId: po.productId || breakdown?.productId || '',
        productName: po.productName || breakdown?.productName || '',
        model: po.model || breakdown?.productSku || '',
        plannedQty: po.plannedQty,
        completedQty: goodQty,
        rawMaterialCost: actualMaterialCost,
        directLabor,
        factoryOverhead,
        totalCost,
        unitCost,
        status: po.status
      };
    }).filter(po => {
      const d = new Date(po.date).getTime();
      const startOk = !startDate || d >= new Date(startDate).getTime();
      const endOk = !endDate || d <= new Date(endDate + 'T23:59:59').getTime();
      const prodOk = selectedProduct === 'all' || po.productId === selectedProduct;
      const searchOk = !searchTerm || po.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || po.productName.toLowerCase().includes(searchTerm.toLowerCase()) || po.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());
      return startOk && endOk && prodOk && searchOk;
    });
  }, [productionOrders, productionConsumptions, startDate, endDate, selectedProduct, searchTerm]);

  // 7. Finished Goods Production Cost
  const finishedGoodsCostData = useMemo(() => {
    return productionCostSheetData.filter(po => po.status === 'Completed' || po.status === 'Transferred');
  }, [productionCostSheetData]);

  // 8. Product-wise Manufacturing Cost
  const productWiseMfgData = useMemo(() => {
    return products.map(p => {
      const orders = productionOrders.filter(po => po.productId === p.id);
      const totalUnits = orders.reduce((sum, o) => sum + (o.completedQty || o.plannedQty), 0);
      const totalCost = orders.reduce((sum, o) => sum + o.totalProductionCostBDT, 0);
      const avgUnitCost = totalUnits > 0 ? Math.round(totalCost / totalUnits) : 0;
      return {
        productId: p.id,
        productName: p.name,
        model: p.model,
        orderCount: orders.length,
        totalUnitsProduced: totalUnits,
        totalProductionValue: totalCost,
        avgUnitProductionCost: avgUnitCost,
        distributorSellingPrice: p.distributorPriceBDT || 0,
        grossMarginBDT: (p.distributorPriceBDT || 0) - avgUnitCost
      };
    }).filter(p => {
      const prodOk = selectedProduct === 'all' || p.productId === selectedProduct;
      const searchOk = !searchTerm || p.productName.toLowerCase().includes(searchTerm.toLowerCase()) || p.model.toLowerCase().includes(searchTerm.toLowerCase());
      return prodOk && searchOk;
    });
  }, [products, productionOrders, selectedProduct, searchTerm]);

  // 9. Wastage & Production Loss Report
  const wastageLossData = useMemo(() => {
    return productionOrders.map(po => {
      const parsedWastage = po.wastagePercent !== undefined && po.wastagePercent !== null ? Number(po.wastagePercent) : 0;
      const wastagePct = isNaN(parsedWastage) ? 0 : parsedWastage;
      const parsedScrap = po.scrapKg !== undefined && po.scrapKg !== null ? Number(po.scrapKg) : 0;
      let scrapKg = isNaN(parsedScrap) ? 0 : parsedScrap;
      if (scrapKg === 8.5 && wastagePct === 0) {
        scrapKg = 0;
      }
      const scrapUnits = Math.round((po.plannedQty * wastagePct) / 100);
      const wastageAbsorbedCost = Math.round(po.totalProductionCostBDT * (wastagePct / 100));

      return {
        id: po.id,
        orderNumber: po.orderNumber,
        batchNumber: po.batchNumber,
        productName: po.productName,
        model: po.model,
        plannedQty: po.plannedQty,
        completedQty: po.completedQty,
        scrapUnits,
        scrapKg,
        wastagePercentage: wastagePct,
        wastageCostBDT: wastageAbsorbedCost,
        absorbedInGoodUnitRate: po.costPerUnitBDT
      };
    }).filter(po => {
      const prodOk = selectedProduct === 'all' || po.productName === selectedProduct;
      const searchOk = !searchTerm || po.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || po.productName.toLowerCase().includes(searchTerm.toLowerCase());
      return prodOk && searchOk;
    });
  }, [productionOrders, selectedProduct, searchTerm]);

  // Handle Export Click
  const handleExportClick = () => {
    switch (selectedReport) {
      case 'rm-purchase-rate-history':
        exportToCSV(
          'rm_purchase_rate_history',
          ['GRN Number', 'Date', 'Material Code', 'Material Name', 'Batch Number', 'Supplier', 'Ordered Qty', 'Received Qty', 'Rate (BDT)', 'Discount', 'Additional Cost', 'Total Cost', 'Warehouse'],
          purchaseRateHistoryData.map(r => [r.grnNumber, r.date, r.materialCode, `"${r.materialName}"`, r.batchNumber, `"${r.supplierName}"`, r.orderedQty, r.receivedQty, r.unitPurchaseRate, r.discountAmount, r.additionalCost, r.totalCost, `"${r.warehouseName}"`])
        );
        break;
      case 'batch-stock-valuation':
        exportToCSV(
          'batch_stock_valuation',
          ['Material Code', 'Material Name', 'Batch Number', 'Supplier', 'Purchase Date', 'Purchase Rate (BDT)', 'Available Qty', 'Holding Value (BDT)', 'Warehouse'],
          batchValuationData.map(b => [b.materialCode, `"${b.materialName}"`, b.batchNumber, `"${b.supplierName}"`, b.purchaseDate, b.unitPurchaseRate, b.availableQty, (b.availableQty * b.unitPurchaseRate).toFixed(2), `"${b.warehouseName}"`])
        );
        break;
      case 'rm-consumption-report':
        exportToCSV(
          'rm_consumption_report',
          ['Production Order', 'Material Code', 'Material Name', 'Batch Number', 'Supplier', 'Quantity Consumed', 'Unit Cost (BDT)', 'Total Cost (BDT)', 'Issue Date', 'Warehouse'],
          consumptionData.map(c => [c.productionOrderNumber, c.materialCode, `"${c.materialName}"`, c.batchNumber, `"${c.supplierName}"`, c.quantity, c.unitCost, c.totalCost, c.issueDate, `"${c.warehouseName}"`])
        );
        break;
      case 'material-issue-history':
        exportToCSV(
          'material_issue_history',
          ['Issue Number', 'Production Order', 'Date', 'Issued By', 'Total Cost (BDT)', 'Items Count', 'FIFO Overrides', 'Warehouse'],
          issueHistoryData.map(i => [i.issueNumber, i.productionOrderNumber, i.issueDate, `"${i.issuedBy}"`, i.totalMaterialCost, i.items.length, i.items.filter(it => it.isFifoOverride).length, `"${i.warehouseName}"`])
        );
        break;
      case 'bom-cost-analysis':
        exportToCSV(
          'bom_cost_analysis',
          ['Product Name', 'Model', 'BOM Version', 'Effective Date', 'Component Count', 'Total BOM Cost (BDT)', 'Wastage (%)', 'Distributor Price (BDT)', 'Margin (%)'],
          bomCostData.map(b => [`"${b.productName}"`, b.model, b.version, b.effectiveDate, b.componentCount, b.totalBOMCost, b.expectedWastagePercent, b.distributorPrice, b.marginPercent])
        );
        break;
      case 'production-order-cost-sheet':
        exportToCSV(
          'production_order_cost_sheet',
          ['Order Number', 'Batch Number', 'Date', 'Product', 'Model', 'Planned Qty', 'Completed Qty', 'Raw Material Cost (BDT)', 'Labor Cost (BDT)', 'Overhead (BDT)', 'Total Cost (BDT)', 'Unit Cost (BDT)', 'Status'],
          productionCostSheetData.map(p => [p.orderNumber, p.batchNumber, p.date, `"${p.productName}"`, p.model, p.plannedQty, p.completedQty, p.rawMaterialCost, p.directLabor, p.factoryOverhead, p.totalCost, p.unitCost, p.status])
        );
        break;
      case 'finished-goods-production-cost':
        exportToCSV(
          'finished_goods_production_cost',
          ['Order Number', 'Batch Number', 'Product', 'Model', 'Units Received', 'Unit Production Cost (BDT)', 'Total Production Cost (BDT)'],
          finishedGoodsCostData.map(f => [f.orderNumber, f.batchNumber, `"${f.productName}"`, f.model, f.completedQty, f.unitCost, f.totalCost])
        );
        break;
      case 'product-wise-manufacturing-cost':
        exportToCSV(
          'product_wise_manufacturing_cost',
          ['Product Name', 'Model', 'Completed Orders', 'Total Units Produced', 'Total Production Value (BDT)', 'Avg Unit Production Cost (BDT)', 'Selling Price (BDT)', 'Gross Margin (BDT)'],
          productWiseMfgData.map(p => [`"${p.productName}"`, p.model, p.orderCount, p.totalUnitsProduced, p.totalProductionValue, p.avgUnitProductionCost, p.distributorSellingPrice, p.grossMarginBDT])
        );
        break;
      case 'wastage-production-loss':
        exportToCSV(
          'wastage_production_loss_report',
          ['Order Number', 'Batch Number', 'Product', 'Planned Qty', 'Good Qty', 'Scrap Units', 'Scrap Weight (Kg)', 'Wastage (%)', 'Absorbed Loss (BDT)', 'Final Unit Cost (BDT)'],
          wastageLossData.map(w => [w.orderNumber, w.batchNumber, `"${w.productName}"`, w.plannedQty, w.completedQty, w.scrapUnits, w.scrapKg, w.wastagePercentage, w.wastageCostBDT, w.absorbedInGoodUnitRate])
        );
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Selection Sub-navigation Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-600" />
              Production Costing &amp; Inventory Engine Reports
            </h2>
            <p className="text-xs text-slate-500">
              9 specialized costing reports driven by actual batch purchase rates, FIFO issuance, and plant conversion fees
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Excel / CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* 9 Report Select Buttons (Grid / Pill scroll) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-3">
          {reportDefinitions.map((rep) => {
            const isSelected = selectedReport === rep.id;
            return (
              <button
                key={rep.id}
                onClick={() => setSelectedReport(rep.id)}
                className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-600 shadow-xs'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>
                    {rep.title}
                  </span>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-indigo-600"></span>}
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1">
                  {rep.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Filter className="w-4 h-4 text-blue-500" />
            <span>Report Parameters &amp; Dimension Filters</span>
          </div>
          {(selectedMaterial !== 'all' || selectedSupplier !== 'all' || selectedProduct !== 'all' || selectedWarehouse !== 'all' || startDate || endDate || searchTerm) && (
            <button
              onClick={() => {
                setSelectedMaterial('all');
                setSelectedSupplier('all');
                setSelectedProduct('all');
                setSelectedWarehouse('all');
                setStartDate('');
                setEndDate('');
                setSearchTerm('');
              }}
              className="text-[11px] text-blue-600 hover:underline cursor-pointer"
            >
              Reset All Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Search Keywords</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Batch, PO, item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Raw Material</label>
            <select
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value)}
              className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
            >
              <option value="all">All Materials</option>
              {rawMaterials.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Supplier</label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
            >
              <option value="all">All Suppliers</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Finished Product</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
            >
              <option value="all">All Products</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.model})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Warehouse</label>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
            >
              <option value="all">All Warehouses</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Render Selected Report Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Report 1: RM Purchase Rate History */}
        {selectedReport === 'rm-purchase-rate-history' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="p-3">GRN No &amp; Date</th>
                  <th className="p-3">Raw Material</th>
                  <th className="p-3">Batch Number</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3 text-right">Received Qty</th>
                  <th className="p-3 text-right">Purchase Rate</th>
                  <th className="p-3 text-right">Discount</th>
                  <th className="p-3 text-right">Add'l Cost</th>
                  <th className="p-3 text-right">Total Value</th>
                  <th className="p-3">Warehouse</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {purchaseRateHistoryData.length === 0 ? (
                  <tr><td colSpan={10} className="p-8 text-center text-slate-400">No purchase records found.</td></tr>
                ) : (
                  purchaseRateHistoryData.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3">
                        <div className="font-mono font-bold text-blue-600 dark:text-blue-400">{row.grnNumber}</div>
                        <div className="text-[10px] text-slate-400">{row.date}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900 dark:text-white">{row.materialName}</div>
                        <div className="text-[10px] font-mono text-slate-500">{row.materialCode}</div>
                      </td>
                      <td className="p-3 font-mono text-[11px] font-bold text-purple-600 dark:text-purple-400">{row.batchNumber}</td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">{row.supplierName}</td>
                      <td className="p-3 text-right font-mono font-bold">{row.receivedQty}</td>
                      <td className="p-3 text-right font-mono font-semibold">{formatCurrency(row.unitPurchaseRate)}</td>
                      <td className="p-3 text-right font-mono text-slate-500">{formatCurrency(row.discountAmount)}</td>
                      <td className="p-3 text-right font-mono text-slate-500">{formatCurrency(row.additionalCost)}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(row.totalCost)}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{row.warehouseName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Report 2: Batch-wise Stock Valuation */}
        {selectedReport === 'batch-stock-valuation' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="p-3">Raw Material</th>
                  <th className="p-3">Batch Number &amp; Barcode</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3">Purchase Date</th>
                  <th className="p-3 text-right">Purchase Rate</th>
                  <th className="p-3 text-right">Available Qty</th>
                  <th className="p-3 text-right">Inventory Valuation</th>
                  <th className="p-3">Warehouse</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {batchValuationData.length === 0 ? (
                  <tr><td colSpan={9} className="p-8 text-center text-slate-400">No inventory batches found.</td></tr>
                ) : (
                  batchValuationData.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3">
                        <div className="font-semibold text-slate-900 dark:text-white">{b.materialName}</div>
                        <div className="text-[10px] font-mono text-blue-600 dark:text-blue-400">{b.materialCode}</div>
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{b.batchNumber}</div>
                        <div className="text-[10px] text-slate-400">{b.batchBarcode}</div>
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">{b.supplierName}</td>
                      <td className="p-3 text-slate-500">{b.purchaseDate}</td>
                      <td className="p-3 text-right font-mono font-semibold">{formatCurrency(b.unitPurchaseRate)}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">{b.availableQty} {b.unit}</td>
                      <td className="p-3 text-right font-mono font-black text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(b.availableQty * b.unitPurchaseRate)}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{b.warehouseName}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${b.availableQty > 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600'}`}>
                          {b.availableQty > 0 ? 'Active Stock' : 'Depleted'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Report 3: Raw Material Consumption Report */}
        {selectedReport === 'rm-consumption-report' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="p-3">Production Order</th>
                  <th className="p-3">Raw Material</th>
                  <th className="p-3">Batch Number</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3 text-right">Consumed Qty</th>
                  <th className="p-3 text-right">Actual Batch Rate</th>
                  <th className="p-3 text-right">Total Material Cost</th>
                  <th className="p-3">Issue Date</th>
                  <th className="p-3">Warehouse</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {consumptionData.length === 0 ? (
                  <tr><td colSpan={9} className="p-8 text-center text-slate-400">No consumption records found.</td></tr>
                ) : (
                  consumptionData.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{c.productionOrderNumber}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900 dark:text-white">{c.materialName}</div>
                        <div className="text-[10px] font-mono text-slate-500">{c.materialCode}</div>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-purple-600 dark:text-purple-400">{c.batchNumber}</td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">{c.supplierName}</td>
                      <td className="p-3 text-right font-mono font-bold">{c.quantity} {c.unit}</td>
                      <td className="p-3 text-right font-mono font-semibold">{formatCurrency(c.unitCost)}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(c.totalCost)}</td>
                      <td className="p-3 text-slate-500">{c.issueDate}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{c.warehouseName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Report 4: Material Issue History */}
        {selectedReport === 'material-issue-history' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="p-3">Issue Number</th>
                  <th className="p-3">PO Reference</th>
                  <th className="p-3">Issue Date</th>
                  <th className="p-3">Issued By</th>
                  <th className="p-3 text-right">Items Count</th>
                  <th className="p-3 text-right">Total Material Cost</th>
                  <th className="p-3">Warehouse</th>
                  <th className="p-3">Audit Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {issueHistoryData.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-400">No issue history found.</td></tr>
                ) : (
                  issueHistoryData.map((iss) => (
                    <tr key={iss.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">{iss.issueNumber}</td>
                      <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{iss.productionOrderNumber}</td>
                      <td className="p-3 text-slate-500">{iss.issueDate}</td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{iss.issuedBy}</td>
                      <td className="p-3 text-right font-mono">{iss.items.length} items</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(iss.totalMaterialCost)}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{iss.warehouseName}</td>
                      <td className="p-3 text-[11px] text-slate-500">{iss.notes}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Report 5: BOM Cost Analysis */}
        {selectedReport === 'bom-cost-analysis' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Model</th>
                  <th className="p-3">BOM Version</th>
                  <th className="p-3">Effective Date</th>
                  <th className="p-3 text-right">Components</th>
                  <th className="p-3 text-right">Expected Wastage (%)</th>
                  <th className="p-3 text-right">Raw Material BOM Cost</th>
                  <th className="p-3 text-right">Selling Price</th>
                  <th className="p-3 text-right">Gross Margin (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {bomCostData.map((b) => (
                  <tr key={b.productId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">{b.productName}</td>
                    <td className="p-3 font-mono text-slate-500">{b.model}</td>
                    <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">v{b.version}</td>
                    <td className="p-3 text-slate-500">{b.effectiveDate}</td>
                    <td className="p-3 text-right font-mono">{b.componentCount} items</td>
                    <td className="p-3 text-right font-mono text-amber-600">{b.expectedWastagePercent}%</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(b.totalBOMCost)}</td>
                    <td className="p-3 text-right font-mono">{formatCurrency(b.distributorPrice)}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">{b.marginPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Report 6: Production Order Cost Sheet */}
        {selectedReport === 'production-order-cost-sheet' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="p-3">PO &amp; Batch No</th>
                  <th className="p-3">Product Model</th>
                  <th className="p-3 text-right">Planned / Good Qty</th>
                  <th className="p-3 text-right">Raw Material Cost</th>
                  <th className="p-3 text-right">Labor Cost</th>
                  <th className="p-3 text-right">Factory Overhead</th>
                  <th className="p-3 text-right">Total Production Cost</th>
                  <th className="p-3 text-right">Unit Production Cost</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {productionCostSheetData.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3">
                      <div className="font-mono font-bold text-blue-600 dark:text-blue-400">{po.orderNumber}</div>
                      <div className="text-[10px] font-mono text-purple-600 dark:text-purple-400">Batch: {po.batchNumber}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{po.productName}</div>
                      <div className="text-[10px] font-mono text-slate-500">{po.model}</div>
                    </td>
                    <td className="p-3 text-right font-mono font-bold">{po.completedQty} / {po.plannedQty}</td>
                    <td className="p-3 text-right font-mono text-blue-600 dark:text-blue-400">{formatCurrency(po.rawMaterialCost)}</td>
                    <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-300">{formatCurrency(po.directLabor)}</td>
                    <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-300">{formatCurrency(po.factoryOverhead)}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(po.totalCost)}</td>
                    <td className="p-3 text-right font-mono font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(po.unitCost)}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${po.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800'}`}>
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Report 7: Finished Goods Production Cost */}
        {selectedReport === 'finished-goods-production-cost' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="p-3">Production Order</th>
                  <th className="p-3">Batch Number</th>
                  <th className="p-3">Finished Battery Model</th>
                  <th className="p-3 text-right">Units Received into CID</th>
                  <th className="p-3 text-right">Engine Unit Production Cost</th>
                  <th className="p-3 text-right">Total Transferred Inventory Value</th>
                  <th className="p-3 text-center">Valuation Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {finishedGoodsCostData.map((fg) => (
                  <tr key={fg.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{fg.orderNumber}</td>
                    <td className="p-3 font-mono font-bold text-purple-600 dark:text-purple-400">{fg.batchNumber}</td>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">{fg.productName} ({fg.model})</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">{fg.completedQty} Units</td>
                    <td className="p-3 text-right font-mono font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(fg.unitCost)}</td>
                    <td className="p-3 text-right font-mono font-black text-slate-900 dark:text-white">{formatCurrency(fg.totalCost)}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        Actual Batch Sourced
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Report 8: Product-wise Manufacturing Cost */}
        {selectedReport === 'product-wise-manufacturing-cost' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="p-3">Battery Product</th>
                  <th className="p-3">Model</th>
                  <th className="p-3 text-right">Production Batches</th>
                  <th className="p-3 text-right">Total Units Produced</th>
                  <th className="p-3 text-right">Total Manufacturing Value</th>
                  <th className="p-3 text-right">Avg Unit Production Cost</th>
                  <th className="p-3 text-right">Distributor Selling Price</th>
                  <th className="p-3 text-right">Unit Gross Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {productWiseMfgData.map((p) => (
                  <tr key={p.productId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">{p.productName}</td>
                    <td className="p-3 font-mono text-slate-500">{p.model}</td>
                    <td className="p-3 text-right font-mono">{p.orderCount} batches</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">{p.totalUnitsProduced} Units</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(p.totalProductionValue)}</td>
                    <td className="p-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(p.avgUnitProductionCost)}</td>
                    <td className="p-3 text-right font-mono">{formatCurrency(p.distributorSellingPrice)}</td>
                    <td className="p-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(p.grossMarginBDT)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Report 9: Wastage & Production Loss Report */}
        {selectedReport === 'wastage-production-loss' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="p-3">PO &amp; Batch No</th>
                  <th className="p-3">Product</th>
                  <th className="p-3 text-right">Planned Qty</th>
                  <th className="p-3 text-right">Good Finished Qty</th>
                  <th className="p-3 text-right">Scrap Units</th>
                  <th className="p-3 text-right">Scrap Weight (Kg)</th>
                  <th className="p-3 text-right">Wastage (%)</th>
                  <th className="p-3 text-right">Loss Absorbed in Good Units</th>
                  <th className="p-3 text-right">Final Good Unit Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {wastageLossData.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3">
                      <div className="font-mono font-bold text-blue-600 dark:text-blue-400">{w.orderNumber}</div>
                      <div className="text-[10px] font-mono text-purple-600">Batch: {w.batchNumber}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{w.productName}</div>
                      <div className="text-[10px] font-mono text-slate-500">{w.model}</div>
                    </td>
                    <td className="p-3 text-right font-mono">{w.plannedQty}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-600">{w.completedQty}</td>
                    <td className="p-3 text-right font-mono font-semibold text-red-600">{w.scrapUnits}</td>
                    <td className="p-3 text-right font-mono text-slate-500">{w.scrapKg} kg</td>
                    <td className="p-3 text-right font-mono font-bold text-amber-600">{w.wastagePercentage}%</td>
                    <td className="p-3 text-right font-mono font-bold text-amber-600">{formatCurrency(w.wastageCostBDT)}</td>
                    <td className="p-3 text-right font-mono font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(w.absorbedInGoodUnitRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
