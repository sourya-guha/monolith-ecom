'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import { sellerApi } from '../../lib/api';
import { Edit, Trash2, Plus } from 'lucide-react';

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

export default function SellerProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role === 'seller') {
      fetchProducts();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      const data = await sellerApi.getProducts() || [];
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    setDeletingProduct(productId);
    try {
      await sellerApi.deleteProduct(productId);
      setProducts((products || []).filter(product => product._id !== productId));
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product. Please try again.');
    } finally {
      setDeletingProduct(null);
    }
  };

  if (!user || user.role !== 'seller') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">My Products</h1>
            <p className="text-gray-600 mt-1">Manage your product listings</p>
          </div>
          <Link
            href="/seller/products/add"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Add Product
          </Link>
        </div>

        {(products || []).length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No products yet</h3>
            <p className="text-gray-600 mb-6">Start building your catalog by adding your first product.</p>
            <Link
              href="/seller/products/add"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Add Your First Product
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-600">
                <div className="col-span-1">Image</div>
                <div className="col-span-4">Product</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-1">Price</div>
                <div className="col-span-1">Stock</div>
                <div className="col-span-3">Actions</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {(products || []).map((product) => (
                <div key={product._id} className="px-6 py-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Image */}
                    <div className="col-span-1">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        {product?.images?.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="text-gray-400 text-sm">📦</div>
                        )}
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="col-span-4">
                      <h3 className="font-semibold text-gray-800 mb-1">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {product.description}
                      </p>
                    </div>

                    {/* Category */}
                    <div className="col-span-2">
                      <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                        {product.category}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="col-span-1">
                      <span className="font-semibold text-gray-800">
                        ${product.price}
                      </span>
                    </div>

                    {/* Stock */}
                    <div className="col-span-1">
                      <span className={`font-medium ${
                        product?.stock > 10 ? 'text-green-600' :
                        product?.stock > 0 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {product?.stock}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-3 flex gap-2">
                      <Link
                        href={`/seller/products/${product._id}`}
                        className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                      >
                        <Edit size={14} />
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteProduct(product._id)}
                        disabled={deletingProduct === product._id}
                        className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                      >
                        <Trash2 size={14} />
                        {deletingProduct === product._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Footer */}
        {products.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {products.length}
                </div>
                <div className="text-gray-600">Total Products</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {products.reduce((sum, product) => sum + product.stock, 0)}
                </div>
                <div className="text-gray-600">Total Stock</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  ${products.reduce((sum, product) => sum + (product.price * product.stock), 0).toFixed(2)}
                </div>
                <div className="text-gray-600">Inventory Value</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}