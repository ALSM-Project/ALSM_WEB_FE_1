import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeedbackPage } from '../FeedbackPage';
import { feedbackService } from '../../services/feedback.service';

vi.mock('../../services/feedback.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/feedback.service')>();
  return {
    ...actual,
    feedbackService: {
      submitFeedback: vi.fn(),
      listMyFeedback: vi.fn(),
    },
  };
});

vi.mock('@/features/chat/supportAttachment.service', () => ({
  uploadSupportAttachment: vi.fn(),
  formatFileSize: (b?: number) => (b ? `${b} B` : ''),
  resolveAttachmentUrl: (u?: string) => u || '#',
}));

describe('FeedbackPage', () => {
  const existingFeedback = [
    {
      id: 'fb-1',
      userId: 'user-1',
      userEmail: 'user@alsm.dev',
      userName: 'Test User',
      rating: 4,
      category: 'Conversion Quality' as const,
      description: 'BMS screen parsing worked well.',
      attachments: [],
      status: 'IN_REVIEW' as const,
      createdAt: '2026-11-20T10:00:00.000Z',
      updatedAt: '2026-11-20T10:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(feedbackService.listMyFeedback).mockResolvedValue(existingFeedback);
    vi.mocked(feedbackService.submitFeedback).mockResolvedValue({
      id: 'fb-2',
      userId: 'user-1',
      userEmail: 'user@alsm.dev',
      userName: 'Test User',
      rating: 5,
      category: 'User Interface',
      description: 'Very clean workspace!',
      attachments: [],
      status: 'SUBMITTED',
      createdAt: '2026-11-26T10:00:00.000Z',
      updatedAt: '2026-11-26T10:00:00.000Z',
    });
  });

  it('loads and displays user feedback history with status', async () => {
    render(<FeedbackPage />);

    expect(await screen.findByText('BMS screen parsing worked well.')).toBeInTheDocument();
    expect(screen.getByText('In Review')).toBeInTheDocument();
  });

  it('validates rating and description, then submits feedback and shows confirmation', async () => {
    render(<FeedbackPage />);
    await screen.findByText('BMS screen parsing worked well.');

    fireEvent.click(screen.getByRole('button', { name: /Submit Feedback/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Please select a star rating from 1 to 5.');

    fireEvent.click(screen.getByRole('radio', { name: /5 stars/i }));
    fireEvent.change(screen.getByLabelText(/Feedback Category/i), { target: { value: 'User Interface' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Very clean workspace!' } });

    fireEvent.click(screen.getByRole('button', { name: /Submit Feedback/i }));

    await waitFor(() => {
      expect(feedbackService.submitFeedback).toHaveBeenCalledWith({
        rating: 5,
        category: 'User Interface',
        description: 'Very clean workspace!',
        attachments: [],
      });
    });

    expect(await screen.findByRole('status')).toHaveTextContent('Thank you! Your feedback has been submitted');
    expect(screen.getByText('Very clean workspace!')).toBeInTheDocument();
  });

  it('resets form fields when Reset is clicked', async () => {
    render(<FeedbackPage />);
    await screen.findByText('BMS screen parsing worked well.');

    fireEvent.click(screen.getByRole('radio', { name: /4 stars/i }));
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Draft text' } });

    fireEvent.click(screen.getByRole('button', { name: /Reset/i }));

    expect(screen.getByLabelText(/Description/i)).toHaveValue('');
    expect(screen.getByRole('radio', { name: /4 stars/i })).toHaveAttribute('aria-checked', 'false');
  });
});
