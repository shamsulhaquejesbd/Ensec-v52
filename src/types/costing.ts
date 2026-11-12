/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ensec ERP - Manufacturing Costing & Expense Management Types
 * Full manufacturing cost accounting model from Raw Material Receiving
 * to Finished Goods Inventory Cost Calculation.
 */

export type ExpenseMainCategory = 'Factory Expenses' | 'Other Business Expenses';

export type FactoryExpenseSubcategory =
  | 'Factory Rent'
  | 'Electricity Bill'
  | 'Generator Fuel'
  | 'Machine Maintenance'
  | 'Factory Labour'
  | 'Conversion Charge'
  | 'Assembly Labor Fee'
  | 'Production Supervisor Salary'
  | 'Quality Control Expenses'
  | 'Packaging Expenses'
  | 'Factory Utilities'
  | 'Other Production Expenses';

export type OtherBusinessExpenseSubcategory =
  | 'Warehouse Expenses'
  | 'Transportation Expenses'
  | 'Administrative Expenses'
  | 'Office Rent'
  | 'Marketing Expenses'
  | 'Sales Expenses'
  | 'Bank Charges'
  | 'Other General Expenses';

export type ExpenseSubcategory = FactoryExpenseSubcategory | OtherBusinessExpenseSubcategory;

export type ExpensePaymentMethod = 'Cash' | 'Bank' | 'Payable' | 'Cheque' | 'Online Transfer';

export type ExpenseApprovalStatus = 'Pending Approval' | 'Approved' | 'Posted' | 'Rejected';

export type ExpenseAllocationStatus = 'Unallocated' | 'Partially Allocated' | 'Fully Allocated' | 'Non-Production';

export type CostAllocationMethod =
  | 'Production Quantity Based'
  | 'Labour Hour Based'
  | 'Machine Hour Based'
  | 'Manual Allocation';

export interface ExpenseEntry {
  id: string;
  voucherNumber: string; // e.g. 'EXP-FAC-2026-001'
  expenseDate: string;
  mainCategory: ExpenseMainCategory;
  subcategory: ExpenseSubcategory;
  department: string; // e.g. 'Manufacturing & Assembly', 'Kushtia Factory', 'Administration'
  costCenter: string; // e.g. 'Kushtia Lithium Battery Plant', 'Cell Testing Lab'
  factoryWarehouse: string; // e.g. 'Kushtia Factory Plant', 'Dhaka Central Warehouse'
  productionBatchRef?: string; // Optional direct batch tagging (e.g. 'KUS-B2610-01')
  amount: number;
  paymentMethod: ExpensePaymentMethod;
  accountId?: string;
  accountName?: string;
  description: string;
  attachmentName?: string;
  approvalStatus: ExpenseApprovalStatus;
  allocationStatus: ExpenseAllocationStatus;
  allocatedAmount: number;
  remainingUnallocated: number;
  approvedBy?: string;
  approvedAt?: string;
  journalVoucherNo?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CostAllocationRecord {
  id: string;
  allocationDate: string;
  expenseId: string;
  expenseVoucherNo: string;
  expenseCategory: ExpenseMainCategory;
  expenseSubcategory: ExpenseSubcategory;
  totalExpenseAmount: number;
  allocationMethod: CostAllocationMethod;
  productionOrderId: string;
  productionBatchNumber: string;
  productName: string;
  productId: string;
  allocatedAmount: number;
  basisValue?: number; // e.g., 100 units, 40 labour hours, 25 machine hours
  totalBasisValue?: number;
  notes?: string;
  allocatedBy: string;
  createdAt: string;
}

export interface ProductionCostDetailedRecord {
  productionOrderId: string;
  orderNumber: string;
  batchNumber: string;
  productId: string;
  productName: string;
  productSku: string;
  factoryLocation: string;
  productionDate: string;
  plannedQty: number;
  actualProductionQty: number;
  goodFinishedQty: number;
  rejectedQty: number;
  status: 'In Production' | 'Completed' | 'Transferred' | 'Finalized';
  
  // 11 Core Cost Components
  rawMaterialCost: number;
  directLabourCost: number;
  directOvertimeCost: number;
  electricityAllocation: number;
  factoryRentAllocation: number;
  generatorFuel: number;
  machineMaintenance: number;
  packagingCost: number;
  otherProductionExpenses: number;
  totalManufacturingCost: number;
  actualUnitProductionCost: number;

  // Granular audit trails
  rawMaterialBatches: Array<{
    materialId: string;
    materialCode: string;
    materialName: string;
    batchNumber: string;
    batchBarcode: string;
    quantity: number;
    unitPurchaseRate: number;
    totalCostBDT: number;
  }>;
  allocations: Array<CostAllocationRecord>;
  costingMethod: 'FIFO' | 'WEIGHTED_AVERAGE';
  calculatedAt: string;
  
  // Double-entry accounting trail
  journalEntries: Array<{
    accountName: string;
    accountCode: string;
    debit: number;
    credit: number;
    description: string;
  }>;
}

export interface ManufacturingCostKPIs {
  totalFactoryExpenses: number;
  totalProductionOverhead: number;
  totalDirectProductionCost: number;
  totalManufacturingCost: number;
  totalProductionQuantity: number;
  averageUnitProductionCost: number;
  unallocatedFactoryExpenses: number;
  totalNonProductionExpenses: number;
}
