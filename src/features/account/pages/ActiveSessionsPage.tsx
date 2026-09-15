import React, { useState } from 'react';
import { Laptop, Monitor, ShieldAlert, Smartphone, Tablet } from 'lucide-react';
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

  const confirmRevokeSession = () => {
    if (!sessionToRevoke || revokeSession.isPending) return;

    revokeSession.mutate(sessionToRevoke.id, {
      onSuccess: () => setSessionToRevoke(null),
    });
  };

  return (
    <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="active-sessions-heading">
      <div>
        <h2 id="active-sessions-heading" className="text-xl font-bold tracking-tight text-slate-900">
          Active Sessions
        </h2>
        <p className="mt-1 text-sm text-slate-500">Review signed-in devices and remotely end access you no longer recognize.</p>
      </div>

      {sessionsQuery.isError && (
        <div role="alert" className="rounded-lg border border-[#FECDCA] bg-[#FEF3F2] p-4 text-sm font-medium text-[#D92D20]">
          We could not load your active sessions. Refresh the page to try again.
        </div>
      )}

      {mutationError && (
        <div role="alert" className="rounded-lg border border-[#FECDCA] bg-[#FEF3F2] p-4 text-sm font-medium text-[#D92D20]">
          {mutationError}
        </div>
      )}

      <div className="flex items-start gap-3 rounded-xl border border-[#FEDF89] bg-[#FFFAEB] p-4 text-xs text-[#DC6803]">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p className="leading-relaxed font-medium">
          If you recognize an unfamiliar session, revoke its access and change your password immediately.
        </p>
      </div>

      {sessionsQuery.isLoading ? (
        <div role="status" aria-live="polite" className="py-8 text-center text-sm text-slate-500">
          Loading active sessions...
        </div>
      ) : sessionsQuery.isError ? null : sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          No active sessions found.
        </div>
      ) : (
        <ul className="space-y-3" aria-label="Active sessions">
          {sessions.map((session) => {
            const lastActiveText = formatSessionLastActive(session.lastActiveAt);
            const fullTimestamp = formatSessionTimestamp(session.lastActiveAt);
            const isThisSessionPending = revokeSession.isPending && revokeSession.variables === session.id;

            return (
              <li
                key={session.id}
                className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-slate-300 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 items-start gap-3.5">
                  <div className="shrink-0 rounded-lg border border-slate-200 bg-white p-2.5 shadow-xs">
                    {deviceIcon(session.deviceType)}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="break-words text-sm font-semibold text-slate-900">{session.deviceType}</p>
                    <p className="break-words text-xs text-slate-600">{session.browser}</p>
                    {session.isCurrent && (
                      <div
                        role="status"
                        aria-label="Current device status: active"
                        className="flex w-fit items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800"
                      >
                        <span>Current device</span>
                        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                        <span>Active</span>
                      </div>
                    )}
                    <p className="text-xs text-slate-500" title={fullTimestamp}>
                      Last active: {lastActiveText}
                    </p>
                    {session.isCurrent && (
                      <p className="text-xs text-slate-500">This is the device you&apos;re currently using.</p>
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
                    className="shrink-0 border-rose-200 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    Remote Logout
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        isOpen={sessionToRevoke !== null}
        onClose={revokeSession.isPending ? () => undefined : () => setSessionToRevoke(null)}
        title="Remote logout"
        maxWidth="sm"
      >
        <div className="space-y-5">
          <p className="text-sm leading-relaxed text-slate-600">
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
