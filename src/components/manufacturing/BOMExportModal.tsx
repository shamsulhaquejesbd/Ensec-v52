import React, { useState, useMemo } from 'react';
import {
  Download,
  FileSpreadsheet,
  Printer,
  FileText,
  Check,
  Copy,
  X,
  Layers,
  Cpu,
  Wrench,
  Search,
  Calendar,
  CheckCircle2,
  History,
  Eye,
  Filter,
  Package,
  Sparkles,
  Info,
} from 'lucide-react';
import { Product, BOMDefinition, BOMItem, BOMRevision, RawMaterial } from '../../types/erp.ts';
import { useERP } from '../../context/ERPContext.tsx';

interface BOMExportModalProps {
  initialProductId?: string;
  initialVersion?: string;
  onClose: () => void;
}

export const BOMExportModal: React.FC<BOMExportModalProps> = ({
  initialProductId,
  initialVersion,
  onClose,
}) => {
  const { products, boms, rawMaterials, formatCurrency } = useERP();

  // Mode: single product or all products
  const [exportMode, setExportMode] = useState<'single' | 'all'>(
    initialProductId ? 'single' : 'single'
  );
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProductId || products[0]?.id || ''
  );
  const [versionSelection, setVersionSelection] = useState<string>(
    initialVersion || 'active'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [includeCosts, setIncludeCosts] = useState(true);
  const [includeWastage, setIncludeWastage] = useState(true);
  const [includeSpecs, setIncludeSpecs] = useState(true);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // Selected product
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || products[0] || null;
  }, [products, selectedProductId]);

  // Find BOM Definition for selected product
  const selectedBOMDef = useMemo(() => {
    if (!selectedProduct) return null;
    return (
      (boms || []).find(
        (b) =>
          b.productId === selectedProduct.id ||
          (selectedProduct.code && b.productCode === selectedProduct.code) ||
          (selectedProduct.model && b.productModel === selectedProduct.model)
      ) || null
    );
  }, [boms, selectedProduct]);

  // Available versions for selected product
  const availableVersions = useMemo(() => {
    if (!selectedProduct) return [];
    const versionsList: { version: string; label: string; date: string; notes?: string; isLive: boolean }[] = [];
    const activeVer = selectedBOMDef?.version || '1.0';
    const effectiveDate = selectedBOMDef?.effectiveDate || 'Current';

    versionsList.push({
      version: 'active',
      label: `v${activeVer} (Active Standard)`,
      date: effectiveDate,
      notes: selectedBOMDef?.changeNotes || selectedBOMDef?.notes || 'Currently active production standard',
      isLive: true,
    });

    const revs = selectedBOMDef?.revisionHistory || selectedBOMDef?.revisions || [];
    revs.forEach((r) => {
      // Avoid duplicate active version label if version matches exactly
      const isSameAsActive = r.version === activeVer;
      versionsList.push({
        version: r.version,
        label: `v${r.version} ${isSameAsActive ? '(Active Record)' : '(Historical)'}`,
        date: r.effectiveDate || r.revisionDate || 'N/A',
        notes: r.changeNotes || r.changeSummary || 'Revision snapshot',
        isLive: isSameAsActive,
      });
    });

    // Remove duplicates based on version identifier
    const uniqueMap = new Map<string, (typeof versionsList)[0]>();
    versionsList.forEach((v) => {
      if (!uniqueMap.has(v.version)) {
        uniqueMap.set(v.version, v);
      }
    });

    return Array.from(uniqueMap.values());
  }, [selectedProduct, selectedBOMDef]);

  // Helper to resolve material details
  const getMaterialDetails = (matId: string, itemMatName?: string, itemUnitCost?: number) => {
    const found = rawMaterials.find((m) => m.id === matId || m.code === matId);
    return {
      code: found?.code || matId,
      name: found?.name || itemMatName || 'Raw Material Component',
      unit: found?.unit || 'PCS',
      cost: typeof itemUnitCost === 'number' && itemUnitCost > 0
        ? itemUnitCost
        : found?.lastPurchaseUnitCostBDT || found?.standardCostBDT || 0,
      category: found?.category || 'Standard Parts',
    };
  };

  // Compile export data structure
  const exportPayload = useMemo(() => {
    if (exportMode === 'single' && selectedProduct) {
      // Determine which version(s) to include
      let targetVersions: { versionStr: string; effectiveDate: string; changeNotes: string; items: BOMItem[]; status: string }[] = [];

      if (versionSelection === 'all_versions') {
        // Include active version + all revisions
        const activeItems = (selectedBOMDef?.items && selectedBOMDef.items.length > 0)
          ? selectedBOMDef.items
          : (selectedProduct.bom && selectedProduct.bom.length > 0)
          ? selectedProduct.bom
          : [];

        targetVersions.push({
          versionStr: selectedBOMDef?.version || '1.0',
          effectiveDate: selectedBOMDef?.effectiveDate || new Date().toISOString().substring(0, 10),
          changeNotes: selectedBOMDef?.changeNotes || selectedBOMDef?.notes || 'Active live specification',
          items: activeItems,
          status: 'Active',
        });

        const revs = selectedBOMDef?.revisionHistory || selectedBOMDef?.revisions || [];
        revs.forEach((r) => {
          if (r.version !== selectedBOMDef?.version) {
            targetVersions.push({
              versionStr: r.version,
              effectiveDate: r.effectiveDate || r.revisionDate || 'Historical',
              changeNotes: r.changeNotes || r.changeSummary || 'Historical revision',
              items: (r.items && r.items.length > 0) ? r.items : (r.itemsSnapshot || []),
              status: 'Archived',
            });
          }
        });
      } else if (versionSelection === 'active') {
        const activeItems = (selectedBOMDef?.items && selectedBOMDef.items.length > 0)
          ? selectedBOMDef.items
          : (selectedProduct.bom && selectedProduct.bom.length > 0)
          ? selectedProduct.bom
          : [];

        targetVersions.push({
          versionStr: selectedBOMDef?.version || '1.0',
          effectiveDate: selectedBOMDef?.effectiveDate || new Date().toISOString().substring(0, 10),
          changeNotes: selectedBOMDef?.changeNotes || selectedBOMDef?.notes || 'Active production specification',
          items: activeItems,
          status: 'Active',
        });
      } else {
        // Specific historical version requested
        const revs = selectedBOMDef?.revisionHistory || selectedBOMDef?.revisions || [];
        const match = revs.find((r) => r.version === versionSelection);
        if (match) {
          targetVersions.push({
            versionStr: match.version,
            effectiveDate: match.effectiveDate || match.revisionDate || 'Historical',
            changeNotes: match.changeNotes || match.changeSummary || 'Revision snapshot',
            items: (match.items && match.items.length > 0) ? match.items : (match.itemsSnapshot || []),
            status: match.version === selectedBOMDef?.version ? 'Active' : 'Archived',
          });
        } else {
          // fallback to active
          const activeItems = selectedBOMDef?.items || selectedProduct.bom || [];
          targetVersions.push({
            versionStr: versionSelection,
            effectiveDate: selectedBOMDef?.effectiveDate || 'Historical',
            changeNotes: 'Specification record',
            items: activeItems,
            status: 'Active',
          });
        }
      }

      return [
        {
          product: selectedProduct,
          versions: targetVersions,
        },
      ];
    } else {
      // All Products mode
      return products.map((prod) => {
        const bDef = (boms || []).find(
          (b) =>
            b.productId === prod.id ||
            (prod.code && b.productCode === prod.code) ||
            (prod.model && b.productModel === prod.model)
        );

        let targetVersions: { versionStr: string; effectiveDate: string; changeNotes: string; items: BOMItem[]; status: string }[] = [];

        if (versionSelection === 'all_versions') {
          const activeItems = (bDef?.items && bDef.items.length > 0)
            ? bDef.items
            : (prod.bom && prod.bom.length > 0)
            ? prod.bom
            : [];

          targetVersions.push({
            versionStr: bDef?.version || '1.0',
            effectiveDate: bDef?.effectiveDate || 'Current',
            changeNotes: bDef?.changeNotes || bDef?.notes || 'Active standard',
            items: activeItems,
            status: 'Active',
          });

          const revs = bDef?.revisionHistory || bDef?.revisions || [];
          revs.forEach((r) => {
            if (r.version !== bDef?.version) {
              targetVersions.push({
                versionStr: r.version,
                effectiveDate: r.effectiveDate || r.revisionDate || 'Historical',
                changeNotes: r.changeNotes || r.changeSummary || 'Revision',
                items: (r.items && r.items.length > 0) ? r.items : (r.itemsSnapshot || []),
                status: 'Archived',
              });
            }
          });
        } else {
          // Just active version
          const activeItems = (bDef?.items && bDef.items.length > 0)
            ? bDef.items
            : (prod.bom && prod.bom.length > 0)
            ? prod.bom
            : [];

          targetVersions.push({
            versionStr: bDef?.version || '1.0',
            effectiveDate: bDef?.effectiveDate || 'Current',
            changeNotes: bDef?.changeNotes || bDef?.notes || 'Active standard',
            items: activeItems,
            status: 'Active',
          });
        }

        return {
          product: prod,
          versions: targetVersions,
        };
      });
    }
  }, [exportMode, selectedProduct, selectedBOMDef, versionSelection, products, boms]);

  // Preview items for selected view
  const previewItems = useMemo(() => {
    if (!exportPayload[0] || !exportPayload[0].versions[0]) return [];
    const items = exportPayload[0].versions[0].items || [];
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();
    return items.filter((it) => {
      const mat = getMaterialDetails(it.materialId, it.materialName, it.unitCostBDT);
      return (
        mat.code.toLowerCase().includes(term) ||
        mat.name.toLowerCase().includes(term) ||
        (it.notes && it.notes.toLowerCase().includes(term))
      );
    });
  }, [exportPayload, searchTerm, rawMaterials]);

  // Total preview cost
  const previewTotalCost = useMemo(() => {
    return previewItems.reduce((sum, it) => {
      const mat = getMaterialDetails(it.materialId, it.materialName, it.unitCostBDT);
      const qty = Number(it.requiredQty) || 0;
      const wastage = includeWastage ? 1 + (Number(it.expectedWastagePercent) || 0) / 100 : 1;
      return sum + qty * wastage * mat.cost;
    }, 0);
  }, [previewItems, includeWastage, rawMaterials]);

  // Generate CSV data string
  const generateCSV = (): string => {
    const headers = [
      'Product Code',
      'Product Name',
      'Product Model',
      'Category',
      'Voltage (V)',
      'Capacity (Ah)',
      'Battery Type',
      'BOM Version',
      'BOM Status',
      'Effective Date',
      'Version Change Notes',
      'Item No',
      'Material Code',
      'Material Name',
      'Category / Group',
      'Unit (UOM)',
      'Required Qty Per Unit',
      ...(includeWastage ? ['Expected Wastage %', 'Gross Required Qty'] : []),
      ...(includeCosts ? ['Unit Cost (BDT)', 'Total Item Cost (BDT)'] : []),
      ...(includeSpecs ? ['Technical Specs / Notes'] : []),
    ];

    const rows: (string | number)[][] = [];

    exportPayload.forEach((entry) => {
      const p = entry.product;
      entry.versions.forEach((v) => {
        if (!v.items || v.items.length === 0) {
          rows.push([
            `"${p.code || ''}"`,
            `"${p.name || ''}"`,
            `"${p.model || ''}"`,
            `"${p.category || ''}"`,
            p.voltageV || '',
            p.capacityAh || '',
            `"${p.batteryType || ''}"`,
            `"v${v.versionStr}"`,
            `"${v.status}"`,
            `"${v.effectiveDate}"`,
            `"${(v.changeNotes || '').replace(/"/g, '""')}"`,
            '-',
            'NO_ITEMS',
            'No BOM components configured',
            '',
            '',
            0,
            ...(includeWastage ? [0, 0] : []),
            ...(includeCosts ? [0, 0] : []),
            ...(includeSpecs ? [''] : []),
          ]);
          return;
        }

        let runningProductBOMCost = 0;

        v.items.forEach((it, idx) => {
          const mat = getMaterialDetails(it.materialId, it.materialName, it.unitCostBDT);
          const reqQty = Number(it.requiredQty) || 0;
          const wastagePct = Number(it.expectedWastagePercent) || 0;
          const grossQty = reqQty * (1 + wastagePct / 100);
          const itemCost = grossQty * mat.cost;
          runningProductBOMCost += itemCost;

          rows.push([
            `"${p.code || ''}"`,
            `"${p.name || ''}"`,
            `"${p.model || ''}"`,
            `"${p.category || ''}"`,
            p.voltageV || '',
            p.capacityAh || '',
            `"${p.batteryType || ''}"`,
            `"v${v.versionStr}"`,
            `"${v.status}"`,
            `"${v.effectiveDate}"`,
            `"${(v.changeNotes || '').replace(/"/g, '""')}"`,
            idx + 1,
            `"${mat.code}"`,
            `"${mat.name.replace(/"/g, '""')}"`,
            `"${mat.category}"`,
            `"${it.unit || mat.unit}"`,
            reqQty,
            ...(includeWastage ? [wastagePct, grossQty.toFixed(4)] : []),
            ...(includeCosts ? [mat.cost.toFixed(2), itemCost.toFixed(2)] : []),
            ...(includeSpecs ? [`"${(it.notes || '').replace(/"/g, '""')}"`] : []),
          ]);
        });

        // Add a subtotals summary row if costs are included
        if (includeCosts) {
          rows.push([
            `"${p.code || ''}"`,
            `"${p.name || ''}"`,
            `"${p.model || ''}"`,
            `"${p.category || ''}"`,
            '',
            '',
            '',
            `"v${v.versionStr}"`,
            'TOTAL_SUMMARY',
            `"${v.effectiveDate}"`,
            `"Total Bill of Materials Assembly Cost"`,
            '',
            'TOTAL',
            `"Total ${v.items.length} Components"`,
            '',
            '',
            '',
            ...(includeWastage ? ['', ''] : []),
            'TOTAL BDT:',
            runningProductBOMCost.toFixed(2),
            ...(includeSpecs ? [''] : []),
          ]);
        }
      });
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    return csvContent;
  };

  // Download CSV trigger
  const handleDownloadCSV = () => {
    const csvData = generateCSV();
    const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const timestamp = new Date().toISOString().substring(0, 10);
    const fileName =
      exportMode === 'single' && selectedProduct
        ? `BOM_${selectedProduct.code || selectedProduct.model}_v${
            versionSelection === 'all_versions' ? 'AllVersions' : versionSelection === 'active' ? (selectedBOMDef?.version || '1.0') : versionSelection
          }_${timestamp}.csv`
        : `BOM_Export_AllProducts_${timestamp}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName.replace(/\s+/g, '_'));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportSuccessMessage(`Downloaded CSV: ${fileName}`);
    setTimeout(() => setExportSuccessMessage(null), 4000);
  };

  // Download JSON trigger
  const handleDownloadJSON = () => {
    const jsonOutput = {
      exportMetadata: {
        application: 'Ensec ERP & Distribution Management Platform',
        organization: 'Ensec Lithium Batteries Bangladesh Ltd.',
        plant: 'Kushtia Lithium Battery Assembly Facility',
        exportDate: new Date().toISOString(),
        exportMode,
        productFilter: exportMode === 'single' ? selectedProduct?.name : 'All Products',
        versionFilter: versionSelection,
      },
      billOfMaterials: exportPayload.map((entry) => ({
        product: {
          id: entry.product.id,
          code: entry.product.code,
          name: entry.product.name,
          model: entry.product.model,
          category: entry.product.category,
          voltageV: entry.product.voltageV,
          capacityAh: entry.product.capacityAh,
          batteryType: entry.product.batteryType,
        },
        versions: entry.versions.map((v) => {
          const itemsData = v.items.map((it) => {
            const mat = getMaterialDetails(it.materialId, it.materialName, it.unitCostBDT);
            const reqQty = Number(it.requiredQty) || 0;
            const wastage = Number(it.expectedWastagePercent) || 0;
            const grossQty = reqQty * (1 + wastage / 100);
            return {
              materialId: it.materialId,
              materialCode: mat.code,
              materialName: mat.name,
              category: mat.category,
              unit: it.unit || mat.unit,
              requiredQty: reqQty,
              expectedWastagePercent: wastage,
              grossRequiredQty: grossQty,
              unitCostBDT: includeCosts ? mat.cost : undefined,
              totalCostBDT: includeCosts ? grossQty * mat.cost : undefined,
              notes: it.notes || '',
            };
          });

          const totalCostBDT = itemsData.reduce((sum, it) => sum + (it.totalCostBDT || 0), 0);

          return {
            version: v.versionStr,
            status: v.status,
            effectiveDate: v.effectiveDate,
            changeNotes: v.changeNotes,
            itemCount: itemsData.length,
            totalAssemblyCostBDT: includeCosts ? totalCostBDT : undefined,
            components: itemsData,
          };
        }),
      })),
    };

    const blob = new Blob([JSON.stringify(jsonOutput, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const timestamp = new Date().toISOString().substring(0, 10);
    const fileName =
      exportMode === 'single' && selectedProduct
        ? `BOM_${selectedProduct.code || selectedProduct.model}_v${
            versionSelection === 'all_versions' ? 'AllVersions' : versionSelection === 'active' ? (selectedBOMDef?.version || '1.0') : versionSelection
          }_${timestamp}.json`
        : `BOM_Export_AllProducts_${timestamp}.json`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName.replace(/\s+/g, '_'));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportSuccessMessage(`Downloaded JSON: ${fileName}`);
    setTimeout(() => setExportSuccessMessage(null), 4000);
  };

  // Copy Tab-Separated Values (TSV) for direct paste into Excel / Google Sheets
  const handleCopyToClipboard = () => {
    const csvText = generateCSV();
    // Convert CSV commas to tabs for clean Excel/Sheets clipboard paste
    const tsvText = csvText
      .split('\r\n')
      .map((line) => {
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!matches) return line.replace(/,/g, '\t');
        return matches
          .map((m) => m.replace(/^"|"$/g, '').replace(/""/g, '"'))
          .join('\t');
      })
      .join('\n');

    navigator.clipboard.writeText(tsvText).then(() => {
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2500);
    });
  };

  // Printable / PDF Specification Sheet
  const handlePrintSpecificationSheet = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up was blocked. Please allow pop-ups to print the BOM Specification Sheet.');
      return;
    }

    const payload = exportPayload;
    const dateFormatted = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    let printHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill of Materials (BOM) Specification — Ensec Lithium Batteries</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0f172a;
            background: #fff;
            margin: 0;
            padding: 20px;
            font-size: 11px;
            line-height: 1.4;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .logo-box {
            font-size: 20px;
            font-weight: 900;
            letter-spacing: -0.5px;
            color: #1e3a8a;
          }
          .logo-sub {
            font-size: 9.5px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .doc-badge {
            text-align: right;
          }
          .doc-title {
            font-size: 15px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .doc-ref {
            font-size: 10px;
            font-family: monospace;
            color: #475569;
            margin-top: 2px;
          }
          .product-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 14px;
            page-break-inside: avoid;
          }
          .product-title {
            font-size: 13px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 6px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 999px;
            font-size: 9.5px;
            font-weight: 700;
            background: #eff6ff;
            color: #2563eb;
            border: 1px solid #bfdbfe;
          }
          .specs-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            font-size: 10px;
            margin-top: 6px;
            padding-top: 6px;
            border-top: 1px dashed #cbd5e1;
          }
          .spec-label {
            color: #64748b;
          }
          .spec-val {
            font-weight: 600;
            color: #0f172a;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            margin-top: 8px;
            margin-bottom: 14px;
          }
          th {
            background: #f1f5f9;
            color: #334155;
            font-weight: 700;
            text-align: left;
            padding: 6px 8px;
            border: 1px solid #cbd5e1;
            font-size: 9.5px;
          }
          th.num, td.num {
            text-align: right;
            font-family: monospace;
          }
          td {
            padding: 5px 8px;
            border: 1px solid #e2e8f0;
            color: #1e293b;
          }
          tr:nth-child(even) {
            background: #fafafa;
          }
          .total-row {
            background: #f8fafc;
            font-weight: 800;
          }
          .total-row td {
            border-top: 2px solid #94a3b8;
            font-size: 10.5px;
          }
          .sign-box {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-top: 30px;
            padding-top: 10px;
            page-break-inside: avoid;
          }
          .signature-line {
            border-top: 1px solid #94a3b8;
            padding-top: 6px;
            text-align: center;
            font-size: 9.5px;
            color: #475569;
          }
          .print-actions {
            position: fixed;
            top: 15px;
            right: 15px;
            background: #1e293b;
            color: white;
            padding: 8px 14px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border: none;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          @media print {
            .print-actions {
              display: none;
            }
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <button class="print-actions" onclick="window.print()">
          🖨️ Print / Save as PDF
        </button>

        <div class="header">
          <div>
            <div class="logo-box">ENSEC LITHIUM BATTERIES</div>
            <div class="logo-sub">Advanced Energy Storage &amp; BMS Engineering • Bangladesh</div>
            <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">Optimum Assembly Facility, Kushtia Industrial Area</div>
          </div>
          <div class="doc-badge">
            <div class="doc-title">Bill of Materials (BOM) Master Sheet</div>
            <div class="doc-ref">DOC-REF: BOM-SPEC-${Date.now().toString().slice(-6)}</div>
            <div class="doc-ref">Date: ${dateFormatted}</div>
          </div>
        </div>
    `;

    payload.forEach((entry) => {
      const p = entry.product;
      entry.versions.forEach((v) => {
        let totalCost = 0;
        let totalQty = 0;

        printHTML += `
          <div class="product-card">
            <div class="product-title">
              <span>
                <strong>${p.name}</strong> 
                <span style="font-family: monospace; color: #2563eb; margin-left: 6px;">[${p.code || 'FG-PROD'}]</span>
                <span style="color: #64748b; font-weight: normal; margin-left: 6px;">Model: ${p.model}</span>
              </span>
              <span class="badge">Version: v${v.versionStr} (${v.status})</span>
            </div>

            <div class="specs-grid">
              <div><span class="spec-label">Voltage &amp; Capacity:</span> <span class="spec-val">${p.voltageV}V / ${p.capacityAh}Ah</span></div>
              <div><span class="spec-label">Cell Chemistry:</span> <span class="spec-val">${p.batteryType || 'LiFePO4'}</span></div>
              <div><span class="spec-label">Effective Date:</span> <span class="spec-val">${v.effectiveDate}</span></div>
              <div><span class="spec-label">Change Reference:</span> <span class="spec-val">${v.changeNotes || 'Standard Production'}</span></div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 25px;">#</th>
                  <th style="width: 90px;">Material Code</th>
                  <th>Raw Material Specification</th>
                  <th style="width: 60px;">UOM</th>
                  <th class="num" style="width: 75px;">Req. Qty</th>
                  ${includeWastage ? '<th class="num" style="width: 65px;">Wastage %</th>' : ''}
                  ${includeCosts ? '<th class="num" style="width: 85px;">Unit Rate (BDT)</th><th class="num" style="width: 95px;">Total Cost (BDT)</th>' : ''}
                  ${includeSpecs ? '<th>Notes / Tolerances</th>' : ''}
                </tr>
              </thead>
              <tbody>
        `;

        if (!v.items || v.items.length === 0) {
          printHTML += `
            <tr>
              <td colspan="${4 + (includeWastage ? 1 : 0) + (includeCosts ? 2 : 0) + (includeSpecs ? 1 : 0)}" style="text-align: center; color: #94a3b8; padding: 16px;">
                No component bill of materials defined for this revision.
              </td>
            </tr>
          `;
        } else {
          v.items.forEach((it, idx) => {
            const mat = getMaterialDetails(it.materialId, it.materialName, it.unitCostBDT);
            const reqQty = Number(it.requiredQty) || 0;
            const wastage = Number(it.expectedWastagePercent) || 0;
            const grossQty = reqQty * (1 + wastage / 100);
            const itemCost = grossQty * mat.cost;
            totalCost += itemCost;
            totalQty += reqQty;

            printHTML += `
              <tr>
                <td>${idx + 1}</td>
                <td style="font-family: monospace; font-weight: 600; color: #1e40af;">${mat.code}</td>
                <td><strong>${mat.name}</strong> <span style="font-size: 8.5px; color: #64748b;">(${mat.category})</span></td>
                <td>${it.unit || mat.unit}</td>
                <td class="num">${reqQty}</td>
                ${includeWastage ? `<td class="num">${wastage}%</td>` : ''}
                ${includeCosts ? `<td class="num">৳ ${mat.cost.toLocaleString()}</td><td class="num" style="font-weight: 600;">৳ ${Math.round(itemCost).toLocaleString()}</td>` : ''}
                ${includeSpecs ? `<td style="font-size: 9px; color: #475569;">${it.notes || '-'}</td>` : ''}
              </tr>
            `;
          });

          if (includeCosts) {
            printHTML += `
              <tr class="total-row">
                <td colspan="${4 + (includeWastage ? 1 : 0)}" style="text-align: right;">Total Material Assembly Cost / Unit:</td>
                <td class="num" colspan="2" style="color: #1e3a8a; font-size: 11px;">৳ ${Math.round(totalCost).toLocaleString()} BDT</td>
                ${includeSpecs ? '<td></td>' : ''}
              </tr>
            `;
          }
        }

        printHTML += `
              </tbody>
            </table>
          </div>
        `;
      });
    });

    printHTML += `
        <div class="sign-box">
          <div class="signature-line">
            <strong>Prepared By:</strong><br />
            Battery R&amp;D / Production Engineer<br />
            Ensec Manufacturing Plant
          </div>
          <div class="signature-line">
            <strong>Verified By:</strong><br />
            Quality Assurance &amp; Cost Controller<br />
            Ensec Energy Systems Ltd.
          </div>
          <div class="signature-line">
            <strong>Approved By:</strong><br />
            Director of Operations / Plant Head<br />
            Ensec Lithium Batteries Bangladesh
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printHTML);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-5 text-xs max-h-[92vh] flex flex-col justify-between">
        
        {/* Modal Top Header */}
        <div>
          <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Bill of Materials (BOM) Version-Wise Export
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Export product-wise and version-wise BOM engineering specifications, component batches, and production cost breakdowns.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success Banner */}
          {exportSuccessMessage && (
            <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold">{exportSuccessMessage}</span>
            </div>
          )}

          {/* Configuration Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            {/* Export Scope Selector */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Export Target Scope
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setExportMode('single')}
                  className={`py-1.5 px-2 rounded-lg font-bold text-xs transition cursor-pointer text-center ${
                    exportMode === 'single'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Single Product
                </button>
                <button
                  type="button"
                  onClick={() => setExportMode('all')}
                  className={`py-1.5 px-2 rounded-lg font-bold text-xs transition cursor-pointer text-center ${
                    exportMode === 'all'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All Products ({products.length})
                </button>
              </div>

              {exportMode === 'single' ? (
                <div className="pt-1.5">
                  <select
                    value={selectedProductId}
                    onChange={(e) => {
                      setSelectedProductId(e.target.value);
                      setVersionSelection('active'); // reset to active for newly picked product
                    }}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {products.map((p, pIdx) => (
                      <option key={`${p.id}-${pIdx}`} value={p.id}>
                        {p.code ? `[${p.code}] ` : ''}{p.name} ({p.model})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[11px] text-blue-700 dark:text-blue-300">
                  Will export all {products.length} finished battery models currently registered in master catalogue.
                </div>
              )}
            </div>

            {/* Version Selector */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>BOM Version Selection</span>
                <span className="text-[10px] text-slate-500 lowercase">
                  {exportMode === 'single' ? `${availableVersions.length} versions logged` : 'cross-product'}
                </span>
              </label>

              {exportMode === 'single' ? (
                <select
                  value={versionSelection}
                  onChange={(e) => setVersionSelection(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {availableVersions.map((v, vIdx) => (
                    <option key={`${v.version}-${vIdx}`} value={v.version}>
                      {v.label} — {v.date}
                    </option>
                  ))}
                  <option value="all_versions">
                    ✦ All Versions (Consolidated Multi-Version History)
                  </option>
                </select>
              ) : (
                <select
                  value={versionSelection}
                  onChange={(e) => setVersionSelection(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="active">Active Live Standard Version Only</option>
                  <option value="all_versions">All Versions &amp; Revisions Across All Models</option>
                </select>
              )}

              {/* Version Note */}
              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1 truncate">
                <Info className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">
                  {versionSelection === 'active'
                    ? `Current production release (v${selectedBOMDef?.version || '1.0'})`
                    : versionSelection === 'all_versions'
                    ? 'Outputs historical change progression & full audit snapshots'
                    : `Revision snapshot for version ${versionSelection}`}
                </span>
              </div>
            </div>

            {/* Inclusions & Column Options */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Export Options &amp; Data Columns
              </label>
              <div className="space-y-1.5 pt-0.5">
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeCosts}
                    onChange={(e) => setIncludeCosts(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                  />
                  <span>Include Unit Cost &amp; Total Assembly BDT</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeWastage}
                    onChange={(e) => setIncludeWastage(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                  />
                  <span>Include Scrap / Wastage % &amp; Gross Qty</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeSpecs}
                    onChange={(e) => setIncludeSpecs(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                  />
                  <span>Include Notes &amp; Engineering Tolerances</span>
                </label>
              </div>
            </div>
          </div>

          {/* Product & Version Summary Pill */}
          {selectedProduct && exportMode === 'single' && (
            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-[11px] bg-blue-600 text-white px-2 py-0.5 rounded">
                  {selectedProduct.code || 'FG-PROD'}
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedProduct.name}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Model: <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">{selectedProduct.model}</span>
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  • {selectedProduct.voltageV}V {selectedProduct.capacityAh}Ah ({selectedProduct.batteryType || 'LiFePO4'})
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-[11px] text-slate-600 dark:text-slate-300">
                  Components: <strong className="text-slate-900 dark:text-white">{previewItems.length} items</strong>
                </div>
                {includeCosts && (
                  <div className="text-[11px] text-slate-600 dark:text-slate-300">
                    Est. Cost / Unit: <strong className="text-blue-600 dark:text-blue-400 font-mono">৳ {Math.round(previewTotalCost).toLocaleString()}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Interactive Preview Table */}
          <div className="mt-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                  Export Dataset Preview ({previewItems.length} Materials)
                </span>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter preview items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 sm:w-56"
                />
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold sticky top-0 z-10 text-[11px]">
                  <tr>
                    <th className="p-2.5 w-10">#</th>
                    <th className="p-2.5">Code</th>
                    <th className="p-2.5">Raw Material Component</th>
                    <th className="p-2.5">UOM</th>
                    <th className="p-2.5 text-right">Req. Qty</th>
                    {includeWastage && <th className="p-2.5 text-right">Wastage %</th>}
                    {includeCosts && <th className="p-2.5 text-right">Unit Rate</th>}
                    {includeCosts && <th className="p-2.5 text-right">Item Total</th>}
                    {includeSpecs && <th className="p-2.5">Tolerance / Notes</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {previewItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5 + (includeWastage ? 1 : 0) + (includeCosts ? 2 : 0) + (includeSpecs ? 1 : 0)}
                        className="p-6 text-center text-slate-400 dark:text-slate-500"
                      >
                        No matching components found for this BOM version.
                      </td>
                    </tr>
                  ) : (
                    previewItems.map((item, idx) => {
                      const mat = getMaterialDetails(item.materialId, item.materialName, item.unitCostBDT);
                      const reqQty = Number(item.requiredQty) || 0;
                      const wastage = Number(item.expectedWastagePercent) || 0;
                      const grossQty = reqQty * (1 + wastage / 100);
                      const itemTotal = grossQty * mat.cost;

                      return (
                        <tr
                          key={`bom-preview-${item.id || item.materialId || 'item'}-${idx}`}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                        >
                          <td className="p-2.5 text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                          <td className="p-2.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                            {mat.code}
                          </td>
                          <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">
                            {mat.name}
                          </td>
                          <td className="p-2.5 text-slate-500">{item.unit || mat.unit}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                            {reqQty}
                          </td>
                          {includeWastage && (
                            <td className="p-2.5 text-right font-mono text-slate-500">
                              {wastage}%
                            </td>
                          )}
                          {includeCosts && (
                            <td className="p-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                              ৳ {mat.cost.toLocaleString()}
                            </td>
                          )}
                          {includeCosts && (
                            <td className="p-2.5 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                              ৳ {Math.round(itemTotal).toLocaleString()}
                            </td>
                          )}
                          {includeSpecs && (
                            <td className="p-2.5 text-slate-500 text-[11px] truncate max-w-[140px]">
                              {item.notes || '-'}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyToClipboard}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs"
              title="Copy tab-delimited text to paste directly into Google Sheets or MS Excel"
            >
              {copiedToClipboard ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-bold">Copied TSV!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy for Sheets / Excel</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadJSON}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs"
              title="Export structured JSON data"
            >
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span>Export JSON</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handlePrintSpecificationSheet}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs hover:bg-blue-100 dark:hover:bg-blue-900 transition cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF Spec Sheet</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCSV}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs transition cursor-pointer shadow-md shadow-emerald-600/20"
            >
              <Download className="w-4 h-4" />
              <span>Download BOM CSV (Excel)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
