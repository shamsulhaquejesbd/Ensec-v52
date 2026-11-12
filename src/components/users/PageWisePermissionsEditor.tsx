/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ensec ERP - Super Admin Security & Page-Wise Permission Control Engine
 * Completely redesigned permission workbench implementing independent action-based controls
 * for every single sidebar page and submodule.
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useERP } from '../../context/ERPContext.tsx';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Copy,
  RotateCcw,
  Save,
  CheckSquare,
  Square,
  Sparkles,
  Users,
  Eye,
  PlusCircle,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Lock,
  Unlock,
  Building,
  Briefcase,
  UserCheck,
  Sliders,
  Filter,
  CheckCircle,
  HelpCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { User, Role } from '../../types/erp.ts';
import {
  ERP_PAGE_PERMISSIONS_REGISTRY,
  ALL_ERP_PAGES,
  PERMISSION_TEMPLATES,
  UserPagePermissionsMap,
  countGrantedPermissions,
  ERPPageDef,
} from '../../types/pagePermissions.ts';

interface PageWisePermissionsEditorProps {
  initialUserId?: string;
  onClose?: () => void;
  isEmbeddedTab?: boolean;
}

export const PageWisePermissionsEditor: React.FC<PageWisePermissionsEditorProps> = ({
  initialUserId,
  onClose,
  isEmbeddedTab = false,
}) => {
  const {
    users,
    currentUser,
    updateUserPagePermissions,
    refreshUsers,
  } = useERP();

  // Step 1: Target User
  const [selectedUserId, setSelectedUserId] = useState<string>(() => {
    if (initialUserId) return initialUserId;
    const target = users.find((u) => u.id !== currentUser.id && u.role !== 'Super Admin');
    return target ? target.id : (users[0]?.id || '');
  });

  const selectedUser = useMemo(() => {
    return users.find((u) => u.id === selectedUserId) || users[0] || null;
  }, [users, selectedUserId]);

  // Working permissions state
  const [workingPermissions, setWorkingPermissions] = useState<UserPagePermissionsMap>({});
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [filterAccessState, setFilterAccessState] = useState<'all' | 'granted' | 'restricted'>('all');

  // Accordion state
  const [expandedCategories, setExpandedCategories] = useState<{ [catId: string]: boolean }>(() => {
    const init: { [catId: string]: boolean } = {};
    ERP_PAGE_PERMISSIONS_REGISTRY.forEach((cat) => {
      init[cat.id] = true;
    });
    return init;
  });

  // Source user for clone/copy
  const [copySourceUserId, setCopySourceUserId] = useState<string>('');

  // Self-approval override option
  const [allowSelfApproval, setAllowSelfApproval] = useState<boolean>(false);

  // Keep track of the currently loaded user ID to prevent wiping changes on save
  const lastLoadedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (initialUserId && initialUserId !== selectedUserId) {
      setSelectedUserId(initialUserId);
    }
  }, [initialUserId]);

  // Initialize working permissions whenever selected target user ID changes
  useEffect(() => {
    if (!selectedUser) return;
    
    // Only re-hydrate from user object if we switched to a different staff member
    if (lastLoadedUserIdRef.current === selectedUser.id) {
      return;
    }
    lastLoadedUserIdRef.current = selectedUser.id;

    const userMap: UserPagePermissionsMap = {};
    const existingMap = selectedUser.permissions?.pagePermissions || {};
    const allowedMods = selectedUser.permissions?.allowedModules || [];

    ALL_ERP_PAGES.forEach((page) => {
      userMap[page.id] = {};
      const pageExisting = existingMap[page.id];

      page.actions.forEach((act) => {
        if (pageExisting && pageExisting[act.key] !== undefined) {
          userMap[page.id][act.key] = Boolean(pageExisting[act.key]);
        } else if (selectedUser.role === 'Super Admin') {
          userMap[page.id][act.key] = true;
        } else if (page.id === 'raw-material-inventory' && ['view_raw_material_stock_value', 'view_raw_material_purchase_rate', 'view_batch_stock_value'].includes(act.key)) {
          const isFactory = selectedUser.role === 'Factory Manager' || selectedUser.role === 'Warehouse Manager' || (selectedUser.department && selectedUser.department.toLowerCase().includes('factory'));
          if (!isFactory && pageExisting && pageExisting['view_valuation'] !== undefined) {
            userMap[page.id][act.key] = Boolean(pageExisting['view_valuation']);
          } else {
            userMap[page.id][act.key] = false;
          }
        } else {
          // Fallback heuristic based on legacy allowedModules and role
          if (act.key === 'view') {
            const hasMod =
              allowedMods.includes(page.id as any) ||
              (page.id.startsWith('basic-data-') && allowedMods.includes('basic-data' as any)) ||
              (page.id.startsWith('stock-') && allowedMods.includes('stock' as any)) ||
              (page.id.startsWith('installment-') && allowedMods.includes('installment' as any)) ||
              (page.id.startsWith('collection-') && allowedMods.includes('collection' as any)) ||
              (page.id.startsWith('sms-') && allowedMods.includes('sms' as any)) ||
              (page.id.startsWith('warranty-') && allowedMods.includes('warranty' as any));
            userMap[page.id][act.key] = hasMod;
          } else {
            userMap[page.id][act.key] = false;
          }
        }
      });
    });

    setWorkingPermissions(userMap);
    setAllowSelfApproval(Boolean(existingMap['_system']?.['approve_own']));
  }, [selectedUserId, selectedUser]);

  // Permission Stats
  const stats = useMemo(() => {
    return countGrantedPermissions(workingPermissions);
  }, [workingPermissions]);

  // Toggle single action permission
  const handleToggleAction = (pageId: string, actionKey: string) => {
    setWorkingPermissions((prev) => {
      const pageObj = { ...(prev[pageId] || {}) };
      const currentVal = Boolean(pageObj[actionKey]);
      const nextVal = !currentVal;

      pageObj[actionKey] = nextVal;

      // RULE: If any non-view action is enabled, automatically enable 'view'
      if (nextVal && actionKey !== 'view') {
        pageObj['view'] = true;
      }

      // RULE: If 'view' is disabled, automatically disable all other actions on this page
      if (!nextVal && actionKey === 'view') {
        Object.keys(pageObj).forEach((k) => {
          pageObj[k] = false;
        });
      }

      return {
        ...prev,
        [pageId]: pageObj,
      };
    });
  };

  // Select all actions for a specific page
  const handleSelectAllForPage = (page: ERPPageDef) => {
    setWorkingPermissions((prev) => {
      const pageObj = { ...(prev[page.id] || {}) };
      page.actions.forEach((act) => {
        pageObj[act.key] = true;
      });
      return {
        ...prev,
        [page.id]: pageObj,
      };
    });
  };

  // Deselect all actions for a specific page
  const handleDeselectAllForPage = (page: ERPPageDef) => {
    setWorkingPermissions((prev) => {
      const pageObj = { ...(prev[page.id] || {}) };
      page.actions.forEach((act) => {
        pageObj[act.key] = false;
      });
      return {
        ...prev,
        [page.id]: pageObj,
      };
    });
  };

  // Expand / Collapse all categories
  const handleExpandAll = () => {
    const allExp: { [catId: string]: boolean } = {};
    ERP_PAGE_PERMISSIONS_REGISTRY.forEach((cat) => {
      allExp[cat.id] = true;
    });
    setExpandedCategories(allExp);
  };

  const handleCollapseAll = () => {
    const allCol: { [catId: string]: boolean } = {};
    ERP_PAGE_PERMISSIONS_REGISTRY.forEach((cat) => {
      allCol[cat.id] = false;
    });
    setExpandedCategories(allCol);
  };

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  // Apply a template
  const handleApplyTemplate = (templateId: string) => {
    const tpl = PERMISSION_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;

    const newMap: UserPagePermissionsMap = {};
    ALL_ERP_PAGES.forEach((page) => {
      newMap[page.id] = {};
      page.actions.forEach((act) => {
        newMap[page.id][act.key] = Boolean(tpl.permissions[page.id]?.[act.key]);
      });
    });

    setWorkingPermissions(newMap);
    setSaveSuccessNotice(`Applied "${tpl.name}" template. Review and click "Save Changes" to commit.`);
  };

  // Copy from another user
  const handleCopyFromUser = () => {
    if (!copySourceUserId) return;
    const srcUser = users.find((u) => u.id === copySourceUserId);
    if (!srcUser) return;

    const srcPerms = srcUser.permissions?.pagePermissions || {};
    const newMap: UserPagePermissionsMap = {};

    ALL_ERP_PAGES.forEach((page) => {
      newMap[page.id] = {};
      page.actions.forEach((act) => {
        if (srcPerms[page.id] && srcPerms[page.id][act.key] !== undefined) {
          newMap[page.id][act.key] = Boolean(srcPerms[page.id][act.key]);
        } else if (srcUser.role === 'Super Admin') {
          newMap[page.id][act.key] = true;
        } else {
          newMap[page.id][act.key] = false;
        }
      });
    });

    setWorkingPermissions(newMap);
    setSaveSuccessNotice(`Cloned permissions from ${srcUser.name}. Click "Save Changes" to finalize.`);
  };

  // Grant All
  const handleGrantAll = () => {
    const fullMap: UserPagePermissionsMap = {};
    ALL_ERP_PAGES.forEach((page) => {
      fullMap[page.id] = {};
      page.actions.forEach((act) => {
        fullMap[page.id][act.key] = true;
      });
    });
    setWorkingPermissions(fullMap);
  };

  // Clear All
  const handleClearAll = () => {
    const emptyMap: UserPagePermissionsMap = {};
    ALL_ERP_PAGES.forEach((page) => {
      emptyMap[page.id] = {};
      page.actions.forEach((act) => {
        emptyMap[page.id][act.key] = false;
      });
    });
    setWorkingPermissions(emptyMap);
  };

  // Reset to saved
  const handleReset = () => {
    if (!selectedUser) return;
    const existingMap = selectedUser.permissions?.pagePermissions || {};
    const resetMap: UserPagePermissionsMap = {};

    ALL_ERP_PAGES.forEach((page) => {
      resetMap[page.id] = {};
      page.actions.forEach((act) => {
        resetMap[page.id][act.key] = Boolean(existingMap[page.id]?.[act.key]);
      });
    });
    setWorkingPermissions(resetMap);
    setSaveSuccessNotice('Reverted all unsaved changes to stored database values.');
  };

  // Save to Database
  const handleSave = async () => {
    if (!selectedUser) {
      alert('Please select an employee / staff account first.');
      return;
    }
    if (!updateUserPagePermissions) {
      alert('Permission update engine is unavailable. Please reload the page.');
      return;
    }

    setIsSaving(true);
    setSaveSuccessNotice(null);

    try {
      const finalMap: UserPagePermissionsMap = { ...workingPermissions };
      if (allowSelfApproval) {
        finalMap['_system'] = { approve_own: true };
      } else if (finalMap['_system']) {
        delete finalMap['_system'];
      }

      const res = await updateUserPagePermissions(selectedUser.id, finalMap);

      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 4500);

      const count = countGrantedPermissions(finalMap);
      const remoteNote = res?.isRemoteSynced ? ' & synced to cloud database' : ' & database storage';
      const notice = `✅ Clearances Saved! Granted ${count.totalGranted} actions across ${count.pagesWithAccess} modules for ${selectedUser.name}${remoteNote}.`;
      setSaveSuccessNotice(notice);
      setTimeout(() => setSaveSuccessNotice(null), 6000);
    } catch (err: any) {
      console.error('Failed to save permissions:', err);
      alert('Failed to save permissions: ' + (err?.message || 'Database error'));
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered categories and pages
  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return ERP_PAGE_PERMISSIONS_REGISTRY.map((cat) => {
      if (filterModule !== 'all' && cat.id !== filterModule) {
        return { ...cat, pages: [] };
      }

      const matchingPages = cat.pages.filter((page) => {
        const hasAccess = Boolean(workingPermissions[page.id]?.view);

        if (filterAccessState === 'granted' && !hasAccess) return false;
        if (filterAccessState === 'restricted' && hasAccess) return false;

        if (!q) return true;

        const nameMatch = page.name.toLowerCase().includes(q);
        const descMatch = page.description.toLowerCase().includes(q);
        const catMatch = page.category.toLowerCase().includes(q);
        const actionMatch = page.actions.some(
          (a) => a.label.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.key.toLowerCase().includes(q)
        );

        return nameMatch || descMatch || catMatch || actionMatch;
      });

      return {
        ...cat,
        pages: matchingPages,
      };
    }).filter((cat) => cat.pages.length > 0);
  }, [searchQuery, filterModule, filterAccessState, workingPermissions]);

  if (!selectedUser) {
    return (
      <div className="p-8 text-center text-slate-500">
        No user accounts found in the ERP system.
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isEmbeddedTab ? '' : 'p-1 text-slate-800 dark:text-slate-100'}`}>
      {/* Top Banner & Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">
                  Super Admin Security &amp; Page-Wise Permission Control
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Granular Action Clearance
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Configure explicit View, Create, Edit, Delete, Submit, Approve, and Execution rights across every individual ERP page.
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="self-end md:self-center p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Close Window</span>
            </button>
          )}
        </div>
      </div>

      {/* TOP SUCCESS / CONFIRMATION BANNER */}
      {saveSuccessNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{saveSuccessNotice}</span>
          </div>
          <button
            onClick={() => setSaveSuccessNotice(null)}
            className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-950 font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* STEP 1: SELECT USER & ACTIVE PROFILE CARD */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-purple-600 dark:text-purple-400">
              Step 1 of 2
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
              <Users className="w-4 h-4 text-purple-600" />
              <span>Select Employee / Staff Account</span>
            </h3>
          </div>

          <div className="w-full lg:w-96">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Switch Target Staff Account:
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl border border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30 text-slate-900 dark:text-white font-bold cursor-pointer focus:ring-2 focus:ring-purple-500"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role}) — {u.department || 'Operations'} [{u.userId || u.id}]
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected User Metadata Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium uppercase">Staff Name</span>
            <span className="font-bold text-slate-900 dark:text-white truncate block">{selectedUser.name}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium uppercase">Employee ID</span>
            <span className="font-mono font-bold text-purple-600 dark:text-purple-400 block">{selectedUser.userId || selectedUser.id}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium uppercase">Designation</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 block truncate">{selectedUser.designation || 'Staff Officer'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium uppercase">Department</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 block truncate">{selectedUser.department || 'General'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium uppercase">System Role</span>
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {selectedUser.role}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium uppercase">Active Clearances</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {stats.totalGranted} / {stats.totalAvailable} ({stats.pagesWithAccess} Pages)
            </span>
          </div>
        </div>
      </div>

      {/* STEP 2: ASSIGN PAGE-WISE PERMISSIONS & CONTROLS */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-purple-600 dark:text-purple-400">
              Step 2 of 2
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
              <Sliders className="w-4 h-4 text-purple-600" />
              <span>Configure Granular Action Clearances by Sidebar Page</span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExpandAll}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Expand All
            </button>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Collapse All
            </button>
            <button
              type="button"
              onClick={handleGrantAll}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold hover:bg-emerald-100 cursor-pointer"
            >
              Grant All
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-bold hover:bg-rose-100 cursor-pointer"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* QUICK TEMPLATES & CLONING TOOLBAR */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/80">
          {/* Preset Templates */}
          <div>
            <label className="block text-[11px] font-bold text-purple-950 dark:text-purple-200 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Apply Security Template:</span>
            </label>
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  handleApplyTemplate(e.target.value);
                  e.target.value = '';
                }
              }}
              className="w-full p-2 text-xs rounded-xl border border-purple-300 dark:border-purple-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium cursor-pointer"
            >
              <option value="" disabled>
                -- Choose Preset Clearance Role --
              </option>
              {PERMISSION_TEMPLATES.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name} ({tpl.roleTarget})
                </option>
              ))}
            </select>
          </div>

          {/* Copy from User */}
          <div>
            <label className="block text-[11px] font-bold text-purple-950 dark:text-purple-200 mb-1 flex items-center gap-1.5">
              <Copy className="w-3.5 h-3.5 text-indigo-600" />
              <span>Clone Permissions from Another Staff:</span>
            </label>
            <div className="flex items-center gap-1.5">
              <select
                value={copySourceUserId}
                onChange={(e) => setCopySourceUserId(e.target.value)}
                className="flex-1 p-2 text-xs rounded-xl border border-purple-300 dark:border-purple-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium cursor-pointer"
              >
                <option value="">-- Select Source Staff --</option>
                {users
                  .filter((u) => u.id !== selectedUser.id)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
              </select>
              <button
                type="button"
                disabled={!copySourceUserId}
                onClick={handleCopyFromUser}
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs cursor-pointer shrink-0 transition"
              >
                Clone
              </button>
            </div>
          </div>

          {/* Self-Approval Security Policy */}
          <div className="flex flex-col justify-center">
            <span className="block text-[11px] font-bold text-purple-950 dark:text-purple-200 mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Self-Approval Separation of Duties:</span>
            </span>
            <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={allowSelfApproval}
                onChange={(e) => setAllowSelfApproval(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
              <span className="text-[11px] font-medium leading-tight">
                Authorize self-approval of own orders &amp; vouchers
              </span>
            </label>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by page name or specific action (e.g., 'Confirm Sales Order', 'Generate DO', 'receive', 'adjust')..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
            >
              <option value="all">All Modules ({ERP_PAGE_PERMISSIONS_REGISTRY.length})</option>
              {ERP_PAGE_PERMISSIONS_REGISTRY.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>

            <select
              value={filterAccessState}
              onChange={(e) => setFilterAccessState(e.target.value as any)}
              className="p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="granted">Accessible Pages Only</option>
              <option value="restricted">Restricted Pages Only</option>
            </select>
          </div>
        </div>

        {/* SUCCESS / NOTICE BANNER */}
        {saveSuccessNotice && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{saveSuccessNotice}</span>
            </div>
            <button
              onClick={() => setSaveSuccessNotice(null)}
              className="text-emerald-600 hover:text-emerald-900"
            >
              ✕
            </button>
          </div>
        )}

        {/* ACCORDION OF MODULES AND PAGES */}
        <div className="space-y-4">
          {filteredCategories.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
              <HelpCircle className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                No ERP pages match your search criteria "{searchQuery}"
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterModule('all');
                  setFilterAccessState('all');
                }}
                className="mt-2 text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            filteredCategories.map((cat) => {
              const isExpanded = Boolean(expandedCategories[cat.id]);
              const totalCatPages = cat.pages.length;
              const grantedCatPages = cat.pages.filter((p) => workingPermissions[p.id]?.view).length;

              return (
                <div
                  key={cat.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs bg-white dark:bg-slate-900"
                >
                  {/* Category Header */}
                  <div
                    onClick={() => toggleCategory(cat.id)}
                    className="flex items-center justify-between p-4 bg-slate-50/90 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer select-none transition border-b border-slate-200 dark:border-slate-700/60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 border border-slate-200 dark:border-slate-600">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{cat.title}</span>
                          <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            {totalCatPages} Pages
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">
                          {cat.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                        {grantedCatPages} / {totalCatPages} Permitted
                      </span>
                    </div>
                  </div>

                  {/* Category Body Pages */}
                  {isExpanded && (
                    <div className="p-4 space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
                      {cat.pages.map((page) => {
                        const pagePerms = workingPermissions[page.id] || {};
                        const hasView = Boolean(pagePerms.view);
                        const grantedActionsCount = page.actions.filter((a) => pagePerms[a.key]).length;
                        const isAllGranted = grantedActionsCount === page.actions.length;

                        return (
                          <div
                            key={page.id}
                            className={`pt-4 first:pt-0 space-y-3 transition rounded-xl p-3 ${
                              hasView
                                ? 'bg-white dark:bg-slate-900'
                                : 'bg-slate-50/60 dark:bg-slate-950/40 opacity-75'
                            }`}
                          >
                            {/* Page Header Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`p-2 rounded-xl text-xs font-bold ${
                                    hasView
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                                      : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                  }`}
                                >
                                  {hasView ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                      {page.name}
                                    </h5>
                                    <span className="text-[10px] font-mono text-slate-400">
                                      ({page.id})
                                    </span>
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                                        hasView
                                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                      }`}
                                    >
                                      {hasView
                                        ? `${grantedActionsCount} of ${page.actions.length} Actions Enabled`
                                        : 'Access Blocked'}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    {page.description}
                                  </p>
                                </div>
                              </div>

                              {/* Page Quick Actions: Select All / Deselect All */}
                              <div className="flex items-center gap-1.5 self-end sm:self-center">
                                <button
                                  type="button"
                                  onClick={() => handleSelectAllForPage(page)}
                                  className="px-2 py-1 text-[10px] font-bold rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 cursor-pointer"
                                >
                                  Select All
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeselectAllForPage(page)}
                                  className="px-2 py-1 text-[10px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 cursor-pointer"
                                >
                                  Deselect All
                                </button>
                              </div>
                            </div>

                            {/* Actions Checkbox Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pt-1">
                                {page.actions.map((act) => {
                                  const isGranted = Boolean(pagePerms[act.key]);
                                  const isViewAction = act.key === 'view';
                                  const isApproval = Boolean(act.isApprovalAction);
                                  const isDestructive = Boolean(act.isDestructive);
                                  const isFinancial = ['view_raw_material_stock_value', 'view_raw_material_purchase_rate', 'view_batch_stock_value', 'view_revenue'].includes(act.key);

                                  return (
                                    <label
                                      key={act.key}
                                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                                        isGranted
                                          ? isApproval
                                            ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 shadow-2xs'
                                            : isDestructive
                                            ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 shadow-2xs'
                                            : isFinancial
                                            ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 shadow-2xs'
                                            : isViewAction
                                            ? 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800 shadow-2xs'
                                            : 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 shadow-2xs'
                                          : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isGranted}
                                        onChange={() => handleToggleAction(page.id, act.key)}
                                        className="w-4 h-4 mt-0.5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer shrink-0"
                                      />
                                      <div className="space-y-0.5 flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1">
                                          <span
                                            className={`text-xs font-bold truncate ${
                                              isGranted
                                                ? isApproval
                                                  ? 'text-purple-900 dark:text-purple-200'
                                                  : isDestructive
                                                  ? 'text-rose-900 dark:text-rose-200'
                                                  : isFinancial
                                                  ? 'text-amber-900 dark:text-amber-200'
                                                  : 'text-slate-900 dark:text-white'
                                                : 'text-slate-600 dark:text-slate-400'
                                            }`}
                                          >
                                            {act.label}
                                          </span>
                                          {isApproval && (
                                            <span className="text-[9px] font-bold px-1 rounded bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200 shrink-0">
                                              Approve
                                            </span>
                                          )}
                                          {isDestructive && (
                                            <span className="text-[9px] font-bold px-1 rounded bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200 shrink-0">
                                              Delete
                                            </span>
                                          )}
                                          {isFinancial && (
                                            <span className="text-[9px] font-bold px-1 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 shrink-0">
                                              Financial
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                                          {act.description}
                                        </p>
                                      </div>
                                    </label>
                                  );
                                })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* BOTTOM SAVE ACTIONS BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs py-3.5 px-4 rounded-xl shadow-xl border border-purple-200/60 dark:border-purple-900/40 z-30">
          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
            <span>Configuring clearances for:</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">
              {selectedUser.name} ({selectedUser.role})
            </span>
            {saveSuccessNotice && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-300 dark:border-emerald-800 animate-in fade-in">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{saveSuccessNotice}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 cursor-pointer transition shadow-xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Changes</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                justSaved
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              } disabled:opacity-50`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving to Database...</span>
                </>
              ) : justSaved ? (
                <>
                  <CheckCircle className="w-4 h-4 text-white" />
                  <span>Clearances Saved to Database!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Clearances to Database</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
