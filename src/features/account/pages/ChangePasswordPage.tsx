import React, { useState } from 'react';
import { Lock, AlertTriangle, Info, CheckCircle2, Check, X, Shield, Key, Smartphone, AlertCircle } from 'lucide-react';
import { tokenStore } from '@/services/api/tokenStore';
import { accountService } from '../services/account.service';
import { PasswordInput } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { useAuth } from '@/app/providers';

export const ChangePasswordPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const hasPassword = user?.hasPassword !== false;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [acknowledgeLogout, setAcknowledgeLogout] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Password rules validation
  const rule8Chars = newPassword.length >= 8;
  const ruleUpperLower = /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword);
  const ruleNumber = /[0-9]/.test(newPassword);
  const ruleSpecial = /[^A-Za-z0-9]/.test(newPassword);

  const rulesPassedCount = [rule8Chars, ruleUpperLower, ruleNumber, ruleSpecial].filter(Boolean).length;

  let strengthLabel = '';
  let strengthColor = 'bg-slate-200';
  let strengthTextColor = 'text-slate-600';

  if (newPassword.length > 0) {
    if (rulesPassedCount <= 1) {
      strengthLabel = 'Weak';
      strengthColor = 'bg-rose-500';
      strengthTextColor = 'text-rose-600';
    } else if (rulesPassedCount === 2) {
      strengthLabel = 'Fair';
      strengthColor = 'bg-amber-500';
      strengthTextColor = 'text-amber-600';
    } else if (rulesPassedCount === 3) {
      strengthLabel = 'Good';
      strengthColor = 'bg-blue-500';
      strengthTextColor = 'text-blue-600';
    } else {
      strengthLabel = 'Strong';
      strengthColor = 'bg-emerald-500';
      strengthTextColor = 'text-emerald-600';
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (hasPassword && !currentPassword) return setErrorMsg('Current password is required');
    if (rulesPassedCount < 4) return setErrorMsg('Please ensure all password strength requirements are satisfied');
    if (newPassword !== confirmNewPassword) return setErrorMsg('Passwords must match exactly');
    if (!acknowledgeLogout) return setErrorMsg('Please acknowledge the device logout warning');

    setLoading(true);
    try {
      if (hasPassword) {
        await accountService.changePassword({
          currentPassword,
          newPassword,
          confirmNewPassword,
          acknowledgeLogout,
        });
        setSuccessMsg('Your password has been updated successfully!');
      } else {
        await accountService.setPassword(newPassword);
        setSuccessMsg('Your ALSM password has been set successfully!');
      }
      await tokenStore.completePasswordChange();
      await refreshUser();
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setAcknowledgeLogout(false);
    } catch {
      setErrorMsg(
        hasPassword
          ? 'Failed to update password. Please check your current password.'
          : 'Failed to set password. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6 shadow-xs">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
          {hasPassword ? 'Change Password' : 'Set Password'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-[65ch] [text-wrap:pretty]">
          {hasPassword
            ? 'Your ALSM password is set. Update your account password to maintain security.'
            : "You haven't set an ALSM password yet. Create a password to enable email & password sign in."}
        </p>
      </div>

      {successMsg && (
        <div className="bg-[#ECFDF3] border border-[#ABEFC6] text-[#079455] p-3.5 rounded-lg text-xs sm:text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-[#FEF3F2] border border-[#FECDCA] text-[#D92D20] p-3.5 rounded-lg text-xs sm:text-sm font-medium">
          {errorMsg}
        </div>
      )}

      {/* Balanced 60/40 two-column enterprise layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
        {/* Left Column (60%): Password change form */}
        <div className="lg:col-span-7 min-w-0">
          <form onSubmit={handleSubmit} className="space-y-6 w-full">
            {/* 1. Current Password */}
            {hasPassword && (
              <div className="space-y-1.5">
                <PasswordInput
                  label="Current Password"
                  placeholder="••••••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4 text-slate-500" />}
                />
              </div>
            )}

            {/* 2. New Password */}
            <div className="space-y-2.5">
              <PasswordInput
                label="New Password"
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                icon={<Lock className="w-4 h-4 text-slate-500" />}
              />

              {/* Password Strength Feedback - Direct inline element without nested card border */}
              <div className="pt-1 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Password strength</span>
                  <span className={`font-semibold ${strengthTextColor}`}>{strengthLabel || 'None'}</span>
                </div>

                {/* 4 Segmented Progress Bars */}
                <div className="grid grid-cols-4 gap-2">
                  <div className={`h-1.5 rounded-full transition-all ${rulesPassedCount >= 1 ? strengthColor : 'bg-slate-200'}`} />
                  <div className={`h-1.5 rounded-full transition-all ${rulesPassedCount >= 2 ? strengthColor : 'bg-slate-200'}`} />
                  <div className={`h-1.5 rounded-full transition-all ${rulesPassedCount >= 3 ? strengthColor : 'bg-slate-200'}`} />
                  <div className={`h-1.5 rounded-full transition-all ${rulesPassedCount >= 4 ? strengthColor : 'bg-slate-200'}`} />
                </div>
              </div>
            </div>

            {/* 3. Confirm New Password */}
            <div className="space-y-1.5">
              <PasswordInput
                label="Confirm New Password"
                placeholder="••••••••••••"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                icon={<Lock className="w-4 h-4 text-slate-500" />}
              />
              {confirmNewPassword && newPassword === confirmNewPassword && (
                <p className="text-xs text-emerald-600 font-medium flex items-center space-x-1 pt-0.5">
                  <Check className="w-4 h-4" />
                  <span>Passwords match</span>
                </p>
              )}
            </div>

            {/* 4. Warning: Device Logout - Integrated inline notice (no side-tab accent border, no nested card) */}
            <div className="pt-1 space-y-2">
              <div className="flex items-center space-x-2 text-amber-800 font-semibold text-xs tracking-wide">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                <span>Warning: Device Logout</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed max-w-[60ch] [text-wrap:pretty]">
                This will log you out from all other active sessions and devices immediately.
              </p>
              <div className="flex items-start space-x-2.5 pt-0.5">
                <input
                  type="checkbox"
                  id="acknowledge"
                  checked={acknowledgeLogout}
                  onChange={(e) => setAcknowledgeLogout(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label
                  htmlFor="acknowledge"
                  className="text-xs text-slate-800 cursor-pointer select-none leading-relaxed font-medium max-w-[60ch] [text-wrap:pretty]"
                >
                  I understand I'll need to sign in again on my other devices after updating my password.
                </label>
              </div>
            </div>

            {/* 5. Password History Information */}
            <div className="flex items-center space-x-2 text-xs text-slate-600 py-0.5">
              <Info className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <span>You cannot reuse any of your last 5 passwords.</span>
            </div>

            {/* 6. Action Footer */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmNewPassword('');
                }}
                className="h-9 px-4 text-xs sm:text-sm font-medium"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={loading}
                className="h-9 px-4 text-xs sm:text-sm font-semibold"
              >
                {hasPassword ? 'Update Password' : 'Set Password'}
              </Button>
            </div>
          </form>
        </div>

        {/* Right Column (40%): Password Requirements & Security Intelligence */}
        <div className="lg:col-span-5 bg-slate-50/70 rounded-xl p-5 divide-y divide-slate-200/80 space-y-5 min-w-0">
          {/* Section 1: Password Requirements Checklist */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Key className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Password Requirements</h3>
            </div>
            <p className="text-xs text-slate-600 max-w-[55ch] [text-wrap:pretty]">
              To keep your modernization projects secure, passwords must satisfy all enterprise complexity standards:
            </p>
            <ul className="space-y-2 pt-1 text-xs">
              <li className={`flex items-center space-x-2.5 ${rule8Chars ? 'text-emerald-700 font-semibold' : 'text-slate-600'}`}>
                {rule8Chars ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                <span>At least 8 characters long</span>
              </li>
              <li className={`flex items-center space-x-2.5 ${ruleUpperLower ? 'text-emerald-700 font-semibold' : 'text-slate-600'}`}>
                {ruleUpperLower ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                <span>Both uppercase and lowercase letters</span>
              </li>
              <li className={`flex items-center space-x-2.5 ${ruleNumber ? 'text-emerald-700 font-semibold' : 'text-slate-600'}`}>
                {ruleNumber ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                <span>At least one numerical digit (0–9)</span>
              </li>
              <li className={`flex items-center space-x-2.5 ${ruleSpecial ? 'text-emerald-700 font-semibold' : 'text-slate-600'}`}>
                {ruleSpecial ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                <span>At least one special symbol (!@#$%^&*)</span>
              </li>
            </ul>
          </div>

          {/* Section 2: Enterprise Security Tips */}
          <div className="pt-5 space-y-3">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Account Protection Tips</h3>
            </div>
            <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
              <div className="flex items-start space-x-2.5">
                <Smartphone className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <p className="max-w-[55ch] [text-wrap:pretty]">
                  <strong className="text-slate-800 font-medium">Immediate Session Invalidation:</strong> Changing your password terminates all active JWT tokens on other workstations immediately.
                </p>
              </div>
              <div className="flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <p className="max-w-[55ch] [text-wrap:pretty]">
                  <strong className="text-slate-800 font-medium">Password Rotation:</strong> We recommend updating credentials every 90 days if operating on sensitive mainframe core data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
