/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ensec ERP - Cash & Bank Initial Data & Defaults
 * Local test and sample data removed; clean zero-balance accounts and empty transaction ledgers.
 */

import {
  CashBankAccount,
  CashBankTransaction,
  ExpenseCategoryDef,
  ServiceIncomeCategoryDef,
  OpeningBalanceConfig,
} from '../types/cashBank.ts';

export const DEFAULT_CASH_BANK_ACCOUNTS: CashBankAccount[] = [
  {
    id: 'cash-main',
    type: 'Cash',
    name: 'Main Cash Account (Head Office)',
    currency: 'BDT',
    currentBalanceBDT: 0,
    openingBalanceBDT: 0,
    openingDate: '',
    status: 'Active',
    isDefault: true,
    remarks: 'Head Office Central Petty & Operating Cash Vault, Dhaka',
  },
  {
    id: 'cash-factory',
    type: 'Cash',
    name: 'Factory Cash Account (Kushtia Plant)',
    currency: 'BDT',
    currentBalanceBDT: 0,
    openingBalanceBDT: 0,
    openingDate: '',
    status: 'Active',
    remarks: 'Kushtia Manufacturing Plant Petty Cash Drawer',
  },
  {
    id: 'bank-ebl',
    type: 'Bank',
    name: 'Eastern Bank PLC (Current A/C)',
    bankName: 'Eastern Bank PLC',
    accountNumber: '1041070023418',
    branchName: 'Principal Branch, Dilkusha, Dhaka',
    routingNumber: '095270142',
    currency: 'BDT',
    currentBalanceBDT: 0,
    openingBalanceBDT: 0,
    openingDate: '',
    status: 'Active',
    isDefault: true,
    remarks: 'Primary Corporate Clearing Account for Distributor Collections & LC',
  },
  {
    id: 'bank-city',
    type: 'Bank',
    name: 'City Bank PLC (Operating A/C)',
    bankName: 'City Bank PLC',
    accountNumber: '1102938472001',
    branchName: 'Gulshan-2 Branch, Dhaka',
    routingNumber: '225261890',
    currency: 'BDT',
    currentBalanceBDT: 0,
    openingBalanceBDT: 0,
    openingDate: '',
    status: 'Active',
    remarks: 'Operational disbursements, factory vendor payouts, and payroll account',
  },
  {
    id: 'bank-dbbl',
    type: 'Bank',
    name: 'Dutch-Bangla Bank Ltd (Disbursement A/C)',
    bankName: 'Dutch-Bangla Bank Ltd',
    accountNumber: '1171050098234',
    branchName: 'Tejgaon I/A Branch, Dhaka',
    routingNumber: '090263311',
    currency: 'BDT',
    currentBalanceBDT: 0,
    openingBalanceBDT: 0,
    openingDate: '',
    status: 'Active',
    remarks: 'Secondary collection and field force TADA disbursement account',
  },
];

export const DEFAULT_EXPENSE_CATEGORIES: ExpenseCategoryDef[] = [
  { id: 'exp-cat-1', code: 'EXP-RENT', name: 'Office Rent', isSystem: true, description: 'Head Office and Regional Depot rental obligations' },
  { id: 'exp-cat-2', code: 'EXP-SAL', name: 'Salary', isSystem: true, description: 'Staff, engineering, and factory labor remuneration' },
  { id: 'exp-cat-3', code: 'EXP-ELEC', name: 'Electricity Bill', isSystem: true, description: 'Power grid and DESCO/NESCO/BREB utility expenses' },
  { id: 'exp-cat-4', code: 'EXP-TRANS', name: 'Transportation', isSystem: true, description: 'Freight, inter-depot haulage, delivery courier, and fuel' },
  { id: 'exp-cat-5', code: 'EXP-FACT', name: 'Factory Expenses', isSystem: true, description: 'Kushtia assembly plant consumables, safety gear, and supplies' },
  { id: 'exp-cat-6', code: 'EXP-MAINT', name: 'Maintenance', isSystem: true, description: 'Equipment upkeep, tooling, machinery repair, and facility fixes' },
  { id: 'exp-cat-7', code: 'EXP-ADMIN', name: 'Administrative Expenses', isSystem: true, description: 'Stationery, office supplies, software, and pantry supplies' },
  { id: 'exp-cat-8', code: 'EXP-OTHER', name: 'Other Expenses', isSystem: true, description: 'Miscellaneous operational expenses' },
];

export const DEFAULT_SERVICE_INCOME_CATEGORIES: ServiceIncomeCategoryDef[] = [
  { id: 'inc-cat-1', code: 'INC-RECT', name: 'Battery Rectification', isSystem: true, description: 'Cell re-balancing, desulfation, and capacity reactivation services' },
  { id: 'inc-cat-2', code: 'INC-REP', name: 'Repair & Maintenance', isSystem: true, description: 'Physical pack repair, terminal welding, and enclosure fixes' },
  { id: 'inc-cat-3', code: 'INC-BMS', name: 'BMS Replacement Service', isSystem: true, description: 'Firmware flashing, smart BMS replacement, and telemetry configuration' },
  { id: 'inc-cat-4', code: 'INC-TEST', name: 'Capacity Testing & Diagnostics', isSystem: true, description: 'Automated 1C discharge bench testing and health certification' },
  { id: 'inc-cat-5', code: 'INC-AMC', name: 'Annual Maintenance Contract (AMC)', isSystem: true, description: 'Scheduled quarterly preventive inspection for corporate telecom towers' },
  { id: 'inc-cat-6', code: 'INC-OTHER', name: 'Other Service Income', isSystem: true, description: 'Miscellaneous engineering and diagnostic service charges' },
];

export const DEFAULT_OPENING_BALANCES: OpeningBalanceConfig[] = [];

export const INITIAL_CASH_BANK_TRANSACTIONS: CashBankTransaction[] = [];
