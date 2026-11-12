/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ensec ERP - Granular Page-Wise & Action-Based Permissions Engine
 * Provides independent action-based security clearances across every sidebar module and page.
 */

export interface PageActionDef {
  key: string;
  label: string;
  description: string;
  isApprovalAction?: boolean;
  isDestructive?: boolean;
}

export interface ERPPageDef {
  id: string; // matches sidebar module id e.g. 'sales-orders-registry', 'raw-material-receive', etc.
  name: string;
  category: string;
  description: string;
  actions: PageActionDef[];
}

export interface ERPModuleCategory {
  id: string;
  title: string;
  description: string;
  pages: ERPPageDef[];
}

/**
 * Granular permissions map for a user:
 * {
 *   [pageId: string]: {
 *     [actionKey: string]: boolean;
 *   }
 * }
 */
export type UserPagePermissionsMap = {
  [pageId: string]: {
    [actionKey: string]: boolean;
  };
};

export interface PermissionTemplate {
  id: string;
  name: string;
  roleTarget: string;
  description: string;
  permissions: UserPagePermissionsMap;
}

// Complete registry of all ERP modules, subpages, and action-based permissions
export const ERP_PAGE_PERMISSIONS_REGISTRY: ERPModuleCategory[] = [
  {
    id: 'core-platform',
    title: 'Core Platform & Master Data',
    description: 'System dashboards, master catalog definitions, branches, and organizational structures.',
    pages: [
      {
        id: 'dashboard',
        name: 'Executive Dashboard',
        category: 'Core Platform',
        description: 'Real-time revenue, inventory KPIs, battery health, and sales analytics.',
        actions: [
          { key: 'view', label: 'View Dashboard', description: 'Can view executive KPI summary and battery health graphs' },
          { key: 'export', label: 'Export Analytics', description: 'Can export management metrics and graphical chart data' },
          { key: 'view_revenue', label: 'View Revenue & Profit', description: 'Can see financial turnover, receivables, and profit figures' },
        ],
      },
      {
        id: 'basic-data-raw-materials',
        name: 'Raw Materials Master',
        category: 'Master Data Hub',
        description: 'Battery cells, BMS, casings, connectors, and factory raw material specs.',
        actions: [
          { key: 'view', label: 'View Raw Materials', description: 'Can view raw materials catalog and specifications' },
          { key: 'create', label: 'Create Raw Material', description: 'Can add new raw material codes, UOM, and standard purchase rates' },
          { key: 'edit', label: 'Edit Raw Material', description: 'Can modify existing raw material specifications and classifications' },
          { key: 'delete', label: 'Delete Raw Material', description: 'Can remove raw material codes (destructive action)', isDestructive: true },
          { key: 'import_excel', label: 'Bulk Excel Upload', description: 'Can perform bulk catalog updates from Excel spreadsheets' },
          { key: 'export', label: 'Export Catalog', description: 'Can export raw materials data to CSV or Excel' },
        ],
      },
      {
        id: 'basic-data-raw-categories',
        name: 'Raw Material Categories',
        category: 'Master Data Hub',
        description: 'Battery component groupings (Cells, BMS, Plastic Parts, Electronics).',
        actions: [
          { key: 'view', label: 'View Categories', description: 'Can view raw material category groups' },
          { key: 'create', label: 'Create Category', description: 'Can define new raw material categories' },
          { key: 'edit', label: 'Edit Category', description: 'Can update category titles and codes' },
          { key: 'delete', label: 'Delete Category', description: 'Can delete material categories', isDestructive: true },
        ],
      },
      {
        id: 'basic-data-raw-classifications',
        name: 'Raw Material Classifications',
        category: 'Master Data Hub',
        description: 'Granular classification (Grade A Cells, Cylindrical, Prismatic).',
        actions: [
          { key: 'view', label: 'View Classifications', description: 'Can view raw material classification tiers' },
          { key: 'create', label: 'Create Classification', description: 'Can add new classification types' },
          { key: 'edit', label: 'Edit Classification', description: 'Can edit classification names' },
          { key: 'delete', label: 'Delete Classification', description: 'Can delete classifications', isDestructive: true },
        ],
      },
      {
        id: 'basic-data-products',
        name: 'Finished Battery Products',
        category: 'Master Data Hub',
        description: 'Finished lithium battery models (e.g., 48V 100Ah, 60V 50Ah, Solar packs).',
        actions: [
          { key: 'view', label: 'View Products', description: 'Can view commercial finished battery models and prices' },
          { key: 'create', label: 'Create Product', description: 'Can add new finished battery pack models and SKUs' },
          { key: 'edit', label: 'Edit Product', description: 'Can update battery capacities, warranty terms, and pricing' },
          { key: 'delete', label: 'Delete Product', description: 'Can remove product SKUs', isDestructive: true },
          { key: 'export', label: 'Export Products', description: 'Can download finished goods catalog' },
        ],
      },
      {
        id: 'basic-data-categories',
        name: 'Product Categories',
        category: 'Master Data Hub',
        description: 'Finished battery categories (EV, Telecom, Solar Energy Storage).',
        actions: [
          { key: 'view', label: 'View Categories', description: 'Can browse product category hierarchy' },
          { key: 'create', label: 'Create Category', description: 'Can add new product categories' },
          { key: 'edit', label: 'Edit Category', description: 'Can modify product category metadata' },
          { key: 'delete', label: 'Delete Category', description: 'Can delete product categories', isDestructive: true },
        ],
      },
      {
        id: 'basic-data-brands',
        name: 'Product Brands',
        category: 'Master Data Hub',
        description: 'Proprietary and partner lithium battery branding lines.',
        actions: [
          { key: 'view', label: 'View Brands', description: 'Can view brand lists' },
          { key: 'create', label: 'Create Brand', description: 'Can add brand names and logos' },
          { key: 'edit', label: 'Edit Brand', description: 'Can update brand information' },
          { key: 'delete', label: 'Delete Brand', description: 'Can remove brand entries', isDestructive: true },
        ],
      },
      {
        id: 'basic-data-warehouses',
        name: 'Warehouse & Plant Hubs',
        category: 'Master Data Hub',
        description: 'Kushtia Factory Plant, Dhaka Central Hub, Chattogram, and regional depots.',
        actions: [
          { key: 'view', label: 'View Warehouses', description: 'Can view warehouse hubs and bin locations' },
          { key: 'create', label: 'Create Warehouse', description: 'Can configure new storage depot or regional hub' },
          { key: 'edit', label: 'Edit Warehouse', description: 'Can modify warehouse address, capacity, and managers' },
          { key: 'delete', label: 'Delete Warehouse', description: 'Can delete warehouse hubs', isDestructive: true },
          { key: 'status_toggle', label: 'Toggle Status', description: 'Can activate or deactivate warehouse operational status' },
        ],
      },
      {
        id: 'basic-data-distributors',
        name: 'Distributor Management',
        category: 'Master Data Hub',
        description: 'Authorized regional distributors, security deposits, and credit limits.',
        actions: [
          { key: 'view', label: 'View Distributors', description: 'Can view distributor accounts and active balances' },
          { key: 'create', label: 'Onboard Distributor', description: 'Can enroll new authorized distributors' },
          { key: 'edit', label: 'Edit Distributor', description: 'Can modify contact, bank guarantees, and territory' },
          { key: 'delete', label: 'Delete Distributor', description: 'Can remove distributor profile', isDestructive: true },
          { key: 'approve_credit', label: 'Approve Credit Limit', description: 'Can grant or modify distributor credit ceilings', isApprovalAction: true },
          { key: 'export', label: 'Export Distributors', description: 'Can export distributor directory' },
        ],
      },
      {
        id: 'basic-data-customers',
        name: 'Customer Directory & CRM',
        category: 'Master Data Hub',
        description: 'Retailers, corporate fleet buyers, solar installers, and end users.',
        actions: [
          { key: 'view', label: 'View Customers', description: 'Can browse customer contact cards and ledger history' },
          { key: 'create', label: 'Create Customer', description: 'Can register new customer accounts' },
          { key: 'edit', label: 'Edit Customer', description: 'Can modify customer details and NID / trade license info' },
          { key: 'delete', label: 'Delete Customer', description: 'Can delete customer accounts', isDestructive: true },
          { key: 'set_credit', label: 'Set Credit Limits', description: 'Can configure customer payment terms and credit days' },
          { key: 'export', label: 'Export Customers', description: 'Can export customer lists' },
        ],
      },
      {
        id: 'basic-data-pricing-matrix',
        name: 'Customer Categories & Pricing',
        category: 'Master Data Hub',
        description: 'Tiered wholesale, dealer, corporate, and retail pricing matrices.',
        actions: [
          { key: 'view', label: 'View Pricing Matrix', description: 'Can view pricing tiers and margin percentages' },
          { key: 'create', label: 'Create Pricing Rule', description: 'Can define new customer pricing formulas' },
          { key: 'edit', label: 'Edit Pricing Matrix', description: 'Can modify unit prices across customer tiers' },
          { key: 'approve', label: 'Approve Special Prices', description: 'Can approve off-matrix promotional price overrides', isApprovalAction: true },
        ],
      },
      {
        id: 'basic-data-org-hierarchy',
        name: 'Org & Sales Hierarchy',
        category: 'Master Data Hub',
        description: 'National, Division, Region, Area, Territory, and Beat hierarchy tree.',
        actions: [
          { key: 'view', label: 'View Org Tree', description: 'Can view complete organizational structural tree' },
          { key: 'create', label: 'Create Org Node', description: 'Can create new divisional, regional, or territory nodes' },
          { key: 'edit', label: 'Edit Org Node', description: 'Can reassign managers and territory boundaries' },
          { key: 'delete', label: 'Delete Org Node', description: 'Can delete hierarchy branches', isDestructive: true },
        ],
      },
      {
        id: 'basic-data-field-force',
        name: 'Field Force & Sales Officers',
        category: 'Master Data Hub',
        description: 'Territory Sales Officers (TSO), Area Managers, and Field Staff.',
        actions: [
          { key: 'view', label: 'View Field Force', description: 'Can view field sales officers list and territories' },
          { key: 'create', label: 'Add Sales Officer', description: 'Can onboard new territory sales personnel' },
          { key: 'edit', label: 'Edit Sales Officer', description: 'Can update territory boundaries and supervisor' },
          { key: 'assign_target', label: 'Assign Sales Target', description: 'Can assign monthly and quarterly sales quotas' },
          { key: 'delete', label: 'Remove Officer', description: 'Can deactivate field force accounts', isDestructive: true },
        ],
      },
      {
        id: 'basic-data-departments',
        name: 'Departments',
        category: 'Master Data Hub',
        description: 'Company departments (Production, Accounts, SCM, Field Sales, Quality).',
        actions: [
          { key: 'view', label: 'View Departments', description: 'Can view company departments' },
          { key: 'create', label: 'Create Department', description: 'Can register new departments' },
          { key: 'edit', label: 'Edit Department', description: 'Can modify department titles and heads' },
          { key: 'delete', label: 'Delete Department', description: 'Can delete departments', isDestructive: true },
        ],
      },
      {
        id: 'basic-data-banks',
        name: 'Bank & Financial Accounts',
        category: 'Master Data Hub',
        description: 'Corporate bank accounts, branch routing, and electronic payment gateways.',
        actions: [
          { key: 'view', label: 'View Bank Accounts', description: 'Can view company bank account numbers and titles' },
          { key: 'create', label: 'Add Bank Account', description: 'Can configure new commercial bank accounts' },
          { key: 'edit', label: 'Edit Bank Account', description: 'Can update routing numbers and signers' },
          { key: 'delete', label: 'Delete Bank Account', description: 'Can remove bank account entries', isDestructive: true },
        ],
      },
      {
        id: 'basic-data-uom',
        name: 'Units of Measurement (UOM)',
        category: 'Master Data Hub',
        description: 'Pieces, Sets, Cartons, Kilograms, Liters, Meters, and conversion factors.',
        actions: [
          { key: 'view', label: 'View UOMs', description: 'Can view standard measurement units' },
          { key: 'create', label: 'Create UOM', description: 'Can add new units of measurement' },
          { key: 'edit', label: 'Edit UOM', description: 'Can modify unit symbols and precision' },
          { key: 'delete', label: 'Delete UOM', description: 'Can delete UOMs', isDestructive: true },
        ],
      },
      {
        id: 'basic-data-offers',
        name: 'Offer & Promo Engine',
        category: 'Master Data Hub',
        description: 'Seasonal discounts, volume rebates, bundled BMS promos, and cashback.',
        actions: [
          { key: 'view', label: 'View Offers', description: 'Can view active and scheduled promotional schemes' },
          { key: 'create', label: 'Create Offer', description: 'Can create promotional discount and cashback rules' },
          { key: 'edit', label: 'Edit Offer', description: 'Can modify validity dates and eligible battery models' },
          { key: 'approve', label: 'Approve & Activate', description: 'Can authorize and activate promotional campaigns', isApprovalAction: true },
          { key: 'delete', label: 'Terminate Offer', description: 'Can cancel or delete promotional campaigns', isDestructive: true },
        ],
      },
    ],
  },
  {
    id: 'supply-chain-factory',
    title: 'Supply Chain, Factory & Costing',
    description: 'Raw materials receiving, inventory valuation, manufacturing batches, BOM, and factory cost absorption.',
    pages: [
      {
        id: 'raw-material-receive',
        name: 'Raw Material Receive (MRR)',
        category: 'Supply Chain & Factory',
        description: 'Material Receiving Reports (MRR), supplier delivery inspection, and batch barcode generation.',
        actions: [
          { key: 'view', label: 'View Material Receipts', description: 'Can view incoming raw material consignments and MRRs' },
          { key: 'create', label: 'Create MRR Voucher', description: 'Can record new incoming supplier material delivery' },
          { key: 'edit', label: 'Edit MRR Details', description: 'Can edit received quantities and invoice numbers' },
          { key: 'approve', label: 'QC & Acceptance Approval', description: 'Can approve quality inspection and post to inventory stock', isApprovalAction: true },
          { key: 'delete', label: 'Void Receipt', description: 'Can cancel or void material receiving vouchers', isDestructive: true },
          { key: 'export', label: 'Export MRR Records', description: 'Can export raw material receipt archives' },
        ],
      },
      {
        id: 'raw-material-inventory',
        name: 'Raw Material Inventory & Stock',
        category: 'Supply Chain & Factory',
        description: 'Batch-wise real-time stock, FIFO rate tracking, barcode identification, and category summary.',
        actions: [
          { key: 'view', label: 'View Inventory Stock', description: 'Can view real-time batch stock and warehouse locations' },
          { key: 'view_raw_material_stock_value', label: 'View Raw Material Stock Value', description: 'Can view the Stock Value column and valuation in Raw Materials Stock section' },
          { key: 'view_raw_material_purchase_rate', label: 'View Raw Material Purchase Rate', description: 'Can view the Purchase Rate column in Batch-wise Stock section' },
          { key: 'view_batch_stock_value', label: 'View Batch-wise Stock Value', description: 'Can view the Stock Value column in Batch-wise Stock section' },
          { key: 'barcode_scan', label: 'Scan & Search Barcode', description: 'Can scan batch barcodes to verify material authenticity' },
          { key: 'export', label: 'Export Inventory', description: 'Can download batch-wise stock and inventory movement reports' },
        ],
      },
      {
        id: 'procurement',
        name: 'Import Consignments & SCM',
        category: 'Supply Chain & Factory',
        description: 'Foreign L/C consignments, customs duty, port clearance, and landed cost calculation.',
        actions: [
          { key: 'view', label: 'View Consignments', description: 'Can view active import L/Cs, shipping containers, and tracking' },
          { key: 'create', label: 'Create Consignment', description: 'Can record new foreign import procurement order' },
          { key: 'edit', label: 'Edit Consignment', description: 'Can modify supplier proforma invoice, BL, and customs bills' },
          { key: 'update_landed_cost', label: 'Update Landed Cost', description: 'Can apportion ocean freight, insurance, and customs duty' },
          { key: 'approve', label: 'Approve Consignment', description: 'Can officially close and approve commercial consignments', isApprovalAction: true },
          { key: 'delete', label: 'Delete Consignment', description: 'Can remove consignment record', isDestructive: true },
          { key: 'export', label: 'Export Procurement', description: 'Can export consignment financial sheets' },
        ],
      },
      {
        id: 'manufacturing',
        name: 'Factory & BOM Operations',
        category: 'Supply Chain & Factory',
        description: 'Production orders, batch launches, FIFO material issue, BOM formulas, and FG receipt.',
        actions: [
          { key: 'view', label: 'View Production Batches', description: 'Can view factory production orders, statuses, and WIP' },
          { key: 'create_batch', label: 'Launch Production Batch', description: 'Can schedule new production batch for finished battery packs' },
          { key: 'edit_batch', label: 'Edit Batch Details', description: 'Can modify planned quantity and production target dates' },
          { key: 'issue_materials', label: 'Issue Raw Materials', description: 'Can issue batch-specific raw materials using FIFO selection' },
          { key: 'edit_issued_stock', label: 'Edit Issued Stock', description: 'Can update or adjust previously issued material batch quantities' },
          { key: 'receive_fg', label: 'Receive Finished Goods', description: 'Can confirm batch completion and receive finished battery packs into FG inventory' },
          { key: 'update_bom', label: 'Update BOM Definition', description: 'Can modify standard Bill of Materials components and ratios' },
          { key: 'cancel_batch', label: 'Cancel Batch', description: 'Can cancel production orders and release reserved materials', isDestructive: true },
        ],
      },
      {
        id: 'manufacturing-costing',
        name: 'Manufacturing Costing & P&L',
        category: 'Supply Chain & Factory',
        description: 'Factory overhead expense posting, pro-rata cost allocation, and batch unit costing.',
        actions: [
          { key: 'view', label: 'View Cost Dashboard', description: 'Can view actual manufacturing cost breakdowns, P&L, and KPIs' },
          { key: 'post_expense', label: 'Post Factory Expense', description: 'Can post rent, electricity, generator fuel, and factory expense vouchers' },
          { key: 'approve_expense', label: 'Approve Expense Voucher', description: 'Can approve factory operational expense vouchers', isApprovalAction: true },
          { key: 'allocate_cost', label: 'Allocate Overheads', description: 'Can allocate factory overheads across active production batches' },
          { key: 'rollback_allocation', label: 'Roll Back Allocation', description: 'Can delete cost allocations and restore unallocated voucher balance', isDestructive: true },
          { key: 'save_cost_sheet', label: 'Save Cost Sheet to DB', description: 'Can recalculate and persist official batch production cost sheets to database' },
          { key: 'export', label: 'Export Cost Sheets', description: 'Can export detailed manufacturing cost sheets' },
        ],
      },
    ],
  },
  {
    id: 'stock-indent',
    title: 'Stock, Warehouse & Indent Management',
    description: 'Finished goods inventory, warehouse transfers, physical stock adjustments, and returns.',
    pages: [
      {
        id: 'stock-cid-receive',
        name: 'CID Receive',
        category: 'Stock & Indent',
        description: 'Customer Inward Delivery (CID) stock intake and initial warehouse inspection.',
        actions: [
          { key: 'view', label: 'View CID Receipts', description: 'Can view CID receipts and inbound stock logs' },
          { key: 'create', label: 'Create CID Receipt', description: 'Can record incoming CID inventory from factory' },
          { key: 'approve', label: 'Approve CID Intake', description: 'Can verify and approve CID stock inward', isApprovalAction: true },
          { key: 'delete', label: 'Delete CID Receipt', description: 'Can delete CID records', isDestructive: true },
        ],
      },
      {
        id: 'stock-create-opening',
        name: 'Create Opening Stock',
        category: 'Stock & Indent',
        description: 'Manual initialization of opening inventory balances.',
        actions: [
          { key: 'view', label: 'View Opening Stock', description: 'Can view recorded opening stock entries' },
          { key: 'create', label: 'Create Opening Entry', description: 'Can enter manual opening stock balances' },
          { key: 'edit', label: 'Edit Opening Entry', description: 'Can modify unapproved opening balance lines' },
          { key: 'approve', label: 'Confirm Opening Stock', description: 'Can permanently lock and post opening balances', isApprovalAction: true },
        ],
      },
      {
        id: 'stock-upload-opening',
        name: 'Upload Opening Stock (Excel)',
        category: 'Stock & Indent',
        description: 'Bulk opening balance import via formatted Excel spreadsheets.',
        actions: [
          { key: 'view', label: 'View Upload Page', description: 'Can access opening stock upload screen' },
          { key: 'upload_excel', label: 'Upload Excel Sheet', description: 'Can parse and validate Excel opening inventory files' },
          { key: 'approve', label: 'Commit Uploaded Stock', description: 'Can commit bulk opening stock into live database', isApprovalAction: true },
        ],
      },
      {
        id: 'stock-upload-primary',
        name: 'Upload Primary Stock (Excel)',
        category: 'Stock & Indent',
        description: 'Bulk primary warehouse stock dispatch upload from factory.',
        actions: [
          { key: 'view', label: 'View Primary Upload', description: 'Can access primary stock upload utility' },
          { key: 'upload_excel', label: 'Upload Primary File', description: 'Can upload primary shipment batches' },
          { key: 'approve', label: 'Commit Primary Stock', description: 'Can approve and commit primary stock intake', isApprovalAction: true },
        ],
      },
      {
        id: 'stock-issued',
        name: 'Stock Issued Register',
        category: 'Stock & Indent',
        description: 'Complete audit trail of all warehouse dispatch and outward stock issues.',
        actions: [
          { key: 'view', label: 'View Issued Register', description: 'Can view stock issue history and dispatch manifests' },
          { key: 'export', label: 'Export Issued Register', description: 'Can download stock outward audit reports' },
        ],
      },
      {
        id: 'stock-received',
        name: 'Stock Received Register',
        category: 'Stock & Indent',
        description: 'Complete audit trail of all warehouse inward receipts and transfers.',
        actions: [
          { key: 'view', label: 'View Received Register', description: 'Can view stock inward history and receipts' },
          { key: 'export', label: 'Export Received Register', description: 'Can download stock inward audit reports' },
        ],
      },
      {
        id: 'stock-primary-return',
        name: 'Primary Sales Returns',
        category: 'Stock & Indent',
        description: 'Distributor and customer product returns into central warehouse.',
        actions: [
          { key: 'view', label: 'View Primary Returns', description: 'Can view sales return claims and gate passes' },
          { key: 'create', label: 'Create Return Entry', description: 'Can record new product return from customer' },
          { key: 'approve', label: 'Approve Return to Stock', description: 'Can accept returned goods into salable inventory', isApprovalAction: true },
          { key: 'reject', label: 'Reject Return Claim', description: 'Can reject invalid return claims', isDestructive: true },
        ],
      },
      {
        id: 'stock-damage-return',
        name: 'Damage Goods Return & Scrap',
        category: 'Stock & Indent',
        description: 'Damaged battery packs, warranty defects, cell write-offs, and salvage.',
        actions: [
          { key: 'view', label: 'View Damaged Stock', description: 'Can view damaged inventory held in quarantine' },
          { key: 'create', label: 'Record Damaged Stock', description: 'Can transfer defective units to damage warehouse' },
          { key: 'approve', label: 'Approve Damage Claim', description: 'Can certify technical damage inspection', isApprovalAction: true },
          { key: 'scrap', label: 'Authorize Scrap / Write-Off', description: 'Can approve total asset write-off and salvage liquidation', isDestructive: true },
        ],
      },
      {
        id: 'stock-transfer',
        name: 'Inter-Warehouse Stock Transfer',
        category: 'Stock & Indent',
        description: 'Transit orders between Kushtia Factory, Dhaka Central, and Regional Hubs.',
        actions: [
          { key: 'view', label: 'View Stock Transfers', description: 'Can view inter-warehouse transfer requests and in-transit goods' },
          { key: 'create', label: 'Create Transfer Request', description: 'Can initiate transfer indent between warehouses' },
          { key: 'approve', label: 'Approve Transfer Dispatch', description: 'Can authorize dispatch from source warehouse', isApprovalAction: true },
          { key: 'receive', label: 'Acknowledge Receipt', description: 'Can confirm receipt and add units into destination warehouse stock' },
          { key: 'cancel', label: 'Cancel Transfer', description: 'Can cancel transfer order before dispatch', isDestructive: true },
        ],
      },
      {
        id: 'stock-adjustment',
        name: 'Physical Stock Adjustment',
        category: 'Stock & Indent',
        description: 'Physical count reconciliation, shrinkage write-down, and cycle count variance.',
        actions: [
          { key: 'view', label: 'View Stock Adjustments', description: 'Can view stock count discrepancy audit trails' },
          { key: 'create', label: 'Create Adjustment', description: 'Can log physical stock count adjustments' },
          { key: 'approve', label: 'Approve Adjustment', description: 'Can approve inventory write-up or write-down', isApprovalAction: true },
          { key: 'delete', label: 'Void Adjustment', description: 'Can cancel unapproved adjustment drafts', isDestructive: true },
        ],
      },
      {
        id: 'inventory-stock',
        name: 'Central Finished Goods Stock',
        category: 'Stock & Indent',
        description: 'Comprehensive company-wide finished battery stock across all warehouses.',
        actions: [
          { key: 'view', label: 'View Finished Stock', description: 'Can view live available battery quantities by model and warehouse' },
          { key: 'view_valuation', label: 'View Stock Value', description: 'Can see total commercial inventory asset value' },
          { key: 'export', label: 'Export FG Stock', description: 'Can download finished goods inventory reports' },
        ],
      },
      {
        id: 'warehouse',
        name: 'Multi-Warehouse Hubs',
        category: 'Stock & Indent',
        description: 'Regional distribution hubs, storage bin capacity, and manager assignments.',
        actions: [
          { key: 'view', label: 'View Warehouse Hubs', description: 'Can view regional hub details and stock capacities' },
          { key: 'create', label: 'Add Warehouse Hub', description: 'Can configure new physical distribution location' },
          { key: 'edit', label: 'Edit Hub Details', description: 'Can modify manager, contact, and storage zones' },
          { key: 'audit', label: 'Perform Stock Audit', description: 'Can initiate official stocktaking audit' },
        ],
      },
    ],
  },
  {
    id: 'sales-distribution',
    title: 'Sales, Commercial Orders & Distribution',
    description: 'Commercial sales orders, Sales Order Registry, corporate agreements, GPS tracking, and field orders.',
    pages: [
      {
        id: 'sales-orders',
        name: 'Sales Orders & Invoicing',
        category: 'Sales & Distribution',
        description: 'Order booking, credit check, challan printing, commercial VAT invoice generation.',
        actions: [
          { key: 'view', label: 'View Sales Orders', description: 'Can view sales order pipeline and invoice records' },
          { key: 'create', label: 'Create Sales Order', description: 'Can book new sales orders with items and discounts' },
          { key: 'edit', label: 'Edit Sales Order', description: 'Can modify order quantities, delivery address, and notes' },
          { key: 'approve', label: 'Approve Order', description: 'Can approve order credit and commercial terms', isApprovalAction: true },
          { key: 'reject', label: 'Reject Order', description: 'Can reject invalid orders', isDestructive: true },
          { key: 'dispatch_invoice', label: 'Dispatch & Invoice', description: 'Can generate official Challan and commercial tax invoice' },
          { key: 'cancel', label: 'Cancel Order', description: 'Can cancel sales orders', isDestructive: true },
          { key: 'export', label: 'Export Orders', description: 'Can export sales order and invoice reports' },
        ],
      },
      {
        id: 'sales-orders-registry',
        name: 'Sales Order Registry',
        category: 'Sales & Distribution',
        description: 'Central registry for order lifecycle: confirmation, rejection, DO generation, and execution.',
        actions: [
          { key: 'view', label: 'View Sales Orders', description: 'Can see the Sales Order Registry and all order records' },
          { key: 'create', label: 'Create Sales Order', description: 'Can create new sales orders from the registry' },
          { key: 'edit', label: 'Edit Sales Order', description: 'Can modify existing sales orders before confirmation' },
          { key: 'submit', label: 'Submit for Confirmation', description: 'Can submit drafted orders to Accounts/Management for approval' },
          { key: 'confirm', label: 'Confirm Sales Order', description: 'Can officially approve and confirm submitted sales orders', isApprovalAction: true },
          { key: 'reject', label: 'Reject Sales Order', description: 'Can reject submitted sales orders with rationale', isDestructive: true },
          { key: 'generate_do', label: 'Generate Delivery Order (DO)', description: 'Can issue official Delivery Orders for factory dispatch' },
          { key: 'cancel', label: 'Cancel Sales Order', description: 'Can cancel sales orders', isDestructive: true },
          { key: 'export', label: 'Export Registry', description: 'Can export sales order registry data to Excel or CSV' },
        ],
      },
      {
        id: 'crm-agreements',
        name: 'CRM Corporate Agreements',
        category: 'Sales & Distribution',
        description: 'Long-term corporate fleet battery supply contracts and agreed special rates.',
        actions: [
          { key: 'view', label: 'View Agreements', description: 'Can view corporate agreements and contract terms' },
          { key: 'create', label: 'Draft Agreement', description: 'Can draft new corporate supply contract' },
          { key: 'edit', label: 'Edit Agreement', description: 'Can modify contract duration, pricing, and volume tiers' },
          { key: 'approve', label: 'Approve Agreement', description: 'Can formally sign off on corporate discount terms', isApprovalAction: true },
          { key: 'terminate', label: 'Terminate Contract', description: 'Can terminate agreements prematurely', isDestructive: true },
          { key: 'export', label: 'Export Agreements', description: 'Can download agreement documents' },
        ],
      },
      {
        id: 'field-tracker',
        name: 'Salesman GPS Tracker',
        category: 'Sales & Distribution',
        description: 'Live GPS location of field officers, movement history, and shop visit logs.',
        actions: [
          { key: 'view', label: 'View Live GPS Tracker', description: 'Can see real-time location map and route history of sales force' },
          { key: 'export_trail', label: 'Export Movement Trail', description: 'Can export daily GPS trail and visit audit coordinates' },
        ],
      },
      {
        id: 'mobile-field',
        name: 'Mobile Field Force Portal',
        category: 'Sales & Distribution',
        description: 'Field officer mobile workflow: attendance, customer catalog, and spot order booking.',
        actions: [
          { key: 'view', label: 'Access Field Portal', description: 'Can access mobile field portal view' },
          { key: 'checkin', label: 'GPS Attendance Check-in', description: 'Can log daily morning/evening attendance check-ins' },
          { key: 'place_order', label: 'Book Field Orders', description: 'Can submit spot orders while visiting customer retail stores' },
          { key: 'record_collection', label: 'Collect Cash/Cheque', description: 'Can accept and record customer field payments' },
        ],
      },
      {
        id: 'tada',
        name: 'TA/DA Expense Management',
        category: 'Sales & Distribution',
        description: 'Travel Allowance & Daily Allowance conveyance bills for field officers.',
        actions: [
          { key: 'view', label: 'View TA/DA Bills', description: 'Can view submitted conveyance bills and status' },
          { key: 'create', label: 'Submit TA/DA Bill', description: 'Can file daily travel bills with attached tickets' },
          { key: 'edit', label: 'Edit TA/DA Bill', description: 'Can revise bill amounts and travel logs' },
          { key: 'approve', label: 'Approve Conveyance Bill', description: 'Can audit and approve field travel claims', isApprovalAction: true },
          { key: 'disburse', label: 'Disburse TA/DA Payment', description: 'Can release approved funds from cash or bank' },
          { key: 'reject', label: 'Reject Bill', description: 'Can reject fraudulent or unsupported bills', isDestructive: true },
        ],
      },
    ],
  },
  {
    id: 'accounts-finance',
    title: 'Accounts, Finance, Installments & HR',
    description: 'Cash and bank transactions, hire purchase installment plans, collections, SMS, and payroll.',
    pages: [
      {
        id: 'finance-cashbook',
        name: 'Cash & Bank Management',
        category: 'Accounts & Finance',
        description: 'Cashbooks, bank books, multi-account ledgers, debit/credit vouchers, and bank reconciliation.',
        actions: [
          { key: 'view', label: 'View Cash & Bank', description: 'Can see cashbooks, bank ledgers, and statement transactions' },
          { key: 'create_voucher', label: 'Create Transaction Voucher', description: 'Can post cash/bank receipt or payment vouchers' },
          { key: 'edit_voucher', label: 'Edit Voucher', description: 'Can modify draft vouchers prior to posting' },
          { key: 'approve_voucher', label: 'Approve Voucher', description: 'Can verify and approve financial transactions', isApprovalAction: true },
          { key: 'post_voucher', label: 'Post to General Ledger', description: 'Can commit approved transactions to General Ledger' },
          { key: 'view_bankbook', label: 'View Bankbook', description: 'Can view detailed commercial bank statements and balances' },
          { key: 'reconcile', label: 'Bank Reconciliation', description: 'Can reconcile bank accounts against monthly bank statements' },
          { key: 'export', label: 'Export Ledgers', description: 'Can export cashbook and ledger balance reports' },
        ],
      },
      {
        id: 'installment',
        name: 'Installment Management',
        category: 'Accounts & Finance',
        description: 'Hire purchase plans, repayment schedules, down payments, and early settlement rebate.',
        actions: [
          { key: 'view', label: 'View Installment Plans', description: 'Can view customer installment agreements and balances' },
          { key: 'create_plan', label: 'Create Installment Plan', description: 'Can originate new hire purchase loan contracts' },
          { key: 'edit_plan', label: 'Edit Installment Schedule', description: 'Can modify tenure, interest rate, and monthly installments' },
          { key: 'approve_plan', label: 'Approve Credit Facility', description: 'Can sanction and approve customer installment plans', isApprovalAction: true },
          { key: 'collect_payment', label: 'Collect Installment', description: 'Can receive monthly installment EMI payments' },
          { key: 'early_settlement', label: 'Process Early Settlement', description: 'Can approve early settlement discounts and close accounts' },
          { key: 'export', label: 'Export Installments', description: 'Can export installment schedules and ledger records' },
        ],
      },
      {
        id: 'collection',
        name: 'Collection Management',
        category: 'Accounts & Finance',
        description: 'Daily collection targets, overdue recovery, follow-up logs, and officer assignment.',
        actions: [
          { key: 'view', label: 'View Collections', description: 'Can view collection targets, aging, and recovery queues' },
          { key: 'assign_officer', label: 'Assign Recovery Officer', description: 'Can assign default customer accounts to collection officers' },
          { key: 'log_followup', label: 'Log Customer Follow-up', description: 'Can enter visit feedback notes, promise dates, and calls' },
          { key: 'reschedule', label: 'Reschedule Overdue Plan', description: 'Can restructure past-due installment repayment terms' },
          { key: 'export', label: 'Export Collections', description: 'Can export recovery performance reports' },
        ],
      },
      {
        id: 'sms',
        name: 'SMS & Notification Center',
        category: 'Accounts & Finance',
        description: 'Automated overdue SMS reminders, promotional bulk broadcasts, and delivery status.',
        actions: [
          { key: 'view', label: 'View SMS Gateway', description: 'Can view SMS logs, delivery reports, and gateway balance' },
          { key: 'create_template', label: 'Manage SMS Templates', description: 'Can create and edit SMS copy templates' },
          { key: 'send_bulk', label: 'Broadcast Bulk SMS', description: 'Can execute manual promotional SMS campaigns' },
          { key: 'configure_rules', label: 'Configure Auto Rules', description: 'Can configure automated SMS triggers for due and overdue bills' },
        ],
      },
      {
        id: 'installment-reports',
        name: 'Installment Reports & Analytics',
        category: 'Accounts & Finance',
        description: 'Receivables aging, overdue default rates, officer recovery efficiency, and revenue forecasting.',
        actions: [
          { key: 'view', label: 'View Installment Reports', description: 'Can access installment receivable and portfolio reports' },
          { key: 'export', label: 'Export Analytics', description: 'Can download executive portfolio aging reports' },
        ],
      },
      {
        id: 'payroll',
        name: 'Payroll & Human Resources',
        category: 'Accounts & Finance',
        description: 'Staff salaries, provident fund, mobile allowance, attendance deductions, and pay slips.',
        actions: [
          { key: 'view', label: 'View Payroll & Staff', description: 'Can view employee salary structures and monthly payroll sheets' },
          { key: 'create_payroll', label: 'Process Monthly Payroll', description: 'Can calculate monthly salary, bonuses, and tax deductions' },
          { key: 'approve_payroll', label: 'Approve Salary Sheet', description: 'Can approve monthly payroll disbursements', isApprovalAction: true },
          { key: 'disburse', label: 'Disburse Salary Payments', description: 'Can release bank transfer advice or cash salary payouts' },
          { key: 'edit_salary_structure', label: 'Edit Salary Structure', description: 'Can modify basic pay, house rent, and allowances' },
          { key: 'export', label: 'Export Pay Slips', description: 'Can print and export monthly pay slips and bank transfer lists' },
        ],
      },
      {
        id: 'overtime-management',
        name: 'Overtime Management Hub',
        category: 'Accounts & Finance',
        description: 'Overtime requests, biometric/manual OT attendance, production batch allocation, 4-step approvals, and payroll & costing sync.',
        actions: [
          { key: 'view', label: 'View Overtime Hub', description: 'Can view overtime dashboard, KPIs, and requests list' },
          { key: 'create_request', label: 'Create Overtime Request', description: 'Can submit new overtime requisitions for employees' },
          { key: 'edit_request', label: 'Edit Overtime Request', description: 'Can modify planned hours and purpose for draft/pending requests' },
          { key: 'record_attendance', label: 'Record OT Attendance', description: 'Can log overtime check-in and check-out attendance punches' },
          { key: 'verify_attendance', label: 'Verify OT Attendance', description: 'Can verify actual hours and confirm timekeeper records', isApprovalAction: true },
          { key: 'approve_supervisor', label: 'Supervisor Approval', description: 'Can grant Step 1 Supervisor sign-off', isApprovalAction: true },
          { key: 'approve_production', label: 'Production Manager Approval', description: 'Can grant Step 2 Production Manager sign-off', isApprovalAction: true },
          { key: 'verify_hr_accounts', label: 'HR / Accounts Verification', description: 'Can audit wage calculation and verify policy rates', isApprovalAction: true },
          { key: 'approve_final', label: 'Final Executive Approval', description: 'Can execute final approval locking OT for payroll and costing', isApprovalAction: true },
          { key: 'allocate_batch', label: 'Allocate to Production Batches', description: 'Can allocate direct overtime hours and costs across manufacturing batches' },
          { key: 'view_cost', label: 'View Overtime Financials', description: 'Can inspect calculated hourly rates, wage multipliers, and BDT totals' },
          { key: 'configure_policy', label: 'Configure OT Policies', description: 'Can configure wage bases, standard monthly hours, and overtime multipliers' },
          { key: 'export', label: 'Export Overtime Reports', description: 'Can export monthly overtime and costing reports to Excel' },
        ],
      },
      {
        id: 'reports',
        name: 'Management Reports & P&L',
        category: 'Accounts & Finance',
        description: 'Profit and loss statements, balance sheets, sales analytics, and audit logs.',
        actions: [
          { key: 'view', label: 'View Management Reports', description: 'Can view company financial reports, trial balance, and audit logs' },
          { key: 'export', label: 'Export Financial Reports', description: 'Can export audited financial statements' },
        ],
      },
    ],
  },
  {
    id: 'user-warranty',
    title: 'Warranty Service & Security Management',
    description: 'After-sales RMA battery service, repair cost estimation, QC pass, and staff permissions.',
    pages: [
      {
        id: 'warranty',
        name: 'Warranty & RMA Service Center',
        category: 'User & Warranty',
        description: 'Battery RMA intake, serial verification, cell testing, parts replacement, QC, and dispatch.',
        actions: [
          { key: 'view', label: 'View Warranty Service', description: 'Can view active RMA job cards, complaints, and service history' },
          { key: 'create_ticket', label: 'Create RMA Job Card', description: 'Can receive defective battery from customer and open service ticket' },
          { key: 'verify', label: 'Verify Warranty Validity', description: 'Can verify battery serial number, invoice date, and warranty status' },
          { key: 'inspect', label: 'Technical Inspection', description: 'Can record cell voltage balance, IR test, and BMS diagnosis' },
          { key: 'replace_parts', label: 'Spare Parts Replacement', description: 'Can record spare cells and BMS consumption from service inventory' },
          { key: 'estimate', label: 'Generate Cost Estimate', description: 'Can generate customer repair estimate for out-of-warranty batteries' },
          { key: 'bill_collect', label: 'Bill & Collect Payment', description: 'Can receive customer repair service payment' },
          { key: 'qc_pass', label: 'Quality Control (QC) Sign-off', description: 'Can perform final cycle test and certify battery safety', isApprovalAction: true },
          { key: 'dispatch', label: 'Dispatch Serviced Battery', description: 'Can release and dispatch battery back to customer or branch' },
          { key: 'export', label: 'Export Service Logs', description: 'Can export warranty and repair reports' },
        ],
      },
      {
        id: 'users-permissions',
        name: 'Users & Permissions Control',
        category: 'User & Warranty',
        description: 'Staff accounts, role assignments, passwords, and page-wise action security clearances.',
        actions: [
          { key: 'view', label: 'View Staff Directory', description: 'Can browse employee profiles and system roles' },
          { key: 'create_user', label: 'Create Staff Account', description: 'Can create new employee and sales representative logins' },
          { key: 'edit_user', label: 'Edit Staff Profile', description: 'Can update employee designation, department, and contact info' },
          { key: 'edit_password', label: 'Reset User Password', description: 'Can change or reset employee login passwords' },
          { key: 'manage_permissions', label: 'Configure Page Permissions', description: 'Can grant or revoke page-wise action clearances for any user', isApprovalAction: true },
          { key: 'delete_user', label: 'Deactivate / Remove User', description: 'Can deactivate or remove staff accounts', isDestructive: true },
        ],
      },
    ],
  },
];

