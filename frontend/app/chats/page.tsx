'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { chatApi } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { useSocket } from '../lib/socket-context';

type Conversation = {
  _id: string;
  buyer: { _id?: string; id?: string; name: string; email: string };
  seller: { _id?: string; id?: string; name: string; email: string };
  product?: { _id: string; name: string; images?: string[] };
  lastMessage?: string;
  lastMessageAt?: string;
};

export default function BuyerChatsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { socket } = useSocket();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const title = useMemo(() => 'Chats', []);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'user') {
      router.replace('/');
    }
  }, [user, router]);

  const load = async () => {
    setLoading(true);
    try {
      const list = (await chatApi.listConversations()) as Conversation[] | unknown;
      setConversations(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'user') return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!socket) return;
    const onUpdate = () => load();
    socket.on('chat:conversation:update', onUpdate);
    return () => {
      socket.off('chat:conversation:update', onUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  if (!user || user.role !== 'user') return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
          <Link href="/shop" className="text-blue-600 hover:text-blue-700 font-medium">
            Browse products
          </Link>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-md p-6">Loading chats…</div>
        ) : conversations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-10 text-center">
            <div className="text-5xl mb-3">💬</div>
            <div className="text-lg font-semibold text-gray-800">No chats yet</div>
            <div className="text-gray-600 mt-1">Open a product and tap “Chat with seller” to start.</div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="divide-y divide-gray-100">
              {conversations.map((c) => (
                <Link
                  key={c._id}
                  href={`/chats/${c._id}`}
                  className="block p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                      {(c.seller?.name || 'S').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <div className="font-semibold text-gray-900 truncate">{c.seller?.name || 'Seller'}</div>
                        <div className="text-xs text-gray-500">
                          {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleString() : ''}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 truncate">
                        {c.product?.name ? `${c.product.name} • ` : ''}
                        {c.lastMessage || 'Say hi…'}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

