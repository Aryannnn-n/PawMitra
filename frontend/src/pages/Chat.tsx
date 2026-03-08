import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Send, Loader2, Search } from 'lucide-react';
import type { Message, User } from '@/types';

interface ConversationUser {
  id: number;
  username: string;
  unread: number;
}

export default function Chat() {
  const { userId }       = useParams<{ userId?: string }>();
  const navigate         = useNavigate();
  const { user, token }  = useAuthStore();

  const [contacts,        setContacts]        = useState<ConversationUser[]>([]);
  const [messages,        setMessages]        = useState<Message[]>([]);
  const [selectedUser,    setSelectedUser]    = useState<ConversationUser | null>(null);
  const [input,           setInput]           = useState('');
  const [searchQuery,     setSearchQuery]     = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending,         setSending]         = useState(false);
  const [wsStatus,        setWsStatus]        = useState<'connecting' | 'connected' | 'reconnecting'>('connecting');

  const wsRef      = useRef<WebSocket | null>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── WebSocket setup ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    const connect = () => {
      const ws = new WebSocket(import.meta.env.VITE_WS_URL ?? 'ws://localhost:3000');
      wsRef.current = ws;
      setWsStatus('connecting');

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'authenticate', token }));
      };

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);

        if (data.type === 'authenticated') {
          setWsStatus('connected');
        }

        if (data.type === 'dm:receive') {
          const msg: Message = data.message;
          // Only add to chat if it's the active conversation
          setMessages(prev => {
            const isDuplicate = prev.some(m => m.id === msg.id);
            if (isDuplicate) return prev;
            const isRelevant =
              (msg.sender.id === selectedUserRef.current?.id) ||
              (msg.receiver?.id === selectedUserRef.current?.id);
            return isRelevant ? [...prev, msg] : prev;
          });

          // Update unread dot for other contacts
          setContacts(prev => prev.map(c =>
            c.id === msg.sender.id && msg.sender.id !== selectedUserRef.current?.id
              ? { ...c, unread: c.unread + 1 }
              : c
          ));
        }
      };

      ws.onclose = () => {
        setWsStatus('reconnecting');
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => ws.close();
    };

    connect();
    return () => {
      wsRef.current?.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [token]);

  // Keep a ref to selectedUser so ws onmessage can access latest value
  const selectedUserRef = useRef<ConversationUser | null>(null);
  useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);

  // ── Load contacts (admins for users, users for admins) ────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const endpoint = user?.role === 'ADMIN' ? '/api/users?role=USER' : '/api/users?role=ADMIN';
        const data = await apiFetch<{ users: User[] }>(endpoint);
        setContacts(data.users.map(u => ({ id: u.id, username: u.username, unread: 0 })));
      } catch { /* silent */ }
    };
    load();
  }, [user]);

  // ── Open chat from URL param ──────────────────────────────────────────────
  useEffect(() => {
    if (userId && contacts.length > 0) {
      const contact = contacts.find(c => c.id === parseInt(userId));
      if (contact) openChat(contact);
    }
  }, [userId, contacts]);

  // ── Open chat with a contact ──────────────────────────────────────────────
  const openChat = async (contact: ConversationUser) => {
    setSelectedUser(contact);
    navigate(`/chat/${contact.id}`, { replace: true });
    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, unread: 0 } : c));
    setLoadingMessages(true);
    try {
      const data = await apiFetch<{ messages: Message[] }>(`/api/chat/dm/${contact.id}`);
      setMessages(data.messages);
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  // ── Send message via WebSocket ────────────────────────────────────────────
  const sendMessage = () => {
    if (!input.trim() || !selectedUser) return;
    setSending(true);

    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      // Optimistic UI — add message immediately
      const optimistic: Message = {
        id:        Date.now(), // temp id
        content:   input.trim(),
        isRead:    false,
        timestamp: new Date().toISOString(),
        sender:    { id: user!.id, username: user!.username },
        receiver:  { id: selectedUser.id, username: selectedUser.username },
      };
      setMessages(prev => [...prev, optimistic]);
      ws.send(JSON.stringify({ type: 'dm:send', receiverId: selectedUser.id, content: input.trim() }));
      setInput('');
    } else {
      toast.error('Connection lost. Reconnecting...');
    }
    setSending(false);
  };

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    chatBoxRef.current?.scrollTo({ top: chatBoxRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const filteredContacts = contacts.filter(c =>
    c.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusColors = {
    connected:    'bg-green-500',
    connecting:   'bg-yellow-400',
    reconnecting: 'bg-red-500',
  };

  const statusLabels = {
    connected:    'Connected',
    connecting:   'Connecting...',
    reconnecting: 'Reconnecting...',
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto mt-6 mb-10">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex h-[78vh]">

          {/* ── Contacts Sidebar ─────────────────────────────────────────── */}
          <div className="w-72 border-r flex flex-col bg-gray-50 shrink-0">
            <div className="p-4 border-b">
              <h2 className="font-bold text-gray-900 mb-3">
                {user?.role === 'ADMIN' ? 'Users' : 'Support'}
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredContacts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center mt-8">No contacts found</p>
              ) : (
                filteredContacts
                  .sort((a, b) => b.unread - a.unread)
                  .map(contact => (
                    <button
                      key={contact.id}
                      onClick={() => openChat(contact)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 transition text-left border-b border-gray-100
                        ${selectedUser?.id === contact.id ? 'bg-indigo-50' : ''}`}
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center uppercase">
                          {contact.username[0]}
                        </div>
                        {contact.unread > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                            {contact.unread}
                          </span>
                        )}
                      </div>
                      <span className={`text-sm truncate ${contact.unread > 0 ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {contact.username}
                      </span>
                    </button>
                  ))
              )}
            </div>
          </div>

          {/* ── Chat Area ────────────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="px-5 py-3 border-b flex items-center justify-between bg-white">
              {selectedUser ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center uppercase text-sm">
                    {selectedUser.username[0]}
                  </div>
                  <span className="font-semibold text-gray-900">{selectedUser.username}</span>
                </div>
              ) : (
                <span className="text-gray-400 text-sm">Select a contact to start chatting</span>
              )}
              {/* WS Status */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className={`w-2 h-2 rounded-full ${statusColors[wsStatus]}`} />
                {statusLabels[wsStatus]}
              </div>
            </div>

            {/* Messages */}
            <div ref={chatBoxRef} className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50">
              {!selectedUser ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <p className="text-4xl mb-3">💬</p>
                  <p className="font-medium">Select a contact to start chatting</p>
                </div>
              ) : loadingMessages ? (
                <div className="flex justify-center pt-10">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <p className="text-4xl mb-3">👋</p>
                  <p>No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.sender.id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[60%] px-4 py-2.5 rounded-2xl text-sm
                        ${isMine
                          ? 'bg-indigo-500 text-white rounded-br-sm'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'
                        }`}>
                        <p className="break-words">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? 'text-indigo-200' : 'text-gray-400'} text-right`}>
                          {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input */}
            {selectedUser && (
              <div className="px-4 py-3 border-t bg-white flex gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Type a message..."
                  disabled={wsStatus !== 'connected'}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending || wsStatus !== 'connected'}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}