// Helper: Extract flat list of all page definitions
export const ALL_ERP_PAGES: ERPPageDef[] = ERP_PAGE_PERMISSIONS_REGISTRY.flatMap((cat) => cat.pages);

// Predefined Quick Permission Templates
export const PERMISSION_TEMPLATES: PermissionTemplate[] = [
  {
    id: 'template-superadmin',
    name: 'Full Administrator',
    roleTarget: 'Super Admin',
    description: 'Unrestricted access to view, create, edit, approve, and delete across every ERP page and module.',
    permissions: (() => {
      const map: UserPagePermissionsMap = {};
      ALL_ERP_PAGES.forEach((page) => {
        map[page.id] = {};
        page.actions.forEach((act) => {
          map[page.id][act.key] = true;
        });
      });
      return map;
    })(),
  },
  {
    id: 'template-accounts-mgr',
    name: 'Accounts & Finance Manager',
    roleTarget: 'Accounts Manager',
    description: 'Full control over Cashbook, Installments, Collections, SMS, Payroll, Costing, and Reports; View on Sales & Inventory.',
    permissions: (() => {
      const map: UserPagePermissionsMap = {};
      ALL_ERP_PAGES.forEach((page) => {
        map[page.id] = {};
        const isFin = [
          'dashboard',
          'finance-cashbook',
          'installment',
          'collection',
          'sms',
          'installment-reports',
          'payroll',
          'overtime-management',
          'reports',
          'manufacturing-costing',
          'basic-data-banks',
        ].includes(page.id);

        const isViewOnly = [
          'sales-orders',
          'sales-orders-registry',
          'inventory-stock',
          'raw-material-inventory',
          'raw-material-receive',
          'procurement',
          'basic-data-customers',
          'basic-data-distributors',
        ].includes(page.id);

        page.actions.forEach((act) => {
          if (isFin) {
            map[page.id][act.key] = true;
          } else if (page.id === 'raw-material-inventory') {
            if (['view', 'view_raw_material_stock_value', 'view_raw_material_purchase_rate', 'view_batch_stock_value', 'export'].includes(act.key)) {
              map[page.id][act.key] = true;
            } else {
              map[page.id][act.key] = false;
            }
          } else if (isViewOnly && act.key === 'view') {
            map[page.id][act.key] = true;
          } else {
            map[page.id][act.key] = false;
          }
        });
      });
      return map;
    })(),
  },
  {
    id: 'template-sales-mgr',
    name: 'Sales & Commercial Manager',
    roleTarget: 'Sales Manager',
    description: 'Full authority over Sales Orders, Registry confirmation & DO, CRM Agreements, Field Force, and Customer accounts.',
    permissions: (() => {
      const map: UserPagePermissionsMap = {};
      ALL_ERP_PAGES.forEach((page) => {
        map[page.id] = {};
        const isSales = [
          'dashboard',
          'sales-orders',
          'sales-orders-registry',
          'crm-agreements',
          'field-tracker',
          'mobile-field',
          'tada',
          'basic-data-customers',
          'basic-data-distributors',
          'basic-data-pricing-matrix',
          'basic-data-field-force',
          'basic-data-offers',
          'basic-data-products',
        ].includes(page.id);

        const isViewStock = ['inventory-stock', 'warehouse'].includes(page.id);

        page.actions.forEach((act) => {
          if (isSales) {
            map[page.id][act.key] = true;
          } else if (isViewStock && act.key === 'view') {
            map[page.id][act.key] = true;
          } else {
            map[page.id][act.key] = false;
          }
        });
      });
      return map;
    })(),
  },
  {
    id: 'template-inventory-officer',
    name: 'Warehouse & Inventory Officer',
    roleTarget: 'Warehouse Manager',
    description: 'Full authority on Raw Materials, Stock Transfers, Adjustments, MRR receiving, and Finished Goods storage.',
    permissions: (() => {
      const map: UserPagePermissionsMap = {};
      ALL_ERP_PAGES.forEach((page) => {
        map[page.id] = {};
        const isInventory = [
          'dashboard',
          'raw-material-receive',
          'raw-material-inventory',
          'stock-cid-receive',
          'stock-create-opening',
          'stock-upload-opening',
          'stock-upload-primary',
          'stock-issued',
          'stock-received',
          'stock-primary-return',
          'stock-damage-return',
          'stock-transfer',
          'stock-adjustment',
          'inventory-stock',
          'warehouse',
          'basic-data-raw-materials',
          'basic-data-warehouses',
          'basic-data-uom',
        ].includes(page.id);

        const isViewBOM = ['manufacturing', 'basic-data-products'].includes(page.id);

        page.actions.forEach((act) => {
          if (isInventory) {
            // Warehouse Manager must NOT see purchase rates or stock values by default
            if (page.id === 'raw-material-inventory' && ['view_raw_material_stock_value', 'view_raw_material_purchase_rate', 'view_batch_stock_value'].includes(act.key)) {
              map[page.id][act.key] = false;
            } else {
              map[page.id][act.key] = true;
            }
          } else if (isViewBOM && act.key === 'view') {
            map[page.id][act.key] = true;
          } else {
            map[page.id][act.key] = false;
          }
        });
      });
      return map;
    })(),
  },
  {
    id: 'template-factory-head',
    name: 'Factory Plant & Production Head',
    roleTarget: 'Factory Head',
    description: 'Authority over Factory & BOM, Batch launches, FIFO material issues, FG receipt, Cost allocation, and Consignments.',
    permissions: (() => {
      const map: UserPagePermissionsMap = {};
      ALL_ERP_PAGES.forEach((page) => {
        map[page.id] = {};
        const isFactory = [
          'dashboard',
          'manufacturing',
          'manufacturing-costing',
          'overtime-management',
          'raw-material-inventory',
          'raw-material-receive',
          'procurement',
          'basic-data-raw-materials',
          'basic-data-products',
          'basic-data-uom',
        ].includes(page.id);

        page.actions.forEach((act) => {
          if (isFactory) {
            // Factory Users must NOT be able to see purchase rates or stock values
            if (page.id === 'raw-material-inventory' && ['view_raw_material_stock_value', 'view_raw_material_purchase_rate', 'view_batch_stock_value'].includes(act.key)) {
              map[page.id][act.key] = false;
            } else {
              map[page.id][act.key] = true;
            }
          } else {
            map[page.id][act.key] = false;
          }
        });
      });
      return map;
    })(),
  },
  {
    id: 'template-warranty-mgr',
    name: 'Warranty & Service Center Lead',
    roleTarget: 'Service Manager',
    description: 'Complete control over Battery RMA intake, inspection, parts replacement, QC pass, and battery delivery.',
    permissions: (() => {
      const map: UserPagePermissionsMap = {};
      ALL_ERP_PAGES.forEach((page) => {
        map[page.id] = {};
        const isWarranty = ['warranty', 'dashboard'].includes(page.id);
        const isViewProduct = ['basic-data-products', 'basic-data-customers'].includes(page.id);

        page.actions.forEach((act) => {
          if (isWarranty) {
            map[page.id][act.key] = true;
          } else if (isViewProduct && act.key === 'view') {
            map[page.id][act.key] = true;
          } else {
            map[page.id][act.key] = false;
          }
        });
      });
      return map;
    })(),
  },
  {
    id: 'template-auditor',
    name: 'Internal Auditor / Read-Only',
    roleTarget: 'Auditor',
    description: 'Read-only viewing privileges across all pages, reports, and financial archives. Cannot create, edit, approve, or delete.',
    permissions: (() => {
      const map: UserPagePermissionsMap = {};
      ALL_ERP_PAGES.forEach((page) => {
        map[page.id] = {};
        page.actions.forEach((act) => {
          if (act.key === 'view' || act.key === 'view_raw_material_stock_value' || act.key === 'view_raw_material_purchase_rate' || act.key === 'view_batch_stock_value' || act.key === 'view_valuation' || act.key === 'view_revenue' || act.key === 'export') {
            map[page.id][act.key] = true;
          } else {
            map[page.id][act.key] = false;
          }
        });
      });
      return map;
    })(),
  },
];

