import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  UserCheck,
  PlusCircle,
  Search,
  Phone,
  Mail,
  Building2,
  Building,
  Tag,
  Key,
  TrendingUp,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  X,
  Download,
  LayoutGrid,
  List,
  Briefcase,
  Smartphone,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Upload,
  Calendar,
  Layers,
  MapPin,
  Save,
  DollarSign,
  CreditCard,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Clock,
  Calculator,
  History,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { FieldForceRep, Distributor, OrgNode } from '../../types/erp.ts';
import { getStoredMarketHierarchies, STANDARD_DEPARTMENTS } from '../../data/marketHierarchy.ts';
import { EmployeeProfileModal } from './EmployeeProfileModal.tsx';
import { EmployeeCategory, EmploymentType, EmploymentStatus } from '../../types/payroll.ts';

// Helper to filter out test/mock legacy employee records (e.g., ff-1 to ff-9 or dummy test data)
const isTestOrMockRep = (rep: any): boolean => {
  if (!rep) return true;
  const id = String(rep.id || '');
  const code = String(rep.code || '').toUpperCase().trim();
  const name = String(rep.name || '').toLowerCase().trim();
  if (
    id === 'ff-1' || id === 'ff-2' || id === 'ff-3' ||
    id === 'ff-4' || id === 'ff-5' || id === 'ff-6' ||
    id === 'ff-7' || id === 'ff-8' || id === 'ff-9' ||
    id.startsWith('mock-') || id.startsWith('test-')
  ) {
    return true;
  }
  if (
    code === 'EMP-MGT-001' || code === 'EMP-HR-002' || code === 'EMP-FIN-003' ||
    code === 'EMP-FAC-004' || code === 'EMP-FAC-005' || code === 'EMP-WH-006' ||
    code === 'EMP-FLD-007' || code === 'EMP-FLD-008' || code === 'EMP-IT-009'
  ) {
    return true;
  }
  if (name.includes('test rep') || name.includes('dummy officer') || name.includes('sample employee')) {
    return true;
  }
  return false;
};

const ACTION_TYPES = [
  'Primary Order Booking',
  'Secondary Sales & Delivery',
  'Corporate Key Accounts',
  'Market Survey & Field Audit',
  'Supervisory Inspection',
];

const FIELD_FORCE_TYPES = [
  { value: 'Order Booker', label: 'Order Booker' },
  { value: 'CaptureAndApprove', label: 'Capture & Approve' },
  { value: 'Supervisor', label: 'Supervisor' },
  { value: 'Delivery Man', label: 'Delivery Man' },
  { value: 'Capture', label: 'Field Scout / Capture' },
];

const APP_PERMISSIONS_LIST = [
  'Full Mobile Order & GPS Telemetry',
  'Order Booker Only',
  'Delivery & Cash Collection',
  'Supervisor & Approver Access',
];

const FIELD_FORCE_TAGS_LIST = [
  'Core Field Force',
  'Senior Executive SR',
  'Contractual Officer',
  'Probationary Team',
];

const CUSTOMER_TAGS_LIST = [
  'All Customer Channels',
  'Dealers & Retailers Only',
  'Direct Corporate Accounts Only',
  'Workshops & Mechanics',
];

