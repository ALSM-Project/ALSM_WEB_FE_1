import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Laptop,
  Monitor,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Tablet,
  X,
} from 'lucide-react';
import type { ActiveSession } from '../types/account';
import { useActiveSessions } from '../queries/useActiveSessions';
import { useRevokeSession } from '../queries/useRevokeSession';
import { useRevokeAllOtherSessions } from '../queries/useRevokeAllOtherSessions';
import { formatSessionLastActive, formatSessionTimestamp } from '../utils/sessionDate';
import { useAuth } from '@/app/providers';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';

type RevokeConfirmation =
  | { type: 'single'; session: ActiveSession }
  | { type: 'all' }
  | null;

type SessionNotification = {
  type: 'success' | 'error';
  message: string;
} | null;

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
  const [revokeConfirmation, setRevokeConfirmation] = useState<RevokeConfirmation>(null);
  const [notification, setNotification] = useState<SessionNotification>(null);

  const sessionsQuery = useActiveSessions(user?.id);
  const revokeSession = useRevokeSession(user?.id);
  const revokeAllOtherSessions = useRevokeAllOtherSessions(user?.id);

  const sessions = sessionsQuery.data ?? [];
  const currentSession = sessions.find((s) => s.isCurrent);
  const remoteSessionsCount = sessions.filter((s) => !s.isCurrent).length;
  const isMutating = revokeSession.isPending || revokeAllOtherSessions.isPending;

  const openRevokeSingleModal = (session: ActiveSession) => {
    setNotification(null);
    setRevokeConfirmation({ type: 'single', session });
  };

  const openRevokeAllModal = () => {
    setNotification(null);
    setRevokeConfirmation({ type: 'all' });
  };

  const closeModal = () => {
    if (isMutating) return;
    setRevokeConfirmation(null);
  };

  const confirmRevoke = () => {
    if (!revokeConfirmation || isMutating) return;

    if (revokeConfirmation.type === 'single') {
      const targetSession = revokeConfirmation.session;
      revokeSession.mutate(targetSession.id, {
        onSuccess: () => {
          setRevokeConfirmation(null);
          setNotification({
            type: 'success',
            message: `Session revoked for ${sessionDescription(targetSession)}.`,
          });
        },
        onError: () => {
          setRevokeConfirmation(null);
          setNotification({
            type: 'error',
            message: 'We could not revoke that session. Please try again.',
          });
        },
      });
      return;
    }

    revokeAllOtherSessions.mutate(undefined, {
      onSuccess: () => {
        setRevokeConfirmation(null);
        setNotification({
          type: 'success',
          message: 'All other active sessions have been revoked.',
        });
      },
      onError: () => {
        setRevokeConfirmation(null);
        setNotification({
          type: 'error',
          message: 'We could not revoke your other sessions. Please try again.',
        });
      },
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="active-sessions-heading" className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              Active Sessions
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-[65ch] [text-wrap:pretty]">
              Review signed-in devices and remotely end access you no longer recognize.
            </p>
          </div>

          {remoteSessionsCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={openRevokeAllModal}
              disabled={isMutating}
              isLoading={revokeAllOtherSessions.isPending}
              aria-label="Revoke all other sessions"
              aria-busy={revokeAllOtherSessions.isPending}
              className="shrink-0 self-start sm:self-auto border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300"
            >
              Revoke All Other Sessions
            </Button>
          )}
        </div>

        {sessionsQuery.isError && (
          <div role="alert" className="rounded-lg border border-[#FECDCA] bg-[#FEF3F2] p-4 text-xs sm:text-sm font-medium text-[#D92D20]">
            We could not load your active sessions. Refresh the page to try again.
          </div>
        )}

        {notification && (
          <div
            role={notification.type === 'success' ? 'status' : 'alert'}
            aria-live={notification.type === 'success' ? 'polite' : 'assertive'}
            className={`flex items-center justify-between gap-3 rounded-lg border p-4 text-xs sm:text-sm font-medium ${
              notification.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-[#FECDCA] bg-[#FEF3F2] text-[#D92D20]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {notification.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-[#D92D20]" aria-hidden="true" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              aria-label="Dismiss notification"
              className="rounded p-1 transition-colors hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-current shrink-0"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
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
          <div className="space-y-4">
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
                        onClick={() => openRevokeSingleModal(session)}
                        disabled={isMutating}
                        isLoading={isThisSessionPending}
                        aria-label={`Revoke ${sessionDescription(session)}`}
                        aria-busy={isThisSessionPending}
                        className="shrink-0 border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300"
                      >
                        Revoke
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>

            {remoteSessionsCount === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
                <p className="text-sm font-semibold text-slate-800">No other active sessions</p>
                <p className="mt-1 text-xs text-slate-600">
                  You&apos;re only signed in on this device. Any other devices where you sign in will appear here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={revokeConfirmation !== null}
        onClose={closeModal}
        title={revokeConfirmation?.type === 'all' ? 'Revoke all other sessions' : 'Revoke session'}
        maxWidth="sm"
      >
        <div className="space-y-5">
          <p className="text-sm leading-relaxed text-slate-700">
            {revokeConfirmation?.type === 'single'
              ? `This will end the ${sessionDescription(revokeConfirmation.session)}. That device will need to sign in again.`
              : revokeConfirmation?.type === 'all'
                ? `This will end all ${remoteSessionsCount} other active session${remoteSessionsCount === 1 ? '' : 's'}. Those devices will need to sign in again.`
                : null}
          </p>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={closeModal} disabled={isMutating}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={confirmRevoke}
              isLoading={isMutating}
              aria-label={
                revokeConfirmation?.type === 'all'
                  ? 'Confirm revoke all other sessions'
                  : 'Confirm revoke session'
              }
              aria-busy={isMutating}
            >
              {revokeConfirmation?.type === 'all' ? 'Revoke All Other Sessions' : 'Revoke'}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
};

export default ActiveSessionsPage;
