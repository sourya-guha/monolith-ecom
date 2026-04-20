'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { chatApi } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { useSocket } from '../../lib/socket-context';
import { ArrowLeft, Send } from 'lucide-react';

type Message = { _id: string; text: string; createdAt: string; sender: { _id?: string; id?: string; name: string; role: string }; };
type Conversation = { _id: string; buyer: { _id?: string; id?: string; name: string; email: string }; seller: { _id?: string; id?: string; name: string; email: string }; product?: { _id: string; name: string; images?: string[] }; };

export default function BuyerChatThread() {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const params = useParams();
  const router = useRouter();
  const conversationId = String(params.id || '');
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { if (!user) { router.replace('/login'); return; } if (user.role !== 'user') router.replace('/'); }, [user, router]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const conversations = (await chatApi.listConversations()) as Conversation[];
        setConversation(conversations.find((c) => c._id === conversationId) || null);
        const msgs = (await chatApi.getMessages(conversationId)) as Message[] | unknown;
        setMessages(Array.isArray(msgs) ? msgs : []);
      } finally { setLoading(false); }
    };
    if (!user || user.role !== 'user' || !conversationId) return;
    load();
  }, [user, conversationId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  useEffect(() => {
    if (!socket || !conversationId) return;
    socket.emit('chat:join', { conversationId });
    const onMessage = (payload: { conversationId: string; message: Message }) => {
      if (payload.conversationId !== conversationId) return;
      setMessages((prev) => [...prev, payload.message]);
    };
    socket.on('chat:message', onMessage);
    return () => { socket.off('chat:message', onMessage); };
  }, [socket, conversationId]);

  const otherName = useMemo(() => conversation?.seller?.name || 'Seller', [conversation]);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed || !socket || !connected) return;
    socket.emit('chat:send', { conversationId, text: trimmed });
    setText('');
  };

  if (!user || user.role !== 'user') return null;

  return (
    <div className="min-h-screen py-6 sm:py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-4">
          <div>
            <Link href="/chats" className="text-[#c084fc] hover:underline font-medium text-sm flex items-center gap-1">
              <ArrowLeft size={14} /> Back
            </Link>
            <div className="text-xl sm:text-2xl font-bold text-white mt-2">{otherName}</div>
            {conversation?.product?.name && <div className="text-xs text-[#64748b]">{conversation.product.name}</div>}
          </div>
          {!connected && <div className="text-xs text-[#64748b]">Connecting…</div>}
        </motion.div>

        <div className="glass-card overflow-hidden">
          <div className="h-[60vh] overflow-y-auto p-4 sm:p-5 space-y-3">
            {loading ? (
              <div className="flex justify-center py-8"><div className="spinner" /></div>
            ) : messages.length === 0 ? (
              <div className="text-[#64748b] text-sm text-center py-8">No messages yet. Say hello!</div>
            ) : (
              messages.map((m) => {
                const senderId = String(m.sender?._id || m.sender?.id || '');
                const mine = senderId && senderId === String(user.id);
                return (
                  <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      mine
                        ? 'bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] text-white'
                        : 'bg-white/[0.06] text-[#f8fafc] border border-white/[0.06]'
                    }`}>
                      <div className="whitespace-pre-wrap break-words">{m.text}</div>
                      <div className={`mt-1 text-[10px] ${mine ? 'text-white/60' : 'text-[#64748b]'}`}>
                        {new Date(m.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-white/[0.06] p-3 sm:p-4 flex gap-2 sm:gap-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              placeholder="Type a message…"
              className="input-dark flex-1 py-2.5 text-sm"
            />
            <button
              onClick={send}
              disabled={!connected || !text.trim()}
              className="btn-gradient px-4 sm:px-5 py-2.5 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