export const FieldForcePage: React.FC = () => {
  const {
    fieldForceReps,
    addFieldForceRep,
    updateFieldForceRep,
    deleteFieldForceRep,
    refreshFieldForce,
    clearFieldForceLocalData,
    distributors,
    departments,
    orgHierarchy,
    addAuditLog,
    users,
    currentUser,
  } = useERP();

  // Search and Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [selectedMarketFilter, setSelectedMarketFilter] = useState<string>('ALL');
  const [selectedDesignation, setSelectedDesignation] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [clearStorageNotice, setClearStorageNotice] = useState<string>('');

  // Auto purge test/local session memory on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('ensec_field_force_reps') || sessionStorage.getItem('ensec_field_force_reps');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const cleaned = parsed.filter((r: FieldForceRep) => !isTestOrMockRep(r));
            if (cleaned.length === 0) {
              localStorage.removeItem('ensec_field_force_reps');
              sessionStorage.removeItem('ensec_field_force_reps');
            } else if (cleaned.length !== parsed.length) {
              localStorage.setItem('ensec_field_force_reps', JSON.stringify(cleaned));
            }
          }
        }
      } catch {}
    }
  }, []);

  // Filter out any mock/test entries from the list
  const cleanFieldForceReps = useMemo(() => {
    return fieldForceReps.filter((r) => !isTestOrMockRep(r));
  }, [fieldForceReps]);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRep, setEditingRep] = useState<FieldForceRep | null>(null);
  const [viewingRep, setViewingRep] = useState<FieldForceRep | null>(null);
  const [repToDelete, setRepToDelete] = useState<FieldForceRep | null>(null);
  const [addModalTab, setAddModalTab] = useState<'all' | 'basic' | 'target' | 'overtime' | 'permissions' | 'approver' | 'hr'>('all');
  const [editModalTab, setEditModalTab] = useState<'all' | 'basic' | 'target' | 'overtime' | 'permissions' | 'approver' | 'hr'>('all');

  // Quick Tag TADA Approver Modal State (Super Admin Action)
  const [repToTagTadaApprover, setRepToTagTadaApprover] = useState<FieldForceRep | null>(null);
  const [quickSelectedApproverId, setQuickSelectedApproverId] = useState<string>('');
  const [quickTagSuccessMsg, setQuickTagSuccessMsg] = useState<string>('');

  // Form State for Add / Edit
  const [formCode, setFormCode] = useState('');
  const [formPin, setFormPin] = useState('');
  const [formName, setFormName] = useState('');
  const [formNativeName, setFormNativeName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDesignation, setFormDesignation] = useState('');
  const [formJoiningDate, setFormJoiningDate] = useState(new Date().toISOString().substring(0, 10));
  const [formDiscontinueDate, setFormDiscontinueDate] = useState('');
  const [formFieldType, setFormFieldType] = useState('Order Booker');
  const [formActionType, setFormActionType] = useState('Primary Order Booking');
  const [formTadaApproverId, setFormTadaApproverId] = useState<string>('');

  // Overtime Policy & Configuration Form State
  const [formIsOvertimeEligible, setFormIsOvertimeEligible] = useState<boolean>(true);
  const [formOvertimeCalculationBasis, setFormOvertimeCalculationBasis] = useState<'Basic Salary' | 'Fixed Hourly Rate'>('Basic Salary');
  const [formOvertimeStandardHours, setFormOvertimeStandardHours] = useState<number>(208);
  const [formOvertimeMultiplier, setFormOvertimeMultiplier] = useState<number>(2.0);
  const [formOvertimeFixedRate, setFormOvertimeFixedRate] = useState<number>(0);
  const [formOvertimeEffectiveFrom, setFormOvertimeEffectiveFrom] = useState<string>(new Date().toISOString().substring(0, 10));
  const [formOvertimePolicyStatus, setFormOvertimePolicyStatus] = useState<'Active' | 'Inactive'>('Active');
  const [formOvertimePolicyNotes, setFormOvertimePolicyNotes] = useState<string>('');
  
  // Market Hierarchy (Search & Tag)
  const [formMarketHierarchy, setFormMarketHierarchy] = useState('');
  const [marketHierarchySearch, setMarketHierarchySearch] = useState('');
  const [showMarketDropdown, setShowMarketDropdown] = useState(false);
  const [formRegion, setFormRegion] = useState('Dhaka North');
  const [formArea, setFormArea] = useState('Mirpur');
  const [formTerritory, setFormTerritory] = useState('');

  // Departments (Checklist with "All")
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [allDepartmentsChecked, setAllDepartmentsChecked] = useState(false);

  // Markets & Distributors
  const [allMarketsChecked, setAllMarketsChecked] = useState(false);
  const [selectedDistributorId, setSelectedDistributorId] = useState('');
  const [selectedDistributorName, setSelectedDistributorName] = useState('');

  // Subordinate & Hierarchy
  const [parentCode, setParentCode] = useState('');
  const [invoiceWithinDays, setInvoiceWithinDays] = useState<number>(3);
  const [appPermissions, setAppPermissions] = useState('Full Mobile Order & GPS Telemetry');
  const [fieldForceTags, setFieldForceTags] = useState('Core Field Force');
  const [customerTags, setCustomerTags] = useState('All Customer Channels');

  // Compensation & Target
  const [monthlyTargetBDT, setMonthlyTargetBDT] = useState<number>(2500000);
  const [basicSalaryBDT, setBasicSalaryBDT] = useState<number>(30000);
  const [formConveyanceBDT, setFormConveyanceBDT] = useState<number>(6000);
  const [formTaDaBDT, setFormTaDaBDT] = useState<number>(5000);
  const [formMobileAllowanceBDT, setFormMobileAllowanceBDT] = useState<number>(1500);
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');

  // Comprehensive HR & Banking Details
  const [formEmployeeCategory, setFormEmployeeCategory] = useState('Field Employee');
  const [formEmploymentType, setFormEmploymentType] = useState('Permanent');
  const [formNationalId, setFormNationalId] = useState('');
  const [formPresentAddress, setFormPresentAddress] = useState('');
  const [formPermanentAddress, setFormPermanentAddress] = useState('');
  const [formEmergencyContactName, setFormEmergencyContactName] = useState('');
  const [formEmergencyContactPhone, setFormEmergencyContactPhone] = useState('');
  const [formEmergencyContactRelation, setFormEmergencyContactRelation] = useState('');
  const [formBankName, setFormBankName] = useState('Eastern Bank PLC');
  const [formBankAccountNumber, setFormBankAccountNumber] = useState('');
  const [formBankBranch, setFormBankBranch] = useState('Gulshan Branch');
  const [formRoutingNumber, setFormRoutingNumber] = useState('');
  const [formMobileBankingProvider, setFormMobileBankingProvider] = useState('bKash');
  const [formMobileBankingNumber, setFormMobileBankingNumber] = useState('');

  // Dynamic merged market hierarchy options (from stored list + orgHierarchy tree)
  const allMarketHierarchyOptions = useMemo(() => {
    const list = [...getStoredMarketHierarchies()];
    // Gather from orgHierarchy tree
    const gatherNodes = (node: OrgNode) => {
      if (node.type === 'Territory' || node.type === 'Area') {
        const full = `${node.code} - ${node.name}`;
        if (!list.some((item) => item.fullName.toLowerCase() === full.toLowerCase())) {
          list.push({
            code: node.code,
            name: node.name,
            fullName: full,
            region: 'Dhaka',
            area: node.name,
          });
        }
      }
      if (node.children) {
        node.children.forEach(gatherNodes);
      }
    };
    if (orgHierarchy) gatherNodes(orgHierarchy);
    return list;
  }, [orgHierarchy]);

  // Filtered market hierarchy list based on search term in modal
  const filteredMarketHierarchyOptions = useMemo(() => {
    if (!marketHierarchySearch.trim()) return allMarketHierarchyOptions;
    const query = marketHierarchySearch.toLowerCase();
    return allMarketHierarchyOptions.filter(
      (m) =>
        m.fullName.toLowerCase().includes(query) ||
        m.code.toLowerCase().includes(query) ||
        m.name.toLowerCase().includes(query)
    );
  }, [allMarketHierarchyOptions, marketHierarchySearch]);

  // Dynamic department options from ERPContext or fallback
  const availableDepartmentOptions = useMemo(() => {
    if (departments && departments.length > 0) {
      return departments.map((d) => d.fullName || `${d.code} - ${d.name}`);
    }
    return STANDARD_DEPARTMENTS;
  }, [departments]);

  // Handle department checkbox toggle
  const toggleDepartment = (dept: string) => {
    if (selectedDepartments.includes(dept)) {
      setSelectedDepartments(selectedDepartments.filter((d) => d !== dept));
      setAllDepartmentsChecked(false);
    } else {
      const next = [...selectedDepartments, dept];
      setSelectedDepartments(next);
      if (next.length === availableDepartmentOptions.length) {
        setAllDepartmentsChecked(true);
      }
    }
  };

  const toggleAllDepartments = () => {
    if (allDepartmentsChecked) {
      setSelectedDepartments([]);
      setAllDepartmentsChecked(false);
    } else {
      setSelectedDepartments([...availableDepartmentOptions]);
      setAllDepartmentsChecked(true);
    }
  };

  // Reset Add Form
  const resetForm = () => {
    const nextNum = cleanFieldForceReps.length + 101;
    setFormCode(`FF-${nextNum}`);
    setFormPin('');
    setFormName('');
    setFormNativeName('');
    setFormMobile('');
    setFormEmail('');
    setFormDesignation('Order Booker');
    setFormJoiningDate(new Date().toISOString().substring(0, 10));
    setFormDiscontinueDate('');
    setFormFieldType('Order Booker');
    setFormActionType('Primary Order Booking');
    setFormMarketHierarchy('');
    setMarketHierarchySearch('');
    setShowMarketDropdown(false);
    setFormRegion('Dhaka North');
    setFormArea('Mirpur');
    setFormTerritory('');
    setSelectedDepartments([]);
    setAllDepartmentsChecked(false);
    setAllMarketsChecked(false);
    setSelectedDistributorId('');
    setSelectedDistributorName('');
    setParentCode('');
    setInvoiceWithinDays(3);
    setAppPermissions('Full Mobile Order & GPS Telemetry');
    setFieldForceTags('Core Field Force');
    setCustomerTags('All Customer Channels');
    setMonthlyTargetBDT(2500000);
    setBasicSalaryBDT(30000);
    setFormConveyanceBDT(6000);
    setFormTaDaBDT(5000);
    setFormMobileAllowanceBDT(1500);
    setFormStatus('Active');
    setFormEmployeeCategory('Field Employee');
    setFormEmploymentType('Permanent');
    setFormNationalId('');
    setFormPresentAddress('');
    setFormPermanentAddress('');
    setFormEmergencyContactName('');
    setFormEmergencyContactPhone('');
    setFormEmergencyContactRelation('');
    setFormBankName('Eastern Bank PLC');
    setFormBankAccountNumber('');
    setFormBankBranch('Gulshan Branch');
    setFormRoutingNumber('');
    setFormMobileBankingProvider('bKash');
    setFormMobileBankingNumber('');
    // Overtime Policy Defaults
    setFormIsOvertimeEligible(true);
    setFormOvertimeCalculationBasis('Basic Salary');
    setFormOvertimeStandardHours(208);
    setFormOvertimeMultiplier(2.0);
    setFormOvertimeFixedRate(0);
    setFormOvertimeEffectiveFrom(new Date().toISOString().substring(0, 10));
    setFormOvertimePolicyStatus('Active');
    setFormOvertimePolicyNotes('');
    const defaultApprover = users.find((u) => u.role === 'Sales Head' || u.role === 'Super Admin') || users[0];
    setFormTadaApproverId(defaultApprover?.id || '');
  };

  const handleOpenAdd = () => {
    resetForm();
    setAddModalTab('all');
    setShowAddModal(true);
  };

  const handleOpenEdit = (rep: FieldForceRep) => {
    setEditingRep(rep);
    setEditModalTab('all');
    setFormCode(rep.code || '');
    setFormPin(rep.pin || '1234');
    setFormName(rep.name || '');
    setFormNativeName(rep.nativeName || '');
    setFormMobile(rep.phone || '');
    setFormEmail(rep.email || '');
    setFormDesignation(rep.designation || rep.fieldForceType || 'Order Booker');
    setFormJoiningDate(rep.joiningDate || new Date().toISOString().substring(0, 10));
    setFormDiscontinueDate(rep.discontinueDate || '');
    setFormFieldType(rep.fieldForceType || 'Order Booker');
    setFormActionType(rep.actionType || 'Primary Order Booking');
    setFormTadaApproverId(rep.tadaApproverId || '');
    
    // Overtime Policy fields from rep
    setFormIsOvertimeEligible(rep.isOvertimeEligible !== undefined ? Boolean(rep.isOvertimeEligible) : true);
    setFormOvertimeCalculationBasis(rep.overtimeCalculationBasis || 'Basic Salary');
    setFormOvertimeStandardHours(Number(rep.overtimeStandardMonthlyHours) || 208);
    setFormOvertimeMultiplier(Number(rep.overtimeMultiplier) || 2.0);
    setFormOvertimeFixedRate(Number(rep.overtimeFixedHourlyRateBDT) || 0);
    setFormOvertimeEffectiveFrom(rep.overtimePolicyEffectiveFrom || rep.joiningDate || new Date().toISOString().substring(0, 10));
    setFormOvertimePolicyStatus(rep.overtimePolicyStatus || (rep.isActive === false ? 'Inactive' : 'Active'));
    setFormOvertimePolicyNotes(rep.overtimePolicyNotes || '');
    
    const hierarchyVal = rep.marketHierarchy || rep.territory || '';
    setFormMarketHierarchy(hierarchyVal);
    setFormRegion(rep.region || 'Dhaka North');
    setFormArea(rep.area || 'Mirpur');
    setFormTerritory(rep.territory || hierarchyVal);
    setMarketHierarchySearch('');
    setShowMarketDropdown(false);

    setSelectedDepartments(rep.departments && rep.departments.length > 0 ? rep.departments : [rep.department || 'DEP-1 - MOUSUMI NETWORK LTD']);
    setAllDepartmentsChecked(rep.departments?.length === availableDepartmentOptions.length);
    setAllMarketsChecked(true);
    setSelectedDistributorId(rep.distributorId || distributors[0]?.id || '');
    setSelectedDistributorName(rep.distributorName || distributors[0]?.name || '');
    setParentCode(rep.parentCode || cleanFieldForceReps[0]?.code || 'MGT-01');
    setInvoiceWithinDays(rep.invoiceWithinDays || 3);
    setAppPermissions(rep.appPermissions?.[0] || 'Full Mobile Order & GPS Telemetry');
    setFieldForceTags(rep.fieldForceTags?.[0] || 'Core Field Force');
    setCustomerTags(rep.customerTags?.[0] || 'All Customer Channels');
    setMonthlyTargetBDT(rep.monthlyTargetBDT ?? 2500000);
    setBasicSalaryBDT(rep.basicSalaryBDT ?? 30000);
    setFormConveyanceBDT(rep.conveyanceBDT ?? 6000);
    setFormTaDaBDT(rep.taDaBDT ?? 5000);
    setFormMobileAllowanceBDT(rep.mobileAllowanceBDT ?? 1500);
    setFormStatus((rep.status as any) || (rep.isActive === false ? 'Inactive' : 'Active'));

    // Extended HR & Banking details
    setFormEmployeeCategory(rep.employeeCategory || 'Field Employee');
    setFormEmploymentType(rep.employmentType || 'Permanent');
    setFormNationalId(rep.nationalId || '');
    setFormPresentAddress(rep.presentAddress || '');
    setFormPermanentAddress(rep.permanentAddress || '');
    setFormEmergencyContactName(rep.emergencyContactName || '');
    setFormEmergencyContactPhone(rep.emergencyContactPhone || '');
    setFormEmergencyContactRelation(rep.emergencyContactRelation || '');
    setFormBankName(rep.bankName || 'Eastern Bank PLC');
    setFormBankAccountNumber(rep.bankAccountNumber || '');
    setFormBankBranch(rep.bankBranch || 'Gulshan Branch');
    setFormRoutingNumber(rep.routingNumber || '');
    setFormMobileBankingProvider(rep.mobileBankingProvider || 'bKash');
    setFormMobileBankingNumber(rep.mobileBankingNumber || '');
  };

  const handleClearLocalStorage = () => {
    if (window.confirm('Are you sure you want to remove all local session and test storage data for Field Force? All test data will be wiped and real database records will be synced.')) {
      if (clearFieldForceLocalData) {
        clearFieldForceLocalData();
      } else {
        localStorage.removeItem('ensec_field_force_reps');
        sessionStorage.removeItem('ensec_field_force_reps');
        if (refreshFieldForce) refreshFieldForce();
      }
      setClearStorageNotice('Local test/session storage cleared successfully! Filtered clean baseline active.');
      setTimeout(() => setClearStorageNotice(''), 4500);
    }
  };

  const handleOpenQuickTagTadaApprover = (rep: FieldForceRep) => {
    setRepToTagTadaApprover(rep);
    setQuickSelectedApproverId(rep.tadaApproverId || users[0]?.id || '');
    setQuickTagSuccessMsg('');
  };

  const handleSaveQuickTagTadaApprover = () => {
    if (!repToTagTadaApprover) return;
    const selectedUser = users.find((u) => u.id === quickSelectedApproverId);
    if (!selectedUser) return;

    updateFieldForceRep(repToTagTadaApprover.id, {
      tadaApproverId: selectedUser.id,
      tadaApproverName: `${selectedUser.name} (${selectedUser.role})`,
    });

    addAuditLog(
      'FIELD_FORCE_TADA_APPROVER_TAGGED',
      'Field Force Directory',
      `Super Admin tagged ${selectedUser.name} (${selectedUser.role}) as TADA Approver for ${repToTagTadaApprover.name} (${repToTagTadaApprover.code})`
    );

    setQuickTagSuccessMsg(`Tagged ${selectedUser.name} as TADA Approver successfully!`);
    setTimeout(() => {
      setRepToTagTadaApprover(null);
      setQuickTagSuccessMsg('');
    }, 900);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) return;

    const assignedDist = distributors.find((d) => d.id === selectedDistributorId);
    const matchedHierarchy = allMarketHierarchyOptions.find(
      (m) => m.fullName.toLowerCase() === formMarketHierarchy.toLowerCase()
    );

    // Derive region and territory safely from the market hierarchy tag
    const resolvedRegion = matchedHierarchy?.region || formRegion || 'Dhaka North';
    const resolvedArea = matchedHierarchy?.area || formArea || 'Mirpur';
    const resolvedTerritory = matchedHierarchy?.name || formTerritory || formMarketHierarchy || 'Mirpur';
    const selectedTadaApprover = users.find((u) => u.id === formTadaApproverId);
    const reportingMgr = parentCode ? cleanFieldForceReps.find((r) => r.code === parentCode) : undefined;

    addFieldForceRep({
      code: formCode.trim().toUpperCase(),
      name: formName.trim(),
      nativeName: formNativeName.trim() || undefined,
      pin: formPin.trim(),
      phone: formMobile.trim(),
      email: formEmail.trim() || undefined,
      designation: formDesignation.trim() || formFieldType,
      department: selectedDepartments[0] || 'Primary Battery Sales',
      departments: selectedDepartments,
      fieldForceType: formFieldType,
      actionType: formActionType,
      marketHierarchy: formMarketHierarchy,
      region: resolvedRegion,
      area: resolvedArea,
      territory: resolvedTerritory,
      distributorId: assignedDist?.id || selectedDistributorId,
      distributorName: assignedDist?.name || selectedDistributorName,
      distributors: assignedDist ? [assignedDist.name] : [],
      parentCode: parentCode.trim() || undefined,
      reportingManagerId: reportingMgr?.id,
      reportingManagerName: reportingMgr ? `${reportingMgr.name} (${reportingMgr.code})` : undefined,
      joiningDate: formJoiningDate,
      discontinueDate: formDiscontinueDate || undefined,
      invoiceWithinDays,
      appPermissions: [appPermissions],
      fieldForceTags: [fieldForceTags],
      customerTags: [customerTags],
      monthlyTargetBDT: Number(monthlyTargetBDT) || 0,
      monthlyAchievedBDT: 0,
      basicSalaryBDT: Number(basicSalaryBDT) || 0,
      conveyanceBDT: Number(formConveyanceBDT) || 0,
      taDaBDT: Number(formTaDaBDT) || 0,
      mobileAllowanceBDT: Number(formMobileAllowanceBDT) || 0,
      tadaApproverId: selectedTadaApprover?.id || undefined,
      tadaApproverName: selectedTadaApprover ? `${selectedTadaApprover.name} (${selectedTadaApprover.role})` : undefined,
      nationalId: formNationalId.trim() || undefined,
      employeeCategory: formEmployeeCategory,
      employmentType: formEmploymentType,
      employmentStatus: formStatus,
      presentAddress: formPresentAddress.trim() || undefined,
      permanentAddress: formPermanentAddress.trim() || undefined,
      emergencyContactName: formEmergencyContactName.trim() || undefined,
      emergencyContactPhone: formEmergencyContactPhone.trim() || undefined,
      emergencyContactRelation: formEmergencyContactRelation.trim() || undefined,
      bankName: formBankName.trim() || undefined,
      bankAccountNumber: formBankAccountNumber.trim() || undefined,
      bankBranch: formBankBranch.trim() || undefined,
      routingNumber: formRoutingNumber.trim() || undefined,
      mobileBankingProvider: formMobileBankingProvider || undefined,
      mobileBankingNumber: formMobileBankingNumber.trim() || undefined,
      status: formStatus,
      isActive: formStatus === 'Active',
      // Individual Overtime Policy Configuration
      isOvertimeEligible: formIsOvertimeEligible,
      overtimeCalculationBasis: formOvertimeCalculationBasis,
      overtimeStandardMonthlyHours: Number(formOvertimeStandardHours) || 208,
      overtimeMultiplier: Number(formOvertimeMultiplier) || 2.0,
      overtimeFixedHourlyRateBDT: Number(formOvertimeFixedRate) || 0,
      overtimePolicyEffectiveFrom: formOvertimeEffectiveFrom,
      overtimePolicyStatus: formOvertimePolicyStatus,
      overtimePolicyNotes: formOvertimePolicyNotes.trim() || undefined,
      overtimePolicyHistory: [],
      todayVisitsCount: 0,
      productiveVisitsCount: 0,
      currentLocation: {
        latitude: 23.8103,
        longitude: 90.4125,
        address: `${formMarketHierarchy || resolvedTerritory || 'Dhaka'}, Bangladesh`,
        lastUpdated: 'New Registration',
        speedKmH: 0,
        batteryLevel: 100,
        isOnline: true,
      },
    });

    addAuditLog(
      'FIELD_FORCE_CREATED',
      'Field Force Directory',
      `Registered field force officer ${formName} (${formCode}) with Overtime Policy: ${formIsOvertimeEligible ? `Eligible (${formOvertimeMultiplier}x, Basis: ${formOvertimeCalculationBasis})` : 'Ineligible'}`
    );

    setShowAddModal(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRep) return;

    const assignedDist = distributors.find((d) => d.id === selectedDistributorId);
    const matchedHierarchy = allMarketHierarchyOptions.find(
      (m) => m.fullName.toLowerCase() === formMarketHierarchy.toLowerCase()
    );

    const resolvedRegion = matchedHierarchy?.region || formRegion || editingRep.region || 'Dhaka North';
    const resolvedArea = matchedHierarchy?.area || formArea || editingRep.area || 'Mirpur';
    const resolvedTerritory = matchedHierarchy?.name || formTerritory || formMarketHierarchy || editingRep.territory || 'Mirpur';
    const selectedTadaApprover = users.find((u) => u.id === formTadaApproverId);

    // Check if Overtime Policy was amended, and archive old version to policy history if changed
    const isPolicyAmended =
      editingRep.isOvertimeEligible !== formIsOvertimeEligible ||
      (editingRep.overtimeCalculationBasis || 'Basic Salary') !== formOvertimeCalculationBasis ||
      Number(editingRep.overtimeStandardMonthlyHours || 208) !== Number(formOvertimeStandardHours) ||
      Number(editingRep.overtimeMultiplier || 2.0) !== Number(formOvertimeMultiplier) ||
      Number(editingRep.overtimeFixedHourlyRateBDT || 0) !== Number(formOvertimeFixedRate) ||
      (editingRep.overtimePolicyStatus || 'Active') !== formOvertimePolicyStatus;

    let updatedHistory = Array.isArray(editingRep.overtimePolicyHistory) ? [...editingRep.overtimePolicyHistory] : [];
    if (isPolicyAmended) {
      const oldSnapshot = {
        id: `pol-hist-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        employeeId: editingRep.id,
        isEligible: editingRep.isOvertimeEligible !== false,
        calculationBasis: (editingRep.overtimeCalculationBasis as any) || 'Basic Salary',
        standardMonthlyWorkingHours: Number(editingRep.overtimeStandardMonthlyHours) || 208,
        overtimeMultiplier: Number(editingRep.overtimeMultiplier) || 2.0,
        fixedHourlyRateBDT: Number(editingRep.overtimeFixedHourlyRateBDT) || 0,
        effectiveFrom: editingRep.overtimePolicyEffectiveFrom || editingRep.joiningDate || '2026-01-01',
        effectiveTo: formOvertimeEffectiveFrom || new Date().toISOString().substring(0, 10),
        status: (editingRep.overtimePolicyStatus as any) || 'Active',
        notes: formOvertimePolicyNotes || 'Amended via Field Force Employee Master',
        createdAt: new Date().toISOString(),
        updatedBy: currentUser.name,
      };
      updatedHistory = [oldSnapshot, ...updatedHistory];
    }

    updateFieldForceRep(editingRep.id, {
      code: formCode.trim().toUpperCase(),
      name: formName.trim(),
      nativeName: formNativeName.trim() || undefined,
      pin: formPin.trim(),
      phone: formMobile.trim(),
      email: formEmail.trim() || undefined,
      designation: formDesignation.trim() || formFieldType,
      department: selectedDepartments[0] || editingRep.department,
      departments: selectedDepartments,
      fieldForceType: formFieldType,
      actionType: formActionType,
      marketHierarchy: formMarketHierarchy,
      region: resolvedRegion,
      area: resolvedArea,
      territory: resolvedTerritory,
      distributorId: assignedDist?.id || selectedDistributorId,
      distributorName: assignedDist?.name || selectedDistributorName,
      distributors: assignedDist ? [assignedDist.name] : editingRep.distributors,
      parentCode: parentCode.trim() || undefined,
      joiningDate: formJoiningDate,
      discontinueDate: formDiscontinueDate || undefined,
      invoiceWithinDays,
      appPermissions: [appPermissions],
      fieldForceTags: [fieldForceTags],
      customerTags: [customerTags],
      monthlyTargetBDT: Number(monthlyTargetBDT) || 0,
      basicSalaryBDT: Number(basicSalaryBDT) || 0,
      conveyanceBDT: Number(formConveyanceBDT) || 0,
      taDaBDT: Number(formTaDaBDT) || 0,
      mobileAllowanceBDT: Number(formMobileAllowanceBDT) || 0,
      tadaApproverId: selectedTadaApprover?.id || undefined,
      tadaApproverName: selectedTadaApprover ? `${selectedTadaApprover.name} (${selectedTadaApprover.role})` : undefined,
      status: formStatus,
      isActive: formStatus === 'Active',

      // Individual Overtime Policy Configuration
      isOvertimeEligible: formIsOvertimeEligible,
      overtimeCalculationBasis: formOvertimeCalculationBasis,
      overtimeStandardMonthlyHours: Number(formOvertimeStandardHours) || 208,
      overtimeMultiplier: Number(formOvertimeMultiplier) || 2.0,
      overtimeFixedHourlyRateBDT: Number(formOvertimeFixedRate) || 0,
      overtimePolicyEffectiveFrom: formOvertimeEffectiveFrom,
      overtimePolicyStatus: formOvertimePolicyStatus,
      overtimePolicyNotes: formOvertimePolicyNotes.trim() || undefined,
      overtimePolicyHistory: updatedHistory,

      employeeCategory: formEmployeeCategory,
      employmentType: formEmploymentType,
      employmentStatus: formStatus === 'Active' ? 'Active' : 'Inactive',
      nationalId: formNationalId.trim() || undefined,
      presentAddress: formPresentAddress.trim() || undefined,
      permanentAddress: formPermanentAddress.trim() || undefined,
      emergencyContactName: formEmergencyContactName.trim() || undefined,
      emergencyContactPhone: formEmergencyContactPhone.trim() || undefined,
      emergencyContactRelation: formEmergencyContactRelation.trim() || undefined,
      bankName: formBankName.trim() || undefined,
      bankAccountNumber: formBankAccountNumber.trim() || undefined,
      bankBranch: formBankBranch.trim() || undefined,
      routingNumber: formRoutingNumber.trim() || undefined,
      mobileBankingProvider: formMobileBankingProvider || undefined,
      mobileBankingNumber: formMobileBankingNumber.trim() || undefined,
    });

    addAuditLog(
      'FIELD_FORCE_UPDATED',
      'Field Force Directory',
      `Updated profile for ${editingRep.name} (${formCode}) -> Overtime Policy: ${formIsOvertimeEligible ? `Eligible (${formOvertimeMultiplier}x, ${formOvertimeCalculationBasis})` : 'Ineligible'}${isPolicyAmended ? ' [Policy Amended & Version Archived]' : ''}`
    );

    setEditingRep(null);
  };

  const handleToggleStatus = (rep: FieldForceRep) => {
    const nextStatus = rep.status === 'Active' ? 'Inactive' : 'Active';
    updateFieldForceRep(rep.id, {
      status: nextStatus,
      isActive: nextStatus === 'Active',
    });
    addAuditLog(
      'FIELD_FORCE_STATUS_TOGGLED',
      'Field Force Master',
      `Changed status of ${rep.name} (${rep.code}) to ${nextStatus}`
    );
  };

  const handleDeleteConfirm = () => {
    if (!repToDelete) return;
    deleteFieldForceRep(repToDelete.id);
    setRepToDelete(null);
  };

  // Filtered List based on clean field force data (excluding mock/test items)
  const filteredReps = useMemo(() => {
    return cleanFieldForceReps.filter((rep) => {
      // Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesQuery =
          rep.name.toLowerCase().includes(query) ||
          rep.code.toLowerCase().includes(query) ||
          rep.phone.toLowerCase().includes(query) ||
          (rep.nativeName && rep.nativeName.toLowerCase().includes(query)) ||
          (rep.marketHierarchy && rep.marketHierarchy.toLowerCase().includes(query)) ||
          rep.territory.toLowerCase().includes(query) ||
          (rep.distributorName && rep.distributorName.toLowerCase().includes(query));
        if (!matchesQuery) return false;
      }

      // Category filter
      if (selectedCategoryFilter !== 'ALL') {
        const cat = rep.employeeCategory || 'Field Employee';
        if (cat !== selectedCategoryFilter) return false;
      }

      // Market Hierarchy filter
      if (selectedMarketFilter !== 'ALL') {
        const repHier = rep.marketHierarchy || rep.territory;
        if (!repHier || !repHier.toLowerCase().includes(selectedMarketFilter.toLowerCase())) {
          return false;
        }
      }

      // Designation filter
      if (selectedDesignation !== 'ALL' && rep.designation !== selectedDesignation) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'ALL') {
        const isRepActive = rep.status === 'Active' || rep.isActive !== false;
        if (selectedStatus === 'Active' && !isRepActive) return false;
        if (selectedStatus === 'Inactive' && isRepActive) return false;
      }

      return true;
    });
  }, [cleanFieldForceReps, searchQuery, selectedCategoryFilter, selectedMarketFilter, selectedDesignation, selectedStatus]);

  // High-Level KPIs
  const totalReps = cleanFieldForceReps.length;
  const activeRepsCount = cleanFieldForceReps.filter(
    (r) => r.status === 'Active' || r.isActive !== false
  ).length;
  const totalTargetBDT = cleanFieldForceReps.reduce((acc, r) => acc + (r.monthlyTargetBDT || 0), 0);
  const totalAchievedBDT = cleanFieldForceReps.reduce((acc, r) => acc + (r.monthlyAchievedBDT || 0), 0);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Code',
      'Name',
      'Native Name',
      'Designation',
      'Market Hierarchy Tag',
      'Action Type',
      'Phone',
      'Distributor',
      'Monthly Target (BDT)',
      'Status',
    ];
    const rows = filteredReps.map((r) => [
      r.code,
      `"${r.name}"`,
      `"${r.nativeName || ''}"`,
      `"${r.designation}"`,
      `"${r.marketHierarchy || r.territory}"`,
      `"${r.actionType || 'Primary Booking'}"`,
      `"${r.phone}"`,
      `"${r.distributorName || ''}"`,
      r.monthlyTargetBDT || 0,
      r.status || 'Active',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `field_force_directory_${new Date().toISOString().substring(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
            <span>Basic Data Master</span>
            <span>/</span>
            <span className="text-slate-900 dark:text-white">Central Employee & Field Force Directory</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Employee & Field Force Master Directory
            </h1>
          </div>
          
        </div>

        <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
          
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register Employee</span>
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      {clearStorageNotice && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{clearStorageNotice}</span>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Corporate Personnel */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Enterprise Staff</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {totalReps} <span className="text-xs font-normal text-slate-500">Personnel</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            <UserCheck className="w-3.5 h-3.5" />
            <span>{activeRepsCount} Active in Payroll</span>
          </div>
        </div>

        {/* Card 2: Office & Management */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Office & Management</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {cleanFieldForceReps.filter((r) => r.employeeCategory === 'Office Employee' || r.employeeCategory === 'Management Employee').length} <span className="text-xs font-normal text-slate-500">Head Office</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Accounts, HR & Operations
          </div>
        </div>

        {/* Card 3: Field Force & Sales */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Field Force & Sales</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {cleanFieldForceReps.filter((r) => r.employeeCategory === 'Field Employee' || !r.employeeCategory).length} <span className="text-xs font-normal text-slate-500">Officers</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Monthly Target: ৳{(totalTargetBDT / 100000).toFixed(1)}L
          </div>
        </div>

        {/* Card 4: Factory & Production */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Factory & Logistics</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {cleanFieldForceReps.filter((r) => r.employeeCategory === 'Factory Employee' || r.employeeCategory === 'Warehouse Employee').length} <span className="text-xs font-normal text-slate-500">Staff</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Kushtia Plant & Central Hubs
          </div>
        </div>
      </div>

      {/* Employee Category Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'ALL', label: 'All Employees', count: fieldForceReps.length },
          { id: 'Office Employee', label: 'Office Staff', count: fieldForceReps.filter((r) => r.employeeCategory === 'Office Employee').length },
          { id: 'Field Employee', label: 'Field Force & Sales', count: fieldForceReps.filter((r) => r.employeeCategory === 'Field Employee' || !r.employeeCategory).length },
          { id: 'Factory Employee', label: 'Factory & Production', count: fieldForceReps.filter((r) => r.employeeCategory === 'Factory Employee').length },
          { id: 'Warehouse Employee', label: 'Warehouse & Logistics', count: fieldForceReps.filter((r) => r.employeeCategory === 'Warehouse Employee').length },
          { id: 'Management Employee', label: 'Management & C-Suite', count: fieldForceReps.filter((r) => r.employeeCategory === 'Management Employee').length },
        ].map((tab) => {
          const isSelected = selectedCategoryFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedCategoryFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Control Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by code (e.g. SPO10589, FF-101), name, mobile, Market Hierarchy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <span className="text-xs text-slate-500 mr-1">
              Showing <b>{filteredReps.length}</b> of {fieldForceReps.length}
            </span>
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Grid Cards"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Market Hierarchy Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Market Hierarchy Filter
            </label>
            <select
              value={selectedMarketFilter}
              onChange={(e) => setSelectedMarketFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Market Hierarchy Nodes</option>
              {allMarketHierarchyOptions.map((opt) => (
                <option key={opt.code} value={opt.name}>
                  {opt.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Designation */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Field Force Type / Role
            </label>
            <select
              value={selectedDesignation}
              onChange={(e) => setSelectedDesignation(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Roles</option>
              {FIELD_FORCE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Status</option>
              <option value="Active">Active Officers Only</option>
              <option value="Inactive">Inactive / Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Content */}
      {filteredReps.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
            No Field Force Officers Found
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or register a new field officer to this market hierarchy.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedMarketFilter('ALL');
              setSelectedDesignation('ALL');
              setSelectedStatus('ALL');
            }}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Officer / Employee</th>
                  <th className="py-3 px-4">Role & Action Type</th>
                  <th className="py-3 px-4">Market Hierarchy Tag</th>
                  <th className="py-3 px-4">Distributor Mapped</th>
                  <th className="py-3 px-4">TADA Approve Person</th>
                  <th className="py-3 px-4">Monthly Target</th>
                  <th className="py-3 px-4">Mobile PIN</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredReps.map((rep) => {
                  const isActive = rep.status === 'Active' || rep.isActive !== false;
                  const targetBDT = rep.monthlyTargetBDT || 2500000;
                  const achievedBDT = rep.monthlyAchievedBDT || 0;
                  const progressPct = Math.min(100, Math.round((achievedBDT / (targetBDT || 1)) * 100));
                  const hierarchyDisplay = rep.marketHierarchy || rep.territory || 'Not Assigned';

                  return (
                    <tr
                      key={rep.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Officer Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                            {rep.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{rep.name}</span>
                              {rep.nativeName && (
                                <span className="text-[10px] text-slate-400 font-normal">
                                   ({rep.nativeName})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                                {rep.code}
                              </span>
                              <span>•</span>
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                                rep.employeeCategory === 'Office Employee' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800' :
                                rep.employeeCategory === 'Factory Employee' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800' :
                                rep.employeeCategory === 'Warehouse Employee' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800' :
                                rep.employeeCategory === 'Management Employee' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800' :
                                'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              }`}>
                                {rep.employeeCategory || 'Field Force'}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-0.5">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {rep.phone}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Action Type */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {rep.fieldForceType || rep.designation}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <span className="px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-medium border border-blue-200 dark:border-blue-800">
                            {rep.actionType || 'Primary Order Booking'}
                          </span>
                        </div>
                      </td>

                      {/* Market Hierarchy Tag */}
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[11px] font-semibold border border-slate-200 dark:border-slate-700">
                          <Tag className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          <span>{hierarchyDisplay}</span>
                        </div>
                      </td>

                      {/* Mapped Distributor */}
                      <td className="py-3 px-4">
                        {rep.distributorName ? (
                          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                            <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="truncate max-w-[160px] font-medium">
                              {rep.distributorName}
                            </span>
                          </div>
                        ) : rep.distributors && rep.distributors.length > 0 ? (
                          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                            <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="truncate max-w-[160px] font-medium">
                              {rep.distributors[0]}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Direct / Unassigned</span>
                        )}
                      </td>

                      {/* TADA Approve Person (Super Admin Tagged) */}
                      <td className="py-3 px-4">
                        {rep.tadaApproverName ? (
                          <div className="flex items-center gap-1.5">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-slate-800 dark:text-slate-200 text-[11px] font-medium max-w-[170px]">
                              <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                              <span className="truncate font-semibold" title={rep.tadaApproverName}>
                                {rep.tadaApproverName}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenQuickTagTadaApprover(rep)}
                              title="Super Admin: Reassign / Tag TADA Approver"
                              className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenQuickTagTadaApprover(rep)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors cursor-pointer"
                            title="Super Admin: Tag TADA Approver for this officer"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>+ Tag Approver</span>
                          </button>
                        )}
                      </td>

                      {/* Monthly Target */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          ৳ {(targetBDT / 1000).toLocaleString()}k
                        </div>
                        <div className="w-24 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {progressPct}% target met
                        </div>
                      </td>

                      {/* PIN & Login */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                          PIN: {rep.pin || '1234'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(rep)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                          }`}
                          title="Click to toggle Active/Inactive"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          <span>{isActive ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingRep(rep)}
                            title="View Full Profile"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(rep)}
                            title="Edit Officer Profile"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setRepToDelete(rep)}
                            title="Delete Officer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReps.map((rep) => {
            const isActive = rep.status === 'Active' || rep.isActive !== false;
            const targetBDT = rep.monthlyTargetBDT || 2500000;
            const achievedBDT = rep.monthlyAchievedBDT || 0;
            const progressPct = Math.min(100, Math.round((achievedBDT / (targetBDT || 1)) * 100));
            const hierarchyDisplay = rep.marketHierarchy || rep.territory || 'Not Assigned';

            return (
              <div
                key={rep.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between hover:border-blue-400 transition-all space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-2xs shrink-0">
                        {rep.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-xs">
                          {rep.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                            {rep.code}
                          </span>
                          {rep.nativeName && <span>• {rep.nativeName}</span>}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(rep)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  {/* Market Hierarchy & Role */}
                  <div className="mt-3 text-xs space-y-2">
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                      <Tag className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Market Hierarchy</span>
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 text-xs truncate block">
                          {hierarchyDisplay}
                        </span>
                      </div>
                    </div>

                    <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      <span>{rep.fieldForceType || rep.designation}</span>
                      <span className="text-[10px] text-slate-400">({rep.actionType || 'Primary Booking'})</span>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{rep.phone}</span>
                    </div>

                    {rep.distributorName && (
                      <div className="text-[11px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        <span className="truncate">{rep.distributorName}</span>
                      </div>
                    )}

                    {/* TADA Approver Badge */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-[11px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="text-slate-500 shrink-0">TADA Approver:</span>
                        <span className="font-semibold text-slate-900 dark:text-white truncate">
                          {rep.tadaApproverName || 'Not Tagged'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenQuickTagTadaApprover(rep)}
                        className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0 ml-1 cursor-pointer"
                      >
                        {rep.tadaApproverName ? 'Change' : 'Tag'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Target Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-slate-500">Target Progress</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                      ৳ {(achievedBDT / 1000).toLocaleString()}k / ৳ {(targetBDT / 1000).toLocaleString()}k
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2">
                    <span className="font-mono text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      PIN: {rep.pin || '1234'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewingRep(rep)}
                        className="px-2.5 py-1 text-xs rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 font-semibold"
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => handleOpenEdit(rep)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setRepToDelete(rep)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: NEW FIELDFORCE REGISTRATION (ALL SECTIONS) */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-4 max-h-[94vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>New FieldForce Registration</span>
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Section Tab Switcher */}
            <div className="flex items-center gap-1 px-6 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs">
              {[
                { id: 'all', label: 'All Sections', icon: Sliders },
                { id: 'basic', label: '1. Core & Hierarchy', icon: MapPin },
                { id: 'target', label: '2. Remuneration & Targets', icon: DollarSign },
                { id: 'overtime', label: '3. Overtime Policy & Configuration', icon: Clock },
                { id: 'permissions', label: '4. Permissions & Tags', icon: ShieldCheck },
                { id: 'approver', label: '5. TADA Approver', icon: UserCheck },
                { id: 'hr', label: '6. HR & Banking', icon: Building },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = addModalTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setAddModalTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSaveAdd} className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
              {/* SECTION 1: CORE OFFICER IDENTIFICATION & BASIC INFORMATION */}
              {(addModalTab === 'all' || addModalTab === 'basic') && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-800/20 space-y-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>1. Core Officer Profile & Identification</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Code */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Officer Code<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value)}
                        placeholder="e.g. FF-101"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* PIN */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        PIN (Mobile Login)<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formPin}
                        onChange={(e) => setFormPin(e.target.value)}
                        placeholder="4-digit PIN"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Full Name (English)<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="Enter full name"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                      />
                    </div>

                    {/* Native Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Native Name (বাংলা)<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formNativeName}
                        onChange={(e) => setFormNativeName(e.target.value)}
                        placeholder="বাংলায় নাম লিখুন"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Mobile */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Mobile Phone Number<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formMobile}
                        onChange={(e) => setFormMobile(e.target.value)}
                        placeholder="017XXXXXXXX"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        placeholder="officer@ensec.com.bd"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* FieldForce Type */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        FieldForce Type<span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formFieldType}
                        onChange={(e) => setFormFieldType(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                      >
                        {FIELD_FORCE_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Designation */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Official Designation
                      </label>
                      <input
                        type="text"
                        value={formDesignation}
                        onChange={(e) => setFormDesignation(e.target.value)}
                        placeholder="e.g. Senior Territory Sales Officer"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                      />
                    </div>

                    {/* Action Type */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Action Type
                      </label>
                      <select
                        value={formActionType}
                        onChange={(e) => setFormActionType(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        {ACTION_TYPES.map((act) => (
                          <option key={act} value={act}>
                            {act}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Joining Date */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Joining Date
                      </label>
                      <input
                        type="date"
                        value={formJoiningDate}
                        onChange={(e) => setFormJoiningDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Discontinue Date */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Discontinue / Exit Date
                      </label>
                      <input
                        type="date"
                        value={formDiscontinueDate}
                        onChange={(e) => setFormDiscontinueDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Invoice Within Days */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Invoice Within (Days)<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        required
                        value={invoiceWithinDays}
                        onChange={(e) => setInvoiceWithinDays(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: MARKET HIERARCHY, BEAT & TERRITORY TAGGING */}
              {(addModalTab === 'all' || addModalTab === 'basic') && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-800/20 space-y-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span>2. Market Beat, Territory & Hierarchy Tagging</span>
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Market Hierarchy Selector */}
                    <div className="p-3.5 rounded-xl border-2 border-red-500 bg-red-50/20 dark:bg-red-950/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-blue-600 dark:text-blue-400">
                          Market Hierarchy
                        </label>
                        <span className="text-[10px] text-red-600 dark:text-red-400 font-semibold uppercase tracking-wider">
                          Tagged Market Beat
                        </span>
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search market hierarchy..."
                          value={marketHierarchySearch}
                          onChange={(e) => {
                            setMarketHierarchySearch(e.target.value);
                            setShowMarketDropdown(true);
                          }}
                          onFocus={() => setShowMarketDropdown(true)}
                          className="w-full pl-3 pr-14 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="absolute right-2 top-2 flex items-center gap-1 text-slate-400">
                          {marketHierarchySearch && (
                            <button
                              type="button"
                              onClick={() => setMarketHierarchySearch('')}
                              className="p-0.5 hover:text-slate-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowMarketDropdown(!showMarketDropdown)}
                            className="p-0.5 hover:text-slate-600"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {formMarketHierarchy && (
                        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 font-mono text-xs">
                          <Tag className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                          <span className="font-semibold">{formMarketHierarchy}</span>
                        </div>
                      )}

                      {showMarketDropdown && (
                        <div className="border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 shadow-md max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60">
                          {filteredMarketHierarchyOptions.map((opt) => {
                            const isSelected = formMarketHierarchy === opt.fullName;
                            return (
                              <div
                                key={opt.code + opt.fullName}
                                onClick={() => {
                                  setFormMarketHierarchy(opt.fullName);
                                  setFormRegion(opt.region || formRegion);
                                  setFormArea(opt.area || formArea);
                                  setFormTerritory(opt.name || formTerritory);
                                  setShowMarketDropdown(false);
                                }}
                                className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                                  isSelected
                                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                <span className="font-mono">{opt.fullName}</span>
                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Territory & Assigned Hierarchy breakdown */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Region
                          </label>
                          <input
                            type="text"
                            value={formRegion}
                            onChange={(e) => setFormRegion(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Area
                          </label>
                          <input
                            type="text"
                            value={formArea}
                            onChange={(e) => setFormArea(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Territory
                          </label>
                          <input
                            type="text"
                            value={formTerritory}
                            onChange={(e) => setFormTerritory(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      {/* Distributor */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Assigned Distributor
                        </label>
                        <select
                          value={selectedDistributorId}
                          onChange={(e) => {
                            setSelectedDistributorId(e.target.value);
                            const dist = distributors.find((d) => d.id === e.target.value);
                            if (dist) setSelectedDistributorName(dist.name);
                          }}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                        >
                          <option value="">-- Select Distributor --</option>
                          {distributors.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name} ({d.dbPoint || d.district || 'Hub'})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Parent Code */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Parent Supervisor / Line Manager Code
                        </label>
                        <select
                          value={parentCode}
                          onChange={(e) => setParentCode(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                        >
                          <option value="">-- Select Parent / Supervisor --</option>
                          <option value="MGT-01">MGT-01 - National Sales Director</option>
                          {cleanFieldForceReps.map((r) => (
                            <option key={r.id} value={r.code}>
                              {r.code} - {r.name} ({r.designation || r.fieldForceType})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Departments checklist */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Assigned Business Departments
                    </label>
                    <div className="border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 bg-slate-50/60 dark:bg-slate-800/40 max-h-36 overflow-y-auto space-y-2">
                      <label className="flex items-center gap-2 text-xs cursor-pointer font-semibold border-b pb-1 text-slate-800 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={allDepartmentsChecked}
                          onChange={toggleAllDepartments}
                          className="rounded text-blue-600 w-3.5 h-3.5"
                        />
                        <span>All Standard Departments</span>
                      </label>
                      {availableDepartmentOptions.map((dept) => (
                        <label key={dept} className="flex items-center gap-2 text-[11px] cursor-pointer text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={selectedDepartments.includes(dept)}
                            onChange={() => toggleDepartment(dept)}
                            className="rounded text-blue-600 w-3.5 h-3.5"
                          />
                          <span>{dept}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3: TARGET, REMUNERATION & COMPENSATION (BDT) */}
              {(addModalTab === 'all' || addModalTab === 'target') && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-800/20 space-y-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" />
                    <span>3. Sales Targets & Monthly Remuneration (BDT)</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Monthly Target */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Monthly Sales Target (BDT)
                      </label>
                      <input
                        type="number"
                        value={monthlyTargetBDT}
                        onChange={(e) => setMonthlyTargetBDT(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                      />
                    </div>

                    {/* Basic Salary */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Basic Salary (BDT)
                      </label>
                      <input
                        type="number"
                        value={basicSalaryBDT}
                        onChange={(e) => setBasicSalaryBDT(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                      />
                    </div>

                    {/* Conveyance Allowance */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Conveyance Allowance (BDT)
                      </label>
                      <input
                        type="number"
                        value={formConveyanceBDT}
                        onChange={(e) => setFormConveyanceBDT(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Daily TA/DA Allowance */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Daily TA/DA Allowance (BDT)
                      </label>
                      <input
                        type="number"
                        value={formTaDaBDT}
                        onChange={(e) => setFormTaDaBDT(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Mobile Allowance */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Mobile Phone Allowance (BDT)
                      </label>
                      <input
                        type="number"
                        value={formMobileAllowanceBDT}
                        onChange={(e) => setFormMobileAllowanceBDT(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Account Status */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Account Active Status
                      </label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                      >
                        <option value="Active">Active Duty</option>
                        <option value="Inactive">Inactive / Suspended</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3: OVERTIME POLICY & CONFIGURATION */}
              {(addModalTab === 'all' || addModalTab === 'overtime') && (
                <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/20 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100 dark:border-blue-900/40 pb-3">
                    <div>
                      <h3 className="font-bold text-xs uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>3. Overtime Policy &amp; Configuration</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Individual overtime parameters for this employee. Applied to all overtime requests, approvals, and payroll runs.
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                      formIsOvertimeEligible
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300'
                    }`}>
                      {formIsOvertimeEligible ? 'Eligible for Overtime' : 'Overtime Ineligible'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* 1. Overtime Eligibility (Yes/No) */}
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        1. Overtime Eligibility *
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFormIsOvertimeEligible(true)}
                          className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                            formIsOvertimeEligible
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          Yes (Eligible)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormIsOvertimeEligible(false)}
                          className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                            !formIsOvertimeEligible
                              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          No (Ineligible)
                        </button>
                      </div>
                    </div>

                    {/* 2. Overtime Calculation Basis */}
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        2. Calculation Basis *
                      </label>
                      <select
                        value={formOvertimeCalculationBasis}
                        onChange={(e) => setFormOvertimeCalculationBasis(e.target.value as any)}
                        disabled={!formIsOvertimeEligible}
                        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium disabled:opacity-50"
                      >
                        <option value="Basic Salary">Basic Salary (Basic ÷ Working Hours)</option>
                        <option value="Fixed Hourly Rate">Fixed Hourly Rate (Flat BDT per hour)</option>
                      </select>
                    </div>

                    {/* 3. Monthly Standard Working Hours / Divisor */}
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        3. Monthly Standard Hours / Divisor *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="400"
                          value={formOvertimeStandardHours}
                          onChange={(e) => setFormOvertimeStandardHours(Math.max(1, Number(e.target.value) || 208))}
                          disabled={!formIsOvertimeEligible || formOvertimeCalculationBasis === 'Fixed Hourly Rate'}
                          className="w-full p-2 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-medium disabled:opacity-50"
                          placeholder="208"
                        />
                        <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-medium">Hours</span>
                      </div>
                      <span className="text-[10px] text-slate-400">e.g. 208 hrs (26 days × 8h)</span>
                    </div>

                    {/* 4. Overtime Multiplier */}
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        4. Overtime Multiplier *
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.1"
                          min="1.0"
                          max="5.0"
                          value={formOvertimeMultiplier}
                          onChange={(e) => setFormOvertimeMultiplier(Number(e.target.value) || 2.0)}
                          disabled={!formIsOvertimeEligible}
                          className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold disabled:opacity-50"
                          placeholder="2.0"
                        />
                        <div className="flex gap-1">
                          {[1.5, 2.0].map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setFormOvertimeMultiplier(m)}
                              disabled={!formIsOvertimeEligible}
                              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                                formOvertimeMultiplier === m
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {m}x
                            </button>
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400">Standard factory: 2.0x (BLA 2006) or 1.5x</span>
                    </div>

                    {/* 5. Fixed Overtime Hourly Rate (when applicable) */}
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        5. Fixed Hourly Rate (BDT) {formOvertimeCalculationBasis === 'Fixed Hourly Rate' ? '*' : '(Optional)'}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          value={formOvertimeFixedRate}
                          onChange={(e) => setFormOvertimeFixedRate(Math.max(0, Number(e.target.value) || 0))}
                          disabled={!formIsOvertimeEligible || formOvertimeCalculationBasis !== 'Fixed Hourly Rate'}
                          className={`w-full p-2 pr-12 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold ${
                            formOvertimeCalculationBasis === 'Fixed Hourly Rate'
                              ? 'border-indigo-400 ring-2 ring-indigo-400/20'
                              : 'border-slate-200 dark:border-slate-700 opacity-50'
                          }`}
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-medium">BDT/hr</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Used when Calculation Basis is set to Fixed Hourly Rate</span>
                    </div>

                    {/* 6. Effective From Date */}
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        6. Policy Effective From Date *
                      </label>
                      <input
                        type="date"
                        value={formOvertimeEffectiveFrom}
                        onChange={(e) => setFormOvertimeEffectiveFrom(e.target.value)}
                        required
                        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                      />
                      <span className="text-[10px] text-slate-400">Overtime requisitions from this date use this policy</span>
                    </div>

                    {/* 7. Policy Status (Active/Inactive) */}
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        7. Policy Status *
                      </label>
                      <select
                        value={formOvertimePolicyStatus}
                        onChange={(e) => setFormOvertimePolicyStatus(e.target.value as any)}
                        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                      >
                        <option value="Active">Active (Policy in effect)</option>
                        <option value="Inactive">Inactive (Overtime temporarily suspended)</option>
                      </select>
                      <span className="text-[10px] text-slate-400">Inactive policies block new overtime booking</span>
                    </div>

                    {/* Policy Notes / Agreement Terms */}
                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        Policy Remarks / Terms Reference
                      </label>
                      <input
                        type="text"
                        value={formOvertimePolicyNotes}
                        onChange={(e) => setFormOvertimePolicyNotes(e.target.value)}
                        placeholder="e.g. As per appointment letter annexure (Overtime rate multiplier)"
                        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                      />
                    </div>
                  </div>

                  {/* Live Calculation Preview Box */}
                  {formIsOvertimeEligible && (
                    <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs flex items-center gap-1.5 text-blue-300">
                          <Calculator className="w-3.5 h-3.5 text-blue-400" />
                          <span>Live Policy Rate Preview for {formName || 'this employee'}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formOvertimeCalculationBasis === 'Fixed Hourly Rate'
                            ? `Fixed Rate: ৳${formOvertimeFixedRate}/hr × ${formOvertimeMultiplier}x`
                            : `Basic ৳${(Number(basicSalaryBDT) || 30000).toLocaleString()} ÷ ${formOvertimeStandardHours}h × ${formOvertimeMultiplier}x`}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1 border-t border-slate-800">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Base Hourly Rate:</span>
                          <span className="font-mono font-bold text-white text-xs">
                            ৳{formOvertimeCalculationBasis === 'Fixed Hourly Rate'
                              ? Number(formOvertimeFixedRate || 0).toFixed(2)
                              : ((Number(basicSalaryBDT) || 30000) / (Number(formOvertimeStandardHours) || 208)).toFixed(2)} / hr
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Multiplier:</span>
                          <span className="font-mono font-bold text-amber-400 text-xs">
                            {formOvertimeMultiplier}x
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Net OT Rate:</span>
                          <span className="font-mono font-bold text-emerald-400 text-xs">
                            ৳{(
                              (formOvertimeCalculationBasis === 'Fixed Hourly Rate'
                                ? Number(formOvertimeFixedRate || 0)
                                : ((Number(basicSalaryBDT) || 30000) / (Number(formOvertimeStandardHours) || 208))) *
                              Number(formOvertimeMultiplier || 2.0)
                            ).toFixed(2)} / hr
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Sample 2-Hour OT:</span>
                          <span className="font-mono font-black text-cyan-400 text-xs">
                            ৳{Math.round(
                              (formOvertimeCalculationBasis === 'Fixed Hourly Rate'
                                ? Number(formOvertimeFixedRate || 0)
                                : ((Number(basicSalaryBDT) || 30000) / (Number(formOvertimeStandardHours) || 208))) *
                              Number(formOvertimeMultiplier || 2.0) * 2
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 4: APP PERMISSIONS & CHANNEL TAGS */}
              {(addModalTab === 'all' || addModalTab === 'permissions') && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-800/20 space-y-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>4. App Permissions & Channel Tags</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* App Permissions */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        App Permissions Profile
                      </label>
                      <select
                        value={appPermissions}
                        onChange={(e) => setAppPermissions(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                      >
                        {APP_PERMISSIONS_LIST.map((perm) => (
                          <option key={perm} value={perm}>
                            {perm}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Field Force Tags */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Field Force Tags
                      </label>
                      <select
                        value={fieldForceTags}
                        onChange={(e) => setFieldForceTags(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        {FIELD_FORCE_TAGS_LIST.map((tag) => (
                          <option key={tag} value={tag}>
                            {tag}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Customer Tags */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Customer Channels Tag
                      </label>
                      <select
                        value={customerTags}
                        onChange={(e) => setCustomerTags(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        {CUSTOMER_TAGS_LIST.map((tag) => (
                          <option key={tag} value={tag}>
                            {tag}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 5: TADA APPROVE PERSON (SUPER ADMIN WORKFLOW) */}
              {(addModalTab === 'all' || addModalTab === 'approver') && (
                <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>5. TADA Approve Person (Super Admin Tagging)</span>
                    </h4>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                      Approval Authority
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Assign which manager or executive has authority to review and approve Travel Allowance & Daily Allowance (TADA) claims generated by this officer.
                  </p>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Select Designated TADA Approver<span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formTadaApproverId}
                      onChange={(e) => setFormTadaApproverId(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- No Approver Tagged (Unassigned) --</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} — {u.role} ({u.designation || u.department || 'User'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* SECTION 6: HR, PERSONAL & BANKING RECORDS */}
              {(addModalTab === 'all' || addModalTab === 'hr') && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-800/20 space-y-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Building className="w-4 h-4" />
                    <span>6. HR, Personal & Banking Information</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Employee Category */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Employee Category
                      </label>
                      <select
                        value={formEmployeeCategory}
                        onChange={(e) => setFormEmployeeCategory(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="Field Employee">Field Employee</option>
                        <option value="Office Employee">Office Employee</option>
                        <option value="Factory Employee">Factory Employee</option>
                        <option value="Warehouse Employee">Warehouse Employee</option>
                        <option value="Management Employee">Management Employee</option>
                        <option value="Other Employee">Other Employee</option>
                      </select>
                    </div>

                    {/* Employment Type */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Employment Type
                      </label>
                      <select
                        value={formEmploymentType}
                        onChange={(e) => setFormEmploymentType(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="Permanent">Permanent</option>
                        <option value="Contractual">Contractual</option>
                        <option value="Probationary">Probationary</option>
                        <option value="Intern">Intern</option>
                        <option value="Part-time">Part-time</option>
                      </select>
                    </div>

                    {/* National ID */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        National ID / NID Number
                      </label>
                      <input
                        type="text"
                        value={formNationalId}
                        onChange={(e) => setFormNationalId(e.target.value)}
                        placeholder="NID 10/17 digits"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      />
                    </div>

                    {/* Present Address */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Present Address
                      </label>
                      <input
                        type="text"
                        value={formPresentAddress}
                        onChange={(e) => setFormPresentAddress(e.target.value)}
                        placeholder="House, Road, Area, City"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Permanent Address */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Permanent Address
                      </label>
                      <input
                        type="text"
                        value={formPermanentAddress}
                        onChange={(e) => setFormPermanentAddress(e.target.value)}
                        placeholder="Village, Post, Thana, District"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Emergency Contact Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Emergency Contact Name
                      </label>
                      <input
                        type="text"
                        value={formEmergencyContactName}
                        onChange={(e) => setFormEmergencyContactName(e.target.value)}
                        placeholder="Contact person name"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Emergency Contact Phone */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Emergency Contact Phone
                      </label>
                      <input
                        type="text"
                        value={formEmergencyContactPhone}
                        onChange={(e) => setFormEmergencyContactPhone(e.target.value)}
                        placeholder="+880 1700-000000"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Emergency Contact Relation */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Relationship
                      </label>
                      <input
                        type="text"
                        value={formEmergencyContactRelation}
                        onChange={(e) => setFormEmergencyContactRelation(e.target.value)}
                        placeholder="Spouse / Parent / Sibling"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Bank Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={formBankName}
                        onChange={(e) => setFormBankName(e.target.value)}
                        placeholder="e.g. Eastern Bank PLC"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                      />
                    </div>

                    {/* Bank Account Number */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Bank Account Number
                      </label>
                      <input
                        type="text"
                        value={formBankAccountNumber}
                        onChange={(e) => setFormBankAccountNumber(e.target.value)}
                        placeholder="Account digits"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      />
                    </div>

                    {/* Bank Branch */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Bank Branch
                      </label>
                      <input
                        type="text"
                        value={formBankBranch}
                        onChange={(e) => setFormBankBranch(e.target.value)}
                        placeholder="Branch location"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Routing Number */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Bank Routing Number
                      </label>
                      <input
                        type="text"
                        value={formRoutingNumber}
                        onChange={(e) => setFormRoutingNumber(e.target.value)}
                        placeholder="9-digit routing number"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      />
                    </div>

                    {/* Mobile Banking Provider */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Mobile Financial Service (MFS)
                      </label>
                      <select
                        value={formMobileBankingProvider}
                        onChange={(e) => setFormMobileBankingProvider(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                      >
                        <option value="bKash">bKash</option>
                        <option value="Nagad">Nagad</option>
                        <option value="Rocket">Rocket</option>
                        <option value="Upay">Upay</option>
                      </select>
                    </div>

                    {/* Mobile Banking Wallet Number */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        MFS Wallet Number
                      </label>
                      <input
                        type="text"
                        value={formMobileBankingNumber}
                        onChange={(e) => setFormMobileBankingNumber(e.target.value)}
                        placeholder="017XXXXXXXX"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-400">
                  New Record: <strong className="font-mono text-slate-700 dark:text-slate-300">{formCode || 'Auto Code'}</strong>
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Save &amp; Register FieldForce</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT FIELDFORCE PROFILE */}
      {/* ======================================================== */}
      {editingRep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-4 max-h-[94vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Edit FieldForce Officer:</span>
                    <span className="text-blue-600 dark:text-blue-400">{editingRep.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-300">
                      {editingRep.code}
                    </span>
                  </h2>
                  
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRep(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Section Tab Switcher */}
            <div className="flex items-center gap-1 px-6 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs">
              {[
                { id: 'all', label: 'All Sections', icon: Sliders },
                { id: 'basic', label: '1. Core & Hierarchy', icon: MapPin },
                { id: 'target', label: '2. Remuneration & Targets', icon: DollarSign },
                { id: 'overtime', label: '3. Overtime Policy & Configuration', icon: Clock },
                { id: 'permissions', label: '4. Permissions & Tags', icon: ShieldCheck },
                { id: 'approver', label: '5. TADA Approver', icon: UserCheck },
                { id: 'hr', label: '5. HR & Banking', icon: Building },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = editModalTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setEditModalTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
              {/* SECTION 1: CORE OFFICER IDENTIFICATION & BASIC INFORMATION */}
              {(editModalTab === 'all' || editModalTab === 'basic') && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-800/20 space-y-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>1. Core Officer Profile & Identification</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Code */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Officer Code<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* PIN */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        PIN (Mobile Login)<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formPin}
                        onChange={(e) => setFormPin(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Full Name (English)<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                      />
                    </div>

                    {/* Native Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Native Name (বাংলা)<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formNativeName}
                        onChange={(e) => setFormNativeName(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Mobile */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Mobile Phone Number<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formMobile}
                        onChange={(e) => setFormMobile(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        placeholder="officer@ensec.com.bd"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* FieldForce Type */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        FieldForce Type<span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formFieldType}
                        onChange={(e) => setFormFieldType(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                      >
                        {FIELD_FORCE_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Designation */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Official Designation
                      </label>
                      <input
                        type="text"
                        value={formDesignation}
                        onChange={(e) => setFormDesignation(e.target.value)}
                        placeholder="e.g. Senior Territory Sales Officer"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                      />
                    </div>

                    {/* Action Type */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Action Type
                      </label>
                      <select
                        value={formActionType}
                        onChange={(e) => setFormActionType(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        {ACTION_TYPES.map((act) => (
                          <option key={act} value={act}>
                            {act}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Joining Date */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Joining Date
                      </label>
                      <input
                        type="date"
                        value={formJoiningDate}
                        onChange={(e) => setFormJoiningDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Discontinue Date */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Discontinue / Exit Date
                      </label>
                      <input
                        type="date"
                        value={formDiscontinueDate}
                        onChange={(e) => setFormDiscontinueDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Invoice Within Days */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Invoice Within (Days)<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        required
                        value={invoiceWithinDays}
                        onChange={(e) => setInvoiceWithinDays(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: MARKET HIERARCHY, BEAT & TERRITORY TAGGING */}
              {(editModalTab === 'all' || editModalTab === 'basic') && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-800/20 space-y-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span>2. Market Beat, Territory & Hierarchy Tagging</span>
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Market Hierarchy Selector */}
                    <div className="p-3.5 rounded-xl border-2 border-red-500 bg-red-50/20 dark:bg-red-950/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-blue-600 dark:text-blue-400">
                          Market Hierarchy
                        </label>
                        <span className="text-[10px] text-red-600 dark:text-red-400 font-semibold uppercase tracking-wider">
                          Tagged Market Beat
                        </span>
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search market hierarchy..."
                          value={marketHierarchySearch}
                          onChange={(e) => {
                            setMarketHierarchySearch(e.target.value);
                            setShowMarketDropdown(true);
                          }}
                          onFocus={() => setShowMarketDropdown(true)}
                          className="w-full pl-3 pr-14 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="absolute right-2 top-2 flex items-center gap-1 text-slate-400">
                          {marketHierarchySearch && (
                            <button
                              type="button"
                              onClick={() => setMarketHierarchySearch('')}
                              className="p-0.5 hover:text-slate-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowMarketDropdown(!showMarketDropdown)}
                            className="p-0.5 hover:text-slate-600"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {formMarketHierarchy && (
                        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 font-mono text-xs">
                          <Tag className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                          <span className="font-semibold">{formMarketHierarchy}</span>
                        </div>
                      )}

                      {showMarketDropdown && (
                        <div className="border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 shadow-md max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60">
                          {filteredMarketHierarchyOptions.map((opt) => {
                            const isSelected = formMarketHierarchy === opt.fullName;
                            return (
                              <div
                                key={opt.code + opt.fullName}
                                onClick={() => {
                                  setFormMarketHierarchy(opt.fullName);
                                  setFormRegion(opt.region || formRegion);
                                  setFormArea(opt.area || formArea);
                                  setFormTerritory(opt.name || formTerritory);
                                  setShowMarketDropdown(false);
                                }}
                                className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                                  isSelected
                                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                <span className="font-mono">{opt.fullName}</span>
                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Territory & Assigned Hierarchy breakdown */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Region
                          </label>
                          <input
                            type="text"
                            value={formRegion}
                            onChange={(e) => setFormRegion(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Area
                          </label>
                          <input
                            type="text"
                            value={formArea}
                            onChange={(e) => setFormArea(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Territory
                          </label>
                          <input
                            type="text"
                            value={formTerritory}
                            onChange={(e) => setFormTerritory(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      {/* Distributor */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Assigned Distributor
                        </label>
                        <select
                          value={selectedDistributorId}
                          onChange={(e) => {
                            setSelectedDistributorId(e.target.value);
                            const dist = distributors.find((d) => d.id === e.target.value);
                            if (dist) setSelectedDistributorName(dist.name);
                          }}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                        >
                          <option value="">-- Select Distributor --</option>
                          {distributors.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name} ({d.dbPoint || d.district || 'Hub'})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Parent Code */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Parent Supervisor / Line Manager Code
                        </label>
                        <select
                          value={parentCode}
                          onChange={(e) => setParentCode(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                        >
                          <option value="">-- Select Parent / Supervisor --</option>
                          <option value="MGT-01">MGT-01 - National Sales Director</option>
                          {cleanFieldForceReps
                            .filter((r) => r.id !== editingRep.id)
                            .map((r) => (
                              <option key={r.id} value={r.code}>
                                {r.code} - {r.name} ({r.designation || r.fieldForceType})
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Departments checklist */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Assigned Business Departments
                    </label>
                    <div className="border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 bg-slate-50/60 dark:bg-slate-800/40 max-h-36 overflow-y-auto space-y-2">
                      <label className="flex items-center gap-2 text-xs cursor-pointer font-semibold border-b pb-1 text-slate-800 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={allDepartmentsChecked}
                          onChange={toggleAllDepartments}
                          className="rounded text-blue-600 w-3.5 h-3.5"
                        />
                        <span>All Standard Departments</span>
                      </label>
                      {availableDepartmentOptions.map((dept) => (
                        <label key={dept} className="flex items-center gap-2 text-[11px] cursor-pointer text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={selectedDepartments.includes(dept)}
                            onChange={() => toggleDepartment(dept)}
                            className="rounded text-blue-600 w-3.5 h-3.5"
                          />
                          <span>{dept}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3: TARGET, REMUNERATION & COMPENSATION (BDT) */}
              {(editModalTab === 'all' || editModalTab === 'target') && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-800/20 space-y-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" />
                    <span>3. Sales Targets & Monthly Remuneration (BDT)</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Monthly Target */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Monthly Sales Target (BDT)
                      </label>
                      <input
                        type="number"
                        value={monthlyTargetBDT}
                        onChange={(e) => setMonthlyTargetBDT(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                      />
                    </div>

                    {/* Basic Salary */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Basic Salary (BDT)
                      </label>
                      <input
                        type="number"
                        value={basicSalaryBDT}
                        onChange={(e) => setBasicSalaryBDT(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                      />
                    </div>

                    {/* Conveyance Allowance */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Conveyance Allowance (BDT)
                      </label>
                      <input
                        type="number"
                        value={formConveyanceBDT}
                        onChange={(e) => setFormConveyanceBDT(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Daily TA/DA Allowance */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Daily TA/DA Allowance (BDT)
                      </label>
                      <input
                        type="number"
                        value={formTaDaBDT}
                        onChange={(e) => setFormTaDaBDT(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Mobile Allowance */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Mobile Phone Allowance (BDT)
                      </label>
                      <input
                        type="number"
                        value={formMobileAllowanceBDT}
                        onChange={(e) => setFormMobileAllowanceBDT(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Account Status */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Account Active Status
                      </label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                      >
                        <option value="Active">Active Duty</option>
                        <option value="Inactive">Inactive / Suspended</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3: OVERTIME POLICY & CONFIGURATION */}
              {(editModalTab === 'all' || editModalTab === 'overtime') && (
                <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/20 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100 dark:border-blue-900/40 pb-3">
                    <div>
                      <h3 className="font-bold text-xs uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>3. Overtime Policy &amp; Configuration</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Individual overtime parameters for {editingRep.name} ({editingRep.code}). If modified, previous terms are archived into version history.
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                      formIsOvertimeEligible
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300'
                    }`}>
                      {formIsOvertimeEligible ? 'Eligible for Overtime' : 'Overtime Ineligible'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* 1. Overtime Eligibility (Yes/No) */}
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        1. Overtime Eligibility *
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFormIsOvertimeEligible(true)}
                          className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                            formIsOvertimeEligible
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          Yes (Eligible)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormIsOvertimeEligible(false)}
                          className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                            !formIsOvertimeEligible
                              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          No (Ineligible)
                        </button>
                      </div>
                    </div>

                    {/* 2. Overtime Calculation Basis */}
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        2. Calculation Basis *
                      </label>
                      <select
                        value={formOvertimeCalculationBasis}
                        onChange={(e) => setFormOvertimeCalculationBasis(e.target.value as any)}
                        disabled={!formIsOvertimeEligible}
                        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium disabled:opacity-50"
                      >
                        <option value="Basic Salary">Basic Salary (Basic ÷ Working Hours)</option>
                        <option value="Fixed Hourly Rate">Fixed Hourly Rate (Flat BDT per hour)</option>
                      </select>
                    </div>

                    {/* 3. Monthly Standard Working Hours / Divisor */}
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        3. Monthly Standard Hours / Divisor *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="400"
                          value={formOvertimeStandardHours}
                          onChange={(e) => setFormOvertimeStandardHours(Math.max(1, Number(e.target.value) || 208))}
                          disabled={!formIsOvertimeEligible || formOvertimeCalculationBasis === 'Fixed Hourly Rate'}
                          className="w-full p-2 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-medium disabled:opacity-50"
                          placeholder="208"
                        />
                        <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-medium">Hours</span>
                      </div>
                      <span className="text-[10px] text-slate-400">e.g. 208 hrs (26 days × 8h)</span>
                    </div>

                    {/* 4. Overtime Multiplier */}
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        4. Overtime Multiplier *
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.1"
                          min="1.0"
                          max="5.0"
                          value={formOvertimeMultiplier}
                          onChange={(e) => setFormOvertimeMultiplier(Number(e.target.value) || 2.0)}
                          disabled={!formIsOvertimeEligible}
                          className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold disabled:opacity-50"
                          placeholder="2.0"
                        />
                        <div className="flex gap-1">
                          {[1.5, 2.0].map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setFormOvertimeMultiplier(m)}
                              disabled={!formIsOvertimeEligible}
                              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                                formOvertimeMultiplier === m
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {m}x
                            </button>
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400">Standard factory: 2.0x (BLA 2006) or 1.5x</span>
                    </div>

                    {/* 5. Fixed Overtime Hourly Rate (when applicable) */}
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        5. Fixed Hourly Rate (BDT) {formOvertimeCalculationBasis === 'Fixed Hourly Rate' ? '*' : '(Optional)'}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          value={formOvertimeFixedRate}
                          onChange={(e) => setFormOvertimeFixedRate(Math.max(0, Number(e.target.value) || 0))}
                          disabled={!formIsOvertimeEligible || formOvertimeCalculationBasis !== 'Fixed Hourly Rate'}
                          className={`w-full p-2 pr-12 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold ${
                            formOvertimeCalculationBasis === 'Fixed Hourly Rate'
                              ? 'border-indigo-400 ring-2 ring-indigo-400/20'
                              : 'border-slate-200 dark:border-slate-700 opacity-50'
                          }`}
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-medium">BDT/hr</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Used when Calculation Basis is set to Fixed Hourly Rate</span>
                    </div>

                    {/* 6. Effective From Date */}
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        6. Policy Effective From Date *
                      </label>
                      <input
                        type="date"
                        value={formOvertimeEffectiveFrom}
                        onChange={(e) => setFormOvertimeEffectiveFrom(e.target.value)}
                        required
                        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                      />
                      <span className="text-[10px] text-slate-400">Overtime requisitions from this date use this policy</span>
                    </div>

                    {/* 7. Policy Status (Active/Inactive) */}
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        7. Policy Status *
                      </label>
                      <select
                        value={formOvertimePolicyStatus}
                        onChange={(e) => setFormOvertimePolicyStatus(e.target.value as any)}
                        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                      >
                        <option value="Active">Active (Policy in effect)</option>
                        <option value="Inactive">Inactive (Overtime temporarily suspended)</option>
                      </select>
                      <span className="text-[10px] text-slate-400">Inactive policies block new overtime booking</span>
                    </div>

                    {/* Policy Notes / Amendment Reasons */}
                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        Policy Remarks / Amendment Reference
                      </label>
                      <input
                        type="text"
                        value={formOvertimePolicyNotes}
                        onChange={(e) => setFormOvertimePolicyNotes(e.target.value)}
                        placeholder="e.g. Rate updated per annual review agreement or promotion"
                        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                      />
                    </div>
                  </div>

                  {/* Live Calculation Preview Box */}
                  {formIsOvertimeEligible && (
                    <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs flex items-center gap-1.5 text-blue-300">
                          <Calculator className="w-3.5 h-3.5 text-blue-400" />
                          <span>Live Policy Rate Preview for {formName || editingRep.name}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formOvertimeCalculationBasis === 'Fixed Hourly Rate'
                            ? `Fixed Rate: ৳${formOvertimeFixedRate}/hr × ${formOvertimeMultiplier}x`
                            : `Basic ৳${(Number(basicSalaryBDT) || 30000).toLocaleString()} ÷ ${formOvertimeStandardHours}h × ${formOvertimeMultiplier}x`}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1 border-t border-slate-800">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Base Hourly Rate:</span>
                          <span className="font-mono font-bold text-white text-xs">
                            ৳{formOvertimeCalculationBasis === 'Fixed Hourly Rate'
                              ? Number(formOvertimeFixedRate || 0).toFixed(2)
                              : ((Number(basicSalaryBDT) || 30000) / (Number(formOvertimeStandardHours) || 208)).toFixed(2)} / hr
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Multiplier:</span>
                          <span className="font-mono font-bold text-amber-400 text-xs">
                            {formOvertimeMultiplier}x
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Net OT Rate:</span>
                          <span className="font-mono font-bold text-emerald-400 text-xs">
                            ৳{(
                              (formOvertimeCalculationBasis === 'Fixed Hourly Rate'
                                ? Number(formOvertimeFixedRate || 0)
                                : ((Number(basicSalaryBDT) || 30000) / (Number(formOvertimeStandardHours) || 208))) *
                              Number(formOvertimeMultiplier || 2.0)
                            ).toFixed(2)} / hr
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Sample 2-Hour OT:</span>
                          <span className="font-mono font-black text-cyan-400 text-xs">
                            ৳{Math.round(
                              (formOvertimeCalculationBasis === 'Fixed Hourly Rate'
                                ? Number(formOvertimeFixedRate || 0)
                                : ((Number(basicSalaryBDT) || 30000) / (Number(formOvertimeStandardHours) || 208))) *
                              Number(formOvertimeMultiplier || 2.0) * 2
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Historical Policy Versions Changelog */}
                  {editingRep.overtimePolicyHistory && editingRep.overtimePolicyHistory.length > 0 && (
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <History className="w-3.5 h-3.5 text-blue-600" />
                          <span>Policy Version &amp; Amendment History ({editingRep.overtimePolicyHistory.length} previous terms archived)</span>
                        </span>
                        <span className="text-[10px] text-slate-400">Historical OT records retain their original rate calculations</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[11px] text-left">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-medium">
                              <th className="py-1.5 px-2">Effective Period</th>
                              <th className="py-1.5 px-2">Eligibility</th>
                              <th className="py-1.5 px-2">Calculation Basis</th>
                              <th className="py-1.5 px-2 text-right">Divisor</th>
                              <th className="py-1.5 px-2 text-right">Multiplier</th>
                              <th className="py-1.5 px-2 text-right">Fixed Rate</th>
                              <th className="py-1.5 px-2">Notes &amp; Archived By</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {editingRep.overtimePolicyHistory.map((hist, idx) => (
                              <tr key={hist.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="py-1.5 px-2 font-mono font-medium text-slate-700 dark:text-slate-300">
                                  {hist.effectiveFrom} → {hist.effectiveTo || 'Superseded'}
                                </td>
                                <td className="py-1.5 px-2">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    hist.isEligible ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {hist.isEligible ? 'Eligible' : 'Ineligible'}
                                  </span>
                                </td>
                                <td className="py-1.5 px-2 font-medium">{hist.calculationBasis}</td>
                                <td className="py-1.5 px-2 text-right font-mono">{hist.standardMonthlyWorkingHours}h</td>
                                <td className="py-1.5 px-2 text-right font-mono font-bold text-amber-600">{hist.overtimeMultiplier}x</td>
                                <td className="py-1.5 px-2 text-right font-mono">
                                  {hist.fixedHourlyRateBDT ? `৳${hist.fixedHourlyRateBDT}` : 'N/A'}
                                </td>
                                <td className="py-1.5 px-2 text-slate-500">
                                  {hist.notes || 'Routine revision'} {hist.updatedBy ? `(${hist.updatedBy})` : ''}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 4: APP PERMISSIONS & CHANNEL TAGS */}
              {(editModalTab === 'all' || editModalTab === 'permissions') && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-800/20 space-y-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>4. App Permissions & Channel Tags</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* App Permissions */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        App Permissions Profile
                      </label>
                      <select
                        value={appPermissions}
                        onChange={(e) => setAppPermissions(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                      >
                        {APP_PERMISSIONS_LIST.map((perm) => (
                          <option key={perm} value={perm}>
                            {perm}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Field Force Tags */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Field Force Tags
                      </label>
                      <select
                        value={fieldForceTags}
                        onChange={(e) => setFieldForceTags(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        {FIELD_FORCE_TAGS_LIST.map((tag) => (
                          <option key={tag} value={tag}>
                            {tag}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Customer Tags */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Customer Channels Tag
                      </label>
                      <select
                        value={customerTags}
                        onChange={(e) => setCustomerTags(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        {CUSTOMER_TAGS_LIST.map((tag) => (
                          <option key={tag} value={tag}>
                            {tag}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 5: TADA APPROVE PERSON (SUPER ADMIN WORKFLOW) */}
              {(editModalTab === 'all' || editModalTab === 'approver') && (
                <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>5. TADA Approve Person (Super Admin Tagging)</span>
                    </h4>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                      Approval Authority
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Assign which manager or executive has authority to review and approve Travel Allowance & Daily Allowance (TADA) claims generated by this officer.
                  </p>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Select Designated TADA Approver<span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formTadaApproverId}
                      onChange={(e) => setFormTadaApproverId(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- No Approver Tagged (Unassigned) --</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} — {u.role} ({u.designation || u.department || 'User'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* SECTION 6: HR, PERSONAL & BANKING RECORDS */}
              {(editModalTab === 'all' || editModalTab === 'hr') && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-800/20 space-y-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Building className="w-4 h-4" />
                    <span>6. HR, Personal & Banking Information</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Employee Category */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Employee Category
                      </label>
                      <select
                        value={formEmployeeCategory}
                        onChange={(e) => setFormEmployeeCategory(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="Field Employee">Field Employee</option>
                        <option value="Office Employee">Office Employee</option>
                        <option value="Factory Employee">Factory Employee</option>
                        <option value="Warehouse Employee">Warehouse Employee</option>
                        <option value="Management Employee">Management Employee</option>
                        <option value="Other Employee">Other Employee</option>
                      </select>
                    </div>

                    {/* Employment Type */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Employment Type
                      </label>
                      <select
                        value={formEmploymentType}
                        onChange={(e) => setFormEmploymentType(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="Permanent">Permanent</option>
                        <option value="Contractual">Contractual</option>
                        <option value="Probationary">Probationary</option>
                        <option value="Intern">Intern</option>
                        <option value="Part-time">Part-time</option>
                      </select>
                    </div>

                    {/* National ID */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        National ID / NID Number
                      </label>
                      <input
                        type="text"
                        value={formNationalId}
                        onChange={(e) => setFormNationalId(e.target.value)}
                        placeholder="NID 10/17 digits"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      />
                    </div>

                    {/* Present Address */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Present Address
                      </label>
                      <input
                        type="text"
                        value={formPresentAddress}
                        onChange={(e) => setFormPresentAddress(e.target.value)}
                        placeholder="House, Road, Area, City"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Permanent Address */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Permanent Address
                      </label>
                      <input
                        type="text"
                        value={formPermanentAddress}
                        onChange={(e) => setFormPermanentAddress(e.target.value)}
                        placeholder="Village, Post, Thana, District"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Emergency Contact Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Emergency Contact Name
                      </label>
                      <input
                        type="text"
                        value={formEmergencyContactName}
                        onChange={(e) => setFormEmergencyContactName(e.target.value)}
                        placeholder="Contact person name"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Emergency Contact Phone */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Emergency Contact Phone
                      </label>
                      <input
                        type="text"
                        value={formEmergencyContactPhone}
                        onChange={(e) => setFormEmergencyContactPhone(e.target.value)}
                        placeholder="+880 1700-000000"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Emergency Contact Relation */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Relationship
                      </label>
                      <input
                        type="text"
                        value={formEmergencyContactRelation}
                        onChange={(e) => setFormEmergencyContactRelation(e.target.value)}
                        placeholder="Spouse / Parent / Sibling"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Bank Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={formBankName}
                        onChange={(e) => setFormBankName(e.target.value)}
                        placeholder="e.g. Eastern Bank PLC"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                      />
                    </div>

                    {/* Bank Account Number */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Bank Account Number
                      </label>
                      <input
                        type="text"
                        value={formBankAccountNumber}
                        onChange={(e) => setFormBankAccountNumber(e.target.value)}
                        placeholder="Account digits"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      />
                    </div>

                    {/* Bank Branch */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Bank Branch
                      </label>
                      <input
                        type="text"
                        value={formBankBranch}
                        onChange={(e) => setFormBankBranch(e.target.value)}
                        placeholder="Branch location"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Routing Number */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Bank Routing Number
                      </label>
                      <input
                        type="text"
                        value={formRoutingNumber}
                        onChange={(e) => setFormRoutingNumber(e.target.value)}
                        placeholder="9-digit routing number"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      />
                    </div>

                    {/* Mobile Banking Provider */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Mobile Financial Service (MFS)
                      </label>
                      <select
                        value={formMobileBankingProvider}
                        onChange={(e) => setFormMobileBankingProvider(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                      >
                        <option value="bKash">bKash</option>
                        <option value="Nagad">Nagad</option>
                        <option value="Rocket">Rocket</option>
                        <option value="Upay">Upay</option>
                      </select>
                    </div>

                    {/* Mobile Banking Wallet Number */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        MFS Wallet Number
                      </label>
                      <input
                        type="text"
                        value={formMobileBankingNumber}
                        onChange={(e) => setFormMobileBankingNumber(e.target.value)}
                        placeholder="017XXXXXXXX"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-400">
                  Editing Record: <strong className="font-mono text-slate-700 dark:text-slate-300">{editingRep.code}</strong> • ID: {editingRep.id}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingRep(null)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save All Changes</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: 9-TAB COMPREHENSIVE EMPLOYEE & FIELD FORCE PROFILE */}
      {/* ======================================================== */}
      {viewingRep && (
        <EmployeeProfileModal
          employee={viewingRep}
          onClose={() => setViewingRep(null)}
          onEdit={(emp) => {
            setViewingRep(null);
            handleOpenEdit(emp);
          }}
        />
      )}

      {/* QUICK TAG TADA APPROVER MODAL (SUPER ADMIN DIRECT ACTION) */}
      {repToTagTadaApprover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-blue-50/70 dark:bg-blue-950/50">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Tag TADA Approve Person
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Assign approval authority for {repToTagTadaApprover.name} ({repToTagTadaApprover.code})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRepToTagTadaApprover(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-xs">
              {quickTagSuccessMsg && (
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{quickTagSuccessMsg}</span>
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">FIELD OFFICER</span>
                  <span className="font-bold text-slate-900 dark:text-white">{repToTagTadaApprover.name}</span>
                  <span className="text-[11px] text-slate-500 block">Code: {repToTagTadaApprover.code} • {repToTagTadaApprover.fieldForceType || 'Officer'}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">CURRENT APPROVER</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {repToTagTadaApprover.tadaApproverName || 'Not Tagged'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select User to Tag as TADA Approver*
                </label>
                <select
                  value={quickSelectedApproverId}
                  onChange={(e) => setQuickSelectedApproverId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Approver User --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.role} ({u.designation || u.department || 'User'})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                  Super Admin Setting: TADA claims created by this officer will be automatically tagged to this user for approval.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-slate-800/30">
              <button
                type="button"
                onClick={() => setRepToTagTadaApprover(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveQuickTagTadaApprover}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Approver Tag</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {repToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-5 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Delete Field Officer?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <b>{repToDelete.name}</b> ({repToDelete.code}) from the Field Force Directory?
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRepToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
