import React, { useState } from 'react';
import { Laptop, Monitor, ShieldAlert, Smartphone, Tablet, ShieldCheck, Clock } from 'lucide-react';
import type { ActiveSession } from '../types/account';
import { useActiveSessions } from '../queries/useActiveSessions';
import { useRevokeSession } from '../queries/useRevokeSession';
import { formatSessionLastActive, formatSessionTimestamp } from '../utils/sessionDate';
import { useAuth } from '@/app/providers';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';

const deviceIcon = (deviceType: string) => {
  const normalizedDeviceType = deviceType.toLowerCase();
  const iconClassName = 'h-5 w-5 text-[#0652CC]';

  if (normalizedDeviceType.includes('mobile')) return <Smartphone className={iconClassName} aria-hidden="true" />;
  if (normalizedDeviceType.includes('tablet')) return <Tablet className={iconClassName} aria-hidden="true" />;
  if (normalizedDeviceType.includes('laptop')) return <Laptop className={iconClassName} aria-hidden="true" />;

  return <Monitor className={iconClassName} aria-hidden="true" />;
};

const sessionDescription = (session: ActiveSession): string =>
  `${session.deviceType} session using ${session.browser}`;

export const ActiveSessionsPage: React.FC = () => {
  const { user } = useAuth();
  const [sessionToRevoke, setSessionToRevoke] = useState<ActiveSession | null>(null);
  const sessionsQuery = useActiveSessions(user?.id);
  const revokeSession = useRevokeSession(user?.id);
  const sessions = sessionsQuery.data ?? [];
  const mutationError = revokeSession.isError ? 'We could not revoke that session. Please try again.' : null;

  const currentSession = sessions.find((s) => s.isCurrent);
  const remoteSessionsCount = sessions.filter((s) => !s.isCurrent).length;

  const confirmRevokeSession = () => {
    if (!sessionToRevoke || revokeSession.isPending) return;

    revokeSession.mutate(sessionToRevoke.id, {
      onSuccess: () => setSessionToRevoke(null),
    });
  };

  return (
    <section className="w-full space-y-6" aria-labelledby="active-sessions-heading">
      {/* Top Section: Full-Width Session Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        {/* Metric Card 1: Total Active Sessions */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center space-x-4">
          <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Monitor className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">Active Sessions</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{sessionsQuery.isLoading ? '...' : sessions.length}</p>
            <p className="text-xs text-slate-600 font-medium mt-0.5">{remoteSessionsCount} remote device{remoteSessionsCount === 1 ? '' : 's'}</p>
          </div>
        </div>

        {/* Metric Card 2: Current Workstation */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center space-x-4">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">Current Workstation</p>
            <p className="text-sm font-bold text-slate-900 truncate mt-0.5">{currentSession ? `${currentSession.deviceType} (${currentSession.browser})` : 'Active Session'}</p>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>Online Now</span>
            </span>
          </div>
        </div>

        {/* Metric Card 3: Session Security Policy */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center space-x-4">
          <div className="w-11 h-11 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">Inactivity Timeout</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">30 Minutes</p>
            <p className="text-xs text-slate-600 font-medium mt-0.5">Tokens auto-refresh upon activity</p>
          </div>
        </div>
      </div>

      {/* Main Section: Session Management Card */}
      <div className="w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div>
          <h2 id="active-sessions-heading" className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
            Active Sessions
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-[65ch] [text-wrap:pretty]">
            Review signed-in devices and remotely end access you no longer recognize.
          </p>
        </div>

        {sessionsQuery.isError && (
          <div role="alert" className="rounded-lg border border-[#FECDCA] bg-[#FEF3F2] p-4 text-xs sm:text-sm font-medium text-[#D92D20]">
            We could not load your active sessions. Refresh the page to try again.
          </div>
        )}

        {mutationError && (
          <div role="alert" className="rounded-lg border border-[#FECDCA] bg-[#FEF3F2] p-4 text-xs sm:text-sm font-medium text-[#D92D20]">
            {mutationError}
          </div>
        )}

        {/* Inline security notice (no side-tab accent border, no nested card) */}
        <div className="flex items-center gap-2.5 text-xs py-0.5">
          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
          <p className="font-medium text-slate-700 max-w-[65ch] [text-wrap:pretty]">
            If you recognize an unfamiliar session, revoke its access and change your password immediately.
          </p>
        </div>

        {sessionsQuery.isLoading ? (
          <div role="status" aria-live="polite" className="py-12 text-center text-sm text-slate-600">
            Loading active sessions...
          </div>
        ) : sessionsQuery.isError ? null : sessions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center text-sm text-slate-600">
            No active sessions found.
          </div>
        ) : (
          <ul className="space-y-3.5 w-full" aria-label="Active sessions">
            {sessions.map((session) => {
              const lastActiveText = formatSessionLastActive(session.lastActiveAt);
              const fullTimestamp = formatSessionTimestamp(session.lastActiveAt);
              const isThisSessionPending = revokeSession.isPending && revokeSession.variables === session.id;

              return (
                <li
                  key={session.id}
                  className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 lg:p-5 transition-colors hover:border-slate-300 hover:bg-slate-50 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="shrink-0 rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
                      {deviceIcon(session.deviceType)}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-words text-sm font-bold text-slate-900">{session.deviceType}</p>
                        <span className="text-slate-400">•</span>
                        <p className="break-words text-xs font-semibold text-slate-700">{session.browser}</p>
                        {session.isCurrent && (
                          <div
                            role="status"
                            aria-label="Current device status: active"
                            className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800"
                          >
                            <span>Current device</span>
                            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                            <span>Active</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-medium" title={fullTimestamp}>
                        Last active: {lastActiveText}
                      </p>
                      {session.isCurrent && (
                        <p className="text-xs text-slate-600">This is the device you&apos;re currently using.</p>
                      )}
                    </div>
                  </div>

                  {!session.isCurrent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSessionToRevoke(session)}
                      disabled={revokeSession.isPending}
                      isLoading={isThisSessionPending}
                      aria-label={`Remote logout for ${sessionDescription(session)}`}
                      aria-busy={isThisSessionPending}
                      className="shrink-0 border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300"
                    >
                      Remote Logout
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Modal
        isOpen={sessionToRevoke !== null}
        onClose={revokeSession.isPending ? () => undefined : () => setSessionToRevoke(null)}
        title="Remote logout"
        maxWidth="sm"
      >
        <div className="space-y-5">
          <p className="text-sm leading-relaxed text-slate-700">
            {sessionToRevoke
              ? `This will end the ${sessionDescription(sessionToRevoke)}. That device will need to sign in again.`
              : null}
          </p>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setSessionToRevoke(null)} disabled={revokeSession.isPending}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={confirmRevokeSession}
              isLoading={revokeSession.isPending}
              aria-label="Confirm remote logout"
              aria-busy={revokeSession.isPending}
            >
              Remote Logout
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
};

export default ActiveSessionsPage;
