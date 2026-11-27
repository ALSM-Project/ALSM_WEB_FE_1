import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Minus,
  Maximize2,
  Send,
  Headphones,
  Loader2,
  Bot,
  UserCheck,
  CheckCheck,
  GripVertical,
  Paperclip,
  FileText,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/app/providers';
import { apiClient } from '@/services/api/apiClient';
import {
  formatFileSize,
  resolveAttachmentUrl,
  uploadSupportAttachment,
  type SupportAttachmentItem,
} from './supportAttachment.service';

export interface ChatMessageItem {
  id: string;
  conversationId: string;
  senderUserId?: string;
  senderName: string;
  senderEmail: string;
  senderRole: 'CUSTOMER' | 'SALES_REP' | 'STAFF' | 'SYSTEM';
  content: string;
  isInternal?: boolean;
  attachments?: SupportAttachmentItem[];
  createdAt: string;
}

export interface ChatConversationItem {
  id: string;
  title: string;
  status: string;
  channel: string;
  customerName: string;
  customerEmail: string;
  companyName?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  customerUnreadCount?: number;
}

const CONVERSATION_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  OPEN: { label: 'Open', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-amber-50 text-amber-800 border-amber-200' },
  WAITING_ON_CUSTOMER: { label: 'Waiting on You', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  CLOSED: { label: 'Closed', className: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export const CustomerChatWidget: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversation, setConversation] = useState<ChatConversationItem | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<SupportAttachmentItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Draggable Floating Action Button State ---
  const [btnPos, setBtnPos] = useState<{ x: number; y: number } | null>(null);
  const [isBtnDragging, setIsBtnDragging] = useState(false);
  const btnDragRef = useRef<{ startX: number; startY: number; initX: number; initY: number; moved: boolean }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
    moved: false,
  });

  // --- Draggable Chat Window Modal State ---
  const [modalPos, setModalPos] = useState<{ x: number; y: number } | null>(null);
  const [isModalDragging, setIsModalDragging] = useState(false);
  const modalDragRef = useRef<{ startX: number; startY: number; initX: number; initY: number; moved: boolean }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
    moved: false,
  });

  const markConversationRead = useCallback(async (convId: string) => {
    setUnreadCount(0);
    try {
      await apiClient.post(`/crm/conversations/${convId}/read`, {});
    } catch {
      // Non-blocking read sync
    }
  }, []);

  // Initialize or fetch the customer's active conversation
  const loadConversationAndMessages = useCallback(
    async (options?: { markRead?: boolean }) => {
      if (!user?.email) return;
      try {
        setLoading(true);
        setErrorMsg(null);
        const conv = await apiClient.get<ChatConversationItem>('/crm/conversations/my/active');
        setConversation(conv);

        const msgs = await apiClient.get<ChatMessageItem[]>(`/crm/conversations/${conv.id}/messages`);
        setMessages(msgs || []);

        if (options?.markRead) {
          await markConversationRead(conv.id);
        } else if (typeof conv.customerUnreadCount === 'number') {
          setUnreadCount(conv.customerUnreadCount);
        }
      } catch (err) {
        console.error('Failed to load active customer conversation:', err);
        setErrorMsg('Unable to load support conversation. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [user?.email, markConversationRead],
  );

  // Fetch initial unread status on mount when authenticated (skip in test mode unless opened)
  useEffect(() => {
    if (!user?.email) return;
    if ((import.meta as any).env?.MODE === 'test') return;
    let cancelled = false;
    (async () => {
      try {
        const conv = await apiClient.get<ChatConversationItem>('/crm/conversations/my/active');
        if (!cancelled && conv) {
          setConversation(conv);
          setUnreadCount(conv.customerUnreadCount ?? 0);
        }
      } catch {
        // Ignore silent background check error
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  // Draggable Floating Button Handlers (Mouse & Touch)
  const handleBtnMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const btnElem = e.currentTarget as HTMLElement;
    const rect = btnElem.getBoundingClientRect();

    btnDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: rect.left,
      initY: rect.top,
      moved: false,
    };
    setIsBtnDragging(true);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - btnDragRef.current.startX;
      const dy = moveEvent.clientY - btnDragRef.current.startY;
      if (Math.hypot(dx, dy) > 5) {
        btnDragRef.current.moved = true;
      }
      const maxX = window.innerWidth - rect.width - 10;
      const maxY = window.innerHeight - rect.height - 10;
      const newX = Math.max(10, Math.min(maxX, btnDragRef.current.initX + dx));
      const newY = Math.max(10, Math.min(maxY, btnDragRef.current.initY + dy));
      setBtnPos({ x: newX, y: newY });
    };

    const onMouseUp = () => {
      setIsBtnDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleBtnTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const btnElem = e.currentTarget as HTMLElement;
    const rect = btnElem.getBoundingClientRect();

    btnDragRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initX: rect.left,
      initY: rect.top,
      moved: false,
    };
    setIsBtnDragging(true);

    const onTouchMove = (moveEvent: TouchEvent) => {
      const t = moveEvent.touches[0];
      const dx = t.clientX - btnDragRef.current.startX;
      const dy = t.clientY - btnDragRef.current.startY;
      if (Math.hypot(dx, dy) > 5) {
        btnDragRef.current.moved = true;
      }
      const maxX = window.innerWidth - rect.width - 10;
      const maxY = window.innerHeight - rect.height - 10;
      const newX = Math.max(10, Math.min(maxX, btnDragRef.current.initX + dx));
      const newY = Math.max(10, Math.min(maxY, btnDragRef.current.initY + dy));
      setBtnPos({ x: newX, y: newY });
    };

    const onTouchEnd = () => {
      setIsBtnDragging(false);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };

    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
  };

  const openChatWidget = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnreadCount(0);
    void loadConversationAndMessages({ markRead: true });
    setTimeout(() => textareaRef.current?.focus(), 150);
  }, [loadConversationAndMessages]);

  const handleBtnClick = () => {
    if (btnDragRef.current.moved) {
      btnDragRef.current.moved = false;
      return;
    }
    openChatWidget();
  };

  // Draggable Modal Header Handlers (Desktop)
  const handleModalHeaderMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button')) return;

    const modalElem = (e.currentTarget as HTMLElement).closest('aside');
    if (!modalElem) return;
    const rect = modalElem.getBoundingClientRect();

    modalDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: rect.left,
      initY: rect.top,
      moved: false,
    };
    setIsModalDragging(true);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - modalDragRef.current.startX;
      const dy = moveEvent.clientY - modalDragRef.current.startY;
      if (Math.hypot(dx, dy) > 5) {
        modalDragRef.current.moved = true;
      }
      const modalWidth = rect.width || 420;
      const modalHeight = rect.height || 580;
      const maxX = window.innerWidth - modalWidth - 10;
      const maxY = window.innerHeight - modalHeight - 10;
      const newX = Math.max(10, Math.min(maxX, modalDragRef.current.initX + dx));
      const newY = Math.max(10, Math.min(maxY, modalDragRef.current.initY + dy));
      setModalPos({ x: newX, y: newY });
    };

    const onMouseUp = () => {
      setIsModalDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Support global open request (from Collaboration -> Support Center sidebar or Contact page CTA)
  useEffect(() => {
    const handleOpenChat = () => {
      openChatWidget();
    };
    window.addEventListener('alsm:open-support-chat', handleOpenChat);
    return () => window.removeEventListener('alsm:open-support-chat', handleOpenChat);
  }, [openChatWidget]);

  // Connect WebSocket when conversation is loaded
  useEffect(() => {
    if (!conversation?.id || !user?.email) return;
    if (typeof window === 'undefined' || typeof WebSocket === 'undefined' || (import.meta as any).env?.MODE === 'test') {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname || 'localhost';
    const wsUrl = `${protocol}//${host}:3000/ws/crm-chat`;

    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let isDisposed = false;

    const connect = () => {
      if (isDisposed) return;
      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsLiveConnected(true);
          ws?.send(
            JSON.stringify({
              type: 'JOIN',
              role: 'CUSTOMER',
              userId: user?.id,
              userEmail: user?.email,
              userName: user?.fullName || user?.email?.split('@')[0],
              conversationId: conversation.id,
            }),
          );
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'NEW_MESSAGE' && data.message) {
              const msg: ChatMessageItem = data.message;
              if (data.conversationId === conversation.id && !msg.isInternal) {
                setMessages((prev) => {
                  if (prev.some((m) => m.id === msg.id)) return prev;
                  return [...prev, msg];
                });

                if ((!isOpen || isMinimized) && msg.senderRole !== 'CUSTOMER') {
                  setUnreadCount((c) => c + 1);
                } else if (isOpen && !isMinimized && msg.senderRole !== 'CUSTOMER') {
                  void markConversationRead(conversation.id);
                }
              }
            } else if (data.type === 'CONVERSATION_UPDATED' && data.conversation?.id === conversation.id) {
              setConversation((prev) => (prev ? { ...prev, status: data.conversation.status } : data.conversation));
            }
          } catch (e) {
            console.error('Failed to parse incoming WS message:', e);
          }
        };

        ws.onclose = () => {
          setIsLiveConnected(false);
          wsRef.current = null;
          if (!isDisposed) {
            reconnectTimeout = setTimeout(connect, 3000);
          }
        };

        ws.onerror = () => {
          setIsLiveConnected(false);
        };
      } catch {
        setIsLiveConnected(false);
      }
    };

    connect();

    return () => {
      isDisposed = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
      wsRef.current = null;
    };
  }, [conversation?.id, user?.id, user?.email, user?.fullName, isOpen, isMinimized, markConversationRead]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && !isMinimized && typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, sending, isOpen, isMinimized]);

  // Auto-resize textarea according to content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
    }
  }, [inputText]);

  // Handle Escape key to close dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setIsMinimized(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setErrorMsg(null);
      const uploaded = await uploadSupportAttachment(file);
      setPendingAttachments((prev) => [...prev, uploaded]);
    } catch {
      setErrorMsg('Failed to upload attachment. Check file type and size (max 10 MB).');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const trimmed = (textToSend ?? inputText).trim();
    if ((!trimmed && pendingAttachments.length === 0) || sending || uploading) return;

    const content = trimmed || `Sent ${pendingAttachments.length} attachment${pendingAttachments.length === 1 ? '' : 's'}`;
    const attachmentsToSend = [...pendingAttachments];
    let activeConv = conversation;

    try {
      setSending(true);
      setErrorMsg(null);
      if (!textToSend) setInputText('');
      setPendingAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      if (!activeConv) {
        activeConv = await apiClient.get<ChatConversationItem>('/crm/conversations/my/active');
        setConversation(activeConv);
      }

      const posted = await apiClient.post<ChatMessageItem>(
        `/crm/conversations/${activeConv.id}/messages`,
        {
          content,
          isInternal: false,
          attachments: attachmentsToSend,
        },
      );

      setMessages((prev) => {
        if (prev.some((m) => m.id === posted.id)) return prev;
        return [...prev, posted];
      });
    } catch (err) {
      console.error('Failed to send customer chat message:', err);
      setErrorMsg('Failed to send your message. Please try again.');
      if (!textToSend) setInputText(trimmed);
      setPendingAttachments(attachmentsToSend);
    } finally {
      setSending(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  const formatSenderDisplay = (m: ChatMessageItem) => {
    if (m.senderRole === 'CUSTOMER') return 'You';
    if (m.senderName && m.senderName.includes('@')) {
      return 'ALSM Support Specialist';
    }
    return m.senderName || 'ALSM Support Specialist';
  };

  const formatMessageTime = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return '';
    }
  };

  const formatDateHeader = (dateStr: string) => {
    if (!dateStr) return 'Today';
    try {
      const msgDate = new Date(dateStr);
      const today = new Date();
      if (msgDate.toDateString() === today.toDateString()) {
        return 'Today';
      }
      return msgDate.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: msgDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    } catch {
      return 'Today';
    }
  };

  if (!user) return null;

  const statusInfo = CONVERSATION_STATUS_LABELS[conversation?.status || 'OPEN'] || CONVERSATION_STATUS_LABELS.OPEN;

  return (
    <>
      {/* Floating Chat Trigger Button — Circular Draggable Floating Action Button (FAB) */}
      <div
        style={
          btnPos
            ? { left: `${btnPos.x}px`, top: `${btnPos.y}px`, bottom: 'auto', right: 'auto' }
            : undefined
        }
        className={`fixed z-40 ${!btnPos ? 'bottom-6 right-6' : ''}`}
      >
        {!isOpen && (
          <button
            onMouseDown={handleBtnMouseDown}
            onTouchStart={handleBtnTouchStart}
            onClick={handleBtnClick}
            aria-label="Open support chat"
            title="Drag to move • Click to chat"
            className={`group relative flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 bg-[#244A70] hover:bg-[#1B3856] active:bg-[#13283E] text-white rounded-full shadow-lg hover:shadow-xl ${
              isBtnDragging ? 'cursor-grabbing scale-105 ring-2 ring-white/50' : 'cursor-grab hover:scale-105'
            } transition-transform duration-150 border border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#244A70]/50 focus-visible:ring-offset-2 select-none touch-none`}
          >
            <span className="hidden sm:inline-flex items-center absolute right-full mr-3 px-3 py-1.5 bg-slate-900/90 backdrop-blur-xs text-white text-xs font-semibold rounded-lg shadow-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap">
              Chat with Team
            </span>

            <Headphones className="w-6 h-6 transition-transform group-hover:scale-110 pointer-events-none" />

            {unreadCount > 0 && (
              <span
                aria-label={`${unreadCount} unread message${unreadCount === 1 ? '' : 's'}`}
                className="absolute -top-1 -left-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[11px] font-bold bg-[#B91C1C] text-white rounded-full shadow-md border-2 border-white pointer-events-none"
              >
                {unreadCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Minimized Compact Bar */}
      {isOpen && isMinimized && (
        <div
          role="region"
          aria-label="Minimized support chat"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-[#14263F] text-white px-4 py-2.5 shadow-xl border border-[#203954]"
        >
          <Headphones className="w-4 h-4 shrink-0" />
          <span className="text-xs font-bold whitespace-nowrap">ALSM Team Support</span>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[11px] font-bold bg-[#B91C1C] text-white rounded-full">
              {unreadCount}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setIsMinimized(false);
              if (conversation?.id) void markConversationRead(conversation.id);
            }}
            aria-label="Expand support chat"
            title="Expand chat"
            className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setIsMinimized(false);
            }}
            aria-label="Close chat"
            title="Close chat"
            className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Chat Window Modal */}
      {isOpen && !isMinimized && (
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="ALSM Team Support Chat"
          style={
            modalPos
              ? { left: `${modalPos.x}px`, top: `${modalPos.y}px`, bottom: 'auto', right: 'auto' }
              : undefined
          }
          className={`fixed inset-0 sm:inset-auto ${
            !modalPos ? 'sm:bottom-6 sm:right-6' : ''
          } z-50 w-full h-full sm:w-[420px] sm:h-[580px] sm:max-h-[calc(100vh-3rem)] bg-white sm:rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-fade-in font-sans`}
        >
          {/* Header */}
          <div
            onMouseDown={handleModalHeaderMouseDown}
            className={`bg-[#14263F] text-white px-4 py-3 flex items-center justify-between border-b border-[#203954] shrink-0 select-none ${
              isModalDragging ? 'cursor-grabbing' : 'sm:cursor-grab'
            }`}
            title="Drag title bar to move chat window"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <GripVertical className="w-4 h-4 text-slate-400 hidden sm:block shrink-0" />
              <div className="w-8 h-8 rounded-lg bg-[#203954] flex items-center justify-center text-white shrink-0">
                <Headphones className="w-4 h-4" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-white tracking-tight truncate">ALSM Team Support</h3>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-blue-100 mt-0.5">
                  <span className="truncate">
                    {isLiveConnected ? 'Live updates connected' : 'Support conversation'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-400"
                title="Minimize chat"
                aria-label="Minimize chat"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsMinimized(false);
                }}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-400"
                title="Close chat"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Subheader: Conversation Status */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-700 shrink-0">
            <span className="font-semibold text-slate-800 truncate">
              {conversation?.title || 'Support Center'}
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold shrink-0 ${statusInfo.className}`}
            >
              {statusInfo.label}
            </span>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div
              role="alert"
              className="px-4 py-2.5 bg-rose-50 border-b border-rose-200 text-xs text-rose-700 flex items-center justify-between gap-2 shrink-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span className="truncate">{errorMsg}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => void loadConversationAndMessages({ markRead: true })}
                  className="inline-flex items-center gap-1 font-semibold underline hover:text-rose-900 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
                <button
                  type="button"
                  onClick={() => setErrorMsg(null)}
                  aria-label="Dismiss chat error"
                  className="p-0.5 hover:bg-rose-100 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Messages Container */}
          <div
            role="log"
            aria-live="polite"
            className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/40"
          >
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2.5">
                <Loader2 className="w-5 h-5 animate-spin text-[#244A70]" />
                <span className="text-xs font-medium text-slate-600">Loading conversation history...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-white text-[#244A70] flex items-center justify-center border border-slate-200 shadow-xs">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-900">
                    Welcome, {user.fullName || user.email.split('@')[0]}
                  </h4>
                  <p className="text-xs text-slate-600 max-w-[280px] mx-auto leading-relaxed">
                    Send a message or attach a screenshot/file below. Our support team will reply here.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center my-2">
                  <div className="h-px bg-slate-200 flex-1" />
                  <span className="px-3 py-1 text-xs font-medium text-slate-600 bg-white rounded-full border border-slate-200 shadow-xs">
                    {formatDateHeader(messages[0]?.createdAt)}
                  </span>
                  <div className="h-px bg-slate-200 flex-1" />
                </div>

                <div className="space-y-3">
                  {messages.map((m, index) => {
                    const isMe = m.senderRole === 'CUSTOMER';
                    const prevMsg = messages[index - 1];
                    const isSequence = prevMsg && prevMsg.senderRole === m.senderRole;
                    const formattedTime = formatMessageTime(m.createdAt);

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${
                          isSequence ? 'mt-1' : 'mt-2.5'
                        }`}
                      >
                        {!isMe && !isSequence && (
                          <div className="flex items-center gap-1.5 px-1 mb-1 text-xs text-slate-700">
                            <div className="w-4 h-4 rounded-full bg-white text-[#244A70] border border-slate-200 flex items-center justify-center">
                              <UserCheck className="w-2.5 h-2.5" />
                            </div>
                            <span className="font-bold text-slate-800">{formatSenderDisplay(m)}</span>
                            <span className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-semibold border border-blue-200">
                              Support
                            </span>
                          </div>
                        )}

                        <div className="relative group max-w-[85%] flex flex-col gap-1.5">
                          <div
                            className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed transition-colors whitespace-pre-wrap break-words ${
                              isMe
                                ? 'bg-[#244A70] text-white rounded-br-xs font-normal'
                                : 'bg-white text-slate-900 border border-slate-200 rounded-bl-xs shadow-xs'
                            }`}
                          >
                            <p>{m.content}</p>

                            {m.attachments && m.attachments.length > 0 && (
                              <div className="mt-2 space-y-1.5">
                                {m.attachments.map((att, idx) => {
                                  const isImage = att.mimeType?.startsWith('image/');
                                  const fullUrl = resolveAttachmentUrl(att.url);
                                  return isImage ? (
                                    <a
                                      key={att.fileId || idx}
                                      href={fullUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block overflow-hidden rounded-lg border border-black/10"
                                    >
                                      <img
                                        src={fullUrl}
                                        alt={att.name}
                                        className="max-h-40 w-full object-cover"
                                      />
                                    </a>
                                  ) : (
                                    <a
                                      key={att.fileId || idx}
                                      href={fullUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs border ${
                                        isMe
                                          ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                                          : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                                      }`}
                                    >
                                      <FileText className="w-3.5 h-3.5 shrink-0" />
                                      <span className="truncate max-w-[180px]">{att.name}</span>
                                      {att.size ? (
                                        <span className="text-[10px] opacity-80 shrink-0">
                                          {formatFileSize(att.size)}
                                        </span>
                                      ) : null}
                                    </a>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        <div
                          className={`flex items-center gap-1 px-1 mt-1 text-[11px] text-slate-500 ${
                            isMe ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <span className="tabular-nums font-mono">{formattedTime}</span>
                          {isMe && (
                            <span title="Sent" aria-label="Sent">
                              <CheckCheck className="w-3.5 h-3.5 text-[#244A70] inline" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {sending && (
                  <div className="flex items-center gap-2 mt-2 px-1 text-slate-500 animate-fade-in">
                    <div className="flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-lg rounded-bl-xs shadow-xs">
                      <span className="w-1.5 h-1.5 bg-[#244A70] rounded-full animate-pulse" />
                      <span className="w-1.5 h-1.5 bg-[#244A70] rounded-full animate-pulse [animation-delay:200ms]" />
                      <span className="w-1.5 h-1.5 bg-[#244A70] rounded-full animate-pulse [animation-delay:400ms]" />
                    </div>
                    <span className="text-xs text-slate-600">Sending...</span>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Pending Attachments Preview */}
          {pendingAttachments.length > 0 && (
            <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-1.5 shrink-0">
              {pendingAttachments.map((att, idx) => (
                <div
                  key={att.fileId || idx}
                  className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700"
                >
                  <FileText className="w-3.5 h-3.5 text-[#244A70] shrink-0" />
                  <span className="truncate max-w-[140px]">{att.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setPendingAttachments((prev) => prev.filter((_, i) => i !== idx))
                    }
                    aria-label={`Remove ${att.name}`}
                    className="text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Unified Composer Footer */}
          <div className="p-3 bg-white border-t border-slate-200 shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.txt,.csv,.json,.doc,.docx,.xls,.xlsx,.zip"
              className="hidden"
              aria-label="Attach image or file"
            />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSendMessage();
              }}
              className="relative flex items-end bg-slate-50 hover:bg-white focus-within:bg-white border border-slate-200 focus-within:border-[#244A70] focus-within:ring-1 focus-within:ring-[#244A70] rounded-lg transition-colors p-2 gap-1.5 shadow-xs"
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || sending}
                title="Attach image or file"
                aria-label="Attach image or file"
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-[#244A70] hover:bg-slate-100 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Paperclip className="w-4 h-4" />
                )}
              </button>

              <textarea
                ref={textareaRef}
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question or send a message..."
                disabled={sending}
                className="w-full bg-transparent border-none text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none max-h-24 py-1 leading-relaxed"
              />

              <button
                type="submit"
                disabled={(!inputText.trim() && pendingAttachments.length === 0) || sending || uploading}
                className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#244A70]/30 ${
                  (inputText.trim() || pendingAttachments.length > 0) && !sending && !uploading
                    ? 'bg-[#244A70] hover:bg-[#1B3856] active:bg-[#13283E] text-white'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
                title="Send message"
                aria-label="Send message"
              >
                {sending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </form>
          </div>
        </aside>
      )}
    </>
  );
};

export default CustomerChatWidget;
