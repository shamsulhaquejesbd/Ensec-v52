import {
  User,
  OrgNode,
  Supplier,
  RawMaterial,
  RawMaterialCategory,
  RawMaterialClassification,
  Product,
  ProductCategory,
  ProductBrand,
  CustomerCategory,
  Department,
  Bank,
  UnitOfMeasurement,
  ProductionOrder,
  ImportPurchaseOrder,
  OptimumStatementEntry,
  Warehouse,
  StockTransfer,
  StockLedgerEntry,
  CIDStockReceipt,
  CIDStockReceiptItem,
  OpeningStockRecord,
  StockIssueRecord,
  PrimaryReturnRecord,
  StockAdjustmentRecord,
  Distributor,
  Customer,
  CRMLeadAgreement,
  FieldForceRep,
  VisitLog,
  OfferPromotion,
  SalesOrder,
  Requisition,
  Payment,
  CashBookEntry,
  PayrollRecord,
  AuditLog,
  TADAEntry,
  getDefaultPermissionsForRole,
  InventoryBatch,
  RawMaterialReceipt,
  InventoryMovement,
  ProductionCostRecord,
  ProductionConsumption,
  BOMDefinition,
} from '../types/erp.ts';

export const INITIAL_USERS: User[] = [];

export const INITIAL_ORG_HIERARCHY: OrgNode = {
  id: '',
  name: '',
  type: 'Company',
  code: '',
  children: [],
  taggedDistributorIds: [],
  taggedCustomerIds: [],
  taggedFieldForceIds: [],
};

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    code: 'SUP-CATL',
    name: 'Contemporary Amperex Tech (CATL) Co. Ltd.',
    country: 'China (Ningde, Fujian)',
    contactPerson: 'Mr. David Zhang',
    phone: '+86 593 890 1234',
    email: 'export.cells@catl.com',
    materialsSupplied: ['LiFePO4 3.2V 105Ah Prismatic Cell', 'LiFePO4 3.2V 280Ah Cell'],
    rating: 4.9,
    balanceBDT: 3450000,
  },
  {
    id: 'sup-2',
    code: 'SUP-EVE',
    name: 'EVE Energy Power Co. Ltd.',
    country: 'China (Huizhou, Guangdong)',
    contactPerson: 'Ms. Lin Wei',
    phone: '+86 752 260 5678',
    email: 'global@evebattery.com',
    materialsSupplied: ['LiFePO4 3.2V 100Ah Cylindrical/Prismatic', '3.2V 50Ah EV Cell'],
    rating: 4.8,
    balanceBDT: 1820000,
  },
  {
    id: 'sup-3',
    code: 'SUP-DALY',
    name: 'Shenzhen Daly Electronics Co. Ltd.',
    country: 'China (Shenzhen, Guangdong)',
    contactPerson: 'Mr. Kevin Liu',
    phone: '+86 755 282 3456',
    email: 'sales@dalybms.com',
    materialsSupplied: ['Smart 16S 100A CAN/RS485 BMS', '4S 12V 150A Bluetooth BMS', '20S 60V EV BMS'],
    rating: 4.7,
    balanceBDT: 850000,
  },
  {
    id: 'sup-4',
    code: 'SUP-CASE',
    name: 'Dongguan Jintao Enclosure & Metal Stampings',
    country: 'China (Dongguan)',
    contactPerson: 'Mr. Zhao Peng',
    phone: '+86 769 822 7788',
    email: 'sales@jintaocase.com',
    materialsSupplied: ['19-inch 3U Telecom Server Rack Case', 'ABS Waterproof Solar Battery Casing', 'EV Metal Casing with Handle'],
    rating: 4.6,
    balanceBDT: 420000,
  },
];

