import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Globe,
  Loader2,
  RefreshCw,
  User,
  Users,
  Video,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Card } from '@/shared/ui/Card';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';
import {
  customerMeetingsService,
  type CustomerMeetingCategoryStatus,
  type CustomerMeetingItem,
} from '../services/meetings.service';

type MeetingFilter = 'ALL' | CustomerMeetingCategoryStatus;

const FILTER_TABS: Array<{ key: MeetingFilter; label: string }> = [
  { key: 'ALL', label: 'All Meetings' },
  { key: 'UPCOMING', label: 'Upcoming' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_BADGE_CONFIG: Record<
  CustomerMeetingCategoryStatus,
  { label: string; variant: 'info' | 'success' | 'danger' }
> = {
  UPCOMING: { label: 'Upcoming', variant: 'info' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'danger' },
};

function formatMeetingDate(iso: string, timeZone?: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: timeZone || undefined,
    });
  } catch {
    return iso;
  }
}

function formatMeetingTime(iso: string, timeZone?: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timeZone || undefined,
    });
  } catch {
    return '';
  }
}

export const MeetingSchedulerPage: React.FC = () => {
  const [meetings, setMeetings] = useState<CustomerMeetingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<MeetingFilter>('ALL');
  const [selectedMeeting, setSelectedMeeting] = useState<CustomerMeetingItem | null>(null);

  const loadMeetings = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await customerMeetingsService.listMyMeetings();
      setMeetings(data);
    } catch {
      setErrorMsg('We could not load your scheduled meetings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMeetings();
  }, [loadMeetings]);

  const counts = useMemo(() => {
    return {
      UPCOMING: meetings.filter((m) => m.status === 'UPCOMING').length,
      COMPLETED: meetings.filter((m) => m.status === 'COMPLETED').length,
      CANCELLED: meetings.filter((m) => m.status === 'CANCELLED').length,
    };
  }, [meetings]);

  const filteredMeetings = useMemo(() => {
    if (activeFilter === 'ALL') return meetings;
    return meetings.filter((m) => m.status === activeFilter);
  }, [meetings, activeFilter]);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Meeting Scheduler"
          subtitle="View meetings scheduled with you by ALSM specialists, inspect agendas, and join via Google Meet."
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void loadMeetings()}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start sm:self-auto shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Three Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        <Card className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Upcoming Meetings
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              {loading ? '...' : counts.UPCOMING}
            </p>
          </div>
        </Card>

        <Card className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Completed Meetings
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              {loading ? '...' : counts.COMPLETED}
            </p>
          </div>
        </Card>

        <Card className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Cancelled Meetings
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              {loading ? '...' : counts.CANCELLED}
            </p>
          </div>
        </Card>
      </div>

      {/* Main Meetings Card */}
      <Card className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Filter Tabs */}
        <div
          role="tablist"
          aria-label="Filter meetings by status"
          className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4"
        >
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveFilter(tab.key)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#244A70] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Error State */}
        {errorMsg && (
          <div
            role="alert"
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-[#FECDCA] bg-[#FEF3F2] p-4 text-xs sm:text-sm font-medium text-[#D92D20]"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => void loadMeetings()}>
              Retry
            </Button>
          </div>
        )}

        {/* Loading / Empty / List */}
        {loading ? (
          <div
            role="status"
            aria-live="polite"
            className="py-12 flex flex-col items-center justify-center gap-2.5 text-sm text-slate-600"
          >
            <Loader2 className="w-5 h-5 animate-spin text-[#244A70]" />
            <span>Loading your scheduled meetings...</span>
          </div>
        ) : errorMsg ? null : filteredMeetings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center space-y-1.5">
            <p className="text-sm font-semibold text-slate-800">No meetings found</p>
            <p className="text-xs text-slate-600">
              {activeFilter === 'ALL'
                ? 'Meetings scheduled with you by ALSM specialists will appear here.'
                : `You have no ${activeFilter.toLowerCase()} meetings.`}
            </p>
          </div>
        ) : (
          <ul className="space-y-4" aria-label="Scheduled meetings">
            {filteredMeetings.map((meeting) => {
              const badge = STATUS_BADGE_CONFIG[meeting.status];
              const dateText = formatMeetingDate(meeting.scheduledStartTime, meeting.timezone);
              const startText = formatMeetingTime(meeting.scheduledStartTime, meeting.timezone);
              const endText = formatMeetingTime(meeting.scheduledEndTime, meeting.timezone);
              const canJoin = meeting.status === 'UPCOMING' && Boolean(meeting.meetingUrl);

              return (
                <li
                  key={meeting.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-2.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 break-words">
                        {meeting.title}
                      </h3>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>

                    <p className="text-xs font-medium text-slate-600">
                      Purpose: <span className="text-slate-800 font-semibold">{meeting.purpose}</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-700">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#244A70]" />
                        <span>{dateText}</span>
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#244A70]" />
                        <span>
                          {startText} – {endText}
                        </span>
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-[#244A70]" />
                        <span>{meeting.timezone}</span>
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#244A70]" />
                        <span>Organizer: {meeting.organizerName}</span>
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-[#244A70]" />
                        <span>{meeting.platform}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedMeeting(meeting)}
                      className="inline-flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Details</span>
                    </Button>

                    {canJoin && meeting.meetingUrl && (
                      <a
                        href={meeting.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#244A70] hover:bg-[#1B3856] text-white text-xs font-semibold shadow-2xs transition-colors"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Join Meeting</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Meeting Details Modal */}
      <Modal
        isOpen={selectedMeeting !== null}
        onClose={() => setSelectedMeeting(null)}
        title={selectedMeeting?.title || 'Meeting Details'}
        maxWidth="lg"
      >
        {selectedMeeting && (
          <div className="space-y-5 text-xs sm:text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
              <span className="font-semibold text-slate-700">{selectedMeeting.purpose}</span>
              <Badge variant={STATUS_BADGE_CONFIG[selectedMeeting.status].variant}>
                {STATUS_BADGE_CONFIG[selectedMeeting.status].label}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Scheduled Time
                </p>
                <p className="text-slate-900 font-medium">
                  {formatMeetingDate(selectedMeeting.scheduledStartTime, selectedMeeting.timezone)}
                </p>
                <p className="text-slate-700">
                  {formatMeetingTime(selectedMeeting.scheduledStartTime, selectedMeeting.timezone)} –{' '}
                  {formatMeetingTime(selectedMeeting.scheduledEndTime, selectedMeeting.timezone)} (
                  {selectedMeeting.timezone})
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Organizer &amp; Platform
                </p>
                <p className="text-slate-900 font-medium">
                  {selectedMeeting.organizerName} ({selectedMeeting.organizerEmail})
                </p>
                <p className="text-slate-700">{selectedMeeting.platform}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Agenda
              </p>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-slate-800 whitespace-pre-wrap leading-relaxed">
                {selectedMeeting.agenda}
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 inline-flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Participants ({selectedMeeting.participants.length})</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedMeeting.participants.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700"
                  >
                    {email}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Meeting Link
              </p>
              {selectedMeeting.meetingUrl ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <a
                    href={selectedMeeting.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-[#244A70] hover:underline break-all"
                  >
                    {selectedMeeting.meetingUrl}
                  </a>
                  {selectedMeeting.status === 'UPCOMING' && (
                    <a
                      href={selectedMeeting.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#244A70] hover:bg-[#1B3856] text-white text-xs font-semibold shrink-0"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Meeting</span>
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Meeting link is not available for this session.
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <Button type="button" variant="secondary" onClick={() => setSelectedMeeting(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MeetingSchedulerPage;
