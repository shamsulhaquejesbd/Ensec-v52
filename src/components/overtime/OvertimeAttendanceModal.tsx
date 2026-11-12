import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { calculateNetOvertimeHours } from '../../types/overtime';
import { 
  X, 
  Clock, 
  Calendar, 
  Moon, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Fingerprint
} from 'lucide-react';

interface OvertimeAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OvertimeAttendanceModal: React.FC<OvertimeAttendanceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { fieldForceReps, recordOvertimeAttendance, currentUser } = useERP();

  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [normalCheckIn, setNormalCheckIn] = useState('08:00');
  const [normalCheckOut, setNormalCheckOut] = useState('17:00');
  const [overtimeCheckIn, setOvertimeCheckIn] = useState('17:30');
  const [overtimeCheckOut, setOvertimeCheckOut] = useState('21:30');
  const [breakMinutes, setBreakMinutes] = useState(30);
  const [isOvernight, setIsOvernight] = useState(false);
  const [overnightNextDayDate, setOvernightNextDayDate] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const selectedRep = fieldForceReps.find(r => r.id === selectedEmpId);

  // Calculate net overtime hours in real-time
  const netHours = calculateNetOvertimeHours(
    overtimeCheckIn,
    overtimeCheckOut,
    breakMinutes,
    isOvernight
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRep) return;

    recordOvertimeAttendance({
      employeeId: selectedRep.id,
      employeeCode: selectedRep.employeeId || selectedRep.id,
      employeeName: selectedRep.name,
      department: selectedRep.department || 'Production Assembly',
      designation: selectedRep.designation || 'Operator',
      date,
      normalCheckInTime: normalCheckIn,
      normalCheckOutTime: normalCheckOut,
      overtimeCheckInTime: overtimeCheckIn,
      overtimeCheckOutTime: overtimeCheckOut,
      isOvernight,
      breakDurationMinutes: breakMinutes,
      rawCalculatedHours: netHours,
      actualOvertimeHours: netHours,
      isVerified: currentUser.role === 'Super Admin',
      verifiedBy: currentUser.role === 'Super Admin' ? 'Admin Controller' : undefined,
      verificationDate: currentUser.role === 'Super Admin' ? new Date().toISOString().split('T')[0] : undefined,
      syncSource: 'Manual',
      notes,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/30 border border-blue-400/30 rounded-lg text-blue-300">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-100">Record Overtime Check-In / Check-Out</h3>
              <p className="text-xs text-slate-400">Separate normal shift hours from verified overtime work</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Employee selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Factory Employee <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">-- Choose Employee from Central Master --</option>
              {fieldForceReps.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.name} ({rep.id}) — {rep.department || 'Production'} / {rep.designation || 'Worker'}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Overnight Shift toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Work Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={isOvernight}
                  onChange={(e) => setIsOvernight(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    <Moon className="w-3.5 h-3.5 text-purple-600" /> Overnight Overtime Shift
                  </span>
                  <span className="text-[11px] text-slate-500">Punches cross midnight into next day</span>
                </div>
              </label>
            </div>
          </div>

          {isOvernight && (
            <div>
              <label className="block text-xs font-semibold text-purple-800 uppercase tracking-wider mb-1.5">
                Overnight Roll-over Next Day Date
              </label>
              <input
                type="date"
                value={overnightNextDayDate}
                onChange={(e) => setOvernightNextDayDate(e.target.value)}
                className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm bg-purple-50/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}

          {/* Normal Shift (Reference) */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <span className="text-xs font-semibold text-slate-600 block mb-2">Standard Factory Shift (Reference)</span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-500 block mb-1">Standard Check-In</label>
                <input
                  type="time"
                  value={normalCheckIn}
                  onChange={(e) => setNormalCheckIn(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-slate-700 bg-white"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Standard Check-Out</label>
                <input
                  type="time"
                  value={normalCheckOut}
                  onChange={(e) => setNormalCheckOut(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-slate-700 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Overtime Punch Inputs */}
          <div className="bg-blue-50/60 p-3.5 rounded-lg border border-blue-200">
            <span className="text-xs font-semibold text-blue-900 block mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Verified Overtime Clock In / Out
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-700 block mb-1">OT Check-In</label>
                <input
                  type="time"
                  value={overtimeCheckIn}
                  onChange={(e) => setOvertimeCheckIn(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 border border-blue-300 rounded text-slate-800 bg-white text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-700 block mb-1">OT Check-Out</label>
                <input
                  type="time"
                  value={overtimeCheckOut}
                  onChange={(e) => setOvertimeCheckOut(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 border border-blue-300 rounded text-slate-800 bg-white text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-700 block mb-1">Break (Mins)</label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-blue-300 rounded text-slate-800 bg-white text-xs font-mono"
                />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-blue-200">
              <span className="text-blue-800 font-medium">Calculated Net OT Hours:</span>
              <span className="text-sm font-bold font-mono text-blue-900">{netHours.toFixed(2)} hrs</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Supervisor Notes & Machine Remarks
            </label>
            <input
              type="text"
              placeholder="e.g., Extended shift for cell formation heater emergency repair..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedRep}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              Record Attendance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
