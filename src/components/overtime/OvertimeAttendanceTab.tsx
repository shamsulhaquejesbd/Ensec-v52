import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { OvertimeAttendance } from '../../types/overtime';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Search, 
  Moon, 
  Filter, 
  Check, 
  Cpu, 
  ShieldCheck, 
  UserCheck,
  Plus
} from 'lucide-react';

interface OvertimeAttendanceTabProps {
  onRecordNewAttendance: () => void;
}

export const OvertimeAttendanceTab: React.FC<OvertimeAttendanceTabProps> = ({ onRecordNewAttendance }) => {
  const { overtimeAttendances, verifyOvertimeAttendance, currentUser } = useERP();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'pending' | 'flagged'>('all');
  const [selectedShift, setSelectedShift] = useState<'all' | 'overnight' | 'day'>('all');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // Filtered attendances
  const filteredAttendances = useMemo(() => {
    return overtimeAttendances.filter(att => {
      const matchesSearch = 
        att.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        att.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        att.department.toLowerCase().includes(searchTerm.toLowerCase());
      
      const hasFlags = att.isLateCheckOutAlert || att.isMissingCheckOutAlert || att.isDuplicateEntryAlert;

      const matchesStatus = 
        statusFilter === 'all' ? true :
        statusFilter === 'verified' ? att.isVerified :
        statusFilter === 'pending' ? !att.isVerified :
        hasFlags;

      const matchesShift = 
        selectedShift === 'all' ? true :
        selectedShift === 'overnight' ? att.isOvernight :
        !att.isOvernight;

      return matchesSearch && matchesStatus && matchesShift;
    });
  }, [overtimeAttendances, searchTerm, statusFilter, selectedShift]);

  // Handle instant verification by supervisor/admin
  const handleVerify = (id: string, hours?: number) => {
    setVerifyingId(id);
    setTimeout(() => {
      verifyOvertimeAttendance(id, hours, currentUser.role === 'Super Admin' ? 'Verified by Admin Controller' : 'Verified by Floor Supervisor');
      setVerifyingId(null);
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Bio Machine Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-100">Biometric & Shift Time Clock Integration</h3>
              <span className="px-2 py-0.5 text-xs font-medium bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                ZKTeco Bio-Sync Active
              </span>
            </div>
            
          </div>
        </div>

        <button
          onClick={onRecordNewAttendance}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Record OT Attendance
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee by name, ID, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-medium text-slate-600">
            <Filter className="w-3.5 h-3.5 ml-1 text-slate-500" />
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${statusFilter === 'all' ? 'bg-white shadow text-slate-900 font-semibold' : 'hover:text-slate-900'}`}
            >
              All ({overtimeAttendances.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1 rounded-md transition-colors ${statusFilter === 'pending' ? 'bg-amber-500 text-white font-semibold' : 'hover:text-slate-900'}`}
            >
              Pending Verification
            </button>
            <button
              onClick={() => setStatusFilter('verified')}
              className={`px-2.5 py-1 rounded-md transition-colors ${statusFilter === 'verified' ? 'bg-emerald-600 text-white font-semibold' : 'hover:text-slate-900'}`}
            >
              Verified
            </button>
            <button
              onClick={() => setStatusFilter('flagged')}
              className={`px-2.5 py-1 rounded-md transition-colors ${statusFilter === 'flagged' ? 'bg-rose-500 text-white font-semibold' : 'hover:text-slate-900'}`}
            >
              Alerts
            </button>
          </div>

          <button
            onClick={() => setSelectedShift(prev => prev === 'all' ? 'overnight' : prev === 'overnight' ? 'day' : 'all')}
            className={`px-3 py-2 border text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
              selectedShift === 'overnight' 
                ? 'bg-purple-50 border-purple-200 text-purple-700' 
                : selectedShift === 'day' 
                ? 'bg-amber-50 border-amber-200 text-amber-700' 
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            Shift: {selectedShift === 'all' ? 'All Shifts' : selectedShift === 'overnight' ? 'Overnight Only' : 'Day OT Only'}
          </button>
        </div>
      </div>

      {/* Table of OT Attendances */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Normal Shift</th>
                <th className="py-3 px-3">Overtime Punch</th>
                <th className="py-3 px-3">Break Deduction</th>
                <th className="py-3 px-3">Net OT Hours</th>
                <th className="py-3 px-3">Device / Method</th>
                <th className="py-3 px-3">Status & Alerts</th>
                <th className="py-3 px-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredAttendances.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No overtime attendance logs match the current filters.
                  </td>
                </tr>
              ) : (
                filteredAttendances.map((att) => {
                  return (
                    <tr key={att.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{att.employeeName}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono bg-slate-100 px-1 py-0.2 rounded text-[10px] text-slate-600">{att.employeeId}</span>
                          <span>•</span>
                          <span>{att.department}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="text-slate-800 font-medium flex items-center gap-1 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {att.date}
                        </div>
                        {att.isOvernight && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200 mt-1">
                            <Moon className="w-2.5 h-2.5" /> Overnight Shift
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="text-xs text-slate-600 font-mono">
                          {att.normalCheckInTime} - {att.normalCheckOutTime}
                        </div>
                        <span className="text-[10px] text-slate-400">Standard 8h Shift</span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="text-xs font-mono font-semibold text-blue-700 bg-blue-50/70 border border-blue-100 px-2 py-0.5 rounded inline-block">
                          {att.overtimeCheckInTime} → {att.overtimeCheckOutTime}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-xs text-slate-600">
                        {att.breakDurationMinutes} mins
                        <span className="block text-[10px] text-slate-400">Tea / Dinner</span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-mono font-bold text-slate-900 text-sm">
                          {att.actualOvertimeHours.toFixed(2)} hrs
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          {att.syncSource === 'Biometric Device' ? (
                            <span className="flex items-center gap-1 text-emerald-700 font-medium">
                              <Cpu className="w-3.5 h-3.5" /> Biometric Sync
                            </span>
                          ) : (
                            <span className="text-slate-500">Manual Supervisor Punch</span>
                          )}
                        </div>
                        {att.biometricDeviceId && (
                          <div className="text-[10px] text-slate-400 font-mono">ID: {att.biometricDeviceId}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        {att.isLateCheckOutAlert || att.isMissingCheckOutAlert || att.isDuplicateEntryAlert ? (
                          <div className="space-y-1">
                            {att.isLateCheckOutAlert && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                                <AlertTriangle className="w-3 h-3 text-rose-500" />
                                Late Checkout
                              </span>
                            )}
                            {att.isMissingCheckOutAlert && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                                <AlertTriangle className="w-3 h-3 text-rose-500" />
                                Missing Checkout
                              </span>
                            )}
                            {att.isDuplicateEntryAlert && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                <AlertTriangle className="w-3 h-3 text-amber-500" />
                                Duplicate Punch
                              </span>
                            )}
                          </div>
                        ) : att.isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" /> Pending Sign-off
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {att.isVerified ? (
                          <div className="text-right">
                            <div className="text-xs font-medium text-emerald-700 flex items-center justify-end gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              {att.verifiedBy}
                            </div>
                            <div className="text-[10px] text-slate-400">{att.verificationDate}</div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleVerify(att.id, att.actualOvertimeHours)}
                            disabled={verifyingId === att.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            {verifyingId === att.id ? 'Verifying...' : 'Verify OT'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
