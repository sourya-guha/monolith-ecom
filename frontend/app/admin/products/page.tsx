'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../lib/auth-context';
import { adminApi } from '../../lib/api';
import { Trash2, Eye } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Product { _id: string; name: string; description: string; price: number; category: string; stock: number; images: string[]; seller?: { name: string; email: string }; }

export default function AdminProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null);

  useEffect(() => { if (user && user.role === 'admin') fetchProducts(); }, [user]);

  const fetchProducts = async () => {
    try { const data = (await adminApi.getProducts()) as unknown; setProducts(Array.isArray(data) ? data : []); }
    catch (error) { console.error('Failed to fetch products:', error); }
    finally { setLoading(false); }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    setDeletingProduct(productId);
    try { await adminApi.deleteProduct(productId); setProducts((products || []).filter(p => p._id !== productId)); }
    catch (error) { console.error('Failed to delete product:', error); alert('Failed to delete product.'); }
    finally { setDeletingProduct(null); }
  };

  if (!user || user.role !== 'admin') return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><div className="text-6xl mb-4">🚫</div><h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2><p className="text-[#64748b]">You don&apos;t have permission to access this page.</p></div></div>;
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>;

  return (
    <div className="min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div><h1 className="text-2xl sm:text-3xl font-bold text-white">Product Management</h1><p className="text-sm text-[#64748b] mt-1">Review and moderate all products</p></div>
          <div className="text-right"><div className="text-2xl font-bold gradient-text">{(products || []).length}</div><div className="text-xs text-[#64748b]">Total Products</div></div>
        </motion.div>

        {(products || []).length === 0 ? (
          <div className="glass-card p-12 text-center"><div className="text-5xl mb-4">📦</div><h3 className="text-xl font-bold text-white mb-2">No products found</h3><p className="text-[#64748b] text-sm">Products will appear here once sellers add them.</p></div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block glass-card overflow-hidden">
              <div className="px-6 py-3 border-b border-white/[0.06]">
                <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                  <div className="col-span-1">Image</div><div className="col-span-3">Product</div><div className="col-span-2">Seller</div><div className="col-span-1">Price</div><div className="col-span-1">Stock</div><div className="col-span-2">Category</div><div className="col-span-2">Actions</div>
                </div>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {(products || []).map((p) => (
                  <div key={p._id} className="px-6 py-4 hover:bg-white/[0.02] transition-colors">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-1"><div className="w-11 h-11 rounded-lg overflow-hidden bg-white/[0.03]">{p?.images?.length > 0 ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#64748b] text-xs">📦</div>}</div></div>
                      <div className="col-span-3"><h3 className="font-semibold text-white text-sm truncate">{p?.name}</h3><p className="text-[#64748b] text-xs line-clamp-1">{p?.description}</p></div>
                      <div className="col-span-2">{p?.seller ? <div><p className="text-white text-xs font-medium">{p.seller.name}</p><p className="text-[#64748b] text-[10px]">{p.seller.email}</p></div> : <span className="text-[#64748b] text-xs">Unknown</span>}</div>
                      <div className="col-span-1"><span className="font-semibold text-white text-sm">${p?.price}</span></div>
                      <div className="col-span-1"><span className={`text-sm font-medium ${p?.stock > 10 ? 'text-emerald-400' : p?.stock > 0 ? 'text-amber-400' : 'text-[#fb7185]'}`}>{p?.stock}</span></div>
                      <div className="col-span-2"><span className="text-[10px] font-bold text-[#c084fc] uppercase tracking-widest">{p?.category}</span></div>
                      <div className="col-span-2 flex gap-2">
                        <a href={`/shop/${p._id}`} target="_blank" rel="noopener noreferrer" className="btn-gradient py-1.5 px-3 text-xs"><Eye size={12} /> View</a>
                        <button onClick={() => handleDeleteProduct(p._id)} disabled={deletingProduct === p._id} className="btn-gradient-secondary py-1.5 px-3 text-xs disabled:opacity-50"><Trash2 size={12} /> {deletingProduct === p._id ? '...' : 'Delete'}</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-3">
              {(products || []).map((p, i) => (
                <motion.div key={p._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass-card p-4">
                  <div className="flex gap-3 mb-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-white/[0.03]">{p.images?.length > 0 ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#64748b]">📦</div>}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm truncate">{p.name}</h3>
                      <p className="text-[10px] font-bold text-[#c084fc] uppercase tracking-widest">{p.category}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-white font-bold text-sm">${p.price}</span>
                        <span className={`text-xs ${p.stock > 0 ? 'text-emerald-400' : 'text-[#fb7185]'}`}>{p.stock} stock</span>
                      </div>
                      {p.seller && <p className="text-[10px] text-[#64748b] mt-0.5">by {p.seller.name}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a href={`/shop/${p._id}`} target="_blank" rel="noopener noreferrer" className="btn-gradient py-1.5 px-4 text-xs flex-1"><Eye size={12} /> View</a>
                    <button onClick={() => handleDeleteProduct(p._id)} disabled={deletingProduct === p._id} className="btn-gradient-secondary py-1.5 px-4 text-xs flex-1 disabled:opacity-50"><Trash2 size={12} /> {deletingProduct === p._id ? '...' : 'Delete'}</button>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="glass-card p-5 mt-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                {[
                  { label: 'Products', value: products.length },
                  { label: 'In Stock', value: products.filter(p => p.stock > 0).length },
                  { label: 'Out of Stock', value: products.filter(p => p.stock === 0).length },
                  { label: 'Value', value: `$${products.reduce((s, p) => s + (p.price * p.stock), 0).toFixed(0)}` },
                ].map(s => (
                  <div key={s.label}><div className="text-xl font-bold gradient-text">{s.value}</div><div className="text-xs text-[#64748b]">{s.label}</div></div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