/**
 * Checks if a user has permission to perform a specific action on a page.
 * Returns true if:
 * 1. User is Super Admin (bypass all)
 * 2. User has explicit true for [pageId][actionKey]
 * 3. Fallback: If pagePermissions not set, fallback gracefully to legacy allowedModules / role default
 */
export function hasPageAction(
  user: any,
  pageId: string,
  actionKey: string = 'view'
): boolean {
  if (!user) return false;
  if (user.role === 'Super Admin') return true;

  const pagePerms = user.permissions?.pagePermissions as UserPagePermissionsMap | undefined;
  if (pagePerms && typeof pagePerms === 'object') {
    const pageObj = pagePerms[pageId];
    if (pageObj && typeof pageObj === 'object') {
      if (pageObj[actionKey] !== undefined) {
        return Boolean(pageObj[actionKey]);
      }
    }
    // Backward compatibility & factory protection for raw material values
    if (pageId === 'raw-material-inventory' && ['view_raw_material_stock_value', 'view_raw_material_purchase_rate', 'view_batch_stock_value'].includes(actionKey)) {
      const isFactory = user.role === 'Factory Manager' || user.role === 'Warehouse Manager' || (user.department && user.department.toLowerCase().includes('factory'));
      if (isFactory) {
        return false; // Factory users must NOT be able to view purchase rates or stock values
      }
      if (pageObj && pageObj['view_valuation'] !== undefined) {
        return Boolean(pageObj['view_valuation']);
      }
      return false;
    }
    // If checking 'view' for a parent group module, check if any child page has view=true
    if (actionKey === 'view') {
      if (pageId === 'basic-data' && Object.keys(pagePerms).some((k) => k.startsWith('basic-data-') && pagePerms[k]?.view)) return true;
      if (pageId === 'stock' && Object.keys(pagePerms).some((k) => k.startsWith('stock-') && pagePerms[k]?.view)) return true;
      if (pageId === 'installment' && Object.keys(pagePerms).some((k) => (k.startsWith('installment-') || k.startsWith('report-installment')) && pagePerms[k]?.view)) return true;
      if (pageId === 'collection' && Object.keys(pagePerms).some((k) => k.startsWith('collection-') && pagePerms[k]?.view)) return true;
      if (pageId === 'sms' && Object.keys(pagePerms).some((k) => k.startsWith('sms-') && pagePerms[k]?.view)) return true;
      if (pageId === 'warranty' && Object.keys(pagePerms).some((k) => k.startsWith('warranty-') && pagePerms[k]?.view)) return true;
    }
  }

  // Fallback: If action is 'view', check if module is in allowedModules
  const allowed = user.permissions?.allowedModules || [];
  if (actionKey === 'view') {
    // If exact page ID or parent module prefix is in allowedModules
    const hasMod =
      allowed.includes(pageId) ||
      (pageId.startsWith('basic-data-') && allowed.includes('basic-data')) ||
      (pageId.startsWith('stock-') && allowed.includes('stock')) ||
      (pageId.startsWith('installment-') && allowed.includes('installment')) ||
      (pageId.startsWith('collection-') && allowed.includes('collection')) ||
      (pageId.startsWith('sms-') && allowed.includes('sms')) ||
      (pageId.startsWith('warranty-') && allowed.includes('warranty')) ||
      (pageId === 'basic-data' && allowed.some((p: string) => p.startsWith('basic-data-'))) ||
      (pageId === 'stock' && allowed.some((p: string) => p.startsWith('stock-'))) ||
      (pageId === 'installment' && allowed.some((p: string) => p.startsWith('installment-'))) ||
      (pageId === 'collection' && allowed.some((p: string) => p.startsWith('collection-'))) ||
      (pageId === 'sms' && allowed.some((p: string) => p.startsWith('sms-'))) ||
      (pageId === 'warranty' && allowed.some((p: string) => p.startsWith('warranty-')));

    return hasMod;
  }

  // Default to false for modifications if not explicitly granted
  return false;
}

