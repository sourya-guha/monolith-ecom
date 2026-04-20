'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Edit, Plus, Trash2, Package } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { sellerApi } from '../../lib/api';

export const dynamic = 'force-dynamic';

interface Product {
  _id: string; name: string; description: string; price: number; category: string; stock: number; images: string[];
}

export default function SellerProducts() {
  const { user, isLoading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setError(null);
        const data: any = await sellerApi.getProducts();
        setProducts(Array.isArray(data) ? data : data?.products || []);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch products.');
      } finally {
        setLoading(false);
      }
    };
    if (authLoading) return;
    if (user?.role === 'seller') { fetchProducts(); return; }
    setLoading(false);
  }, [user, authLoading]);

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    setDeletingProduct(productId);
    try {
      await sellerApi.deleteProduct(productId);
      setProducts((curr) => curr.filter((p) => p._id !== productId));
    } catch (err) {
      console.error('Failed to delete product:', err);
      alert('Failed to delete product. Please try again.');
    } finally {
      setDeletingProduct(null);
    }
  };

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>;
  }

  if (!user || user.role !== 'seller') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-[#64748b]">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">My Products</h1>
            <p className="text-sm text-[#64748b] mt-1">Manage your product listings</p>
          </div>
          <Link href="/seller/products/add" className="btn-gradient py-2.5 px-5 text-sm">
            <Plus size={16} /> Add Product
          </Link>
        </motion.div>

        {error ? (
          <div className="glass-card p-5 text-center border-[#f43f5e]/20">
            <div className="text-[#fb7185] font-semibold text-sm">{error}</div>
          </div>
        ) : products.length === 0 ? (
          <div className="glass-card p-12 sm:p-16 text-center">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-white mb-2">No products yet</h3>
            <p className="text-[#64748b] mb-6 text-sm">Start building your catalog.</p>
            <Link href="/seller/products/add" className="btn-gradient py-3 px-8">Add Your First Product</Link>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block glass-card overflow-hidden">
              <div className="px-6 py-3 border-b border-white/[0.06]">
                <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                  <div className="col-span-1">Image</div>
                  <div className="col-span-4">Product</div>
                  <div className="col-span-2">Category</div>
                  <div className="col-span-1">Price</div>
                  <div className="col-span-1">Stock</div>
                  <div className="col-span-3">Actions</div>
                </div>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {products.map((p) => (
                  <div key={p._id} className="px-6 py-4 hover:bg-white/[0.02] transition-colors">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-1">
                        <div className="w-11 h-11 rounded-lg overflow-hidden bg-white/[0.03]">
                          {p.images?.length > 0 ? (
                            <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#64748b] text-xs">📦</div>
                          )}
                        </div>
                      </div>
                      <div className="col-span-4">
                        <h3 className="font-semibold text-white text-sm truncate">{p.name}</h3>
                        <p className="text-[#64748b] text-xs line-clamp-1">{p.description}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] font-bold text-[#c084fc] uppercase tracking-widest">{p.category}</span>
                      </div>
                      <div className="col-span-1">
                        <span className="font-semibold text-white text-sm">${p.price}</span>
                      </div>
                      <div className="col-span-1">
                        <span className={`text-sm font-medium ${p.stock > 10 ? 'text-emerald-400' : p.stock > 0 ? 'text-amber-400' : 'text-[#fb7185]'}`}>
                          {p.stock}
                        </span>
                      </div>
                      <div className="col-span-3 flex gap-2">
                        <Link href={`/seller/products/${p._id}`} className="btn-gradient py-1.5 px-3 text-xs">
                          <Edit size={12} /> Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteProduct(p._id)}
                          disabled={deletingProduct === p._id}
                          className="btn-gradient-secondary py-1.5 px-3 text-xs disabled:opacity-50"
                        >
                          <Trash2 size={12} /> {deletingProduct === p._id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-3">
              {products.map((p, i) => (
                <motion.div key={p._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="glass-card p-4">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-white/[0.03]">
                      {p.images?.length > 0 ? (
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#64748b]">📦</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm truncate">{p.name}</h3>
                      <p className="text-[10px] font-bold text-[#c084fc] uppercase tracking-widest">{p.category}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-white font-bold text-sm">${p.price}</span>
                        <span className={`text-xs ${p.stock > 0 ? 'text-emerald-400' : 'text-[#fb7185]'}`}>
                          {p.stock} in stock
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Link href={`/seller/products/${p._id}`} className="btn-gradient py-1.5 px-4 text-xs flex-1">
                      <Edit size={12} /> Edit
                    </Link>
                    <button onClick={() => handleDeleteProduct(p._id)} disabled={deletingProduct === p._id}
                      className="btn-gradient-secondary py-1.5 px-4 text-xs flex-1 disabled:opacity-50">
                      <Trash2 size={12} /> {deletingProduct === p._id ? '...' : 'Delete'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Stats */}
            <div className="glass-card p-5 mt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold gradient-text">{products.length}</div>
                  <div className="text-xs text-[#64748b]">Products</div>
                </div>
                <div>
                  <div className="text-xl font-bold gradient-text">{products.reduce((s, p) => s + p.stock, 0)}</div>
                  <div className="text-xs text-[#64748b]">Stock</div>
                </div>
                <div>
                  <div className="text-xl font-bold gradient-text">${products.reduce((s, p) => s + p.price * p.stock, 0).toFixed(0)}</div>
                  <div className="text-xs text-[#64748b]">Value</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
