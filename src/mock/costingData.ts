/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ensec ERP - Initial Manufacturing Costing & Expense Management Data
 */

import { ExpenseEntry, CostAllocationRecord, FactoryExpenseSubcategory, OtherBusinessExpenseSubcategory } from '../types/costing.ts';

export const FACTORY_EXPENSE_SUBCATEGORIES: FactoryExpenseSubcategory[] = [
  'Factory Rent',
  'Electricity Bill',
  'Generator Fuel',
  'Machine Maintenance',
  'Factory Labour',
  'Conversion Charge',
  'Production Supervisor Salary',
  'Quality Control Expenses',
  'Packaging Expenses',
  'Factory Utilities',
  'Other Production Expenses',
];

export const OTHER_BUSINESS_EXPENSE_SUBCATEGORIES: OtherBusinessExpenseSubcategory[] = [
  'Warehouse Expenses',
  'Transportation Expenses',
  'Administrative Expenses',
  'Office Rent',
  'Marketing Expenses',
  'Sales Expenses',
  'Bank Charges',
  'Other General Expenses',
];

export const INITIAL_EXPENSE_ENTRIES: ExpenseEntry[] = [];

export const INITIAL_COST_ALLOCATIONS: CostAllocationRecord[] = [];