export const INITIAL_RAW_MATERIAL_CATEGORIES: RawMaterialCategory[] = [
  { id: 'rmc-1', code: 'RMC-CELL', name: 'Lithium Battery Cell', description: 'LiFePO4 & NMC High Capacity Cells', status: 'Active', itemCount: 3, parentClassification: 'Active Components' },
  { id: 'rmc-2', code: 'RMC-BMS', name: 'Battery Management System (BMS)', description: 'Smart BMS with CAN, RS485 & Bluetooth', status: 'Active', itemCount: 2, parentClassification: 'Active Components' },
  { id: 'rmc-3', code: 'RMC-CASE', name: 'Enclosure & Casing', description: 'Telecom, Solar, and EV Metal Enclosures', status: 'Active', itemCount: 2, parentClassification: 'Mechanical Hardware' },
  { id: 'rmc-4', code: 'RMC-BUSBAR', name: 'Wire, Cable & Busbar', description: 'Pure Tinned Copper & Silicone Insulated Cables', status: 'Active', itemCount: 2, parentClassification: 'Electrical & Wiring' },
  { id: 'rmc-5', code: 'RMC-CONN', name: 'Connectors & Terminals', description: 'Anderson Powerpole, M8 Studs, Multi-pin Sockets', status: 'Active', itemCount: 1, parentClassification: 'Electrical & Wiring' },
];

export const INITIAL_RAW_MATERIAL_CLASSIFICATIONS: RawMaterialClassification[] = [
  { id: 'cls-1', code: 'CLS-ACT', name: 'Active Components', description: 'Core functional electrochemical & electronic modules', status: 'Active', colorTag: 'blue', categoryCount: 2 },
  { id: 'cls-2', code: 'CLS-MECH', name: 'Mechanical Hardware', description: 'Frames, casings, insulators, and structural stampings', status: 'Active', colorTag: 'emerald', categoryCount: 1 },
  { id: 'cls-3', code: 'CLS-ELEC', name: 'Electrical & Wiring', description: 'High current conduits, busbars, and terminals', status: 'Active', colorTag: 'amber', categoryCount: 2 },
];

export const INITIAL_RAW_MATERIALS: RawMaterial[] = [];

// Initial Purchase Batches with immutable purchase rates and unique barcodes
export const INITIAL_INVENTORY_BATCHES: InventoryBatch[] = [];

// Initial Goods Received Notes (GRN)
export const INITIAL_RAW_MATERIAL_RECEIPTS: RawMaterialReceipt[] = [];

// Initial Complete Inventory Movement History
export const INITIAL_INVENTORY_MOVEMENTS: InventoryMovement[] = [];

// Initial Production Orders with actual costing
export const INITIAL_PRODUCTION_COSTS: ProductionCostRecord[] = [];


// Initial Bill of Materials Definitions with Revision History
export const INITIAL_BOMS: BOMDefinition[] = [];

export const INITIAL_CATEGORIES: ProductCategory[] = [
  {
    id: '6',
    code: 'CAT-01',
    name: 'ENMAX',
    description: '60V & 72V traction battery packs for Bangladeshi electric three-wheelers and commercial light EVs.',
    status: 'Active',
    productCount: 1,
  },
  {
    id: '7',
    code: 'CAT-02',
    name: 'ENFLEX',
    description: 'ENFLEX',
    status: 'Active',
    productCount: 0,
  },
  {
    id: '8',
    code: 'CAT-03',
    name: 'ENPOWER',
    description: 'ENPOWER',
    status: 'Active',
    productCount: 1,
  },
  {
    id: '9',
    code: 'CAT-04',
    name: 'ENGRID',
    description: 'ENGRID',
    status: 'Active',
    productCount: 0,
  },
];

export const INITIAL_CUSTOMER_CATEGORIES: CustomerCategory[] = [];

export const INITIAL_BRANDS: ProductBrand[] = [];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_IMPORT_ORDERS: ImportPurchaseOrder[] = [];

export const INITIAL_PRODUCTION_ORDERS: ProductionOrder[] = [];

export const INITIAL_PRODUCTION_CONSUMPTIONS: ProductionConsumption[] = [];

export const INITIAL_OPTIMUM_STATEMENT: OptimumStatementEntry[] = [];

export const INITIAL_WAREHOUSES: Warehouse[] = [];

export const INITIAL_STOCK_TRANSFERS: StockTransfer[] = [];

// Clean baseline: no test or sample CID received records
export const INITIAL_CID_STOCK_RECEIPTS: CIDStockReceipt[] = [];

