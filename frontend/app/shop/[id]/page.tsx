'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { chatApi, userApi } from '../../lib/api';
import { useCart } from '../../lib/cart';
import { useAuth } from '../../lib/auth-context';
import { Minus, Plus, ArrowLeft, ShoppingBag, MessageCircle, Truck, RotateCcw, Headphones } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const { addItem } = useCart();
  const { user } = useAuth();
  const [startingChat, setStartingChat] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    }
  }, [user, router]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data: any = await userApi.getProduct(params.id as string) || null;
        setProduct(data);
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setLoading(false);
      }
    };
    if (user && params.id) {
      fetchProduct();
    }
  }, [params.id, user]);

  if (!user) return null;

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      id: product._id,
      name: product.name,
      price: product.price,
      image: product.images?.[0],
    }, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleChatWithSeller = async () => {
    if (!product || !user || user.role !== 'user') return;
    setStartingChat(true);
    try {
      const conversation: any = await chatApi.startForProduct(product._id);
      const id = conversation?._id || conversation?.id;
      if (id) router.push(`/chats/${id}`);
    } finally {
      setStartingChat(false);
    }
  };

  const updateQuantity = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 1)) {
      setQuantity(newQuantity);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-white mb-2">Product Not Found</h2>
          <p className="text-[#64748b] mb-6">The product you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/shop" className="btn-gradient py-3 px-6">Back to Shop</Link>
        </div>
      </div>
    );
  }

  const infoItems = [
    { icon: <Truck size={16} />, label: 'Free shipping', value: 'On orders over $50' },
    { icon: <RotateCcw size={16} />, label: 'Return policy', value: '30 days' },
    { icon: <Headphones size={16} />, label: 'Support', value: '24/7 available' },
  ];

  return (
    <div className="min-h-screen py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#94a3b8] hover:text-white mb-6 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} />
          Back
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-3"
          >
            <div className="aspect-square glass-card overflow-hidden img-zoom">
              {product?.images?.length > 0 ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#64748b] text-6xl bg-white/[0.02]">
                  📦
                </div>
              )}
            </div>

            {product?.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product?.images?.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? 'border-[#7c3aed] shadow-lg shadow-purple-500/20'
                        : 'border-white/[0.06] hover:border-white/[0.15]'
                    }`}
                  >
                    <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="space-y-6"
          >
            <div>
              <span className="inline-block text-[10px] font-bold text-[#c084fc] uppercase tracking-widest mb-2">
                {product.category}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">{product.name}</h1>
              <div className="text-3xl sm:text-4xl font-extrabold gradient-text">${product.price}</div>
            </div>

            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-white mb-2">Description</h3>
              <p className="text-sm text-[#94a3b8] leading-relaxed">{product.description}</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-[#94a3b8]">Availability:</span>
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                product?.stock > 0
                  ? 'badge-delivered'
                  : 'badge-cancelled'
              }`}>
                {product?.stock > 0 ? `${product?.stock} in stock` : 'Out of stock'}
              </span>
            </div>

            {/* Buyer-only Controls */}
            {user?.role === 'seller' ? (
              <div className="glass-card p-5 text-center border-amber-500/20">
                <p className="text-amber-300 text-sm font-medium">
                  Sellers cannot purchase products. Log in as a customer to shop.
                </p>
              </div>
            ) : (
              <>
                {/* Quantity Selector */}
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-[#94a3b8]">Quantity:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(quantity - 1)}
                      disabled={quantity <= 1}
                      className="w-9 h-9 rounded-lg border border-white/[0.08] bg-white/[0.03] flex items-center justify-center text-[#94a3b8] hover:text-white hover:border-[#7c3aed]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-12 text-center font-semibold text-white">{quantity}</span>
                    <button
                      onClick={() => updateQuantity(quantity + 1)}
                      disabled={quantity >= (product?.stock || 0)}
                      className="w-9 h-9 rounded-lg border border-white/[0.08] bg-white/[0.03] flex items-center justify-center text-[#94a3b8] hover:text-white hover:border-[#7c3aed]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Add to Cart */}
                <button
                  onClick={handleAddToCart}
                  disabled={product?.stock === 0}
                  className={`w-full py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    addedToCart
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20'
                      : product?.stock === 0
                        ? 'bg-white/[0.05] text-[#64748b] cursor-not-allowed border border-white/[0.06]'
                        : 'btn-gradient text-base'
                  }`}
                >
                  <ShoppingBag size={18} />
                  {addedToCart
                    ? '✓ Added to Cart!'
                    : product?.stock === 0
                      ? 'Out of Stock'
                      : `Add ${quantity} to Cart — $${((product?.price || 0) * quantity).toFixed(2)}`
                  }
                </button>

                {user?.role === 'user' && (
                  <button
                    onClick={handleChatWithSeller}
                    disabled={startingChat}
                    className="w-full btn-outline-glass py-3.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <MessageCircle size={16} />
                    {startingChat ? 'Opening chat…' : 'Chat with Seller'}
                  </button>
                )}
              </>
            )}

            {/* Info Items */}
            <div className="glass-card divide-y divide-white/[0.06]">
              {infoItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between py-3 px-5">
                  <span className="flex items-center gap-2 text-xs text-[#94a3b8]">
                    <span className="text-[#7c3aed]">{item.icon}</span>
                    {item.label}
                  </span>
                  <span className="text-xs font-medium text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}