'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { chatApi } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { useSocket } from '../lib/socket-context';
import { MessageCircle, ArrowRight } from 'lucide-react';

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
    if (!user) { router.replace('/login'); return; }
    if (user.role !== 'user') { router.replace('/'); }
  }, [user, router]);

  const load = async () => {
    setLoading(true);
    try {
      const list = (await chatApi.listConversations()) as Conversation[] | unknown;
      setConversations(Array.isArray(list) ? list : []);
    } finally { setLoading(false); }
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
    return () => { socket.off('chat:conversation:update', onUpdate); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  if (!user || user.role !== 'user') return null;

  return (
    <div className="min-h-screen py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c3aed]/20 to-[#4f46e5]/20 border border-[#7c3aed]/20 flex items-center justify-center text-[#c084fc]">
              <MessageCircle size={20} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{title}</h1>
          </div>
          <Link href="/shop" className="text-xs text-[#c084fc] font-semibold hover:underline flex items-center gap-1">
            Browse products <ArrowRight size={12} />
          </Link>
        </motion.div>

        {loading ? (
          <div className="glass-card p-8 text-center"><div className="spinner mx-auto" /></div>
        ) : conversations.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-5xl mb-3">💬</div>
            <div className="text-lg font-semibold text-white">No chats yet</div>
            <div className="text-[#64748b] mt-1 text-sm">Open a product and tap &ldquo;Chat with seller&rdquo; to start.</div>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="divide-y divide-white/[0.06]">
              {conversations.map((c, i) => (
                <motion.div key={c._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                  <Link href={`/chats/${c._id}`} className="block p-5 hover:bg-white/[0.03] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {(c.seller?.name || 'S').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4">
                          <div className="font-semibold text-white text-sm truncate">{c.seller?.name || 'Seller'}</div>
                          <div className="text-[10px] text-[#64748b] flex-shrink-0">
                            {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleString() : ''}
                          </div>
                        </div>
                        <div className="text-xs text-[#94a3b8] truncate mt-0.5">
                          {c.product?.name ? `${c.product.name} • ` : ''}
                          {c.lastMessage || 'Say hi…'}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