// Clean baseline: no test or sample opening stock records
export const INITIAL_OPENING_STOCK: OpeningStockRecord[] = [];

export const INITIAL_STOCK_ISSUES: StockIssueRecord[] = [];

export const INITIAL_PRIMARY_RETURNS: PrimaryReturnRecord[] = [];

export const INITIAL_STOCK_ADJUSTMENTS: StockAdjustmentRecord[] = [];

export const INITIAL_STOCK_LEDGER: StockLedgerEntry[] = [];

export const INITIAL_DEPARTMENTS: Department[] = [];

export const INITIAL_BANKS: Bank[] = [];

export const INITIAL_UOMS: UnitOfMeasurement[] = [];

export const INITIAL_DISTRIBUTORS: Distributor[] = [];

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_CRM_AGREEMENTS: CRMLeadAgreement[] = [];

export const INITIAL_FIELD_FORCE: FieldForceRep[] = [];

export const INITIAL_VISIT_LOGS: VisitLog[] = [
  {
    id: 'v-101',
    repId: 'ff-1',
    repName: 'Zubair Ahmed',
    customerId: 'cust-2',
    customerName: 'Rahman Solar & Inverter Engineering',
    date: '2026-10-07',
    time: '10:45 AM',
    isProductive: true,
    orderPlacedBDT: 184000,
    purpose: 'Regular Sales Visit',
    feedback: 'Ordered 4 units of ES-12200-MAX SolarPro lithium battery. Requested delivery by tomorrow.',
    latitude: 23.8041,
    longitude: 90.3667,
  },
  {
    id: 'v-102',
    repId: 'ff-1',
    repName: 'Zubair Ahmed',
    customerId: 'cust-3',
    customerName: 'Dhaka Green Auto Electric Rickshaw Workshop',
    date: '2026-10-07',
    time: '01:15 PM',
    isProductive: true,
    orderPlacedBDT: 116000,
    purpose: 'New Lead',
    feedback: 'Took order for 2 units EV-6050-SPEED 60V lithium packs. Client satisfied with quick swap capability.',
    latitude: 23.8759,
    longitude: 90.3795,
  },
  {
    id: 'v-103',
    repId: 'ff-2',
    repName: 'Mahmudul Hasan',
    customerId: 'cust-1',
    customerName: 'edotco Bangladesh Co. Ltd.',
    date: '2026-10-07',
    time: '11:30 AM',
    isProductive: false,
    purpose: 'Stock Verification',
    feedback: 'Audited telecom tower buffer battery status. Client preparing quarterly requisition.',
    latitude: 23.7925,
    longitude: 90.4078,
  },
];

export const INITIAL_OFFERS: OfferPromotion[] = [];