/**
 * Checks if user is permitted to open/view a specific page
 */
export function hasPageAccess(user: any, pageId: string): boolean {
  return hasPageAction(user, pageId, 'view');
}

/**
 * Validates self-approval constraint:
 * Users cannot approve their own transactions unless they are Super Admin
 * or explicitly authorized with 'approve_own'.
 */
export function canApproveTransaction(
  user: any,
  pageId: string,
  creatorIdentifier?: string
): { allowed: boolean; reason?: string } {
  if (!user) return { allowed: false, reason: 'Not authenticated' };
  if (user.role === 'Super Admin') return { allowed: true };

  const hasApprove = hasPageAction(user, pageId, 'approve') || hasPageAction(user, pageId, 'confirm');
  if (!hasApprove) {
    return { allowed: false, reason: 'You do not have approval permissions for this page.' };
  }

  if (creatorIdentifier) {
    const isSelf =
      creatorIdentifier === user.id ||
      creatorIdentifier === user.userId ||
      (user.email && creatorIdentifier.toLowerCase() === user.email.toLowerCase()) ||
      (user.name && creatorIdentifier.toLowerCase() === user.name.toLowerCase());

    if (isSelf) {
      const canApproveOwn = hasPageAction(user, pageId, 'approve_own');
      if (!canApproveOwn) {
        return {
          allowed: false,
          reason: 'Security Policy: You cannot approve your own transaction. Another authorized supervisor must confirm this record.',
        };
      }
    }
  }

  return { allowed: true };
}

