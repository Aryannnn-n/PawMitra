import { Layout } from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import type { ChatRoom, RoomMessage } from '@/types';
import {
  Loader2,
  MessageCircle,
  Send,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Users,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

// ── Chat Rooms List ───────────────────────────────────────────────────────────
export function ChatRooms() {
  const { user } = useAuthStore();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ rooms: ChatRoom[] }>('/api/chat/rooms')
      .then((d) => setRooms(d.rooms))
      .catch(() => toast.error('Failed to load rooms'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (roomId: number) => {
    if (!confirm('Delete this chat room?')) return;

    try {
      await apiFetch(`/api/admin/rooms/${roomId}`, { method: 'DELETE' });
      setRooms((r) => r.filter((x) => x.id !== roomId));
      toast.success('Room deleted');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto mt-8 mb-16">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Chat Rooms</h1>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium text-gray-500">No chat rooms yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition"
              >
                <div className="w-14 h-14 rounded-2xl bg-gray-100 overflow-hidden shrink-0">
                  {room.pet?.imageUrl ? (
                    <img
                      src={room.pet.imageUrl}
                      className="w-full h-full object-cover"
                      alt="pet"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                      🐾
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {room.name}
                    </h3>

                    {room.isDisabled && (
                      <Badge className="bg-red-100 text-red-600 border-red-200 text-xs">
                        Disabled
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                    <Users className="w-3 h-3" />
                    {room.participants?.length ?? 0} participants
                    {room.pet && (
                      <span className="ml-2">
                        • Pet: {room.pet.name || room.pet.type}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link to={`/chat/rooms/${room.id}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    >
                      Open
                    </Button>
                  </Link>

                  {user?.role === 'ADMIN' && (
                    <button
                      onClick={() => handleDelete(room.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

// ── Chat Room Detail ──────────────────────────────────────────────────────────
export function ChatRoomDetail() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user, token } = useAuthStore();
  const navigate = useNavigate();

  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);

  const [wsStatus, setWsStatus] = useState<
    'connecting' | 'connected' | 'reconnecting'
  >('connecting');

  const wsRef = useRef<WebSocket | null>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── WebSocket ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !roomId) return;

    const connect = () => {
      const ws = new WebSocket(
        import.meta.env.VITE_WS_URL ?? 'ws://localhost:3000',
      );

      wsRef.current = ws;
      setWsStatus('connecting');

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'authenticate', token }));
      };

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);

        if (data.type === 'authenticated') {
          setWsStatus('connected');

          ws.send(
            JSON.stringify({
              type: 'room:join',
              roomId: parseInt(roomId),
            }),
          );
        }

        if (data.type === 'room:message' && String(data.roomId) === roomId) {
          const incoming: RoomMessage = data.message;

          setMessages((prev) => {
            if (data.clientTempId) {
              return prev.map((m) =>
                String(m.id) === data.clientTempId ? incoming : m,
              );
            }

            if (prev.some((m) => m.id === incoming.id)) return prev;

            return [...prev, incoming];
          });
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
  }, [token, roomId]);

  // ── Load room history ─────────────────────────────────────────────────────
  useEffect(() => {
    apiFetch<{ room: ChatRoom }>(`/api/chat/rooms/${roomId}`)
      .then((d) => {
        setRoom(d.room);
        setMessages(d.room.messages);
      })
      .catch(() => {
        toast.error('Room not found');
        navigate('/chat/rooms');
      })
      .finally(() => setLoading(false));
  }, [roomId]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    chatBoxRef.current?.scrollTo({
      top: chatBoxRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = () => {
    if (!input.trim()) return;

    const ws = wsRef.current;

    if (ws?.readyState !== WebSocket.OPEN) {
      toast.error('Connection lost. Reconnecting...');
      return;
    }

    const content = input.trim();
    const clientTempId = crypto.randomUUID();

    const optimistic: RoomMessage = {
      id: clientTempId as unknown as number,
      message: content,
      timestamp: new Date().toISOString(),
      sender: { id: user!.id, username: user!.username },
    };

    setMessages((prev) => [...prev, optimistic]);

    ws.send(
      JSON.stringify({
        type: 'room:send',
        roomId: parseInt(roomId!),
        content,
        clientTempId,
      }),
    );

    setInput('');
  };

  const handleToggleRoom = async () => {
    if (!room) return;

    try {
      await apiFetch(`/api/admin/rooms/${room.id}/toggle`, {
        method: 'PATCH',
      });

      setRoom((r) => (r ? { ...r, isDisabled: !r.isDisabled } : r));

      toast.success(`Room ${room.isDisabled ? 'enabled' : 'disabled'}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to toggle room');
    }
  };

  const statusColors = {
    connected: 'bg-green-500',
    connecting: 'bg-yellow-400',
    reconnecting: 'bg-red-500',
  };

  const statusLabels = {
    connected: 'Connected',
    connecting: 'Connecting...',
    reconnecting: 'Reconnecting...',
  };

  if (loading)
    return (
      <Layout>
        <div className="flex justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      </Layout>
    );

  return (
    <Layout>
      <div className="max-w-3xl mx-auto mt-6 mb-10">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[78vh]">
          {/* Header */}
          <div className="px-5 py-3 border-b flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900">{room?.name}</h2>

              {room?.isDisabled && (
                <Badge className="bg-red-100 text-red-600 text-xs mt-0.5">
                  Disabled
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span
                  className={`w-2 h-2 rounded-full ${statusColors[wsStatus]}`}
                />
                {statusLabels[wsStatus]}
              </div>

              {user?.role === 'ADMIN' && room && (
                <button
                  onClick={handleToggleRoom}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition
                    ${
                      room.isDisabled
                        ? 'border-green-200 text-green-700 hover:bg-green-50'
                        : 'border-red-200 text-red-600 hover:bg-red-50'
                    }`}
                >
                  {room.isDisabled ? (
                    <>
                      <ToggleRight className="w-4 h-4" /> Enable
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" /> Disable
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Participants */}
          <div className="px-5 py-2.5 border-b bg-gray-50 flex items-center gap-2 flex-wrap">
            <Users className="w-4 h-4 text-gray-400 shrink-0" />

            {room?.participants?.map((p) => (
              <span
                key={p.user.id}
                className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded-full text-gray-700"
              >
                {p.user.username}
              </span>
            ))}
          </div>

          {/* Messages */}
          <div
            ref={chatBoxRef}
            className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <p className="text-4xl mb-3">💬</p>
                <p>No messages yet. Be the first!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.sender.id === user?.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      isMine ? 'items-end' : 'items-start'
                    }`}
                  >
                    {!isMine && (
                      <span className="text-xs text-gray-400 mb-1 ml-1">
                        {msg.sender.username}
                      </span>
                    )}

                    <div
                      className={`max-w-[65%] px-4 py-2.5 rounded-2xl text-sm
                      ${
                        isMine
                          ? 'bg-indigo-500 text-white rounded-br-sm'
                          : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-sm'
                      }`}
                    >
                      <p className="break-words">{msg.message}</p>

                      <p
                        className={`text-[10px] mt-1 ${
                          isMine ? 'text-indigo-200' : 'text-gray-400'
                        } text-right`}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'Asia/Kolkata',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input */}
          {room?.isDisabled ? (
            <div className="px-5 py-4 border-t bg-white text-center text-sm text-gray-400">
              🚫 Chat is currently disabled by admin.
            </div>
          ) : (
            <div className="px-4 py-3 border-t bg-white flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && !e.shiftKey && sendMessage()
                }
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
    </Layout>
  );
}
