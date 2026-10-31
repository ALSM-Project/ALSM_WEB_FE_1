import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Minus,
  Send,
  Headphones,
  Loader2,
  Bot,
  UserCheck,
  CheckCheck,
  ShieldCheck,
  Clock,
  Sparkles,
  GripVertical,
} from 'lucide-react';
import { useAuth } from '@/app/providers';
import { apiClient } from '@/services/api/apiClient';

export interface ChatMessageItem {
  id: string;
  conversationId: string;
  senderUserId?: string;
  senderName: string;
  senderEmail: string;
  senderRole: 'CUSTOMER' | 'SALES_REP' | 'STAFF' | 'SYSTEM';
  content: string;
  isInternal?: boolean;
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
}

const QUICK_STARTER_CHIPS = [
  { label: 'Screen conversion quota', text: 'I would like to inquire about expanding our screen conversion quota.' },
  { label: 'Custom BMS/COBOL parser', text: 'We have proprietary BMS/COBOL macros requiring custom parser support.' },
  { label: 'Enterprise SLA & deployment', text: 'Can you provide details on dedicated on-premise SLA options?' },
];

export const CustomerChatWidget: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState<ChatConversationItem | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleBtnClick = () => {
    if (btnDragRef.current.moved) {
      btnDragRef.current.moved = false;
      return;
    }
    setIsOpen(true);
    setUnreadCount(0);
    loadConversationAndMessages();
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

  // Initialize or fetch the customer's active conversation
  const loadConversationAndMessages = useCallback(async () => {
    if (!user?.email) return;
    try {
      setLoading(true);
      const conv = await apiClient.get<ChatConversationItem>('/crm/conversations/my/active');
      setConversation(conv);

      const msgs = await apiClient.get<ChatMessageItem[]>(`/crm/conversations/${conv.id}/messages`);
      setMessages(msgs || []);
    } catch (err) {
      console.error('Failed to load active customer conversation:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  // Support global open request (e.g., from Contact & Support page CTA)
  useEffect(() => {
    const handleOpenChat = () => {
      setIsOpen(true);
      setUnreadCount(0);
      loadConversationAndMessages();
      setTimeout(() => textareaRef.current?.focus(), 150);
    };
    window.addEventListener('alsm:open-support-chat', handleOpenChat);
    return () => window.removeEventListener('alsm:open-support-chat', handleOpenChat);
  }, [loadConversationAndMessages]);

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
    let reconnectTimeout: any = null;
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
            })
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

                if (!isOpen) {
                  setUnreadCount((c) => c + 1);
                }
              }
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
  }, [conversation?.id, user?.id, user?.email, user?.fullName, isOpen]);

  // When widget is opened, fetch initial conversation if not yet loaded
  useEffect(() => {
    if (isOpen && !conversation) {
      loadConversationAndMessages();
    }
    if (isOpen) {
      setUnreadCount(0);
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen, conversation, loadConversationAndMessages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, sending, isOpen]);

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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputText).trim();
    if (!content || sending) return;

    let activeConv = conversation;
    try {
      setSending(true);
      setInputText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      // If active conversation doesn't exist yet, get or create one
      if (!activeConv) {
        activeConv = await apiClient.get<ChatConversationItem>('/crm/conversations/my/active');
        setConversation(activeConv);
      }

      // Send to backend via HTTP post (which also broadcasts to FE2 via WebSocket)
      const posted = await apiClient.post<ChatMessageItem>(
        `/crm/conversations/${activeConv.id}/messages`,
        { content, isInternal: false }
      );

      // Optimistically add to state
      setMessages((prev) => {
        if (prev.some((m) => m.id === posted.id)) return prev;
        return [...prev, posted];
      });
    } catch (err) {
      console.error('Failed to send customer chat message:', err);
      setInputText(content);
    } finally {
      setSending(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
            {/* Tooltip on hover */}
            <span className="hidden sm:inline-flex items-center absolute right-full mr-3 px-3 py-1.5 bg-slate-900/90 backdrop-blur-xs text-white text-xs font-semibold rounded-lg shadow-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap">
              Chat with Team
            </span>

            {/* Icon */}
            <Headphones className="w-6 h-6 transition-transform group-hover:scale-110 pointer-events-none" />

            {/* Active Status Pulse Badge */}
            <span className="absolute top-0.5 right-0.5 flex h-3 w-3 pointer-events-none">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#15803D] border-2 border-[#244A70]" />
            </span>

            {/* Unread Counter Badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -left-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[11px] font-bold bg-[#B91C1C] text-white rounded-full shadow-md border-2 border-white animate-bounce pointer-events-none">
                {unreadCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Floating Chat Window Modal — Inherited from ALSM Web2 Admin Design System */}
      {isOpen && (
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
          {/* Header — Deep Navy Brand Surface (#14263F) with Accessible Contrast & Drag Handle */}
          <div
            onMouseDown={handleModalHeaderMouseDown}
            className={`bg-[#14263F] text-white px-4 py-3 flex items-center justify-between border-b border-[#203954] shrink-0 select-none ${
              isModalDragging ? 'cursor-grabbing' : 'sm:cursor-grab'
            }`}
            title="Drag title bar to move chat window"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <GripVertical className="w-4 h-4 text-slate-400 hidden sm:block shrink-0" />
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-[#203954] flex items-center justify-center text-white shrink-0">
                  <Headphones className="w-4 h-4" />
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#14263F] ${
                    isLiveConnected ? 'bg-[#15803D]' : 'bg-[#B45309]'
                  }`}
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-white tracking-tight truncate">ALSM Team Support</h3>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#203954] text-blue-100 border border-blue-400/30 shrink-0">
                    Enterprise
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-blue-100 mt-0.5">
                  <span className="truncate">
                    {isLiveConnected ? 'Online • Direct Support' : 'Connecting to desk...'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-400"
                title="Minimize chat"
                aria-label="Minimize chat"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-400"
                title="Close chat"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Subheader / Enterprise SLA Desk Banner — Single Surface Clean Layout */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-700 shrink-0">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-[#244A70]" />
              <span className="font-semibold text-slate-800 truncate">Workspace Modernization Desk</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#244A70] bg-white border border-slate-200 px-2.5 py-1 rounded-md shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>SLA Active</span>
            </div>
          </div>

          {/* Messages Container — Crisp Slate Surface without Nested Card Borders */}
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
              <div className="h-full flex flex-col justify-between py-2">
                <div className="text-center px-4 space-y-3 mt-4">
                  <div className="w-10 h-10 rounded-xl bg-white text-[#244A70] flex items-center justify-center border border-slate-200 mx-auto shadow-xs">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">
                      Welcome, {user.fullName || user.email.split('@')[0]}
                    </h4>
                    <p className="text-xs text-slate-600 max-w-[280px] mx-auto leading-relaxed">
                      ALSM modernization architects are online. How can we help your modernization project today?
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white text-xs text-slate-700 border border-slate-200 shadow-xs">
                    <Clock className="w-3.5 h-3.5 text-[#244A70]" />
                    <span>Average reply time: under 5 minutes</span>
                  </div>
                </div>

                {/* Quick Starter Inquiry Chips */}
                <div className="space-y-2 pt-4">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block px-1">
                    Suggested Inquiries
                  </span>
                  <div className="space-y-1.5">
                    {QUICK_STARTER_CHIPS.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(chip.text)}
                        className="w-full text-left text-xs px-3.5 py-2.5 bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-lg text-slate-800 hover:text-blue-700 transition-colors cursor-pointer shadow-xs flex items-center justify-between group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#244A70]"
                      >
                        <span className="truncate">{chip.label}</span>
                        <Sparkles className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Date Separator */}
                <div className="flex items-center justify-center my-2">
                  <div className="h-px bg-slate-200 flex-1" />
                  <span className="px-3 py-1 text-xs font-medium text-slate-600 bg-white rounded-full border border-slate-200 shadow-xs">
                    {formatDateHeader(messages[0]?.createdAt)}
                  </span>
                  <div className="h-px bg-slate-200 flex-1" />
                </div>

                {/* Messages Feed */}
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
                            <span className="font-bold text-slate-800">
                              {formatSenderDisplay(m)}
                            </span>
                            <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md font-semibold border border-blue-200">
                              Team
                            </span>
                          </div>
                        )}

                        <div className="relative group max-w-[85%] flex items-end gap-1.5">
                          <div
                            className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed transition-colors whitespace-pre-wrap break-words ${
                              isMe
                                ? 'bg-[#244A70] text-white rounded-br-xs font-normal'
                                : 'bg-white text-slate-900 border border-slate-200 rounded-bl-xs shadow-xs'
                            }`}
                          >
                            <p>{m.content}</p>
                          </div>
                        </div>

                        {/* Metadata Footer: Timestamp + Delivery receipt */}
                        <div
                          className={`flex items-center gap-1 px-1 mt-1 text-xs text-slate-500 ${
                            isMe ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <span className="tabular-nums font-mono">{formattedTime}</span>
                          {isMe && (
                            <span title="Delivered" aria-label="Delivered">
                              <CheckCheck className="w-3.5 h-3.5 text-[#244A70] inline" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Live Typing Indicator */}
                {sending && (
                  <div className="flex items-center gap-2 mt-2 px-1 text-slate-500 animate-fade-in">
                    <div className="flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-lg rounded-bl-xs shadow-xs">
                      <span className="w-1.5 h-1.5 bg-[#244A70] rounded-full animate-pulse" />
                      <span className="w-1.5 h-1.5 bg-[#244A70] rounded-full animate-pulse [animation-delay:200ms]" />
                      <span className="w-1.5 h-1.5 bg-[#244A70] rounded-full animate-pulse [animation-delay:400ms]" />
                    </div>
                    <span className="text-xs text-slate-600">Sending to desk...</span>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies bar if messages already exist */}
          {messages.length > 0 && (
            <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider shrink-0 mr-1">
                Quick:
              </span>
              {QUICK_STARTER_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(chip.text)}
                  className="shrink-0 text-xs px-3 py-1 bg-white hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-full text-slate-700 hover:text-blue-700 transition-colors shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#244A70]"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {/* Unified Composer Footer */}
          <div className="p-3 bg-white border-t border-slate-200 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-end bg-slate-50 hover:bg-white focus-within:bg-white border border-slate-200 focus-within:border-[#244A70] focus-within:ring-1 focus-within:ring-[#244A70] rounded-lg transition-colors p-2 pl-3 gap-2 shadow-xs"
            >
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
                disabled={!inputText.trim() || sending}
                className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#244A70]/30 ${
                  inputText.trim() && !sending
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

            <div className="flex items-center justify-between text-xs text-slate-600 px-1 pt-2">
              <span className="flex items-center gap-1.5">
                <span>Press</span>
                <kbd className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-700 shadow-xs">
                  Enter
                </kbd>
                <span>to send</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Protected by Enterprise SLA</span>
              </span>
            </div>
          </div>
        </aside>
      )}
    </>
  );
};

export default CustomerChatWidget;
