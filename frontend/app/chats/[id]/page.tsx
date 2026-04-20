'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { chatApi } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { useSocket } from '../../lib/socket-context';

type Message = {
  _id: string;
  text: string;
  createdAt: string;
  sender: { _id?: string; id?: string; name: string; role: string };
};

type Conversation = {
  _id: string;
  buyer: { _id?: string; id?: string; name: string; email: string };
  seller: { _id?: string; id?: string; name: string; email: string };
  product?: { _id: string; name: string; images?: string[] };
};

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

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'user') {
      router.replace('/');
    }
  }, [user, router]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // listConversations also gives us seller/product metadata
        const conversations = (await chatApi.listConversations()) as Conversation[];
        const found = conversations.find((c) => c._id === conversationId) || null;
        setConversation(found);

        const msgs = (await chatApi.getMessages(conversationId)) as Message[] | unknown;
        setMessages(Array.isArray(msgs) ? msgs : []);
      } finally {
        setLoading(false);
      }
    };

    if (!user || user.role !== 'user' || !conversationId) return;
    load();
  }, [user, conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.emit('chat:join', { conversationId });
    const onMessage = (payload: { conversationId: string; message: Message }) => {
      if (payload.conversationId !== conversationId) return;
      setMessages((prev) => [...prev, payload.message]);
    };
    socket.on('chat:message', onMessage);

    return () => {
      socket.off('chat:message', onMessage);
    };
  }, [socket, conversationId]);

  const otherName = useMemo(() => conversation?.seller?.name || 'Seller', [conversation]);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!socket || !connected) return;

    socket.emit('chat:send', { conversationId, text: trimmed });
    setText('');
  };

  if (!user || user.role !== 'user') return null;

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Link href="/chats" className="text-blue-600 hover:text-blue-700 font-medium">
              ← Back
            </Link>
            <div className="text-2xl font-bold text-gray-900 mt-2">{otherName}</div>
            {conversation?.product?.name && <div className="text-sm text-gray-600">{conversation.product.name}</div>}
          </div>
          {!connected && <div className="text-sm text-gray-500">Connecting…</div>}
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="h-[60vh] overflow-y-auto p-5 space-y-3">
            {loading ? (
              <div className="text-gray-600">Loading messages…</div>
            ) : messages.length === 0 ? (
              <div className="text-gray-600">No messages yet. Say hello!</div>
            ) : (
              messages.map((m) => {
                const senderId = String(m.sender?._id || m.sender?.id || '');
                const mine = senderId && senderId === String(user.id);
                return (
                  <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                        mine ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="whitespace-pre-wrap break-words">{m.text}</div>
                      <div className={`mt-1 text-[11px] ${mine ? 'text-blue-100' : 'text-gray-500'}`}>
                        {new Date(m.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t p-4 flex gap-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') send();
              }}
              placeholder="Type a message…"
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600"
            />
            <button
              onClick={send}
              disabled={!connected || !text.trim()}
              className="bg-blue-600 text-white px-5 rounded-xl font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