export const INITIAL_SALES_ORDERS: SalesOrder[] = [
  {
    id: 'so-2026-0030',
    orderNumber: 'SO-DHK-2026-0030',
    date: '2026-10-29',
    channel: 'Distributor Sales',
    customerId: 'cust-ret-1',
    customerName: 'SORNA COSMETIC AND CONFECTIONERY',
    contactPerson: 'Md. Shamim Sumon',
    deliveryAddressName: 'Md. Shamim Sumon',
    deliveryAddress: 'Shop 12, Kadamtoly Bazar, Bancharampur',
    deliveryMobile: '+8801819-445522',
    distributorId: 'dist-1',
    distributorName: 'Meghna Solar & Power',
    salespersonId: 'ff-1',
    salespersonName: 'Abu Jubair Khan',
    warehouseId: 'wh-1',
    warehouseName: 'Dhaka Central Hub 1',
    status: 'Submitted',
    subTotalBDT: 170000,
    discountBDT: 5000,
    taxVatBDT: 8250,
    vatRatePercent: 5,
    netAmountBDT: 173250,
    paidAmountBDT: 0,
    dueAmountBDT: 173250,
    paymentStatus: 'Unpaid',
    paymentMethod: 'Credit (Due)',
    doNumber: undefined,
    challanNumber: undefined,
    deliveryStatus: 'Pending Dispatch',
    notes: 'Order placed via Field Force App. Awaiting Accounts Check & Approve.',
    items: [
      {
        productId: 'fp-1',
        productName: 'Ensec LiFePO4 Inverter Battery 12V 100Ah',
        quantity: 2,
        unitPriceBDT: 32000,
        lineTotalBDT: 64000,
      },
      {
        productId: 'fp-2',
        productName: 'SolarPro 48V 100Ah Server Rack Battery',
        quantity: 1,
        unitPriceBDT: 106000,
        lineTotalBDT: 106000,
      },
    ],
  },
  {
    id: 'so-2026-0012',
    orderNumber: 'SO-DHK-2026-0012',
    date: '2026-10-27',
    channel: 'Direct Corporate Sales',
    customerId: 'cust-idf',
    customerName: 'Integrated Development Foundation (IDF)',
    contactPerson: 'Uzzal Hossain',
    deliveryAddressName: 'Uzzal Hossain',
    deliveryAddress: 'Tongi, Gazipur',
    deliveryMobile: '+8801327-113571',
    buyerBin: '002391029-0101',
    salespersonId: 'ff-1',
    salespersonName: 'Abu Jubair Khan',
    salespersonDesignation: 'Engineer (Production)',
    salespersonContact: '01894-803667',
    salespersonEmail: 'production.ensec@aman.group',
    warehouseId: 'wh-1',
    warehouseName: 'Kushtia Manufacturing Plant',
    status: 'Approved',
    subTotalBDT: 830000,
    discountBDT: 0,
    taxVatBDT: 0,
    netAmountBDT: 830000,
    paidAmountBDT: 830000,
    dueAmountBDT: 0,
    paymentStatus: 'Paid',
    paymentMethod: 'Bank Transfer (City Bank)',
    invoiceNumber: 'INV-2026-0088',
    invoiceNo: 'INV-2026-0088',
    billNumber: '20260012-88',
    doNumber: '012/2026-88',
    challanNumber: 'BD-ES-2026-12-88',
    poNumber: '04',
    deliveryStatus: 'Pending Dispatch',
    notes: 'Official Factory Handover: 4 Lithium Battery Packs with Chargers. Challan pre-generated.',
    items: [
      {
        productId: 'fp-1',
        productName: 'ENMAX 51.2V 170AH BATTERY WITH GPS/IOT 25AH CHARGER',
        quantity: 1,
        unitPriceBDT: 185000,
        lineTotalBDT: 185000,
        serialNumbers: ['17158202615'],
      },
      {
        productId: 'fp-2',
        productName: 'ENMAX 64V 175AH BATTERY WITH 25AH CHARGER',
        quantity: 3,
        unitPriceBDT: 215000,
        lineTotalBDT: 645000,
        serialNumbers: ['171772026316', '171772026321', '171772026319'],
      },
    ],
  },
  {
    id: 'so-2026-0015',
    orderNumber: 'SO-DHK-2026-0015',
    date: '2026-10-26',
    channel: 'Direct Corporate Sales',
    customerId: 'cust-1',
    customerName: 'Grameen Telecom Trust',
    contactPerson: 'Md. Tareq Rahman',
    deliveryAddressName: 'Md. Tareq Rahman',
    deliveryAddress: 'Mirpur-1, Dhaka-1216',
    deliveryMobile: '+8801711-889922',
    buyerBin: '001928374-0202',
    salespersonId: 'ff-2',
    salespersonName: 'Mahmudul Hasan',
    salespersonDesignation: 'Area Sales Manager',
    salespersonContact: '01712-345678',
    salespersonEmail: 'mahmudul.sales@ensec.com.bd',
    warehouseId: 'wh-1',
    warehouseName: 'Kushtia Manufacturing Plant',
    status: 'Dispatched & Invoiced',
    subTotalBDT: 480000,
    discountBDT: 15000,
    taxVatBDT: 0,
    netAmountBDT: 465000,
    paidAmountBDT: 200000,
    dueAmountBDT: 265000,
    paymentStatus: 'Partially Paid',
    paymentMethod: 'Cheque & Credit',
    invoiceNumber: 'INV-2026-0094',
    invoiceNo: 'INV-2026-0094',
    billNumber: '20260012-94',
    doNumber: '012/2026-94',
    challanNumber: 'BD-ES-2026-12-94',
    poNumber: 'PO-GT-2026-09',
    deliveryStatus: 'In Transit',
    notes: 'Dispatched from Factory. Transport engaged. Salesman to confirm customer handover.',
    items: [
      {
        productId: 'fp-1',
        productName: 'ENMAX 51.2V 170AH BATTERY WITH GPS/IOT 25AH CHARGER',
        quantity: 2,
        unitPriceBDT: 185000,
        lineTotalBDT: 370000,
        serialNumbers: ['17158202640', '17158202641'],
      },
      {
        productId: 'fp-3',
        productName: 'ENMAX 48V 100AH WALL MOUNT LITHIUM BATTERY',
        quantity: 1,
        unitPriceBDT: 110000,
        lineTotalBDT: 110000,
        serialNumbers: ['17199202605'],
      },
    ],
  },
  {
    id: 'so-2026-0008',
    orderNumber: 'SO-CTG-2026-0008',
    date: '2026-10-24',
    channel: 'Enterprise Client',
    customerId: 'cust-2',
    customerName: 'Summit Communications Ltd.',
    contactPerson: 'Engr. Shafiqul Islam',
    deliveryAddressName: 'Engr. Shafiqul Islam',
    deliveryAddress: 'Agrabad C/A, Chattogram',
    deliveryMobile: '+8801819-234567',
    buyerBin: '003456789-0303',
    salespersonId: 'ff-1',
    salespersonName: 'Abu Jubair Khan',
    salespersonDesignation: 'Engineer (Production)',
    salespersonContact: '01894-803667',
    salespersonEmail: 'production.ensec@aman.group',
    warehouseId: 'wh-1',
    warehouseName: 'Kushtia Manufacturing Plant',
    status: 'Delivered',
    subTotalBDT: 720000,
    discountBDT: 20000,
    taxVatBDT: 0,
    netAmountBDT: 700000,
    paidAmountBDT: 700000,
    dueAmountBDT: 0,
    paymentStatus: 'Paid',
    paymentMethod: 'Bank Transfer (EBL)',
    invoiceNumber: 'INV-2026-0072',
    invoiceNo: 'INV-2026-0072',
    billNumber: '20260012-72',
    doNumber: '012/2026-72',
    challanNumber: 'BD-ES-2026-12-72',
    poNumber: 'PO-SCL-441',
    deliveryStatus: 'Received by Customer',
    receivedByCustomer: true,
    customerReceivedAt: '2026-10-25T14:30',
    customerReceiverName: 'Engr. Shafiqul Islam',
    customerReceiverPhone: '+8801819-234567',
    customerReceiverNotes: 'Full shipment received at Chattogram hub. Voltage and BMS telemetry verified.',
    customerReceiptSignature: 'Customer Seal & Signature Verified',
    deliveryHandoverBy: 'Abu Jubair Khan',
    notes: 'Completed delivery and handover.',
    items: [
      {
        productId: 'fp-2',
        productName: 'ENMAX 64V 175AH BATTERY WITH 25AH CHARGER',
        quantity: 3,
        unitPriceBDT: 215000,
        lineTotalBDT: 645000,
        serialNumbers: ['171772026110', '171772026111', '171772026112'],
      },
    ],
  },
];

