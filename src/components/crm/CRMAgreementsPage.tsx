import React, { useState, useMemo, useRef } from 'react';
import {
  FileSignature,
  PlusCircle,
  Search,
  Building2,
  Phone,
  Calendar,
  CalendarDays,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  MessageSquare,
  Send,
  Briefcase,
  TrendingUp,
  Tag,
  Filter,
  Check,
  ChevronRight,
  ShieldCheck,
  Package,
  Layers,
  FileCheck2,
  X,
  Upload,
  Download,
  FileSpreadsheet,
  FileUp,
  ArrowUpDown,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { CRMLeadAgreement } from '../../types/erp.ts';

const STAGE_CONFIG: Record<
  CRMLeadAgreement['stage'],
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  Lead: {
    label: 'Lead',
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-400',
  },
  Contacted: {
    label: 'Contacted',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  'Proposal Sent': {
    label: 'Proposal Sent',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
  'Agreement Signed': {
    label: 'Agreement Signed',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  Lost: {
    label: 'Lost / Closed',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
    dot: 'bg-rose-500',
  },
};

type DatePreset = 'all' | 'today' | 'last7' | 'thisMonth' | 'last30' | 'thisYear' | 'custom';

export const CRMAgreementsPage: React.FC = () => {
  const {
    crmAgreements,
    addCRMLead,
    bulkAddCRMLeads,
    syncAllCRMLeadsToSupabase,
    addCRMCommunicationNote,
    updateCRMDealStage,
    deleteCRMDeal,
    refreshCRMAgreements,
    clearCRMAgreementsCache,
    currentUser,
  } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('All');
  const [selectedDealId, setSelectedDealId] = useState<string>(crmAgreements[0]?.id || '');
  const [showAddDealModal, setShowAddDealModal] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [selectedQuickTag, setSelectedQuickTag] = useState('');

  // Initial load from Supabase & purge any legacy sample/local session memory
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Purge legacy sample/mock keys
        localStorage.removeItem('ensec_crm_agreements_sample');
        const stored = localStorage.getItem('ensec_crm_agreements');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const hasLegacySample = parsed.some(
              (p) =>
                p.id === 'crm-01' ||
                p.id === 'crm-02' ||
                p.id === 'crm-03' ||
                String(p.clientName || '').includes('Grameenphone') ||
                String(p.clientName || '').includes('Summit Towers') ||
                String(p.clientName || '').includes('Apex Battery')
            );
            if (hasLegacySample) {
              const cleaned = parsed.filter(
                (p) =>
                  p.id !== 'crm-01' &&
                  p.id !== 'crm-02' &&
                  p.id !== 'crm-03' &&
                  !String(p.clientName || '').includes('Grameenphone') &&
                  !String(p.clientName || '').includes('Summit Towers') &&
                  !String(p.clientName || '').includes('Apex Battery')
              );
              if (cleaned.length > 0) {
                localStorage.setItem('ensec_crm_agreements', JSON.stringify(cleaned));
              } else {
                localStorage.removeItem('ensec_crm_agreements');
                sessionStorage.removeItem('ensec_crm_agreements');
              }
            }
          }
        }
      } catch (e) {
        console.warn('Storage cleanup notice:', e);
      }
    }

    if (refreshCRMAgreements) {
      refreshCRMAgreements();
    }
  }, []);

  // Date Filter State
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showDateFilterPopover, setShowDateFilterPopover] = useState(false);

  // CSV Lead Upload State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadParsedLeads, setUploadParsedLeads] = useState<Omit<CRMLeadAgreement, 'id'>[]>([]);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [rawPastedCSV, setRawPastedCSV] = useState('');
  const [uploadInputMode, setUploadInputMode] = useState<'file' | 'paste'>('file');
  const [isImporting, setIsImporting] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteSaveNotice, setNoteSaveNotice] = useState<{ message: string; success: boolean } | null>(null);

  // Feedback Toast
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  // Form State for New Deal
  const [dealClientName, setDealClientName] = useState('');
  const [dealCompanyName, setDealCompanyName] = useState('');
  const [dealPhone, setDealPhone] = useState('');
  const [dealVolumeUnits, setDealVolumeUnits] = useState(100);
  const [dealEstValueBDT, setDealEstValueBDT] = useState(11500000);
  const [dealTermMonths, setDealTermMonths] = useState(12);
  const [dealStage, setDealStage] = useState<CRMLeadAgreement['stage']>('Lead');
  const [dealSalesperson, setDealSalesperson] = useState(currentUser?.name || 'Tanvir Hossain');
  const [initialNote, setInitialNote] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selected Deal
  const selectedDeal = crmAgreements.find((d) => d.id === selectedDealId) || crmAgreements[0] || null;

  // Set Date Preset Helper
  const applyDatePreset = (preset: DatePreset) => {
    setDatePreset(preset);
    const today = new Date();
    const toYMD = (d: Date) => d.toISOString().substring(0, 10);

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'today') {
      const todayStr = toYMD(today);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'last7') {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      setStartDate(toYMD(past));
      setEndDate(toYMD(today));
    } else if (preset === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(toYMD(firstDay));
      setEndDate(toYMD(today));
    } else if (preset === 'last30') {
      const past = new Date();
      past.setDate(today.getDate() - 30);
      setStartDate(toYMD(past));
      setEndDate(toYMD(today));
    } else if (preset === 'thisYear') {
      const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
      setStartDate(toYMD(firstDayOfYear));
      setEndDate(toYMD(today));
    }
  };

  // Filtered Deals (Search + Stage + Date Range)
  const filteredDeals = useMemo(() => {
    return crmAgreements.filter((deal) => {
      // 1. Search filter
      const search = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !search ||
        (deal.clientName && deal.clientName.toLowerCase().includes(search)) ||
        (deal.companyName && deal.companyName.toLowerCase().includes(search)) ||
        (deal.phone && deal.phone.toLowerCase().includes(search)) ||
        (deal.salespersonName && deal.salespersonName.toLowerCase().includes(search));

      // 2. Stage filter
      const matchesStage = selectedStageFilter === 'All' || deal.stage === selectedStageFilter;

      // 3. Date filter (based on lastContactDate or creation notes date)
      let matchesDate = true;
      const dealDate = deal.lastContactDate || deal.communicationNotes?.[0]?.date || '';
      if (startDate && dealDate) {
        matchesDate = matchesDate && dealDate >= startDate;
      }
      if (endDate && dealDate) {
        matchesDate = matchesDate && dealDate <= endDate;
      }

      return matchesSearch && matchesStage && matchesDate;
    });
  }, [crmAgreements, searchTerm, selectedStageFilter, startDate, endDate]);

  // Aggregate Metrics based on filtered leads
  const totalDeals = filteredDeals.length;
  const totalPipelineBDT = filteredDeals.reduce((sum, d) => sum + (d.estimatedValueBDT || 0), 0);
  const totalVolumeUnits = filteredDeals.reduce((sum, d) => sum + (d.expectedVolumeUnits || 0), 0);
  const signedDeals = filteredDeals.filter((d) => d.stage === 'Agreement Signed');
  const signedValueBDT = signedDeals.reduce((sum, d) => sum + (d.estimatedValueBDT || 0), 0);

  // Single Deal Creator with Supabase Sync
  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    const notes = initialNote.trim()
      ? [
          {
            date: new Date().toISOString().substring(0, 10),
            author: currentUser.name,
            note: initialNote.trim(),
          },
        ]
      : [
          {
            date: new Date().toISOString().substring(0, 10),
            author: currentUser.name,
            note: `Initial lead registered for ${dealCompanyName} with target volume of ${dealVolumeUnits} units.`,
          },
        ];

    const res = await addCRMLead({
      clientName: dealClientName.trim(),
      companyName: dealCompanyName.trim(),
      phone: dealPhone.trim(),
      stage: dealStage,
      expectedVolumeUnits: Number(dealVolumeUnits) || 100,
      estimatedValueBDT: Number(dealEstValueBDT) || 0,
      contractTermMonths: Number(dealTermMonths) || 12,
      salespersonId: currentUser.id,
      salespersonName: dealSalesperson.trim(),
      lastContactDate: new Date().toISOString().substring(0, 10),
      communicationNotes: notes,
    });

    setShowAddDealModal(false);
    setActionNotice({
      type: 'success',
      message: res?.isRemoteSynced
        ? `New agreement created and synced to Supabase for ${dealCompanyName}!`
        : `New agreement created for ${dealCompanyName}!`,
    });
    setTimeout(() => setActionNotice(null), 4000);

    // Reset Form
    setDealClientName('');
    setDealCompanyName('');
    setDealPhone('');
    setDealVolumeUnits(100);
    setDealEstValueBDT(11500000);
    setDealTermMonths(12);
    setDealStage('Lead');
    setInitialNote('');
  };

  const handleAddNote = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedDeal || !newNoteText.trim() || isSavingNote) return;
    const finalNote = selectedQuickTag ? `[${selectedQuickTag}] ${newNoteText.trim()}` : newNoteText.trim();
    setIsSavingNote(true);
    setNoteSaveNotice({ message: 'Saving note to Supabase...', success: true });

    try {
      const res = await addCRMCommunicationNote(selectedDeal.id, finalNote);
      setNewNoteText('');
      setSelectedQuickTag('');
      if (res?.isRemoteSynced) {
        setNoteSaveNotice({ message: 'Saved to Supabase database', success: true });
      } else if (res?.error) {
        setNoteSaveNotice({ message: `Saved locally (${res.error})`, success: false });
      } else {
        setNoteSaveNotice({ message: 'Interaction note logged', success: true });
      }
      setTimeout(() => setNoteSaveNotice(null), 3500);
    } catch (err: any) {
      console.error('Error adding note:', err);
      setNoteSaveNotice({ message: 'Save error: ' + (err?.message || 'Failed'), success: false });
      setTimeout(() => setNoteSaveNotice(null), 4000);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleStageChange = (dealId: string, newStage: CRMLeadAgreement['stage']) => {
    updateCRMDealStage(dealId, newStage);
  };

  const handleDelete = (deal: CRMLeadAgreement) => {
    if (confirm(`Are you sure you want to delete CRM agreement "${deal.clientName}" (${deal.companyName})?`)) {
      deleteCRMDeal(deal.id);
      if (selectedDealId === deal.id) {
        const remaining = crmAgreements.filter((d) => d.id !== deal.id);
        setSelectedDealId(remaining[0]?.id || '');
      }
    }
  };

  // Robust CSV Parser
  const parseCSVContent = (csvText: string): Omit<CRMLeadAgreement, 'id'>[] => {
    const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length < 2) {
      throw new Error('CSV file must contain a header row and at least one data row.');
    }

    // Split CSV line respecting double quotes
    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          if (inQuotes && line[i + 1] === char) {
            current += char;
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const rawHeaders = parseLine(lines[0]);
    const headers = rawHeaders.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

    // Map column indices
    const colIndex = {
      client: headers.findIndex((h) => h.includes('client') || h.includes('project') || h.includes('title')),
      company: headers.findIndex((h) => h.includes('company') || h.includes('org') || h.includes('customer') || h.includes('account')),
      phone: headers.findIndex((h) => h.includes('phone') || h.includes('mobile') || h.includes('contact')),
      stage: headers.findIndex((h) => h.includes('stage') || h.includes('status')),
      volume: headers.findIndex((h) => h.includes('volume') || h.includes('unit') || h.includes('qty')),
      value: headers.findIndex((h) => h.includes('value') || h.includes('bdt') || h.includes('amount') || h.includes('est') || h.includes('price')),
      term: headers.findIndex((h) => h.includes('term') || h.includes('month') || h.includes('duration')),
      salesperson: headers.findIndex((h) => h.includes('sales') || h.includes('rep') || h.includes('officer') || h.includes('owner') || h.includes('assigned')),
      date: headers.findIndex((h) => h.includes('date') || h.includes('contacted') || h.includes('time')),
      notes: headers.findIndex((h) => h.includes('note') || h.includes('comment') || h.includes('desc') || h.includes('detail')),
    };

    const parsedResults: Omit<CRMLeadAgreement, 'id'>[] = [];
    const todayStr = new Date().toISOString().substring(0, 10);

    for (let i = 1; i < lines.length; i++) {
      const row = parseLine(lines[i]);
      if (row.length === 0 || row.every((c) => !c.trim())) continue;

      const rawClient = colIndex.client !== -1 ? row[colIndex.client] : '';
      const rawCompany = colIndex.company !== -1 ? row[colIndex.company] : '';
      const clientName = rawClient || rawCompany || `Lead #${i}`;
      const companyName = rawCompany || rawClient || 'Corporate Account';
      const phone = colIndex.phone !== -1 ? row[colIndex.phone] : '+880 1700-000000';

      // Parse Stage
      let stage: CRMLeadAgreement['stage'] = 'Lead';
      const rawStage = (colIndex.stage !== -1 ? row[colIndex.stage] : '').toLowerCase();
      if (rawStage.includes('sign') || rawStage.includes('exec') || rawStage.includes('win') || rawStage.includes('contract')) {
        stage = 'Agreement Signed';
      } else if (rawStage.includes('prop') || rawStage.includes('offer') || rawStage.includes('sent')) {
        stage = 'Proposal Sent';
      } else if (rawStage.includes('cont') || rawStage.includes('meet') || rawStage.includes('call') || rawStage.includes('pitch')) {
        stage = 'Contacted';
      } else if (rawStage.includes('lost') || rawStage.includes('close') || rawStage.includes('drop')) {
        stage = 'Lost';
      }

      // Parse Volume
      const rawVolume = colIndex.volume !== -1 ? row[colIndex.volume] : '';
      const volumeNum = Number(rawVolume.replace(/[^0-9.]/g, '')) || 100;

      // Parse Value
      const rawValue = colIndex.value !== -1 ? row[colIndex.value] : '';
      const valueNum = Number(rawValue.replace(/[^0-9.]/g, '')) || 1000000;

      // Parse Term
      const rawTerm = colIndex.term !== -1 ? row[colIndex.term] : '';
      const termNum = Number(rawTerm.replace(/[^0-9.]/g, '')) || 12;

      // Parse Salesperson
      const rawSalesperson = colIndex.salesperson !== -1 ? row[colIndex.salesperson] : '';
      const salespersonName = rawSalesperson || currentUser?.name || 'Tanvir Hossain';

      // Parse Date
      let contactDate = colIndex.date !== -1 && row[colIndex.date] ? row[colIndex.date].trim() : todayStr;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(contactDate)) {
        contactDate = todayStr;
      }

      // Parse Notes
      const noteText = colIndex.notes !== -1 && row[colIndex.notes] ? row[colIndex.notes].trim() : `Uploaded lead for ${companyName}`;

      parsedResults.push({
        clientName,
        companyName,
        phone,
        stage,
        expectedVolumeUnits: volumeNum,
        estimatedValueBDT: valueNum,
        contractTermMonths: termNum,
        salespersonId: currentUser?.id || 'u-rep',
        salespersonName,
        lastContactDate: contactDate,
        communicationNotes: [
          {
            date: contactDate,
            author: currentUser?.name || salespersonName,
            note: noteText,
          },
        ],
      });
    }

    if (parsedResults.length === 0) {
      throw new Error('No valid CRM lead records found in the uploaded file.');
    }

    return parsedResults;
  };

  // File Upload Handlers
  const handleFileUpload = (file: File) => {
    setUploadError(null);
    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCSVContent(text);
        setUploadParsedLeads(parsed);
      } catch (err: any) {
        setUploadError(err.message || 'Failed to parse CSV file. Please verify column formats.');
        setUploadParsedLeads([]);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read the selected file.');
    };
    reader.readAsText(file);
  };

  const handlePastedCSVSubmit = () => {
    if (!rawPastedCSV.trim()) {
      setUploadError('Please paste your CSV text.');
      return;
    }
    try {
      setUploadError(null);
      const parsed = parseCSVContent(rawPastedCSV);
      setUploadParsedLeads(parsed);
      setUploadFileName('Pasted CSV text');
    } catch (err: any) {
      setUploadError(err.message || 'Failed to parse pasted CSV text.');
      setUploadParsedLeads([]);
    }
  };

  const handleConfirmImport = async () => {
    if (uploadParsedLeads.length === 0) return;
    setIsImporting(true);
    let syncRes: { success: boolean; count: number; isRemoteSynced?: boolean; error?: string } = {
      success: true,
      count: uploadParsedLeads.length,
      isRemoteSynced: false,
    };

    try {
      if (bulkAddCRMLeads) {
        syncRes = await bulkAddCRMLeads(uploadParsedLeads);
      } else {
        for (const lead of uploadParsedLeads) {
          await addCRMLead(lead);
        }
      }
    } catch (err: any) {
      syncRes = { success: false, count: 0, error: err?.message };
    }

    setIsImporting(false);
    setShowUploadModal(false);

    if (syncRes.isRemoteSynced) {
      setActionNotice({
        type: 'success',
        message: `Successfully imported ${syncRes.count} lead agreements and saved directly to Supabase crm_agreements!`,
      });
    } else if (syncRes.error) {
      setActionNotice({
        type: 'info',
        message: `Imported ${syncRes.count} leads locally. Supabase sync notice: ${syncRes.error}`,
      });
    } else {
      setActionNotice({
        type: 'success',
        message: `Successfully imported ${uploadParsedLeads.length} CRM lead agreements!`,
      });
    }

    setTimeout(() => setActionNotice(null), 6000);
    setUploadParsedLeads([]);
    setUploadFileName('');
    setRawPastedCSV('');
  };

  const handleSyncAllToSupabase = async () => {
    if (!syncAllCRMLeadsToSupabase) return;
    setIsSyncingAll(true);
    const res = await syncAllCRMLeadsToSupabase();
    setIsSyncingAll(false);
    if (res.success) {
      setActionNotice({
        type: 'success',
        message: `Successfully synchronized ${res.count} CRM agreements with Supabase crm_agreements table!`,
      });
    } else {
      setActionNotice({
        type: 'info',
        message: `Supabase sync notice: ${res.error || 'Failed to sync'}`,
      });
    }
    setTimeout(() => setActionNotice(null), 6000);
  };

  const handleClearCache = async () => {
    if (clearCRMAgreementsCache) {
      clearCRMAgreementsCache();
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('ensec_crm_agreements');
        sessionStorage.removeItem('ensec_crm_agreements');
      } catch (e) {}
    }
    if (refreshCRMAgreements) {
      await refreshCRMAgreements();
    }
    setActionNotice({
      type: 'info',
      message: 'Local session cache purged. Refreshed live data from Supabase.',
    });
    setTimeout(() => setActionNotice(null), 5000);
  };


  // Download Sample Template CSV
  const handleDownloadSampleCSV = () => {
    const sampleRows = [
      'Client Name,Company Name,Phone,Stage,Expected Volume Units,Estimated Value BDT,Contract Term Months,Salesperson Name,Contact Date,Notes',
      '"Grameenphone Telecom Power Backup","Grameenphone Limited","+880 1700-112233","Agreement Signed",500,57500000,24,"Tanvir Hossain","2026-10-15","Master supply contract for 48V 100Ah lithium iron phosphate packs"',
      '"Banglalink Regional BTS Expansion","Banglalink Digital Communications","+880 1911-223344","Proposal Sent",350,42000000,24,"Tanvir Hossain","2026-10-25","Submitted technical proposal and credit pricing schedule"',
      '"Robi Axiata Microgrid Storage","Robi Axiata Limited","+880 1819-998877","Contacted",200,24000000,12,"Zubair Ahmed","2026-10-20","Initial technical meeting completed for solar microgrid backup"',
      '"Navana Logistics Fleet Energy","Navana Group","+880 1712-334455","Lead",150,18500000,18,"Tanvir Hossain","2026-10-28","Customer requested commercial price matrix and test unit"',
    ];
    const csvContent = sampleRows.join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ensec_crm_leads_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export Current Filtered Leads to CSV
  const handleExportCSV = () => {
    if (filteredDeals.length === 0) {
      alert('No CRM agreements available to export under current filters.');
      return;
    }

    const headers = [
      'Agreement ID',
      'Client / Project Name',
      'Company Name',
      'Phone',
      'Pipeline Stage',
      'Volume (Units)',
      'Estimated Value (BDT)',
      'Contract Term (Months)',
      'Salesperson Name',
      'Last Contact Date',
      'Notes Count',
      'Latest Communication Note',
    ];

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filteredDeals.map((deal) => {
      const latestNote =
        deal.communicationNotes && deal.communicationNotes.length > 0
          ? deal.communicationNotes[deal.communicationNotes.length - 1].note
          : '';

      return [
        escapeCSV(deal.id),
        escapeCSV(deal.clientName),
        escapeCSV(deal.companyName),
        escapeCSV(deal.phone),
        escapeCSV(deal.stage),
        escapeCSV(deal.expectedVolumeUnits),
        escapeCSV(deal.estimatedValueBDT),
        escapeCSV(deal.contractTermMonths),
        escapeCSV(deal.salespersonName),
        escapeCSV(deal.lastContactDate || ''),
        escapeCSV(deal.communicationNotes?.length || 0),
        escapeCSV(latestNote),
      ].join(',');
    });

    const csvData = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().substring(0, 10);
    link.href = url;
    link.setAttribute('download', `Ensec_CRM_Agreements_${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setActionNotice({
      type: 'success',
      message: `Exported ${filteredDeals.length} CRM agreements to CSV file!`,
    });
    setTimeout(() => setActionNotice(null), 4000);
  };

  const QUICK_TAGS = [
    'Price Negotiation',
    'Technical Specs',
    'Site Survey',
    'Proposal Sent',
    'SLA Finalized',
    'Signed Contract',
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {actionNotice && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-sm ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold">{actionNotice.message}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
            <span>Field Force & Sales</span>
            <span>/</span>
            <span className="text-slate-900 dark:text-white">CRM Agreements</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              CRM Agreements & Corporate Contracts
            </h1>
          </div>
        
        </div>

        {/* Action Buttons: Upload CSV, Export CSV, New Agreement */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Upload Leads Button */}
          <button
            onClick={() => {
              setShowUploadModal(true);
              setUploadError(null);
              setUploadParsedLeads([]);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-teal-200 dark:border-teal-800/60 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/40 text-teal-700 dark:text-teal-300 transition-colors shadow-2xs cursor-pointer"
            title="Bulk import CRM leads from CSV file"
          >
            <Upload className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Upload Leads</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer"
            title="Export currently filtered CRM agreements to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Export CSV</span>
            {filteredDeals.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] font-mono text-slate-600 dark:text-slate-300 font-bold">
                {filteredDeals.length}
              </span>
            )}
          </button>

          {/* New Agreement Button */}
          <button
            onClick={() => setShowAddDealModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Agreement</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Deals Pipeline</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <FileSignature className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {totalDeals} <span className="text-xs font-normal text-slate-400">agreements</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{signedDeals.length} Signed</span>
            <span>•</span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">
              {filteredDeals.filter((d) => d.stage === 'Proposal Sent').length} Proposals
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Pipeline Value</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2 font-mono">
            ৳ {(totalPipelineBDT / 10000000).toFixed(2)} Cr
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            ৳ {(totalPipelineBDT / 100000).toFixed(1)} Lakh institutional value
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Contracted Volume</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 font-mono">
            {totalVolumeUnits.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">Units</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Lithium battery packs across telecom & micro-grids
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Signed Value Secured</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
            ৳ {(signedValueBDT / 100000).toFixed(1)} Lakh
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {totalPipelineBDT > 0
              ? `${Math.round((signedValueBDT / totalPipelineBDT) * 100)}% contract conversion rate`
              : '0% conversion'}
          </div>
        </div>
      </div>

      {/* Search, Date Filter & Stage Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3.5">
        {/* Row 1: Search and Date Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by client, company, phone, or salesperson..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs">
              <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="text-slate-500 dark:text-slate-400 font-medium">Date Filter:</span>

              {/* Quick Preset Selector */}
              <select
                value={datePreset}
                onChange={(e) => applyDatePreset(e.target.value as DatePreset)}
                className="bg-transparent text-slate-900 dark:text-white font-semibold text-xs focus:outline-none cursor-pointer"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="last7">Last 7 Days</option>
                <option value="thisMonth">This Month</option>
                <option value="last30">Last 30 Days</option>
                <option value="thisYear">This Year</option>
                <option value="custom">Custom Range...</option>
              </select>
            </div>

            {/* From & To Date Pickers */}
            <div className="flex items-center gap-1.5 text-xs">
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDatePreset('custom');
                  }}
                  className="bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDatePreset('custom');
                  }}
                  className="bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none font-mono"
                />
              </div>

              {(startDate || endDate || datePreset !== 'all') && (
                <button
                  type="button"
                  onClick={() => applyDatePreset('all')}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Clear Date Filter"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Pipeline Stage Filter Tabs & Filter Counter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['All', 'Lead', 'Contacted', 'Proposal Sent', 'Agreement Signed', 'Lost'].map((stg) => {
              const isSelected = selectedStageFilter === stg;
              return (
                <button
                  key={stg}
                  onClick={() => setSelectedStageFilter(stg)}
                  className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {stg}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Showing <b className="text-slate-900 dark:text-white">{filteredDeals.length}</b> of {crmAgreements.length} leads</span>
            {(startDate || endDate) && (
              <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-mono text-[10px] font-bold">
                📅 {startDate || 'Start'} → {endDate || 'Today'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Deals Pipeline List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span>Agreements List</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                {filteredDeals.length}
              </span>
            </h3>
            <span className="text-[11px] text-slate-400">Click to view details</span>
          </div>

          {crmAgreements.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                <FileSignature className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No CRM Lead Agreements</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Sample and session dummy data have been removed. Upload real leads via CSV or create your first agreement to sync with Supabase.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => {
                    setShowUploadModal(true);
                    setUploadError(null);
                    setUploadParsedLeads([]);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Leads (CSV)</span>
                </button>
                <button
                  onClick={() => setShowAddDealModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>New Agreement</span>
                </button>
              </div>
            </div>
          ) : filteredDeals.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <FileSignature className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs text-slate-500 font-medium">No agreements match the selected search, stage, or date filters.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStageFilter('All');
                  applyDatePreset('all');
                }}
                className="mt-1 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
              {filteredDeals.map((deal) => {
                const isSelected = selectedDeal?.id === deal.id;
                const stageStyle = STAGE_CONFIG[deal.stage] || STAGE_CONFIG.Lead;

                return (
                  <div
                    key={deal.id}
                    onClick={() => setSelectedDealId(deal.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm ring-1 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${stageStyle.bg} ${stageStyle.text} ${stageStyle.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${stageStyle.dot}`} />
                        {stageStyle.label}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {deal.lastContactDate || 'Recent'}
                      </span>
                    </div>

                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                        {deal.clientName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{deal.companyName}</span>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 block font-sans">Volume Target</span>
                        <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {deal.expectedVolumeUnits} Units
                        </span>
                      </div>
                      <div className="text-right space-y-0.5">
                        <span className="text-[10px] text-slate-400 block font-sans">Agreement Value</span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          ৳ {deal.estimatedValueBDT.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>👤 {deal.salespersonName}</span>
                      <span className="text-[10px] font-mono">{deal.contractTermMonths} Mo Term</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Selected Agreement Dossier */}
        <div className="lg:col-span-7">
          {selectedDeal ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-xs">
              {/* Dossier Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {selectedDeal.clientName}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        STAGE_CONFIG[selectedDeal.stage]?.bg
                      } ${STAGE_CONFIG[selectedDeal.stage]?.text} ${STAGE_CONFIG[selectedDeal.stage]?.border}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${STAGE_CONFIG[selectedDeal.stage]?.dot}`} />
                      {selectedDeal.stage}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                    <span>🏢 {selectedDeal.companyName}</span>
                    <span>•</span>
                    <span className="font-mono">ID: {selectedDeal.id}</span>
                  </p>
                </div>

                {/* Stage Mover Quick Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium hidden sm:inline">Stage:</span>
                  <select
                    value={selectedDeal.stage}
                    onChange={(e) => handleStageChange(selectedDeal.id, e.target.value as CRMLeadAgreement['stage'])}
                    className="text-xs font-semibold py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
                  >
                    <option value="Lead">Lead</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Proposal Sent">Proposal Sent</option>
                    <option value="Agreement Signed">Agreement Signed</option>
                    <option value="Lost">Lost / Closed</option>
                  </select>

                  <button
                    onClick={() => handleDelete(selectedDeal)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Delete Agreement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Key Agreement Parameters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Estimated Value</span>
                  <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                    ৳ {selectedDeal.estimatedValueBDT.toLocaleString()}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Contract Volume</span>
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                    {selectedDeal.expectedVolumeUnits} Units
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Contract Term</span>
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                    {selectedDeal.contractTermMonths} Months
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Direct Contact</span>
                  <span className="font-mono font-semibold text-xs text-slate-700 dark:text-slate-300 truncate block">
                    {selectedDeal.phone}
                  </span>
                </div>
              </div>

              {/* Sales Rep Ownership Info */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                    {selectedDeal.salespersonName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      {selectedDeal.salespersonName}
                    </span>
                    <span className="text-[11px] text-slate-500">Corporate Field Account Manager</span>
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  <span>Last Interaction: </span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {selectedDeal.lastContactDate || 'Recent'}
                  </span>
                </div>
              </div>

              {/* Communication Notes & SLA Tracking Log */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Negotiation Timeline &amp; Communication Log ({selectedDeal.communicationNotes?.length || 0})</span>
                  </h4>
                  {noteSaveNotice ? (
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 transition-all ${
                        noteSaveNotice.success
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${noteSaveNotice.success ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                      {noteSaveNotice.message}
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Supabase Cloud Sync
                    </span>
                  )}
                </div>

                {/* Add Note Form */}
                <form onSubmit={handleAddNote} className="space-y-2">
                  <div className="relative">
                    <textarea
                      rows={2}
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddNote();
                        }
                      }}
                      placeholder="Type a communication note, pricing discussion, or meeting summary (Press Enter to post)..."
                      className="w-full p-3 pr-10 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                      type="submit"
                      disabled={!newNoteText.trim() || isSavingNote}
                      className="absolute right-2.5 bottom-3 p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white cursor-pointer transition-colors"
                      title={isSavingNote ? 'Saving to Supabase...' : 'Post interaction note (Enter to send)'}
                    >
                      {isSavingNote ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Quick Tag Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Tags:</span>
                    {QUICK_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSelectedQuickTag(selectedQuickTag === tag ? '' : tag)}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                          selectedQuickTag === tag
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </form>

                {/* Notes History Stream */}
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 pt-1">
                  {selectedDeal.communicationNotes && selectedDeal.communicationNotes.length > 0 ? (
                    selectedDeal.communicationNotes
                      .slice()
                      .reverse()
                      .map((note, index) => (
                        <div
                          key={index}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1 text-xs"
                        >
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {note.author}
                            </span>
                            <span className="font-mono text-[10px]">{note.date}</span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                            {note.note}
                          </p>
                        </div>
                      ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      No communication notes logged yet. Use the box above to register meeting updates.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 space-y-2">
              <FileSignature className="w-12 h-12 mx-auto mb-2 opacity-30 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {crmAgreements.length === 0 ? 'CRM Pipeline is Clean' : 'Select an agreement to view detailed dossier'}
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {crmAgreements.length === 0
                  ? 'No sample or cached dummy data is loaded. Use Upload Leads (CSV) or New Agreement to populate live agreements in Supabase.'
                  : 'Click any deal card from the left panel to examine communication history, stage progressions, and contract terms.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: CSV LEAD UPLOAD MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Bulk Upload CRM Leads (CSV)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Import institutional prospects, project agreements, and volume contracts from spreadsheet data
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Download & Instructions Banner */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-blue-900 dark:text-blue-200">Need the standard spreadsheet template?</span>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
                    Download our formatted CSV template with required headers (Client Name, Company, Phone, Stage, Volume, Value BDT, Term, Notes).
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadSampleCSV}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample Template</span>
              </button>
            </div>

            {/* Input Mode Toggle (File Drop vs Paste Text) */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setUploadInputMode('file')}
                className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                  uploadInputMode === 'file'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                📁 Select or Drop CSV File
              </button>
              <button
                type="button"
                onClick={() => setUploadInputMode('paste')}
                className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                  uploadInputMode === 'paste'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                📋 Paste CSV Raw Text
              </button>
            </div>

            {/* Error Message */}
            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Mode 1: Drag and Drop File Area */}
            {uploadInputMode === 'file' && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const files = e.dataTransfer.files;
                  if (files && files[0]) {
                    handleFileUpload(files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                    : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files[0]) {
                      handleFileUpload(files[0]);
                    }
                  }}
                />
                <FileUp className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {uploadFileName ? uploadFileName : 'Drag & drop your CSV file here, or click to browse'}
                </p>
                <p className="text-xs text-slate-400 mt-1">Supports UTF-8 CSV with header row</p>
              </div>
            )}

            {/* Mode 2: Paste CSV Text */}
            {uploadInputMode === 'paste' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Paste Raw CSV Content:
                </label>
                <textarea
                  rows={5}
                  value={rawPastedCSV}
                  onChange={(e) => setRawPastedCSV(e.target.value)}
                  placeholder={`Client Name,Company Name,Phone,Stage,Expected Volume Units,Estimated Value BDT,Contract Term Months,Salesperson Name,Contact Date,Notes\n"Banglalink BTS","Banglalink","+880 1911-223344","Proposal Sent",350,42000000,24,"Tanvir Hossain","2026-10-25","Lead for telecom backup"`}
                  className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handlePastedCSVSubmit}
                  className="px-4 py-2 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white text-xs font-semibold cursor-pointer"
                >
                  Parse Pasted Text
                </button>
              </div>
            )}

            {/* Parsed Preview Table */}
            {uploadParsedLeads.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Parsed {uploadParsedLeads.length} leads successfully</span>
                  </span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                    Total Pipeline: ৳{' '}
                    {(
                      uploadParsedLeads.reduce((sum, l) => sum + (l.estimatedValueBDT || 0), 0) / 100000
                    ).toFixed(1)}{' '}
                    Lakh
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 sticky top-0 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      <tr>
                        <th className="p-2">#</th>
                        <th className="p-2">Client / Project</th>
                        <th className="p-2">Company</th>
                        <th className="p-2">Stage</th>
                        <th className="p-2 text-right">Units</th>
                        <th className="p-2 text-right">Value (BDT)</th>
                        <th className="p-2">Salesperson</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                      {uploadParsedLeads.slice(0, 50).map((lead, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-2 font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-2 font-semibold text-slate-900 dark:text-white truncate max-w-[140px]">
                            {lead.clientName}
                          </td>
                          <td className="p-2 text-slate-600 dark:text-slate-300 truncate max-w-[120px]">
                            {lead.companyName}
                          </td>
                          <td className="p-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {lead.stage}
                            </span>
                          </td>
                          <td className="p-2 text-right font-mono font-semibold">
                            {lead.expectedVolumeUnits}
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                            ৳ {lead.estimatedValueBDT?.toLocaleString()}
                          </td>
                          <td className="p-2 text-slate-500 truncate max-w-[100px]">
                            {lead.salespersonName}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {uploadParsedLeads.length > 50 && (
                  <p className="text-[11px] text-slate-400 text-center">
                    Showing first 50 of {uploadParsedLeads.length} leads. All will be imported.
                  </p>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadParsedLeads([]);
                  setUploadError(null);
                }}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={uploadParsedLeads.length === 0 || isImporting}
                onClick={handleConfirmImport}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving to Supabase...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm &amp; Import {uploadParsedLeads.length} Leads</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: NEW AGREEMENT LEAD CREATOR */}
      {showAddDealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Register New CRM Agreement Lead
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDealModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDeal} className="space-y-3.5">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Project / Agreement Title *
                </label>
                <input
                  type="text"
                  required
                  value={dealClientName}
                  onChange={(e) => setDealClientName(e.target.value)}
                  placeholder="e.g. Grameenphone Tower Battery Rollout"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Company / Institutional Customer *
                  </label>
                  <input
                    type="text"
                    required
                    value={dealCompanyName}
                    onChange={(e) => setDealCompanyName(e.target.value)}
                    placeholder="e.g. Grameenphone Ltd."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Contact Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={dealPhone}
                    onChange={(e) => setDealPhone(e.target.value)}
                    placeholder="+880 1700-000000"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Expected Units
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={dealVolumeUnits}
                    onChange={(e) => setDealVolumeUnits(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Estimated Value (BDT)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={dealEstValueBDT}
                    onChange={(e) => setDealEstValueBDT(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Term (Months)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={dealTermMonths}
                    onChange={(e) => setDealTermMonths(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Initial Pipeline Stage
                  </label>
                  <select
                    value={dealStage}
                    onChange={(e) => setDealStage(e.target.value as CRMLeadAgreement['stage'])}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="Lead">Lead (Prospect Identified)</option>
                    <option value="Contacted">Contacted (Initial Pitch)</option>
                    <option value="Proposal Sent">Proposal Sent (Technical &amp; Commercial)</option>
                    <option value="Agreement Signed">Agreement Signed (Contract Finalized)</option>
                    <option value="Lost">Lost / Archived</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Assigned Field Officer / Salesman
                  </label>
                  <input
                    type="text"
                    value={dealSalesperson}
                    onChange={(e) => setDealSalesperson(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Initial Scope / Technical Notes
                </label>
                <textarea
                  rows={2}
                  value={initialNote}
                  onChange={(e) => setInitialNote(e.target.value)}
                  placeholder="e.g. Requires 48V 100Ah lithium iron phosphate packs for telecom BTS towers with 5-year warranty..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddDealModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Create Agreement Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
