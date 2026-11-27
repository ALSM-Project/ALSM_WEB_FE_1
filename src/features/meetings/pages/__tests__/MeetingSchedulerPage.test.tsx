import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MeetingSchedulerPage } from '../MeetingSchedulerPage';
import { customerMeetingsService, type CustomerMeetingItem } from '../../services/meetings.service';

vi.mock('../../services/meetings.service', () => ({
  customerMeetingsService: {
    listMyMeetings: vi.fn(),
    getMyMeetingById: vi.fn(),
  },
}));

describe('MeetingSchedulerPage', () => {
  const mockMeetings: CustomerMeetingItem[] = [
    {
      id: 'meeting:1',
      source: 'MEETING',
      title: 'COBOL Modernization Architecture Review',
      purpose: 'Consultation & Project Sync',
      agenda: '1. Review BMS screens\n2. Confirm target React architecture',
      scheduledStartTime: '2026-12-01T09:00:00.000Z',
      scheduledEndTime: '2026-12-01T10:00:00.000Z',
      timezone: 'Asia/Ho_Chi_Minh',
      organizerName: 'Alice Staff',
      organizerEmail: 'alice@alsm.io',
      platform: 'Google Meet',
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      participants: ['customer@alsm.dev', 'alice@alsm.io'],
      status: 'UPCOMING',
      rawStatus: 'SCHEDULED',
    },
    {
      id: 'meeting:2',
      source: 'MEETING_REQUEST',
      title: 'Initial Discovery Session',
      purpose: 'SALES SERVICE',
      agenda: 'Initial project scoping',
      scheduledStartTime: '2026-11-10T08:00:00.000Z',
      scheduledEndTime: '2026-11-10T08:45:00.000Z',
      timezone: 'Asia/Ho_Chi_Minh',
      organizerName: 'Bob Sales',
      organizerEmail: 'bob@alsm.io',
      platform: 'Google Meet',
      participants: ['customer@alsm.dev', 'bob@alsm.io'],
      status: 'COMPLETED',
      rawStatus: 'COMPLETED',
    },
    {
      id: 'meeting:3',
      source: 'LEAD_DEMO',
      title: 'Cancelled Follow-up Demo',
      purpose: 'Product Demo',
      agenda: 'Cancelled by organizer',
      scheduledStartTime: '2026-11-15T14:00:00.000Z',
      scheduledEndTime: '2026-11-15T14:45:00.000Z',
      timezone: 'Asia/Ho_Chi_Minh',
      organizerName: 'Bob Sales',
      organizerEmail: 'bob@alsm.io',
      platform: 'Google Meet',
      participants: ['customer@alsm.dev'],
      status: 'CANCELLED',
      rawStatus: 'CANCELLED',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(customerMeetingsService.listMyMeetings).mockResolvedValue(mockMeetings);
  });

  it('renders summary cards, meetings list, and read-only actions', async () => {
    render(<MeetingSchedulerPage />);

    expect(await screen.findByText('COBOL Modernization Architecture Review')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Meetings')).toBeInTheDocument();
    expect(screen.getByText('Completed Meetings')).toBeInTheDocument();
    expect(screen.getByText('Cancelled Meetings')).toBeInTheDocument();

    // Join Meeting button only appears for upcoming meetings with meetingUrl
    const joinLinks = screen.getAllByRole('link', { name: /Join Meeting/i });
    expect(joinLinks).toHaveLength(1);
    expect(joinLinks[0]).toHaveAttribute('href', 'https://meet.google.com/abc-defg-hij');

    // Customers must not have edit/cancel/delete buttons
    expect(screen.queryByRole('button', { name: /Cancel Meeting/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Edit Meeting/i })).not.toBeInTheDocument();
  });

  it('filters meetings by status tab', async () => {
    render(<MeetingSchedulerPage />);
    await screen.findByText('COBOL Modernization Architecture Review');

    fireEvent.click(screen.getByRole('tab', { name: 'Completed' }));
    expect(screen.getByText('Initial Discovery Session')).toBeInTheDocument();
    expect(screen.queryByText('COBOL Modernization Architecture Review')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Cancelled' }));
    expect(screen.getByText('Cancelled Follow-up Demo')).toBeInTheDocument();
    expect(screen.queryByText('Initial Discovery Session')).not.toBeInTheDocument();
  });

  it('opens Meeting Details modal with agenda, organizer, participants, and link', async () => {
    render(<MeetingSchedulerPage />);
    await screen.findByText('COBOL Modernization Architecture Review');

    const viewButtons = screen.getAllByRole('button', { name: /View Details/i });
    fireEvent.click(viewButtons[0]);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('1. Review BMS screens');
    expect(dialog).toHaveTextContent('alice@alsm.io');
    expect(dialog).toHaveTextContent('customer@alsm.dev');
    expect(dialog).toHaveTextContent('https://meet.google.com/abc-defg-hij');
  });

  it('shows error state and retries loading', async () => {
    vi.mocked(customerMeetingsService.listMyMeetings).mockRejectedValueOnce(new Error('network error'));

    render(<MeetingSchedulerPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('We could not load your scheduled meetings.');

    vi.mocked(customerMeetingsService.listMyMeetings).mockResolvedValueOnce(mockMeetings);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('COBOL Modernization Architecture Review')).toBeInTheDocument();
  });
});