export const INITIAL_CASH_BOOK: CashBookEntry[] = [];

export const INITIAL_PAYROLL: PayrollRecord[] = [
  {
    id: 'pay-2026-09-01',
    monthYear: '2026-09',
    employeeId: 'ff-1',
    employeeName: 'Zubair Ahmed',
    designation: 'Territory Sales Officer (Dhaka North)',
    basicSalaryBDT: 32000,
    houseRentBDT: 16000,
    medicalAllowanceBDT: 3200,
    conveyanceAllowanceBDT: 6500,
    mobileAllowanceBDT: 1500,
    taDaBDT: 5000,
    targetBDT: 3500000,
    achievementBDT: 2980000,
    achievementPercent: 85.1,
    salesIncentiveBDT: 8500, // calculated from tier
    taxDeductionBDT: 2400,
    providentFundBDT: 3200,
    netPayableBDT: 67100,
    status: 'Paid',
    paymentDate: '2026-09-30',
  },
  {
    id: 'pay-2026-09-02',
    monthYear: '2026-09',
    employeeId: 'ff-2',
    employeeName: 'Mahmudul Hasan',
    designation: 'Territory Sales Officer (Uttara & Gazipur)',
    basicSalaryBDT: 30000,
    houseRentBDT: 15000,
    medicalAllowanceBDT: 3000,
    conveyanceAllowanceBDT: 6500,
    mobileAllowanceBDT: 1500,
    taDaBDT: 5000,
    targetBDT: 3200000,
    achievementBDT: 2650000,
    achievementPercent: 82.8,
    salesIncentiveBDT: 7200,
    taxDeductionBDT: 2100,
    providentFundBDT: 3000,
    netPayableBDT: 63100,
    status: 'Paid',
    paymentDate: '2026-09-30',
  },
  {
    id: 'pay-2026-09-03',
    monthYear: '2026-09',
    employeeId: 'ff-3',
    employeeName: 'Shakil Anwar',
    designation: 'Territory Sales Officer (Chittagong Port & Agrabad)',
    basicSalaryBDT: 34000,
    houseRentBDT: 17000,
    medicalAllowanceBDT: 3400,
    conveyanceAllowanceBDT: 7000,
    mobileAllowanceBDT: 1500,
    taDaBDT: 5500,
    targetBDT: 4000000,
    achievementBDT: 3450000,
    achievementPercent: 86.2,
    salesIncentiveBDT: 11000,
    taxDeductionBDT: 2800,
    providentFundBDT: 3400,
    netPayableBDT: 73200,
    status: 'Paid',
    paymentDate: '2026-09-30',
  },
  {
    id: 'pay-2026-10-01',
    monthYear: '2026-10',
    employeeId: 'ff-1',
    employeeName: 'Zubair Ahmed',
    designation: 'Territory Sales Officer (Dhaka North)',
    basicSalaryBDT: 32000,
    houseRentBDT: 16000,
    medicalAllowanceBDT: 3200,
    conveyanceAllowanceBDT: 6500,
    mobileAllowanceBDT: 1500,
    taDaBDT: 5000,
    targetBDT: 3500000,
    achievementBDT: 980000, // current week
    achievementPercent: 28.0,
    salesIncentiveBDT: 3200,
    taxDeductionBDT: 2400,
    providentFundBDT: 3200,
    netPayableBDT: 61800,
    status: 'Draft',
  },
];

