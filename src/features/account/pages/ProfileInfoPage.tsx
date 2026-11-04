import React, { useState } from 'react';
import { User, Mail, Building, Briefcase, Globe, Clock, CheckCircle2, Shield, KeyRound } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';

export const ProfileInfoPage: React.FC = () => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [company, setCompany] = useState(user?.companyName || user?.company || 'Enterprise Systems Corp');
  const [department, setDepartment] = useState('Core Modernization Engineering');
  const [timezone, setTimezone] = useState('Asia/Ho_Chi_Minh');
  const [language, setLanguage] = useState('en');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return 'U';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }, 400);
  };

  return (
    <div className="w-full space-y-6">
      {/* Upper Section: Balanced Two-Column Layout (Form on Left, Account Overview on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        {/* Left Column (65%): Personal Information and Organization & Work */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6 shadow-xs min-w-0">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Profile Information</h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-[65ch] [text-wrap:pretty]">
              Update your personal credentials, contact email, and workspace organization details.
            </p>
          </div>

          {isSaved && (
            <div className="bg-[#ECFDF3] border border-[#ABEFC6] text-[#079455] p-3.5 rounded-lg text-xs sm:text-sm flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>Profile changes saved successfully.</span>
            </div>
          )}

          <form id="profile-form" onSubmit={handleSave} className="space-y-6">
            {/* Section 1: Personal Credentials */}
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Personal Information</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Hoang Nguyen"
                  icon={<User className="w-4 h-4 text-slate-500" />}
                />
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full h-11 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg pl-10 pr-24 text-sm cursor-not-allowed shadow-xs"
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Organization & Work */}
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Organization & Work</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Organization / Company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Acme Corporation"
                  icon={<Building className="w-4 h-4 text-slate-500" />}
                />
                <Input
                  label="Department / Role"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Modernization Lead"
                  icon={<Briefcase className="w-4 h-4 text-slate-500" />}
                />
              </div>
            </div>
          </form>
        </div>

        {/* Right Column (35%): Account Overview and Verification Information */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 sm:p-7 space-y-5 shadow-xs min-w-0">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Account Overview</h3>
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-full bg-blue-50 border-2 border-blue-200 text-blue-600 font-bold flex items-center justify-center text-lg shadow-2xs shrink-0">
              {getInitials(user?.fullName || fullName)}
            </div>
            <div className="min-w-0">
              <h4 className="text-base font-bold text-slate-900 truncate">{fullName || user?.fullName || 'ALSM User'}</h4>
              <p className="text-xs text-slate-600 truncate">{user?.email || 'user@alsm.io'}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  <Shield className="w-3 h-3 text-blue-600" />
                  <span>{user?.isPlatformAdmin ? 'Platform Admin' : 'Verified Member'}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2 text-xs border-t border-slate-100">
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-600">Account ID</span>
              <span className="font-mono text-slate-800 font-semibold">{user?.id ? user.id.slice(0, 16) : 'ALSM-USR-80492'}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-t border-slate-100">
              <span className="text-slate-600">Authentication</span>
              <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                <span>Password + 2FA</span>
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-t border-slate-100">
              <span className="text-slate-600">Workspace Role</span>
              <span className="font-semibold text-slate-800">{user?.role || 'Engineer'}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-t border-slate-100">
              <span className="text-slate-600">Status</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Active & Compliant</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Section: Regional Settings (Separate full-width section with aligned footer) */}
      <div className="w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Regional Settings</h3>
          <p className="text-xs text-slate-600 mt-0.5 max-w-[65ch] [text-wrap:pretty]">
            Set your preferred timezone and display language for automated batch export timestamping.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Timezone
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Clock className="w-4 h-4" />
              </div>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full h-11 bg-white border border-slate-200 text-slate-900 rounded-lg pl-10 pr-3 text-sm focus:outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-100 transition-all shadow-xs"
              >
                <option value="Asia/Ho_Chi_Minh">UTC+07:00 (Bangkok, Hanoi, Jakarta)</option>
                <option value="Asia/Tokyo">UTC+09:00 (Tokyo, Seoul)</option>
                <option value="Asia/Singapore">UTC+08:00 (Singapore, Beijing)</option>
                <option value="America/New_York">UTC-05:00 (Eastern Time)</option>
                <option value="America/Los_Angeles">UTC-08:00 (Pacific Time)</option>
                <option value="Europe/London">UTC+00:00 (London, GMT)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Interface Language
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Globe className="w-4 h-4" />
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full h-11 bg-white border border-slate-200 text-slate-900 rounded-lg pl-10 pr-3 text-sm focus:outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-100 transition-all shadow-xs"
              >
                <option value="en">English (United States)</option>
                <option value="vi">Tiếng Việt (Vietnamese)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setFullName(user?.fullName || '');
            }}
            className="h-9 px-4 text-xs sm:text-sm font-medium"
          >
            Reset
          </Button>
          <Button
            type="submit"
            form="profile-form"
            isLoading={isSaving}
            className="h-9 px-4 text-xs sm:text-sm font-semibold"
          >
            Save Profile
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileInfoPage;
