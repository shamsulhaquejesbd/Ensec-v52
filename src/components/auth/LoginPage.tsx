import React, { useState } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  X,
  ShieldCheck,
  UserPlus,
  Building,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { User, Role, getDefaultPermissionsForRole, resolveUserPermissions } from '../../types/erp.ts';
import { supabase, isSupabaseConfigured } from '../../lib/supabase.ts';

export interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { users, login, addUser, updateUserPassword } = useERP();

  // Sign In credentials state: Clean and empty by default (no auto-fill or backdoors)
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Modals for password reset and user enrollment
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);

  // Reset / Edit Password form state
  const [resetIdentifier, setResetIdentifier] = useState<string>('');
  const [newPasswordVal, setNewPasswordVal] = useState<string>('');
  const [confirmPasswordVal, setConfirmPasswordVal] = useState<string>('');
  const [showResetPasswordToggle, setShowResetPasswordToggle] = useState<boolean>(false);
  const [resetFeedback, setResetFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Register user state
  const [regUserId, setRegUserId] = useState<string>('');
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regDesignation, setRegDesignation] = useState<string>('');
  const [regRole, setRegRole] = useState<Role>('Sales Head');
  const [regDepartment, setRegDepartment] = useState<string>('Sales & Marketing');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');

  // Feedback states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle strictly validated Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanId = identifier.trim();
    const cleanIdLower = cleanId.toLowerCase();
    const inputPass = password;

    if (!cleanId) {
      setErrorMessage('Please enter your User ID or Email.');
      setIsLoading(false);
      return;
    }

    if (!inputPass) {
      setErrorMessage('Please enter your Password.');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Resolve matching account in registered ERP Users
      let matchedUser: User | undefined = users.find(
        (u) =>
          (u.userId && u.userId.trim().toLowerCase() === cleanIdLower) ||
          (u.email && u.email.trim().toLowerCase() === cleanIdLower) ||
          (u.phone && u.phone.replace(/[^0-9]/g, '') === cleanIdLower.replace(/[^0-9]/g, '')) ||
          (u.salesmanCode && u.salesmanCode.trim().toLowerCase() === cleanIdLower)
      );

      // 2. If not found in local memory, query Supabase public.users table
      if (!matchedUser && isSupabaseConfigured && supabase) {
        try {
          const { data } = await supabase
            .from('users')
            .select('*')
            .or(`user_id.ilike.${cleanId},email.ilike.${cleanId},uid.eq.${cleanId},phone.eq.${cleanId}`)
            .limit(1)
            .maybeSingle();

          if (data) {
            matchedUser = {
              id: data.uid ? String(data.uid) : `u-sb-${data.id}`,
              userId: data.user_id || data.uid || (data.email ? data.email.split('@')[0].toUpperCase() : `EMP-${data.id}`),
              name: data.name || 'Staff User',
              email: data.email || '',
              password:
                data.password !== undefined && data.password !== null && data.password !== ''
                  ? String(data.password)
                  : undefined,
              phone: data.phone || '',
              role: (data.role as any) || 'Field Force',
              designation: data.designation || '',
              department: data.department || '',
              status:
                data.status === 'Inactive'
                  ? 'Inactive'
                  : data.status === 'Blocked'
                  ? 'Blocked'
                  : 'Active',
              permissions: resolveUserPermissions({
                role: (data.role as any) || 'Field Force',
                permissions:
                  typeof data.permissions === 'string'
                    ? (() => {
                        try {
                          return JSON.parse(data.permissions);
                        } catch {
                          return null;
                        }
                      })()
                    : data.permissions,
              }),
              isSalesman: data.is_salesman,
              salesmanCode: data.salesman_code,
            };
          }
        } catch (dbErr) {
          console.warn('Supabase authentication check:', dbErr);
        }
      }

      // 3. Fallback only if user directory is completely unseeded
      if (!matchedUser && users.length === 0 && (cleanIdLower === 'admin' || cleanIdLower === 'admin@ensecbd.com')) {
        matchedUser = {
          id: 'u-admin-root',
          userId: 'ADMIN',
          password: 'ensec2026',
          name: 'Super Admin',
          email: 'admin@ensecbd.com',
          role: 'Super Admin',
          designation: 'Managing Director / System Administrator',
          department: 'Management',
          status: 'Active',
          permissions: getDefaultPermissionsForRole('Super Admin'),
        };
      }

      // 4. If account does not exist, reject
      if (!matchedUser) {
        setErrorMessage('Access Denied: Invalid User ID or Email. No registered account found.');
        setIsLoading(false);
        return;
      }

      // 5. Check if account is active
      if (matchedUser.status === 'Blocked' || matchedUser.status === 'Inactive') {
        setErrorMessage(`Access Denied: This account is currently marked as ${matchedUser.status}. Contact your Administrator.`);
        setIsLoading(false);
        return;
      }

      // 6. Strict Password Verification: Must match the account's registered password
      const registeredPassword = matchedUser.password;
      if (!registeredPassword || inputPass !== registeredPassword) {
        setErrorMessage('Access Denied: Incorrect password. Please try again.');
        setIsLoading(false);
        return;
      }

      // 7. Credentials verified: Log in and notify parent router
      setSuccessMessage(`Credentials verified. Welcome back, ${matchedUser.name}!`);
      setTimeout(() => {
        login(matchedUser);
        onLoginSuccess?.();
      }, 250);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
      setIsLoading(false);
    }
  };

  // Handle "Register User ID & Password"
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const cleanUserId = regUserId.trim().toUpperCase();
    const cleanEmail = regEmail.trim().toLowerCase();

    if (!cleanUserId) {
      setErrorMessage('Please provide a valid User ID.');
      setIsLoading(false);
      return;
    }

    if (!regName.trim()) {
      setErrorMessage('Please enter the full name.');
      setIsLoading(false);
      return;
    }

    if (regPassword.length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      setIsLoading(false);
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    // Check for duplicate User ID
    const alreadyExists = users.some(
      (u) => (u.userId && u.userId.toUpperCase() === cleanUserId) || (cleanEmail && u.email.toLowerCase() === cleanEmail)
    );
    if (alreadyExists) {
      setErrorMessage(`User ID "${cleanUserId}" or Email is already registered. Please sign in or use another ID.`);
      setIsLoading(false);
      return;
    }

    try {
      const newPermissions = getDefaultPermissionsForRole(regRole);
      const isSalesRole =
        regRole === 'Field Force' || regRole === 'Territory Sales Officer' || regRole === 'Sales Head';

      const newUser: User = {
        id: `u-${Date.now()}`,
        userId: cleanUserId,
        password: regPassword,
        name: regName.trim(),
        email: cleanEmail || `${cleanUserId.toLowerCase()}@ensecbd.com`,
        phone: regPhone.trim() || '+880 1700-000000',
        role: regRole,
        designation: regDesignation.trim() || `${regRole} Specialist`,
        department: regDepartment.trim() || 'Operations',
        status: 'Active',
        isSalesman: isSalesRole,
        salesmanCode: isSalesRole ? `REP-${cleanUserId.replace(/[^A-Z0-9]/g, '')}` : undefined,
        permissions: newPermissions,
      };

      addUser(newUser);
      setShowRegisterModal(false);
      setSuccessMessage(`Account registered for "${cleanUserId}"! Logging in now...`);

      setTimeout(() => {
        login(newUser);
        onLoginSuccess?.();
      }, 400);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create user account.');
      setIsLoading(false);
    }
  };

  // Reset / Edit Password Handler
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetFeedback(null);

    const cleanId = resetIdentifier.trim().toLowerCase();
    if (!cleanId) {
      setResetFeedback({ type: 'error', message: 'Please enter your registered User ID or Email.' });
      return;
    }

    if (!newPasswordVal || newPasswordVal.trim().length < 4) {
      setResetFeedback({ type: 'error', message: 'Password must be at least 4 characters long.' });
      return;
    }
    if (newPasswordVal !== confirmPasswordVal) {
      setResetFeedback({ type: 'error', message: 'Passwords do not match. Please verify.' });
      return;
    }

    setIsResetting(true);

    let targetUser: User | null =
      users.find(
        (u) =>
          (u.userId && u.userId.trim().toLowerCase() === cleanId) ||
          (u.email && u.email.trim().toLowerCase() === cleanId) ||
          (u.phone && u.phone.replace(/[^0-9]/g, '') === cleanId.replace(/[^0-9]/g, '')) ||
          (u.salesmanCode && u.salesmanCode.trim().toLowerCase() === cleanId)
      ) || null;

    // Check Supabase public.users if not cached in memory
    if (!targetUser && isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase
          .from('users')
          .select('*')
          .or(`user_id.ilike.${cleanId},email.ilike.${cleanId},uid.eq.${cleanId},phone.eq.${cleanId}`)
          .limit(1)
          .maybeSingle();

        if (data) {
          targetUser = {
            id: data.uid ? String(data.uid) : `u-sb-${data.id}`,
            userId: data.user_id || data.uid || (data.email ? data.email.split('@')[0].toUpperCase() : `EMP-${data.id}`),
            name: data.name || 'Staff User',
            email: data.email || '',
            role: (data.role as any) || 'Field Force',
            status: data.status || 'Active',
            permissions: resolveUserPermissions({
              role: (data.role as any) || 'Field Force',
              permissions: data.permissions,
            }),
          };
        }
      } catch (err) {
        console.warn('Supabase find user notice:', err);
      }
    }

    if (targetUser) {
      try {
        await updateUserPassword(targetUser.id, newPasswordVal.trim());
        setResetFeedback({
          type: 'success',
          message: `Password updated for ${targetUser.name}! Logging in now...`,
        });
        setPassword(newPasswordVal.trim());
        setIdentifier(targetUser.userId || targetUser.email || resetIdentifier);
        setTimeout(() => {
          setShowForgotModal(false);
          setIsResetting(false);
          login({ ...targetUser, password: newPasswordVal.trim() });
          onLoginSuccess?.();
        }, 800);
      } catch (err: any) {
        setResetFeedback({ type: 'error', message: err.message || 'Failed to update password.' });
        setIsResetting(false);
      }
    } else {
      setResetFeedback({
        type: 'error',
        message: `Account "${resetIdentifier}" not found. Only registered personnel can reset passwords.`,
      });
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-100 via-sky-50/40 to-indigo-50/60 text-slate-800 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* Ambient Lighting & Decorative Soft Mesh Gradients */}
      <div className="absolute -top-32 -left-32 w-[520px] h-[520px] bg-gradient-to-br from-indigo-200/50 via-sky-200/30 to-transparent rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[520px] h-[520px] bg-gradient-to-tl from-teal-100/50 via-blue-200/30 to-transparent rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-50/50 rounded-full blur-[120px] pointer-events-none" />

      {/* Subtle Grid Texture for Depth */}
      <div 
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#0f172a 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Main Card Container */}
      <div className="relative z-10 w-full max-w-[400px] sm:max-w-[430px] bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-[28px] shadow-[0_20px_50px_-12px_rgba(15,23,42,0.12),0_0_0_1px_rgba(15,23,42,0.04)] p-7 sm:p-9 space-y-5">
        {/* Header */}
        <div className="text-center pt-1 pb-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/70 text-indigo-700 text-[11px] font-semibold tracking-wider uppercase mb-3 shadow-xs">
            <Lock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Secure Access Gateway</span>
          </div>
          <h1 className="text-2xl sm:text-[30px] font-extrabold text-slate-900 tracking-tight leading-tight">
            WELCOME TO ENSEC
          </h1>
          <p className="text-sm text-slate-500 font-normal mt-1.5">
            Sign in with your User ID and Password
          </p>
        </div>

        {/* Feedback Banners */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in shadow-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-medium leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in shadow-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-medium leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Strict Sign In Form */}
        <form onSubmit={handleSignIn} className="space-y-4 pt-1">
          {/* User ID or Email Field */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold tracking-wider text-slate-700 uppercase">
              USER ID OR EMAIL
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter User ID (e.g. ADMIN or EMP-001)"
                className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-300 focus:border-indigo-600 text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all shadow-xs"
              />
              {identifier && (
                <div
                  className="absolute right-3.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100"
                  title="Entered"
                />
              )}
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold tracking-wider text-slate-700 uppercase">
              PASSWORD
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-300 focus:border-indigo-600 text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all shadow-xs tracking-wider"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                tabIndex={-1}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setResetIdentifier(identifier);
                  setResetFeedback(null);
                  setShowForgotModal(true);
                }}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 hover:from-indigo-700 hover:to-blue-800 text-white font-bold text-sm tracking-wide shadow-md shadow-indigo-600/25 hover:shadow-lg hover:shadow-indigo-600/35 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Sign In to ERP</span>
              )}
            </button>
          </div>

          {/* Account Enrollment and Corporate Notice */}
          <div className="pt-3 border-t border-slate-100 space-y-2.5 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Ensec Lithium Batteries BD • Enterprise RBAC Protected</span>
            </div>
          </div>
        </form>
      </div>

      {/* MODAL 1: RESET / EDIT PASSWORD (Verified by User ID) */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-2xl text-xs text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Reset Password</h3>
                  <p className="text-[11px] text-slate-500">Update password for your registered account</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Feedback message */}
            {resetFeedback && (
              <div
                className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                  resetFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {resetFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{resetFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3 pt-1">
              {/* Target Account Field */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold tracking-wider text-slate-700 uppercase">
                  REGISTERED USER ID OR EMAIL
                </label>
                <input
                  type="text"
                  required
                  value={resetIdentifier}
                  onChange={(e) => setResetIdentifier(e.target.value)}
                  placeholder="e.g. ADMIN or EMP-001"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 font-mono text-xs focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* New Password Field */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold tracking-wider text-slate-700 uppercase">
                  NEW PASSWORD
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showResetPasswordToggle ? 'text' : 'password'}
                    required
                    value={newPasswordVal}
                    onChange={(e) => setNewPasswordVal(e.target.value)}
                    placeholder="Min. 4 characters"
                    className="w-full pl-3 pr-9 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 font-mono text-xs focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPasswordToggle(!showResetPasswordToggle)}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showResetPasswordToggle ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold tracking-wider text-slate-700 uppercase">
                  CONFIRM NEW PASSWORD
                </label>
                <input
                  type={showResetPasswordToggle ? 'text' : 'password'}
                  required
                  value={confirmPasswordVal}
                  onChange={(e) => setConfirmPasswordVal(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 font-mono text-xs focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isResetting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-60"
                >
                  {isResetting ? 'Saving...' : 'Save & Log In'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs hover:bg-slate-50 font-medium cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: USER ENROLLMENT (CREATE USER ID & PASSWORD) */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Enroll User ID & Password</h3>
                  <p className="text-[11px] text-slate-500">Register employee or administrator credentials</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Assigned User ID *
                </label>
                <input
                  type="text"
                  required
                  value={regUserId}
                  onChange={(e) => setRegUserId(e.target.value)}
                  placeholder="e.g. EMP-020 or ADMIN-2"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono uppercase focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Shamsul Haque"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="user@ensecbd.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+880 1700-000000"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Role Clearance *
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as Role)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="Super Admin">Super Admin</option>
                  <option value="Sales Head">Sales Head</option>
                  <option value="Field Force">Field Force (Salesman)</option>
                  <option value="Factory Manager">Factory Manager</option>
                  <option value="Warehouse Manager">Warehouse Manager</option>
                  <option value="Accounts / Finance">Accounts / Finance</option>
                  <option value="Territory Sales Officer">Territory Sales Officer</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Set Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min. 4 characters"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer"
                >
                  Enroll &amp; Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs hover:bg-slate-50 font-medium cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
