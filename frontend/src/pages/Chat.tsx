import { useState, useEffect, useRef, useCallback } from 'react';
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
  const { userId }      = useParams<{ userId?: string }>();
  const navigate        = useNavigate();
  const { user, token } = useAuthStore();

  // BUG FIX 3: Separate base contacts (preloaded) from search results
  // so clearing search restores original list without stale merges
  const [baseContacts,    setBaseContacts]    = useState<ConversationUser[]>([]);
  const [searchResults,   setSearchResults]   = useState<ConversationUser[] | null>(null); // null = no active search
  const [messages,        setMessages]        = useState<Message[]>([]);
  const [selectedUser,    setSelectedUser]    = useState<ConversationUser | null>(null);
  const [input,           setInput]           = useState('');
  const [searchQuery,     setSearchQuery]     = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingSearch,   setLoadingSearch]   = useState(false);
  const [wsStatus,        setWsStatus]        = useState<'connecting' | 'connected' | 'reconnecting'>('connecting');

  // BUG FIX 2: Track whether we have already opened the chat for the URL param
  // so the effect doesn't re-run and cause an infinite loop
  const initialOpenDone = useRef(false);

  const wsRef           = useRef<WebSocket | null>(null);
  const chatBoxRef      = useRef<HTMLDivElement>(null);
  const reconnectTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedUserRef = useRef<ConversationUser | null>(null);

  // ── WebSocket ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    const connect = () => {
      const ws = new WebSocket(import.meta.env.VITE_WS_URL ?? 'ws://localhost:3000');
      wsRef.current = ws;
      setWsStatus('connecting');

      ws.onopen = () => ws.send(JSON.stringify({ type: 'authenticate', token }));

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === 'authenticated') setWsStatus('connected');

        if (data.type === 'dm:receive') {
          const msg: Message = data.message;
          const currentSelected = selectedUserRef.current;
          const isFromOther = msg.sender.id !== user?.id;
          const isRelevant =
            msg.sender.id === currentSelected?.id ||
            msg.receiver?.id === currentSelected?.id;

          setMessages(prev => {
            // Only add messages FROM the other person (not echoes of our own sends).
            // Our own messages are already added optimistically in sendMessage().
            if (!isFromOther) return prev;
            if (!isRelevant) return prev;
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });

          // Bump unread badge for contacts not currently open
          if (isFromOther && msg.sender.id !== currentSelected?.id) {
            setBaseContacts(prev => prev.map(c =>
              c.id === msg.sender.id ? { ...c, unread: c.unread + 1 } : c
            ));
          }
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

  useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);

  // ── Preload contacts ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        if (user.role !== 'ADMIN') {
          const data = await apiFetch<{ users: User[] }>('/api/users?role=ADMIN');
          setBaseContacts(data.users.map(u => ({ id: u.id, username: u.username, unread: 0 })));
        } else {
          const data = await apiFetch<{ users: User[] }>('/api/chat/recent-contacts');
          setBaseContacts(data.users.map(u => ({ id: u.id, username: u.username, unread: 0 })));
        }
      } catch { /* silent */ }
    };
    load();
  }, [user]);

  // ── Open chat (stable with useCallback — no contact dependency) ───────────
  // BUG FIX 2: openChat is now stable and doesn't depend on `contacts`,
  // which was causing re-renders that re-triggered the URL param effect in a loop.
  const openChat = useCallback(async (contact: ConversationUser) => {
    setSelectedUser(contact);
    navigate(`/chat/${contact.id}`, { replace: true });
    setBaseContacts(prev => prev.map(c => c.id === contact.id ? { ...c, unread: 0 } : c));
    setLoadingMessages(true);
    setMessages([]);
    try {
      const data = await apiFetch<{ messages: Message[] }>(`/api/chat/dm/${contact.id}`);
      setMessages(data.messages);
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  }, [navigate]);

  // ── Open chat from URL param ──────────────────────────────────────────────
  // BUG FIX 2 & 3: Use a ref flag so this only fires once on mount,
  // not every time contacts change (which caused the infinite loop + lag).
  useEffect(() => {
    if (!userId || initialOpenDone.current) return;

    const numericId = parseInt(userId, 10);
    if (isNaN(numericId)) return;

    initialOpenDone.current = true;

    // Try from already-loaded base contacts first
    const existing = baseContacts.find(c => c.id === numericId);
    if (existing) {
      openChat(existing);
      return;
    }

    // Otherwise fetch user from API
    apiFetch<{ user: User }>(`/api/users/${numericId}`)
      .then(d => {
        const contact: ConversationUser = { id: d.user.id, username: d.user.username, unread: 0 };
        // Add to base contacts if not already there
        setBaseContacts(prev =>
          prev.find(c => c.id === contact.id) ? prev : [contact, ...prev]
        );
        openChat(contact);
      })
      .catch(() => toast.error('User not found'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, baseContacts.length, openChat]);
  // We intentionally depend on baseContacts.length (not the full array)
  // so the effect re-checks once contacts load, but not on every unread change.

  // ── Admin search (debounced) ──────────────────────────────────────────────
  // BUG FIX 4: Search results are stored separately from base contacts.
  // Clearing the search field restores the original preloaded list cleanly.
  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (!searchQuery.trim()) {
      setSearchResults(null); // Clear search → show base contacts
      setLoadingSearch(false);
      return;
    }

    setLoadingSearch(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const data = await apiFetch<{ users: User[] }>(
          `/api/users?search=${encodeURIComponent(searchQuery.trim())}`
        );
        setSearchResults(data.users.map(u => ({ id: u.id, username: u.username, unread: 0 })));
      } catch { /* silent */ }
      finally { setLoadingSearch(false); }
    }, 300);

    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [searchQuery, user]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = () => {
    if (!input.trim() || !selectedUser) return;
    const ws = wsRef.current;
    if (ws?.readyState !== WebSocket.OPEN) {
      toast.error('Connection lost. Reconnecting...');
      return;
    }
    const optimistic: Message = {
      id:        Date.now(),
      content:   input.trim(),
      isRead:    false,
      timestamp: new Date().toISOString(),
      sender:    { id: user!.id, username: user!.username },
      receiver:  { id: selectedUser.id, username: selectedUser.username },
    };
    setMessages(prev => [...prev, optimistic]);
    ws.send(JSON.stringify({ type: 'dm:send', receiverId: selectedUser.id, content: input.trim() }));
    setInput('');
  };

  useEffect(() => {
    chatBoxRef.current?.scrollTo({ top: chatBoxRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Displayed list: search results when searching, base contacts otherwise
  const displayedContacts = searchResults !== null ? searchResults : baseContacts;

  // For non-admin users, also support local filter in the sidebar (no API needed)
  const filteredContacts = (user?.role !== 'ADMIN' && searchQuery.trim())
    ? displayedContacts.filter(c => c.username.toLowerCase().includes(searchQuery.toLowerCase()))
    : displayedContacts;

  const statusColors = { connected: 'bg-green-500', connecting: 'bg-yellow-400', reconnecting: 'bg-red-500' };
  const statusLabels = { connected: 'Connected', connecting: 'Connecting...', reconnecting: 'Reconnecting...' };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto mt-6 mb-10">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex h-[78vh]">

          {/* Sidebar */}
          <div className="w-72 border-r flex flex-col bg-gray-50 shrink-0">
            <div className="p-4 border-b">
              <h2 className="font-bold text-gray-900 mb-3">
                {user?.role === 'ADMIN' ? 'Users' : 'Support'}
              </h2>
              {/* Show search for all roles — admins hit API, users filter locally */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 text-sm"
                />
                {loadingSearch && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-gray-400" />
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredContacts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center mt-8 px-4">
                  {searchQuery.trim()
                    ? 'No users found'
                    : user?.role === 'ADMIN'
                      ? 'No recent contacts'
                      : 'No admins available'}
                </p>
              ) : (
                [...filteredContacts]
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

          {/* Chat area */}
          <div className="flex-1 flex flex-col">
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
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className={`w-2 h-2 rounded-full ${statusColors[wsStatus]}`} />
                {statusLabels[wsStatus]}
              </div>
            </div>

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
                          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'}`}>
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
                  disabled={!input.trim() || wsStatus !== 'connected'}
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