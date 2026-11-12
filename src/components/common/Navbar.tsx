import React, { useState } from 'react';
import {
  BatteryCharging,
  Layers,
  Smartphone,
  User as UserIcon,
  ChevronDown,
  Menu,
  Shield,
  Building,
  LogOut,
  Bell,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { ThemeToggle } from './ThemeToggle.tsx';
import { Role } from '../../types/erp.ts';
import { NotificationCenterDrawer } from './NotificationCenterDrawer.tsx';

interface NavbarProps {
  onToggleSidebar: () => void;
  onNavigate: (module: string) => void;
  activeModule: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onNavigate, activeModule }) => {
  const { currentUser, logout, setShowArchitectureModal, installmentNotifications } = useERP();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);

  const unreadNotifCount = installmentNotifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 pl-4 md:pl-6 pr-6 md:pr-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Left: Mobile Menu Toggle & Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <BatteryCharging className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                ENSEC
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300">
                ERP BD
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">
              Lithium Battery Distribution & Optimum JV
            </p>
          </div>
        </div>
      </div>

      {/* Right: Theme Toggle & Role/User Selector */}
      <div className="flex items-center gap-2.5">
        <ThemeToggle />

        {/* Collection Notification Bell */}
        <button
          onClick={() => setShowNotifDrawer(true)}
          className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          title="Collection Notifications & Overdue Alerts"
        >
          <Bell className="w-4 h-4" />
          {unreadNotifCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
              {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
            </span>
          )}
        </button>

        {/* User / Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
              {currentUser.name.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[120px]">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                {currentUser.role}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">{currentUser.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">ID: {currentUser.userId || currentUser.id}</p>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                  <Shield className="w-3 h-3" />
                  <span>Role: {currentUser.role}</span>
                </div>
              </div>

              <div className="p-2">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full py-2 px-3 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slide-out Collection Notification Center Drawer */}
      <NotificationCenterDrawer
        isOpen={showNotifDrawer}
        onClose={() => setShowNotifDrawer(false)}
        onNavigate={onNavigate}
      />
    </header>
  );
};
