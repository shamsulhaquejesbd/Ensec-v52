/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ensec ERP - Accounts & Finance Module
 * Centralized Cash & Bank Management.
 */

import React from 'react';
import { CashBankModule } from './CashBankModule.tsx';

interface FinanceCashBookModuleProps {
  initialSubTab?: string;
  onNavigate?: (module: string) => void;
}

export const FinanceCashBookModule: React.FC<FinanceCashBookModuleProps> = () => {
  return <CashBankModule />;
};
