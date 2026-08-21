import React, { useState } from 'react';
import { Lock, AlertTriangle, Info, CheckCircle2, Check, X } from 'lucide-react';
import { accountService } from '../services/account.service';
import { PasswordInput } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';

export const ChangePasswordPage: React.FC = () => {
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
  let strengthTextColor = 'text-slate-500';

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

    if (!currentPassword) return setErrorMsg('Current password is required');
    if (rulesPassedCount < 4) return setErrorMsg('Please ensure all password strength requirements are satisfied');
    if (newPassword !== confirmNewPassword) return setErrorMsg('Passwords must match exactly');
    if (!acknowledgeLogout) return setErrorMsg('Please acknowledge the device logout warning');

    setLoading(true);
    try {
      await accountService.changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword,
        acknowledgeLogout,
      });
      setSuccessMsg('Your password has been updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setAcknowledgeLogout(false);
    } catch {
      setErrorMsg('Failed to update password. Please check your current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Change Password</h2>
        <p className="text-sm text-slate-500 mt-1">Update your account password to maintain security.</p>
      </div>

      {successMsg && (
        <div className="bg-[#ECFDF3] border border-[#ABEFC6] text-[#079455] p-4 rounded-lg text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-[#FEF3F2] border border-[#FECDCA] text-[#D92D20] p-4 rounded-lg text-sm font-medium">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
        <PasswordInput
          label="Current Password"
          placeholder="••••••••••••"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          icon={<Lock className="w-4 h-4 text-slate-400" />}
        />

        <div className="space-y-2">
          <PasswordInput
            label="New Password"
            placeholder="••••••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            icon={<Lock className="w-4 h-4 text-slate-400" />}
          />

          {/* Password Strength Meter */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Password strength</span>
              <span className={`font-bold ${strengthTextColor}`}>{strengthLabel || 'None'}</span>
            </div>

            {/* 4 Segmented Progress Bars */}
            <div className="grid grid-cols-4 gap-2">
              <div className={`h-2 rounded-full transition-all ${rulesPassedCount >= 1 ? strengthColor : 'bg-slate-200'}`} />
              <div className={`h-2 rounded-full transition-all ${rulesPassedCount >= 2 ? strengthColor : 'bg-slate-200'}`} />
              <div className={`h-2 rounded-full transition-all ${rulesPassedCount >= 3 ? strengthColor : 'bg-slate-200'}`} />
              <div className={`h-2 rounded-full transition-all ${rulesPassedCount >= 4 ? strengthColor : 'bg-slate-200'}`} />
            </div>

            {/* Rules checklist */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
              <li className={`flex items-center space-x-2 ${rule8Chars ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                {rule8Chars ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                <span>8+ characters</span>
              </li>
              <li className={`flex items-center space-x-2 ${ruleUpperLower ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                {ruleUpperLower ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                <span>Uppercase & lowercase</span>
              </li>
              <li className={`flex items-center space-x-2 ${ruleNumber ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                {ruleNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                <span>At least one number</span>
              </li>
              <li className={`flex items-center space-x-2 ${ruleSpecial ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                {ruleSpecial ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                <span>At least one special character</span>
              </li>
            </ul>
          </div>
        </div>

        <PasswordInput
          label="Confirm New Password"
          placeholder="••••••••••••"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          icon={<Lock className="w-4 h-4 text-slate-400" />}
        />
        {confirmNewPassword && newPassword === confirmNewPassword && (
          <p className="text-xs text-emerald-600 font-medium flex items-center space-x-1">
            <Check className="w-3.5 h-3.5" />
            <span>Passwords match</span>
          </p>
        )}

        {/* Security Warning Box (Light Amber Card) */}
        <div className="bg-[#FFFAEB] border border-[#FEDF89] rounded-xl p-4 space-y-3">
          <div className="flex items-center space-x-2 text-[#DC6803] font-semibold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-[#DC6803]" />
            <span>Warning: Device Logout</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            This will log you out from all other active sessions and devices immediately.
          </p>
          <div className="flex items-start space-x-2.5 pt-1">
            <input
              type="checkbox"
              id="acknowledge"
              checked={acknowledgeLogout}
              onChange={(e) => setAcknowledgeLogout(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
            />
            <label htmlFor="acknowledge" className="text-xs text-slate-700 cursor-pointer select-none">
              I understand I'll need to sign in again on my other devices after updating my password.
            </label>
          </div>
        </div>

        {/* Info Box */}
        <div className="flex items-center space-x-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <Info className="w-4 h-4 text-brand-600 flex-shrink-0" />
          <span>You cannot reuse any of your last 5 passwords.</span>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={() => { setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword(''); }}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading}>
            Update Password
          </Button>
        </div>
      </form>
    </div>
  );
};
export default ChangePasswordPage;