export const INITIAL_REQUISITIONS: Requisition[] = [];

export const INITIAL_PAYMENTS: Payment[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-01',
    timestamp: '2026-10-07 09:15:22',
    userId: 'u-1',
    userName: 'Engr. Sohidul Islam',
    action: 'SYSTEM_BOOT',
    module: 'Core System',
    details: 'Ensec ERP & Distribution Engine initialized with 50:50 Optimum JV parameters.',
    ipAddress: '103.145.112.5',
  },
  {
    id: 'aud-02',
    timestamp: '2026-10-07 10:48:10',
    userId: 'u-6',
    userName: 'Zubair Ahmed',
    action: 'ORDER_SUBMITTED',
    module: 'Mobile Field Force',
    details: 'Sales Order SO-DHK-2026-061 submitted for Dhaka Green Auto Workshop (BDT 621,600).',
    ipAddress: '103.119.20.44 (Mobile 4G)',
  },
  {
    id: 'aud-03',
    timestamp: '2026-10-07 11:05:30',
    userId: 'u-2',
    userName: 'Tanvir Hossain',
    action: 'CREDIT_LIMIT_UPDATED',
    module: 'Distributor Management',
    details: 'Updated credit limit for Meghna Solar & Power from BDT 4,500,000 to BDT 5,000,000.',
    ipAddress: '103.145.112.18',
  },
];

export const INITIAL_TADA_LIST: TADAEntry[] = [];

