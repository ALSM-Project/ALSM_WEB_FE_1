import React, { useEffect, useState } from 'react';
import { Laptop, Smartphone, Monitor, ShieldAlert, LogOut } from 'lucide-react';
import { accountService } from '../services/account.service';
import type { UserSession } from '@/features/auth/types/auth';
import { Button } from '@/shared/ui/Button';

export const ActiveSessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<UserSession[]>([]);

  useEffect(() => {
    accountService.getActiveSessions().then((res) => {
      setSessions(res);
    });
  }, []);

  const handleRevoke = async (id: string) => {
    const updated = await accountService.revokeSession(id);
    setSessions(updated);
  };

  const handleRevokeAllOther = async () => {
    const updated = await accountService.revokeAllOtherSessions();
    setSessions(updated);
  };

  const getDeviceIcon = (browser: string) => {
    if (browser.includes('iOS') || browser.includes('iPhone')) return <Smartphone className="w-5 h-5 text-brand-600" />;
    if (browser.includes('macOS')) return <Laptop className="w-5 h-5 text-brand-600" />;
    return <Monitor className="w-5 h-5 text-brand-600" />;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Active Sessions</h2>
          <p className="text-sm text-slate-500 mt-1">Devices currently signed in to your account.</p>
        </div>

        <Button
          variant="danger"
          size="sm"
          onClick={handleRevokeAllOther}
          disabled={sessions.length <= 1}
          className="space-x-1.5 font-semibold"
        >
          <LogOut className="w-4 h-4" />
          <span>Revoke All Other Sessions</span>
        </Button>
      </div>

      <div className="bg-[#FFFAEB] border border-[#FEDF89] rounded-xl p-4 flex items-start space-x-3 text-[#DC6803] text-xs">
        <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#DC6803]" />
        <p className="leading-relaxed font-medium">
          If you recognize an unfamiliar device, we recommend revoking its access and immediately changing your password.
        </p>
      </div>

      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-xs">
                {getDeviceIcon(session.browser)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-900 text-sm">{session.browser}</span>
                  {session.isCurrent && (
                    <span className="bg-[#ECFDF3] text-[#079455] border border-[#ABEFC6] text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      This Device
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                  <span>{session.location}</span>
                  <span>•</span>
                  <span className="font-mono">IP: {session.ipAddress}</span>
                  <span>•</span>
                  <span>Last active: {session.lastActive}</span>
                </div>
              </div>
            </div>

            {!session.isCurrent && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRevoke(session.id)}
                className="text-xs text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50 font-medium"
              >
                Revoke Access
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
export default ActiveSessionsPage;