/**
 * Calculate stats for a given user's permissions map
 */
export function countGrantedPermissions(pagePermissions?: UserPagePermissionsMap): {
  totalGranted: number;
  totalAvailable: number;
  pagesWithAccess: number;
  totalPages: number;
} {
  let totalGranted = 0;
  let totalAvailable = 0;
  let pagesWithAccess = 0;

  ALL_ERP_PAGES.forEach((page) => {
    let hasAccess = false;
    page.actions.forEach((act) => {
      totalAvailable++;
      if (pagePermissions?.[page.id]?.[act.key]) {
        totalGranted++;
        hasAccess = true;
      }
    });
    if (hasAccess) pagesWithAccess++;
  });

  return {
    totalGranted,
    totalAvailable,
    pagesWithAccess,
    totalPages: ALL_ERP_PAGES.length,
  };
}

/**
 * Permission check: Can user view Raw Material Stock Value column & valuation
 */
export function canViewRawMaterialStockValue(user: any): boolean {
  if (!user) return false;
  if (user.role === 'Super Admin') return true;
  return hasPageAction(user, 'raw-material-inventory', 'view_raw_material_stock_value');
}

/**
 * Permission check: Can user view Raw Material Purchase Rate column
 */
export function canViewRawMaterialPurchaseRate(user: any): boolean {
  if (!user) return false;
  if (user.role === 'Super Admin') return true;
  return hasPageAction(user, 'raw-material-inventory', 'view_raw_material_purchase_rate');
}

/**
 * Permission check: Can user view Batch-wise Stock Value column
 */
export function canViewBatchStockValue(user: any): boolean {
  if (!user) return false;
  if (user.role === 'Super Admin') return true;
  return hasPageAction(user, 'raw-material-inventory', 'view_batch_stock_value');
}
