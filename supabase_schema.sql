-- ============================================================================
-- ENSEC ERP & DISTRIBUTION PLATFORM - COMPLETE SUPABASE DATABASE SCHEMA
-- Compatible with PostgreSQL 15+ / Supabase SQL Editor
-- Project: ykljdwdkgysnekiqqaby.supabase.co
-- Generated and audited for Ensec Lithium Batteries ERP & Distribution
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. USERS & PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id BIGSERIAL PRIMARY KEY,
  uid TEXT UNIQUE, -- Supabase Auth UID or Firebase Auth UID
  user_id TEXT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT DEFAULT 'ensec2026', -- Login & application password
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'Field Force', -- 'Super Admin' | 'Sales Head' | 'Regional Manager' | 'Area Sales Manager' | 'Field Force' | 'Warehouse Manager' | 'Factory Manager' | 'Accounts / Finance' | 'Auditor'
  designation TEXT,
  department TEXT DEFAULT 'Operations',
  region TEXT,
  area TEXT,
  territory TEXT,
  is_salesman BOOLEAN DEFAULT FALSE,
  salesman_code TEXT,
  sales_target_bdt NUMERIC(14, 2) DEFAULT 0.00,
  monthly_sales_target_bdt NUMERIC(14, 2) DEFAULT 0.00,
  status TEXT DEFAULT 'Active',
  avatar TEXT,
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all user columns exist if table was previously created without them
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password TEXT DEFAULT 'ensec2026';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS territory TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_salesman BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS salesman_code TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS sales_target_bdt NUMERIC(14, 2) DEFAULT 0.00;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS monthly_sales_target_bdt NUMERIC(14, 2) DEFAULT 0.00;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================================
-- 2. WAREHOUSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.warehouses (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  district TEXT DEFAULT 'Dhaka',
  incharge_name TEXT,
  incharge_phone TEXT,
  phone TEXT,
  email TEXT,
  manager_name TEXT,
  description TEXT,
  is_factory_plant BOOLEAN DEFAULT FALSE,
  type TEXT DEFAULT 'Central Hub',
  capacity_packs INT DEFAULT 5000,
  current_stock_packs INT DEFAULT 0,
  capacity_units INT DEFAULT 5000,
  current_stock_units INT DEFAULT 0,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safe Alter Table migration script for warehouses
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS manager_name TEXT;
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS is_factory_plant BOOLEAN DEFAULT FALSE;
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Central Hub';
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS capacity_packs INT DEFAULT 5000;
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS current_stock_packs INT DEFAULT 0;
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS capacity_units INT DEFAULT 5000;
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS current_stock_units INT DEFAULT 0;
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================================
-- 3. DISTRIBUTORS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.distributors (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  owner_name TEXT,
  proprietor_name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  district TEXT DEFAULT 'Dhaka',
  region TEXT DEFAULT 'Dhaka Division',
  area TEXT,
  territory TEXT DEFAULT 'Central Market',
  db_point TEXT,
  market_hierarchy TEXT,
  departments TEXT[] DEFAULT '{}',
  address TEXT,
  warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE SET NULL,
  credit_limit_bdt NUMERIC(12, 2) DEFAULT 500000.00,
  current_balance_bdt NUMERIC(12, 2) DEFAULT 0.00,
  current_outstanding_bdt NUMERIC(12, 2) DEFAULT 0.00,
  opening_balance_bdt NUMERIC(12, 2) DEFAULT 0.00,
  payment_terms_days INT DEFAULT 30,
  assigned_salesperson_id TEXT,
  assigned_salesperson_name TEXT,
  assigned_rep_id TEXT,
  assigned_rep_name TEXT,
  customer_category_id TEXT,
  customer_category_name TEXT,
  discontinue_date DATE,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Graceful column migrations for existing instances of distributors table
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS proprietor_name TEXT;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'Dhaka';
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS db_point TEXT;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS market_hierarchy TEXT;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS departments TEXT[] DEFAULT '{}';
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS current_outstanding_bdt NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS opening_balance_bdt NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS payment_terms_days INT DEFAULT 30;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS assigned_salesperson_id TEXT;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS assigned_salesperson_name TEXT;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS assigned_rep_id TEXT;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS assigned_rep_name TEXT;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS customer_category_id TEXT;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS customer_category_name TEXT;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS discontinue_date DATE;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_distributors_code ON public.distributors(code);
CREATE INDEX IF NOT EXISTS idx_distributors_status ON public.distributors(status);

-- ============================================================================
-- 4. CUSTOMERS & RETAILERS DIRECTORY
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  owner_name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  channel TEXT DEFAULT 'Distributor Sales', -- 'Distributor Sales' | 'Direct Sales'
  customer_type TEXT DEFAULT 'Retailer', -- 'Retailer' | 'Dealer' | 'Corporate Customer' | 'Workshop' | 'Project Customer'
  pricing_tier TEXT DEFAULT 'Dealer / Retailer Channel',
  assigned_distributor_id BIGINT REFERENCES public.distributors(id) ON DELETE SET NULL,
  assigned_distributor_name TEXT,
  assigned_salesperson_id TEXT,
  assigned_salesperson_name TEXT,
  assigned_rep_id TEXT,
  assigned_rep_name TEXT,
  customer_category_id TEXT,
  customer_category_name TEXT,
  district TEXT DEFAULT 'Dhaka',
  area TEXT,
  market TEXT,
  territory TEXT DEFAULT 'Mirpur',
  market_hierarchy TEXT,
  address TEXT,
  custom_product_prices_json JSONB DEFAULT '{}'::jsonb,
  communication_notes_json JSONB DEFAULT '[]'::jsonb,
  notes_json JSONB DEFAULT '[]'::jsonb,
  credit_limit_bdt NUMERIC(12, 2) DEFAULT 50000.00,
  outstanding_balance_bdt NUMERIC(12, 2) DEFAULT 0.00,
  status TEXT DEFAULT 'Active',
  gps_coordinates TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safe Alter Table migration script for customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS market TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS market_hierarchy TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS assigned_salesperson_id TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS assigned_salesperson_name TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS assigned_rep_id TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS assigned_rep_name TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS customer_category_id TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS customer_category_name TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS custom_product_prices_json JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS communication_notes_json JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS notes_json JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_customers_code ON public.customers(code);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);

-- ============================================================================
-- 5. FINISHED PRODUCTS TABLE (Lithium Battery Packs & SKUs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  brand TEXT DEFAULT 'Ensec Lithium BD',
  category TEXT DEFAULT 'Electric Vehicle (EV) Batteries',
  
  -- Electrical & Battery Ratings
  nominal_voltage NUMERIC(6, 2) DEFAULT 51.20,
  capacity_ah NUMERIC(6, 2) DEFAULT 86.00,
  energy_wh NUMERIC(10, 2) DEFAULT 4403.20,
  battery_type TEXT DEFAULT 'LiFePO4',
  chemistry TEXT DEFAULT 'Lifepo4',

  -- Detailed Engineering & Technical Specifications
  normal_voltage TEXT DEFAULT '51.2V',
  rated_capacity TEXT DEFAULT '51.2V86Ah',
  cycle_life TEXT DEFAULT '>4000',
  typical_capacity_kwh TEXT DEFAULT '4.40KWH',
  max_charge_current TEXT DEFAULT '50A',
  standard_charging TEXT DEFAULT 'CC/CV, 0.5C, 58.4V.',
  max_discharge_current TEXT DEFAULT '120A/150A/200A',
  weight_kg TEXT DEFAULT '40KG (±)2%',
  dimension_cm TEXT DEFAULT '50*36*26',
  operating_temperature TEXT DEFAULT '0-60°C',
  mileage_km TEXT DEFAULT '80-90KM with Full Charge.',

  -- 5-Channel Pricing Architecture (BDT)
  trade_price_bdt NUMERIC(12, 2) DEFAULT 0.00,
  distributor_price_bdt NUMERIC(12, 2) DEFAULT 85000.00,
  dealer_price_bdt NUMERIC(12, 2) DEFAULT 89000.00,
  corporate_price_bdt NUMERIC(12, 2) DEFAULT 92000.00,
  project_price_bdt NUMERIC(12, 2) DEFAULT 88000.00,
  retail_price_bdt NUMERIC(12, 2) DEFAULT 98000.00,
  mrp_bdt NUMERIC(12, 2) DEFAULT 98000.00,
  assembly_cost_estimate_bdt NUMERIC(12, 2) DEFAULT 4500.00,
  category_prices JSONB DEFAULT '{}'::jsonb,

  -- Commercial & Manufacturing Parameters
  warranty_months INT DEFAULT 36,
  stock_quantity INT DEFAULT 0,
  unit TEXT DEFAULT 'Units',
  bom JSONB DEFAULT '[]'::jsonb,
  image_url TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safe Alter Table migration script (adds missing specification columns to existing tables)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS battery_type TEXT DEFAULT 'LiFePO4';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS chemistry TEXT DEFAULT 'Lifepo4';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS normal_voltage TEXT DEFAULT '51.2V';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rated_capacity TEXT DEFAULT '51.2V86Ah';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cycle_life TEXT DEFAULT '>4000';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS typical_capacity_kwh TEXT DEFAULT '4.40KWH';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS max_charge_current TEXT DEFAULT '50A';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS standard_charging TEXT DEFAULT 'CC/CV, 0.5C, 58.4V.';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS max_discharge_current TEXT DEFAULT '120A/150A/200A';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight_kg TEXT DEFAULT '40KG (±)2%';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS dimension_cm TEXT DEFAULT '50*36*26';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS operating_temperature TEXT DEFAULT '0-60°C';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS mileage_km TEXT DEFAULT '80-90KM with Full Charge.';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS distributor_price_bdt NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS dealer_price_bdt NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS corporate_price_bdt NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS project_price_bdt NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS retail_price_bdt NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS assembly_cost_estimate_bdt NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_prices JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS customer_price_bdt NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS minimum_selling_price_bdt NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_cid INT DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_kushtia_plant INT DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_dhaka_hubs INT DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS pcs_per_carton INT DEFAULT 1;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS bom JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'Units';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================================
-- 5.1 RAW MATERIAL CLASSIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.raw_material_classifications (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- e.g. 'CLS-CELL', 'CLS-ELEC', 'CLS-MECH'
  name TEXT NOT NULL, -- 'Active Electrochemical Cells', 'Power Electronics & Control', etc.
  description TEXT,
  color_tag TEXT DEFAULT 'amber',
  status TEXT DEFAULT 'Active', -- 'Active' | 'Inactive'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. RAW MATERIAL CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.raw_material_categories (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- e.g. 'RMC-CELL', 'RMC-BMS', 'RMC-CASE'
  name TEXT NOT NULL, -- 'Cell', 'BMS', 'Casing', 'Wire & Busbar', 'Connector', 'PCB', 'Insulation & Pack'
  parent_classification TEXT, -- 'Active Electrochemical Cells', 'Power Electronics & Control', etc.
  description TEXT,
  status TEXT DEFAULT 'Active', -- 'Active' | 'Inactive'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. RAW MATERIALS TABLE (Kushtia Factory Inventory & SCM)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.raw_materials (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- e.g. 'RM-CELL-105', 'RM-BMS-48V'
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'Cell' | 'BMS' | 'Casing' | 'Connector' | 'Wire & Busbar' | 'PCB' | 'Insulation & Pack'
  category_id BIGINT REFERENCES public.raw_material_categories(id) ON DELETE SET NULL,
  unit TEXT NOT NULL DEFAULT 'Pieces', -- 'Pieces' | 'Units' | 'Sets' | 'Kits' | 'Sheets'
  stock_kushtia INT DEFAULT 0,
  reorder_level INT DEFAULT 0,
  last_purchase_unit_cost_bdt NUMERIC(12, 2) DEFAULT 0.00,
  standard_cost_bdt NUMERIC(12, 2) DEFAULT 0.00,
  type TEXT DEFAULT 'Local', -- 'Local' | 'Import'
  status TEXT DEFAULT 'Active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safe Alter Table migration script for raw_materials
ALTER TABLE public.raw_materials ADD COLUMN IF NOT EXISTS category_id BIGINT REFERENCES public.raw_material_categories(id) ON DELETE SET NULL;
ALTER TABLE public.raw_materials ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Local';

-- Auto-link category_id for existing raw materials if null
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'raw_material_categories') THEN
    UPDATE public.raw_materials rm
    SET category_id = rmc.id
    FROM public.raw_material_categories rmc
    WHERE rm.category_id IS NULL AND LOWER(TRIM(rm.category)) = LOWER(TRIM(rmc.name));
  END IF;
END $$;

-- ============================================================================
-- 8. SALES ORDERS TABLE (Captured via Mobile App or Portal)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sales_orders (
  id BIGSERIAL PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_id BIGINT REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  salesperson_id TEXT,
  salesperson_name TEXT NOT NULL,
  warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE SET NULL,
  warehouse_name TEXT,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  gross_amount_bdt NUMERIC(12, 2) DEFAULT 0.00,
  discount_amount_bdt NUMERIC(12, 2) DEFAULT 0.00,
  tax_vat_bdt NUMERIC(12, 2) DEFAULT 0.00,
  net_amount_bdt NUMERIC(12, 2) NOT NULL,
  paid_amount_bdt NUMERIC(12, 2) DEFAULT 0.00,
  due_amount_bdt NUMERIC(12, 2) DEFAULT 0.00,
  status TEXT DEFAULT 'Pending Delivery', -- 'Pending Delivery' | 'Delivered' | 'Partially Delivered' | 'Cancelled'
  items_json JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of items: [{ productId, productName, quantity, unitPriceBDT, lineTotal }]
  applied_offer_code TEXT,
  cancellation_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safe Alter Table migration script for sales orders workflow attributes
ALTER TABLE public.sales_orders ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'Distributor Sales';
ALTER TABLE public.sales_orders ADD COLUMN IF NOT EXISTS distributor_id BIGINT REFERENCES public.distributors(id) ON DELETE SET NULL;
ALTER TABLE public.sales_orders ADD COLUMN IF NOT EXISTS distributor_name TEXT;
ALTER TABLE public.sales_orders ADD COLUMN IF NOT EXISTS sub_total_bdt NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.sales_orders ADD COLUMN IF NOT EXISTS discount_bdt NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.sales_orders ADD COLUMN IF NOT EXISTS vat_rate_percent NUMERIC(5, 2) DEFAULT 0.00;
ALTER TABLE public.sales_orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Unpaid';
ALTER TABLE public.sales_orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Cash';
ALTER TABLE public.sales_orders ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE public.sales_orders ADD COLUMN IF NOT EXISTS invoice_no TEXT;
ALTER TABLE public.sales_orders ADD COLUMN IF NOT EXISTS do_number TEXT;
ALTER TABLE public.sales_orders ADD COLUMN IF NOT EXISTS do_generated_at TIMESTAMPTZ;
ALTER TABLE public.sales_orders ADD COLUMN IF NOT EXISTS do_accepted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.sales_orders ADD COLUMN IF NOT EXISTS do_accepted_by TEXT;
ALTER TABLE public.sales_orders ADD COLUMN IF NOT EXISTS challan_number TEXT;
ALTER TABLE public.sales_orders ADD COLUMN IF NOT EXISTS bill_number TEXT;
ALTER TABLE public.sales_orders ADD COLUMN IF NOT EXISTS po_number TEXT;
ALTER TABLE public.sales_orders ADD COLUMN IF NOT EXISTS delivery_status TEXT;
ALTER TABLE public.sales_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_sales_orders_number ON public.sales_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON public.sales_orders(status);

-- ============================================================================
-- 9. TADA CLAIMS TABLE (Field Travel & Daily Allowances)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tada_claims (
  id BIGSERIAL PRIMARY KEY,
  ff_code TEXT NOT NULL,
  ff_name TEXT NOT NULL,
  ff_id TEXT,
  rep_id TEXT,
  employee_id TEXT,
  tran_date DATE NOT NULL DEFAULT CURRENT_DATE,
  date DATE DEFAULT CURRENT_DATE,
  distributor_name TEXT,
  route_name TEXT,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  from_location TEXT,
  to_location TEXT,
  mode TEXT DEFAULT 'Bus', -- 'Bus' | 'Rickshaw' | 'Motorcycle' | 'CNG' | 'Train' | 'Own DA'
  transport_mode TEXT,
  distance_km NUMERIC(6, 2) DEFAULT 0.0,
  distance NUMERIC(8, 2) DEFAULT 0.0,
  fare_amount_bdt NUMERIC(10, 2) DEFAULT 0.00,
  da_amount_bdt NUMERIC(10, 2) DEFAULT 0.00,
  hotel_amount_bdt NUMERIC(10, 2) DEFAULT 0.00,
  misc_amount_bdt NUMERIC(10, 2) DEFAULT 0.00,
  amount NUMERIC(10, 2) DEFAULT 0.00,
  total_amount_bdt NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'Pending_HOS_Approval', -- 'Pending_HOS_Approval' | 'Approved' | 'Rejected'
  approver_id TEXT,
  approver_name TEXT DEFAULT 'Mohammad Faruk (HOS)',
  approved_at TIMESTAMPTZ,
  remarks TEXT,
  last_modified TEXT,
  receipt_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safe Alter Table migration script for tada_claims
ALTER TABLE public.tada_claims ADD COLUMN IF NOT EXISTS ff_id TEXT;
ALTER TABLE public.tada_claims ADD COLUMN IF NOT EXISTS rep_id TEXT;
ALTER TABLE public.tada_claims ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE public.tada_claims ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.tada_claims ADD COLUMN IF NOT EXISTS from_location TEXT;
ALTER TABLE public.tada_claims ADD COLUMN IF NOT EXISTS to_location TEXT;
ALTER TABLE public.tada_claims ADD COLUMN IF NOT EXISTS transport_mode TEXT;
ALTER TABLE public.tada_claims ADD COLUMN IF NOT EXISTS distance NUMERIC(8, 2) DEFAULT 0.0;
ALTER TABLE public.tada_claims ADD COLUMN IF NOT EXISTS amount NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.tada_claims ADD COLUMN IF NOT EXISTS approver_id TEXT;
ALTER TABLE public.tada_claims ADD COLUMN IF NOT EXISTS last_modified TEXT;
ALTER TABLE public.tada_claims ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================================
-- 10. WARRANTY & RMA TICKETS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.warranty_tickets (
  id BIGSERIAL PRIMARY KEY,
  ticket_number TEXT UNIQUE NOT NULL,
  ticket_seq TEXT,
  serial_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_type TEXT DEFAULT 'End Customer',
  ownership_type TEXT DEFAULT 'Individual Owner',
  dealer_name TEXT,
  dealer_or_distributor_name TEXT,
  distributor_name TEXT,
  collection_point TEXT,
  address TEXT,
  district TEXT DEFAULT 'Dhaka',
  battery_brand TEXT DEFAULT 'Ensec Lithium BD',
  battery_model TEXT NOT NULL,
  battery_type TEXT DEFAULT 'LiFePO4',
  capacity_ah NUMERIC(6, 2),
  nominal_voltage NUMERIC(6, 2),
  purchase_date DATE,
  complaint_date DATE DEFAULT CURRENT_DATE,
  complaint_received_by TEXT,
  complaint_channel TEXT DEFAULT 'Hotline Call',
  defect_category TEXT NOT NULL, -- 'BMS Cutoff / No Voltage Output' | 'Cell Voltage Imbalance' | 'Capacity Drop / Low Mileage' | 'Charging Failure' | 'Connector / Cable Damage'
  problem_category TEXT,
  reported_fault TEXT,
  detailed_description TEXT,
  is_battery_working TEXT DEFAULT 'No / Dead',
  urgency TEXT DEFAULT 'Normal', -- 'Normal' | 'High' | 'Urgent'
  status TEXT DEFAULT 'Complaint Registered', -- 'Complaint Registered' | 'Battery Received' | 'Technical Inspection' | 'In Repair' | 'Quality Control Passed' | 'Delivered'
  prior_repairs_count INT DEFAULT 0,
  notes TEXT,
  assigned_technician TEXT,
  resolution_type TEXT, -- 'Repaired' | 'Cell Replaced' | 'BMS Replaced' | 'Full Unit Replacement'
  is_received_at_factory BOOLEAN DEFAULT FALSE,
  receiving_id TEXT,
  received_date DATE,
  receiving_receipt_number TEXT,
  inspection_id TEXT,
  inspected_by TEXT,
  inspection_date DATE,
  is_safety_hold BOOLEAN DEFAULT FALSE,
  safety_hold_reason TEXT,
  job_card_id TEXT,
  job_card_number TEXT,
  warranty_decision TEXT,
  estimated_cost_bdt NUMERIC(12, 2) DEFAULT 0.00,
  invoice_id TEXT,
  invoice_number TEXT,
  invoice_total_bdt NUMERIC(12, 2) DEFAULT 0.00,
  amount_paid_bdt NUMERIC(12, 2) DEFAULT 0.00,
  payment_status TEXT DEFAULT 'Pending',
  qc_status TEXT,
  dispatch_id TEXT,
  dispatch_date DATE,
  delivered_by TEXT,
  delivery_dispatch_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safe Alter Table migration script for warranty_tickets
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS ticket_seq TEXT;
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS customer_type TEXT DEFAULT 'End Customer';
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS ownership_type TEXT DEFAULT 'Individual Owner';
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS dealer_or_distributor_name TEXT;
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS distributor_name TEXT;
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS collection_point TEXT;
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'Dhaka';
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS capacity_ah NUMERIC(6, 2);
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS nominal_voltage NUMERIC(6, 2);
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS complaint_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS complaint_received_by TEXT;
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS complaint_channel TEXT DEFAULT 'Hotline Call';
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS problem_category TEXT;
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS reported_fault TEXT;
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS is_received_at_factory BOOLEAN DEFAULT FALSE;
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS receiving_id TEXT;
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS received_date DATE;
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS receiving_receipt_number TEXT;
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS inspection_id TEXT;
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS inspected_by TEXT;
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS inspection_date DATE;
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS is_safety_hold BOOLEAN DEFAULT FALSE;
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS safety_hold_reason TEXT;
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS job_card_id TEXT;
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS job_card_number TEXT;
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS warranty_decision TEXT;
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS estimated_cost_bdt NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS invoice_id TEXT;
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS invoice_total_bdt NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS amount_paid_bdt NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Pending';
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS qc_status TEXT;
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS dispatch_id TEXT;
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS dispatch_date DATE;
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS delivered_by TEXT;
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS delivery_dispatch_id TEXT;
ALTER TABLE public.warranty_tickets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================================
-- 11. ATTENDANCE & PUNCH LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.attendance_logs (
  id BIGSERIAL PRIMARY KEY,
  rep_name TEXT NOT NULL,
  punch_type TEXT NOT NULL, -- 'Punch IN' | 'Punch OUT'
  punch_time TEXT NOT NULL,
  punch_date DATE NOT NULL DEFAULT CURRENT_DATE,
  gps_location TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 12. CASH BOOK & FINANCE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cash_book_entries (
  id BIGSERIAL PRIMARY KEY,
  voucher_no TEXT UNIQUE NOT NULL,
  voucher_date DATE NOT NULL DEFAULT CURRENT_DATE,
  account_type TEXT NOT NULL, -- 'Head Office Cash' | 'Factory Cash' | 'City Bank PLC' | 'Eastern Bank PLC'
  transaction_category TEXT NOT NULL, -- 'Customer Payment' | 'Distributor Payment' | 'Field Force Expense' | 'Transport Expense' | 'Bank Transfer'
  description TEXT NOT NULL,
  reference TEXT,
  cash_in_bdt NUMERIC(12, 2) DEFAULT 0.00,
  cash_out_bdt NUMERIC(12, 2) DEFAULT 0.00,
  running_balance_bdt NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 13. INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_customers_code ON public.customers(code);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_sales_orders_number ON public.sales_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_sales_orders_date ON public.sales_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_tada_claims_code ON public.tada_claims(ff_code);
CREATE INDEX IF NOT EXISTS idx_tada_claims_date ON public.tada_claims(tran_date);
CREATE INDEX IF NOT EXISTS idx_warranty_tickets_number ON public.warranty_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_warranty_tickets_serial ON public.warranty_tickets(serial_number);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_date ON public.attendance_logs(punch_date);
CREATE INDEX IF NOT EXISTS idx_raw_material_categories_code ON public.raw_material_categories(code);
CREATE INDEX IF NOT EXISTS idx_raw_materials_code ON public.raw_materials(code);
CREATE INDEX IF NOT EXISTS idx_raw_materials_category ON public.raw_materials(category);

-- ============================================================================
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_material_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tada_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_book_entries ENABLE ROW LEVEL SECURITY;

-- Allow read & write access for authenticated users & anon API key
DO $$
BEGIN
  -- Users policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.users FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Customers policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.customers FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Distributors policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'distributors' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.distributors FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Warehouses policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'warehouses' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.warehouses FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Products policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.products FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Raw Material Classifications policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'raw_material_classifications' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.raw_material_classifications FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Raw Material Categories policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'raw_material_categories' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.raw_material_categories FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Raw Materials policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'raw_materials' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.raw_materials FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Sales Orders policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sales_orders' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.sales_orders FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- TADA Claims policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tada_claims' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.tada_claims FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Warranty Tickets policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'warranty_tickets' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.warranty_tickets FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Attendance policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'attendance_logs' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.attendance_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Cash Book policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cash_book_entries' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.cash_book_entries FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

--- ============================================================================
--- 14.1 SUPABASE REALTIME REPLICATION (Instant UI & Dashboard Updates)
--- ============================================================================
-- Enables live CDC streaming so Supabase Dashboard Table Editor and clients
-- see new and modified rows immediately without manual page refresh.
DO $$
BEGIN
  -- Set replica identity to FULL for comprehensive payload delivery
  ALTER TABLE public.raw_material_classifications REPLICA IDENTITY FULL;
  ALTER TABLE public.raw_material_categories REPLICA IDENTITY FULL;
  ALTER TABLE public.raw_materials REPLICA IDENTITY FULL;
  ALTER TABLE public.products REPLICA IDENTITY FULL;
  ALTER TABLE public.distributors REPLICA IDENTITY FULL;
  ALTER TABLE public.warehouses REPLICA IDENTITY FULL;

  -- Add tables to the supabase_realtime publication
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.raw_material_classifications;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.raw_material_categories;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.raw_materials;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.distributors;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.warehouses;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- ============================================================================
-- 15. SEED INITIAL DATA (Optional / Production Defaults)
-- ============================================================================
INSERT INTO public.users (name, email, password, phone, role, designation, department)
VALUES
  ('Engr. Sohidul Islam', 'sohidul@ensecbd.com', 'ensec2026', '+880 1711-234567', 'Super Admin', 'Managing Director & CTO', 'Executive Management'),
  ('Tanvir Hossain', 'tanvir.sales@ensecbd.com', 'ensec2026', '+880 1819-345678', 'Sales Head', 'National Head of Sales', 'Sales & Marketing'),
  ('Mustafizur Rahman', 'mustafiz.kushtia@ensecbd.com', 'ensec2026', '+880 1912-987654', 'Factory Manager', 'Head of Kushtia Assembly Plant', 'Manufacturing'),
  ('Kamrul Hasan', 'kamrul.accounts@ensecbd.com', 'ensec2026', '+880 1612-443322', 'Accounts / Finance', 'Senior Finance Manager', 'Finance & Accounts'),
  ('Rafiqul Alam', 'rafiqul.dhaka1@ensecbd.com', 'ensec2026', '+880 1722-887766', 'Warehouse Manager', 'Central Warehouse In-Charge (Tejgaon)', 'Supply Chain'),
  ('Md. Abdur Rahman', 'abdur.spo@ensecbd.com', 'ensec2026', '+880 1711-209841', 'Field Force', 'Senior SPO (Mirpur)', 'Field Operations')
ON CONFLICT (email) DO UPDATE SET 
  password = EXCLUDED.password,
  updated_at = NOW();

INSERT INTO public.warehouses (code, name, location, district, is_factory_plant)
VALUES
  ('WH-01', 'Dhaka Central Hub 1', 'Tejgaon Industrial Area', 'Dhaka', FALSE),
  ('WH-02', 'Kushtia Manufacturing Plant', 'Kushtia BSCIC Industrial Estate', 'Kushtia', TRUE),
  ('WH-03', 'Chattogram Port Depot', 'Agrabad Commercial Area', 'Chattogram', FALSE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.raw_material_categories (code, name, parent_classification, description, status)
VALUES
  ('RMC-CELL', 'Cell', 'Active Electrochemical Cells', 'Lithium Iron Phosphate (LiFePO4) & NMC prismatic and cylindrical cells (3.2V 105Ah, 280Ah Grade-A) for battery pack assembly.', 'Active'),
  ('RMC-BMS', 'BMS', 'Power Electronics & Control', 'Battery Management Systems (4S to 16S), smart active balancers, CAN/RS485 communication boards, and Bluetooth telemetry modules.', 'Active'),
  ('RMC-CASE', 'Casing', 'Mechanical Hardware & Enclosure', 'Heavy-duty 19-inch 3U server rack sheet-metal enclosures, ABS IP65 solar enclosures, and industrial powder-coated cabinets.', 'Active'),
  ('RMC-WIRE', 'Wire & Busbar', 'Interconnects & Wiring', 'Pure copper nickel-plated busbars, laser-welded bus plates, high-temperature silicone cables, and terminal lugs.', 'Active'),
  ('RMC-CONN', 'Connector', 'Interconnects & Wiring', 'Anderson SB-50/SB-120 high-current connectors, aviation circular plugs, terminal posts, and quick-disconnect harness fittings.', 'Active'),
  ('RMC-PCB', 'PCB', 'Power Electronics & Control', 'Power distribution boards, LED status indicators, cell voltage sampling flex PCBs, and shunt current monitoring assemblies.', 'Active'),
  ('RMC-INSUL', 'Insulation & Pack', 'Thermal & Insulation Materials', 'FR4 epoxy glass fiber sheet insulation, EVA vibration absorption pads, Kapton polyimide tape, and thermal barrier silica blankets.', 'Active')
ON CONFLICT (code) DO NOTHING;

-- Raw materials table seed data omitted to start with clean real inventory.
-- Register real factory materials via Raw Materials / SCM Receiving module.


INSERT INTO public.products (
  code, name, model, brand, category,
  nominal_voltage, capacity_ah, energy_wh, battery_type, chemistry,
  normal_voltage, rated_capacity, cycle_life, typical_capacity_kwh,
  max_charge_current, standard_charging, max_discharge_current,
  weight_kg, dimension_cm, operating_temperature, mileage_km,
  distributor_price_bdt, dealer_price_bdt, corporate_price_bdt, project_price_bdt,
  retail_price_bdt, trade_price_bdt, mrp_bdt, warranty_months, status
)
VALUES
  (
    'ENS-EN51.2V86AH', 'EN51.2V86AH', 'EN51.2V86AH', 'Ensec Lithium BD', 'Electric Vehicle (EV) Batteries',
    51.2, 86.0, 4403.20, 'LiFePO4', 'Lifepo4',
    '51.2V', '51.2V86Ah', '>4000', '4.40KWH',
    '50A', 'CC/CV, 0.5C, 58.4V.', '120A/150A/200A',
    '40KG (±)2%', '50*36*26', '0-60°C', '80-90KM with Full Charge.',
    85000.00, 89000.00, 92000.00, 88000.00,
    98000.00, 85000.00, 98000.00, 36, 'Active'
  ),
  (
    'EN-LFP-12100', 'Ensec LiFePO4 Inverter Battery 12V 100Ah', 'EN-LFP-12V100AH', 'Ensec Lithium BD', 'Inverter Lithium Battery',
    12.8, 100.0, 1280.00, 'LiFePO4', 'Lifepo4',
    '12.8V', '12.8V100Ah', '>3500', '1.28KWH',
    '50A', 'CC/CV, 0.5C, 14.6V.', '100A/150A',
    '12.5KG', '33*17*22', '0-55°C', 'N/A (Stationary Inverter)',
    32000.00, 34000.00, 35000.00, 33500.00,
    38000.00, 32000.00, 38000.00, 36, 'Active'
  ),
  (
    'EN-SOL-48100', 'SolarPro 48V 100Ah Server Rack Battery', 'SOL-48V100AH', 'SolarPro Series', 'Solar Energy Storage Batteries',
    51.2, 100.0, 5120.00, 'LiFePO4', 'Lifepo4',
    '51.2V', '51.2V100Ah', '>6000', '5.12KWH',
    '50A', 'CC/CV, 0.5C, 58.4V.', '100A/120A',
    '46KG', '44*48*17.5', '-10-60°C', 'N/A (Telecom & Solar ESS)',
    115000.00, 120000.00, 122000.00, 118000.00,
    135000.00, 115000.00, 135000.00, 60, 'Active'
  )
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.customers (code, name, phone, channel, customer_type, pricing_tier, territory, address)
VALUES
  ('RET-0001', 'SORNA COSMETIC AND CONFECTIONERY', '+880 1819-445522', 'Distributor Sales', 'Retailer', 'Dealer / Retailer Channel', 'Kadamtoly Doria', 'Shop 12, Kadamtoly Bazar, Bancharampur'),
  ('RET-0002', 'Bismillah Battery & Solar House', '+880 1711-889900', 'Distributor Sales', 'Dealer', 'Dealer / Retailer Channel', 'Mirpur 10', 'Plot 4, Main Road, Mirpur 10 Roundabout')
ON CONFLICT (code) DO NOTHING;



-- ============================================================================
-- 15. PRODUCT CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_categories (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- e.g. 'CAT-TEL', 'CAT-SOL', 'CAT-EV'
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Active', -- 'Active' | 'Inactive'
  product_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 16. PRODUCT BRANDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_brands (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- e.g. 'BRD-ENSEC', 'BRD-OPTIMUM', 'BRD-VOLTMAX'
  name TEXT NOT NULL,
  origin TEXT DEFAULT 'Bangladesh (Kushtia Assembly Plant)',
  category TEXT DEFAULT '',
  tagline TEXT,
  status TEXT DEFAULT 'Active', -- 'Active' | 'Inactive'
  product_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure category column exists if product_brands table was created previously
ALTER TABLE public.product_brands ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '';

-- ============================================================================
-- 17. CUSTOMER CATEGORIES TABLE (Pricing & Channel Tiers)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.customer_categories (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- e.g. 'CCAT-DIST-WHOLESALE', 'CCAT-DEALER-RETAIL'
  name TEXT NOT NULL,
  description TEXT,
  target_audience TEXT DEFAULT 'Both', -- 'Distributor' | 'Customer' | 'Both'
  discount_percentage NUMERIC(5, 2) DEFAULT 0.00,
  price_markup_percentage NUMERIC(5, 2) DEFAULT 0.00,
  status TEXT DEFAULT 'Active', -- 'Active' | 'Inactive'
  customer_count INT DEFAULT 0,
  distributor_count INT DEFAULT 0,
  product_price_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 18. ORG HIERARCHY TABLE (Company -> BU -> Division -> Region -> Area -> Territory)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.org_hierarchy (
  id BIGSERIAL PRIMARY KEY,
  node_id TEXT UNIQUE NOT NULL, -- e.g. 'org-1', 'org-2'
  code TEXT UNIQUE NOT NULL, -- e.g. 'ENSEC-HQ', 'BU-LIBAT', 'DIV-SALES'
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'Company' | 'Business Unit' | 'Division' | 'Region' | 'Area' | 'Territory'
  parent_id TEXT REFERENCES public.org_hierarchy(node_id) ON DELETE SET NULL,
  head_person TEXT,
  phone TEXT,
  tagged_distributor_ids TEXT[] DEFAULT '{}',
  tagged_customer_ids TEXT[] DEFAULT '{}',
  tagged_field_force_ids TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 19. DEPARTMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.departments (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- e.g. 'DEP-1', 'DEP-2'
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  division TEXT,
  head_of_department TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  description TEXT,
  member_count INT DEFAULT 0,
  status TEXT DEFAULT 'Active', -- 'Active' | 'Inactive'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 20. BANKS LIST TABLE (Cash & Bank Accounts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.banks (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- e.g. 'Bank-13', 'Bank-12'
  name TEXT NOT NULL,
  native_name TEXT,
  account_no TEXT NOT NULL,
  branch_name TEXT NOT NULL,
  routing_number TEXT,
  swift_code TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 21. UNITS OF MEASUREMENT TABLE (UOM)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.units_of_measurement (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- e.g. 'UOM-001', 'UOM-002'
  name TEXT NOT NULL, -- 'Pieces', 'Complete Set', 'Battery Module'
  symbol TEXT NOT NULL, -- 'pcs', 'set', 'mod'
  native_name TEXT, -- 'পিস', 'সেট'
  applicable_to TEXT NOT NULL DEFAULT 'Both', -- 'Finish Product' | 'Raw Material' | 'Both'
  category TEXT DEFAULT 'Discrete Count', -- 'Discrete Count' | 'Electrical Assembly' | 'Packaging & Container'
  is_base_unit BOOLEAN DEFAULT FALSE,
  allow_decimals BOOLEAN DEFAULT FALSE,
  decimal_places INT DEFAULT 0,
  standard_packaging_rate NUMERIC(10, 2) DEFAULT 1.00,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 22. FIELD FORCE TABLE (Sales Officers, Supervisors, Delivery Personnel)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.field_force_reps (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- e.g. 'FF-DHK-01', 'MEL00445'
  name TEXT NOT NULL,
  native_name TEXT,
  pin TEXT,
  phone TEXT NOT NULL,
  designation TEXT NOT NULL,
  field_force_type TEXT DEFAULT 'Capture', -- 'Capture' | 'CaptureAndApprove' | 'Order Booker' | 'Delivery Man' | 'Supervisor'
  department TEXT,
  departments TEXT[] DEFAULT '{}',
  region TEXT,
  area TEXT,
  territory TEXT,
  market_hierarchy TEXT,
  distributor_id BIGINT REFERENCES public.distributors(id) ON DELETE SET NULL,
  distributor_name TEXT,
  monthly_target_bdt NUMERIC(12, 2) DEFAULT 0.00,
  monthly_achieved_bdt NUMERIC(12, 2) DEFAULT 0.00,
  basic_salary_bdt NUMERIC(10, 2) DEFAULT 0.00,
  conveyance_bdt NUMERIC(10, 2) DEFAULT 0.00,
  ta_da_bdt NUMERIC(10, 2) DEFAULT 0.00,
  mobile_allowance_bdt NUMERIC(10, 2) DEFAULT 0.00,
  current_location JSONB DEFAULT '{}'::jsonb,
  joining_date DATE,
  discontinue_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 23. OFFERS & PROMOTIONS ENGINE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.offers_promotions (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- e.g. 'OFF-001', 'STX-BLN-01'
  title TEXT NOT NULL,
  discount_title TEXT,
  discount_native_title TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  discount_for TEXT DEFAULT 'All', -- 'Distributor' | 'Retailer' | 'Wholesaler' | 'Corporate' | 'Dealer' | 'All'
  department TEXT,
  discount_on TEXT DEFAULT 'LineItem', -- 'LineItem' | 'InvoiceSubtotal' | 'Category' | 'Brand'
  eligible_for TEXT DEFAULT 'Product', -- 'Product' | 'CustomerTier' | 'Region' | 'All'
  priority INT DEFAULT 1,
  when_condition TEXT DEFAULT 'Quantity', -- 'Quantity' | 'OrderValue' | 'PaymentMode'
  greater_than_or_equal_to NUMERIC(12, 2) DEFAULT 1,
  condition_value NUMERIC(12, 2) DEFAULT 1,
  provide_benefit TEXT DEFAULT 'PercentageDiscount', -- 'PercentageDiscount' | 'FixedAmount' | 'FreeSameProduct' | 'FreeChosenProduct'
  discount_amount NUMERIC(12, 2) DEFAULT 0.00,
  discount_percentage NUMERIC(5, 2) DEFAULT 0.00,
  flat_discount_bdt NUMERIC(12, 2) DEFAULT 0.00,
  free_product_qty INT DEFAULT 0,
  free_product_id TEXT,
  free_product_name TEXT,
  allow_discount_for TEXT DEFAULT 'FullQuantity',
  apply_in_multiples BOOLEAN DEFAULT TRUE,
  discount_limitation TEXT DEFAULT 'Unlimited',
  limit_times INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 24. INDEXES FOR NEW MASTER DATA TABLES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_product_categories_code ON public.product_categories(code);
CREATE INDEX IF NOT EXISTS idx_product_brands_code ON public.product_brands(code);
CREATE INDEX IF NOT EXISTS idx_customer_categories_code ON public.customer_categories(code);
CREATE INDEX IF NOT EXISTS idx_org_hierarchy_code ON public.org_hierarchy(code);
CREATE INDEX IF NOT EXISTS idx_org_hierarchy_parent ON public.org_hierarchy(parent_id);
CREATE INDEX IF NOT EXISTS idx_departments_code ON public.departments(code);
CREATE INDEX IF NOT EXISTS idx_banks_code ON public.banks(code);
CREATE INDEX IF NOT EXISTS idx_units_code ON public.units_of_measurement(code);
CREATE INDEX IF NOT EXISTS idx_field_force_code ON public.field_force_reps(code);
CREATE INDEX IF NOT EXISTS idx_field_force_phone ON public.field_force_reps(phone);
CREATE INDEX IF NOT EXISTS idx_offers_promotions_code ON public.offers_promotions(code);
CREATE INDEX IF NOT EXISTS idx_offers_promotions_dates ON public.offers_promotions(start_date, end_date);

-- ============================================================================
-- 25. ROW LEVEL SECURITY (RLS) FOR NEW TABLES
-- ============================================================================
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_hierarchy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units_of_measurement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_force_reps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers_promotions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Product Categories policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_categories' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.product_categories FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Product Brands policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_brands' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.product_brands FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Customer Categories policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_categories' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.customer_categories FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Org Hierarchy policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'org_hierarchy' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.org_hierarchy FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Departments policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'departments' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.departments FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Banks policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'banks' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.banks FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Units of Measurement policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'units_of_measurement' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.units_of_measurement FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Field Force Reps policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'field_force_reps' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.field_force_reps FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Offers Promotions policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'offers_promotions' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.offers_promotions FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- 26. INITIAL SEED DATA FOR NEW TABLES
-- ============================================================================

-- 1. Product Categories Seeds
INSERT INTO public.product_categories (code, name, description, status)
VALUES
  ('CAT-SOL', 'Solar Home System', '12.8V & 25.6V high-cycle lithium storage for off-grid residential and commercial solar installations.', 'Active'),
  ('CAT-EV', 'EV & E-Rickshaw', '60V & 72V traction battery packs for Bangladeshi electric three-wheelers and commercial light EVs.', 'Active'),
  ('CAT-IND', 'Commercial & Industrial', 'High-voltage and multi-megawatt containerized BESS solutions for manufacturing plants and spinning mills.', 'Active'),
  ('CAT-UPS', 'Inverter / UPS', 'Instant switchover lithium backup packs for home IPS, office offline UPS, and server power supplies.', 'Active')
ON CONFLICT (code) DO NOTHING;

-- 2. Product Brands Seeds
INSERT INTO public.product_brands (code, name, origin, tagline, status)
VALUES
  ('BRD-ENSEC', 'Ensec Lithium BD', 'Bangladesh (Kushtia Assembly Plant)', 'Engineered for extreme tropical durability & high-temperature cycle life.', 'Active'),
  ('BRD-OPTIMUM', 'Optimum Joint Venture', 'Bangladesh & China JV', 'Cost-optimized lithium packs with 50:50 shared manufacturing capital.', 'Active'),
  ('BRD-VOLTMAX', 'VoltMax Industrial', 'OEM Licensed', 'Heavy-duty traction and material handling energy packs.', 'Active')
ON CONFLICT (code) DO NOTHING;

-- 3. Customer Categories Seeds
INSERT INTO public.customer_categories (code, name, description, target_audience, discount_percentage, price_markup_percentage, status)
VALUES
  ('CCAT-DIST-WHOLESALE', 'Nationwide Authorized Distributor Tier', 'Premier regional warehouse stockists & exclusive DB points with largest order volumes and dedicated credit ceilings.', 'Distributor', 20.00, 0.00, 'Active'),
  ('CCAT-DEALER-RETAIL', 'Dealers, Workshops & Battery Retailers', 'Local battery shops, auto electric garages, and regional sub-dealers purchasing for aftermarket resale.', 'Customer', 14.00, 5.00, 'Active'),
  ('CCAT-CORP-TEL', 'Direct Corporate & Telecom Infrastructure', 'Tier-1 enterprise accounts including telecom tower operators, data centers, and multi-facility industrial conglomerates.', 'Customer', 12.00, 6.00, 'Active'),
  ('CCAT-PRJ-TENDER', 'Government Tenders & Solar Projects', 'BREB rural electrification mini-grids, donor-funded solar projects, and institutional energy storage tenders.', 'Customer', 15.00, 3.00, 'Active'),
  ('CCAT-END-CONSUMER', 'Walk-In & Direct Retail Consumer', 'Direct walk-in end consumers and non-contracted residential buyers receiving standard maximum retail price.', 'Customer', 0.00, 15.00, 'Active')
ON CONFLICT (code) DO NOTHING;

-- 4. Org Hierarchy Seeds
INSERT INTO public.org_hierarchy (node_id, code, name, type, parent_id, head_person, phone)
VALUES
  ('org-1', 'ENSEC-HQ', 'Ensec Bangladesh Ltd.', 'Company', NULL, 'Engr. Sohidul Islam', '+880 2 9887766'),
  ('org-2', 'BU-LIBAT', 'Lithium Battery Business Unit', 'Business Unit', 'org-1', NULL, NULL),
  ('org-3', 'DIV-SALES', 'National Sales Division', 'Division', 'org-2', 'Tanvir Hossain', NULL),
  ('org-4', 'REG-DHK', 'Dhaka Region', 'Region', 'org-3', 'Sabbir Ahmed (RM)', NULL),
  ('org-5', 'AREA-DHK-N', 'Dhaka North Area', 'Area', 'org-4', NULL, NULL),
  ('org-6', 'TERR-MIRPUR', 'Mirpur Territory', 'Territory', 'org-5', NULL, NULL),
  ('org-7', 'REG-CTG', 'Chittagong Region', 'Region', 'org-3', 'Mustafa Kamal (RM)', NULL),
  ('org-8', 'REG-KHU', 'Khulna & Kushtia Region', 'Region', 'org-3', 'Ashraful Alam (RM)', NULL)
ON CONFLICT (code) DO NOTHING;

-- 5. Departments Seeds
INSERT INTO public.departments (code, name, full_name, division, head_of_department, email, phone, location, status)
VALUES
  ('DEP-1', 'MOUSUMI NETWORK LTD', 'DEP-1 - MOUSUMI NETWORK LTD', 'Commercial & FMCG Distribution', 'Kazi Morshedul Alam', 'mousumi.network@ensec-optimum.com', '+880 1711-234567', 'Dhaka HQ - Tejgaon', 'Active'),
  ('DEP-2', 'PROFESSIONAL DIVISION', 'DEP-2 - PROFESSIONAL DIVISION', 'Corporate & Institutional Sales', 'Engr. Tariqul Islam', 'professional.div@ensec-optimum.com', '+880 1819-345678', 'Dhaka HQ - Banani', 'Active'),
  ('DEP-3', 'HBL EXCLUSIVE', 'DEP-3 - HBL EXCLUSIVE', 'OEM & High-Capacity Storage', 'Mahfuzur Rahman', 'hbl.exclusive@ensec-optimum.com', '+880 1713-456789', 'Dhaka HQ - Motijheel', 'Active'),
  ('DEP-4', 'BATTERY DISTRIBUTION DIVISION', 'DEP-4 - BATTERY DISTRIBUTION DIVISION', 'Primary Automotive & E-Mobility', 'Hasan Ali Chowdhury', 'battery.dist@ensec-optimum.com', '+880 1912-567890', 'Chittagong Hub - Agrabad', 'Active'),
  ('DEP-5', 'SOLAR & INDUSTRIAL SOLUTIONS', 'DEP-5 - SOLAR & INDUSTRIAL SOLUTIONS', 'Renewable & Utility Scale', 'Dr. Shahinur Rashid', 'solar.industrial@ensec-optimum.com', '+880 1714-678901', 'Kushtia Plant & Dhaka HQ', 'Active'),
  ('DEP-6', 'KUSHTIA FACTORY OPERATIONS', 'DEP-6 - KUSHTIA FACTORY OPERATIONS', 'Manufacturing & Plant Engineering', 'Engr. M. A. Kashem', 'factory.kushtia@ensec-optimum.com', '+880 1715-789012', 'Kushtia Industrial Estate', 'Active')
ON CONFLICT (code) DO NOTHING;

-- 6. Banks Seeds
INSERT INTO public.banks (code, name, native_name, account_no, branch_name, is_active)
VALUES
  ('Bank-13', 'MEL-Global Trade Point (0559)', 'এমইএল-গ্লোবাল ট্রেড পয়েন্ট (০৫৫৯)', '2061090000559', 'Banani', TRUE),
  ('Bank-12', 'MEL-Mercantile Bank PLC (8795)', 'এমইএল-মার্কেন্টাইল ব্যাংক পিএলসি', '1111001268795', 'Banani', TRUE),
  ('Bank-11', 'MNL-Dhaka Bank Limited (2036)', 'এমএনএল-ঢাকা ব্যাংক লিমিটেড', '2151750002036', 'Gulshan-2', TRUE),
  ('Bank-6', 'MNL-Dutch-Bangla Bank (9288)', 'এমএনএল-ডাচ-বাংলা ব্যাংক', '1161100029288', 'Gulshan', TRUE),
  ('Bank-10', 'Armanitola / HO Cash Payment', 'আরমানিটোলা / প্রধান কার্যালয় নগদ গ্রহণ', 'Hand Cash', 'Armanitola', TRUE)
ON CONFLICT (code) DO NOTHING;

-- 7. Units of Measurement Seeds
INSERT INTO public.units_of_measurement (code, name, symbol, native_name, applicable_to, category, is_base_unit, allow_decimals, standard_packaging_rate, is_active)
VALUES
  ('UOM-001', 'Pieces', 'pcs', 'পিস', 'Finish Product', 'Discrete Count', TRUE, FALSE, 1.00, TRUE),
  ('UOM-002', 'Complete Set', 'set', 'সেট', 'Finish Product', 'Electrical Assembly', FALSE, FALSE, 1.00, TRUE),
  ('UOM-003', 'Battery Module', 'mod', 'মডিউল', 'Finish Product', 'Discrete Count', FALSE, FALSE, 1.00, TRUE),
  ('UOM-004', 'Battery Pack', 'pack', 'প্যাক', 'Finish Product', 'Packaging & Container', FALSE, FALSE, 1.00, TRUE),
  ('UOM-005', 'Kilogram', 'kg', 'কেজি', 'Raw Material', 'Weight / Mass', TRUE, TRUE, 1.00, TRUE),
  ('UOM-006', 'Meter', 'm', 'মিটার', 'Raw Material', 'Length / Dimension', TRUE, TRUE, 1.00, TRUE),
  ('UOM-007', 'Sheet', 'sht', 'শীট', 'Raw Material', 'Discrete Count', FALSE, FALSE, 1.00, TRUE)
ON CONFLICT (code) DO NOTHING;

-- 8. Field Force Reps Seeds
INSERT INTO public.field_force_reps (code, name, native_name, phone, designation, department, region, area, territory, monthly_target_bdt, monthly_achieved_bdt, basic_salary_bdt, conveyance_bdt, ta_da_bdt, mobile_allowance_bdt, is_active)
VALUES
  ('FF-DHK-01', 'Zubair Ahmed', 'জুবায়ের আহমেদ', '+880 1714-554433', 'Territory Sales Officer (Dhaka North)', 'MOUSUMI NETWORK LTD', 'Dhaka Division', 'Dhaka North', 'Mirpur & Pallabi', 3500000.00, 2980000.00, 32000.00, 6500.00, 5000.00, 1500.00, TRUE),
  ('MEL00445', 'Fazleh Rabbi (Dhaka)', 'ফজলহ রাব্বি (ঢাকা)', '+880 1719-887766', 'Field Representative (Dhaka Metro)', 'MOUSUMI NETWORK LTD', 'Dhaka Division', 'Dhaka North', 'Mirpur & Pallabi', 2800000.00, 2450000.00, 28000.00, 5500.00, 4500.00, 1500.00, TRUE),
  ('FF-CTG-01', 'Tanvir Ahmed Chowdhury', 'তানভীর আহমেদ চৌধুরী', '+880 1819-223344', 'Area Sales Manager (Chittagong South)', 'BATTERY DISTRIBUTION DIVISION', 'Chittagong Division', 'Chittagong South', 'Agrabad & Halishahar', 4200000.00, 3890000.00, 45000.00, 8000.00, 7000.00, 2000.00, TRUE),
  ('FF-KST-01', 'Mijanur Rahman', 'মিজানুর রহমান', '+880 1712-998877', 'Territory Officer (Kushtia & Jashore)', 'KUSHTIA FACTORY OPERATIONS', 'Khulna Division', 'Kushtia', 'Kushtia Sadar & Poradah', 2500000.00, 2310000.00, 30000.00, 5000.00, 4000.00, 1500.00, TRUE)
ON CONFLICT (code) DO NOTHING;

-- 9. Offers & Promotions Seeds
INSERT INTO public.offers_promotions (code, title, discount_title, discount_native_title, start_date, end_date, discount_for, department, discount_on, eligible_for, priority, when_condition, greater_than_or_equal_to, condition_value, provide_benefit, discount_amount, free_product_qty, allow_discount_for, apply_in_multiples, discount_limitation, is_active)
VALUES
  ('STX-BLN-01', 'Stx.P Primary Blonde Powder (8p=1p Free)', 'Stx.P Primary Blonde Powder (8p=1p Free)', 'এসটিএক্স.পি প্রাইমারি ব্লন্ড পাউডার (৮টি কিনলে ১টি ফ্রি)', '2026-06-14', '2026-11-01', 'Distributor', 'DEP-1 - MOUSUMI NETWORK LTD', 'LineItem', 'Product', 1, 'Quantity', 8.00, 8.00, 'FreeSameProduct', 1.00, 1, 'FullQuantity', TRUE, 'Unlimited', TRUE),
  ('LUCY-ABO-100', 'Lucy Advanced Baby Oil 200ml (3p= 100/- OFF)', 'Lucy Advanced Baby Oil 200ml (3p= 100/- OFF)', 'লুসি অ্যাডভান্সড বেবি অয়েল ২০০মি.লি ৩৯০/- (৩টিতে ১০০/- ছাড়)', '2026-10-07', '2026-11-01', 'Retailer', 'DEP-1 - MOUSUMI NETWORK LTD', 'LineItem', 'Product', 3, 'Quantity', 3.00, 3.00, 'FixedAmount', 100.00, 0, 'FullQuantity', TRUE, 'Unlimited', TRUE),
  ('EN-LFP-PROMO10', 'Ensec Inverter Lithium Battery Launch Promo', '10% Flat Invoice Discount on 48V Modules', 'এনসেক ইনভার্টার লিথিয়াম ব্যাটারি ১০% ছাড়', '2026-01-01', '2026-12-31', 'All', 'DEP-2 - PROFESSIONAL DIVISION', 'InvoiceSubtotal', 'All', 2, 'OrderValue', 100000.00, 100000.00, 'PercentageDiscount', 10.00, 0, 'FullQuantity', FALSE, 'Unlimited', TRUE)
ON CONFLICT (code) DO NOTHING;


-- ============================================================================
-- 27. STOCK CID RECEIVE (MATERIAL RECEIVE REPORT - MRR) & INWARD RECEIPTS
-- Matches "Stock Receive Product" section & CID Receive Form in StockModule
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_cid_receipts (
  id BIGSERIAL PRIMARY KEY,
  voucher_id TEXT UNIQUE, -- e.g. 'CID-MRR-2026-0045'
  mrr_number TEXT UNIQUE NOT NULL,
  receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source_type TEXT NOT NULL DEFAULT 'Kushtia Manufacturing Plant', -- 'Kushtia Manufacturing Plant' | 'Optimum JV Joint Venture Plant' | 'Factory Assembly Line 1 (LiFePO4 ESS)' | 'Factory Assembly Line 2 (EV 60V / 72V)' | 'Subcontractor / Direct Production Lot' | 'Returned Finished Goods (Factory Re-certified)'
  source_location TEXT DEFAULT 'Kushtia Factory - Main Plant Bay 3',
  warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  target_warehouse_name TEXT NOT NULL DEFAULT 'Dhaka Central Warehouse (Tejgaon)',
  challan_number TEXT,
  gate_pass_number TEXT,
  truck_number TEXT,
  carrier_vehicle_no TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  received_by TEXT NOT NULL DEFAULT 'Warehouse In-charge',
  qc_inspector TEXT DEFAULT 'Engr. Sohidul Islam (Lead QC)',
  qc_status TEXT NOT NULL DEFAULT 'QC Passed & Stamped', -- 'QC Passed & Stamped' | 'Conditionally Accepted' | 'Pending QC Inspection' | 'QC Failed'
  status TEXT NOT NULL DEFAULT 'Received & Stocked', -- 'Pending Verification' | 'Verified & Posted' | 'Rejected' | 'Received & Stocked'
  total_items INT DEFAULT 0,
  total_quantity NUMERIC(12, 2) DEFAULT 0,
  total_amount_bdt NUMERIC(14, 2) DEFAULT 0,
  general_remarks TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 28. STOCK CID RECEIPT ITEMS (LINE ITEMS FOR STOCK RECEIVE PRODUCT SECTION)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_cid_receipt_items (
  id BIGSERIAL PRIMARY KEY,
  receipt_id BIGINT REFERENCES public.stock_cid_receipts(id) ON DELETE CASCADE,
  mrr_number TEXT NOT NULL,
  product_id BIGINT REFERENCES public.products(id) ON DELETE SET NULL,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  batch_number TEXT NOT NULL,
  serial_range TEXT,
  received_qty NUMERIC(12, 2) NOT NULL DEFAULT 1,
  unit_cost_bdt NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_cost_bdt NUMERIC(14, 2) NOT NULL DEFAULT 0,
  rack_location TEXT DEFAULT 'Row A - Shelf 01',
  package_condition TEXT DEFAULT 'Factory Sealed',
  line_remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 29. WAREHOUSE PHYSICAL STOCK BALANCES (REAL-TIME INVENTORY TRACKING)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_inventory (
  id BIGSERIAL PRIMARY KEY,
  warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE CASCADE,
  warehouse_code TEXT,
  warehouse_name TEXT,
  product_id BIGINT REFERENCES public.products(id) ON DELETE CASCADE,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  batch_number TEXT NOT NULL DEFAULT 'GEN-BATCH',
  rack_location TEXT DEFAULT 'Bay-1 / Shelf-A',
  quantity_on_hand NUMERIC(12, 2) NOT NULL DEFAULT 0,
  quantity_reserved NUMERIC(12, 2) NOT NULL DEFAULT 0,
  quantity_available NUMERIC(12, 2) GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
  unit_cost_bdt NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_valuation_bdt NUMERIC(14, 2) GENERATED ALWAYS AS (quantity_on_hand * unit_cost_bdt) STORED,
  last_mrr_number TEXT,
  last_received_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_wh_product_batch UNIQUE(warehouse_id, product_id, batch_number)
);

-- ============================================================================
-- 30. STOCK OPENING RECORDS (CREATE & UPLOAD OPENING STOCK)
-- Matches StockModule Tabs "Create Opening Stock" and "Upload Opening Stock"
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_opening_records (
  id BIGSERIAL PRIMARY KEY,
  warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE SET NULL,
  warehouse_name TEXT,
  product_id BIGINT REFERENCES public.products(id) ON DELETE SET NULL,
  product_code TEXT,
  product_name TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  batch_number TEXT NOT NULL DEFAULT 'OPN-2026',
  quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
  unit_cost_bdt NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_cost_bdt NUMERIC(14, 2) DEFAULT 0,
  rack_location TEXT,
  source_method TEXT DEFAULT 'Manual', -- 'Manual' | 'CSV Upload' | 'Excel Upload'
  entry_date DATE DEFAULT CURRENT_DATE,
  entered_by TEXT DEFAULT 'System Admin',
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 31. STOCK ISSUES & STOCK ISSUE ITEMS (ISSUED TAB)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_issues (
  id BIGSERIAL PRIMARY KEY,
  issue_number TEXT UNIQUE NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  warehouse_name TEXT,
  issued_to TEXT NOT NULL, -- e.g. 'Mousumi Network Ltd' or 'Chittagong Depot'
  recipient_name TEXT,
  issue_type TEXT DEFAULT 'Delivery to Distributor', -- 'Delivery to Distributor' | 'Inter-Warehouse Dispatch' | 'Production Scrap / Rework' | 'Corporate Direct'
  gate_pass_number TEXT,
  driver_vehicle TEXT,
  reference_no TEXT,
  reason TEXT,
  total_quantity NUMERIC(12, 2) DEFAULT 0,
  total_value_bdt NUMERIC(14, 2) DEFAULT 0,
  status TEXT DEFAULT 'Dispatched', -- 'Pending Dispatch' | 'Dispatched' | 'Delivered' | 'Cancelled'
  issued_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stock_issue_items (
  id BIGSERIAL PRIMARY KEY,
  issue_id BIGINT REFERENCES public.stock_issues(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  batch_number TEXT,
  quantity NUMERIC(12, 2) NOT NULL DEFAULT 1,
  unit_cost_bdt NUMERIC(12, 2) DEFAULT 0,
  total_bdt NUMERIC(14, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 32. STOCK PRIMARY RETURNS (PRIMARY RETURN TAB)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_primary_returns (
  id BIGSERIAL PRIMARY KEY,
  return_number TEXT UNIQUE NOT NULL,
  return_date DATE NOT NULL DEFAULT CURRENT_DATE,
  distributor_id BIGINT REFERENCES public.distributors(id) ON DELETE SET NULL,
  distributor_name TEXT NOT NULL,
  warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  warehouse_name TEXT,
  product_id BIGINT REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  batch_number TEXT,
  quantity NUMERIC(12, 2) NOT NULL DEFAULT 1,
  unit_price_bdt NUMERIC(12, 2) DEFAULT 0,
  total_value_bdt NUMERIC(14, 2) DEFAULT 0,
  reason TEXT NOT NULL, -- 'Slow Moving Stock Swap' | 'Customer Order Cancellation' | 'Transit Box Denting'
  qc_status TEXT DEFAULT 'Pending QC Inspection',
  status TEXT DEFAULT 'Returned & Restocked',
  received_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 33. STOCK DAMAGE RETURNS (DAMAGE RETURN TAB)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_damage_returns (
  id BIGSERIAL PRIMARY KEY,
  ticket_number TEXT UNIQUE NOT NULL,
  incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
  warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  warehouse_name TEXT,
  distributor_id BIGINT REFERENCES public.distributors(id) ON DELETE SET NULL,
  distributor_name TEXT,
  product_id BIGINT REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  batch_number TEXT,
  quantity NUMERIC(12, 2) NOT NULL DEFAULT 1,
  damage_type TEXT NOT NULL, -- 'Enclosure Crack' | 'BMS Voltage Deviation' | 'Water Immersion' | 'Cell Puffing'
  severity TEXT DEFAULT 'Major', -- 'Minor' | 'Major' | 'Critical / Unusable'
  reported_by TEXT,
  action_taken TEXT DEFAULT 'Factory Rework Return', -- 'Factory Rework Return' | 'Scrap / Salvage' | 'Credit Note Issued'
  salvage_value_bdt NUMERIC(12, 2) DEFAULT 0,
  status TEXT DEFAULT 'Investigating',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 34. STOCK TRANSFERS (STOCK TRANSFER TAB)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_transfers (
  id BIGSERIAL PRIMARY KEY,
  transfer_number TEXT UNIQUE NOT NULL,
  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source_warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  source_warehouse_name TEXT NOT NULL,
  destination_warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  destination_warehouse_name TEXT NOT NULL,
  challan_number TEXT,
  vehicle_number TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  total_items INT DEFAULT 1,
  total_quantity NUMERIC(12, 2) NOT NULL DEFAULT 1,
  total_value_bdt NUMERIC(14, 2) DEFAULT 0,
  status TEXT DEFAULT 'In Transit', -- 'Initiated' | 'In Transit' | 'Received at Destination' | 'Rejected / Returned'
  dispatched_by TEXT,
  received_by TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stock_transfer_items (
  id BIGSERIAL PRIMARY KEY,
  transfer_id BIGINT REFERENCES public.stock_transfers(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  batch_number TEXT,
  quantity NUMERIC(12, 2) NOT NULL DEFAULT 1,
  unit_cost_bdt NUMERIC(12, 2) DEFAULT 0,
  total_bdt NUMERIC(14, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 35. STOCK ADJUSTMENTS (STOCK ADJUSTMENT TAB - AUDIT RECONCILIATION)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_adjustments (
  id BIGSERIAL PRIMARY KEY,
  reference_no TEXT UNIQUE NOT NULL,
  adjustment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  warehouse_name TEXT NOT NULL,
  product_id BIGINT REFERENCES public.products(id) ON DELETE RESTRICT,
  product_code TEXT,
  product_name TEXT NOT NULL,
  batch_number TEXT,
  adjustment_type TEXT NOT NULL, -- 'Physical Count Variance' | 'Damaged in Warehouse' | 'Sample / Marketing Demo' | 'Write-off'
  previous_qty NUMERIC(12, 2) NOT NULL DEFAULT 0,
  adjustment_qty NUMERIC(12, 2) NOT NULL DEFAULT 0, -- can be positive or negative
  new_qty NUMERIC(12, 2) NOT NULL DEFAULT 0,
  unit_cost_bdt NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_cost_variance_bdt NUMERIC(14, 2) NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  adjusted_by TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 36. REQUISITIONS & INDENTS (REQUISITIONS SECTION FROM SCREENSHOTS)
-- Matches RequisitionModule: Create Requisition, List, Approvals, Delivery Confirmation
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.requisitions (
  id BIGSERIAL PRIMARY KEY,
  requisition_no TEXT UNIQUE NOT NULL,
  requisition_date DATE NOT NULL DEFAULT CURRENT_DATE,
  requested_by TEXT NOT NULL,
  requisition_for TEXT DEFAULT 'Dealer', -- 'Dealer' | 'Distributor' | 'Factory Store' | 'Internal Department'
  dealer_or_distributor_id BIGINT REFERENCES public.distributors(id) ON DELETE SET NULL,
  dealer_name TEXT NOT NULL,
  branch_warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE SET NULL,
  target_depot TEXT DEFAULT 'Dhaka Central Depot',
  field_force_code TEXT,
  field_force_name TEXT,
  department_code TEXT DEFAULT 'DEP-1',
  department_name TEXT DEFAULT 'MOUSUMI NETWORK LTD',
  status TEXT NOT NULL DEFAULT 'Pending Approval', -- 'Pending Approval' | 'Approved by Factory' | 'Issued by Accounts' | 'Received at Warehouse' | 'Rejected'
  total_qty NUMERIC(12, 2) DEFAULT 0,
  total_amount_bdt NUMERIC(14, 2) DEFAULT 0,
  challan_no TEXT,
  deposit_notes TEXT,
  factory_notes TEXT,
  factory_reviewed_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.requisition_items (
  id BIGSERIAL PRIMARY KEY,
  requisition_id BIGINT REFERENCES public.requisitions(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES public.products(id) ON DELETE SET NULL,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  required_qty NUMERIC(12, 2) NOT NULL DEFAULT 1,
  approved_qty NUMERIC(12, 2) DEFAULT 0,
  unit_cost_bdt NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount_rate NUMERIC(5, 2) DEFAULT 0,
  free_qty NUMERIC(12, 2) DEFAULT 0,
  total_cost_bdt NUMERIC(14, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 37. RETAILER FIELD ORDERS & DELIVERIES (MOBILE SALES PORTAL SCREENSHOTS)
-- Matches MobileSalesPortal Screenshots: Order Capture, Confirmation, Partial, Cancellation
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.retailer_orders (
  id BIGSERIAL PRIMARY KEY,
  order_no TEXT UNIQUE NOT NULL,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  retailer_id BIGINT REFERENCES public.customers(id) ON DELETE SET NULL,
  retailer_code TEXT,
  retailer_name TEXT NOT NULL,
  distributor_id BIGINT REFERENCES public.distributors(id) ON DELETE SET NULL,
  distributor_name TEXT NOT NULL,
  field_rep_id BIGINT REFERENCES public.field_force_reps(id) ON DELETE SET NULL,
  field_rep_code TEXT,
  field_rep_name TEXT NOT NULL,
  market_hierarchy TEXT,
  delivery_status TEXT NOT NULL DEFAULT 'Pending', -- 'Pending' | 'Full Delivery' | 'Partial Delivery' | 'Cancelled'
  total_items INT DEFAULT 0,
  gross_amount_bdt NUMERIC(14, 2) NOT NULL DEFAULT 0,
  discount_amount_bdt NUMERIC(14, 2) DEFAULT 0,
  net_payable_bdt NUMERIC(14, 2) NOT NULL DEFAULT 0,
  collected_cash_bdt NUMERIC(14, 2) DEFAULT 0,
  due_balance_bdt NUMERIC(14, 2) DEFAULT 0,
  payment_method TEXT DEFAULT 'Cash on Delivery', -- 'Cash on Delivery' | 'MFS (bKash/Nagad)' | 'Bank Transfer' | 'Credit 30 Days'
  gps_latitude NUMERIC(10, 7),
  gps_longitude NUMERIC(10, 7),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.retailer_order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES public.retailer_orders(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES public.products(id) ON DELETE SET NULL,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  ordered_qty NUMERIC(12, 2) NOT NULL DEFAULT 1,
  delivered_qty NUMERIC(12, 2) DEFAULT 0,
  unit_price_bdt NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount_bdt NUMERIC(12, 2) DEFAULT 0,
  total_bdt NUMERIC(14, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Retailer Order Delivery Actions (Full Confirmation or Partial Delivery)
CREATE TABLE IF NOT EXISTS public.retailer_delivery_actions (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES public.retailer_orders(id) ON DELETE CASCADE,
  order_no TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'Full Confirmation' | 'Partial Delivery'
  delivered_qty NUMERIC(12, 2) NOT NULL,
  undelivered_qty NUMERIC(12, 2) DEFAULT 0,
  cash_received_bdt NUMERIC(14, 2) DEFAULT 0,
  receipt_voucher_no TEXT,
  confirmed_by TEXT NOT NULL,
  remarks TEXT,
  confirmed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Retailer Order Cancellation Reasons (Matching Screenshot 2 Screen 3)
CREATE TABLE IF NOT EXISTS public.retailer_cancellations (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES public.retailer_orders(id) ON DELETE CASCADE,
  order_no TEXT NOT NULL,
  cancellation_reason TEXT NOT NULL, -- 'Shop Closed / Owner Not Present' | 'Insufficient Cash / Funds' | 'Customer Changed Mind' | 'Duplicate Order Placed' | 'Wrong Product Ordered' | 'Pricing / Discount Dispute'
  cancelled_by TEXT NOT NULL,
  notes TEXT,
  cancelled_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 38. DISTRIBUTOR MARKET HIERARCHY BEATS (ORG HIERARCHY PAGE INTEGRATION)
-- Links directly to Org Hierarchy nodes and assigned Distributors
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.market_hierarchies (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  node_type TEXT NOT NULL DEFAULT 'Beat', -- 'Beat' | 'Market Hierarchy' | 'DB Point' | 'Territory' | 'Area' | 'Region'
  parent_code TEXT,
  division TEXT DEFAULT 'Dhaka Division',
  region TEXT DEFAULT 'Dhaka Region',
  area TEXT,
  territory TEXT,
  db_point TEXT,
  head_person TEXT,
  phone TEXT,
  assigned_distributor_ids BIGINT[] DEFAULT '{}',
  assigned_distributor_codes TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 39. PERFORMANCE INDEXES FOR STOCK & SCREENSHOT TABLES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_stock_cid_mrr ON public.stock_cid_receipts(mrr_number);
CREATE INDEX IF NOT EXISTS idx_stock_cid_wh ON public.stock_cid_receipts(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_cid_date ON public.stock_cid_receipts(receipt_date);
CREATE INDEX IF NOT EXISTS idx_stock_cid_items_receipt ON public.stock_cid_receipt_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_stock_cid_items_prod ON public.stock_cid_receipt_items(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_inv_wh ON public.stock_inventory(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_inv_prod ON public.stock_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_issues_no ON public.stock_issues(issue_number);
CREATE INDEX IF NOT EXISTS idx_stock_primary_ret_no ON public.stock_primary_returns(return_number);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_no ON public.stock_transfers(transfer_number);
CREATE INDEX IF NOT EXISTS idx_stock_adj_ref ON public.stock_adjustments(reference_no);
CREATE INDEX IF NOT EXISTS idx_requisitions_no ON public.requisitions(requisition_no);
CREATE INDEX IF NOT EXISTS idx_requisition_items_req ON public.requisition_items(requisition_id);
CREATE INDEX IF NOT EXISTS idx_retailer_orders_no ON public.retailer_orders(order_no);
CREATE INDEX IF NOT EXISTS idx_retailer_orders_ret ON public.retailer_orders(retailer_id);
CREATE INDEX IF NOT EXISTS idx_retailer_orders_dist ON public.retailer_orders(distributor_id);
CREATE INDEX IF NOT EXISTS idx_market_hierarchies_code ON public.market_hierarchies(code);

-- ============================================================================
-- 40. ROW LEVEL SECURITY (RLS) FOR ALL NEW TABLES (SAFE DYNAMIC EXECUTION)
-- Only enables RLS on tables that exist in the public schema to avoid 42P01 errors
-- ============================================================================
DO $$ 
DECLARE
  tbl text;
  target_tables text[] := ARRAY[
    'stock_cid_receipts',
    'stock_cid_receipt_items',
    'stock_inventory',
    'stock_opening_records',
    'stock_issues',
    'stock_issue_items',
    'stock_primary_returns',
    'stock_damage_returns',
    'stock_transfers',
    'stock_transfer_items',
    'stock_adjustments',
    'requisitions',
    'requisition_items',
    'retailer_orders',
    'retailer_order_items',
    'retailer_delivery_actions',
    'retailer_cancellations',
    'market_hierarchies'
  ];
BEGIN
  FOR tbl IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = ANY(target_tables)
  LOOP
    -- Safely enable RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    
    -- Authenticated full access policy
    EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated full access on %I" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Allow authenticated full access on %I" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', tbl, tbl);
    
    -- Public anon full access policy for client frontend
    EXECUTE format('DROP POLICY IF EXISTS "Allow anon full access on %I" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Allow anon full access on %I" ON public.%I FOR ALL TO anon USING (true) WITH CHECK (true)', tbl, tbl);
  END LOOP;
END $$;

-- ============================================================================
-- 41. INITIAL PRODUCTION SEEDS FOR STOCK & MASTER DATA
-- Note: CID Received Stock starts with 0 test/sample data for clean production use.
-- If you previously inserted test CID receipts, run:
-- TRUNCATE TABLE public.stock_cid_receipt_items, public.stock_cid_receipts CASCADE;
-- ============================================================================


-- 3. Seed Market Hierarchy Beats (Matching Org Hierarchy Integration)
INSERT INTO public.market_hierarchies (
  code,
  name,
  full_name,
  node_type,
  parent_code,
  division,
  region,
  area,
  territory,
  db_point,
  head_person,
  phone,
  is_active
)
VALUES
  ('BEAT-MIRPUR-01', 'Mirpur-10 Main Market Beat', 'Dhaka Division > Dhaka Region > Dhaka North > Mirpur > Mirpur-10 Main Market Beat', 'Beat', 'TERR-MIRPUR', 'Dhaka Division', 'Dhaka Region', 'Dhaka North Area', 'Mirpur Territory', 'DB Point Mirpur', 'Zubair Ahmed', '+880 1714-554433', TRUE),
  ('BEAT-PALLABI-02', 'Pallabi & Purobi Auto Electric Hub', 'Dhaka Division > Dhaka Region > Dhaka North > Mirpur > Pallabi Auto Electric Hub', 'Beat', 'TERR-MIRPUR', 'Dhaka Division', 'Dhaka Region', 'Dhaka North Area', 'Mirpur Territory', 'DB Point Pallabi', 'Fazleh Rabbi', '+880 1719-887766', TRUE),
  ('BEAT-AGRABAD-01', 'Agrabad Commercial Beat', 'Chittagong Division > Chittagong Region > Chittagong South > Agrabad Commercial Beat', 'Beat', 'REG-CTG', 'Chittagong Division', 'Chittagong Region', 'Chittagong South', 'Agrabad Territory', 'DB Point Agrabad', 'Tanvir Ahmed Chowdhury', '+880 1819-223344', TRUE),
  ('BEAT-KST-01', 'Kushtia Sadar & Poradah Market Beat', 'Khulna Division > Khulna Region > Kushtia > Kushtia Sadar & Poradah Market Beat', 'Beat', 'REG-KHU', 'Khulna Division', 'Khulna Region', 'Kushtia Area', 'Kushtia Sadar', 'DB Point Kushtia Plant', 'Mijanur Rahman', '+880 1712-998877', TRUE)
ON CONFLICT (code) DO NOTHING;

-- Requisitions and items ready for production usage (no sample data)

-- ============================================================================
-- 19. CRM AGREEMENTS & INSTITUTIONAL LEADS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.crm_agreements (
  id BIGSERIAL PRIMARY KEY,
  deal_code TEXT UNIQUE NOT NULL, -- Unique deal code e.g. 'CRM-01', 'CRM-2026-0001'
  client_name TEXT NOT NULL,      -- Project / Lead Title (e.g. Grameenphone Tower Energy Rollout)
  company_name TEXT NOT NULL,     -- Institutional Customer (e.g. Grameenphone Limited)
  contact_person TEXT,            -- Primary Contact Name
  phone TEXT NOT NULL,            -- Direct Contact Phone
  email TEXT,                     -- Contact Email
  channel TEXT DEFAULT 'Direct Corporate', -- 'Direct Corporate' | 'Tender / Institutional' | 'Govt & Semi-Govt' | 'Distributor Network'
  stage TEXT NOT NULL DEFAULT 'Lead', -- 'Lead' | 'Contacted' | 'Proposal Sent' | 'Agreement Signed' | 'Lost'
  expected_volume_units INT DEFAULT 100,
  estimated_value_bdt NUMERIC(15, 2) DEFAULT 0.00,
  deal_value_bdt NUMERIC(15, 2) DEFAULT 0.00,
  contract_term_months INT DEFAULT 12,
  salesperson_id TEXT,
  salesperson_name TEXT NOT NULL DEFAULT 'Tanvir Hossain',
  last_contact_date DATE DEFAULT CURRENT_DATE,
  expected_closing_date DATE,
  communication_notes JSONB DEFAULT '[]'::jsonb, -- Array of { date, author, note }
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'Active',                  -- 'Active' | 'Archived' | 'Suspended'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was partially created
ALTER TABLE public.crm_agreements ADD COLUMN IF NOT EXISTS deal_code TEXT;
ALTER TABLE public.crm_agreements ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE public.crm_agreements ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.crm_agreements ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE public.crm_agreements ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.crm_agreements ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.crm_agreements ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'Direct Corporate';
ALTER TABLE public.crm_agreements ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'Lead';
ALTER TABLE public.crm_agreements ADD COLUMN IF NOT EXISTS expected_volume_units INT DEFAULT 100;
ALTER TABLE public.crm_agreements ADD COLUMN IF NOT EXISTS estimated_value_bdt NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE public.crm_agreements ADD COLUMN IF NOT EXISTS deal_value_bdt NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE public.crm_agreements ADD COLUMN IF NOT EXISTS contract_term_months INT DEFAULT 12;
ALTER TABLE public.crm_agreements ADD COLUMN IF NOT EXISTS salesperson_id TEXT;
ALTER TABLE public.crm_agreements ADD COLUMN IF NOT EXISTS salesperson_name TEXT DEFAULT 'Tanvir Hossain';
ALTER TABLE public.crm_agreements ADD COLUMN IF NOT EXISTS last_contact_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.crm_agreements ADD COLUMN IF NOT EXISTS expected_closing_date DATE;
ALTER TABLE public.crm_agreements ADD COLUMN IF NOT EXISTS communication_notes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.crm_agreements ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.crm_agreements ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
ALTER TABLE public.crm_agreements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_crm_agreements_deal_code ON public.crm_agreements(deal_code);
CREATE INDEX IF NOT EXISTS idx_crm_agreements_company_name ON public.crm_agreements(company_name);
CREATE INDEX IF NOT EXISTS idx_crm_agreements_stage ON public.crm_agreements(stage);
CREATE INDEX IF NOT EXISTS idx_crm_agreements_salesperson ON public.crm_agreements(salesperson_name);
CREATE INDEX IF NOT EXISTS idx_crm_agreements_last_contact_date ON public.crm_agreements(last_contact_date);
CREATE INDEX IF NOT EXISTS idx_crm_agreements_created_at ON public.crm_agreements(created_at);

-- Row Level Security (RLS) Policies
ALTER TABLE public.crm_agreements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to crm_agreements" ON public.crm_agreements;
CREATE POLICY "Allow public read access to crm_agreements"
  ON public.crm_agreements FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert to crm_agreements" ON public.crm_agreements;
CREATE POLICY "Allow public insert to crm_agreements"
  ON public.crm_agreements FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update to crm_agreements" ON public.crm_agreements;
CREATE POLICY "Allow public update to crm_agreements"
  ON public.crm_agreements FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete to crm_agreements" ON public.crm_agreements;
CREATE POLICY "Allow public delete to crm_agreements"
  ON public.crm_agreements FOR DELETE
  USING (true);

-- Seed Initial Sample CRM Lead Agreements
INSERT INTO public.crm_agreements (
  deal_code, client_name, company_name, contact_person, phone, channel, stage,
  expected_volume_units, estimated_value_bdt, contract_term_months, salesperson_name,
  last_contact_date, communication_notes
)
VALUES
  (
    'CRM-01',
    'Grameenphone Ltd. (Tower Energy Procurement)',
    'Grameenphone Limited',
    'Brigadier General (Retd) Tariqul Islam',
    '+880 1700-112233',
    'Direct Corporate',
    'Agreement Signed',
    500,
    57500000.00,
    24,
    'Tanvir Hossain',
    '2026-10-15',
    '[{"date":"2026-09-10","author":"Tanvir Hossain","note":"Technical evaluation of ET-48100 48V 100Ah battery bank passed GP laboratory bench test."},{"date":"2026-09-25","author":"Super Admin","note":"Commercial terms finalized: 60-month warranty and 45-day payment credit cycle."},{"date":"2026-10-15","author":"Tanvir Hossain","note":"Master Service Agreement signed. Initial rollout batch of 50 units scheduled for Dhaka hub."}]'::jsonb
  ),
  (
    'CRM-02',
    'Summit Towers Bangladesh (National BTS Backup)',
    'Summit Communications Ltd.',
    'Engr. Zahidul Hassan (Head of Procurement)',
    '+880 1819-445566',
    'Direct Corporate',
    'Proposal Sent',
    200,
    23000000.00,
    12,
    'Tanvir Hossain',
    '2026-10-22',
    '[{"date":"2026-10-12","author":"Tanvir Hossain","note":"Presentation delivered at Summit Tower Tejgaon HQ. High interest in 51.2V 100Ah rack-mounted solutions."},{"date":"2026-10-22","author":"Tanvir Hossain","note":"Formal quotation submitted: BDT 115,000 per unit for 200 units with 48-month warranty."}]'::jsonb
  ),
  (
    'CRM-03',
    'Banglalink Regional BTS Expansion',
    'Banglalink Digital Communications',
    'Mustafa Kamal (Infrastructure Lead)',
    '+880 1911-223344',
    'Direct Corporate',
    'Proposal Sent',
    350,
    42000000.00,
    24,
    'Tanvir Hossain',
    '2026-10-25',
    '[{"date":"2026-10-25","author":"Tanvir Hossain","note":"Commercial proposal for 350 telecom lithium packs submitted."}]'::jsonb
  ),
  (
    'CRM-04',
    'Robi Axiata Microgrid Storage',
    'Robi Axiata Limited',
    'Ashraf Ali (Renewable Power Manager)',
    '+880 1819-998877',
    'Direct Corporate',
    'Contacted',
    200,
    24000000.00,
    12,
    'Zubair Ahmed',
    '2026-10-20',
    '[{"date":"2026-10-20","author":"Zubair Ahmed","note":"Initial technical meeting completed for solar microgrid backup in Chittagong Hill Tracts."}]'::jsonb
  ),
  (
    'CRM-05',
    'Walton Hi-Tech AGV & Electric Fleet Energy',
    'Walton Hi-Tech Industries PLC',
    'Md. Faruk Hossain (Director Logistics)',
    '+880 1677-889900',
    'Direct Corporate',
    'Contacted',
    150,
    17250000.00,
    12,
    'Tanvir Hossain',
    '2026-10-18',
    '[{"date":"2026-10-18","author":"Tanvir Hossain","note":"Factory visit conducted at Chandra complex. Walton team tested sample 48V EV pack with positive feedback."}]'::jsonb
  )
ON CONFLICT (deal_code) DO NOTHING;



-- ============================================================================
-- 15. INSTALLMENT & RECEIVABLES MANAGEMENT WITH AUTOMATED SMS & COLLECTION
-- ============================================================================

-- 1. Installment Plans Table
CREATE TABLE IF NOT EXISTS public.installment_plans (
  id TEXT PRIMARY KEY,
  agreement_no TEXT UNIQUE NOT NULL,
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_district TEXT DEFAULT 'Dhaka',
  distributor_id TEXT,
  distributor_name TEXT,
  sales_order_id TEXT,
  invoice_reference TEXT,
  product_id TEXT,
  product_name TEXT NOT NULL,
  product_model TEXT,
  quantity INTEGER DEFAULT 1,
  total_product_price_bdt NUMERIC(15, 2) NOT NULL,
  down_payment_bdt NUMERIC(15, 2) DEFAULT 0,
  financed_amount_bdt NUMERIC(15, 2) NOT NULL,
  duration_months INTEGER NOT NULL,
  interest_rate_percent NUMERIC(5, 2) DEFAULT 0,
  total_interest_bdt NUMERIC(15, 2) DEFAULT 0,
  total_payable_bdt NUMERIC(15, 2) NOT NULL,
  monthly_installment_bdt NUMERIC(15, 2) NOT NULL,
  start_date DATE NOT NULL,
  first_due_date DATE NOT NULL,
  payment_frequency TEXT DEFAULT 'Monthly',
  status TEXT DEFAULT 'Active', -- 'Active', 'Settled', 'Overdue', 'Defaulted', 'Cancelled'
  total_paid_bdt NUMERIC(15, 2) DEFAULT 0,
  total_outstanding_bdt NUMERIC(15, 2) NOT NULL,
  paid_installments_count INTEGER DEFAULT 0,
  remaining_installments_count INTEGER NOT NULL,
  overdue_installments_count INTEGER DEFAULT 0,
  overdue_amount_bdt NUMERIC(15, 2) DEFAULT 0,
  guarantor_name TEXT,
  guarantor_phone TEXT,
  guarantor_nid TEXT,
  guarantor_address TEXT,
  remarks TEXT,
  assigned_officer_id TEXT,
  assigned_officer_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Installment Schedules Table
CREATE TABLE IF NOT EXISTS public.installment_schedules (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES public.installment_plans(id) ON DELETE CASCADE,
  agreement_no TEXT NOT NULL,
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  due_amount_bdt NUMERIC(15, 2) NOT NULL,
  principal_amount_bdt NUMERIC(15, 2) NOT NULL,
  interest_amount_bdt NUMERIC(15, 2) DEFAULT 0,
  paid_amount_bdt NUMERIC(15, 2) DEFAULT 0,
  remaining_amount_bdt NUMERIC(15, 2) NOT NULL,
  status TEXT DEFAULT 'Upcoming', -- 'Paid', 'Partial', 'Upcoming', 'Due Today', 'Overdue'
  payment_date DATE,
  overdue_days INTEGER DEFAULT 0,
  late_fee_bdt NUMERIC(15, 2) DEFAULT 0,
  last_reminder_sent_at TIMESTAMPTZ,
  last_reminder_rule_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Installment Payments Table
CREATE TABLE IF NOT EXISTS public.installment_payments (
  id TEXT PRIMARY KEY,
  payment_receipt_no TEXT UNIQUE NOT NULL,
  plan_id TEXT NOT NULL REFERENCES public.installment_plans(id),
  agreement_no TEXT NOT NULL,
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  amount_bdt NUMERIC(15, 2) NOT NULL,
  payment_type TEXT DEFAULT 'Full Installment', -- 'Full Installment', 'Partial', 'Advance', 'Multiple Installments', 'Early Settlement'
  payment_method TEXT DEFAULT 'Bank Transfer', -- 'Cash', 'Bank Transfer', 'Cheque', 'bKash', 'Nagad'
  bank_account_id TEXT,
  bank_account_name TEXT,
  transaction_reference TEXT NOT NULL,
  payment_date DATE NOT NULL,
  received_by_id TEXT,
  received_by_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Installment Payment Allocations Table
CREATE TABLE IF NOT EXISTS public.installment_payment_allocations (
  id TEXT PRIMARY KEY,
  payment_id TEXT NOT NULL REFERENCES public.installment_payments(id) ON DELETE CASCADE,
  schedule_id TEXT NOT NULL REFERENCES public.installment_schedules(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  allocated_amount_bdt NUMERIC(15, 2) NOT NULL,
  principal_portion_bdt NUMERIC(15, 2) NOT NULL,
  interest_portion_bdt NUMERIC(15, 2) DEFAULT 0,
  is_fully_cleared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Installment Notifications Table
CREATE TABLE IF NOT EXISTS public.installment_notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'upcoming_due', 'overdue', 'followup_due', 'commitment_missed', 'payment_received', 'escalation'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  reference_id TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Installment Settings Table
CREATE TABLE IF NOT EXISTS public.installment_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  default_duration_months INTEGER DEFAULT 12,
  grace_period_days INTEGER DEFAULT 3,
  late_fee_type TEXT DEFAULT 'Flat',
  late_fee_amount NUMERIC(10, 2) DEFAULT 0,
  early_settlement_rebate_pct NUMERIC(5, 2) DEFAULT 5.0,
  auto_sms_enabled BOOLEAN DEFAULT TRUE,
  allow_partial_payments BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Installment Audit Logs Table
CREATE TABLE IF NOT EXISTS public.installment_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  plan_id TEXT,
  agreement_no TEXT,
  action TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Collection Assignments Table
CREATE TABLE IF NOT EXISTS public.collection_assignments (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES public.installment_plans(id) ON DELETE CASCADE,
  agreement_no TEXT NOT NULL,
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  assigned_to_id TEXT NOT NULL,
  assigned_to_name TEXT NOT NULL,
  assigned_to_role TEXT NOT NULL,
  assigned_by_id TEXT,
  assigned_by_name TEXT,
  assignment_date DATE NOT NULL,
  target_date DATE NOT NULL,
  target_amount_bdt NUMERIC(15, 2) NOT NULL,
  escalation_level TEXT DEFAULT 'Level 1 (Officer)',
  status TEXT DEFAULT 'Active', -- 'Active', 'Completed', 'Reassigned'
  priority TEXT DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Critical'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Collection Follow-ups Table
CREATE TABLE IF NOT EXISTS public.collection_followups (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES public.installment_plans(id) ON DELETE CASCADE,
  agreement_no TEXT NOT NULL,
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  activity_type TEXT NOT NULL, -- 'Phone Call', 'SMS Sent', 'WhatsApp Contact', 'Customer Visit', 'Payment Commitment', 'Payment Received', 'Customer Unreachable', 'Dispute/Complaint'
  follow_up_date DATE NOT NULL,
  next_follow_up_date DATE,
  committed_amount_bdt NUMERIC(15, 2),
  committed_payment_date DATE,
  notes TEXT NOT NULL,
  performed_by_id TEXT NOT NULL,
  performed_by_name TEXT NOT NULL,
  status TEXT DEFAULT 'Pending', -- 'Pending', 'Completed', 'Broken Commitment', 'Rescheduled'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Collection Escalations Rules Table
CREATE TABLE IF NOT EXISTS public.collection_escalations (
  id TEXT PRIMARY KEY,
  level INTEGER NOT NULL,
  name TEXT NOT NULL,
  min_overdue_days INTEGER NOT NULL,
  max_overdue_days INTEGER NOT NULL,
  escalate_to_role TEXT NOT NULL,
  action_required TEXT NOT NULL,
  auto_notification BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. SMS Templates Table
CREATE TABLE IF NOT EXISTS public.sms_templates (
  id TEXT PRIMARY KEY,
  template_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  body TEXT NOT NULL,
  available_variables JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'Active',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. SMS Automation Rules Table
CREATE TABLE IF NOT EXISTS public.sms_automation_rules (
  id TEXT PRIMARY KEY,
  rule_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  trigger_days INTEGER NOT NULL,
  template_id TEXT REFERENCES public.sms_templates(id),
  enabled BOOLEAN DEFAULT TRUE,
  channel TEXT DEFAULT 'SMS',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. SMS Sending Logs Table
CREATE TABLE IF NOT EXISTS public.sms_logs (
  id TEXT PRIMARY KEY,
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  message TEXT NOT NULL,
  template_code TEXT,
  rule_id TEXT,
  plan_id TEXT,
  agreement_no TEXT,
  status TEXT DEFAULT 'Sent', -- 'Delivered', 'Sent', 'Failed', 'Pending'
  gateway_response TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  retry_count INTEGER DEFAULT 0
);

-- 14. SMS Gateway Settings Table
CREATE TABLE IF NOT EXISTS public.sms_gateway_settings (
  id TEXT PRIMARY KEY DEFAULT 'primary_gateway',
  provider TEXT DEFAULT 'greenweb',
  api_url TEXT DEFAULT 'https://api.greenweb.com.bd/api.php',
  api_key TEXT DEFAULT '',
  sender_id TEXT DEFAULT 'ENSEC_BD',
  client_id TEXT DEFAULT 'ENSEC-CORP',
  is_configured BOOLEAN DEFAULT FALSE,
  last_tested_at TIMESTAMPTZ,
  test_status TEXT DEFAULT 'Untested',
  daily_limit INTEGER DEFAULT 1000,
  sent_today INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_installment_plans_status ON public.installment_plans(status);
CREATE INDEX IF NOT EXISTS idx_installment_plans_customer ON public.installment_plans(customer_id);
CREATE INDEX IF NOT EXISTS idx_installment_schedules_plan ON public.installment_schedules(plan_id);
CREATE INDEX IF NOT EXISTS idx_installment_schedules_due_date ON public.installment_schedules(due_date);
CREATE INDEX IF NOT EXISTS idx_installment_schedules_status ON public.installment_schedules(status);
CREATE INDEX IF NOT EXISTS idx_installment_payments_plan ON public.installment_payments(plan_id);
CREATE INDEX IF NOT EXISTS idx_collection_assignments_assigned ON public.collection_assignments(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_collection_followups_plan ON public.collection_followups(plan_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON public.sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_phone ON public.sms_logs(recipient_phone);

-- RLS Enablement & Open Access Policies for ERP Operation
ALTER TABLE public.installment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_gateway_settings ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  -- Create permissive policies for all installment tables
  EXECUTE 'CREATE POLICY "Allow public all installment_plans" ON public.installment_plans FOR ALL USING (true) WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow public all installment_schedules" ON public.installment_schedules FOR ALL USING (true) WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow public all installment_payments" ON public.installment_payments FOR ALL USING (true) WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow public all installment_payment_allocations" ON public.installment_payment_allocations FOR ALL USING (true) WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow public all installment_notifications" ON public.installment_notifications FOR ALL USING (true) WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow public all installment_settings" ON public.installment_settings FOR ALL USING (true) WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow public all installment_audit_logs" ON public.installment_audit_logs FOR ALL USING (true) WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow public all collection_assignments" ON public.collection_assignments FOR ALL USING (true) WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow public all collection_followups" ON public.collection_followups FOR ALL USING (true) WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow public all collection_escalations" ON public.collection_escalations FOR ALL USING (true) WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow public all sms_templates" ON public.sms_templates FOR ALL USING (true) WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow public all sms_automation_rules" ON public.sms_automation_rules FOR ALL USING (true) WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow public all sms_logs" ON public.sms_logs FOR ALL USING (true) WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow public all sms_gateway_settings" ON public.sms_gateway_settings FOR ALL USING (true) WITH CHECK (true)';
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- ============================================================================
-- 30. RAW MATERIAL RECEIPT & BATCH INVENTORY SCHEMA (ENSEC ERP v29 UPGRADE)
-- ============================================================================

-- Raw Material Receipts (Goods Received Note - GRN)
CREATE TABLE IF NOT EXISTS public.raw_material_receipts (
  id BIGSERIAL PRIMARY KEY,
  grn_number TEXT UNIQUE NOT NULL,
  type TEXT DEFAULT 'Local', -- 'Local' | 'Import'
  po_reference TEXT,
  supplier_id BIGINT REFERENCES public.distributors(id) ON DELETE SET NULL,
  supplier_name TEXT NOT NULL,
  warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  warehouse_name TEXT NOT NULL,
  receive_date DATE NOT NULL DEFAULT CURRENT_DATE,
  invoice_reference TEXT,
  remarks TEXT,
  total_ordered_qty NUMERIC(14, 4) DEFAULT 0,
  total_received_qty NUMERIC(14, 4) DEFAULT 0,
  total_gross_value NUMERIC(16, 2) DEFAULT 0.00,
  total_discount NUMERIC(16, 2) DEFAULT 0.00,
  total_additional_costs NUMERIC(16, 2) DEFAULT 0.00,
  total_purchase_value NUMERIC(16, 2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'Verified & Posted',
  received_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Raw Material Receipt Line Items
CREATE TABLE IF NOT EXISTS public.raw_material_receipt_items (
  id BIGSERIAL PRIMARY KEY,
  receipt_id BIGINT NOT NULL REFERENCES public.raw_material_receipts(id) ON DELETE CASCADE,
  material_id BIGINT REFERENCES public.raw_materials(id) ON DELETE RESTRICT,
  material_code TEXT NOT NULL,
  material_name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'Pieces',
  ordered_qty NUMERIC(14, 4) NOT NULL DEFAULT 0,
  received_qty NUMERIC(14, 4) NOT NULL DEFAULT 0,
  unit_purchase_rate NUMERIC(16, 4) NOT NULL DEFAULT 0.00,
  discount NUMERIC(16, 2) DEFAULT 0.00,
  additional_costs NUMERIC(16, 2) DEFAULT 0.00,
  total_purchase_value NUMERIC(16, 2) NOT NULL DEFAULT 0.00,
  batch_number TEXT NOT NULL,
  batch_barcode TEXT NOT NULL,
  warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Batches (Unique Purchase Batch with Immutable Unit Rate & Barcode)
CREATE TABLE IF NOT EXISTS public.inventory_batches (
  id BIGSERIAL PRIMARY KEY,
  batch_number TEXT UNIQUE NOT NULL,
  batch_barcode TEXT UNIQUE NOT NULL,
  material_id BIGINT REFERENCES public.raw_materials(id) ON DELETE RESTRICT,
  material_code TEXT NOT NULL,
  material_name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'Pieces',
  supplier_id BIGINT,
  supplier_name TEXT NOT NULL,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  unit_purchase_rate NUMERIC(16, 4) NOT NULL DEFAULT 0.00, -- Immutable original rate
  received_qty NUMERIC(14, 4) NOT NULL DEFAULT 0,
  issued_qty NUMERIC(14, 4) NOT NULL DEFAULT 0,
  available_qty NUMERIC(14, 4) NOT NULL DEFAULT 0,
  warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  warehouse_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active', -- 'Active', 'Depleted', 'Quarantined'
  grn_ref TEXT,
  po_ref TEXT,
  invoice_ref TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_batch_non_negative_stock CHECK (available_qty >= 0)
);

-- Inventory Movement History (Audit Trail for Receipts, Issues, Adjustments, Consumptions)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  material_id BIGINT REFERENCES public.raw_materials(id) ON DELETE RESTRICT,
  material_code TEXT NOT NULL,
  material_name TEXT NOT NULL,
  batch_number TEXT NOT NULL,
  batch_barcode TEXT,
  movement_type TEXT NOT NULL, -- 'RECEIPT', 'ISSUE', 'PRODUCTION_CONSUMPTION', 'ADJUSTMENT', 'RETURN'
  quantity NUMERIC(14, 4) NOT NULL,
  unit_cost_bdt NUMERIC(16, 4) NOT NULL DEFAULT 0.00,
  total_value_bdt NUMERIC(16, 2) NOT NULL DEFAULT 0.00,
  reference_no TEXT NOT NULL, -- GRN Number or Production Order Number
  source_warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE SET NULL,
  source_warehouse_name TEXT,
  target_warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE SET NULL,
  target_warehouse_name TEXT,
  performed_by TEXT NOT NULL,
  balance_after NUMERIC(14, 4) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bill of Materials Master (BOM)
CREATE TABLE IF NOT EXISTS public.bill_of_materials (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'Active', -- 'Active', 'Draft', 'Archived'
  expected_batch_wastage_percent NUMERIC(6, 2) DEFAULT 0.50,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safe Alter Table migration script (adds missing rich JSON & versioning columns to bill_of_materials)
ALTER TABLE public.bill_of_materials ADD COLUMN IF NOT EXISTS product_model TEXT;
ALTER TABLE public.bill_of_materials ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.bill_of_materials ADD COLUMN IF NOT EXISTS revision_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.bill_of_materials ADD COLUMN IF NOT EXISTS revisions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.bill_of_materials ADD COLUMN IF NOT EXISTS change_notes TEXT;

-- BOM Line Items
CREATE TABLE IF NOT EXISTS public.bom_items (
  id BIGSERIAL PRIMARY KEY,
  bom_id BIGINT NOT NULL REFERENCES public.bill_of_materials(id) ON DELETE CASCADE,
  material_id BIGINT NOT NULL REFERENCES public.raw_materials(id) ON DELETE RESTRICT,
  material_code TEXT NOT NULL,
  material_name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'Pieces',
  required_qty NUMERIC(14, 4) NOT NULL DEFAULT 1,
  expected_wastage_percent NUMERIC(6, 2) DEFAULT 0.00,
  unit_cost_bdt NUMERIC(16, 4) DEFAULT 0.00,
  total_item_cost_bdt NUMERIC(16, 2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Material Issues to Factory Production Orders
CREATE TABLE IF NOT EXISTS public.material_issues (
  id BIGSERIAL PRIMARY KEY,
  issue_number TEXT UNIQUE NOT NULL,
  production_order_id TEXT NOT NULL,
  production_order_number TEXT NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  warehouse_name TEXT NOT NULL,
  issued_by TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT 'Manufacturing & Assembly',
  status TEXT NOT NULL DEFAULT 'Issued',
  total_issued_qty NUMERIC(14, 4) NOT NULL DEFAULT 0,
  total_material_cost_bdt NUMERIC(16, 2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Material Issue Line Items (Linking exact Batch consumed)
CREATE TABLE IF NOT EXISTS public.material_issue_items (
  id BIGSERIAL PRIMARY KEY,
  issue_id BIGINT NOT NULL REFERENCES public.material_issues(id) ON DELETE CASCADE,
  material_id BIGINT REFERENCES public.raw_materials(id) ON DELETE RESTRICT,
  material_code TEXT NOT NULL,
  material_name TEXT NOT NULL,
  batch_number TEXT NOT NULL,
  batch_barcode TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'Pieces',
  requested_qty NUMERIC(14, 4) NOT NULL,
  issued_qty NUMERIC(14, 4) NOT NULL,
  unit_cost_bdt NUMERIC(16, 4) NOT NULL,
  total_material_cost_bdt NUMERIC(16, 2) NOT NULL,
  is_fifo_override BOOLEAN DEFAULT FALSE,
  override_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Production Consumption Records (Material cost trace by batch)
CREATE TABLE IF NOT EXISTS public.production_consumption (
  id BIGSERIAL PRIMARY KEY,
  production_order_id TEXT NOT NULL,
  production_order_number TEXT NOT NULL,
  material_id BIGINT REFERENCES public.raw_materials(id) ON DELETE RESTRICT,
  material_code TEXT NOT NULL,
  material_name TEXT NOT NULL,
  batch_number TEXT NOT NULL,
  batch_barcode TEXT NOT NULL,
  quantity NUMERIC(14, 4) NOT NULL,
  unit_cost_bdt NUMERIC(16, 4) NOT NULL,
  total_cost_bdt NUMERIC(16, 2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  issued_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Production Costs (Automatic Production Costing Engine)
CREATE TABLE IF NOT EXISTS public.production_costs (
  id BIGSERIAL PRIMARY KEY,
  production_order_id TEXT UNIQUE NOT NULL,
  order_number TEXT NOT NULL,
  product_id BIGINT REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  model TEXT,
  production_date DATE NOT NULL DEFAULT CURRENT_DATE,
  planned_qty NUMERIC(14, 4) NOT NULL,
  actual_good_qty NUMERIC(14, 4) NOT NULL,
  rejected_qty NUMERIC(14, 4) DEFAULT 0,
  raw_material_cost_bdt NUMERIC(16, 2) NOT NULL DEFAULT 0.00,
  direct_labour_cost_bdt NUMERIC(16, 2) NOT NULL DEFAULT 0.00,
  factory_overhead_cost_bdt NUMERIC(16, 2) NOT NULL DEFAULT 0.00,
  other_production_costs_bdt NUMERIC(16, 2) NOT NULL DEFAULT 0.00,
  wastage_cost_bdt NUMERIC(16, 2) NOT NULL DEFAULT 0.00,
  total_production_cost_bdt NUMERIC(16, 2) NOT NULL,
  unit_production_cost_bdt NUMERIC(16, 4) NOT NULL,
  costing_method TEXT NOT NULL DEFAULT 'FIFO', -- 'FIFO' or 'WEIGHTED_AVERAGE'
  production_batch_number TEXT NOT NULL,
  warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'Calculated', -- 'Calculated', 'Finalized', 'TransferredToFG'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Finished Goods Receipts from Factory Production
CREATE TABLE IF NOT EXISTS public.finished_goods_receipts (
  id BIGSERIAL PRIMARY KEY,
  receipt_number TEXT UNIQUE NOT NULL,
  production_order_id TEXT NOT NULL,
  production_order_number TEXT NOT NULL,
  product_id BIGINT REFERENCES public.products(id) ON DELETE RESTRICT,
  product_code TEXT,
  product_name TEXT NOT NULL,
  model TEXT,
  produced_qty NUMERIC(14, 4) NOT NULL,
  accepted_qty NUMERIC(14, 4) NOT NULL,
  rejected_qty NUMERIC(14, 4) DEFAULT 0,
  total_production_cost_bdt NUMERIC(16, 2) NOT NULL,
  unit_production_cost_bdt NUMERIC(16, 4) NOT NULL,
  production_batch_number TEXT NOT NULL,
  warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  warehouse_name TEXT NOT NULL,
  receive_date DATE NOT NULL DEFAULT CURRENT_DATE,
  received_by TEXT NOT NULL,
  valuation_total_bdt NUMERIC(16, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'Received & Stocked',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast queries and barcode scans
CREATE INDEX IF NOT EXISTS idx_batches_barcode ON public.inventory_batches(batch_barcode);
CREATE INDEX IF NOT EXISTS idx_batches_material ON public.inventory_batches(material_id, available_qty);
CREATE INDEX IF NOT EXISTS idx_batches_fifo ON public.inventory_batches(material_id, purchase_date, id);
CREATE INDEX IF NOT EXISTS idx_movements_material ON public.inventory_movements(material_id, date);
CREATE INDEX IF NOT EXISTS idx_movements_batch ON public.inventory_movements(batch_number);
CREATE INDEX IF NOT EXISTS idx_rm_receipts_grn ON public.raw_material_receipts(grn_number);
CREATE INDEX IF NOT EXISTS idx_material_issues_po ON public.material_issues(production_order_id);
CREATE INDEX IF NOT EXISTS idx_bom_product ON public.bill_of_materials(product_id);
CREATE INDEX IF NOT EXISTS idx_production_costs_po ON public.production_costs(production_order_id);
CREATE INDEX IF NOT EXISTS idx_fg_receipts_po ON public.finished_goods_receipts(production_order_id);

-- ============================================================================
-- 46. PROCUREMENT & SUPPLY CHAIN MANAGEMENT (SCM)
-- ============================================================================

-- Suppliers & Vendors Directory
CREATE TABLE IF NOT EXISTS public.suppliers (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  country TEXT DEFAULT 'Bangladesh',
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  category TEXT,
  payment_terms TEXT DEFAULT '30 Days LC',
  lead_time_days INT DEFAULT 45,
  status TEXT DEFAULT 'Active',
  balance_bdt NUMERIC(14, 2) DEFAULT 0.00,
  materials_supplied_json JSONB DEFAULT '[]'::jsonb,
  rating NUMERIC(3, 1) DEFAULT 4.5,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- International Import Purchase Orders & Joint Venture Costing
CREATE TABLE IF NOT EXISTS public.import_orders (
  id BIGSERIAL PRIMARY KEY,
  po_number TEXT UNIQUE NOT NULL,
  supplier_id BIGINT REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_name TEXT,
  lc_number TEXT,
  commercial_invoice_no TEXT,
  bl_number TEXT,
  order_date DATE DEFAULT CURRENT_DATE,
  date DATE DEFAULT CURRENT_DATE,
  container_number TEXT,
  shipping_line TEXT,
  eta_chittagong_port DATE,
  status TEXT DEFAULT 'LC Opened',
  fob_usd NUMERIC(14, 2) DEFAULT 0.00,
  exchange_rate_bdt NUMERIC(10, 4) DEFAULT 120.0000,
  custom_duty_tax_bdt NUMERIC(14, 2) DEFAULT 0.00,
  clearing_freight_bdt NUMERIC(14, 2) DEFAULT 0.00,
  total_landed_cost_bdt NUMERIC(16, 2) DEFAULT 0.00,
  ensec_share_cost_bdt NUMERIC(16, 2) DEFAULT 0.00,
  ensec_share_percent NUMERIC(5, 2) DEFAULT 50.00,
  ensec_contribution_bdt NUMERIC(16, 2) DEFAULT 0.00,
  optimum_share_cost_bdt NUMERIC(16, 2) DEFAULT 0.00,
  optimum_share_percent NUMERIC(5, 2) DEFAULT 50.00,
  optimum_contribution_bdt NUMERIC(16, 2) DEFAULT 0.00,
  items_json JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Import Order Line Items
CREATE TABLE IF NOT EXISTS public.import_order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES public.import_orders(id) ON DELETE CASCADE,
  order_po_number TEXT,
  material_id BIGINT REFERENCES public.raw_materials(id) ON DELETE SET NULL,
  material_code TEXT,
  material_name TEXT NOT NULL,
  quantity NUMERIC(14, 4) NOT NULL,
  unit TEXT DEFAULT 'KG',
  unit_price_usd NUMERIC(12, 4) DEFAULT 0.0000,
  total_usd NUMERIC(14, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 47. MANUFACTURING PRODUCTION ORDERS & JOINT VENTURE STATEMENTS
-- ============================================================================

-- Production Batch Work Orders
CREATE TABLE IF NOT EXISTS public.production_orders (
  id BIGSERIAL PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  product_id BIGINT REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  model TEXT,
  batch_number TEXT NOT NULL,
  planned_qty NUMERIC(12, 2) NOT NULL,
  completed_qty NUMERIC(12, 2) DEFAULT 0.00,
  status TEXT DEFAULT 'Planned',
  start_date DATE DEFAULT CURRENT_DATE,
  target_date DATE,
  manufacturing_date DATE,
  date DATE DEFAULT CURRENT_DATE,
  shift_manager TEXT,
  notes TEXT,
  raw_material_cost_bdt NUMERIC(16, 2) DEFAULT 0.00,
  conversion_cost_bdt NUMERIC(16, 2) DEFAULT 0.00,
  total_production_cost_bdt NUMERIC(16, 2) DEFAULT 0.00,
  cost_per_unit_bdt NUMERIC(14, 4) DEFAULT 0.0000,
  wastage_percent NUMERIC(5, 2) DEFAULT 0.00,
  scrap_kg NUMERIC(10, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optimum Joint Venture Running Financial Statement
CREATE TABLE IF NOT EXISTS public.optimum_statement (
  id BIGSERIAL PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE,
  transaction_type TEXT NOT NULL,
  type TEXT,
  reference TEXT,
  debit_ensec_bdt NUMERIC(14, 2) DEFAULT 0.00,
  credit_optimum_bdt NUMERIC(14, 2) DEFAULT 0.00,
  running_balance_bdt NUMERIC(14, 2) DEFAULT 0.00,
  debit_bdt NUMERIC(14, 2) DEFAULT 0.00,
  credit_bdt NUMERIC(14, 2) DEFAULT 0.00,
  balance_bdt NUMERIC(14, 2) DEFAULT 0.00,
  notes TEXT,
  description TEXT,
  status TEXT DEFAULT 'Verified',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 48. MULTI-WAREHOUSE STOCK LEDGER
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.stock_ledger (
  id BIGSERIAL PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE,
  warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE SET NULL,
  warehouse_name TEXT,
  reference_doc TEXT,
  reference_no TEXT,
  transaction_type TEXT NOT NULL,
  product_id BIGINT REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT,
  in_qty NUMERIC(12, 2) DEFAULT 0.00,
  qty_in NUMERIC(12, 2) DEFAULT 0.00,
  out_qty NUMERIC(12, 2) DEFAULT 0.00,
  qty_out NUMERIC(12, 2) DEFAULT 0.00,
  balance_qty NUMERIC(12, 2) DEFAULT 0.00,
  unit_cost_bdt NUMERIC(14, 4) DEFAULT 0.00,
  total_cost_bdt NUMERIC(16, 2) DEFAULT 0.00,
  batch_number TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 49. FIELD FORCE GPS VISITS & ROUTE ACTIVITY
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.visit_logs (
  id BIGSERIAL PRIMARY KEY,
  rep_id TEXT NOT NULL,
  rep_name TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  date DATE DEFAULT CURRENT_DATE,
  time TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  visit_type TEXT DEFAULT 'Scheduled Visit',
  purpose TEXT,
  is_productive BOOLEAN DEFAULT FALSE,
  check_in_location TEXT,
  notes TEXT,
  feedback TEXT,
  order_booked_amount_bdt NUMERIC(12, 2) DEFAULT 0.00,
  order_placed_bdt NUMERIC(12, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 50. FINANCIAL SETTLEMENTS & GENERAL PAYMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payments (
  id BIGSERIAL PRIMARY KEY,
  tran_no TEXT UNIQUE NOT NULL,
  tran_date DATE DEFAULT CURRENT_DATE,
  sales_order_id TEXT,
  distributor_id TEXT,
  distributor_name TEXT,
  customer_id TEXT,
  customer_name TEXT,
  requested_by TEXT,
  requested_by_id TEXT,
  payment_method TEXT DEFAULT 'Cash',
  payment_mode TEXT,
  bank_id TEXT,
  bank_name TEXT,
  department_id TEXT,
  department_name TEXT,
  department TEXT,
  out_account_name TEXT,
  amount_bdt NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  payment_amount NUMERIC(14, 2) DEFAULT 0.00,
  approved_amount NUMERIC(14, 2) DEFAULT 0.00,
  instrument_number TEXT,
  cheque_no_receipt_no TEXT,
  invoice_no TEXT,
  payment_date DATE,
  status TEXT DEFAULT 'Submitted',
  approved_by TEXT,
  approved_date TIMESTAMPTZ,
  remarks TEXT,
  description TEXT,
  document_image TEXT,
  creation_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 51. HUMAN RESOURCES & PAYROLL RECORDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payroll_records (
  id BIGSERIAL PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  designation TEXT NOT NULL,
  department TEXT,
  month_year TEXT NOT NULL,
  basic_salary_bdt NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  house_rent_bdt NUMERIC(12, 2) DEFAULT 0.00,
  medical_allowance_bdt NUMERIC(12, 2) DEFAULT 0.00,
  sales_commission_bdt NUMERIC(12, 2) DEFAULT 0.00,
  sales_incentive_bdt NUMERIC(12, 2) DEFAULT 0.00,
  tada_reimbursement_bdt NUMERIC(12, 2) DEFAULT 0.00,
  ta_da_bdt NUMERIC(12, 2) DEFAULT 0.00,
  conveyance_allowance_bdt NUMERIC(12, 2) DEFAULT 0.00,
  mobile_allowance_bdt NUMERIC(12, 2) DEFAULT 0.00,
  deductions_bdt NUMERIC(12, 2) DEFAULT 0.00,
  tax_deduction_bdt NUMERIC(12, 2) DEFAULT 0.00,
  provident_fund_bdt NUMERIC(12, 2) DEFAULT 0.00,
  target_bdt NUMERIC(14, 2) DEFAULT 0.00,
  achievement_percent NUMERIC(6, 2) DEFAULT 0.00,
  achievement_bdt NUMERIC(14, 2) DEFAULT 0.00,
  net_payable_bdt NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  status TEXT DEFAULT 'Pending Review',
  payment_status TEXT DEFAULT 'Pending Review',
  payment_date DATE,
  disbursed_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 52. SYSTEM AUDIT LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  details TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 53. CASH & BANK ACCOUNTING MODULE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cash_bank_accounts (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL, -- 'Cash' | 'Bank'
  name TEXT NOT NULL,
  account_number TEXT,
  bank_name TEXT,
  branch_name TEXT,
  routing_number TEXT,
  currency TEXT DEFAULT 'BDT',
  current_balance_bdt NUMERIC(14, 2) DEFAULT 0.00,
  opening_balance_bdt NUMERIC(14, 2) DEFAULT 0.00,
  opening_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'Active',
  is_default BOOLEAN DEFAULT FALSE,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cash_bank_transactions (
  id BIGSERIAL PRIMARY KEY,
  voucher_no TEXT UNIQUE NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  type TEXT NOT NULL,
  account_type TEXT NOT NULL,
  account_id TEXT NOT NULL,
  account_name TEXT NOT NULL,
  target_account_id TEXT,
  target_account_name TEXT,
  category TEXT NOT NULL,
  party_name TEXT,
  service_ref TEXT,
  invoice_no TEXT,
  sales_order_id TEXT,
  reference_no TEXT,
  description TEXT,
  debit NUMERIC(14, 2) DEFAULT 0.00,
  credit NUMERIC(14, 2) DEFAULT 0.00,
  amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  running_balance NUMERIC(14, 2) DEFAULT 0.00,
  attachment_url TEXT,
  attachment_name TEXT,
  remarks TEXT,
  created_by TEXT,
  status TEXT DEFAULT 'Posted',
  is_contra BOOLEAN DEFAULT FALSE,
  reversal_of_id TEXT,
  reversal_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.opening_balance_configs (
  id BIGSERIAL PRIMARY KEY,
  account_type TEXT NOT NULL,
  account_id TEXT NOT NULL,
  account_name TEXT NOT NULL,
  opening_date DATE DEFAULT CURRENT_DATE,
  initial_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  remarks TEXT,
  configured_by TEXT,
  configured_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.expense_categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  is_system BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.service_income_categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  is_system BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 54. WARRANTY RMA & BATTERY SERVICE CENTER OPERATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.battery_receiving_records (
  id BIGSERIAL PRIMARY KEY,
  ticket_id TEXT,
  ticket_number TEXT,
  receiving_date DATE DEFAULT CURRENT_DATE,
  receiving_receipt_number TEXT UNIQUE NOT NULL,
  battery_brand TEXT DEFAULT 'Ensec Lithium BD',
  serial_number TEXT NOT NULL,
  customer_name TEXT,
  delivery_method TEXT,
  courier_tracking TEXT,
  received_by TEXT,
  physical_condition TEXT,
  notes TEXT,
  battery_model TEXT,
  initial_voltage NUMERIC(6, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.technical_inspections (
  id BIGSERIAL PRIMARY KEY,
  ticket_id TEXT,
  ticket_number TEXT,
  serial_number TEXT,
  technician_name TEXT NOT NULL,
  inspection_date DATE DEFAULT CURRENT_DATE,
  is_safety_hold BOOLEAN DEFAULT FALSE,
  safety_hold_reason TEXT,
  voltage_reading NUMERIC(6, 2),
  tested_voltage NUMERIC(6, 2),
  internal_resistance NUMERIC(8, 2),
  tested_internal_resistance NUMERIC(8, 2),
  cell_condition TEXT,
  bms_condition TEXT,
  bms_diagnostic_result TEXT,
  root_cause_description TEXT,
  recommended_action TEXT,
  findings TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.service_job_cards (
  id BIGSERIAL PRIMARY KEY,
  ticket_id TEXT,
  ticket_number TEXT,
  job_card_number TEXT UNIQUE NOT NULL,
  technician_id TEXT,
  technician_name TEXT NOT NULL,
  assigned_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'In Progress',
  work_description TEXT,
  parts_replaced_json JSONB DEFAULT '[]'::jsonb,
  labor_hours NUMERIC(6, 2) DEFAULT 0.00,
  labor_cost_bdt NUMERIC(10, 2) DEFAULT 0.00,
  total_service_cost_bdt NUMERIC(12, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.service_invoices (
  id BIGSERIAL PRIMARY KEY,
  ticket_id TEXT,
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_date DATE DEFAULT CURRENT_DATE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  subtotal_bdt NUMERIC(12, 2) DEFAULT 0.00,
  discount_bdt NUMERIC(12, 2) DEFAULT 0.00,
  vat_bdt NUMERIC(12, 2) DEFAULT 0.00,
  total_bdt NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  paid_bdt NUMERIC(12, 2) DEFAULT 0.00,
  due_bdt NUMERIC(12, 2) DEFAULT 0.00,
  payment_status TEXT DEFAULT 'Unpaid',
  payment_method TEXT DEFAULT 'Cash',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.service_payments (
  id BIGSERIAL PRIMARY KEY,
  invoice_id TEXT,
  ticket_id TEXT,
  receipt_no TEXT UNIQUE NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  amount_bdt NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  payment_method TEXT DEFAULT 'Cash',
  transaction_reference TEXT,
  received_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.warranty_delivery_dispatches (
  id BIGSERIAL PRIMARY KEY,
  ticket_id TEXT,
  ticket_number TEXT,
  dispatch_number TEXT UNIQUE NOT NULL,
  dispatch_date DATE DEFAULT CURRENT_DATE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  delivery_address TEXT,
  courier_name TEXT,
  tracking_number TEXT,
  dispatched_by TEXT,
  status TEXT DEFAULT 'Dispatched',
  received_confirmation BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 55. GLOBAL ROW-LEVEL SECURITY (RLS) & PUBLIC ACCESS POLICIES
-- ============================================================================

DO $$
DECLARE
  tbl text;
  all_tables text[] := ARRAY[
    'users', 'warehouses', 'distributors', 'customers', 'products',
    'raw_material_classifications', 'raw_material_categories', 'raw_materials',
    'sales_orders', 'tada_claims', 'warranty_tickets', 'attendance_logs',
    'cash_book_entries', 'product_categories', 'product_brands',
    'customer_categories', 'org_hierarchy', 'departments', 'banks',
    'units_of_measurement', 'field_force_reps', 'offers_promotions',
    'stock_cid_receipts', 'stock_cid_receipt_items', 'stock_inventory',
    'stock_opening_records', 'stock_issues', 'stock_issue_items',
    'stock_primary_returns', 'stock_damage_returns', 'stock_transfers',
    'stock_transfer_items', 'stock_adjustments', 'requisitions',
    'requisition_items', 'retailer_orders', 'retailer_order_items',
    'retailer_delivery_actions', 'retailer_cancellations', 'market_hierarchies',
    'crm_agreements', 'installment_plans', 'installment_schedules',
    'installment_payments', 'installment_payment_allocations',
    'installment_notifications', 'installment_settings', 'installment_audit_logs',
    'collection_assignments', 'collection_followups', 'collection_escalations',
    'sms_templates', 'sms_automation_rules', 'sms_logs', 'sms_gateway_settings',
    'raw_material_receipts', 'raw_material_receipt_items', 'inventory_batches',
    'inventory_movements', 'bill_of_materials', 'bom_items', 'material_issues',
    'material_issue_items', 'production_consumption', 'production_costs',
    'finished_goods_receipts', 'suppliers', 'import_orders', 'import_order_items',
    'production_orders', 'optimum_statement', 'stock_ledger', 'visit_logs',
    'payments', 'payroll_records', 'audit_logs', 'cash_bank_accounts',
    'cash_bank_transactions', 'opening_balance_configs', 'expense_categories',
    'service_income_categories', 'battery_receiving_records', 'technical_inspections',
    'service_job_cards', 'service_invoices', 'service_payments', 'warranty_delivery_dispatches'
  ];
BEGIN
  FOREACH tbl IN ARRAY all_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = tbl AND policyname = 'Allow public access'
      ) THEN
        EXECUTE format('CREATE POLICY "Allow public access" ON public.%I FOR ALL USING (true) WITH CHECK (true)', tbl);
      END IF;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- 56. DATABASE PERMISSIONS & SUPABASE REALTIME REPLICATION
-- ============================================================================

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

-- ============================================================================
-- 41. MANUFACTURING EXPENSE MANAGEMENT & PRODUCTION COST ALLOCATION
-- Supports Factory Overhead & Business Expenses posting and batch allocation
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.expense_entries (
  id TEXT PRIMARY KEY,
  voucher_number TEXT UNIQUE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  cost_center TEXT NOT NULL,
  department TEXT NOT NULL,
  factory_warehouse TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  allocated_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  unallocated_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  bank_account_id TEXT,
  bank_account_name TEXT,
  description TEXT NOT NULL,
  supporting_document TEXT,
  approval_status TEXT NOT NULL DEFAULT 'Approved',
  is_factory_expense BOOLEAN NOT NULL DEFAULT false,
  is_direct_cost BOOLEAN NOT NULL DEFAULT false,
  production_batch_ref TEXT,
  posted_by TEXT NOT NULL,
  approved_by TEXT,
  accounting_entries JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.production_cost_allocations (
  id TEXT PRIMARY KEY,
  allocation_number TEXT UNIQUE NOT NULL,
  expense_entry_id TEXT NOT NULL REFERENCES public.expense_entries(id) ON DELETE CASCADE,
  expense_voucher_number TEXT NOT NULL,
  expense_category TEXT NOT NULL,
  expense_subcategory TEXT NOT NULL,
  total_expense_amount NUMERIC(14, 2) NOT NULL,
  allocated_amount NUMERIC(14, 2) NOT NULL,
  allocation_method TEXT NOT NULL,
  allocation_basis_value NUMERIC(12, 2) NOT NULL,
  production_order_id TEXT NOT NULL,
  production_batch_number TEXT NOT NULL,
  product_model TEXT NOT NULL,
  allocation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  allocated_by TEXT NOT NULL,
  accounting_journal JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expense_entries_voucher ON public.expense_entries(voucher_number);
CREATE INDEX IF NOT EXISTS idx_expense_entries_date ON public.expense_entries(date);
CREATE INDEX IF NOT EXISTS idx_expense_entries_category ON public.expense_entries(category);
CREATE INDEX IF NOT EXISTS idx_expense_entries_factory ON public.expense_entries(is_factory_expense);
CREATE INDEX IF NOT EXISTS idx_prod_alloc_batch ON public.production_cost_allocations(production_batch_number);
CREATE INDEX IF NOT EXISTS idx_prod_alloc_exp ON public.production_cost_allocations(expense_entry_id);

GRANT ALL ON public.expense_entries TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.production_cost_allocations TO postgres, anon, authenticated, service_role;

-- Row Level Security (RLS) Policies for Expense Entries and Cost Allocations
ALTER TABLE public.expense_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access" ON public.expense_entries;
CREATE POLICY "Allow public access" ON public.expense_entries FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.production_cost_allocations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access" ON public.production_cost_allocations;
CREATE POLICY "Allow public access" ON public.production_cost_allocations FOR ALL USING (true) WITH CHECK (true);


-- Enable Supabase Realtime Replication publication for reactive front-end sync
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE
        public.users,
        public.warehouses,
        public.distributors,
        public.customers,
        public.products,
        public.raw_materials,
        public.sales_orders,
        public.warranty_tickets,
        public.stock_inventory,
        public.stock_cid_receipts,
        public.crm_agreements,
        public.installment_plans,
        public.installment_schedules,
        public.installment_payments,
        public.cash_bank_transactions,
        public.cash_bank_accounts,
        public.production_orders,
        public.expense_entries,
        public.production_cost_allocations;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    WHEN undefined_table THEN
      NULL;
    END;
  END IF;
END $$;

-- ============================================================================
-- 48. CENTRAL EMPLOYEE & COMPREHENSIVE PAYROLL MANAGEMENT
-- ============================================================================

-- Add Central Employee Extended Columns to field_force_reps
ALTER TABLE IF EXISTS public.field_force_reps
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS employee_category TEXT DEFAULT 'Office Employee',
  ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'Full Time',
  ADD COLUMN IF NOT EXISTS employment_status TEXT DEFAULT 'Active',
  ADD COLUMN IF NOT EXISTS present_address TEXT,
  ADD COLUMN IF NOT EXISTS permanent_address TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_relation TEXT,
  ADD COLUMN IF NOT EXISTS reporting_manager_id TEXT,
  ADD COLUMN IF NOT EXISTS reporting_manager_name TEXT,
  ADD COLUMN IF NOT EXISTS branch_workplace TEXT DEFAULT 'Head Office - Gulshan, Dhaka',
  ADD COLUMN IF NOT EXISTS bank_name TEXT DEFAULT 'City Bank PLC',
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_branch TEXT DEFAULT 'Gulshan Avenue',
  ADD COLUMN IF NOT EXISTS routing_number TEXT,
  ADD COLUMN IF NOT EXISTS mobile_banking_provider TEXT DEFAULT 'bKash',
  ADD COLUMN IF NOT EXISTS mobile_banking_number TEXT,
  ADD COLUMN IF NOT EXISTS national_id TEXT,
  ADD COLUMN IF NOT EXISTS resignation_date DATE,
  ADD COLUMN IF NOT EXISTS user_id TEXT;

-- 1. Employee Salary Structures Master
CREATE TABLE IF NOT EXISTS public.employee_salary_structures (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_code TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  basic_salary_bdt NUMERIC(14, 2) NOT NULL DEFAULT 30000.00,
  house_rent_bdt NUMERIC(14, 2) NOT NULL DEFAULT 15000.00,
  medical_allowance_bdt NUMERIC(14, 2) NOT NULL DEFAULT 3000.00,
  conveyance_allowance_bdt NUMERIC(14, 2) NOT NULL DEFAULT 4000.00,
  mobile_allowance_bdt NUMERIC(14, 2) NOT NULL DEFAULT 2000.00,
  special_allowance_bdt NUMERIC(14, 2) DEFAULT 0.00,
  other_allowances_bdt NUMERIC(14, 2) DEFAULT 0.00,
  gross_salary_bdt NUMERIC(14, 2) NOT NULL DEFAULT 54000.00,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  history_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Daily Attendance Records
CREATE TABLE IF NOT EXISTS public.employee_attendances (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_code TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Present',
  in_time TEXT,
  out_time TEXT,
  overtime_hours NUMERIC(5, 2) DEFAULT 0.00,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_emp_date UNIQUE (employee_id, date)
);

-- 3. Employee Leave Applications
CREATE TABLE IF NOT EXISTS public.employee_leaves (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_code TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  leave_type TEXT NOT NULL DEFAULT 'Casual Leave',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INT NOT NULL DEFAULT 1,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT
);

-- 4. Employee Advances & Loans (Benchmark: ৳60,000 / 6 Months @ ৳10,000/mo)
CREATE TABLE IF NOT EXISTS public.employee_advances_loans (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_code TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  loan_type TEXT NOT NULL DEFAULT 'Employee Loan',
  principal_amount_bdt NUMERIC(14, 2) NOT NULL,
  repayment_tenure_months INT NOT NULL DEFAULT 6,
  monthly_deduction_bdt NUMERIC(14, 2) NOT NULL,
  deduction_start_month_year TEXT NOT NULL,
  repaid_amount_bdt NUMERIC(14, 2) DEFAULT 0.00,
  remaining_amount_bdt NUMERIC(14, 2) NOT NULL,
  purpose TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  applied_date DATE NOT NULL DEFAULT CURRENT_DATE,
  approved_by TEXT,
  approval_date DATE,
  remarks TEXT,
  schedule_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Overtime Records
CREATE TABLE IF NOT EXISTS public.employee_overtimes (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_code TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  date DATE NOT NULL,
  month_year TEXT NOT NULL,
  hours NUMERIC(5, 2) NOT NULL,
  rate_per_hour_bdt NUMERIC(10, 2) NOT NULL,
  total_amount_bdt NUMERIC(12, 2) NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Bonuses & Sales Commission Incentives
CREATE TABLE IF NOT EXISTS public.employee_bonuses (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_code TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  bonus_type TEXT NOT NULL DEFAULT 'Festival Bonus',
  month_year TEXT NOT NULL,
  amount_bdt NUMERIC(14, 2) NOT NULL,
  remarks TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Monthly Payroll Runs
CREATE TABLE IF NOT EXISTS public.monthly_payroll_runs (
  id TEXT PRIMARY KEY,
  month_year TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft',
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  processed_by TEXT NOT NULL,
  finalized_at TIMESTAMPTZ,
  finalized_by TEXT,
  total_employees INT NOT NULL DEFAULT 0,
  total_gross_bdt NUMERIC(16, 2) NOT NULL DEFAULT 0.00,
  total_net_bdt NUMERIC(16, 2) NOT NULL DEFAULT 0.00,
  total_deductions_bdt NUMERIC(16, 2) NOT NULL DEFAULT 0.00,
  total_overtime_bdt NUMERIC(16, 2) NOT NULL DEFAULT 0.00,
  total_bonus_bdt NUMERIC(16, 2) NOT NULL DEFAULT 0.00,
  total_loan_deductions_bdt NUMERIC(16, 2) NOT NULL DEFAULT 0.00,
  total_pf_deductions_bdt NUMERIC(16, 2) NOT NULL DEFAULT 0.00,
  total_tax_deductions_bdt NUMERIC(16, 2) NOT NULL DEFAULT 0.00,
  items_json JSONB DEFAULT '[]'::jsonb
);

-- 8. Salary Disbursements & Payments
CREATE TABLE IF NOT EXISTS public.salary_payments (
  id TEXT PRIMARY KEY,
  payroll_run_id TEXT NOT NULL,
  month_year TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  employee_code TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_bdt NUMERIC(14, 2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'Bank Transfer',
  bank_account_name TEXT DEFAULT 'City Bank PLC',
  transaction_reference TEXT,
  disbursed_by TEXT NOT NULL,
  remarks TEXT,
  status TEXT NOT NULL DEFAULT 'Completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Payroll Engine Settings
CREATE TABLE IF NOT EXISTS public.payroll_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  standard_working_days_per_month INT DEFAULT 26,
  standard_daily_hours INT DEFAULT 8,
  overtime_config JSONB DEFAULT '{"hourlyRateMultiplier": 1.5}'::jsonb,
  leave_quotas JSONB DEFAULT '{"annualLeave": 14, "casualLeave": 10, "sickLeave": 14, "maternityLeave": 112}'::jsonb,
  deduction_rules JSONB DEFAULT '{"absentDayDeductionMultiplier": 1.0, "lateDeductionRules": "3 late marks equal 1 day deduction", "latePenaltyEnabled": true, "incomeTaxEnabled": true, "providentFundEnabled": true, "pfEmployeeContributionPercent": 10, "pfEmployerContributionPercent": 10}'::jsonb,
  salary_components JSONB DEFAULT '{"houseRentPercent": 50, "medicalAllowancePercent": 10}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payroll Indexes
CREATE INDEX IF NOT EXISTS idx_emp_salary_str_empid ON public.employee_salary_structures(employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_att_date ON public.employee_attendances(date);
CREATE INDEX IF NOT EXISTS idx_emp_att_empid ON public.employee_attendances(employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_leaves_empid ON public.employee_leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_loans_empid ON public.employee_advances_loans(employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_ot_month ON public.employee_overtimes(month_year);
CREATE INDEX IF NOT EXISTS idx_emp_bns_month ON public.employee_bonuses(month_year);
CREATE INDEX IF NOT EXISTS idx_monthly_pay_month ON public.monthly_payroll_runs(month_year);
CREATE INDEX IF NOT EXISTS idx_sal_pay_run ON public.salary_payments(payroll_run_id);

-- Grants
GRANT ALL ON public.employee_salary_structures TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.employee_attendances TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.employee_leaves TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.employee_advances_loans TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.employee_overtimes TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.employee_bonuses TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.monthly_payroll_runs TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.salary_payments TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.payroll_settings TO postgres, anon, authenticated, service_role;

-- Enable Realtime for Payroll Tables
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE
        public.employee_salary_structures,
        public.employee_attendances,
        public.employee_leaves,
        public.employee_advances_loans,
        public.employee_overtimes,
        public.employee_bonuses,
        public.monthly_payroll_runs,
        public.salary_payments,
        public.payroll_settings;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    WHEN undefined_table THEN
      NULL;
    END;
  END IF;
END $$;

-- ============================================================================
-- OVERTIME MANAGEMENT MODULE TABLES & AUDIT ENGINE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.overtime_policies (
  id TEXT PRIMARY KEY,
  policy_name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT true,
  department TEXT DEFAULT 'All Departments',
  standard_working_days_per_month NUMERIC(5, 2) NOT NULL DEFAULT 26,
  standard_daily_working_hours NUMERIC(5, 2) NOT NULL DEFAULT 8,
  standard_monthly_working_hours NUMERIC(6, 2) NOT NULL DEFAULT 208,
  wage_basis TEXT NOT NULL DEFAULT 'BASIC_ONLY',
  overtime_multiplier_regular NUMERIC(4, 2) NOT NULL DEFAULT 2.0,
  overtime_multiplier_weekend NUMERIC(4, 2) NOT NULL DEFAULT 2.0,
  overtime_multiplier_holiday NUMERIC(4, 2) NOT NULL DEFAULT 2.5,
  overtime_multiplier_night_shift NUMERIC(4, 2) NOT NULL DEFAULT 2.2,
  minimum_ot_minutes_threshold INTEGER NOT NULL DEFAULT 30,
  max_ot_hours_per_day NUMERIC(5, 2) NOT NULL DEFAULT 4.0,
  max_ot_hours_per_month NUMERIC(6, 2) NOT NULL DEFAULT 60.0,
  allow_overnight_overtime BOOLEAN NOT NULL DEFAULT true,
  require_supervisor_pre_approval BOOLEAN NOT NULL DEFAULT true,
  updated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.overtime_requests (
  id TEXT PRIMARY KEY,
  request_number TEXT UNIQUE NOT NULL,
  employee_id TEXT NOT NULL,
  employee_code TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  department TEXT NOT NULL,
  designation TEXT NOT NULL,
  employee_category TEXT DEFAULT 'Factory Employee',
  overtime_date DATE NOT NULL,
  purpose_category TEXT NOT NULL DEFAULT 'Direct Production',
  production_order_id TEXT,
  production_order_number TEXT,
  production_batch_number TEXT,
  product_name TEXT,
  project_purpose TEXT NOT NULL,
  expected_start_time TEXT NOT NULL,
  expected_end_time TEXT NOT NULL,
  expected_hours NUMERIC(5, 2) NOT NULL,
  overtime_reason TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'Pending Supervisor',
  supervisor_id TEXT,
  supervisor_name TEXT,
  supervisor_approved_at TIMESTAMPTZ,
  supervisor_remarks TEXT,
  production_manager_id TEXT,
  production_manager_name TEXT,
  production_approved_at TIMESTAMPTZ,
  production_remarks TEXT,
  hr_verifier_id TEXT,
  hr_verifier_name TEXT,
  hr_verified_at TIMESTAMPTZ,
  hr_remarks TEXT,
  final_approver_id TEXT,
  final_approver_name TEXT,
  final_approved_at TIMESTAMPTZ,
  final_remarks TEXT,
  rejection_reason TEXT,
  rejected_by TEXT,
  rejected_at TIMESTAMPTZ,
  attendance_id TEXT,
  actual_overtime_hours NUMERIC(5, 2) DEFAULT 0,
  basic_salary_bdt NUMERIC(14, 2) DEFAULT 0,
  hourly_rate_bdt NUMERIC(10, 2) DEFAULT 0,
  overtime_multiplier NUMERIC(4, 2) DEFAULT 2.0,
  calculated_overtime_amount_bdt NUMERIC(14, 2) DEFAULT 0,
  is_payroll_processed BOOLEAN NOT NULL DEFAULT false,
  payroll_run_id TEXT,
  payroll_month TEXT,
  is_costing_allocated BOOLEAN NOT NULL DEFAULT false,
  costing_allocation_batch TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.overtime_attendances (
  id TEXT PRIMARY KEY,
  request_id TEXT REFERENCES public.overtime_requests(id) ON DELETE SET NULL,
  request_number TEXT,
  employee_id TEXT NOT NULL,
  employee_code TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  department TEXT NOT NULL,
  designation TEXT NOT NULL,
  date DATE NOT NULL,
  normal_check_in_time TEXT NOT NULL DEFAULT '09:00',
  normal_check_out_time TEXT NOT NULL DEFAULT '18:00',
  overtime_check_in_time TEXT NOT NULL,
  overtime_check_out_time TEXT NOT NULL,
  is_overnight BOOLEAN NOT NULL DEFAULT false,
  break_duration_minutes INTEGER NOT NULL DEFAULT 0,
  raw_calculated_hours NUMERIC(5, 2) NOT NULL DEFAULT 0,
  actual_overtime_hours NUMERIC(5, 2) NOT NULL DEFAULT 0,
  verified_by TEXT,
  verification_date TIMESTAMPTZ,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verification_remarks TEXT,
  is_late_check_out_alert BOOLEAN NOT NULL DEFAULT false,
  is_missing_check_out_alert BOOLEAN NOT NULL DEFAULT false,
  is_duplicate_entry_alert BOOLEAN NOT NULL DEFAULT false,
  biometric_device_id TEXT,
  raw_biometric_punch_id TEXT,
  sync_source TEXT NOT NULL DEFAULT 'Manual',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.overtime_batch_allocations (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES public.overtime_requests(id) ON DELETE CASCADE,
  production_order_id TEXT,
  production_order_number TEXT NOT NULL,
  production_batch_number TEXT NOT NULL,
  product_id TEXT,
  product_name TEXT NOT NULL,
  process_type TEXT NOT NULL,
  allocated_hours NUMERIC(5, 2) NOT NULL,
  hourly_rate_bdt NUMERIC(10, 2) NOT NULL,
  allocated_cost_bdt NUMERIC(14, 2) NOT NULL,
  is_overhead BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.overtime_audit_logs (
  id TEXT PRIMARY KEY,
  record_id TEXT NOT NULL,
  record_type TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_id TEXT,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  details TEXT NOT NULL,
  previous_state TEXT,
  new_state TEXT
);

ALTER TABLE public.overtime_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overtime_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overtime_attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overtime_batch_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overtime_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all overtime_policies" ON public.overtime_policies FOR ALL USING (true);
CREATE POLICY "Allow public all overtime_requests" ON public.overtime_requests FOR ALL USING (true);
CREATE POLICY "Allow public all overtime_attendances" ON public.overtime_attendances FOR ALL USING (true);
CREATE POLICY "Allow public all overtime_batch_allocations" ON public.overtime_batch_allocations FOR ALL USING (true);
CREATE POLICY "Allow public all overtime_audit_logs" ON public.overtime_audit_logs FOR ALL USING (true);

GRANT ALL ON public.overtime_policies TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.overtime_requests TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.overtime_attendances TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.overtime_batch_allocations TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.overtime_audit_logs TO postgres, anon, authenticated, service_role;

-- ============================================================================
-- 41. PRODUCTION DATABASE SECURITY HARDENING & ACCESS CONTROL (AUDIT REMEDIATION)
-- ============================================================================
-- NOTE: In production environments, sensitive tables such as `users`,
-- `cash_book_entries`, `salary_payments`, and `monthly_payroll_runs` should NOT
-- permit unrestricted anonymous write/dump access.
--
-- Execute the following security hardening statements in the Supabase SQL Editor
-- to protect sensitive user credentials and business records:

-- A. Restrict Users Table Access:
-- Anonymous callers should only be able to authenticate (SELECT uid, email, password match),
-- but should NOT be able to list/dump all records or alter administrator accounts.
CREATE OR REPLACE VIEW public.safe_users AS
  SELECT id, uid, user_id, name, email, phone, role, designation, department,
         region, area, territory, is_salesman, salesman_code, status, permissions,
         created_at, updated_at
  FROM public.users;

-- B. Revoke Public TRUNCATE/DROP permissions:
REVOKE TRUNCATE, TRIGGER ON ALL TABLES IN SCHEMA public FROM anon;

-- C. Sensitive Financial and Payroll Table Protection:
-- Revoke unrestricted DELETE from anon role on critical ledger tables:
REVOKE DELETE ON public.cash_book_entries FROM anon;
REVOKE DELETE ON public.salary_payments FROM anon;
REVOKE DELETE ON public.monthly_payroll_runs FROM anon;
REVOKE DELETE ON public.users FROM anon;

-- ============================================================================
-- 42. EMPLOYEE-WISE OVERTIME POLICY EXTENSIONS (ENSEC ERP OVERTIME UPGRADE)
-- Migrates from global overtime policy to employee-level policies in Field Force Master
-- ============================================================================
ALTER TABLE public.field_force_reps ADD COLUMN IF NOT EXISTS is_overtime_eligible BOOLEAN DEFAULT TRUE;
ALTER TABLE public.field_force_reps ADD COLUMN IF NOT EXISTS overtime_calculation_basis TEXT DEFAULT 'Basic Salary';
ALTER TABLE public.field_force_reps ADD COLUMN IF NOT EXISTS overtime_standard_hours NUMERIC(6, 2) DEFAULT 208;
ALTER TABLE public.field_force_reps ADD COLUMN IF NOT EXISTS overtime_multiplier NUMERIC(4, 2) DEFAULT 2.0;
ALTER TABLE public.field_force_reps ADD COLUMN IF NOT EXISTS overtime_fixed_rate NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.field_force_reps ADD COLUMN IF NOT EXISTS overtime_effective_from DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.field_force_reps ADD COLUMN IF NOT EXISTS overtime_policy_status TEXT DEFAULT 'Active';
ALTER TABLE public.field_force_reps ADD COLUMN IF NOT EXISTS overtime_policy_notes TEXT;
ALTER TABLE public.field_force_reps ADD COLUMN IF NOT EXISTS overtime_policy_history JSONB DEFAULT '[]'::jsonb;

-- Ensure indexes for fast lookups by eligibility and status
CREATE INDEX IF NOT EXISTS idx_field_force_ot_eligible ON public.field_force_reps(is_overtime_eligible);
CREATE INDEX IF NOT EXISTS idx_field_force_ot_status ON public.field_force_reps(overtime_policy_status);

