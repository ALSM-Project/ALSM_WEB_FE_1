import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomerChatWidget } from '../CustomerChatWidget';
import { apiClient } from '@/services/api/apiClient';

vi.mock('@/app/providers', () => ({
  useAuth: () => ({
    user: {
      id: 'customer-user-1',
      email: 'customer@alsm.dev',
      fullName: 'John Client',
    },
  }),
}));

vi.mock('@/services/api/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    postForm: vi.fn(),
  },
}));

describe('CustomerChatWidget', () => {
  const mockConversation = {
    id: 'conv-123',
    title: 'Modernization Support - Client Workspace',
    status: 'OPEN',
    channel: 'PORTAL',
    customerName: 'John Client',
    customerEmail: 'customer@alsm.dev',
    companyName: 'Client Workspace',
    lastMessage: 'Hello from ALSM team',
    lastMessageAt: '2026-11-05T09:00:00.000Z',
    customerUnreadCount: 0,
  };

  const mockMessages = [
    {
      id: 'msg-1',
      conversationId: 'conv-123',
      senderUserId: 'sales-1',
      senderName: 'Sales Specialist',
      senderEmail: 'sales@alsm.dev',
      senderRole: 'SALES_REP' as const,
      content: 'Hello John! Welcome to ALSM. How can we help your modernization project?',
      createdAt: '2026-11-05T09:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
      if (url.includes('/crm/conversations/my/active')) {
        return mockConversation;
      }
      if (url.includes('/messages')) {
        return mockMessages;
      }
      return null;
    });
    vi.mocked(apiClient.post).mockImplementation(async (url: string) => {
      if (url.includes('/read')) {
        return { ok: true };
      }
      return {
        id: 'msg-2',
        conversationId: 'conv-123',
        senderUserId: 'customer-user-1',
        senderName: 'John Client',
        senderEmail: 'customer@alsm.dev',
        senderRole: 'CUSTOMER' as const,
        content: 'Can you provide details on COBOL to React migration?',
        createdAt: new Date().toISOString(),
      };
    });
  });

  it('renders floating chat button and toggles open', async () => {
    render(<CustomerChatWidget />);

    const triggerBtn = screen.getByRole('button', { name: /Open support chat/i });
    expect(triggerBtn).toBeInTheDocument();
    expect(screen.getByText('Chat with Team')).toBeInTheDocument();

    fireEvent.click(triggerBtn);

    expect(await screen.findByText('ALSM Team Support')).toBeInTheDocument();
    expect(await screen.findByText(/How can we help your modernization project/i)).toBeInTheDocument();
  });

  it('opens the same chatbox when alsm:open-support-chat event is dispatched and supports minimize/close', async () => {
    render(<CustomerChatWidget />);

    window.dispatchEvent(new CustomEvent('alsm:open-support-chat'));
    expect(await screen.findByRole('dialog', { name: 'ALSM Team Support Chat' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Minimize chat' }));
    expect(screen.getByRole('region', { name: 'Minimized support chat' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Expand support chat' }));
    expect(await screen.findByRole('dialog', { name: 'ALSM Team Support Chat' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close chat' }));
    expect(screen.getByRole('button', { name: /Open support chat/i })).toBeInTheDocument();
  });

  it('allows customer to compose and send message in real time', async () => {
    render(<CustomerChatWidget />);

    fireEvent.click(screen.getByRole('button', { name: /Open support chat/i }));
    await screen.findByText('ALSM Team Support');

    const input = screen.getByPlaceholderText(/Ask a question or send a message/i);
    fireEvent.change(input, { target: { value: 'Can you provide details on COBOL to React migration?' } });

    const sendBtn = screen.getByTitle('Send message');
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/crm/conversations/conv-123/messages',
        expect.objectContaining({
          content: 'Can you provide details on COBOL to React migration?',
          isInternal: false,
        }),
      );
    });

    expect(await screen.findByText('Can you provide details on COBOL to React migration?')).toBeInTheDocument();
  });

  it('shows an error alert when loading conversation fails', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('network down'));

    render(<CustomerChatWidget />);
    fireEvent.click(screen.getByRole('button', { name: /Open support chat/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load support conversation.');
  });
});
