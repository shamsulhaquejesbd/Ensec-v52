/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ensec ERP - In-App Notification Center Drawer
 * Real-time collection alerts, overdue escalations, and payment milestone notifications.
 */

import React, { useState } from 'react';
import {
  Bell,
  X,
  CheckCheck,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ArrowRight,
  Filter,
  CheckCircle2,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { InstallmentNotification } from '../../types/installment.ts';

interface NotificationCenterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: string) => void;
}

export const NotificationCenterDrawer: React.FC<NotificationCenterDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { installmentNotifications, markNotificationAsRead, markAllNotificationsAsRead } = useERP();
  const [filterType, setFilterType] = useState<string>('all');

  if (!isOpen) return null;

  const unreadCount = installmentNotifications.filter((n) => !n.isRead).length;

  const filtered = installmentNotifications.filter((n) => {
    if (filterType === 'all') return true;
    if (filterType === 'unread') return !n.isRead;
    return n.type === filterType;
  });

  const getPriorityBadge = (priority: InstallmentNotification['priority']) => {
    switch (priority) {
      case 'critical':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> Critical
          </span>
        );
      case 'high':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> High
          </span>
        );
      case 'medium':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">
            Medium
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            Info
          </span>
        );
    }
  };

  const getTypeIcon = (type: InstallmentNotification['type']) => {
    switch (type) {
      case 'escalation':
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'commitment_missed':
        return <Calendar className="w-4 h-4 text-orange-500" />;
      case 'payment_received':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const handleActionClick = (notif: InstallmentNotification) => {
    markNotificationAsRead(notif.id);
    if (notif.type === 'escalation' || notif.type === 'overdue' || notif.type === 'commitment_missed') {
      onNavigate('collection-dashboard');
    } else if (notif.type === 'payment_received') {
      onNavigate('installment-payment-history');
    } else {
      onNavigate('installment-dashboard');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col h-full border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Collection Notifications
                </h2>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Installment alerts, escalations & payment updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="px-2 py-1 rounded text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 flex items-center gap-1"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mark read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <Filter className="w-3 h-3 text-slate-400 shrink-0" />
          {[
            { id: 'all', label: 'All' },
            { id: 'unread', label: `Unread (${unreadCount})` },
            { id: 'escalation', label: 'Escalations' },
            { id: 'overdue', label: 'Overdue' },
            { id: 'commitment_missed', label: 'Commitments' },
            { id: 'payment_received', label: 'Receipts' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap transition ${
                filterType === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-60" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                All caught up!
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                No alerts matching the selected filter.
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => handleActionClick(item)}
                className={`p-4 transition cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                  !item.isRead ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                    {getTypeIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </span>
                      {getPriorityBadge(item.priority)}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-1.5">
                      {item.message}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{item.createdAt}</span>
                      <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-0.5 hover:underline">
                        Open action <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Quick Action */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500">
            Total {installmentNotifications.length} alerts logged
          </span>
          <button
            onClick={() => {
              onNavigate('collection-dashboard');
              onClose();
            }}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
          >
            <span>Collection Hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
